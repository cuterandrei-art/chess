// Startup: the opening courses are built when first needed, not at launch, and a
// build gives exactly what the old eager build gave.   node validate-startup.mjs
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'https://example.test/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const boot=()=>new Function(script+'\nreturn {store,app,render,go,BASE,BUILT,byId,OPENINGS,buildOpening,buildTree,lazyOpening,openingBuilt,warmOpenings,get built(){return openingsBuilt;}};')();
const LS='opening-trainer-standalone-v1';

/* ================= launch builds nothing it does not show ================= */
localStorage.clear();
let t0=performance.now();
let X=boot();
const newMs=performance.now()-t0;
ok(X.BASE.length===X.OPENINGS.length&&X.BASE.length>=20,'every built-in course is still listed ('+X.BASE.length+')');
ok(X.built===0,'a first launch builds no course at all (built '+X.built+')');
ok(X.BASE.every(o=>o.id&&o.name&&o.side&&o.category),'names, sides and categories are there without building anything');
ok(X.built===0,'reading them did not build anything either');

localStorage.clear();
const rep=[X.BASE[0].id,X.BASE[5].id,X.BASE[11].id];
localStorage.setItem(LS,JSON.stringify({repertoire:rep,onboarded:true}));
X=boot();
ok(X.built<=rep.length,'a returning player’s first screen builds only their '+rep.length+' repertoire courses (built '+X.built+')');
X.go('career');
ok(X.built<=rep.length,'the career screen builds nothing more (built '+X.built+')');

/* ================= a build is exactly the old build ================= */
// the eager builder this replaced, verbatim apart from names: chess.js's public API only
function mergeLines(lines,comments={}){const roots=[];
  for(const ln of lines){let level=roots,prefix='';
    for(const mv of ln.trim().split(/\s+/)){if(!mv)continue;prefix=prefix?prefix+' '+mv:mv;
      let n=level.find(x=>x.move===mv);
      if(!n){n={move:mv,comment:comments[prefix],children:[]};level.push(n);}
      else if(comments[prefix]&&!n.comment)n.comment=comments[prefix];
      level=n.children;}}
  return roots;}
function refBuild(def){const chess=new Chess();
  const root={move:null,fen:chess.fen(),fenBefore:null,from:null,to:null,ply:0,comment:null,children:[]};
  const tree=mergeLines(def.lines,def.comments||{});let depth=0;
  function build(d,ply){const fenBefore=chess.fen();const m=chess.move(d.move);
    const node={move:m.san,from:m.from,to:m.to,fen:chess.fen(),fenBefore,ply,comment:d.comment||null,children:[]};
    if(ply>depth)depth=ply;for(const c of d.children)node.children.push(build(c,ply+1));chess.undo();return node;}
  for(const t of tree)root.children.push(build(t,1));
  const ht=def.side==='white'?'w':'b',byFen=new Map();
  (function walk(n){for(const ch of n.children){if(ch.fenBefore&&ch.fenBefore.split(' ')[1]===ht){const fen=ch.fenBefore;
    if(!byFen.has(fen))byFen.set(fen,{id:def.id+'::'+fen,fen,move:ch.move,from:ch.from,to:ch.to,ply:ch.ply-1,comment:ch.comment});}walk(ch);}})(root);
  const cards=[...byFen.values()];return {root,depth,cards,cardCount:cards.length};}

localStorage.clear();X=boot();
t0=performance.now();const refs=X.OPENINGS.map(refBuild);const refMs=performance.now()-t0;
t0=performance.now();for(const o of X.BASE)void o.cards;const fastMs=performance.now()-t0;
let nodes=0,diff=[];
X.BASE.forEach((o,i)=>{const r=refs[i];(function c(n){nodes++;n.children.forEach(c);})(r.root);
  if(JSON.stringify({root:o.root,depth:o.depth,cards:o.cards,cardCount:o.cardCount})!==JSON.stringify(r))diff.push(o.id);});
ok(diff.length===0,'every node of every course — move, squares, both FENs, ply, comment — matches the old build ('+nodes+' nodes)'+(diff.length?' — differs: '+diff.join(', '):''));
ok(X.BASE.every(o=>o.cardCount===o.cards.length&&o.cards.length>0),'every course has its drill cards');
ok(X.BASE.every(o=>X.byId.get(o.id)===o),'the lookup table points at the same course objects');
console.log('    (all courses: old build '+refMs.toFixed(0)+' ms, new build '+fastMs.toFixed(0)+' ms, first launch '+newMs.toFixed(0)+' ms)');
ok(fastMs*1.5<refMs,'building them is at least 1.5× faster than before ('+(refMs/fastMs).toFixed(1)+'×)');

/* ================= lazy objects behave like plain ones ================= */
localStorage.clear();X=boot();
const one=X.BASE[3];
ok(!X.openingBuilt(one),'untouched course is not built');
const cards=one.cards;
ok(X.openingBuilt(one)&&X.built===1,'reading its cards builds that one course only');
ok(one.cards===cards&&one.root.children.length>0,'and later reads return the same objects, not a rebuild');
const copy=Object.assign({},X.BASE[4]);
ok(copy.root&&Array.isArray(copy.cards),'copying a course copies its built tree');
const w=X.BASE[6];w.cards=[];
ok(X.openingBuilt(w)&&w.cards.length===0,'writing to a lazy field builds first, then keeps the write');

/* ================= custom openings still validated up front ================= */
let err=null;try{X.buildOpening({id:'bad',name:'Bad',side:'white',category:'x',lines:['e4 e5 Ke3']});}catch(ex){err=ex;}
ok(err&&/Illegal Ke3 in bad/.test(err.message),'an illegal move in a custom opening is still refused with the move named');
const good=X.buildOpening({id:'mine',name:'Mine',side:'white',category:'x',lines:['e4 e5 Nf3 Nc6','e4 c5 Nf3']});
ok(good.cardCount===3&&good.root.children[0].move==='e4','a legal custom opening is built at once (3 White decisions)');
ok(JSON.stringify(X.buildTree({id:'p',lines:['e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 Bf5 Bc4 e6 Bd2 c6 Nd5 Qd8 Nxf6+ gxf6']}))===JSON.stringify((({root,depth})=>({root,depth}))(refBuild({id:'p',side:'white',lines:['e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 Bf5 Bc4 e6 Bd2 c6 Nd5 Qd8 Nxf6+ gxf6']}))),'checks, captures and disambiguation come out in the same notation');
ok(X.buildTree({id:'c',lines:['e4 e5 Nf3 Nc6 Bc4 Bc5 O-O Nf6 d3 O-O']}).depth===10,'castling both sides builds');
ok(X.buildTree({id:'q',lines:['e4 d5 exd5 c6 dxc6 Nf6 cxb7 Nbd7 bxa8=Q']}).root.children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].move==='bxa8=Q','promotion builds');

/* ================= the rest are built while idle ================= */
localStorage.clear();X=boot();
X.warmOpenings(0);
const until=Date.now()+20000;
while(X.BASE.some(o=>!X.openingBuilt(o))&&Date.now()<until)await new Promise(r=>setTimeout(r,20));
ok(X.BASE.every(o=>X.openingBuilt(o)),'the idle warm-up builds every course once the first screen is up');
ok(/\nrender\(\);\nwarmOpenings\(\);\n<\/script>/.test(html.slice(e-40,e+20))||/render\(\);\s*warmOpenings\(\);\s*$/.test(script),'the warm-up is started after the first render, not before it');
X.go('library');
ok(/Opening Library/.test(document.body.innerHTML),'the library still renders every course');

console.log('\n'+pass+' startup checks passed');
