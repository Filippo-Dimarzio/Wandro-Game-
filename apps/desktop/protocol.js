// Serves the bundled web app from app://wandro/ with single-page-app fallback, so client-side
// routes like app://wandro/explore load index.html. Kept separate from main.js for testing.
const path = require('node:path');

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

/** Maps a request URL to a file inside webRoot; unknown paths fall back to index.html. */
function resolveFile(webRoot, requestUrl, exists) {
  const { pathname } = new URL(requestUrl);
  const decoded = decodeURIComponent(pathname);
  const candidate = path.normalize(path.join(webRoot, decoded));
  // Never serve anything outside the bundled web folder.
  if (
    !candidate.startsWith(path.normalize(webRoot + path.sep)) &&
    candidate !== path.normalize(webRoot)
  ) {
    return path.join(webRoot, 'index.html');
  }
  if (path.extname(candidate) && exists(candidate)) return candidate;
  return path.join(webRoot, 'index.html');
}

function contentType(file) {
  return TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
}

module.exports = { resolveFile, contentType };
