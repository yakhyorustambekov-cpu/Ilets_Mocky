const fs = require('fs');
const path = require('path');
const prisma = require('../server/src/db');
const { processTestUpload } = require('../server/src/utils/fileStorage');

async function seedSampleTests() {
  console.log('Seeding 6 sample tests...');

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
    // Check if test exists
    let test = await prisma.test.findUnique({
      where: {
        section_testNumber: {
          section: t.section,
          testNumber: t.testNumber,
        },
      },
    });

    if (!test) {
      test = await prisma.test.create({
        data: {
          section: t.section,
          testNumber: t.testNumber,
          title: t.title,
          description: t.description,
          timeLimitMinutes: t.timeLimitMinutes,
          status: 'PUBLISHED',
        },
      });
      console.log(`Created test: [${t.section} ${t.testNumber}] ${t.title}`);
    } else {
      // Ensure it's published
      await prisma.test.update({
        where: { id: test.id },
        data: { status: 'PUBLISHED' },
      });
    }

    // Check if version 1 exists
    const existingVersion = await prisma.testVersion.findUnique({
      where: {
        testId_versionNumber: {
          testId: test.id,
          versionNumber: 1,
        },
      },
    });

    if (!existingVersion) {
      const srcFile = path.join(__dirname, t.fileName);
      const tempCopy = path.join(__dirname, `temp_${t.fileName}`);
      fs.copyFileSync(srcFile, tempCopy);

      const mockMulterFile = {
        originalname: t.fileName,
        path: tempCopy,
        size: fs.statSync(srcFile).size,
      };

      const uploadResult = await processTestUpload(mockMulterFile, test.id, 1);

      await prisma.testVersion.create({
        data: {
          testId: test.id,
          versionNumber: 1,
          originalName: uploadResult.originalName,
          storagePath: uploadResult.storagePath,
          entryFile: uploadResult.entryFile,
          fileType: uploadResult.fileType,
          fileSize: uploadResult.fileSize,
          isActive: true,
          files: {
            create: uploadResult.filesList.map(f => ({
              relativePath: f.relativePath,
              mimeType: f.mimeType,
              fileSize: f.fileSize,
            })),
          },
        },
      });
      console.log(`Installed version 1 for test [${t.section} ${t.testNumber}]`);
    }
  }

  console.log('Sample tests seeding completed successfully!');
}

seedSampleTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
