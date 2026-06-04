/**
 * Read/write helpers for the content JSON file.
 *
 * This module is the only place that touches {@link config.CONTENT_FILE}
 * directly, keeping persistence logic in a single, testable spot.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { CONTENT_FILE } = require('./config');

/**
 * Number of spaces used when serialising content.json.
 * Keeps the file human-readable and diff-friendly.
 * @type {number}
 */
const JSON_INDENT = 2;

/**
 * Reads and parses the content file.
 *
 * @returns {object} The parsed content object (single source of truth).
 * @throws {Error} If the file is missing or contains invalid JSON.
 */
function readContent() {
  const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
  return JSON.parse(raw);
}

/**
 * Persists the given content object back to disk.
 *
 * Writes atomically (temp file + rename) so a crash mid-write cannot leave a
 * half-written, corrupt content.json.
 *
 * @param {object} content The full content object to store.
 * @returns {void}
 */
function writeContent(content) {
  const dir = path.dirname(CONTENT_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const tmpFile = `${CONTENT_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(content, null, JSON_INDENT), 'utf8');
  fs.renameSync(tmpFile, CONTENT_FILE);
}

module.exports = {
  readContent,
  writeContent,
};
