const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Primary paths: repository root test.json & tests.json
const ROOT_TEST_JSON = path.resolve(__dirname, '../../../test.json');
const ROOT_TESTS_JSON = path.resolve(__dirname, '../../../tests.json');
// Secondary/backup paths: server/test.json & server/tests.json
const SERVER_TEST_JSON = path.resolve(__dirname, '../../test.json');
const SERVER_TESTS_JSON = path.resolve(__dirname, '../../tests.json');

function generateId(prefix = '') {
  const rand = crypto.randomBytes(6).toString('hex');
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}

function getTestJsonPath() {
  if (fs.existsSync(ROOT_TEST_JSON)) {
    return ROOT_TEST_JSON;
  }
  if (fs.existsSync(ROOT_TESTS_JSON)) {
    return ROOT_TESTS_JSON;
  }
  if (fs.existsSync(SERVER_TEST_JSON)) {
    return SERVER_TEST_JSON;
  }
  if (fs.existsSync(SERVER_TESTS_JSON)) {
    return SERVER_TESTS_JSON;
  }
  return ROOT_TEST_JSON;
}

function readTests() {
  const filePath = getTestJsonPath();
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error('Error reading test(s).json:', err.message);
    return [];
  }
}

function writeTests(tests) {
  const content = JSON.stringify(tests, null, 2);
  const targets = [
    ROOT_TEST_JSON,
    ROOT_TESTS_JSON,
    SERVER_TEST_JSON,
    SERVER_TESTS_JSON,
  ];

  for (const target of targets) {
    try {
      const dir = path.dirname(target);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(target, content, 'utf8');
      }
    } catch (_) {}
  }
}

// Background sync to Prisma if database is connected (optional, never throws)
async function safeSyncToPrisma(test, version) {
  try {
    const prisma = require('../db');
    if (!prisma || !prisma.test) return;

    await prisma.test.upsert({
      where: { id: test.id },
      update: {
        section: test.section,
        testNumber: test.testNumber,
        title: test.title,
        description: test.description || null,
        timeLimitMinutes: test.timeLimitMinutes,
        status: test.status,
      },
      create: {
        id: test.id,
        section: test.section,
        testNumber: test.testNumber,
        title: test.title,
        description: test.description || null,
        timeLimitMinutes: test.timeLimitMinutes,
        status: test.status,
      },
    });

    if (version) {
      await prisma.testVersion.upsert({
        where: { id: version.id },
        update: {
          versionNumber: version.versionNumber,
          originalName: version.originalName,
          storagePath: version.storagePath,
          entryFile: version.entryFile,
          fileType: version.fileType || 'HTML',
          fileSize: version.fileSize || 0,
          isActive: version.isActive !== false,
        },
        create: {
          id: version.id,
          testId: test.id,
          versionNumber: version.versionNumber,
          originalName: version.originalName,
          storagePath: version.storagePath,
          entryFile: version.entryFile,
          fileType: version.fileType || 'HTML',
          fileSize: version.fileSize || 0,
          isActive: version.isActive !== false,
        },
      });
    }
  } catch (_) {
    // Fail silently - user specified test.json instead of any database
  }
}

const testStore = {
  getTestJsonPath,

  async syncAllToPrisma() {
    try {
      const tests = readTests();
      for (const test of tests) {
        const versions = test.versions || [];
        const activeVersion = versions.find(v => v.isActive) || versions[0] || null;
        await safeSyncToPrisma(test, activeVersion);
      }
    } catch (_) {}
  },

  getAllTests(filters = {}) {
    let tests = readTests();

    if (filters.section && filters.section !== 'ALL') {
      const s = filters.section.toUpperCase();
      tests = tests.filter(t => t.section && t.section.toUpperCase() === s);
    }

    if (filters.status && filters.status !== 'ALL') {
      const st = filters.status.toUpperCase();
      tests = tests.filter(t => t.status && t.status.toUpperCase() === st);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      tests = tests.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    tests.sort((a, b) => {
      if (a.section !== b.section) {
        return (a.section || '').localeCompare(b.section || '');
      }
      return (a.testNumber || 0) - (b.testNumber || 0);
    });

    return tests;
  },

  getTestById(id) {
    const tests = readTests();
    return tests.find(t => t.id === id) || null;
  },

  findTestBySectionAndNumber(section, testNumber) {
    const tests = readTests();
    const sec = section.toUpperCase();
    const num = parseInt(testNumber, 10);
    return tests.find(t => t.section && t.section.toUpperCase() === sec && t.testNumber === num) || null;
  },

  findVersionById(versionId) {
    const tests = readTests();
    for (const t of tests) {
      if (Array.isArray(t.versions)) {
        const v = t.versions.find(ver => ver.id === versionId);
        if (v) return { ...v, test: t };
      }
    }
    return null;
  },

  getCounts() {
    const tests = readTests();
    const published = tests.filter(t => 
      t.status === 'PUBLISHED' && 
      Array.isArray(t.versions) && 
      t.versions.some(v => v.isActive)
    );

    const listening = published.filter(t => t.section === 'LISTENING').length;
    const reading = published.filter(t => t.section === 'READING').length;
    const writing = published.filter(t => t.section === 'WRITING').length;

    return {
      listening,
      reading,
      writing,
      total: listening + reading + writing,
    };
  },

  getPublishedTests(section = null) {
    let tests = readTests().filter(t => 
      t.status === 'PUBLISHED' && 
      Array.isArray(t.versions) && 
      t.versions.some(v => v.isActive)
    );

    if (section) {
      const s = section.toUpperCase();
      tests = tests.filter(t => t.section && t.section.toUpperCase() === s);
    }

    tests.sort((a, b) => (a.testNumber || 0) - (b.testNumber || 0));
    return tests;
  },

  createTest(testData, uploadResult) {
    const tests = readTests();
    const testId = generateId('test_');
    const versionId = generateId('ver_');
    const now = new Date().toISOString();

    const version = {
      id: versionId,
      testId,
      versionNumber: 1,
      originalName: uploadResult.originalName,
      storagePath: uploadResult.storagePath,
      entryFile: uploadResult.entryFile,
      fileType: uploadResult.fileType || 'HTML',
      fileSize: uploadResult.fileSize || 0,
      uploadedAt: now,
      isActive: true,
      files: (uploadResult.filesList || []).map((f, i) => ({
        id: `${versionId}_f${i}`,
        testVersionId: versionId,
        relativePath: f.relativePath,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
      })),
    };

    const newTest = {
      id: testId,
      section: testData.section.toUpperCase(),
      testNumber: parseInt(testData.testNumber, 10),
      title: testData.title,
      description: testData.description || null,
      timeLimitMinutes: parseInt(testData.timeLimitMinutes, 10) || (testData.section.toUpperCase() === 'LISTENING' ? 32 : 60),
      status: (testData.status || 'DRAFT').toUpperCase(),
      createdAt: now,
      updatedAt: now,
      versions: [version],
    };

    tests.push(newTest);
    writeTests(tests);

    // Optional background sync
    safeSyncToPrisma(newTest, version);

    return { test: newTest, version };
  },

  addTestVersion(testId, uploadResult) {
    const tests = readTests();
    const testIndex = tests.findIndex(t => t.id === testId);
    if (testIndex === -1) {
      throw new Error('Test not found');
    }

    const test = tests[testIndex];
    if (!Array.isArray(test.versions)) {
      test.versions = [];
    }

    // Deactivate previous versions
    test.versions.forEach(v => { v.isActive = false; });

    const nextVersionNumber = test.versions.length > 0 
      ? Math.max(...test.versions.map(v => v.versionNumber || 0)) + 1 
      : 1;

    const versionId = generateId('ver_');
    const now = new Date().toISOString();

    const newVersion = {
      id: versionId,
      testId: test.id,
      versionNumber: nextVersionNumber,
      originalName: uploadResult.originalName,
      storagePath: uploadResult.storagePath,
      entryFile: uploadResult.entryFile,
      fileType: uploadResult.fileType || 'HTML',
      fileSize: uploadResult.fileSize || 0,
      uploadedAt: now,
      isActive: true,
      files: (uploadResult.filesList || []).map((f, i) => ({
        id: `${versionId}_f${i}`,
        testVersionId: versionId,
        relativePath: f.relativePath,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
      })),
    };

    test.versions.unshift(newVersion);
    test.updatedAt = now;

    tests[testIndex] = test;
    writeTests(tests);

    safeSyncToPrisma(test, newVersion);

    return newVersion;
  },

  updateTest(testId, updateData) {
    const tests = readTests();
    const testIndex = tests.findIndex(t => t.id === testId);
    if (testIndex === -1) {
      throw new Error('Test not found');
    }

    const test = tests[testIndex];
    if (updateData.title !== undefined) test.title = updateData.title;
    if (updateData.description !== undefined) test.description = updateData.description;
    if (updateData.timeLimitMinutes !== undefined) test.timeLimitMinutes = parseInt(updateData.timeLimitMinutes, 10);
    if (updateData.status !== undefined) test.status = updateData.status.toUpperCase();
    if (updateData.testNumber !== undefined) test.testNumber = parseInt(updateData.testNumber, 10);
    test.updatedAt = new Date().toISOString();

    tests[testIndex] = test;
    writeTests(tests);

    const activeVersion = (test.versions || []).find(v => v.isActive) || null;
    safeSyncToPrisma(test, activeVersion);

    return test;
  },

  deleteOrArchiveTest(testId, hasAttempts = false) {
    const tests = readTests();
    const testIndex = tests.findIndex(t => t.id === testId);
    if (testIndex === -1) {
      throw new Error('Test not found');
    }

    if (hasAttempts) {
      tests[testIndex].status = 'ARCHIVED';
      tests[testIndex].updatedAt = new Date().toISOString();
      writeTests(tests);
      return { archived: true, test: tests[testIndex] };
    } else {
      const [removed] = tests.splice(testIndex, 1);
      writeTests(tests);
      return { deleted: true, test: removed };
    }
  },
};

module.exports = testStore;
