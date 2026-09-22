import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {BOTS,botById,botGallery,STYLES,styleById,app,startPlay,botRating,ratingInFormat,store};')();

ok(X.BOTS.length>=8,'a roster of characters exists ('+X.BOTS.length+')');
ok(X.BOTS.every(b=>b.id&&b.name&&b.emoji&&b.elo>0&&b.style&&b.banter&&b.tempo>0),'every bot has id/name/emoji/elo/style/banter/tempo');
ok(new Set(X.BOTS.map(b=>b.id)).size===X.BOTS.length,'bot ids are unique');
const styleIds=new Set(X.STYLES.map(s=>s.id));
ok(X.BOTS.every(b=>styleIds.has(b.style)),'every bot style maps to a real engine style');
const elos=X.BOTS.map(b=>b.elo);
ok(Math.min(...elos)<1000 && Math.max(...elos)>2500,'roster spans beginner to super-GM strength ('+Math.min(...elos)+'–'+Math.max(...elos)+')');

const gal=X.botGallery();
ok(/Play a character/.test(gal)&&X.BOTS.every(b=>gal.includes(b.name))&&/data-act="botstart"/.test(gal),'gallery renders every character with a start button');

// starting a bot game sets app.playBot with the engine Elo + style, and a named title
const bot=X.botById('ade');
X.startPlay(new Chess().fen(),'w',null,'test',{bot});
ok(X.app.playBot&&X.app.playBot.id==='ade'&&X.app.playBot.elo===2100&&X.app.playBot.style==='aggressive','startPlay wires the bot (elo+style) into the game');

// source: engineMove honors the bot's rating *in this format* plus their style
ok(/if\(app\.playBot\)\{lvl=\{elo:botRating\(app\.playBot,cat\),mt:700,style:app\.playBot\.style\}/.test(script),'engine plays at the bot’s rating for this time control, and their style');

// every character is a different player at each speed, and the gap closes at the top
for (const b of X.BOTS) {
  const cl=X.botRating(b,'classical'), rp=X.botRating(b,'rapid'), bz=X.botRating(b,'blitz'), bu=X.botRating(b,'bullet');
  if(!(cl===b.elo && rp<=cl && bz<=rp && bu<=bz)) throw new Error('FAIL: '+b.name+' format ladder '+[cl,rp,bz,bu]);
}
pass++; console.log('  ✓ every character is rated lower the faster the game gets');
const weakGap=X.botRating(X.BOTS[0],'classical')-X.botRating(X.BOTS[0],'blitz');
const eliteGap=X.botRating(X.BOTS[X.BOTS.length-1],'classical')-X.botRating(X.BOTS[X.BOTS.length-1],'blitz');
ok(weakGap>eliteGap,'the beginner loses far more at speed chess than the super-GM does ('+weakGap+' vs '+eliteGap+')');

// the gallery shows all three ratings so you can pick an opponent for the format
const gal3=X.botGallery();
ok(gal3.includes(String(X.botRating(X.BOTS[3],'blitz')))&&gal3.includes(String(X.botRating(X.BOTS[3],'rapid'))),'the gallery shows each character’s classical, rapid and blitz ratings');

console.log('\n✅ bots: '+pass+' checks passed');
