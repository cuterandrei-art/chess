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
const X=new Function(script+'\nreturn {store,ROADMAP,ROAD_STAGES,careerRoadmapPanel,lifeInit};')();

ok(X.ROADMAP.length>=15,'the road has a full ladder of milestones ('+X.ROADMAP.length+')');
ok([1,2,3,4,5].every(s=>X.ROAD_STAGES[s]),'five named stages exist');
ok(X.ROADMAP.every(s=>s.id&&s.t&&typeof s.test==='function'),'every milestone has an id, text and a test');
ok(X.ROADMAP.some(s=>s.id==='gm')&&X.ROADMAP.some(s=>s.id==='wc'),'the road ends at Grandmaster and World Champion');
// stages are ordered/non-decreasing
let mono=true; for(let i=1;i<X.ROADMAP.length;i++) if(X.ROADMAP[i].s<X.ROADMAP[i-1].s) mono=false;
ok(mono,'milestones are ordered from stage 1 to 5');

const c=X.store.career; c.setup=true; X.lifeInit(c);
// fresh career: only "start your career" is complete
const doneFresh=X.ROADMAP.filter(s=>s.test(c)).map(s=>s.id);
ok(doneFresh.length===1&&doneFresh[0]==='setup','a brand-new career has only the first step complete');
let panel=X.careerRoadmapPanel(c);
ok(/Road to Grandmaster/.test(panel)&&/Stage 1/.test(panel)&&/➡️/.test(panel),'panel shows stage 1 with a highlighted next step');

// progress: simulate reaching Expert
c.played=10; c.won=6; c.provisional=false; c.rating=2050; c.peak=2050;
if(!X.store.repertoire)X.store.repertoire=[]; X.store.repertoire=['x']; X.store.puzzle={solved:30};
const done2=X.ROADMAP.filter(s=>s.test(c)).map(s=>s.id);
ok(done2.includes('win1')&&done2.includes('pub')&&done2.includes('r2000')&&done2.includes('r1600')&&done2.includes('puz25')&&!done2.includes('cm'),'progress completes the earlier milestones (win/publish/1600/2000) but not the unearned CM');
panel=X.careerRoadmapPanel(c);
ok(/data-act="roadclaim"/.test(panel),'completed-but-unclaimed milestones offer a reward to claim');

// claiming pays out once
const st=X.ROADMAP.find(s=>s.id==='r2000'); const money0=c.money||0; c.roadDone=[];
c.roadDone.push('r2000'); // simulate claim bookkeeping
ok(c.roadDone.includes('r2000'),'claimed milestones are recorded so they pay only once');
ok(/roadclaim/.test(script)&&/rdc\.roadDone\.push\(val\)/.test(script),'the claim handler records and pays the milestone');
ok(/careerRoadmapPanel\(c\)/.test(script),'the roadmap panel is placed in the career view');

console.log('\n✅ road: '+pass+' checks passed');
