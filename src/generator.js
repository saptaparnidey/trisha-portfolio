/**
 * Static site generator.
 *
 * Reads the editable content and renders the EJS templates into the `dist/`
 * directory as plain, non-editable HTML: the main portfolio page plus one
 * detail page per project. Uploaded images are copied alongside so the output
 * is fully self-contained and deployable to any static host.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const {
  TEMPLATES_DIR,
  DIST_DIR,
  PROJECTS_SUBDIR,
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
} = require('./config');
const { readContent } = require('./content-store');

/**
 * Relative path prefix from a project detail page back to the site root.
 * Detail pages live in a subdirectory, so they reach root assets via "../".
 * @type {string}
 */
const PROJECT_ROOT_PREFIX = '../';

/**
 * Recursively copies a directory's contents into a destination directory.
 *
 * @param {string} srcDir Source directory to copy from.
 * @param {string} destDir Destination directory to copy into.
 * @returns {void}
 */
function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Renders an EJS template file with the supplied data.
 *
 * @param {string} templateName File name of the template within the templates dir.
 * @param {object} data Data object passed to the template.
 * @returns {Promise<string>} The rendered HTML string.
 */
function renderTemplate(templateName, data) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  return ejs.renderFile(templatePath, data, { async: false });
}

/**
 * Generates the full static site into {@link config.DIST_DIR}.
 *
 * Produces `index.html`, a `projects/<slug>.html` for every project, and copies
 * uploaded images into `dist<UPLOADS_URL_PREFIX>` so root-relative `/uploads/...`
 * paths resolve in the generated site.
 *
 * @returns {Promise<{pages: number}>} Summary including the number of pages written.
 */
async function generateSite() {
  const content = readContent();

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const projectsDir = path.join(DIST_DIR, PROJECTS_SUBDIR);
  fs.mkdirSync(projectsDir, { recursive: true });

  const indexHtml = await renderTemplate('index.ejs', {
    site: content.site,
    hero: content.hero,
    about: content.about,
    portfolio: content.portfolio,
    contact: content.contact,
    footer: content.footer,
    projectsSubdir: PROJECTS_SUBDIR,
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');

  let pages = 1;
  for (const project of content.portfolio.projects) {
    const projectHtml = await renderTemplate('project.ejs', {
      site: content.site,
      footer: content.footer,
      project,
      rootPrefix: PROJECT_ROOT_PREFIX,
    });
    fs.writeFileSync(
      path.join(projectsDir, `${project.slug}.html`),
      projectHtml,
      'utf8',
    );
    pages += 1;
  }

  const uploadsDest = path.join(DIST_DIR, UPLOADS_URL_PREFIX.replace(/^\//, ''));
  copyDirRecursive(UPLOADS_DIR, uploadsDest);

  return { pages };
}

module.exports = {
  generateSite,
};
