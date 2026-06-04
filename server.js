/**
 * Express entry point for the Portfolio Admin CMS.
 *
 * Responsibilities:
 *  - Serve the password-protected admin panel and its JSON API.
 *  - Serve uploaded images.
 *  - Serve the generated static site (`dist/`) as a live preview at "/".
 */

'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');

const {
  ENV,
  ADMIN_DIR,
  DIST_DIR,
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
  SESSION_MAX_AGE_MS,
} = require('./src/config');
const { requireAuth, registerAuthRoutes } = require('./src/auth');
const { createContentRouter } = require('./src/routes/content');
const { createUploadRouter } = require('./src/routes/upload');

/**
 * Maximum JSON request body size. Project detail bodies (rich text) can be
 * sizeable, so this is generous while still bounding memory use.
 * @type {string}
 */
const JSON_BODY_LIMIT = '5mb';

/**
 * Builds and configures the Express application.
 *
 * @returns {import('express').Express} The configured app.
 */
function createApp() {
  const app = express();

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      secret: ENV.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, maxAge: SESSION_MAX_AGE_MS },
    }),
  );

  // Public auth endpoints (login/logout/session check).
  registerAuthRoutes(app);

  // Uploaded images are served read-only at the configured prefix.
  app.use(UPLOADS_URL_PREFIX, express.static(UPLOADS_DIR));

  // Login page and its assets must be reachable without auth.
  app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(ADMIN_DIR, 'login.html'));
  });
  app.get('/admin/admin.css', (req, res) => {
    res.sendFile(path.join(ADMIN_DIR, 'admin.css'));
  });

  // Admin dashboard entry point (admin.html is not named index.html).
  app.get(['/admin', '/admin/'], requireAuth, (req, res) => {
    res.sendFile(path.join(ADMIN_DIR, 'admin.html'));
  });

  // Everything else under /admin and /api requires authentication.
  app.use('/admin', requireAuth, express.static(ADMIN_DIR));
  app.use('/api', requireAuth, createContentRouter());
  app.use('/api', requireAuth, createUploadRouter());

  // Live preview of the generated static site at the root.
  app.use(
    '/',
    express.static(DIST_DIR, { extensions: ['html'] }),
  );

  // Friendly hint when the site has not been generated yet.
  app.get('/', (req, res) => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    res
      .status(200)
      .send(
        'Site not generated yet. Log in at <a href="/admin">/admin</a> and click Publish.',
      );
  });

  return app;
}

/**
 * Starts the HTTP server.
 *
 * @returns {void}
 */
function start() {
  const app = createApp();
  app.listen(ENV.port, () => {
    console.log(`Admin panel:  http://localhost:${ENV.port}/admin`);
    console.log(`Site preview: http://localhost:${ENV.port}/`);
    if (!ENV.adminPasswordHash) {
      console.warn(
        '\nWARNING: ADMIN_PASSWORD_HASH is not set. Run "npm run set-password -- <password>" and add it to .env before logging in.',
      );
    }
  });
}

start();

module.exports = { createApp };
