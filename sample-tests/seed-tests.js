const fs = require('fs');
const path = require('path');
const prisma = require('../server/src/db');
const { processTestUpload } = require('../server/src/utils/fileStorage');
const testStore = require('../server/src/utils/testStore');

async function seedSampleTests() {
  console.log('Seeding sample tests into test.json...');

  const testsToSeed = [
    {
      section: 'LISTENING',
      testNumber: 1,
      title: 'IELTS Academic Listening Test 1 (Accommodation & Facilities)',
      description: 'Official-style listening practice with 4 sections, audio playback, and diagram completion.',
      timeLimitMinutes: 32,
      fileName: 'listening-1.zip',
    },
    {
      section: 'LISTENING',
      testNumber: 2,
      title: 'IELTS Academic Listening Test 2 (Campus Orientation & Services)',
      description: 'Listening practice featuring campus registration and map labeling.',
      timeLimitMinutes: 32,
      fileName: 'listening-2.zip',
    },
    {
      section: 'READING',
      testNumber: 1,
      title: 'IELTS Academic Reading Test 1 (Ancient Navigation & Swell Analysis)',
      description: 'Full reading paper featuring three academic passages and 40 questions.',
      timeLimitMinutes: 60,
      fileName: 'reading-1.zip',
    },
    {
      section: 'READING',
      testNumber: 2,
      title: 'IELTS Academic Reading Test 2 (Biomimicry in Civil Architecture)',
      description: 'Academic reading with split-pane passage viewer and matching headings.',
      timeLimitMinutes: 60,
      fileName: 'reading-2.html',
    },
    {
      section: 'WRITING',
      testNumber: 1,
      title: 'IELTS Academic Writing Test 1 (Renewable Energy & Digital Classrooms)',
      description: 'Task 1 bar chart analysis and Task 2 discursive essay with live word counters.',
      timeLimitMinutes: 60,
      fileName: 'writing-1.zip',
    },
    {
      section: 'WRITING',
      testNumber: 2,
      title: 'IELTS Academic Writing Test 2 (Paper Recycling & Higher Education)',
      description: 'Task 1 industrial process description and Task 2 policy argument essay.',
      timeLimitMinutes: 60,
      fileName: 'writing-2.html',
    },
  ];

  for (const t of testsToSeed) {
    let existingTest = testStore.findTestBySectionAndNumber(t.section, t.testNumber);

    if (!existingTest) {
      const srcFile = path.join(__dirname, t.fileName);
      const tempCopy = path.join(__dirname, `temp_${t.fileName}`);
      fs.copyFileSync(srcFile, tempCopy);

      const mockMulterFile = {
        originalname: t.fileName,
        path: tempCopy,
        size: fs.statSync(srcFile).size,
      };

      const crypto = require('crypto');
      const testId = `test_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
      const uploadResult = await processTestUpload(mockMulterFile, testId, 1);

      const created = testStore.createTest({
        id: testId,
        section: t.section,
        testNumber: t.testNumber,
        title: t.title,
        description: t.description,
        timeLimitMinutes: t.timeLimitMinutes,
        status: 'PUBLISHED',
      }, uploadResult);

      console.log(`Installed test into test.json: [${t.section} ${t.testNumber}] ${t.title}`);
    } else {
      console.log(`Test already in test.json: [${t.section} ${t.testNumber}] ${existingTest.title}`);
    }
  }

  console.log('Sample tests seeding into test.json completed successfully!');
}

seedSampleTests()
  .catch(console.error)
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (_) {}
  });
