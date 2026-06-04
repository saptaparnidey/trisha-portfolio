/**
 * CLI helper to regenerate the static site from the command line.
 *
 * Usage:
 *   npm run publish-site
 */

'use strict';

const { generateSite } = require('../src/generator');
const { DIST_DIR } = require('../src/config');

/**
 * Runs the generator and reports the outcome.
 *
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const { pages } = await generateSite();
    console.log(`Published ${pages} page(s) to ${DIST_DIR}`);
  } catch (err) {
    console.error('Publish failed:', err.message);
    process.exit(1);
  }
}

main();
