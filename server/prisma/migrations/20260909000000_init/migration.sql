-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "candidateNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetBand" DOUBLE PRECISION,
    "examDate" TEXT,
    "phone" TEXT,
    "bio" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "testNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestVersion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "entryFile" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'HTML',
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TestVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestFile" (
    "id" TEXT NOT NULL,
    "testVersionId" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,

    CONSTRAINT "TestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "testVersionId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpentSeconds" INTEGER,
    "rawScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "bandScore" DOUBLE PRECISION,
    "resultData" TEXT,
    "fullMockAttemptId" TEXT,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FullMockAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockNumber" INTEGER NOT NULL,
    "listeningTestId" TEXT NOT NULL,
    "listeningVersionId" TEXT NOT NULL,
    "readingTestId" TEXT NOT NULL,
    "readingVersionId" TEXT NOT NULL,
    "writingTestId" TEXT NOT NULL,
    "writingVersionId" TEXT NOT NULL,
    "currentSection" TEXT NOT NULL DEFAULT 'LISTENING',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FullMockAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTestUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullMockAttemptId" TEXT,

    CONSTRAINT "StudentTestUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomizationCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "currentCycle" INTEGER NOT NULL DEFAULT 1,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomizationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "testAttemptId" TEXT,
    "fullMockAttemptId" TEXT,
    "section" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "bandScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "detailsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Test_section_testNumber_key" ON "Test"("section", "testNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TestVersion_testId_versionNumber_key" ON "TestVersion"("testId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FullMockAttempt_userId_mockNumber_key" ON "FullMockAttempt"("userId", "mockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTestUsage_userId_testId_cycle_key" ON "StudentTestUsage"("userId", "testId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "RandomizationCycle_userId_section_key" ON "RandomizationCycle"("userId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestVersion" ADD CONSTRAINT "TestVersion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestFile" ADD CONSTRAINT "TestFile_testVersionId_fkey" FOREIGN KEY ("testVersionId") REFERENCES "TestVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testVersionId_fkey" FOREIGN KEY ("testVersionId") REFERENCES "TestVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_fullMockAttemptId_fkey" FOREIGN KEY ("fullMockAttemptId") REFERENCES "FullMockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_listeningTestId_fkey" FOREIGN KEY ("listeningTestId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_listeningVersionId_fkey" FOREIGN KEY ("listeningVersionId") REFERENCES "TestVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_readingTestId_fkey" FOREIGN KEY ("readingTestId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_readingVersionId_fkey" FOREIGN KEY ("readingVersionId") REFERENCES "TestVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_writingTestId_fkey" FOREIGN KEY ("writingTestId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullMockAttempt" ADD CONSTRAINT "FullMockAttempt_writingVersionId_fkey" FOREIGN KEY ("writingVersionId") REFERENCES "TestVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTestUsage" ADD CONSTRAINT "StudentTestUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTestUsage" ADD CONSTRAINT "StudentTestUsage_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTestUsage" ADD CONSTRAINT "StudentTestUsage_fullMockAttemptId_fkey" FOREIGN KEY ("fullMockAttemptId") REFERENCES "FullMockAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomizationCycle" ADD CONSTRAINT "RandomizationCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_testAttemptId_fkey" FOREIGN KEY ("testAttemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_fullMockAttemptId_fkey" FOREIGN KEY ("fullMockAttemptId") REFERENCES "FullMockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

