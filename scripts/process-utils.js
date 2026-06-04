/**
 * Shared helpers for the background start/stop scripts.
 */

'use strict';

const fs = require('fs');
const { SERVER_PID_FILE } = require('../src/config');

/**
 * Reads the stored server PID, if any.
 *
 * @returns {number|null} The PID, or null when no valid PID file exists.
 */
function readPid() {
  try {
    const raw = fs.readFileSync(SERVER_PID_FILE, 'utf8').trim();
    const pid = Number(raw);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (err) {
    return null;
  }
}

/**
 * Checks whether a process with the given PID is currently alive.
 *
 * Uses signal 0, which performs error checking without actually sending a
 * signal to the target process.
 *
 * @param {number} pid Process id to probe.
 * @returns {boolean} True when the process exists and is accessible.
 */
function isProcessAlive(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Writes the given PID to the PID file.
 *
 * @param {number} pid Process id to persist.
 * @returns {void}
 */
function writePid(pid) {
  fs.writeFileSync(SERVER_PID_FILE, String(pid), 'utf8');
}

/**
 * Removes the PID file if it exists.
 *
 * @returns {void}
 */
function clearPid() {
  try {
    fs.unlinkSync(SERVER_PID_FILE);
  } catch (err) {
    /* file already gone - nothing to do */
  }
}

module.exports = {
  readPid,
  isProcessAlive,
  writePid,
  clearPid,
};
