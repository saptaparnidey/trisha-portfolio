/**
 * Content management API.
 *
 * Exposes endpoints for the admin panel to read the full content document,
 * save it back, perform project create/delete operations, and trigger a
 * publish (static site regeneration). All routes assume authentication has
 * already been enforced by {@link auth.requireAuth} upstream.
 */

'use strict';

const express = require('express');
const { readContent, writeContent } = require('../content-store');
const { generateSite } = require('../generator');
const { uniqueSlug } = require('../utils/slug');

/**
 * Builds a default detail object for a freshly created project.
 *
 * @param {string} title The project title.
 * @param {string} description The card description, reused as the intro.
 * @returns {{heroImage: string, intro: string, bodyHtml: string, externalLink: string}}
 */
function buildDefaultDetail(title, description) {
  return {
    heroImage: '',
    intro: description || '',
    bodyHtml: `<p>Write the full details for "${title}" here.</p>`,
    externalLink: '',
  };
}

/**
 * Collects the set of slugs currently in use across all projects.
 *
 * @param {object[]} projects The projects array.
 * @returns {Set<string>} Set of existing slugs.
 */
function collectSlugs(projects) {
  return new Set(projects.map((p) => p.slug));
}

/**
 * Creates and returns the content API router.
 *
 * @returns {import('express').Router} Configured Express router.
 */
function createContentRouter() {
  const router = express.Router();

  router.get('/content', (req, res) => {
    try {
      res.json(readContent());
    } catch (err) {
      res.status(500).json({ error: `Failed to read content: ${err.message}` });
    }
  });

  router.put('/content', (req, res) => {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object' || !incoming.portfolio) {
      return res.status(400).json({ error: 'Invalid content payload' });
    }
    try {
      const usedSlugs = new Set();
      for (const project of incoming.portfolio.projects || []) {
        if (!project.slug) {
          project.slug = uniqueSlug(project.title || 'project', usedSlugs);
        }
        if (!project.id) {
          project.id = project.slug;
        }
        usedSlugs.add(project.slug);
      }
      const usedClientIds = new Set();
      for (const client of (incoming.clients && incoming.clients.items) || []) {
        if (!client.id) {
          client.id = uniqueSlug(client.name || 'client', usedClientIds);
        }
        usedClientIds.add(client.id);
      }
      if (incoming.resume && incoming.resume.items) {
        const usedResumeIds = new Set();
        for (const item of incoming.resume.items) {
          if (!item.id) {
            item.id = uniqueSlug(item.label || item.fileName || 'resume', usedResumeIds);
          }
          usedResumeIds.add(item.id);
        }
      }
      writeContent(incoming);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to save content: ${err.message}` });
    }
  });

  router.post('/projects', (req, res) => {
    try {
      const content = readContent();
      const { title, category, description } = req.body || {};
      const projects = content.portfolio.projects;
      const slug = uniqueSlug(title || 'project', collectSlugs(projects));
      const project = {
        id: slug,
        slug,
        category: category || 'SEO Content',
        title: title || 'New Project',
        description: description || '',
        cardImage: '',
        cardImageAlt: title || 'New Project',
        detail: buildDefaultDetail(title || 'New Project', description),
      };
      projects.push(project);
      writeContent(content);
      res.json({ ok: true, project });
    } catch (err) {
      res.status(500).json({ error: `Failed to add project: ${err.message}` });
    }
  });

  router.delete('/projects/:id', (req, res) => {
    try {
      const content = readContent();
      const before = content.portfolio.projects.length;
      content.portfolio.projects = content.portfolio.projects.filter(
        (p) => p.id !== req.params.id && p.slug !== req.params.id,
      );
      if (content.portfolio.projects.length === before) {
        return res.status(404).json({ error: 'Project not found' });
      }
      writeContent(content);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to delete project: ${err.message}` });
    }
  });

  router.post('/publish', async (req, res) => {
    try {
      const result = await generateSite();
      res.json({ ok: true, pages: result.pages });
    } catch (err) {
      res.status(500).json({ error: `Publish failed: ${err.message}` });
    }
  });

  return router;
}

module.exports = {
  createContentRouter,
};
