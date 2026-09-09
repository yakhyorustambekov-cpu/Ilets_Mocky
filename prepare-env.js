const fs = require('fs');
const path = require('path');

// Prisma throws an error if multiple .env files exist in both .env and prisma/.env
// We remove any extra .env files to ensure zero conflicts
const conflictingPaths = [
  path.resolve(__dirname, 'server', 'prisma', '.env'),
  path.resolve(__dirname, '.env'),
];

for (const conflict of conflictingPaths) {
  try {
    if (fs.existsSync(conflict)) {
      fs.unlinkSync(conflict);
      console.log('Cleaned up conflicting env file:', conflict);
    }
  } catch (_) {}
}

// Ensure ONLY server/.env exists as the single source of truth
const serverDir = path.resolve(__dirname, 'server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

const serverEnvPath = path.join(serverDir, '.env');
const envContent = 'DATABASE_URL="file:./dev.db"\nJWT_SECRET="ielts-cdi-supersecret-production-key"\n';

if (!fs.existsSync(serverEnvPath)) {
  fs.writeFileSync(serverEnvPath, envContent, 'utf8');
  console.log('Created single canonical environment file at:', serverEnvPath);
}
