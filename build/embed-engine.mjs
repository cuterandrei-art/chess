// Put the Stockfish 19 analysis engine inside an HTML file, so it runs with no
// network and no files beside it: the standalone build and the Android app
// (whose WebView cannot fetch file:// URLs from a worker).
// Usage as a module: import { embedEngine } from './build/embed-engine.mjs'
// Usage from the shell: node build/embed-engine.mjs path/to/index.html
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const here = dirname(fileURLToPath(import.meta.url));
export function embedEngine(html) {
  if (html.includes('window.__SF19=')) return html;               // already in
  const js = readFileSync(join(here, 'engine', 'stockfish-19-lite-single.js'), 'utf8');
  const wasm = readFileSync(join(here, 'engine', 'stockfish-19-lite-single.wasm')).toString('base64');
  const data = JSON.stringify({ js, wasm }).replace(/<\//g, '<\\/');
  const tag = '<script>/* Stockfish 19 lite (GPLv3, https://github.com/nmrugg/stockfish.js) — the analysis engine, embedded */window.__SF19=' + data + ';</script>\n';
  const at = html.indexOf('<script type="module">');
  if (at < 0) throw new Error('module script not found');
  return html.slice(0, at) + tag + html.slice(at);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const f = process.argv[2];
  if (!f) { console.error('usage: node build/embed-engine.mjs file.html'); process.exit(1); }
  const before = readFileSync(f, 'utf8'), after = embedEngine(before);
  writeFileSync(f, after);
  console.log(f + ': engine embedded (+' + Math.round((after.length - before.length) / 1024) + ' KB)');
}
