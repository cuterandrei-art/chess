// Build the Netlify/PWA bundle from work/openingtrainer.html.
// Usage: node build-netlify.mjs [newSwVersion]   (e.g. node build-netlify.mjs 43)
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from 'fs';
import { puzzleSplit } from './build/puzzles.mjs';

const app = readFileSync('work/openingtrainer.html', 'utf8');
const head = readFileSync('build/pwa-head.html', 'utf8');
const sw = readFileSync('build/pwa-sw.html', 'utf8');

// inject the PWA <head> block right after the viewport meta
const vpEnd = app.indexOf('>', app.indexOf('<meta name="viewport"')) + 1;
let idx = app.slice(0, vpEnd) + '\n' + head + app.slice(vpEnd);
// inject the service-worker + install-button script before </body>
idx = idx.replace('</body>', sw + '\n</body>');

// the puzzles go beside the page, not in its script: fetched after the first
// screen instead of parsed before it (see build/puzzles.mjs)
const split = puzzleSplit(idx);
idx = split.html;
writeFileSync('netlify/puzzles.json', split.json);
writeFileSync('netlify/index.html', idx);
copyFileSync('work/openingtrainer.html', 'netlify/openingtrainer.html');

// the analysis engine (Stockfish 19 lite) is served beside the page, and the
// service worker keeps it for offline use
mkdirSync('netlify/engine', { recursive: true });
for (const f of readdirSync('build/engine')) copyFileSync('build/engine/' + f, 'netlify/engine/' + f);

// bump the service-worker cache version if requested
const ver = process.argv[2];
if (ver) {
  const swjs = readFileSync('netlify/sw.js', 'utf8').replace(/opening-trainer-v\d+/g, 'opening-trainer-v' + ver);
  writeFileSync('netlify/sw.js', swjs);
}
console.log('netlify/index.html =', idx.length, 'bytes' + (ver ? ('  (sw cache v' + ver + ')') : ''));
