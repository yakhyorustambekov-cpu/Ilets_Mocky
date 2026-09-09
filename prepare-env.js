const fs = require('fs');
const path = require('path');

const envContent = 'DATABASE_URL="file:./dev.db"\nJWT_SECRET="ielts-cdi-supersecret-production-key"\n';

const targetDirs = [
  path.resolve(__dirname, 'server'),
  path.resolve(__dirname, 'server', 'prisma'),
  path.resolve(__dirname),
];

for (const dir of targetDirs) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const envFile = path.join(dir, '.env');
    if (!fs.existsSync(envFile)) {
      fs.writeFileSync(envFile, envContent, 'utf8');
      console.log('Auto-generated environment file at:', envFile);
    }
  } catch (err) {
    console.warn('Could not write env file:', dir, err.message);
  }
}
