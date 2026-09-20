import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,questsEnsure,questGen,questBump,careerQuestPanel,lifeInit,QUEST_TEMPLATES,dayKey};')();

X.store.career.setup=true; X.lifeInit(X.store.career);
const q=X.questsEnsure();
ok(q.items.length===3,'exactly 3 daily quests are generated');
ok(new Set(q.items.map(i=>i.kind)).size===3,'the 3 quests are distinct kinds');
ok(q.items.every(i=>i.goal>0&&i.xp>0&&i.cash>0&&i.prog===0&&!i.claimed),'quests start at 0 progress, unclaimed, with rewards');

// deterministic per day
const dk=X.dayKey(Date.now());
ok(JSON.stringify(X.questGen(dk))===JSON.stringify(X.questGen(dk)),'quest generation is deterministic per day (stable across renders)');
ok(JSON.stringify(X.questGen('2020-01-01'))!==JSON.stringify(X.questGen('2020-01-02')),'different days give different quests');

// progress bumping only affects matching kind, capped at goal
const before=q.items.map(i=>i.prog);
const k=q.items[0].kind; X.questBump(k, 999);
ok(q.items[0].prog===q.items[0].goal,'questBump advances the matching quest and caps at the goal');
ok(q.items.filter((i,ix)=>ix>0).every((i,ix)=>i.prog===before[ix+1]),'questBump leaves non-matching quests untouched');

// panel renders and shows a Claim button once complete
const panel=X.careerQuestPanel(X.store.career);
ok(/Daily quests/.test(panel)&&/data-act="questclaim"/.test(panel),'quest panel renders with a claimable quest');

// hooks are wired into the real functions (source-level)
ok(/questBump\('play',1\)/.test(script)&&/questBump\('win',1\)/.test(script),'game result feeds play/win quests');
ok(/questBump\('puzzle',1\)/.test(script),'solving a puzzle feeds the puzzle quest');
ok(/questBump\('event',1\)/.test(script),'finishing an event feeds the event quest');
ok(/questBump\('guess',1\)/.test(script),'a correct Guess-the-Move feeds the guess quest');

console.log('\n✅ quests: '+pass+' checks passed');
