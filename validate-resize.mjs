// Resizing the board by dragging its corner.   node validate-resize.mjs
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/', pretendToBeVisual: true });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.__PUZZLES=[];
// a mouse (or not): the grip is only for a fine pointer that can hover
let mouse=true;
dom.window.matchMedia=q=>({matches:/hover: hover/.test(q)&&/pointer: fine/.test(q)?mouse:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
// jsdom has no layout: a board is as wide as --bw allows, inside a 700px column
const COL=700;
const bw=()=>parseInt(document.body.style.getPropertyValue('--bw'),10)||520;
const P=dom.window.HTMLElement.prototype;
P.getBoundingClientRect=function(){const inBoard=this.classList&&(this.classList.contains('board')||this.classList.contains('boardwrap'));
  const w=inBoard?Math.min(bw(),COL):0;return {x:0,y:0,left:0,top:0,width:w,height:w,right:w,bottom:w};};
Object.defineProperty(P,'clientWidth',{get(){return this.querySelector&&this.querySelector('.boardwrap')?COL:0;},configurable:true});
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,go,render,anaOpen,BOARD_MIN,BOARD_MAX,BOARD_DEF};')();
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const ev=(el,type,x,y)=>{const E=new dom.window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0});el.dispatchEvent(E);return E;};
const saved=()=>JSON.parse(localStorage.getItem('opening-trainer-standalone-v1')).settings.boardSize;
const drag=(dx,dy)=>{const g=$('.bgrip i');ev(g,'pointerdown',500,500);ev(dom.window,'pointermove',500+dx/2,500+dy/2);ev(dom.window,'pointermove',500+dx,500+dy);const mid=bw();ev(dom.window,'pointerup',500+dx,500+dy);return mid;};

/* ================= the grip ================= */
X.anaOpen(new Chess().fen(),['e4','e5'],2,'Test');X.go('analysis');
ok($$('.bgrip').length===1,'a board on a computer has a grip');
const g=$('.bgrip');
ok(g.previousElementSibling&&g.previousElementSibling.classList.contains('board'),'right under the board, so it sits on the board’s corner wherever the board is');
ok(g.getAttribute('aria-hidden')==='true'&&/Drag to resize the board/.test($('.bgrip i').getAttribute('title')),'it says what it does when you point at it (and stays out of a screen reader’s way — the Settings slider is there for that)');
ok(/\.bgrip\{[^}]*display:none/.test(html)&&/@media \(hover:hover\) and \(pointer:fine\)\{\.bgrip\{display:block\}\}/.test(html),'shown only for a mouse or a pen');
X.render();
ok($$('.bgrip').length===1,'one grip per board, however often the screen is redrawn');

/* ================= dragging ================= */
let mid=drag(60,120);
ok(mid===640,'dragging the corner down 120px grows the board by 120 while you drag ('+mid+'px)');
ok(X.store.settings.boardSize===640&&saved()===640,'and the size is kept when you let go');
mid=drag(-50,0);
ok(mid===540,'dragging sideways grows or shrinks it twice as fast, because the board is centred: its corner moves half as far as it grows ('+mid+')');
X.store.settings.boardSize=520;X.render();
drag(0,40);
const lab=$('.bgrip b');
ok(lab,'there is a size readout on the grip');
ev($('.bgrip i'),'pointerdown',500,500);ev(dom.window,'pointermove',500,560);
ok(document.body.classList.contains('bresizing')&&/620 px/.test($('.bgrip b').textContent),'showing the size while you drag ('+$('.bgrip b').textContent+')');
X.render();
ok(bw()===620&&/620 px/.test($('.bgrip b').textContent),'a redraw in the middle of the drag (the engine’s next line, a clock tick) does not snap it back');
ev(dom.window,'pointerup',500,560);
ok(!document.body.classList.contains('bresizing')&&X.store.settings.boardSize===620,'letting go ends it');

/* ================= limits ================= */
drag(0,-900);
ok(X.store.settings.boardSize===X.BOARD_MIN,'it will not go smaller than '+X.BOARD_MIN+'px');
drag(0,2000);
ok(X.store.settings.boardSize===COL,'nor wider than the column it is in ('+X.store.settings.boardSize+'px), and the number saved is the size you see');
ok(X.BOARD_MAX>=1200,'on a big screen it can go up to '+X.BOARD_MAX+'px');

/* ================= a click is not a drag ================= */
X.store.settings.boardSize=560;X.render();const before=localStorage.getItem('opening-trainer-standalone-v1');
const g1=$('.bgrip i');ev(g1,'pointerdown',500,500);ev(dom.window,'pointerup',500,500);
ok($('.bgrip i')===g1&&localStorage.getItem('opening-trainer-standalone-v1')===before,'a click without moving saves nothing and redraws nothing — so a double-click can land');
ev($('.bgrip i'),'dblclick',500,500);
ok(X.store.settings.boardSize===X.BOARD_DEF&&saved()===X.BOARD_DEF,'a double-click puts it back to the default ('+X.BOARD_DEF+'px)');

/* ================= the rest of the board still works ================= */
const moves=X.app.ana.sans.length;
ev($('.bgrip i'),'pointerdown',500,500);ev(dom.window,'pointermove',500,540);ev(dom.window,'pointerup',500,540);
ok(X.app.ana.sans.length===moves&&!X.app.sel,'resizing never picks up or moves a piece');

/* ================= settings, phones ================= */
X.go('settings');
const sl=$('input[data-setting="boardSize"]');
ok(sl&&+sl.max>=1200&&+sl.value===X.store.settings.boardSize,'the Settings slider is the same setting, and reaches as far');
ok(/drag the bottom-right corner/i.test(sl.closest('.row,div').parentElement.textContent),'and says the corner can be dragged');
mouse=false;X.go('analysis');
ok($$('.bgrip').length===0,'on a phone there is no grip: the board already fills the screen');

console.log('\n✅ resize: '+pass+' checks passed');
