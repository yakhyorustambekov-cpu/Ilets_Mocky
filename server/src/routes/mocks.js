const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { selectTestForSection } = require('../utils/randomizer');

const router = express.Router();

// GET /api/mocks/current - Check if student has an active full mock attempt
router.get('/current', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const currentMock = await prisma.fullMockAttempt.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        listeningTest: true,
        listeningVersion: true,
        readingTest: true,
        readingVersion: true,
        writingTest: true,
        writingVersion: true,
        testAttempts: {
          include: {
            test: true,
            testVersion: true,
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    res.json({ activeMock: currentMock || null });
  } catch (error) {
    next(error);
  }
});

// POST /api/mocks/start - Start or resume a Full Mock exam
router.post('/start', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if an in-progress full mock already exists for this student
    // REQUIREMENT 7: If the student refreshes, closes the browser or resumes later,
    // they MUST receive the same tests. Never generate a new combination for an existing attempt.
    const existingMock = await prisma.fullMockAttempt.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        listeningTest: true,
        listeningVersion: true,
        readingTest: true,
        readingVersion: true,
        writingTest: true,
        writingVersion: true,
        testAttempts: {
          where: { status: 'IN_PROGRESS' },
          take: 1,
        },
      },
    });

    if (existingMock) {
      // Find current section's test and version
      let currentTest = existingMock.listeningTest;
      let currentVersion = existingMock.listeningVersion;
      if (existingMock.currentSection === 'READING') {
        currentTest = existingMock.readingTest;
        currentVersion = existingMock.readingVersion;
      } else if (existingMock.currentSection === 'WRITING') {
        currentTest = existingMock.writingTest;
        currentVersion = existingMock.writingVersion;
      }

      // Check if attempt for this section already exists or needs to be created
      let sectionAttempt = await prisma.testAttempt.findFirst({
        where: {
          fullMockAttemptId: existingMock.id,
          section: existingMock.currentSection,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (!sectionAttempt) {
        sectionAttempt = await prisma.testAttempt.create({
          data: {
            userId,
            testId: currentTest.id,
            testVersionId: currentVersion.id,
            section: existingMock.currentSection,
            fullMockAttemptId: existingMock.id,
            status: 'IN_PROGRESS',
          },
        });
      }

      return res.json({
        resumed: true,
        mock: existingMock,
        currentSection: existingMock.currentSection,
        currentAttempt: sectionAttempt,
        contentUrl: `/test-content/${currentVersion.id}/${currentVersion.entryFile}`,
      });
    }

    // REQUIREMENT 5 & 6 & 13: Atomic transaction to randomly choose:
    // 1 Listening test + 1 Reading test + 1 Writing test
    // with server-side no-repeat randomization and independent cycle resets.
    const newMock = await prisma.$transaction(async (tx) => {
      // 1. Randomly pick 1 Listening test
      const listeningResult = await selectTestForSection(tx, userId, 'LISTENING');
      // 2. Randomly pick 1 Reading test
      const readingResult = await selectTestForSection(tx, userId, 'READING');
      // 3. Randomly pick 1 Writing test
      const writingResult = await selectTestForSection(tx, userId, 'WRITING');

      // 4. Calculate next mock number for this student
      const previousCount = await tx.fullMockAttempt.count({
        where: { userId },
      });
      const mockNumber = previousCount + 1;

      // 5. Create FullMockAttempt
      const fullMock = await tx.fullMockAttempt.create({
        data: {
          userId,
          mockNumber,
          listeningTestId: listeningResult.test.id,
          listeningVersionId: listeningResult.version.id,
          readingTestId: readingResult.test.id,
          readingVersionId: readingResult.version.id,
          writingTestId: writingResult.test.id,
          writingVersionId: writingResult.version.id,
          currentSection: 'LISTENING',
          status: 'IN_PROGRESS',
        },
        include: {
          listeningTest: true,
          listeningVersion: true,
          readingTest: true,
          readingVersion: true,
          writingTest: true,
          writingVersion: true,
        },
      });

      // 6. Update usage records to link to this fullMockAttemptId
      await tx.studentTestUsage.update({
        where: { id: listeningResult.usageId },
        data: { fullMockAttemptId: fullMock.id },
      });
      await tx.studentTestUsage.update({
        where: { id: readingResult.usageId },
        data: { fullMockAttemptId: fullMock.id },
      });
      await tx.studentTestUsage.update({
        where: { id: writingResult.usageId },
        data: { fullMockAttemptId: fullMock.id },
      });

      // 7. Create the first TestAttempt for Section 1: Listening
      const firstAttempt = await tx.testAttempt.create({
        data: {
          userId,
          testId: listeningResult.test.id,
          testVersionId: listeningResult.version.id,
          section: 'LISTENING',
          fullMockAttemptId: fullMock.id,
          status: 'IN_PROGRESS',
        },
        include: {
          test: true,
          testVersion: true,
        },
      });

      return {
        fullMock,
        firstAttempt,
        listeningVersion: listeningResult.version,
      };
    });

    res.status(201).json({
      resumed: false,
      mock: newMock.fullMock,
      currentSection: 'LISTENING',
      currentAttempt: newMock.firstAttempt,
      contentUrl: `/test-content/${newMock.listeningVersion.id}/${newMock.listeningVersion.entryFile}`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/mocks/:id - Get full mock attempt details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const mock = await prisma.fullMockAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            candidateNumber: true,
          },
        },
        listeningTest: true,
        listeningVersion: true,
        readingTest: true,
        readingVersion: true,
        writingTest: true,
        writingVersion: true,
        testAttempts: {
          include: {
            test: true,
            testVersion: true,
            results: true,
          },
          orderBy: { startedAt: 'asc' },
        },
        results: true,
      },
    });

    if (!mock) {
      return res.status(404).json({ error: 'Full mock attempt not found' });
    }

    if (mock.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(mock);
  } catch (error) {
    next(error);
  }
});

// POST /api/mocks/:id/next-section - Complete current section & advance to next or complete mock
router.post('/:id/next-section', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rawScore, maxScore, bandScore, resultData, timeSpentSeconds } = req.body;
    const userId = req.user.id;

    const mock = await prisma.fullMockAttempt.findUnique({
      where: { id },
      include: {
        listeningTest: true,
        listeningVersion: true,
        readingTest: true,
        readingVersion: true,
        writingTest: true,
        writingVersion: true,
      },
    });

    if (!mock) {
      return res.status(404).json({ error: 'Full mock attempt not found' });
    }

    if (mock.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (mock.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'This mock attempt is already completed or abandoned' });
    }

    const now = new Date();
    const parsedRaw = rawScore !== undefined && rawScore !== null ? parseFloat(rawScore) : null;
    const parsedMax = maxScore !== undefined && maxScore !== null ? parseFloat(maxScore) : null;
    const parsedBand = bandScore !== undefined && bandScore !== null ? parseFloat(bandScore) : null;
    const resultString = typeof resultData === 'object' ? JSON.stringify(resultData) : (resultData || null);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find and complete the current section's attempt
      const currentAttempt = await tx.testAttempt.findFirst({
        where: {
          fullMockAttemptId: mock.id,
          section: mock.currentSection,
          status: 'IN_PROGRESS',
        },
        orderBy: { startedAt: 'desc' },
      });

      if (currentAttempt) {
        await tx.testAttempt.update({
          where: { id: currentAttempt.id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            rawScore: parsedRaw,
            maxScore: parsedMax,
            bandScore: parsedBand,
            resultData: resultString,
            timeSpentSeconds: timeSpentSeconds ? parseInt(timeSpentSeconds, 10) : undefined,
          },
        });

        if (parsedBand !== null || parsedRaw !== null) {
          await tx.result.create({
            data: {
              testAttemptId: currentAttempt.id,
              fullMockAttemptId: mock.id,
              section: mock.currentSection,
              rawScore: parsedRaw,
              maxScore: parsedMax,
              bandScore: parsedBand,
              detailsJson: resultString,
            },
          });
        }
      }

      // 2. Determine next section: LISTENING -> READING -> WRITING -> COMPLETED
      let nextSection = 'COMPLETED';
      let nextTest = null;
      let nextVersion = null;
      let isMockCompleted = false;

      if (mock.currentSection === 'LISTENING') {
        nextSection = 'READING';
        nextTest = mock.readingTest;
        nextVersion = mock.readingVersion;
      } else if (mock.currentSection === 'READING') {
        nextSection = 'WRITING';
        nextTest = mock.writingTest;
        nextVersion = mock.writingVersion;
      } else if (mock.currentSection === 'WRITING') {
        nextSection = 'COMPLETED';
        isMockCompleted = true;
      }

      let newAttempt = null;
      if (!isMockCompleted && nextTest && nextVersion) {
        newAttempt = await tx.testAttempt.create({
          data: {
            userId,
            testId: nextTest.id,
            testVersionId: nextVersion.id,
            section: nextSection,
            fullMockAttemptId: mock.id,
            status: 'IN_PROGRESS',
            startedAt: now,
          },
          include: {
            test: true,
            testVersion: true,
          },
        });
      }

      // 3. Update FullMockAttempt
      const updatedMock = await tx.fullMockAttempt.update({
        where: { id: mock.id },
        data: {
          currentSection: nextSection,
          status: isMockCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: isMockCompleted ? now : null,
        },
        include: {
          listeningTest: true,
          listeningVersion: true,
          readingTest: true,
          readingVersion: true,
          writingTest: true,
          writingVersion: true,
          testAttempts: {
            include: {
              test: true,
              testVersion: true,
              results: true,
            },
            orderBy: { startedAt: 'asc' },
          },
        },
      });

      return {
        mock: updatedMock,
        isCompleted: isMockCompleted,
        nextSection,
        nextAttempt: newAttempt,
        contentUrl: nextVersion ? `/test-content/${nextVersion.id}/${nextVersion.entryFile}` : null,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/mocks/:id/abandon - Abandon in-progress full mock
router.post('/:id/abandon', authenticate, async (req, res, next) => {
  try {
    const mock = await prisma.fullMockAttempt.findUnique({
      where: { id: req.params.id },
    });

    if (!mock) {
      return res.status(404).json({ error: 'Full mock attempt not found' });
    }

    if (mock.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Abandon all in-progress sub attempts
      await tx.testAttempt.updateMany({
        where: {
          fullMockAttemptId: mock.id,
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'ABANDONED',
          completedAt: new Date(),
        },
      });

      return tx.fullMockAttempt.update({
        where: { id: mock.id },
        data: {
          status: 'ABANDONED',
          completedAt: new Date(),
        },
      });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/mocks/my/history - Get student's full mock history
router.get('/my/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const mocks = await prisma.fullMockAttempt.findMany({
      where: { userId },
      orderBy: { mockNumber: 'desc' },
      include: {
        listeningTest: {
          select: { id: true, title: true, testNumber: true },
        },
        listeningVersion: {
          select: { id: true, versionNumber: true },
        },
        readingTest: {
          select: { id: true, title: true, testNumber: true },
        },
        readingVersion: {
          select: { id: true, versionNumber: true },
        },
        writingTest: {
          select: { id: true, title: true, testNumber: true },
        },
        writingVersion: {
          select: { id: true, versionNumber: true },
        },
        testAttempts: {
          select: {
            id: true,
            section: true,
            status: true,
            rawScore: true,
            bandScore: true,
            timeSpentSeconds: true,
            startedAt: true,
            completedAt: true,
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    res.json(mocks);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
