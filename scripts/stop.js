/**
 * Stops the backgrounded admin server.
 *
 * Reads the recorded PID and terminates the process, then removes the PID file.
 *
 * Usage:
 *   npm stop
 */

'use strict';

const { readPid, isProcessAlive, clearPid } = require('./process-utils');

/**
 * Delay (ms) to wait after signalling before confirming the process exited.
 * @type {number}
 */
const STOP_CONFIRM_DELAY_MS = 400;

/**
 * Entry point: stops the server if running.
 *
 * @returns {void}
 */
function main() {
  const pid = readPid();

  if (!pid || !isProcessAlive(pid)) {
    console.log('Admin server is not running.');
    clearPid();
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch (err) {
    console.error(`Failed to stop server (pid ${pid}): ${err.message}`);
    process.exitCode = 1;
    return;
  }

  setTimeout(() => {
    if (isProcessAlive(pid)) {
      // Force kill if it did not shut down gracefully.
      try {
        process.kill(pid, 'SIGKILL');
      } catch (err) {
        /* already gone */
      }
    }
    clearPid();
    console.log(`Admin server stopped (pid ${pid}).`);
  }, STOP_CONFIRM_DELAY_MS);
}

main();
