const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const testStore = require('../utils/testStore');

const router = express.Router();

// GET /api/tests/counts - Overview of available published tests from test.json
router.get('/counts', async (req, res, next) => {
  try {
    const counts = testStore.getCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
});

// GET /api/tests - List published tests from test.json
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { section } = req.query;
    const userId = req.user.id;

    const tests = testStore.getPublishedTests(section);

    let userAttempts = [];
    try {
      userAttempts = await prisma.testAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          testId: true,
          status: true,
          rawScore: true,
          bandScore: true,
          completedAt: true,
          timeSpentSeconds: true,
          startedAt: true,
        },
        orderBy: { startedAt: 'desc' },
      });
    } catch (_) {}

    const formatted = tests.map(t => {
      const versions = t.versions || [];
      const activeVersion = versions.find(v => v.isActive) || versions[0] || null;
      const attemptsForTest = userAttempts.filter(a => a.testId === t.id);
      const completedAttempts = attemptsForTest.filter(a => a.status === 'COMPLETED');
      const latestAttempt = attemptsForTest[0] || null;

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
          totalAttempts: attemptsForTest.length,
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

// GET /api/tests/:id - Get test by id from test.json
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const test = testStore.getTestById(req.params.id);

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
