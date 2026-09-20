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
const X=new Function(script+'\nreturn {store,app,STORY_ARCS,ARC_METRIC,arcById,arcTick,arcStart,arcChoose,arcProgress,arcChapter,careerArcPanel,careerArcHistory,pushFeed,feedTick,feedStory,careerFeedPanel,lifeInit,CAREER_TABS,careerTabContent};')();

/* ---- season story arcs ---- */
ok(X.STORY_ARCS.length>=6,'a full set of story arcs exists ('+X.STORY_ARCS.length+')');
ok(X.STORY_ARCS.every(a=>a.id&&a.t&&a.e&&typeof a.req==='function'&&a.ch.length>=3&&a.reward&&a.reward.badge),'every arc has an id, unlock test, 3+ chapters and a reward badge');
ok(X.STORY_ARCS.every(a=>a.ch.some(ch=>ch.choice&&ch.choice.length>=2)),'every arc contains a real decision with at least two options');
ok(X.STORY_ARCS.every(a=>a.ch.every(ch=>ch.choice?ch.choice.every(o=>typeof o.fx==='function'):(ch.m&&X.ARC_METRIC[ch.m]))),'every goal names a tracked metric and every choice has an effect');

const c=X.store.career; c.setup=true; X.lifeInit(c);
ok(c.arc===null&&Array.isArray(c.arcsDone),'a new career starts with no arc running');
X.arcTick(c);
ok(c.arc&&c.arc.id==='local','a beginner is handed "The Local Legend" first');
let p=X.arcProgress(c);
ok(p&&p.need===3&&p.have===0,'chapter 1 tracks 3 wins from where you stood when it opened');
c.won=(c.won||0)+3; X.arcTick(c);
ok(c.arc.ch===1,'hitting the goal advances the chapter automatically');
ok(X.arcChapter(c).choice,'chapter 2 is a decision, and it waits for you');
const before=c.money||0; X.arcChoose(c,0);
ok((c.money||0)>before&&c.arc.ch>=2,'choosing an option applies its effect and moves the story on');
ok(c.arc.choices.length===1,'your choice is remembered');

// finishing the last chapter completes the arc and pays the reward
c.history=[{name:'a',oneoff:false},{name:'b',oneoff:false},{name:'c',oneoff:false},{name:'d',oneoff:false}];
c.peak=1900; X.arcTick(c);
ok((c.arcsDone||[]).includes('local')&&(c.arcBadges||[]).includes('Local Legend'),'completing every chapter finishes the arc and awards its badge');
ok(c.arc===null||c.arc.id!=='local','a finished arc does not restart');
ok(/Local Legend/.test(X.careerArcHistory(c)),'completed chapters are listed in your legacy');

// a later-stage arc unlocks when you are strong enough
c.arc=null; c.fame=40; X.arcTick(c);
ok(c.arc&&c.arc.id==='sponsor','raising your fame unlocks "The Sponsor’s Gamble"');
ok(/Chapter 1\/3/.test(X.careerArcPanel(c)),'the arc panel shows which chapter you are on');

/* ---- living chess world feed ---- */
c.feed=[]; for(let i=0;i<40;i++)X.feedTick(c);
ok(c.feed.length>0,'the world generates stories on its own ('+c.feed.length+' items)');
ok(c.feed.length<=40,'the feed is capped so it stays readable');
ok(c.feed.every(it=>it.e&&it.t&&typeof it.w==='number'),'every feed item has an icon, a story and a timestamp');
const kinds=new Set(c.feed.map(it=>it.t.replace(/[^a-z ]/gi,'').split(' ')[0]));
ok(kinds.size>3,'the stories vary rather than repeating one template');
X.pushFeed(c,'🎯','same story'); X.pushFeed(c,'🎯','same story');
ok(c.feed.filter(it=>it.t==='same story').length===1,'the same story is not posted twice in a row');
c.rating=2650; c.provisional=false; c.peak=2650;
let mentioned=false; for(let i=0;i<60&&!mentioned;i++){const st=X.feedStory(c); if(st&&st[2]==='you')mentioned=true;}
ok(mentioned,'once you are rated, the world starts talking about you');
ok(/The chess world/.test(X.careerFeedPanel(c)),'the feed renders as a panel');
ok(X.CAREER_TABS.some(t=>t.k==='world'),'a World tab exists in the career');
ok(/The chess world/.test(X.careerTabContent(c,'world')),'the World tab shows the living feed');

console.log('\n✅ story: '+pass+' checks passed');
