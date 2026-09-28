// The 25,000 puzzles are 2.6 MB of the page. Written into it as JavaScript
// (window.__PUZZLES=[...]) they have to be parsed and run before the app can
// start: on a phone four times slower than a laptop that was 0.85 s of a 2.3 s
// start. The builds take them out of the page's script:
//
//  · the website puts them in puzzles.json beside the page, fetched right after
//    the first screen (and kept by the service worker for offline use);
//  · the standalone file and the Android app keep them inside the page, as
//    data the browser does not run (<script type="application/json">), read
//    after the first screen.
//
// work/openingtrainer.html keeps them as they are, so it still works on its
// own and the tests read it unchanged.
//
// Usage as a module: import { puzzleSplit, puzzlesAsData, puzzlesEmbed } from './build/puzzles.mjs'
// From the shell:    node build/puzzles.mjs embed page.html puzzles.json
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const MARK = 'window.__PUZZLES=';

/* The inline puzzle script: where it starts and ends, and the array in it. */
function find(html) {
  const at = html.indexOf(MARK);
  if (at < 0) return null;
  const start = html.lastIndexOf('<script>', at);
  const end = html.indexOf('</script>', at);
  if (start < 0 || end < 0) throw new Error('puzzle script not found whole');
  const json = html.slice(at + MARK.length, end).trim().replace(/;$/, '');
  JSON.parse(json);                                // it has to be data, not code
  return { start, end: end + '</script>'.length, json };
}
/* The page without its puzzles, and the puzzles as a JSON file. */
export function puzzleSplit(html) {
  const f = find(html);
  if (!f) throw new Error('no inline puzzles in this page');
  return { html: html.slice(0, f.start) + html.slice(f.end), json: f.json };
}
function dataTag(json) {
  return '<script type="application/json" id="pzdata">' + json.replace(/</g, '\\u003c') + '</script>';
}
/* The page with its puzzles as data, in the same place. */
export function puzzlesAsData(html) {
  if (html.includes('id="pzdata"')) return html;
  const f = find(html);
  if (!f) throw new Error('no inline puzzles in this page');
  return html.slice(0, f.start) + dataTag(f.json) + html.slice(f.end);
}
/* A page that has none (the website's) with the puzzles put back in as data. */
export function puzzlesEmbed(html, json) {
  if (html.includes('id="pzdata"')) return html;
  JSON.parse(json);
  const at = html.lastIndexOf('</body>');
  if (at < 0) throw new Error('no </body>');
  return html.slice(0, at) + dataTag(json) + '\n' + html.slice(at);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, page, data] = process.argv.slice(2);
  if (cmd !== 'embed' || !page || !data) { console.error('usage: node build/puzzles.mjs embed page.html puzzles.json'); process.exit(1); }
  const before = readFileSync(page, 'utf8'), after = puzzlesEmbed(before, readFileSync(data, 'utf8'));
  writeFileSync(page, after);
  console.log(page + ': puzzles embedded as data (+' + Math.round((after.length - before.length) / 1024) + ' KB)');
}
