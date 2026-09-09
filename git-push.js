const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const dir = path.resolve(__dirname);

async function pushRepo(remoteUrl, token = null) {
  console.log(`Setting remote origin to: ${remoteUrl}`);

  try {
    await git.deleteRemote({ fs, dir, remote: 'origin' });
  } catch (_) {}

  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: remoteUrl,
  });

  // Ensure current branch is 'main'
  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (_) {}

  console.log('Pushing to main branch...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => {
      if (token) {
        return { username: token, password: '' };
      }
      return {};
    },
  });

  console.log('Push completed successfully!', pushResult);
}

const args = process.argv.slice(2);
if (args[0]) {
  pushRepo(args[0], args[1] || null).catch(err => {
    console.error('Push error:', err.message);
    process.exit(1);
  });
} else {
  console.log('Usage: node git-push.js <REMOTE_URL> [TOKEN]');
}

module.exports = { pushRepo };
