const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ielts.com' },
    update: {},
    create: {
      email: 'admin@ielts.com',
      password: adminPassword,
      firstName: 'Examiner',
      lastName: 'Admin',
      candidateNumber: 'CDI-ADM001',
      role: 'ADMIN',
      profile: {
        create: {
          targetBand: 9.0,
          bio: 'Platform Administrator & Chief Examiner',
        },
      },
    },
  });
  console.log('Admin user created:', admin.email);

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@ielts.com' },
    update: {},
    create: {
      email: 'student@ielts.com',
      password: studentPassword,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      candidateNumber: 'CDI-849201',
      role: 'STUDENT',
      profile: {
        create: {
          targetBand: 7.5,
          examDate: '2026-10-15',
          phone: '+1 (555) 382-9910',
          bio: 'Preparing for IELTS Academic',
        },
      },
    },
  });
  console.log('Student user created:', student.email);

  // Initialize randomization cycles for default student
  for (const section of ['LISTENING', 'READING', 'WRITING']) {
    await prisma.randomizationCycle.upsert({
      where: {
        userId_section: {
          userId: student.id,
          section,
        },
      },
      update: {},
      create: {
        userId: student.id,
        section,
        currentCycle: 1,
      },
    });
  }

  // Default platform settings
  const settings = [
    { key: 'platformName', value: 'IELTS Official CDI Simulation' },
    { key: 'allowRegistration', value: 'true' },
    { key: 'listeningDurationMinutes', value: '32' },
    { key: 'readingDurationMinutes', value: '60' },
    { key: 'writingDurationMinutes', value: '60' },
    { key: 'strictTimerMode', value: 'true' },
    { key: 'requireConfirmationOnNext', value: 'true' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('Settings seeded');

  console.log('Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
