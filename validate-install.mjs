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
/* the harness controls what the "browser" claims to be */
const ENV={proto:'https:',ua:'Mozilla/5.0 (Windows NT 10.0) Chrome/126 Safari/537.36',standalone:false,platform:'Win32',touch:0};
Object.defineProperty(globalThis.navigator,'userAgent',{get:()=>ENV.ua,configurable:true});
Object.defineProperty(globalThis.navigator,'platform',{get:()=>ENV.platform,configurable:true});
Object.defineProperty(globalThis.navigator,'maxTouchPoints',{get:()=>ENV.touch,configurable:true});
Object.defineProperty(globalThis.navigator,'standalone',{get:()=>ENV.standalone,configurable:true});
dom.window.matchMedia=(q)=>({matches:ENV.standalone&&/standalone/.test(q),addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
/* the app reads a bare `location`, which inside this harness is the global one */
globalThis.location={get protocol(){return ENV.proto;},get href(){return ENV.proto+'//example.test/';},reload(){}};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,installStatus,installLabel,installSteps,installCard,installSheet,installNow,installListen,installBrowser,installRunning,installIsIOS,viewSettings,render};')();
const reset=()=>{X.app.installOpen=false;X.app.installMsg=null;try{delete globalThis.window.__deferredInstall;}catch(e){}};

/* ================= what this browser can actually do ================= */
reset();
ok(X.installStatus()==='manual','with no offer from the browser the state is "manual", not "ready"');
ok(!/data-act="install"[^>]*disabled/.test(X.installCard()),'the button is never a dead control');

// Chrome/Edge made an offer: one press is the real thing
let prompted=0,choice='accepted';
const fakeEvent={preventDefault(){},prompt(){prompted++;},userChoice:Promise.resolve({outcome:'accepted'})};
globalThis.window.__deferredInstall=fakeEvent;
ok(X.installStatus()==='ready','an offer from the browser puts it in the "ready" state');
ok(X.installLabel()==='⬇ Install the app','and the button says so');
ok(/data-act="install"/.test(X.installCard())&&/primary/.test(X.installCard()),'it is the primary action on the card');
await X.installNow();
ok(prompted===1,'pressing it opens the browser’s own install dialog');
ok(/Installing/.test(X.app.installMsg||''),'accepting is confirmed ('+X.app.installMsg+')');
ok(X.installStatus()==='manual','and the offer is spent, so it cannot be fired twice');

// declining is not an error
reset();
globalThis.window.__deferredInstall={preventDefault(){},prompt(){prompted++;},userChoice:Promise.resolve({outcome:'dismissed'})};
await X.installNow();
ok(prompted===2,'declining still went through the browser');
ok(/Nothing installed/.test(X.app.installMsg||''),'and is reported plainly, not as a failure');

// a browser that throws on prompt() must not leave a silent button
reset();
globalThis.window.__deferredInstall={preventDefault(){},prompt(){throw new Error('nope');},userChoice:Promise.resolve({outcome:'accepted'})};
await X.installNow();
ok(/would not open/.test(X.app.installMsg||''),'a refused dialog is explained rather than swallowed');
ok(X.installStatus()!=='ready','the broken offer is dropped instead of being pressed again for ever');
ok(X.app.installOpen===true,'and the manual steps are opened instead');

/* ================= already installed ================= */
reset();ENV.standalone=true;
ok(X.installStatus()==='installed','running as an installed app is recognised');
ok(/Installed/.test(X.installCard())&&!/data-act="install"/.test(X.installCard()),'and the card stops offering an install');

ENV.standalone=false;

/* ================= the browsers that cannot do it in one press ================= */
reset();ENV.proto='file:';
ok(X.installStatus()==='file','a page opened from a file knows it cannot install itself');
let st=X.installSteps();
ok(/opened from a file/i.test(st.title),'and says so');
ok(st.lines.join(' ').indexOf('Create shortcut')>=0,'while giving the route that does work on a PC');
ok(/offline/i.test(st.note||''),'and noting that the file still works offline');
ENV.proto='https:';

reset();ENV.ua='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Safari/605.1';
ok(X.installStatus()==='ios','an iPhone is recognised');
ok(X.installLabel()==='⬇ Add to Home Screen','and the button uses Apple’s own wording');
st=X.installSteps();
ok(/Home Screen/.test(st.title)&&st.lines.join(' ').indexOf('Share')>=0,'the steps are the Share-sheet route');
ok(/no one-tap install/i.test(st.note||''),'and it is explained why there is no button for it');
// an iPad reports itself as a Mac, so touch points are the giveaway
reset();ENV.ua='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/17.0 Safari/605.1';ENV.platform='MacIntel';ENV.touch=5;
ok(X.installIsIOS()===true&&X.installStatus()==='ios','an iPad that claims to be a Mac is still an iPad');
ENV.touch=0;
ok(X.installStatus()==='manual','while a real Mac is not');
ENV.platform='Win32';

reset();ENV.ua='Mozilla/5.0 (Windows NT 10.0; rv:127.0) Gecko/20100101 Firefox/127.0';
ok(X.installBrowser()==='firefox','Firefox is identified');
st=X.installSteps();
ok(/Firefox cannot install/.test(st.title),'and told the truth: it has no desktop install');
ok(st.lines.join(' ').indexOf('Chrome or Edge')>=0,'with the way round it');

reset();ENV.ua='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/17.0 Safari/605.1';ENV.platform='MacIntel';
ok(X.installBrowser()==='safari','desktop Safari is identified');
ok(/Dock/.test(X.installSteps().title),'and gets macOS’s Add to Dock');
ENV.platform='Win32';

reset();ENV.ua='Mozilla/5.0 (Windows NT 10.0) Chrome/126 Edg/126';
ok(X.installBrowser()==='edge','Edge is told apart from Chrome');
reset();ENV.ua='Mozilla/5.0 (Windows NT 10.0) Chrome/126 Safari/537.36';
ok(X.installBrowser()==='chrome','and Chrome from Safari');

/* ================= the sheet ================= */
reset();
ok(X.installSheet()==='','the steps stay out of the way until asked for');
await X.installNow();                       // no offer captured → show the steps
ok(X.app.installOpen===true,'pressing the button with nothing to prompt opens the steps');
const sheet=X.installSheet();
ok(/installclose/.test(sheet),'which can be closed');
ok(/<ol/.test(sheet)&&/<li/.test(sheet),'and are numbered steps, not a wall of text');
ok(sheet.indexOf('Install page as app')>=0,'naming the menu item to look for');

/* ================= where it appears ================= */
ok(/📲 Install Chess Career/.test(X.viewSettings()),'Settings carries the install card');
ok(/data-act="install"/.test(X.viewSettings()),'with the button on it');
ENV.standalone=true;
ok(!/data-act="install"/.test(X.viewSettings()),'which disappears once installed');
ENV.standalone=false;

/* ================= wiring ================= */
ok(/act==='install'\)\{app\.menuOpen=false;installNow\(\)/.test(script),'the button is wired');
ok(/act==='installclose'/.test(script),'and so is closing the steps');
ok(/installListen\(\);/.test(script),'the app starts listening for the browser’s offer on boot');
ok(/window\.__deferredInstall/.test(script),'and picks up an offer the page caught before it booted');
ok(/installStatus\(\)==='installed'\?'':'<button class="btn primary sm instbtn" data-act="install"/.test(script),
  'the header shows the button until the app is installed');
ok(/'<div class="navright">'\+topnav\+\n\s*\(installStatus/.test(script),
  'and it sits beside More rather than stacked under it');
ok(/installStatus\(\)==='installed'\?'':'<button class="instrow" data-act="install"/.test(script),
  'the More menu carries a labelled entry too, for narrow screens');
ok(/@media\(max-width:700px\)\{\.instbtn \.mlabel\{display:none\}\}/.test(html),
  'where the header button drops its label to fit');
ok(/\.menupanel\{[^}]*max-height:calc\(100vh - 170px\);overflow:auto/.test(html),
  'and the menu scrolls, so the last entries stay reachable above the bottom bar');
ok(/installSheet\(\)/.test(script),'the steps render above everything else');
// the welcome flow deliberately shows a bare header, so the button waits for it
ok(/app\.view==='onboard'\?'<header class="top">/.test(script),
  'the welcome screen replaces the whole top bar, so no install button competes with it');
ok(/const chrome=app\.view==='onboard'\?[\s\S]{0,200}:head;/.test(script),
  'and the normal bar — with the button on it — returns as soon as the welcome is done');
const bundle=readFileSync('build/pwa-sw.html','utf8');
ok(/__deferredInstall/.test(bundle),'the published bundle catches the offer early');
ok(!/Install app/.test(bundle),'and no longer floats a second button of its own');
ok(/serviceWorker/.test(bundle)&&/register\('sw\.js'\)/.test(bundle),'while still registering the service worker');

console.log('\n✅ install: '+pass+' checks passed');
