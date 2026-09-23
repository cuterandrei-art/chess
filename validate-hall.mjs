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
const X=new Function(script+'\nreturn {store,app,DEF,render,HALL_KEEP,hallInit,hallList,hallEntry,hallAdd,hallBest,'+
  'hallTotals,viewHall,hallCard,hallRow,retireCareer,newCareer,careerHoF,lifeInit,freshCareer,legacyScore,'+
  'restoreBackup};')();
const C=()=>X.store.career;
function career(o){
  X.store.career=X.freshCareer();
  const c=X.store.career;
  X.lifeInit(c);                    // hands a new career a float, so set the numbers after it
  c.setup=true;c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';
  c.rating=2380;c.peak=2412;c.provisional=false;c.ratedGames=120;
  c.titles=['CM','FM','IM'];c.honors=['City Open Winner'];
  c.money=42000;c.age=34.2;c.weeks=940;c.fans=18000;
  c.played=380;c.won=190;c.drawn=120;c.lost=70;c.season=18;
  c.issues=[{no:1},{no:2},{no:3}];
  Object.assign(c,o||{});
  return c;
}
const wipe=()=>{X.store.legacy={peak:0,careers:0,hall:[]};};

/* ================= IT KEEPS THEM ================= */
wipe();
ok(X.hallList().length===0,'the hall starts empty');
career();
X.retireCareer();
ok(X.hallList().length===1,'retiring a career puts it in the hall');
let he=X.hallList()[0];
ok(he.name==='Ada Marín','under the name you played it as');
ok(he.peak===2412,'with the peak rating you reached');
ok(he.titles.join('/')==='CM/FM/IM','the titles');
ok(he.honors.length===1,'the honours');
ok(he.money===42000,'what it earned');
ok(he.years===Math.round(940/52),'how many seasons it lasted ('+he.years+')');
ok(he.age===34,'and how old you were at the end');
ok(he.games===380&&he.won===190,'the games played');
ok(he.best==='IM','the best title reached');
ok(he.verdict&&he.verdict.title,'a written verdict on the whole thing');
ok(he.score>0,'and a score, so the best one can be found');
ok(he.issues===3,'it even remembers how many magazine issues were written about it');

/* the point of it all: starting again does not erase it */
X.newCareer();
ok(X.hallList().length===1,'beginning a new career leaves the hall alone');
ok(C().name!=='Ada Marín'||!C().setup,'while the career itself starts over');
career({name:'Bo Lindqvist',peak:2210,titles:['CM','FM'],honors:[],money:8000,weeks:400});
X.retireCareer();
ok(X.hallList().length===2,'and the second career joins the first');
ok(X.hallList()[0].name==='Bo Lindqvist','newest first');
ok(X.hallList()[1].name==='Ada Marín','with the older one behind it');
ok(X.store.legacy.careers===2,'the career count keeps up');
ok(X.store.legacy.peak>=2412,'and the best peak across all of them is remembered');

/* ================= THE BEST ONE ================= */
wipe();
career({name:'Quiet One',peak:1800,titles:[],honors:[],money:400,weeks:200});
X.retireCareer();
career({name:'The Champion',peak:2790,titles:['CM','FM','IM','GM'],honors:['World Champion'],money:900000,weeks:1200});
X.retireCareer();
career({name:'Middling',peak:2300,titles:['CM','FM'],honors:[],money:20000,weeks:600});
X.retireCareer();
let best=X.hallBest();
ok(best&&best.name==='The Champion','the best career is the best one, not the latest');
ok(X.hallList()[0].name==='Middling','which is not the same as the newest');
let T=X.hallTotals();
ok(T.careers===3,'the totals count every career');
ok(T.peak===2790,'the best peak of any of them');
ok(T.champions===1,'the world championships');
ok(T.titles===6,'every title across all of them ('+T.titles+')');
ok(T.money>900000,'and everything ever earned');
ok(T.games>0&&T.years>0,'with the games and the seasons added up');

/* ================= LIMITS AND ODD DATA ================= */
wipe();
for(let i=0;i<X.HALL_KEEP+6;i++){career({name:'Career '+i,peak:1500+i});X.retireCareer();}
ok(X.hallList().length===X.HALL_KEEP,'the hall keeps the last '+X.HALL_KEEP+' careers');
ok(X.hallList()[0].name==='Career '+(X.HALL_KEEP+5),'the newest is kept');
wipe();
X.store.legacy={peak:1700,careers:3};                   // an old save, before the hall existed
ok(X.hallInit().hall.length===0,'a legacy saved before the hall existed gets an empty one');
ok(X.store.legacy.peak===1700&&X.store.legacy.careers===3,'without losing what it did remember');
X.store.legacy=null;
ok(X.hallInit()&&X.hallList().length===0,'and no legacy at all is built from nothing');
wipe();
X.store.career=X.freshCareer();                          // a career with almost nothing in it
X.store.career.name='';
X.retireCareer();
he=X.hallList()[0];
ok(he&&he.name==='You','a nameless career is still remembered, as You');
ok(he.peak===0&&he.games===0,'with honest zeroes rather than blanks');
ok(X.viewHall().indexOf('undefined')<0,'and nothing prints as undefined');

/* ================= ON SCREEN ================= */
wipe();
ok(/No career has been completed yet/.test(X.viewHall()),'with an empty hall the screen says so');
ok(X.hallCard()==='','and there is no card for it anywhere');
career();X.retireCareer();
career({name:'Bo Lindqvist',peak:2790,honors:['World Champion','Candidates Winner'],
  protege:{name:'Nia Okonkwo',peak:2605},gmsMade:2});
X.retireCareer();
let v=X.viewHall();
ok(/The hall/.test(v),'the hall has a screen');
ok(/Ada Marín/.test(v)&&/Bo Lindqvist/.test(v),'with every career on it');
ok(/BEST/.test(v),'the best one is marked');
ok(/World Champion/.test(v),'honours are shown');
ok(/Nia Okonkwo/.test(v),'a protégé is remembered by name');
ok(/GMs developed|GM developed/.test(v),'and the grandmasters you made');
ok(/Careers/.test(v)&&/Best peak/.test(v),'the totals are at the top');
ok(/data-act="nav" data-val="career"/.test(v),'with a way back');
let card=X.hallCard();
ok(/The hall/.test(card)&&/2 finished careers/.test(card),'the card counts them');
ok(/best:/.test(card),'and names the best');
ok(/data-act="nav" data-val="hall"/.test(card),'and opens it');
/* the finished-career screen offers it */
career();
C().retired=true;
X.retireCareer();
ok(/The hall \(\d+\)/.test(X.careerHoF(C())),'the end-of-career screen offers the hall');

/* ================= IT SURVIVES A RELOAD AND A BACKUP =================
   Both of these used to drop it: the boot loader rebuilt the store from a
   fixed list of keys that did not include the legacy, and neither did the
   backup. A hall that vanishes on refresh is not a hall. */
ok(/quests:d\.quests\|\|null,legacy:Object\.assign/.test(script),
  'the boot loader carries the legacy and the quests it used to drop');
ok(X.DEF.legacy&&Array.isArray(X.DEF.legacy.hall),'and a default exists, so it is always an object');
ok(X.DEF.quests===null,'with the quests defaulted too');
{
  /* a backup written now must bring the hall back */
  const out=Object.assign({_app:'chess-career',_saved:new Date().toISOString()},X.store);
  const json=JSON.stringify(out);
  ok(/"legacy"/.test(json),'a backup contains the legacy');
  ok(/"hall"/.test(json),'including the hall itself');
  const had=X.hallList().length;
  wipe();
  ok(X.hallList().length===0,'wiped');
  const r=X.restoreBackup(json);
  ok(r.ok,'the backup restores');
  ok(X.hallList().length===had,'and the hall comes back with it ('+X.hallList().length+' careers)');
}

/* ================= WIRED IN ================= */
ok(/hallAdd\(c\);/.test(script),'retiring adds the career to the hall');
ok(/app\.view==='hall'\)body=viewHall\(\)/.test(script),'the hall has a screen of its own');
ok(/h\+=hallCard\(\);/.test(script),'a card on the Legacy tab points at it');
ok(/CAREER_VIEWS=\['career','magazine','hall'/.test(script),'and it counts as being in the career');
ok(script.indexOf("store.legacy={peak:Math.max(")<0,'the old two-field legacy assignment is gone');

console.log('\n✅ hall: '+pass+' checks passed');
