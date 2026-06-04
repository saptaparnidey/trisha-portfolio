/**
 * Slug helpers for turning project titles into URL/file-safe identifiers.
 */

'use strict';

/**
 * Fallback slug used when a title produces an empty slug (e.g. all symbols).
 * @type {string}
 */
const FALLBACK_SLUG = 'project';

/**
 * Converts arbitrary text into a lowercase, hyphenated, file-safe slug.
 *
 * @param {string} text The source text (typically a project title).
 * @returns {string} A slug containing only [a-z0-9-].
 */
function slugify(text) {
  const slug = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || FALLBACK_SLUG;
}

/**
 * Produces a slug that does not collide with any in the supplied set.
 * Appends an incrementing numeric suffix when needed (e.g. "blog-2").
 *
 * @param {string} text The source text to slugify.
 * @param {Set<string>} existingSlugs Slugs already in use.
 * @returns {string} A unique slug not present in existingSlugs.
 */
function uniqueSlug(text, existingSlugs) {
  const base = slugify(text);
  if (!existingSlugs.has(base)) {
    return base;
  }
  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}

module.exports = {
  slugify,
  uniqueSlug,
  FALLBACK_SLUG,
};
