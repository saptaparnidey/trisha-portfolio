/**
 * Authentication for the admin panel.
 *
 * Provides a single-admin login backed by a bcrypt password hash stored in the
 * environment, an Express middleware that guards protected routes, and helpers
 * to mount the login/logout endpoints.
 */

'use strict';

const bcrypt = require('bcryptjs');
const { ENV } = require('./config');

/**
 * Verifies a username/password pair against the configured admin credentials.
 *
 * @param {string} username Submitted username.
 * @param {string} password Submitted plain-text password.
 * @returns {boolean} True when the credentials match the configured admin.
 */
function verifyCredentials(username, password) {
  if (!ENV.adminPasswordHash) {
    return false;
  }
  if (username !== ENV.adminUsername) {
    return false;
  }
  return bcrypt.compareSync(password, ENV.adminPasswordHash);
}

/**
 * Express middleware that blocks unauthenticated access.
 *
 * For API requests it responds with 401 JSON; for page requests it redirects to
 * the login page so the browser shows the login form.
 *
 * @param {import('express').Request} req Incoming request.
 * @param {import('express').Response} res Outgoing response.
 * @param {import('express').NextFunction} next Next handler.
 * @returns {void}
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  // req.originalUrl is used (not req.path) because Express strips the mount
  // prefix from req.path, which would hide the "/api/" segment here.
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.redirect('/admin/login.html');
}

/**
 * Registers the login and logout routes on the given Express app.
 *
 * @param {import('express').Express} app The Express application.
 * @returns {void}
 */
function registerAuthRoutes(app) {
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!verifyCredentials(username, password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.isAuthenticated = true;
    req.session.username = username;
    return res.json({ ok: true });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get('/api/session', (req, res) => {
    res.json({
      authenticated: Boolean(req.session && req.session.isAuthenticated),
      username: (req.session && req.session.username) || null,
    });
  });
}

module.exports = {
  verifyCredentials,
  requireAuth,
  registerAuthRoutes,
};
