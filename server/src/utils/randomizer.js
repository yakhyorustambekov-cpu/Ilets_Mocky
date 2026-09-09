/**
 * Server-side anti-repeat test randomizer for IELTS Full Mock exams.
 * Guaranteed no-repeats per section until all published tests in that section are exhausted.
 * Automatically and independently resets the pool per section when exhausted.
 */

async function selectTestForSection(prismaTx, userId, section) {
  // 1. Fetch all published tests in this section that have an active version
  const publishedTests = await prismaTx.test.findMany({
    where: {
      section,
      status: 'PUBLISHED',
      versions: {
        some: { isActive: true },
      },
    },
    include: {
      versions: {
        where: { isActive: true },
        take: 1,
      },
    },
    orderBy: { testNumber: 'asc' },
  });

  if (!publishedTests || publishedTests.length === 0) {
    throw new Error(`No published tests available for section: ${section}. Please publish at least one test in ${section}.`);
  }

  const publishedTestIds = publishedTests.map(t => t.id);

  // 2. Fetch or create the student's randomization cycle record for this section
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

  // 3. Find which tests the student has already taken in the CURRENT cycle
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

  // 4. Candidate tests are published tests that have NOT been used in this cycle
  let candidates = publishedTests.filter(t => !usedTestIds.has(t.id));

  // 5. If all published tests have been used in this cycle, cycle is complete!
  // Reset pool ONLY for this section by incrementing cycle number
  let activeCycle = cycleRecord.currentCycle;
  if (candidates.length === 0) {
    activeCycle = cycleRecord.currentCycle + 1;
    await prismaTx.randomizationCycle.update({
      where: { id: cycleRecord.id },
      data: {
        currentCycle: activeCycle,
        lastResetAt: new Date(),
      },
    });

    // All published tests are now candidates again for the new cycle
    candidates = publishedTests;
  }

  // 6. Randomly select 1 candidate test
  const selectedIndex = Math.floor(Math.random() * candidates.length);
  const selectedTest = candidates[selectedIndex];
  const activeVersion = selectedTest.versions[0];

  if (!activeVersion) {
    throw new Error(`Test ${selectedTest.title} has no active version.`);
  }

  // 7. Record usage for this student, test, section, and cycle
  const usageRecord = await prismaTx.studentTestUsage.create({
    data: {
      userId,
      testId: selectedTest.id,
      section,
      cycle: activeCycle,
    },
  });

  return {
    test: selectedTest,
    version: activeVersion,
    cycle: activeCycle,
    usageId: usageRecord.id,
  };
}

module.exports = {
  selectTestForSection,
};
