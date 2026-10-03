import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contentType, resolveFile } = require('../protocol.js');
const root = path.join(path.sep, 'app', 'web');
const files = new Set([
  path.join(root, 'index.html'),
  path.join(root, '_expo', 'entry.js'),
  path.join(root, 'maplibre', 'maplibre-gl-worker.mjs'),
]);
const exists = (p) => files.has(p);

test('serves existing files', () => {
  assert.equal(
    resolveFile(root, 'app://wandro/_expo/entry.js', exists),
    path.join(root, '_expo', 'entry.js'),
  );
  assert.equal(
    resolveFile(root, 'app://wandro/maplibre/maplibre-gl-worker.mjs', exists),
    path.join(root, 'maplibre', 'maplibre-gl-worker.mjs'),
  );
});

test('falls back to index.html for app routes', () => {
  assert.equal(resolveFile(root, 'app://wandro/', exists), path.join(root, 'index.html'));
  assert.equal(resolveFile(root, 'app://wandro/explore', exists), path.join(root, 'index.html'));
  assert.equal(resolveFile(root, 'app://wandro/missing.js', exists), path.join(root, 'index.html'));
});

test('never escapes the web folder', () => {
  assert.equal(
    resolveFile(root, 'app://wandro/..%2F..%2Fetc%2Fpasswd', exists),
    path.join(root, 'index.html'),
  );
});

test('sets content types', () => {
  assert.equal(contentType('a.mjs'), 'text/javascript');
  assert.equal(contentType('a.css'), 'text/css');
  assert.equal(contentType('a.bin'), 'application/octet-stream');
});
