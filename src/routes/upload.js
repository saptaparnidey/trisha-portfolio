/**
 * Image upload API.
 *
 * Accepts a single image file, validates its type/size, stores it under the
 * uploads directory with a collision-resistant name, and returns the public
 * URL that the admin panel saves into content.json.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const {
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_WORK_UPLOAD_BYTES,
  ALLOWED_WORK_MIME_TYPES,
} = require('../config');

/**
 * Subfolder (within the uploads dir) where project work files are stored,
 * keeping deliverables (PDFs/videos) separate from thumbnail images.
 * @type {string}
 */
const WORK_SUBDIR = 'work';

/**
 * Sanitises an original filename into a safe, lowercase base name.
 *
 * @param {string} originalName The uploaded file's original name.
 * @returns {string} A safe base name (without directory components).
 */
function safeBaseName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
  return `${base}${ext}`;
}

/**
 * Multer storage configuration: writes to the uploads dir with a timestamped,
 * sanitised filename so repeated uploads never overwrite one another.
 * @type {import('multer').StorageEngine}
 */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename(req, file, cb) {
    const safe = safeBaseName(file.originalname);
    cb(null, `${Date.now()}-${safe}`);
  },
});

/**
 * Multer file filter that rejects non-image uploads.
 *
 * @param {import('express').Request} req Incoming request.
 * @param {Express.Multer.File} file The file being filtered.
 * @param {import('multer').FileFilterCallback} cb Filter callback.
 * @returns {void}
 */
function imageFilter(req, file, cb) {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image.'));
  }
}

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

/**
 * Multer storage for work files: writes into the uploads/work subdirectory.
 * @type {import('multer').StorageEngine}
 */
const workStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(UPLOADS_DIR, WORK_SUBDIR);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const safe = safeBaseName(file.originalname);
    cb(null, `${Date.now()}-${safe}`);
  },
});

/**
 * Multer file filter that accepts only allowed work file types (PDF/video).
 *
 * @param {import('express').Request} req Incoming request.
 * @param {Express.Multer.File} file The file being filtered.
 * @param {import('multer').FileFilterCallback} cb Filter callback.
 * @returns {void}
 */
function workFilter(req, file, cb) {
  if (ALLOWED_WORK_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload a PDF or video.'));
  }
}

const workUpload = multer({
  storage: workStorage,
  fileFilter: workFilter,
  limits: { fileSize: MAX_WORK_UPLOAD_BYTES },
});

/**
 * Creates and returns the upload API router.
 *
 * @returns {import('express').Router} Configured Express router.
 */
function createUploadRouter() {
  const router = express.Router();

  router.post('/upload', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const url = `${UPLOADS_URL_PREFIX}/${req.file.filename}`;
      res.json({ ok: true, url });
    });
  });

  router.post('/upload-file', (req, res) => {
    workUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const url = `${UPLOADS_URL_PREFIX}/${WORK_SUBDIR}/${req.file.filename}`;
      res.json({ ok: true, url });
    });
  });

  return router;
}

module.exports = {
  createUploadRouter,
};
