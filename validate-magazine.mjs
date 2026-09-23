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
const X=new Function(script+'\nreturn {store,app,render,MAG_NAME,MAG_KEEP,magIssueNo,magFront,magTitleName,'+
  'magInterview,magWorld,magLetters,magNext,magBuild,magPublish,magIssue,viewMagazine,magShelfCard,'+
  'seasonRollover,seasonSnapshot,seasonMaybeRoll,careerSeasonBanner,lifeInit,freshCareer,TITLE_DEFS};')();
const C=()=>X.store.career;
function fresh(o){
  X.store.career=X.freshCareer();
  const c=X.store.career;
  c.setup=true;c.name='Ada Marín';c.rating=2200;c.provisional=false;c.ratedGames=40;c.peak=2210;
  c.weeks=52;c.season=1;
  Object.assign(c,o||{});
  X.lifeInit(c);
  X.app.magIdx=0;
  return c;
}
/* a season's worth of results */
function review(o){
  return Object.assign({season:1,games:24,won:12,drawn:8,lost:4,ratingFrom:2150,ratingTo:2210,
    peakFrom:2150,peakTo:2215,money:3200,fame:4,titles:0,honors:0,norms:1,events:4,bril:1,
    best:{name:'City Open',emoji:'🏙️',place:2,score:6.5,rounds:9}},o||{});
}

/* ================= THE FRONT PAGE ================= */
fresh();
let f=X.magFront(C(),review({titles:1}));
ok(f.head&&f.stand&&f.body,'an issue has a headline, a standfirst and copy');
C().titles=['FM'];
f=X.magFront(C(),review({titles:1}));
ok(/FIDE Master/.test(f.head),'a title earned is the front page, in full ('+f.head+')');
ok(/Marín/.test(f.head),'under your own name');
f=X.magFront(C(),review({titles:0,honors:1}));
ok(/Silverware/.test(f.head),'a trophy leads instead when there is no new title');
f=X.magFront(C(),review({titles:0,honors:0,ratingFrom:2050,ratingTo:2210}));
ok(/climb/i.test(f.head),'a big climb leads on the climb');
ok(/160/.test(f.stand),'with the real number of points ('+f.stand+')');
f=X.magFront(C(),review({titles:0,honors:0,ratingFrom:2260,ratingTo:2150}));
ok(/hard year/i.test(f.head),'a bad season is called a bad season');
ok(/no way to dress it up/.test(f.stand),'and not spun');
f=X.magFront(C(),review({titles:0,honors:0,games:0,won:0,drawn:0,lost:0,events:0,best:null,
  ratingFrom:2200,ratingTo:2200}));
ok(/quiet season/i.test(f.head),'a season with no games says so');
ok(/no rated chess/.test(f.stand),'plainly');
f=X.magFront(C(),review({titles:0,honors:0,games:52,won:26,drawn:16,lost:10,ratingFrom:2200,ratingTo:2210}));
ok(/plays everybody/.test(f.head),'a heavy schedule is its own story');
f=X.magFront(C(),review({titles:0,honors:0,games:12,won:5,drawn:4,lost:3,ratingFrom:2200,ratingTo:2205}));
ok(/steady work/.test(f.head),'and an ordinary season is allowed to be ordinary');
ok(X.magTitleName('GM')==='Grandmaster'&&X.magTitleName('WIM').length>5,'titles are spelled out from the ladder');
ok(X.magTitleName('ZZ')==='ZZ','an unknown title is left as it is');

/* ================= THE INTERVIEW ================= */
fresh();
let iv=X.magInterview(C(),review());
ok(iv.length===4,'four questions and four answers');
ok(/money|Money|profitable/.test(iv[3].q),
  'the last of them is about money, which a cap of three used to drop every time ("'+iv[3].q+'")');
ok(iv.every(x=>x.q&&x.a&&x.q.length>10&&x.a.length>20),'all of them real sentences');
ok(iv.some(x=>/City Open/.test(x.q)),'the questions come from what actually happened');
iv=X.magInterview(C(),review({best:{name:'City Open',place:1,score:8,rounds:9}}));
ok(iv.some(x=>/When did you know/.test(x.q)),'winning an event gets asked about differently');
iv=X.magInterview(C(),review({best:null}));
ok(iv.some(x=>/stands out/.test(x.q)),'and a season with no highlight is asked about that');
iv=X.magInterview(C(),review({ratingFrom:2100,ratingTo:2210}));
ok(iv.some(x=>/up 110 points/.test(x.q)),'the rating question carries the real number');
iv=X.magInterview(C(),review({ratingFrom:2260,ratingTo:2150}));
ok(iv.some(x=>/wrong way/.test(x.q)),'a fall is asked about as a fall');
fresh({rival:{name:'Ella Boyd',id:'x'},h2h:{'Ella Boyd':{w:3,l:1,d:2}}});
iv=X.magInterview(C(),review());
ok(iv.some(x=>/Boyd/.test(x.q)),'your rival comes up');
ok(iv.some(x=>/I am ahead/.test(x.a)),'and the answer knows the head-to-head');
fresh({rival:{name:'Ella Boyd',id:'x'},h2h:{'Ella Boyd':{w:1,l:4,d:0}}});
ok(X.magInterview(C(),review()).some(x=>/They are ahead/.test(x.a)),'both ways round');
fresh();C().money=100;            // lifeInit hands a new career a float, so set it after
ok(X.magInterview(C(),review()).some(x=>/money workable/.test(x.q)),'being broke is asked about');
fresh();C().money=9000;
ok(X.magInterview(C(),review({money:4000})).some(x=>/profitable season/.test(x.q)),'and a good year is too');

/* ================= AROUND THE WORLD ================= */
fresh();
let W=X.magWorld(C());
ok(W.notes.length>=1,'the world report has something in it');
ok(W.table.length>=1&&W.table.length<=5,'with a top table ('+W.table.length+' players)');
ok(W.table.every(p=>p.name&&p.rating>0&&p.rank>0),'each with a name, a rating and a place');
ok(W.table[0].rating>=W.table[W.table.length-1].rating,'in rating order');
ok(W.notes.some(n=>/world number one/.test(n.t)),'it names the world number one');
ok(W.notes.some(n=>/ranked/.test(n.t)),'and where you finished');
ok(W.table.every(p=>!p.you),'you are not in the rest-of-the-world table');
fresh({rival:{name:'Ella Boyd',id:'nak'},youngGun:{name:'Kai Beck'}});
W=X.magWorld(C());
ok(W.notes.some(n=>/Ella Boyd/.test(n.t)),'your rival gets a paragraph');
ok(!W.notes.some(n=>/rated —/.test(n.t)),'and an unknown rating is left out, not printed as a dash');
ok(W.notes.some(n=>/Kai Beck/.test(n.t)),'and so does the junior nobody saw coming');
fresh({honors:['World Champion'],weeksAtNo1:14});
W=X.magWorld(C());
ok(W.notes.some(n=>/world title is currently yours/.test(n.t)),'holding the world title is noted');
ok(W.notes.some(n=>/14 weeks at number one/.test(n.t)),'and time spent at the top');

/* ================= THE LETTERS ================= */
fresh({reputation:80,fame:60});
let L=X.magLetters(C(),review({bril:2}));
ok(L.length===3,'three letters an issue');
ok(L.every(x=>x.from&&x.t&&x.t.length>30),'each from somewhere, each with something to say');
ok(L.some(x=>/pleasure to watch/.test(x.t)),'a good reputation reads well in the post');
fresh({reputation:15});
L=X.magLetters(C(),review());
ok(L.some(x=>/way to behave/.test(x.t)),'and a bad one does not');
fresh();
L=X.magLetters(C(),review({won:2,lost:18}));
ok(L.some(x=>/hard season is not a failed one/.test(x.t)),'a bad year gets a kind letter');
fresh({books:[{id:'x',title:'A book'}]});
ok(X.magLetters(C(),review()).some(x=>/bought the book/.test(x.t)),'a published book gets a review');
fresh();
ok(X.magLetters(C(),review({bril:0,won:12,lost:4})).length===3,'and there are always enough letters to fill the page');

/* ================= NEXT SEASON ================= */
fresh();
let N=X.magNext(C(),review());
ok(N.length>=1,'the issue closes on what is next');
ok(N.some(t=>/next round number/.test(t)),'naming the next rating milestone');
ok(N.some(t=>/2300/.test(t)),'with the real number ('+N.join(' ')+')');
ok(N.some(t=>/next title on the ladder/.test(t)),'and the next title up');
ok(N.some(t=>/FM|CM/.test(t)),'which for a 2200 is the one just above, not Grandmaster');
fresh({titles:['CM','FM','IM','GM']});
N=X.magNext(C(),review());
ok(!N.some(t=>/next title/.test(t)),'with every title held, none is dangled');
fresh({burnout:70});
ok(X.magNext(C(),review()).some(t=>/burnt out/.test(t)),'burnout is flagged before the new season');
fresh({debt:900});
ok(X.magNext(C(),review()).some(t=>/900/.test(t)),'and so is debt');

/* ================= AN ISSUE ================= */
fresh();
let m=X.magBuild(C(),review());
ok(m&&m.front&&m.numbers&&m.interview&&m.world&&m.letters&&m.next,'an issue has every section');
ok(m.season===1,'it knows which season it covers');
ok(m.no===1,'and is numbered by that season, not by when it happened to be built');
ok(X.magBuild(C(),review({season:7})).no===7,'issue seven covers season seven');
ok(m.numbers.games===24&&m.numbers.won===12,'the numbers are the season’s own');
ok(m.who.name==='Ada Marín'&&m.who.age>0,'and it says whose issue it is');
ok(X.magBuild(null,null)===null,'no career, no issue');
ok(JSON.stringify(m).length<12000,'an issue is small enough to keep ('+JSON.stringify(m).length+' bytes)');

/* ================= THE SHELF ================= */
fresh();
ok(X.magShelfCard(C())==='','with no issues there is no shelf');
X.magPublish(C(),review());
ok((C().issues||[]).length===1,'publishing puts an issue on the shelf');
ok(/Sixty-Four/.test(X.magShelfCard(C())),'and the shelf appears');
ok(/1 issue/.test(X.magShelfCard(C())),'counting what is on it');
for(let i=0;i<X.MAG_KEEP+4;i++)X.magPublish(C(),review({season:i+2}));
ok(C().issues.length===X.MAG_KEEP,'the shelf is capped at '+X.MAG_KEEP+' issues');
ok(C().issues[0].season>C().issues[1].season,'newest first');
ok(X.magIssue(0)===C().issues[0],'an issue can be fetched by position');
ok(X.magIssue(999)===C().issues[C().issues.length-1],'and asking past the end gives the oldest');

/* ================= ON SCREEN ================= */
fresh();
X.app.view='magazine';
ok(/No issue has been printed yet/.test(X.viewMagazine()),'before any season ends the magazine says so');
X.magPublish(C(),review({titles:1}));
C().titles=['FM'];
X.magPublish(C(),review({season:2,ratingFrom:2210,ratingTo:2330}));
let v=X.viewMagazine();
ok(/Sixty-Four/.test(v),'the masthead is there');
ok(/Issue \d/.test(v)&&/Season 2/.test(v),'with an issue number and a season');
ok(/The season in numbers/.test(v),'the numbers section');
ok(/🎤 The interview/.test(v),'the interview');
ok(/🌍 Around the world/.test(v),'the world report');
ok(/✉️ Letters/.test(v),'the letters');
ok(/📅 Next season/.test(v),'and what comes next');
ok(/data-act="magissue" data-val="1"/.test(v),'past issues can be opened');
ok(/Marín/.test(v),'your name is on it');
ok(v.indexOf('{')<0||!/\{[a-z]+\}/.test(v),'no unfilled blanks reached the page');
X.app.magIdx=1;
let v2=X.viewMagazine();
ok(v2!==v,'a different issue reads differently');
ok(/Season 1/.test(v2),'and shows the season it covers');
X.app.magIdx=99;
ok(/Season 1/.test(X.viewMagazine()),'asking for an issue that is not there lands on the oldest');
X.app.magIdx=0;

/* ================= IT IS PRINTED WHEN A SEASON ENDS ================= */
fresh({weeks:52,season:1});
C().issues=[];
C().seasonStart=X.seasonSnapshot(C());
C().played=30;C().won=15;C().lost=8;C().drawn=7;
C().weeks=105;                                  // two years in
X.seasonMaybeRoll(C());
ok((C().issues||[]).length>=1,'rolling into a new season prints an issue');
ok(C().seasonReview!=null,'the review banner is set as well');
ok(C().issues[0].numbers.games===30,'and the issue carries the season that just ended');
ok(/Read the issue/.test(X.careerSeasonBanner(C())),'the banner links to it');

/* ================= WIRED IN ================= */
ok(/magPublish\(c,c\.seasonReview\);/.test(script),'a season rollover prints the issue');
ok(/app\.view==='magazine'\)body=viewMagazine\(\)/.test(script),'the magazine has a screen of its own');
ok(/act==='magissue'/.test(script),'past issues are reachable');
ok(/h\+=magShelfCard\(c\);/.test(script),'the shelf is on the Legacy tab');
ok(/CAREER_VIEWS=\['career','magazine'/.test(script),'and reading it still counts as being in the career');

console.log('\n✅ magazine: '+pass+' checks passed');
