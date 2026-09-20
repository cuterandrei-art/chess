// Verify accelerated career pace + starting strength.
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';

const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length;
const e = html.indexOf('</script>', s);
let script = html.slice(s, e);
if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');

const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage;
globalThis.Chess = Chess; globalThis.confirm = () => true; globalThis.alert = () => {}; globalThis.requestAnimationFrame = (f)=>setTimeout(f,0);
globalThis.AudioContext = globalThis.webkitAudioContext = function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver = class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker = class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia) dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES = [];

let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X = new Function(script + '\nreturn {applyRatedGame,applyByFormat,paceMul,lifeInit,DEF,PACE_NAMES};')();

ok('pace' in X.DEF.career, 'DEF.career has a pace field (default '+X.DEF.career.pace+')');
ok(X.DEF.career.pace === 1, 'default pace is realistic (1)');
ok(X.PACE_NAMES[1]==='Realistic' && X.PACE_NAMES[2]==='Accelerated' && X.PACE_NAMES[3]==='Prodigy', 'three pace tiers named');

// A published 2000 player beats a 2000 opponent (score 1). Expected We≈0.5 → delta≈K*0.5.
function deltaAt(pace){ const c={rating:2000,peak:2000,provisional:false,ratedGames:40,pace}; const r0=c.rating; X.applyRatedGame(c,2000,1); return c.rating-r0; }
const d1=deltaAt(1), d2=deltaAt(2), d3=deltaAt(3);
ok(d1>0 && d2>0 && d3>0, 'a win raises rating at every pace ('+d1+'/'+d2+'/'+d3+')');
ok(Math.abs(d2-2*d1)<=1, 'Accelerated moves ~2× per game ('+d2+' vs '+d1+')');
ok(Math.abs(d3-3*d1)<=1, 'Prodigy moves ~3× per game ('+d3+' vs '+d1+')');

// Pace is symmetric: a loss falls faster too (still result-driven, not free rating).
function lossAt(pace){ const c={rating:2000,peak:2000,provisional:false,ratedGames:40,pace}; const r0=c.rating; X.applyRatedGame(c,2000,0); return c.rating-r0; }
ok(lossAt(2) < lossAt(1), 'Accelerated also drops faster on a loss (no free rating): '+lossAt(2)+' < '+lossAt(1));

// Realistic path from 2000 to elite takes many more games than Accelerated (feasibility).
function gamesToReach(target, pace){ const c={rating:2000,peak:2000,provisional:false,ratedGames:40,pace}; let n=0; while(c.rating<target && n<100000){ X.applyRatedGame(c, c.rating-40, 1); n++; } return n; }
const gReal=gamesToReach(2700,1), gAcc=gamesToReach(2700,2);
ok(gAcc < gReal, 'reaching 2700 is faster on Accelerated ('+gAcc+' games vs '+gReal+' realistic)');

// Rapid/blitz format also honors pace.
function fmtDelta(pace){ const c={rating:2000,peak:2000,provisional:false,ratedGames:40,pace,ratingRapid:2000,ratedRapid:40,peakRapid:2000}; const r0=c.ratingRapid; X.applyByFormat(c,'rapid',2000,1); return c.ratingRapid-r0; }
ok(Math.abs(fmtDelta(2)-2*fmtDelta(1))<=1, 'rapid/blitz ratings honor pace too');

console.log('\n✅ pace: '+pass+' checks passed');
