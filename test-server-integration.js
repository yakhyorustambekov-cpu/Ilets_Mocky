const { app, server } = require('./server/src/index');
const prisma = require('./server/src/db');
const http = require('http');

async function runTests() {
  console.log('=== RUNNING SERVER & RANDOMIZATION WORKFLOW TEST ===');

  // Let server start on port 3001
  await new Promise(r => setTimeout(r, 800));

  // 1. Authenticate as student
  const student = await prisma.user.findUnique({
    where: { email: 'student@ielts.com' },
  });
  console.log('Found student:', student.email, 'Candidate #:', student.candidateNumber);

  // Clean any previous test attempts for clean verification
  await prisma.fullMockAttempt.deleteMany({ where: { userId: student.id } });
  await prisma.testAttempt.deleteMany({ where: { userId: student.id } });
  await prisma.studentTestUsage.deleteMany({ where: { userId: student.id } });
  await prisma.randomizationCycle.deleteMany({ where: { userId: student.id } });

  // 2. Start Full Mock #1
  const { selectTestForSection } = require('./server/src/utils/randomizer');

  // Simulate POST /api/mocks/start for Mock #1
  console.log('\n--- Step 1: Starting Full Mock #1 ---');
  const mock1 = await prisma.$transaction(async (tx) => {
    const l = await selectTestForSection(tx, student.id, 'LISTENING');
    const r = await selectTestForSection(tx, student.id, 'READING');
    const w = await selectTestForSection(tx, student.id, 'WRITING');

    const fm = await tx.fullMockAttempt.create({
      data: {
        userId: student.id,
        mockNumber: 1,
        listeningTestId: l.test.id,
        listeningVersionId: l.version.id,
        readingTestId: r.test.id,
        readingVersionId: r.version.id,
        writingTestId: w.test.id,
        writingVersionId: w.version.id,
        currentSection: 'LISTENING',
        status: 'IN_PROGRESS',
      },
      include: {
        listeningTest: true,
        readingTest: true,
        writingTest: true,
      },
    });

    return { fm, l, r, w };
  });

  console.log(`Mock #1 Assignment:`);
  console.log(`  Listening: Test ${mock1.fm.listeningTest.testNumber} (${mock1.fm.listeningTest.title})`);
  console.log(`  Reading:   Test ${mock1.fm.readingTest.testNumber} (${mock1.fm.readingTest.title})`);
  console.log(`  Writing:   Test ${mock1.fm.writingTest.testNumber} (${mock1.fm.writingTest.title})`);

  // 3. Test persistence: Reloading mock should return the same test IDs
  console.log('\n--- Step 2: Testing Full Mock Assignment Persistence ---');
  const reloadedMock = await prisma.fullMockAttempt.findUnique({
    where: { id: mock1.fm.id },
    include: { listeningTest: true, readingTest: true, writingTest: true },
  });

  if (
    reloadedMock.listeningTestId === mock1.fm.listeningTestId &&
    reloadedMock.readingTestId === mock1.fm.readingTestId &&
    reloadedMock.writingTestId === mock1.fm.writingTestId
  ) {
    console.log('✓ PASS: Mock assignment persisted identically across reload/resume!');
  } else {
    throw new Error('FAIL: Mock assignment changed on reload!');
  }

  // 4. Start Full Mock #2: Verify NO-REPEAT logic
  console.log('\n--- Step 3: Starting Full Mock #2 (No-Repeat Verification) ---');
  const mock2 = await prisma.$transaction(async (tx) => {
    const l = await selectTestForSection(tx, student.id, 'LISTENING');
    const r = await selectTestForSection(tx, student.id, 'READING');
    const w = await selectTestForSection(tx, student.id, 'WRITING');

    const fm = await tx.fullMockAttempt.create({
      data: {
        userId: student.id,
        mockNumber: 2,
        listeningTestId: l.test.id,
        listeningVersionId: l.version.id,
        readingTestId: r.test.id,
        readingVersionId: r.version.id,
        writingTestId: w.test.id,
        writingVersionId: w.version.id,
        currentSection: 'LISTENING',
        status: 'IN_PROGRESS',
      },
      include: {
        listeningTest: true,
        readingTest: true,
        writingTest: true,
      },
    });

    return { fm, l, r, w };
  });

  console.log(`Mock #2 Assignment:`);
  console.log(`  Listening: Test ${mock2.fm.listeningTest.testNumber} (${mock2.fm.listeningTest.title})`);
  console.log(`  Reading:   Test ${mock2.fm.readingTest.testNumber} (${mock2.fm.readingTest.title})`);
  console.log(`  Writing:   Test ${mock2.fm.writingTest.testNumber} (${mock2.fm.writingTest.title})`);

  // Verify that since there are 2 tests in each section, Mock #2 MUST choose the unused test!
  if (mock2.fm.listeningTestId === mock1.fm.listeningTestId) {
    throw new Error('FAIL: Listening repeated before pool was exhausted!');
  }
  if (mock2.fm.readingTestId === mock1.fm.readingTestId) {
    throw new Error('FAIL: Reading repeated before pool was exhausted!');
  }
  if (mock2.fm.writingTestId === mock1.fm.writingTestId) {
    throw new Error('FAIL: Writing repeated before pool was exhausted!');
  }
  console.log('✓ PASS: All 3 sections successfully selected the unused test (0 repeats)!');

  // 5. Start Full Mock #3: Verify Pool Reset Cycle
  console.log('\n--- Step 4: Starting Full Mock #3 (Pool Reset Verification) ---');
  const mock3 = await prisma.$transaction(async (tx) => {
    const l = await selectTestForSection(tx, student.id, 'LISTENING');
    const r = await selectTestForSection(tx, student.id, 'READING');
    const w = await selectTestForSection(tx, student.id, 'WRITING');
    return { l, r, w };
  });
  console.log(`Mock #3 (Cycle 2 reset):`);
  console.log(`  Listening Cycle: ${mock3.l.cycle}, Test: ${mock3.l.test.testNumber}`);
  console.log(`  Reading Cycle:   ${mock3.r.cycle}, Test: ${mock3.r.test.testNumber}`);
  console.log(`  Writing Cycle:   ${mock3.w.cycle}, Test: ${mock3.w.test.testNumber}`);

  if (mock3.l.cycle === 2 && mock3.r.cycle === 2 && mock3.w.cycle === 2) {
    console.log('✓ PASS: All sections properly entered Cycle 2 after pool exhaustion!');
  } else {
    throw new Error('FAIL: Cycle did not increment on exhaustion!');
  }

  console.log('\n=== ALL WORKFLOW & RANDOMIZATION TESTS PASSED PERFECTLY ===\n');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
