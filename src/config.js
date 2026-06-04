/**
 * Centralised configuration and constants for the Portfolio Admin CMS.
 *
 * Every tunable value lives here (instead of being scattered as literals)
 * so the application has a single, documented place to adjust behaviour.
 */

'use strict';

const path = require('path');
require('dotenv').config();

/**
 * Default HTTP port used when the PORT environment variable is not set.
 * Used by {@link server.js} to bind the Express server.
 * @type {number}
 */
const DEFAULT_PORT = 3000;

/**
 * Absolute path to the project root directory.
 * All other paths are derived from this so the app is location independent.
 * @type {string}
 */
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Absolute path to the JSON file that is the single source of truth for all
 * editable content. Read on every admin request and consumed by the generator.
 * @type {string}
 */
const CONTENT_FILE = path.join(ROOT_DIR, 'data', 'content.json');

/**
 * Absolute path to the directory holding uploaded images.
 * Served read-only and copied into the generated site on publish.
 * @type {string}
 */
const UPLOADS_DIR = path.join(ROOT_DIR, 'public', 'uploads');

/**
 * Public URL prefix under which uploaded images are exposed.
 * Stored inside content.json so both the admin preview and the generated
 * site can resolve image paths consistently.
 * @type {string}
 */
const UPLOADS_URL_PREFIX = '/uploads';

/**
 * Absolute path to the EJS templates used by the generator.
 * @type {string}
 */
const TEMPLATES_DIR = path.join(ROOT_DIR, 'src', 'templates');

/**
 * Absolute path to the admin panel static assets (login + editor UI).
 * @type {string}
 */
const ADMIN_DIR = path.join(ROOT_DIR, 'admin');

/**
 * Absolute path to the generated, non-editable static site output directory.
 * This is what gets deployed to a host; it is rebuilt on every publish.
 * @type {string}
 */
const DIST_DIR = path.join(ROOT_DIR, 'dist');

/**
 * Absolute path to the PID file used by the start/stop scripts to track the
 * backgrounded server process so it can be located and stopped later.
 * @type {string}
 */
const SERVER_PID_FILE = path.join(ROOT_DIR, '.server.pid');

/**
 * Absolute path to the log file the backgrounded server writes its stdout/stderr
 * to (since the terminal is detached when running in the background).
 * @type {string}
 */
const SERVER_LOG_FILE = path.join(ROOT_DIR, 'server.log');

/**
 * Maximum time (ms) the start script waits for the server to become reachable
 * before giving up and reporting an error.
 * @type {number}
 */
const START_READY_TIMEOUT_MS = 10000;

/**
 * Interval (ms) between readiness probes while the start script waits for the
 * server to accept connections.
 * @type {number}
 */
const START_POLL_INTERVAL_MS = 250;

/**
 * Subdirectory (within {@link DIST_DIR}) that holds per-project detail pages.
 * Matches the relative links already used by the portfolio cards
 * (e.g. "projects/unicef-campaign.html").
 * @type {string}
 */
const PROJECTS_SUBDIR = 'projects';

/**
 * Maximum accepted upload size in bytes (5 MB).
 * Guards the upload endpoint against oversized files.
 * @type {number}
 */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Image MIME types the upload endpoint will accept.
 * Anything outside this allow-list is rejected.
 * @type {string[]}
 */
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/**
 * Maximum accepted work-file upload size in bytes (50 MB).
 * Work files (PDFs, short videos showcasing actual work) are larger than the
 * thumbnail images, so they get their own, more generous limit.
 * @type {number}
 */
const MAX_WORK_UPLOAD_BYTES = 50 * 1024 * 1024;

/**
 * MIME types accepted for project "work" files (the actual deliverables shown
 * on each project's detail page): documents and short videos.
 * @type {string[]}
 */
const ALLOWED_WORK_MIME_TYPES = [
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * Session cookie lifetime in milliseconds (7 days).
 * Keeps the admin logged in across visits without being indefinite.
 * @type {number}
 */
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * bcrypt cost factor used when hashing the admin password.
 * Higher is slower/safer; 10 is a sensible default for a single user.
 * @type {number}
 */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Resolved runtime configuration sourced from environment variables.
 * Falls back to sane defaults where appropriate.
 * @type {{port: number, adminUsername: string, adminPasswordHash: string, sessionSecret: string}}
 */
const ENV = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  adminUsername: process.env.ADMIN_USERNAME || 'trisha',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  sessionSecret: process.env.SESSION_SECRET || 'insecure-dev-secret-change-me',
};

module.exports = {
  DEFAULT_PORT,
  ROOT_DIR,
  CONTENT_FILE,
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
  TEMPLATES_DIR,
  ADMIN_DIR,
  DIST_DIR,
  SERVER_PID_FILE,
  SERVER_LOG_FILE,
  START_READY_TIMEOUT_MS,
  START_POLL_INTERVAL_MS,
  PROJECTS_SUBDIR,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_WORK_UPLOAD_BYTES,
  ALLOWED_WORK_MIME_TYPES,
  SESSION_MAX_AGE_MS,
  BCRYPT_SALT_ROUNDS,
  ENV,
};
