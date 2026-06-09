/**
 * YouTube URL helpers for embedding videos in project detail pages.
 */

'use strict';

/**
 * Regex pattern for extracting a video ID from a standard watch URL (`?v=`).
 * Use case: `https://www.youtube.com/watch?v=VIDEO_ID`
 * @type {RegExp}
 */
const WATCH_QUERY_PATTERN = /[?&]v=([^&#]+)/;

/**
 * Regex pattern for extracting a video ID from a YouTube Shorts path.
 * Use case: `https://www.youtube.com/shorts/VIDEO_ID`
 * @type {RegExp}
 */
const SHORTS_PATH_PATTERN = /\/shorts\/([^/?&#]+)/;

/**
 * Regex pattern for extracting a video ID from a youtu.be short link.
 * Use case: `https://youtu.be/VIDEO_ID`
 * @type {RegExp}
 */
const YOUTU_BE_PATTERN = /youtu\.be\/([^/?&#]+)/;

/**
 * Regex pattern for extracting a video ID from an embed URL path.
 * Use case: `https://www.youtube.com/embed/VIDEO_ID`
 * @type {RegExp}
 */
const EMBED_PATH_PATTERN = /\/embed\/([^/?&#]+)/;

/**
 * Base URL used to build YouTube iframe embed sources.
 * Use case: append a extracted video ID when rendering project work embeds.
 * @type {string}
 */
const YOUTUBE_EMBED_BASE_URL = 'https://www.youtube.com/embed/';

/**
 * Extracts a YouTube video ID from common public URL formats.
 *
 * @param {string} url A YouTube watch, Shorts, youtu.be, or embed URL.
 * @returns {string|null} The 11-character video ID, or null when not found.
 */
function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  const patterns = [
    SHORTS_PATH_PATTERN,
    EMBED_PATH_PATTERN,
    YOUTU_BE_PATTERN,
    WATCH_QUERY_PATTERN,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Builds a YouTube iframe embed URL from a public YouTube link.
 *
 * @param {string} url A YouTube watch, Shorts, youtu.be, or embed URL.
 * @returns {string|null} The embed URL, or null when the video ID cannot be parsed.
 */
function buildYouTubeEmbedUrl(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }
  return `${YOUTUBE_EMBED_BASE_URL}${videoId}`;
}

module.exports = {
  YOUTUBE_EMBED_BASE_URL,
  extractYouTubeVideoId,
  buildYouTubeEmbedUrl,
};
