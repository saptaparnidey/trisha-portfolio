/**
 * Pre-deploy check: warns when content.json references uploaded files that are
 * not tracked by git (a common cause of broken images on Netlify).
 *
 * Usage:
 *   npm run check-deploy
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CONTENT_FILE, ROOT_DIR } = require('../src/config');

/**
 * Collects all /uploads/... paths referenced anywhere in content.json.
 *
 * @param {object} content Parsed content object.
 * @returns {string[]} Relative paths like "public/uploads/foo.png".
 */
function collectUploadPaths(content) {
  const json = JSON.stringify(content);
  const matches = json.match(/\/uploads\/[^"\\]+/g) || [];
  const unique = [...new Set(matches)];
  return unique.map((p) => `public${p}`);
}

/**
 * Returns true when git tracks the given file path.
 *
 * @param {string} relativePath Path relative to the repo root.
 * @returns {boolean}
 */
function isTrackedByGit(relativePath) {
  try {
    execSync(`git ls-files --error-unmatch "${relativePath}"`, {
      cwd: ROOT_DIR,
      stdio: 'pipe',
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Entry point: scans content.json and reports untracked upload references.
 *
 * @returns {void}
 */
function main() {
  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  const paths = collectUploadPaths(content);
  const missing = paths.filter((p) => !isTrackedByGit(p));

  if (missing.length === 0) {
    console.log('All referenced upload files are tracked by git. Safe to push.');
    return;
  }

  console.error('\nWARNING: These files are referenced in content.json but NOT in git:');
  missing.forEach((p) => console.error(`  - ${p}`));
  console.error('\nAdd them before pushing or images will be broken on Netlify:');
  console.error('  git add public/uploads/ data/content.json');
  console.error('  git commit -m "Update portfolio content [Cursor]"');
  console.error('  git push origin main\n');
  process.exitCode = 1;
}

main();
