// The calm career screen: one decision at a time, what is next, where to play,
// and everything else one tap away.   node validate-calm.mjs
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
dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.__PUZZLES=[];
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,go,render,careerCalm,careerDecisions,careerTabContent,lobbyPicks,joinTournament,TOURNAMENTS,EVENT_WEEK,DILEMMAS};')();
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const click=(act,val)=>{const b=$('[data-act="'+act+'"]'+(val!=null?'[data-val="'+val+'"]':''));if(!b)throw new Error('no button '+act+' '+(val||''));b.click();};
const DEC=['scandalcard','presscard','dilemmacard','seasoncard'];
const shown=()=>DEC.filter(id=>document.getElementById(id));

X.go('career');$('[data-act="careersetup"]').click();
const c=X.store.career;
Object.assign(c,{provisional:false,rating:2210,peak:2210,ratedGames:80,money:5000,fame:30});
ok(X.careerCalm(),'the calm view is the default');

/* ================= one decision at a time ================= */
c.scandal={sev:1};c.pressPending={event:'City Open',place:1};c.dilemma={id:X.DILEMMAS[0].id};c.seasonReview={season:2,games:40,won:20,drawn:10,lost:10,ratingFrom:2100,ratingTo:2210,peak:2210,money:500,events:6};
X.app.careerTab='play';X.render();
ok(shown().length===1&&shown()[0]==='scandalcard','four decisions waiting: only one is on the screen, the most urgent (the fair-play accusation)');
ok(/3 more waiting/.test($('.decq').textContent),'with a line saying three more are waiting');
click('declater','scandal');
ok(shown().length===1&&shown()[0]==='presscard','“Later” brings the next one: the press');
click('declater','press');click('declater','dilemma');
ok(shown()[0]==='seasoncard','then the crossroads, then the season review');
click('declater','season');
ok(shown()[0]==='scandalcard','and round again: nothing is lost by putting it off');
X.app.careerTab='media';X.render();
ok(shown().length===0,'the other tabs no longer carry the decision cards');
ok($('[data-act="jump"][data-val^="play:"]')&&/4 decisions waiting on the Play tab/.test($('#app').textContent),'just one line saying how many wait on the Play tab');
$('[data-act="jump"][data-val^="play:"]').click();
ok(X.app.careerTab==='play'&&shown().length===1,'which takes you there');
// the inbox row for the press goes straight to it
X.app.inboxAll=true;X.render();
const pressRow=$('[data-act="jump"][data-val="play:presscard"]');
ok(!pressRow,'the calm inbox does not repeat the decisions — they have their slot');
X.app.inboxAll=false;
X.app.decFirst=null;
// jumping from elsewhere (e.g. a notification) puts that decision first
X.render();
const j=document.createElement('button');j.setAttribute('data-act','jump');j.setAttribute('data-val','play:presscard');$('#app').appendChild(j);j.click();
ok(shown()[0]==='presscard','going to the press from anywhere shows the press first');
c.scandal=null;c.pressPending=null;c.dilemma=null;c.seasonReview=null;X.app.decFirst=null;X.app.decLater=[];X.render();
ok(shown().length===0&&!$('.decq'),'with nothing waiting there is no decision slot at all');

/* ================= the Play tab, calm ================= */
X.render();
const order=['nowcard','inboxcard','lobbycard','morecard'].map(id=>{const el=document.getElementById(id);return el?[...document.querySelectorAll('[id]')].indexOf(el):-1;});
ok(order.every(i=>i>=0)&&order[0]<order[1]&&order[1]<order[2]&&order[2]<order[3],'what is happening now, the inbox, where to play, then “More for today”');
ok(!document.getElementById('questcard')&&!document.getElementById('calcard')&&!document.getElementById('simulcard'),'quests, the calendar and the simuls are behind “More for today”');
ok(/More for today/.test($('#morecard').textContent)&&$('#morecard .dim.small')&&$('#morecard .dim.small').textContent.length>10,'which says in one line what is behind it');
click('fold','cmore');
ok(document.getElementById('questcard')&&document.getElementById('calcard'),'“Show” opens it all');
click('fold','cmore');
ok(!document.getElementById('questcard'),'and it folds away again');
// the inbox: three rows, then the rest
const inboxRows=()=>$$('#inboxcard .inrow').length;
c.lastBonusDay=null;c.skillPts=3;c.sponsor=null;c.debt=500;c.injury={type:'Sprained wrist',weeksLeft:2};
X.render();
ok(inboxRows()<=3,'the inbox shows its top three ('+inboxRows()+')');
const allBtn=$('[data-act="inboxall"]');
ok(allBtn&&/Show all \d+/.test(allBtn.textContent),'and a button for the rest ('+(allBtn&&allBtn.textContent.trim())+')');
click('inboxall');
ok(inboxRows()>3,'which shows every row');
X.app.inboxAll=false;c.debt=0;c.injury=null;
// jumping to a card behind "More" opens it on the way
X.render();
const q=document.createElement('button');q.setAttribute('data-act','jump');q.setAttribute('data-val','play:questcard');$('#app').appendChild(q);q.click();
ok(document.getElementById('questcard'),'going to the quests from the inbox opens “More for today”');
X.store.settings.fold.cmore=false;X.render();

/* ================= where to play ================= */
const lobbyRows=()=>$$('#lobbycard [data-act="careerjoin"],#lobbycard [data-act="calwait"]').length;
ok(lobbyRows()<=3&&lobbyRows()>=1,'where to play shows the best three ('+lobbyRows()+')');
ok(/Where to play next/.test($('#lobbycard').textContent),'titled for what it is');
click('lobbyall','1');
ok(lobbyRows()>3&&$('[data-act="lobbyfmt"]'),'“All tournaments” opens the full list, with its format filter');
click('lobbyall','0');
ok(lobbyRows()<=3,'and “Just the best three” closes it');
const picks=X.lobbyPicks(c,3);
ok(picks.every(p=>!p.lock),'the picks are events you can enter');
ok(picks.filter(p=>(p.t.format||'classical')==='classical').length>=2,'classical first');
ok(picks.some(p=>Math.abs(p.t.avg-2210)<300),'fields near your rating ('+picks.map(p=>p.t.name+' '+p.t.avg).join(', ')+')');
// an invitation from the inbox finds its event even when it is not a pick
const inv=document.createElement('button');inv.setAttribute('data-act','jump');inv.setAttribute('data-val','play:tour-club');$('#app').appendChild(inv);inv.click();
ok(X.app.lobbyAll===true,'going to an event from the inbox opens the full list');
X.app.lobbyAll=false;X.render();

/* ================= in a tournament ================= */
X.joinTournament(picks[0].t.id);
X.render();
ok(c.tour&&document.getElementById('tourcard')&&!document.getElementById('lobbycard'),'in an event the Play tab shows the event, not the list of others');

/* ================= everything at once ================= */
c.scandal={sev:1};c.pressPending={event:'City Open',place:1};X.render();
click('calmtoggle');
ok(!X.careerCalm()&&X.store.settings.careerCalm===false,'“Everything at once” switches the calm view off, and it is remembered');
ok(shown().length===2,'with every decision stacked as before');
X.app.careerTab='media';X.render();
ok(shown().length===2,'on every tab, as before');
X.app.careerTab='play';X.render();
ok($('[data-act="calmtoggle"]')&&/Calm view/.test($('[data-act="calmtoggle"]').textContent),'and a button back to the calm view');
click('calmtoggle');
ok(X.careerCalm()&&shown().length===1,'which brings it back');

console.log('\n✅ calm: '+pass+' checks passed');
