const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const prisma = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { processTestUpload } = require('../utils/fileStorage');
const testStore = require('../utils/testStore');

const router = express.Router();

// Require admin for all routes in this file
router.use(authenticate);
router.use(requireAdmin);

// Multer storage for temporary upload handling
const upload = multer({
  dest: path.resolve(__dirname, '../../uploads/tmp'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for rich media/audio tests
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip' || ext === '.html' || ext === '.htm') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .html and .zip files are allowed.'));
    }
  },
});

// GET /api/admin/dashboard - Overview statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    const allTests = testStore.getAllTests();
    const totalTests = allTests.length;
    const publishedTests = allTests.filter(t => t.status === 'PUBLISHED').length;
    const draftTests = allTests.filter(t => t.status === 'DRAFT').length;
    const archivedTests = allTests.filter(t => t.status === 'ARCHIVED').length;
    const listeningTests = allTests.filter(t => t.section === 'LISTENING' && t.status === 'PUBLISHED').length;
    const readingTests = allTests.filter(t => t.section === 'READING' && t.status === 'PUBLISHED').length;
    const writingTests = allTests.filter(t => t.section === 'WRITING' && t.status === 'PUBLISHED').length;

    let totalStudents = 0;
    let totalAttempts = 0;
    let completedAttempts = 0;
    let totalFullMocks = 0;
    let completedFullMocks = 0;
    let recentAttempts = [];

    try {
      [
        totalStudents,
        totalAttempts,
        completedAttempts,
        totalFullMocks,
        completedFullMocks,
        recentAttempts,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.testAttempt.count(),
        prisma.testAttempt.count({ where: { status: 'COMPLETED' } }),
        prisma.fullMockAttempt.count(),
        prisma.fullMockAttempt.count({ where: { status: 'COMPLETED' } }),
        prisma.testAttempt.findMany({
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                candidateNumber: true,
              },
            },
          },
        }),
      ]);
    } catch (_) {}

    const enrichedRecentAttempts = (recentAttempts || []).map(att => {
      const storedTest = testStore.getTestById(att.testId);
      return {
        ...att,
        test: storedTest ? {
          id: storedTest.id,
          title: storedTest.title,
          testNumber: storedTest.testNumber,
          section: storedTest.section,
        } : (att.test || null),
      };
    });

    res.json({
      stats: {
        totalStudents,
        totalTests,
        publishedTests,
        draftTests,
        archivedTests,
        sectionBreakdown: {
          listening: listeningTests,
          reading: readingTests,
          writing: writingTests,
        },
        attempts: {
          total: totalAttempts,
          completed: completedAttempts,
        },
        fullMocks: {
          total: totalFullMocks,
          completed: completedFullMocks,
        },
      },
      recentAttempts: enrichedRecentAttempts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/tests - List all tests with filtering from test.json
router.get('/tests', async (req, res, next) => {
  try {
    const { section, status, search } = req.query;

    const tests = testStore.getAllTests({ section, status, search });

    let attemptsCountMap = {};
    try {
      const counts = await prisma.testAttempt.groupBy({
        by: ['testId'],
        _count: { id: true },
      });
      counts.forEach(c => {
        attemptsCountMap[c.testId] = c._count.id;
      });
    } catch (_) {}

    const formatted = tests.map(t => {
      const versions = t.versions || [];
      return {
        id: t.id,
        section: t.section,
        testNumber: t.testNumber,
        title: t.title,
        description: t.description,
        timeLimitMinutes: t.timeLimitMinutes,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        activeVersion: versions.find(v => v.isActive) || versions[0] || null,
        allVersions: versions,
        attemptsCount: attemptsCountMap[t.id] || 0,
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/tests - Create a new test with uploaded file, saved directly to test.json
router.post('/tests', upload.single('file'), async (req, res, next) => {
  try {
    const { section, testNumber, title, description, timeLimitMinutes, status } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an HTML or ZIP test file' });
    }

    if (!section || !testNumber || !title) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'section, testNumber, and title are required' });
    }

    const normalizedSection = section.toUpperCase();
    const parsedNumber = parseInt(testNumber, 10);
    const parsedDuration = timeLimitMinutes ? parseInt(timeLimitMinutes, 10) : (normalizedSection === 'LISTENING' ? 32 : 60);
    const testStatus = status ? status.toUpperCase() : 'DRAFT';

    // Check unique [section, testNumber] from test.json
    const existing = testStore.findTestBySectionAndNumber(normalizedSection, parsedNumber);
    if (existing) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({ error: `A test for ${normalizedSection} with number ${parsedNumber} already exists.` });
    }

    // Generate test ID and process upload
    const crypto = require('crypto');
    const testId = `test_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    let uploadResult;
    try {
      uploadResult = await processTestUpload(req.file, testId, 1);
    } catch (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    // Save test and version directly into test.json
    const { test: newTest, version } = testStore.createTest({
      id: testId,
      section: normalizedSection,
      testNumber: parsedNumber,
      title,
      description: description || null,
      timeLimitMinutes: parsedDuration,
      status: testStatus,
    }, uploadResult);

    res.status(201).json({
      test: newTest,
      version,
      previewUrl: `/test-content/${version.id}/${version.entryFile}`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/tests/:id - Get test details from test.json
router.get('/tests/:id', async (req, res, next) => {
  try {
    const test = testStore.getTestById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    let attempts = [];
    try {
      attempts = await prisma.testAttempt.findMany({
        where: { testId: req.params.id },
        orderBy: { startedAt: 'desc' },
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              candidateNumber: true,
            },
          },
        },
      });
    } catch (_) {}

    res.json({
      ...test,
      attempts,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/tests/:id - Update test metadata and status in test.json
router.put('/tests/:id', async (req, res, next) => {
  try {
    const { title, description, timeLimitMinutes, status, testNumber } = req.body;
    const existing = testStore.getTestById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const updated = testStore.updateTest(req.params.id, {
      title,
      description,
      timeLimitMinutes,
      status,
      testNumber,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/tests/:id/version - Replace test / upload new version into test.json
router.post('/tests/:id/version', upload.single('file'), async (req, res, next) => {
  try {
    const testId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an HTML or ZIP test file' });
    }

    const test = testStore.getTestById(testId);
    if (!test) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Test not found' });
    }

    const versions = test.versions || [];
    const nextVersionNumber = versions.length > 0 
      ? Math.max(...versions.map(v => v.versionNumber || 0)) + 1 
      : 1;

    // Process file into version directory
    const uploadResult = await processTestUpload(req.file, test.id, nextVersionNumber);

    // Save new version to test.json
    const newVersion = testStore.addTestVersion(testId, uploadResult);

    res.status(201).json({
      message: `Version ${nextVersionNumber} successfully uploaded and set active`,
      version: newVersion,
      previewUrl: `/test-content/${newVersion.id}/${newVersion.entryFile}`,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/tests/:id - Archive or delete test from test.json
router.delete('/tests/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = testStore.getTestById(id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check if test has attempts
    let attemptsCount = 0;
    try {
      attemptsCount = await prisma.testAttempt.count({
        where: { testId: id },
      });
    } catch (_) {}

    if (attemptsCount > 0) {
      const result = testStore.deleteOrArchiveTest(id, true);
      return res.json({
        message: 'Test has historical attempts. It has been ARCHIVED to preserve history.',
        test: result.test,
      });
    }

    // If no attempts, clean up files and delete from test.json
    const testBaseDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'tests', id);
    if (fs.existsSync(testBaseDir)) {
      fs.rmSync(testBaseDir, { recursive: true, force: true });
    }

    const result = testStore.deleteOrArchiveTest(id, false);
    res.json({ message: 'Test completely deleted', test: result.test });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/students - List registered students
router.get('/students', async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
        _count: {
          select: {
            testAttempts: true,
            fullMockAttempts: true,
          },
        },
        testAttempts: {
          select: {
            startedAt: true,
            bandScore: true,
          },
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });

    const formatted = students.map(s => {
      const lastActive = s.testAttempts[0]?.startedAt || s.createdAt;
      const scores = s.testAttempts.filter(a => a.bandScore !== null).map(a => a.bandScore);
      const avgBand = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

      return {
        id: s.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        candidateNumber: s.candidateNumber,
        targetBand: s.profile?.targetBand || null,
        examDate: s.profile?.examDate || null,
        totalAttempts: s._count.testAttempts,
        totalFullMocks: s._count.fullMockAttempts,
        avgBand,
        lastActive,
        createdAt: s.createdAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/students/:id - Detailed student view
router.get('/students/:id', async (req, res, next) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        randomizationCycles: true,
        testUsages: {
          include: { test: true },
          orderBy: { usedAt: 'desc' },
        },
        testAttempts: {
          include: {
            test: true,
            testVersion: true,
          },
          orderBy: { startedAt: 'desc' },
        },
        fullMockAttempts: {
          include: {
            listeningTest: true,
            readingTest: true,
            writingTest: true,
            testAttempts: true,
          },
          orderBy: { mockNumber: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { password, ...safeStudent } = student;
    res.json(safeStudent);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/attempts - List all attempts
router.get('/attempts', async (req, res, next) => {
  try {
    const { section, status, studentId, limit = 50, page = 1 } = req.query;

    const where = {};
    if (section) where.section = section.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (studentId) where.userId = studentId;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [total, attempts] = await Promise.all([
      prisma.testAttempt.count({ where }),
      prisma.testAttempt.findMany({
        where,
        take,
        skip,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              candidateNumber: true,
            },
          },
          test: {
            select: {
              id: true,
              title: true,
              testNumber: true,
              section: true,
            },
          },
          testVersion: {
            select: {
              versionNumber: true,
            },
          },
          fullMockAttempt: {
            select: {
              id: true,
              mockNumber: true,
            },
          },
          results: true,
        },
      }),
    ]);

    res.json({
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      attempts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/results - List all results
router.get('/results', async (req, res, next) => {
  try {
    const results = await prisma.result.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        testAttempt: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                candidateNumber: true,
              },
            },
            test: true,
          },
        },
        fullMockAttempt: true,
      },
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/settings
router.put('/settings', async (req, res, next) => {
  try {
    const updates = req.body; // e.g. { platformName: '...', listeningDurationMinutes: '35' }

    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    const all = await prisma.setting.findMany();
    const settingsMap = {};
    all.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.json(settingsMap);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/admins - List all administrators
router.get('/admins', async (req, res, next) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        candidateNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(admins);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/admins - Create a new administrator
router.post('/admins', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields (First Name, Last Name, Email, Password) are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists' });
    }

    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const candidateNumber = `CDI-ADM${String(adminCount + 1).padStart(3, '0')}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        candidateNumber,
        role: 'ADMIN',
        profile: {
          create: {
            bio: 'Platform Examiner / Administrator',
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        candidateNumber: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'New administrator created successfully',
      admin: newAdmin,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
