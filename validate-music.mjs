// Music that follows the moment.   node validate-music.mjs
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
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.__PUZZLES=[['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','c4f7',1200,['mate'],'e7e5']];
let hidden=false;Object.defineProperty(dom.window.document,'hidden',{get:()=>hidden,configurable:true});

/* A sound card that writes down every note it is asked to play. */
const ACS=[];
class Param{constructor(v){this.value=v;this.ev=[];}
  setValueAtTime(v,t){this.ev.push(['set',v,t]);this.value=v;}linearRampToValueAtTime(v,t){this.ev.push(['lin',v,t]);this.value=v;}
  exponentialRampToValueAtTime(v,t){this.ev.push(['exp',v,t]);this.value=v;}setTargetAtTime(v,t){this.ev.push(['tgt',v,t]);this.value=v;}cancelScheduledValues(){}}
class Node{connect(n){this.to=n;return n;}disconnect(){this.to=null;}}
class Osc extends Node{constructor(ac){super();this.ac=ac;this.frequency=new Param(440);this.type='sine';ac.osc.push(this);}start(t){this.t0=t;}stop(t){this.t1=t;}}
class Gain extends Node{constructor(){super();this.gain=new Param(1);}}
class Filt extends Node{constructor(){super();this.frequency=new Param(350);this.Q=new Param(1);this.type='lowpass';}}
class AC{constructor(){this.currentTime=0;this.state='suspended';this.destination={dest:true};this.osc=[];this.sampleRate=8000;ACS.push(this);}
  createOscillator(){return new Osc(this);}createGain(){return new Gain();}createBiquadFilter(){return new Filt();}
  createBufferSource(){const n=new Node();n.start=()=>{};n.stop=()=>{};return n;}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}
  resume(){this.state='running';return Promise.resolve();}}
globalThis.AudioContext=globalThis.webkitAudioContext=dom.window.AudioContext=dom.window.webkitAudioContext=AC;
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {MUSIC_GAIN,store,app,go,render,Music,musicMode,musicMidi,MUSIC_BAR,srchFind,startPlay};')();
const $=q=>document.querySelector(q);
const ac=()=>ACS[0];
const hz=m=>Math.round(X.musicMidi(m)*100)/100;
const freqs=(from)=>ac().osc.slice(from||0).map(o=>Math.round(o.frequency.ev[0][1]*100)/100);
const tap=()=>document.body.dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));
const stopTimer=()=>{if(X.Music.timer){clearInterval(X.Music.timer);X.Music.timer=null;}};   // the test moves time itself

/* ================= not before a tap ================= */
X.go('career');
ok(X.musicMode()==='career','by default the music is for the career');
ok(ACS.length===0&&X.Music.mood===null,'nothing plays, and no sound is even set up, before the first tap (a browser would refuse it)');

/* ================= between events ================= */
tap();stopTimer();
ok(X.Music.armed&&X.Music.mood==='calm'&&ac()&&ac().state==='running','after a tap the career screen has its music');
const bass=freqs().filter(f=>f<120);
ok(bass.includes(hz(45)),'slow chords, starting on A minor (A at '+hz(45)+' Hz)');
ok(ac().osc.every(o=>o.to&&o.t1>o.t0),'every note is started and stopped — nothing is left running');
const n0=ac().osc.length;ac().currentTime=X.MUSIC_BAR-0.3;X.Music.schedule();
ok(freqs(n0).filter(f=>f<120).includes(hz(41)),'then F major, a chord every '+X.MUSIC_BAR+' seconds');
ok(ac().osc.some(o=>o.type==='sine'&&o.frequency.ev[0][1]>600),'with a bell now and then, two octaves up');
const master=X.Music.master;
ok(master&&Math.abs(master.gain.value-0.35*0.9)<1e-9,'at a quiet volume by default');

/* ================= while you play ================= */
X.startPlay(new Chess().fen(),'w',null,'Free game',{});stopTimer();
ok(X.Music.mood===null,'a game is played in silence');
const faded=X.Music.layer===null;
ok(faded,'the music fades out rather than stopping mid-note');
X.app.careerOpp={name:'Club Champion',rating:1700};X.app.clock={w:90000,b:90000,inc:0};X.app.playStatus='play';X.app.playSide='w';
X.Music.update();
ok(X.Music.mood===null,'a career game with time on the clock: still silence');
X.app.clock.b=20000;X.Music.update();
ok(X.Music.mood===null,'your opponent’s time trouble is not yours');
X.app.clock.w=50000;const nT=ac().osc.length;X.Music.update();stopTimer();
ok(X.Music.mood==='tension','under a minute on your clock: the music comes in');
const tens=ac().osc.slice(nT);
ok(tens.some(o=>o.type==='sawtooth'&&Math.round(o.frequency.ev[0][1])===55),'a low drone');
const beats=tens.filter(o=>o.type==='sine'&&Math.round(o.frequency.ev[0][1])===72).map(o=>o.t0);
ok(beats.length>=2&&Math.abs(beats[1]-beats[0]-0.23)<1e-6,'and a heartbeat: lub — dub');
ok(X.Music.bpm()===80,'at 80 beats a minute with 50 seconds left');
X.app.clock.w=10000;
ok(X.Music.bpm()===112,'112 with ten seconds left');
X.app.playStatus='over';X.Music.update();
ok(X.Music.mood===null,'and silence again when the game is over');
X.app.playStatus='play';X.app.careerOpp=null;X.app.clock.w=30000;X.Music.update();
ok(X.Music.mood===null,'in the career setting, a free game’s time trouble stays silent');
X.store.settings.music='all';X.Music.update();stopTimer();
ok(X.Music.mood==='tension','set to Everywhere, it plays for any game');
X.app.pass={w:'A',b:'B'};X.Music.update();
ok(X.Music.mood===null,'but not for two people sharing the board — it could only be one of them');
X.app.pass=null;X.app.playStatus='over';

/* ================= everywhere, off, hidden ================= */
X.go('puzzles');stopTimer();
ok(X.Music.mood==='calm','set to Everywhere, the other screens have the chords too');
X.store.settings.music='career';X.render();
ok(X.Music.mood===null,'set to the career, they do not');
X.go('career');stopTimer();
hidden=true;document.dispatchEvent(new dom.window.Event('visibilitychange'));
ok(X.Music.mood===null,'switch to another app and it goes quiet');
hidden=false;document.dispatchEvent(new dom.window.Event('visibilitychange'));stopTimer();
ok(X.Music.mood==='calm','and comes back when you do');

/* ================= moments ================= */
let k=ac().osc.length;X.Music.sting('title');
const fan=ac().osc.slice(k);
ok(fan.length===14&&fan.some(o=>Math.round(o.frequency.ev[0][1])===Math.round(X.musicMidi(84))),'a title: a fanfare, climbing to a high C');
ok(X.Music.layer.gain.ev.some(e=>e[0]==='lin'&&e[1]===0.25),'the chords step back while it sounds');
k=ac().osc.length;X.Music.sting('game');
ok(ac().osc.length-k===6,'a won game: three notes');
k=ac().osc.length;X.app.careerFinish={name:'City Open',newTitles:['FM'],honors:[],norms:[],published:false};X.render();
ok(ac().osc.length-k===14,'earning a title in an event plays the fanfare');
k=ac().osc.length;X.app.careerFinish={name:'Club',newTitles:[],honors:[],norms:[{type:'IM'}],published:false};X.render();
ok(ac().osc.length-k===8,'a norm, a first rating, a trophy: a shorter one');

/* ================= settings ================= */
X.go('settings');
const sel=$('select[data-setting="music"]'),vol=$('input[data-setting="musicVol"]');
ok(sel&&[...sel.options].map(o=>o.value).join()==='career,all,off'&&vol,'Settings has Music (in the career, everywhere, off) and a volume');
vol.value='80';vol.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
ok(X.store.settings.musicVol===80&&X.Music.master.gain.ev.some(e=>e[0]==='tgt'&&Math.abs(e[1]-0.72)<1e-9),'the volume changes as you slide it');
X.go('settings');const sel2=$('select[data-setting="music"]');sel2.value='off';sel2.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
X.go('career');
k=ac().osc.length;X.Music.sting('title');
ok(X.musicMode()==='off'&&X.Music.mood===null&&ac().osc.length===k,'Off is off: no chords, no fanfare');
ok(X.srchFind('music').some(r=>r.t==='Music'),'search finds it');

console.log('\n✅ music: '+pass+' checks passed');
process.exit(0);
