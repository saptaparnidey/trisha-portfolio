/**
 * Starts the admin server in the background.
 *
 * Spawns `server.js` as a detached child process (so it keeps running after the
 * terminal closes), records its PID, waits until it is accepting connections,
 * and then prints the admin portal and site preview links.
 *
 * Usage:
 *   npm start
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const {
  ENV,
  ROOT_DIR,
  SERVER_LOG_FILE,
  START_READY_TIMEOUT_MS,
  START_POLL_INTERVAL_MS,
} = require('../src/config');
const { readPid, isProcessAlive, writePid } = require('./process-utils');

/**
 * Builds the admin and preview URLs for the configured port.
 *
 * @returns {{admin: string, site: string}} The portal and preview URLs.
 */
function buildLinks() {
  const base = `http://localhost:${ENV.port}`;
  return { admin: `${base}/admin`, site: `${base}/` };
}

/**
 * Prints the portal links to the console.
 *
 * @param {string} prefix A leading status line (e.g. "started" / "already running").
 * @returns {void}
 */
function printLinks(prefix) {
  const links = buildLinks();
  console.log(`\nAdmin portal is ${prefix}:`);
  console.log(`  Admin panel:  ${links.admin}`);
  console.log(`  Site preview: ${links.site}\n`);
}

/**
 * Polls the server until it responds or the timeout elapses.
 *
 * @returns {Promise<boolean>} Resolves true once reachable, false on timeout.
 */
function waitUntilReady() {
  const deadline = Date.now() + START_READY_TIMEOUT_MS;
  return new Promise((resolve) => {
    const probe = () => {
      const req = http.get(
        { host: 'localhost', port: ENV.port, path: '/admin/login.html' },
        (res) => {
          res.resume();
          resolve(true);
        },
      );
      req.on('error', () => {
        if (Date.now() > deadline) {
          resolve(false);
        } else {
          setTimeout(probe, START_POLL_INTERVAL_MS);
        }
      });
    };
    probe();
  });
}

/**
 * Spawns the detached server process and records its PID.
 *
 * @returns {number} The spawned child process PID.
 */
function spawnServer() {
  const logFd = fs.openSync(SERVER_LOG_FILE, 'a');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  child.unref();
  writePid(child.pid);
  return child.pid;
}

/**
 * Entry point: starts the server if not already running and prints links.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const existingPid = readPid();
  if (isProcessAlive(existingPid)) {
    printLinks(`already running (pid ${existingPid})`);
    console.log('Use "npm stop" to stop it, or "npm run restart" to restart.');
    return;
  }

  const pid = spawnServer();
  const ready = await waitUntilReady();
  if (ready) {
    printLinks(`running in the background (pid ${pid})`);
    console.log(`Logs: ${path.relative(ROOT_DIR, SERVER_LOG_FILE)}  |  Stop: npm stop`);
  } else {
    console.error(
      `\nServer did not become ready within ${START_READY_TIMEOUT_MS / 1000}s.`,
    );
    console.error(`Check ${SERVER_LOG_FILE} for details.`);
    process.exitCode = 1;
  }
}

main();
