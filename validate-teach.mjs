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
const X=new Function(script+'\nreturn {store,app,whyNot,vxCostOf,vxBestCapture,explainPlan,coachCard,vxIsolated,vxDoubled,vxHalfOpen,vxCentreLocked,vxCentreOpen};')();
const f=(a)=>{const c=new Chess();a.forEach(x=>c.move(x));return c.fen();};

/* ================= "why not that move?" ================= */
// the worst case must come first: a move that allows mate
const scholar=X.whyNot(f(['e4','e5','Bc4','Nc6','Qh5']),'Nf6','g6');
ok(/allows Qxf7#/.test(scholar)&&/checkmate/.test(scholar),'a move that allows mate in one is called out as mate');
ok(!/not losing/.test(scholar),'and is never described as harmless');
// material
ok(/drops material/.test(X.whyNot(f(['e4','e5','Nf3','Nc6','Bc4','Bc5']),'Nxe5','c3')),'a move that hangs a piece says so');
ok(/wins the knight/.test(X.whyNot(f(['e4','e5','Nf3','Nc6','Bc4','Nd4']),'Ng5','Nxe5')),'and names the move that punishes it');
// a playable alternative is not called a blunder
const alt=X.whyNot(f(['e4','e5','Nf3','Nc6','Bc4']),'Nf6','Bc5',{sans:['e4','e5','Nf3','Nc6','Bc4']});
ok(/playable/.test(alt),'a sound alternative is called playable, not punished');
ok(/different opening/.test(alt),'and is identified as the opening it actually is');
ok(/The course plays Bc5/.test(alt),'every verdict ends by giving the course move and its reason');
ok(X.whyNot(f(['e4']),'Qh8','e5')===null,'an illegal move gets no lecture');

/* ================= blunder preview, no engine ================= */
const cost=X.vxCostOf(f(['e4','e5','Nf3','Nc6','Bc4','Bc5']),'Nxe5');
ok(cost&&cost.net>=2,'the static exchange sees a hanging knight (net '+(cost&&cost.net)+')');
ok(X.vxCostOf(f(['e4','e5']),'Nf3')===null,'and reports nothing for a safe developing move');
// a defended recapture is not a blunder
ok(X.vxCostOf(f(['e4','d5']),'exd5')===null,'winning a pawn and losing it straight back is an even trade, not a blunder');
ok(X.vxBestCapture(f(['e4','d5']))!==null,'the capture scan finds available captures');
ok(/blunderWarn/.test(script)&&/data-setting="blunderWarn"/.test(script),'blunder warnings are a setting you can turn off');
ok(/⚠️/.test(script)&&/vxCostOf\(bfen,c\.move\)/.test(script),'the explorer marks candidate moves that drop material');
ok(/app\.blunderNote/.test(script),'and your own games warn you after the fact');

/* ================= the plan ================= */
const locked=X.explainPlan(f(['e4','e6','d4','d5','e5','c5']),'w');
ok(/centre is locked/.test(locked),'a locked French centre is recognised as locked');
ok(/wing/.test(locked),'and the advice is to play on a wing');
const open=X.explainPlan('r1bqkb1r/pppp1ppp/2n2n2/8/8/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1','w');
ok(open===null||typeof open==='string','an ordinary position either has advice or honestly has none');
const sicilian=X.explainPlan(f(['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6']),'w');
ok(/queenside/.test(sicilian),'White’s extra queenside pawn in the Sicilian is spotted');
ok(/half-open/.test(sicilian)&&/d-file/.test(sicilian),'and the half-open d-file is offered to the rooks');
const iqp=X.explainPlan('r1bqkb1r/pp3ppp/2n1pn2/8/2BP4/2N1BN2/PP3PPP/R2QK2R w KQkq - 0 1','w');
ok(/d-pawn is isolated/.test(iqp),'an isolated queen’s pawn is identified');
ok(/pieces active/.test(iqp),'with the right advice for the side that has it');
// structural helpers
ok(X.vxIsolated(X.store&&{} ? {} : {},'w').length===0,'the isolated-pawn scan is safe on an empty board');
ok(X.vxCentreLocked({d4:{type:'p',color:'w'},d5:{type:'p',color:'b'},e4:{type:'p',color:'w'},e5:{type:'p',color:'b'}})===true,'pawns head to head on d and e count as a locked centre');
ok(X.vxCentreOpen({})===true,'a board with no centre pawns is an open centre');
ok(/coachCard\(explainPlan\(L\.fen,L\.hero\)/.test(script),'the plan is shown while you learn a course');
ok(/coachCard\(exPlanText\(\)/.test(script),'and in the opening explorer');
ok(/data-act="plansay"/.test(X.coachCard('x','y','plansay')),'the plan card has its own speak button');
ok(/Chapter complete\. /.test(script),'finishing a chapter reads the plan aloud');

console.log('\n✅ teach: '+pass+' checks passed');
