// Search over everything, and the reduce-motion setting.   node validate-search.mjs
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
globalThis.fetch=async()=>{throw new Error('offline in the test');};
dom.window.__PUZZLES=[['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','c4f7',1200,['mate'],'e7e5'],['rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1','g1f3',1400,[],'e7e5']];
if(!globalThis.navigator||typeof globalThis.navigator!=='object')globalThis.navigator={};
// the device's reduce-motion switch, and who is listening to it
let osReduce=false;const mqListeners=[];
dom.window.matchMedia=q=>({get matches(){return /prefers-reduced-motion: reduce/.test(q)?osReduce:false;},media:q,addEventListener:(t,f)=>mqListeners.push(f),removeEventListener(){},addListener:f=>mqListeners.push(f),removeListener(){}});
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true,
  myGames:[{src:'chesscom',moves:['e4','c5','Nf3','d6'],color:'w',result:1,tc:'blitz',date:Date.parse('2026-08-01'),opp:'MagnusFan'}],
  studies:[{id:'st1',name:'My Najdorf notes',chapters:[{name:'Ch 1',pgn:'1. e4 c5'}]}]}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const X=new Function(script+'\nreturn {store,app,render,go,BASE,openingBuilt,srchFind,srchIndex,srchOpen,srchNorm,motionReduced,motionPref,confetti,animateLast,startPlay,playMove};')();
const $=q=>document.querySelector(q);
const click=(act,val)=>{const b=$('[data-act="'+act+'"]'+(val!=null?'[data-val="'+val+'"]':''));if(!b)throw new Error('no button '+act);b.click();};
const key=(k,o)=>{const ev=new dom.window.KeyboardEvent('keydown',Object.assign({key:k,bubbles:true,cancelable:true},o||{}));(document.activeElement||dom.window.document.body).dispatchEvent(ev);return ev;};
const titles=q=>X.srchFind(q).map(r=>r.t);

/* ================= finding things ================= */
ok(X.srchNorm('Réti  Opening!')==='reti opening','case, accents and punctuation do not matter');
ok(titles('najdorf')[0]==='Sicilian Najdorf'||/Najdorf/.test(titles('najdorf')[0]),'an opening by its name ('+titles('najdorf')[0]+')');
ok(X.srchFind('najdorf').some(r=>r.g==='Your studies'),'and your own study of it');
ok(X.srchFind('reti').some(r=>r.g==='Openings'&&/R[ée]ti/.test(r.t)),'“reti” finds the Réti');
ok(X.srchFind('B90').some(r=>r.g==='Openings'),'an ECO code finds its opening');
ok(X.srchFind('fork').some(r=>r.g==='Puzzles'&&r.t==='Fork puzzles'),'a tactic finds its puzzles');
ok(X.srchFind('philidor').some(r=>r.g==='Endgames'),'an endgame by name');
ok(X.srchFind('immortal').some(r=>r.g==='Classic games'&&r.t==='The Immortal Game'),'a classic game by its title');
ok(X.srchFind('anderssen').filter(r=>r.g==='Classic games').length>=2,'and by a player in it');
ok(X.srchFind('alekhine').some(r=>r.g==='Master games'),'the master database by player');
ok(X.srchFind('magnusfan').some(r=>r.g==='Your games'&&/you won/.test(r.s)),'your own imported games by opponent, with the result');
ok(X.srchFind('fen').some(r=>r.t==='Analysis board'),'a screen by what it is for (“fen” finds the analysis board)');
ok(X.srchFind('notifications').some(r=>r.t==='Reminders'),'a setting by what people call it');
ok(X.srchFind('backup').some(r=>/Move progress/.test(r.t)),'“backup” finds moving progress');
ok(X.srchFind('queens gambit').length&&/Queen.?s Gambit/.test(X.srchFind('queens gambit')[0].t),'several words narrow it down ('+X.srchFind('queens gambit')[0].t+')');
ok(X.srchFind('zzqqxx').length===0,'nonsense finds nothing');
ok(X.srchFind('').length>=6&&X.srchFind('').every(r=>r.g==='Screens'),'an empty box offers the main screens');
const groups=X.srchFind('game').map(r=>r.g);let seen=new Set(),together=true;for(let i=0;i<groups.length;i++){if(i&&groups[i]!==groups[i-1]){if(seen.has(groups[i]))together=false;}seen.add(groups[i]);}
ok(together,'results come grouped, each group together');
ok(X.srchFind('e').length<=36,'and never more than a screenful');
ok(X.BASE.filter(o=>X.openingBuilt(o)).length===0,'searching every opening builds none of them');

/* ================= using it ================= */
X.go('career');
ok($('[data-act="srchopen"]'),'there is a 🔍 in the top bar');
key('/');
ok(X.app.srch&&$('#srch-q')&&document.activeElement===$('#srch-q'),'“/” opens the box, with the cursor in it');
const q=$('#srch-q');q.value='immortal';q.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
ok(/The Immortal Game/.test($('#srch-res').textContent)&&document.activeElement===q,'typing updates the results without losing your place');
key('Enter');
ok(!X.app.srch&&X.app.view==='classics'&&X.app.classicId==='immortal','Enter opens the top result');
key('k',{ctrlKey:true});
ok(X.app.srch,'Ctrl+K opens it too');
key('Escape');
ok(!X.app.srch,'Esc closes it');
X.srchOpen();$('#srch-q').value='sicilian';$('#srch-q').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
key('ArrowDown');
ok(X.app.srch.sel===1&&$('.srchrow.on')&&$('.srchrow.on').getAttribute('data-val')==='1','the arrow keys move the choice');
const second=X.srchFind('sicilian')[1];click('srchgo','1');
ok(X.app.view==='explore'&&X.app.exId&&X.store&&!X.app.srch,'clicking a result opens it ('+second.t+')');
X.srchOpen();$('#srch-q').value='magnusfan';$('#srch-q').dispatchEvent(new dom.window.Event('input',{bubbles:true}));key('Enter');
ok(X.app.view==='analysis'&&X.app.ana&&X.app.ana.sans.join(' ')==='e4 c5 Nf3 d6','your own game opens on the analysis board');
X.srchOpen();$('#srch-q').value='fork';$('#srch-q').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
const forkIdx=X.srchFind('fork').findIndex(r=>r.t==='Fork puzzles');click('srchgo',String(forkIdx));
// the two test puzzles contain no fork, so the app says so and falls back — either way it asked for forks
ok(X.app.view==='puzzles'&&((X.app.pzFilter&&X.app.pzFilter.motif==='fork')||X.app.pzMiss==='fork'),'a tactic opens its puzzles');
X.srchOpen();$('#srch-q').value='reminders';$('#srch-q').dispatchEvent(new dom.window.Event('input',{bubbles:true}));key('Enter');
ok(X.app.view==='settings'&&$('#remindcard'),'a setting opens Settings at its card');
X.srchOpen();$('#srch-q').value='career life';$('#srch-q').dispatchEvent(new dom.window.Event('input',{bubbles:true}));key('Enter');
ok(X.app.view==='career'&&X.app.careerTab==='life','a career tab opens that tab');
X.srchOpen();$('#srch-q').value='friend';$('#srch-q').dispatchEvent(new dom.window.Event('input',{bubbles:true}));key('Enter');
ok(X.app.view==='play'&&!X.app.playFen&&$('#passcard'),'“friend” goes to the two-player setup');
// typing in another text field is not hijacked
X.app.ana=null;X.go('analysis');const ta=$('#ana-in');ta.focus();
const ev=key('/');
ok(!X.app.srch&&!ev.defaultPrevented,'“/” typed into another text box is just a slash');

/* ================= motion ================= */
X.go('settings');
ok($('#motionrow select[data-setting="motion"]'),'Settings has Motion: follow my device, full or reduced');
ok(X.motionPref()==='auto'&&!X.motionReduced()&&document.documentElement.getAttribute('data-motion')==='full','by default it follows the device (motion allowed here)');
osReduce=true;mqListeners.forEach(f=>f());
ok(X.motionReduced()&&document.documentElement.getAttribute('data-motion')==='reduced','turning on the device’s reduce-motion is picked up at once, without a reload');
ok(/html\[data-motion="reduced"\] \*[^{]*\{animation:none!important;transition:none!important/.test(html),'which switches every CSS animation and transition off');
X.confetti(50);
ok(!document.querySelector('.confetti'),'no confetti');
// the piece slide: a move is made and the landing piece is not moved from anywhere
X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'A',b:'B',flip:false}});
X.playMove('e2','e4');X.animateLast();
const pc=document.querySelector('.board [data-sq="e4"] .pc, .board [data-sq="e4"] .piece');
ok(pc&&!pc.style.transform,'pieces do not slide');
X.app.playStatus='over';
osReduce=false;mqListeners.forEach(f=>f());
X.confetti(20);
ok(document.querySelector('.confetti'),'with it off again, confetti is back');
const sel=()=>{X.go('settings');return $('#motionrow select');};
let sl=sel();sl.value='reduced';sl.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
ok(X.store.settings.motion==='reduced'&&X.motionReduced(),'“Reduced motion” turns it off whatever the device says');
sl=sel();sl.value='full';sl.dispatchEvent(new dom.window.Event('change',{bubbles:true}));osReduce=true;
ok(!X.motionReduced(),'and “Full motion” keeps it on even when the device asks for less');
sl=sel();sl.value='auto';sl.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
ok(X.motionReduced()&&/it is on here/.test($('#motionrow').textContent),'“Follow my device” says what the device is set to');

console.log('\n✅ search+motion: '+pass+' checks passed');
