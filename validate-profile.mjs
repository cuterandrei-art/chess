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
const X=new Function(script+'\nreturn {store,app,buildWorld,profileOf,viewPlayer,careerLeaderboard,careerChallenges,seasonSnapshot,seasonRollover,seasonMaybeRoll,careerSeasonBanner,lifeAdvanceWeeks,lifeInit};')();

const c=X.store.career; c.setup=true; c.name='Ana Rivera'; X.lifeInit(c);
c.rating=2300; c.provisional=false; c.peak=2300;

/* ---- player profiles ---- */
const top=X.buildWorld()[0];
ok(X.profileOf(top.id),'any player on the world list can be looked up');
ok(!X.profileOf('nobody'),'an unknown id is not a player');
X.app.playerId=top.id; X.app.view='player';
let pv=X.viewPlayer();
ok(/Player profile/.test(pv)&&new RegExp(top.name.replace('.','\\.')).test(pv),'the profile names the player');
ok(/<svg /.test(pv),'it shows their face');
ok(/Classical/.test(pv)&&/Rapid/.test(pv)&&/Blitz/.test(pv),'it shows all three of their ratings');
ok(/above you|below you|level with you/.test(pv),'it tells you how far above or below you they are');
ok(/never played/.test(pv),'with no history it says you have never played');
ok(/What they play/.test(pv),'it scouts the openings they trust');
ok(/data-act="careerchal"/.test(pv)&&/data-act="specvs"/.test(pv),'you can challenge them, or watch them play someone else, from the profile');

c.h2h[top.name]={w:3,l:1,d:2};
pv=X.viewPlayer();
ok(/Head to head/.test(pv)&&/6 games/.test(pv)&&/67%/.test(pv),'once you have played, it shows the head-to-head record and your score');
c.rival={id:top.id,name:top.name,flag:top.flag,rating:2800,since:1,intensity:3};
ok(/Your rival/.test(X.viewPlayer()),'your rival is flagged on their profile');
X.app.playerId='nobody';
ok(/no longer on the world list/.test(X.viewPlayer()),'a missing player fails gracefully instead of crashing');

ok(/data-act="profile"/.test(X.careerLeaderboard(c)),'leaderboard rows open a profile');
ok(/data-act="profile"/.test(X.careerChallenges(c)),'challenge opponents open a profile');
ok(/app\.view==='player'\)body=viewPlayer\(\)/.test(script),'the router opens the profile view');

/* ---- season review ---- */
c.seasonReview=null; c.season=1; c.weeks=0; c.money=5000;
c.seasonStart=X.seasonSnapshot(c);
ok(!X.careerSeasonBanner(c),'no review is shown until a season is actually over');
c.played=40; c.won=22; c.lost=9; c.drawn=9; c.peak=2380; c.money=9000;
c.history=[{name:'Reykjavik Open',emoji:'🏆',place:1,score:7,rounds:9,tpr:2450,date:Date.now()}];
c.weeks=53;
X.lifeAdvanceWeeks(c,1);
ok(c.season===2,'crossing a year rolls the season over');
const r=c.seasonReview;
ok(r&&r.games===40&&r.won===22,'the review counts the games you played that year');
ok(r.peakTo===2380,'it records the peak you reached');
ok(r.best&&r.best.name==='Reykjavik Open','it picks out your best result');
const banner=X.careerSeasonBanner(c);
ok(/Season 1 review/.test(banner)&&/22–9–9/.test(banner),'the banner shows the year at a glance');
ok(/data-act="seasondismiss"/.test(banner),'you can dismiss it when you have read it');
ok(/Reykjavik Open/.test(banner),'and it names the best result in words');
const before=c.season;
X.lifeAdvanceWeeks(c,1);
ok(c.season===before,'the same season does not roll over twice');

console.log('\n✅ profile+season: '+pass+' checks passed');
