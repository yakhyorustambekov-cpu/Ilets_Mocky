const testStore = require('./testStore');

/**
 * Server-side anti-repeat test randomizer for IELTS Full Mock exams.
 * Guaranteed no-repeats per section until all published tests in that section are exhausted.
 * Automatically and independently resets the pool per section when exhausted.
 */

async function selectTestForSection(prismaTx, userId, section) {
  // 1. Fetch all published tests in this section from test.json
  const publishedTests = testStore.getPublishedTests(section);

  if (!publishedTests || publishedTests.length === 0) {
    throw new Error(`No published tests available for section: ${section}. Please publish at least one test in ${section}.`);
  }

  const publishedTestIds = publishedTests.map(t => t.id);

  let activeCycle = 1;
  let usageId = null;

  // 2. Anti-repeat cycle tracking if Prisma database is accessible
  if (prismaTx && prismaTx.randomizationCycle) {
    try {
      let cycleRecord = await prismaTx.randomizationCycle.findUnique({
        where: {
          userId_section: {
            userId,
            section,
          },
        },
      });

      if (!cycleRecord) {
        cycleRecord = await prismaTx.randomizationCycle.create({
          data: {
            userId,
            section,
            currentCycle: 1,
          },
        });
      }

      // Find which tests the student has already taken in the CURRENT cycle
      const currentUsages = await prismaTx.studentTestUsage.findMany({
        where: {
          userId,
          section,
          cycle: cycleRecord.currentCycle,
          testId: { in: publishedTestIds },
        },
        select: { testId: true },
      });

      const usedTestIds = new Set(currentUsages.map(u => u.testId));

      // Candidate tests are published tests that have NOT been used in this cycle
      let candidates = publishedTests.filter(t => !usedTestIds.has(t.id));

      activeCycle = cycleRecord.currentCycle;
      if (candidates.length === 0) {
        activeCycle = cycleRecord.currentCycle + 1;
        await prismaTx.randomizationCycle.update({
          where: { id: cycleRecord.id },
          data: {
            currentCycle: activeCycle,
            lastResetAt: new Date(),
          },
        });

        candidates = publishedTests;
      }

      const selectedIndex = Math.floor(Math.random() * candidates.length);
      const selectedTest = candidates[selectedIndex];
      const activeVersion = (selectedTest.versions || []).find(v => v.isActive) || selectedTest.versions[0];

      if (!activeVersion) {
        throw new Error(`Test ${selectedTest.title} has no active version.`);
      }

      try {
        const usageRecord = await prismaTx.studentTestUsage.create({
          data: {
            userId,
            testId: selectedTest.id,
            section,
            cycle: activeCycle,
          },
        });
        usageId = usageRecord.id;
      } catch (_) {}

      return {
        test: selectedTest,
        version: activeVersion,
        cycle: activeCycle,
        usageId,
      };
    } catch (_) {}
  }

  // Fallback random selection without DB dependency
  const selectedIndex = Math.floor(Math.random() * publishedTests.length);
  const selectedTest = publishedTests[selectedIndex];
  const activeVersion = (selectedTest.versions || []).find(v => v.isActive) || selectedTest.versions[0];

  return {
    test: selectedTest,
    version: activeVersion,
    cycle: 1,
    usageId: null,
  };
}

module.exports = {
  selectTestForSection,
};

