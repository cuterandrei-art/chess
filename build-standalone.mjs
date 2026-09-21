// Build a genuinely standalone Chess Career: one HTML file that needs no
// network at all. Usage: node build-standalone.mjs [out.html]
//
// work/openingtrainer.html already bundles the rules engine and all 25,000
// puzzles inline, but it still reaches out for two things: the piece graphics
// (lichess CDN) and the web font (Google Fonts). Offline, the pieces fall back
// to Unicode glyphs via pieceErr() — it works, but it isn't the real board.
//
// This build inlines a full piece set as data URIs, makes it the default, and
// drops the font links so nothing is requested over the wire. Stockfish is
// deliberately left on its CDN: it is only needed to play the engine, the
// eval bar and Game Review, and the app already degrades cleanly without it.
import { readFileSync, writeFileSync } from 'fs';

const SRC = 'work/openingtrainer.html';
const OUT = process.argv[2] || 'ChessCareer-standalone.html';
const NAMES = ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'];

let html = readFileSync(SRC, 'utf8');
const before = html.length;

// --- 1. the piece set, inlined as data URIs -------------------------------
const data = {};
for (const n of NAMES) {
  const svg = readFileSync(`build/pieces/${n}.svg`);
  if (!/svg/i.test(svg.slice(0, 200).toString())) throw new Error(`build/pieces/${n}.svg is not an SVG`);
  data[n] = 'data:image/svg+xml;base64,' + svg.toString('base64');
}
const decl = 'const PIECE_DATA=' + JSON.stringify(data) + ';\n';

const setsAnchor = 'const PIECE_SETS={';
if (!html.includes(setsAnchor)) throw new Error('PIECE_SETS not found');
html = html.replace(setsAnchor,
  decl + setsAnchor + "\n  bundled:{label:'Classic (bundled — works offline)',ext:'svg',data:true},");

// --- 2. teach pieceImg to read them ---------------------------------------
const imgAnchor = "  if(set.glyph)return '<span class=\"piece '+color+'\">'+g+'</span>';";
if (!html.includes(imgAnchor)) throw new Error('pieceImg glyph branch not found');
html = html.replace(imgAnchor, imgAnchor +
  "\n  if(set.data){const k=color+type.toUpperCase();if(PIECE_DATA[k])return '<img class=\"pc\" draggable=\"false\" alt=\"\" src=\"'+PIECE_DATA[k]+'\" data-c=\"'+color+'\" data-g=\"'+g+'\" onerror=\"pieceErr(this)\">';}");

// --- 3. default to the bundled set ----------------------------------------
// the app's default is cburnett, which is exactly the set bundled here, so the
// standalone looks identical to the hosted build — it just stops fetching it.
if (!html.includes("pieces:'cburnett'")) throw new Error("default piece setting not found");
html = html.replace("pieces:'cburnett'", "pieces:'bundled'");

// --- 4. no font requests --------------------------------------------------
html = html
  .replace(/<link rel="preconnect"[^>]*>/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '');

// --- 5. prove it: nothing left that the page loads on its own -------------
// Resource loads are what matter: <script src>, <img src>, <iframe src> and
// <link href>. Plain <a href> links are fine — they are places the user can
// choose to go, not things the page fetches to render itself.
const loadBearing = [
  ...[...html.matchAll(/<(?:script|img|iframe|source|audio|video)\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map(m => m[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi)].map(m => m[1]),
];
if (loadBearing.length) throw new Error('standalone still loads at render time: ' + loadBearing.join(', '));

writeFileSync(OUT, html);
const kept = [...new Set([...html.matchAll(/https?:\/\/[a-z0-9.-]+/gi)].map(m => m[0].toLowerCase()))];
console.log(`${OUT} = ${html.length} bytes (source ${before}, +${html.length - before} for ${NAMES.length} inlined pieces)`);
const links = [...new Set([...html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi)].map(m => m[1].split('?')[0]))];
console.log('no resource is fetched to render the page. Still referenced:');
console.log('  on demand (only if you use the feature): the Stockfish CDN, the Lichess study API');
if (links.length) console.log('  as links you can tap: ' + links.join(', '));
console.log('hosts appearing anywhere in the file:');
for (const u of kept.sort()) console.log('  ' + u);
