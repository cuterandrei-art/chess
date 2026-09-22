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
const X=new Function(script+'\nreturn {store,app,trendFit,trendTarget,trendWhen,trendOf,trendAway,trendMonth,ratingTrends,trkTrendCard,trackerStats,viewTracker,TREND_MIN_GAMES,TREND_MIN_DAYS,TREND_MIN_FIT,TREND_FLAT};')();
const DAY=86400000;
const line=(n,start,perDay,noise)=>{const out=[];for(let i=0;i<n;i++)
  out.push({t:Date.now()-(n-1-i)*DAY,r:Math.round(start+perDay*i+(noise?((i*7919)%(2*noise))-noise:0))});return out;};

/* ================= the fit itself ================= */
let f=X.trendFit(line(30,1200,2,0));
ok(f!==null,'a clean run of ratings fits');
ok(Math.abs(f.slope-2)<0.001,'the slope is the real one ('+f.slope.toFixed(3)+' a day, wanted 2)');
ok(Math.abs(f.perMonth-60)<0.1,'expressed per month that is '+Math.round(f.perMonth)+', wanted 60');
ok(f.r2>0.999,'a perfectly straight run fits perfectly (r²='+f.r2.toFixed(3)+')');
ok(f.n===30&&Math.abs(f.days-29)<0.001,'it knows how many games and over how long');
ok(f.first===1200&&f.last===1200+2*29,'and where it started and ended');
f=X.trendFit(line(30,1600,-3,0));
ok(f.perMonth<0&&Math.abs(f.perMonth+90)<0.1,'a decline comes out negative ('+Math.round(f.perMonth)+')');
f=X.trendFit(line(40,1500,0,120));            // pure noise around a flat line
ok(Math.abs(f.perMonth)<20,'noise around a flat line yields little slope ('+Math.round(f.perMonth)+')');
ok(f.r2<0.2,'and a poor fit (r²='+f.r2.toFixed(2)+')');
ok(X.trendFit([])===null&&X.trendFit([{t:1,r:1200}])===null,'one point is not a trend');
ok(X.trendFit(null)===null,'nor is nothing');
const sameDay=[{t:5,r:1200},{t:5,r:1300},{t:5,r:1250}];
ok(X.trendFit(sameDay)===null,'games all at the same instant give no slope rather than infinity');
ok(X.trendFit([{t:1,r:NaN},{t:2,r:1200}])===null,'a broken rating is refused, not averaged in');

/* ================= the target and the date ================= */
ok(X.trendTarget(1237,+50)===1300,'climbing aims at the next hundred up');
ok(X.trendTarget(1300,+50)===1400,'from exactly on a hundred, the next one up');
ok(X.trendTarget(1237,-50)===1200,'falling aims at the next hundred down');
ok(X.trendTarget(1237,0)===null,'going nowhere has no target');
let w=X.trendWhen(X.trendFit(line(40,1000,2,0)));   // ends at 1078, +60/month
ok(w&&w.target===1100,'the target is the next hundred above where you are now ('+(w&&w.target)+')');
ok(w&&Math.abs(w.days-11)<=1,'and the date is the slope carried forward ('+(w&&w.days)+' days, wanted ~11)');
ok(X.trendWhen(X.trendFit(line(40,1500,0,0)))===null,'a flat line gets no date');
ok(X.trendWhen(null)===null,'and no fit gets no date');
// a crawl that would take a decade is not a prediction
const slow=X.trendWhen(X.trendFit(line(40,1001,0.11,0)));
ok(slow&&slow.tooFar===true,'a target years away is flagged rather than dressed up as a forecast');
ok(slow.days>540,'because at that pace it really is that far ('+slow.days+' days)');
const slowCard=X.trkTrendCard({curve:{blitz:{n:40,pts:line(40,1001,0.11,0)}},byClass:[{key:'blitz',pct:51}]});
ok(/over a year and a half away/.test(slowCard),'and the card says so instead of naming a month');
ok(!/around/.test(slowCard.replace(/Where this is heading/,'')),'no month is printed for it');
ok(/weeks/.test(X.trendAway(30))&&/days/.test(X.trendAway(5))&&/months/.test(X.trendAway(200)),
  'the wait is worded at a sensible scale');
ok(typeof X.trendMonth(Date.now())==='string'&&X.trendMonth(Date.now()).length>3,'and a month can be named');

/* ================= when it refuses to call it ================= */
let t=X.trendOf(line(8,1200,2,0),55);
ok(t&&!t.solid,'eight games is not enough to project from');
ok(/only 8 rated games/.test(t.why||''),'and it says exactly why ('+t.why+')');
ok(t.when===null,'so no date is offered');
const oneDay=[];for(let i=0;i<30;i++)oneDay.push({t:Date.now()-i*60000,r:1200+i});
t=X.trendOf(oneDay,55);
ok(t&&!t.solid&&/within/.test(t.why||''),'thirty games in one evening is not a trend ('+t.why+')');
t=X.trendOf(line(40,1500,0.05,150),50);
ok(t&&!t.solid&&/scattered/.test(t.why||''),'a scatter with no line through it is refused ('+t.why+')');
t=X.trendOf(line(40,1200,2,0),58);
ok(t&&t.solid&&t.when,'a long, steady, well-fitting climb does get a date');
ok(t.pct===58,'the score is carried alongside');
t=X.trendOf(line(40,1500,0.02,0),50);
ok(t&&t.flat===true,'a rating that barely moves is called flat, not a slow climb');
ok(t.when===null,'and gets no date either');

/* ================= across time controls ================= */
function stats(curve,byClass){return {curve:curve,byClass:byClass||[]};}
let T=X.ratingTrends(stats({
  blitz:{n:40,pts:line(40,1200,2,0)},
  rapid:{n:40,pts:line(40,1400,-1.5,0)},
  bullet:{n:6,pts:line(6,1000,5,0)}
},[{key:'blitz',pct:58},{key:'rapid',pct:44}]));
ok(T&&T.any,'every time control is examined');
ok(T.by.blitz&&T.by.rapid&&T.by.bullet,'including the one with too few games');
ok(T.by.bullet.solid===false,'which is marked as not solid rather than left out');
ok(T.best&&T.best.key==='blitz','the one climbing fastest is named as carrying you');
ok(T.worst&&T.worst.key==='rapid','and the one dragging is named too');
ok(T.best.pct===58,'with its score attached');
let card=X.trkTrendCard(stats({blitz:{n:40,pts:line(40,1200,2,0)},rapid:{n:40,pts:line(40,1400,-1.5,0)}},
  [{key:'blitz',pct:58},{key:'rapid',pct:44}]));
ok(/Where this is heading/.test(card),'the card is titled plainly');
ok(/is carrying you/.test(card),'it names the time control doing the work');
ok(/pulling the other way/.test(card),'and the one undoing it');
ok(/At this rate/.test(card)&&/1300/.test(card),'with the milestone and the date');
ok(/fit [01](\.\d+)? over \d+ days/.test(card),'and how well the line fits and over how long, rather than hiding it');
card=X.trkTrendCard(stats({blitz:{n:8,pts:line(8,1200,2,0)}},[{key:'blitz',pct:50}]));
ok(/Too early to call/.test(card),'too little data says so on the card');
ok(!/At this rate/.test(card),'and promises nothing');
card=X.trkTrendCard(stats({blitz:{n:40,pts:line(40,1400,-2,0)}},[{key:'blitz',pct:42}]));
ok(/falling/.test(card),'a rating going only down is not spun as progress');
ok(/down to <b>1300<\/b>/.test(card),'and a slide toward the next hundred reads as a slide, not an arrival');
ok(!/1300<\/b> is about/.test(card),'never worded as if losing rating were progress');
const upCard=X.trkTrendCard(stats({blitz:{n:40,pts:line(40,1200,2,0)}},[{key:'blitz',pct:58}]));
ok(/At this rate <b>1300<\/b> is about/.test(upCard),'while a climb still reads as a climb');
ok(X.trkTrendCard(stats({}))===''&&X.trkTrendCard(null)==='','with no curve at all the card stays away');
ok(X.ratingTrends(null)===null,'and nothing in means nothing out');

/* ================= wired into the tracker ================= */
X.store.myGames=[];
const base=new Date(2025,0,1,12,0,0).getTime();
for(let i=0;i<40;i++)X.store.myGames.push({src:'chesscom',moves:['e4','e5','Nf3','Nc6','Bc4','Bc5'],
  color:i%2?'w':'b',result:i%3?1:0,tc:'blitz',date:base+i*DAY,opp:'x',reason:'win',
  myRating:1200+i*2,oppRating:1200,rated:true,tcStr:'600',nmoves:30});
const S=X.trackerStats();
ok(S.curve.blitz&&S.curve.blitz.pts.length===40,'the tracker builds the curve the projection reads');
X.app.trkTab='results';
const view=X.viewTracker();
ok(/Where this is heading/.test(view),'and the Results tab shows the projection');
ok(/At this rate/.test(view),'with a real date for a real climb');
ok(/trkTrendCard\(S\)/.test(script),'the card is wired into the tracker, not just defined');

console.log('\n✅ trend: '+pass+' checks passed');
