const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const testStore = require('../utils/testStore');

const router = express.Router();

// POST /api/attempts/start - Start a single test attempt
router.post('/start', authenticate, async (req, res, next) => {
  try {
    const { testId } = req.body;
    const userId = req.user.id;

    if (!testId) {
      return res.status(400).json({ error: 'testId is required' });
    }

    let test = testStore.getTestById(testId);
    if (!test) {
      try {
        test = await prisma.test.findUnique({
          where: { id: testId },
          include: {
            versions: {
              where: { isActive: true },
              take: 1,
            },
          },
        });
      } catch (_) {}
    }

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.status !== 'PUBLISHED' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Test is not published' });
    }

    const versions = test.versions || [];
    const activeVersion = versions.find(v => v.isActive) || versions[0];
    if (!activeVersion) {
      return res.status(400).json({ error: 'Test has no active version available' });
    }

    // Create attempt
    let attempt;
    try {
      // Ensure test exists in DB so FK constraint does not fail
      await prisma.test.upsert({
        where: { id: test.id },
        update: {},
        create: {
          id: test.id,
          section: test.section,
          testNumber: test.testNumber,
          title: test.title,
          description: test.description || null,
          timeLimitMinutes: test.timeLimitMinutes || 60,
          status: test.status || 'PUBLISHED',
        },
      });

      await prisma.testVersion.upsert({
        where: { id: activeVersion.id },
        update: {},
        create: {
          id: activeVersion.id,
          testId: test.id,
          versionNumber: activeVersion.versionNumber || 1,
          originalName: activeVersion.originalName || 'test.html',
          storagePath: activeVersion.storagePath,
          entryFile: activeVersion.entryFile,
          fileType: activeVersion.fileType || 'HTML',
          fileSize: activeVersion.fileSize || 0,
          isActive: true,
        },
      });

      attempt = await prisma.testAttempt.create({
        data: {
          userId,
          testId: test.id,
          testVersionId: activeVersion.id,
          section: test.section,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });
    } catch (_) {
      attempt = {
        id: `att_${Date.now()}`,
        userId,
        testId: test.id,
        testVersionId: activeVersion.id,
        section: test.section,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
      };
    }

    res.status(201).json({
      attempt: {
        ...attempt,
        test,
        testVersion: activeVersion,
      },
      contentUrl: `/test-content/${activeVersion.id}/${activeVersion.entryFile}`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/attempts/my - List student's own attempts
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { section, status, limit = 50 } = req.query;

    const where = { userId };
    if (section) where.section = section.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const attempts = await prisma.testAttempt.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit, 10),
      include: {
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
            id: true,
            versionNumber: true,
            originalName: true,
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
    });

    const enrichedAttempts = attempts.map(a => {
      if (!a.test) {
        const storedTest = testStore.getTestById(a.testId);
        if (storedTest) {
          a.test = {
            id: storedTest.id,
            title: storedTest.title,
            testNumber: storedTest.testNumber,
            section: storedTest.section,
          };
        }
      }
      return a;
    });

    res.json(enrichedAttempts);
  } catch (error) {
    next(error);
  }
});

// GET /api/attempts/:id - Get specific attempt details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        test: true,
        testVersion: true,
        fullMockAttempt: true,
        results: true,
      },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!attempt.test) {
      const storedTest = testStore.getTestById(attempt.testId);
      if (storedTest) {
        attempt.test = storedTest;
      }
    }

    res.json({
      attempt,
      contentUrl: `/test-content/${attempt.testVersion.id}/${attempt.testVersion.entryFile}`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attempts/:id/complete - Complete attempt
router.post('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const { rawScore, maxScore, bandScore, resultData, timeSpentSeconds } = req.body;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: req.params.id },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();
    const parsedRaw = rawScore !== undefined && rawScore !== null ? parseFloat(rawScore) : null;
    const parsedMax = maxScore !== undefined && maxScore !== null ? parseFloat(maxScore) : null;
    const parsedBand = bandScore !== undefined && bandScore !== null ? parseFloat(bandScore) : null;
    const resultString = typeof resultData === 'object' ? JSON.stringify(resultData) : resultData || null;

    const updated = await prisma.$transaction(async (tx) => {
      const att = await tx.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          rawScore: parsedRaw,
          maxScore: parsedMax,
          bandScore: parsedBand,
          resultData: resultString,
          timeSpentSeconds: timeSpentSeconds ? parseInt(timeSpentSeconds, 10) : undefined,
        },
        include: {
          test: true,
          testVersion: true,
        },
      });

      if (parsedBand !== null || parsedRaw !== null) {
        await tx.result.create({
          data: {
            testAttemptId: att.id,
            fullMockAttemptId: att.fullMockAttemptId,
            section: att.section,
            rawScore: parsedRaw,
            maxScore: parsedMax,
            bandScore: parsedBand,
            detailsJson: resultString,
          },
        });
      }

      return att;
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/attempts/:id/callback - External callback for test completion
router.post('/:id/callback', async (req, res, next) => {
  try {
    const { rawScore, maxScore, bandScore, resultData, timeSpentSeconds } = req.body;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: req.params.id },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const now = new Date();
    const parsedRaw = rawScore !== undefined ? parseFloat(rawScore) : null;
    const parsedMax = maxScore !== undefined ? parseFloat(maxScore) : null;
    const parsedBand = bandScore !== undefined ? parseFloat(bandScore) : null;
    const resultString = typeof resultData === 'object' ? JSON.stringify(resultData) : (resultData || null);

    const updated = await prisma.testAttempt.update({
      where: { id: attempt.id },
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

    res.json({ success: true, attempt: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/attempts/:id/abandon
router.post('/:id/abandon', authenticate, async (req, res, next) => {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: req.params.id },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'ABANDONED',
        completedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
