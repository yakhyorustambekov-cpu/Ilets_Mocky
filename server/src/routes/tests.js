const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/tests/counts - Overview of available published tests
router.get('/counts', async (req, res, next) => {
  try {
    const listening = await prisma.test.count({
      where: {
        section: 'LISTENING',
        status: 'PUBLISHED',
        versions: { some: { isActive: true } },
      },
    });

    const reading = await prisma.test.count({
      where: {
        section: 'READING',
        status: 'PUBLISHED',
        versions: { some: { isActive: true } },
      },
    });

    const writing = await prisma.test.count({
      where: {
        section: 'WRITING',
        status: 'PUBLISHED',
        versions: { some: { isActive: true } },
      },
    });

    res.json({
      listening,
      reading,
      writing,
      total: listening + reading + writing,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tests - List published tests (optionally filtered by section)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { section } = req.query;
    const userId = req.user.id;

    const where = {
      status: 'PUBLISHED',
      versions: { some: { isActive: true } },
    };

    if (section) {
      where.section = section.toUpperCase();
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: { testNumber: 'asc' },
      include: {
        versions: {
          where: { isActive: true },
          select: {
            id: true,
            versionNumber: true,
            originalName: true,
            fileType: true,
            entryFile: true,
            fileSize: true,
            uploadedAt: true,
          },
          take: 1,
        },
        attempts: {
          where: { userId },
          select: {
            id: true,
            status: true,
            rawScore: true,
            bandScore: true,
            completedAt: true,
            timeSpentSeconds: true,
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    const formatted = tests.map(t => {
      const activeVersion = t.versions[0] || null;
      const completedAttempts = t.attempts.filter(a => a.status === 'COMPLETED');
      const latestAttempt = t.attempts[0] || null;

      return {
        id: t.id,
        section: t.section,
        testNumber: t.testNumber,
        title: t.title,
        description: t.description,
        timeLimitMinutes: t.timeLimitMinutes,
        status: t.status,
        createdAt: t.createdAt,
        activeVersion,
        userStats: {
          totalAttempts: t.attempts.length,
          completedAttempts: completedAttempts.length,
          latestAttempt,
          bestBandScore: completedAttempts.reduce((max, a) => (a.bandScore && a.bandScore > max ? a.bandScore : max), null),
        },
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// GET /api/tests/:id - Get test by id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.status !== 'PUBLISHED' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Test is not published' });
    }

    res.json(test);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
