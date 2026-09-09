const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

const dir = path.resolve(__dirname);

function getFiles(currentDir, relativeBase = '') {
  let results = [];
  const list = fs.readdirSync(currentDir, { withFileTypes: true });

  const ignored = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'uploads',
    '.env',
    'dev.db',
    'dev.db-journal',
    '.system_generated',
  ];

  for (const item of list) {
    if (ignored.includes(item.name) || item.name.endsWith('.db') || item.name.endsWith('.db-journal') || item.name.endsWith('.log')) {
      continue;
    }

    const relPath = relativeBase ? `${relativeBase}/${item.name}` : item.name;
    const fullPath = path.join(currentDir, item.name);

    if (item.isDirectory()) {
      results = results.concat(getFiles(fullPath, relPath));
    } else {
      results.push(relPath.replace(/\\/g, '/'));
    }
  }
  return results;
}

async function run() {
  console.log('Initializing Git repository in:', dir);
  await git.init({ fs, dir });

  console.log('Scanning files to stage...');
  const files = getFiles(dir);
  console.log(`Found ${files.length} project files.`);

  for (const filepath of files) {
    await git.add({ fs, dir, filepath });
  }

  console.log('Committing staged files...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'IELTS Administrator',
      email: 'admin@ielts.com',
    },
    message: 'feat: complete production-quality IELTS computer-delivered mock platform',
  });

  console.log('Successfully created Git commit:', sha);
}

run().catch(err => {
  console.error('Git commit error:', err);
  process.exit(1);
});
