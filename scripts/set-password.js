/**
 * CLI helper that turns a plain-text password into a bcrypt hash.
 *
 * Usage:
 *   npm run set-password -- "your-strong-password"
 *
 * The printed hash should be pasted into ADMIN_PASSWORD_HASH in your .env file.
 */

'use strict';

const bcrypt = require('bcryptjs');
const { BCRYPT_SALT_ROUNDS } = require('../src/config');

/**
 * Reads the password from CLI args, hashes it, and prints the result.
 *
 * @returns {void}
 */
function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run set-password -- "your-password"');
    process.exit(1);
  }
  const hash = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
  console.log('\nAdd this line to your .env file:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
}

main();
