const fs = require('fs');
const path = require('path');

// Remove subfolder prisma/.env files to prevent Prisma conflicting env warnings
const conflictingPaths = [
  path.resolve(__dirname, 'prisma', '.env'),
  path.resolve(__dirname, 'server', 'prisma', '.env'),
];

for (const conflict of conflictingPaths) {
  try {
    if (fs.existsSync(conflict)) {
      fs.unlinkSync(conflict);
      console.log('Cleaned up conflicting prisma env file:', conflict);
    }
  } catch (_) {}
}

const serverDir = path.resolve(__dirname, 'server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl.includes('5432') || dbUrl.includes('localhost') || !dbUrl.startsWith('file:')) {
  dbUrl = 'file:./dev.db';
}
const jwtSecret = process.env.JWT_SECRET || 'ielts-cdi-supersecret-production-key';
const port = process.env.PORT || 3001;
const clientUrl = process.env.CLIENT_URL || '*';
const envContent = `DATABASE_URL="${dbUrl}"\nJWT_SECRET="${jwtSecret}"\nPORT=${port}\nCLIENT_URL="${clientUrl}"\nUPLOAD_DIR="./uploads"\n`;

// Synchronize canonical .env to root and server/.env
const rootEnvPath = path.resolve(__dirname, '.env');
const serverEnvPath = path.join(serverDir, '.env');

fs.writeFileSync(rootEnvPath, envContent, 'utf8');
fs.writeFileSync(serverEnvPath, envContent, 'utf8');
console.log('Synchronized canonical environment files at root and server');
