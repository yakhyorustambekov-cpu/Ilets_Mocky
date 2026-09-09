const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { getType } = require('./mime');

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');

/**
 * Ensures the directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Recursively scans directory to list all files with relative paths
 */
function scanDir(baseDir, currentDir = '') {
  const fullCurrent = path.join(baseDir, currentDir);
  if (!fs.existsSync(fullCurrent)) return [];
  const entries = fs.readdirSync(fullCurrent, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const relPath = currentDir ? `${currentDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files = files.concat(scanDir(baseDir, relPath));
    } else if (entry.isFile()) {
      const fullFilePath = path.join(baseDir, relPath);
      const stat = fs.statSync(fullFilePath);
      files.push({
        relativePath: relPath.replace(/\\/g, '/'),
        mimeType: getType(entry.name),
        fileSize: stat.size,
      });
    }
  }

  return files;
}

/**
 * Finds the entry HTML file in a directory
 */
function findEntryHtml(baseDir) {
  // Check common index names first at root
  const primaryCandidates = ['index.html', 'index.htm', 'test.html', 'main.html'];
  for (const candidate of primaryCandidates) {
    if (fs.existsSync(path.join(baseDir, candidate))) {
      return candidate;
    }
  }

  // Find all HTML files
  const allFiles = scanDir(baseDir);
  const htmlFiles = allFiles
    .filter(f => f.relativePath.toLowerCase().endsWith('.html') || f.relativePath.toLowerCase().endsWith('.htm'))
    .sort((a, b) => {
      // Prioritize shallowest depth
      const depthA = (a.relativePath.match(/\//g) || []).length;
      const depthB = (b.relativePath.match(/\//g) || []).length;
      if (depthA !== depthB) return depthA - depthB;
      // Then index.html
      if (a.relativePath.toLowerCase().includes('index')) return -1;
      if (b.relativePath.toLowerCase().includes('index')) return 1;
      return 0;
    });

  if (htmlFiles.length > 0) {
    return htmlFiles[0].relativePath;
  }

  throw new Error('No HTML entry point (.html file) found in uploaded package');
}

/**
 * Processes an uploaded file (HTML or ZIP) into the test version storage directory
 */
async function processTestUpload(uploadedFile, testId, versionNumber) {
  const relativeSubdir = path.join('tests', testId, `v${versionNumber}`).replace(/\\/g, '/');
  const versionFolder = path.join(UPLOAD_BASE_DIR, relativeSubdir);
  ensureDir(versionFolder);

  const originalName = uploadedFile.originalname;
  const ext = path.extname(originalName).toLowerCase();
  const fileSize = uploadedFile.size;

  let fileType = 'HTML';
  let entryFile = 'index.html';

  if (ext === '.zip') {
    fileType = 'ZIP';
    const zip = new AdmZip(uploadedFile.path);
    const zipEntries = zip.getEntries();

    // Verify zip safety (prevent zip-slip)
    for (const entry of zipEntries) {
      if (entry.entryName.includes('..') || path.isAbsolute(entry.entryName)) {
        throw new Error(`Security violation: unsafe zip entry path: ${entry.entryName}`);
      }
    }

    // Extract all entries
    for (const entry of zipEntries) {
      // Skip macOS system junk
      if (entry.entryName.startsWith('__MACOSX') || entry.entryName.includes('.DS_Store')) {
        continue;
      }

      const targetPath = path.join(versionFolder, entry.entryName);
      if (entry.isDirectory) {
        ensureDir(targetPath);
      } else {
        ensureDir(path.dirname(targetPath));
        fs.writeFileSync(targetPath, entry.getData());
      }
    }

    // Locate entry HTML file
    entryFile = findEntryHtml(versionFolder);
  } else if (ext === '.html' || ext === '.htm') {
    fileType = 'HTML';
    entryFile = originalName;
    const destPath = path.join(versionFolder, entryFile);
    // Copy the original HTML file completely untouched
    fs.copyFileSync(uploadedFile.path, destPath);
  } else {
    throw new Error('Unsupported file format. Please upload an .html file or a .zip package.');
  }

  // Clean up temporary uploaded file from multer
  try {
    if (fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
  } catch (err) {
    console.warn('Could not remove temp upload file:', err.message);
  }

  // Scan all extracted/copied files
  const filesList = scanDir(versionFolder);

  return {
    originalName,
    storagePath: relativeSubdir,
    entryFile,
    fileType,
    fileSize,
    filesList,
  };
}

module.exports = {
  processTestUpload,
  ensureDir,
  scanDir,
  findEntryHtml,
  UPLOAD_BASE_DIR,
};
