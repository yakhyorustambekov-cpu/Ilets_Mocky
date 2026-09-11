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
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const jwtSecret = process.env.JWT_SECRET || 'ielts-cdi-supersecret-production-key';
const port = process.env.PORT || 3001;
const clientUrl = process.env.CLIENT_URL || '*';
const envContent = `DATABASE_URL="${dbUrl}"\nJWT_SECRET="${jwtSecret}"\nPORT=${port}\nCLIENT_URL="${clientUrl}"\nUPLOAD_DIR="./uploads"\n`;

if (!fs.existsSync(serverEnvPath) || process.env.DATABASE_URL || process.env.PORT) {
  fs.writeFileSync(serverEnvPath, envContent, 'utf8');
  console.log('Synchronized environment file at:', serverEnvPath);
}
