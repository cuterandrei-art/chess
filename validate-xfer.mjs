// Moving progress between devices: sending, receiving, and the preview that
// stands between a file and your save.   node validate-xfer.mjs
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
globalThis.FileReader=dom.window.FileReader; if(!globalThis.File)globalThis.File=dom.window.File;
dom.window.__PUZZLES=[];
// Node 21 gave globalThis a `navigator`; Node 20, which CI runs, has none.
if(!globalThis.navigator||typeof globalThis.navigator!=='object')globalThis.navigator={};
const NAV={ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 Safari/537.36',touch:0};
Object.defineProperty(globalThis.navigator,'userAgent',{get:()=>NAV.ua,configurable:true});
Object.defineProperty(globalThis.navigator,'maxTouchPoints',{get:()=>NAV.touch,configurable:true});
const LOC={search:''};
globalThis.location={get protocol(){return 'https:';},get href(){return 'https://example.test/'+LOC.search;},get search(){return LOC.search;},pathname:'/',reload(){}};
globalThis.history={replaceState(){LOC.search='';}};
// downloads are anchors being clicked
const downloads=[];
dom.window.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,href:this.href});};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const X=new Function(script+'\nreturn {store,app,render,go,save,DEF,freshCareer,restoreBackup,previewBackup,receiveBackup,applyReceived,sendProgress,backupJson,backupName,deviceLabel,progressWeight,progressLines,xferSheet,xferCard,xferCheckInbox,dayKey};')();
const $=q=>document.querySelector(q);
const click=act=>{const b=$('[data-act="'+act+'"]');if(!b)throw new Error('no button '+act);b.click();};
const LS='opening-trainer-standalone-v1';

/* a device with a career well under way */
function withCareer(weeks,name){
  const c=X.freshCareer();Object.assign(c,{setup:true,name:name||'Ada Marín',rating:2210,provisional:false,titles:['CM'],weeks,played:weeks*3});
  X.store.career=c;X.store.repertoire=['italian','french'];X.store.puzzle=Object.assign({},X.DEF.puzzle,{solved:40,failed:12,rating:1640});
  X.store.stats=Object.assign({},X.DEF.stats,{total:300});X.save();
}
function blank(){X.store.career=X.freshCareer();X.store.repertoire=[];X.store.puzzle=JSON.parse(JSON.stringify(X.DEF.puzzle));
  X.store.stats=JSON.parse(JSON.stringify(X.DEF.stats));X.store.studies=[];X.store.myGames=[];X.store.custom=[];X.save();}

/* ================= what a device is called ================= */
ok(X.deviceLabel('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36')==='Android phone','an Android phone is an Android phone');
ok(X.deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126')==='Windows PC','Windows is a Windows PC');
ok(X.deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/604.1')==='iPhone','an iPhone is not called a Mac');
ok(X.deviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/605.1.15')==='Mac','a Mac is a Mac');

/* ================= the file itself ================= */
withCareer(40);
const json=X.backupJson();const parsed=JSON.parse(json);
ok(parsed._app==='chess-career'&&!isNaN(Date.parse(parsed._saved))&&parsed._device==='Windows PC','the file says what made it, when, and on which device');
ok(parsed.career.weeks===40&&parsed.repertoire.length===2,'and carries the whole save');
ok(/^chess-career-backup-\d{4}-\d{2}-\d{2}\.json$/.test(X.backupName()),'it is named after the day ('+X.backupName()+')');

/* ================= the preview stands between the file and the save ================= */
let p=X.previewBackup(json);
ok(p.ok&&p.same,'the file this device just made is recognised as what is already here');
ok(!X.previewBackup('not json').ok&&!X.previewBackup('[1]').ok&&!X.previewBackup('{"x":1}').ok,'junk, arrays and foreign JSON are refused');
ok(/no progress/.test(X.previewBackup('{"x":1}').error),'and the refusal says why');

// an older copy of the same career: the file is behind this device
const older=JSON.parse(json);older.career.weeks=12;older.career.played=36;older._saved=new Date(Date.now()-3*86400000).toISOString();older._device='Android phone';
p=X.previewBackup(JSON.stringify(older));
ok(p.ok&&!p.same,'an older copy is a real difference');
ok(p.warn&&/week 12/.test(p.warn)&&/week 40/.test(p.warn)&&/28 weeks/.test(p.warn),'going back 28 weeks is spelled out ('+p.warn+')');
ok(p.savedText==='3 days ago'&&p.file.device==='Android phone','with where the file came from and how old it is');
const beforeWeeks=X.store.career.weeks;
X.receiveBackup(JSON.stringify(older),'file');
ok(X.store.career.weeks===beforeWeeks,'receiving it changes nothing yet');
let sheet=$('[role="dialog"]');
ok(sheet&&/In the file/.test(sheet.textContent)&&/On this device/.test(sheet.textContent),'the preview shows both sides');
ok(/week 12/.test(sheet.textContent)&&/week 40/.test(sheet.textContent),'each with its own career');
ok($('[data-act="xferapply"]').className.indexOf('danger')>=0,'replacing newer progress is the red button');
click('xferclose');
ok(!$('[role="dialog"]')&&X.store.career.weeks===40,'“Keep what’s here” keeps it');

// a newer copy: the file is ahead
const newer=JSON.parse(json);newer.career.weeks=55;newer.career.played=165;newer.career.rating=2290;
p=X.previewBackup(JSON.stringify(newer));
ok(p.ok&&!p.warn,'a file that is ahead of this device carries no warning');
X.receiveBackup(JSON.stringify(newer),'drop');
ok(/dropped on the window/.test($('[role="dialog"]').textContent),'the preview says how the file arrived');
ok($('[data-act="xferapply"]').className.indexOf('primary')>=0,'and moving forward is the ordinary button');
click('xferapply');
ok(X.store.career.weeks===55&&X.store.career.rating===2290,'pressing it moves the progress over');
ok(JSON.parse(localStorage.getItem(LS)).career.weeks===55,'and it is saved, not only in memory');
ok(/Progress moved/.test($('[role="dialog"]').textContent)&&/week 55/.test($('[role="dialog"]').textContent),'the result says what arrived');
click('xferclose');

// a file with no career would wipe one
const nocareer=JSON.parse(json);delete nocareer.career;nocareer.repertoire=['italian'];
p=X.previewBackup(JSON.stringify(nocareer));
ok(p.warn&&/no career/.test(p.warn),'a file with no career warns before blanking the one here');

// a new phone has nothing to lose
blank();
p=X.previewBackup(JSON.stringify(newer));
ok(p.ok&&p.fresh&&!p.warn,'a fresh device has nothing to lose, so no warning');
X.receiveBackup(JSON.stringify(newer),'share');
ok(/Use the file’s progress/.test($('[data-act="xferapply"]').textContent),'and the button just says to use the file');
click('xferapply');click('xferclose');
ok(X.store.career.setup&&X.store.career.weeks===55,'a new phone picks the career up where the PC left it');

/* ================= sending ================= */
withCareer(40);
// 1) a browser that can share files: the share sheet, synchronously from the tap
let shared=[];let shareMode='ok';
globalThis.navigator.canShare=d=>!!(d&&d.files&&d.files.length);
globalThis.navigator.share=d=>{shared.push(d);return shareMode==='ok'?Promise.resolve():Promise.reject(Object.assign(new Error('x'),{name:shareMode}));};
X.go('settings');
ok($('#xfercard')&&$('[data-act="xfersend"]')&&$('[data-act="import"]')&&$('[data-act="export"]'),'Settings has send, receive and save-a-file');
downloads.length=0;
click('xfersend');
ok(shared.length===1,'“Send” opens the share sheet before anything is awaited (a browser only allows it during the tap)');
await tick();
const f=shared[0].files[0];
ok(f.name===X.backupName()&&f.type==='application/json','it shares one .json file with the day in its name');
const sent=JSON.parse(await f.text());
ok(sent.career.weeks===40&&sent._app==='chess-career','holding the whole save');
ok(downloads.length===0,'nothing is downloaded as well');
ok(/Sent/.test($('#xfercard').textContent)&&X.store.settings.lastSent>0,'it confirms, and remembers when');
ok(/Last sent from here just now/.test($('#xfercard').textContent),'Settings shows when it was last sent');
// 2) cancelled: nothing else happens
shareMode='AbortError';shared.length=0;
click('xfersend');await tick();
ok(shared.length===1&&downloads.length===0&&/cancelled/.test($('#xfercard').textContent),'a cancelled share is just cancelled — no surprise download');
// 3) a share that fails for another reason falls back to a download
shareMode='NotAllowedError';
click('xfersend');await tick();
ok(downloads.length===1&&downloads[0].name===X.backupName(),'a share that fails for another reason saves the file instead');
// 4) a browser with no file sharing downloads, and says what to do next
delete globalThis.navigator.canShare;delete globalThis.navigator.share;downloads.length=0;
click('xfersend');await tick();
ok(downloads.length===1&&/Saved as chess-career-backup-/.test($('#xfercard').textContent)&&/Receive progress/.test($('#xfercard').textContent),'without a share sheet it downloads and says how to finish on the other device');
// 5) the Android app hands it to the native share sheet
const bridgeCalls=[];let incoming='';
dom.window.AndroidBridge={shareBackup:(n,j)=>bridgeCalls.push({n,j}),takeIncoming:()=>{const t=incoming;incoming='';return t;}};
downloads.length=0;
click('xfersend');await tick();
ok(bridgeCalls.length===1&&bridgeCalls[0].n===X.backupName()&&JSON.parse(bridgeCalls[0].j).career.weeks===40,'inside the Android app the native share sheet gets the file');
ok(downloads.length===0,'rather than a download a WebView cannot save');
// "Save a backup file" is always a plain download
click('export');
ok(downloads.length===1,'“Save a backup file” is a plain download everywhere');

/* ================= receiving ================= */
// Android "Open with Chess Career": the page asks the native side for it
incoming=JSON.stringify(newer);
dom.window.__androidIncoming();
ok(/opened with Chess Career/.test($('[role="dialog"]').textContent),'a backup opened with the Android app lands in the preview');
ok(dom.window.AndroidBridge.takeIncoming()==='','and is taken once, not twice');
click('xferclose');
incoming=JSON.stringify(newer);X.xferCheckInbox();
ok($('[role="dialog"]'),'one that arrived before the page was ready is picked up at start-up');
click('xferclose');
delete dom.window.AndroidBridge;

// the installed app's share-target inbox
const inbox=new Map();let deleted=0;
globalThis.caches={open:async()=>({match:async k=>inbox.has(k)?{text:async()=>inbox.get(k)}:undefined,delete:async k=>{deleted++;inbox.delete(k);return true;}})};
inbox.set('./__inbox__',JSON.stringify(newer));LOC.search='?receive=1';
X.xferCheckInbox();await tick(5);await tick(5);
ok(/from the share sheet/.test(($('[role="dialog"]')||{}).textContent||''),'a backup shared to the installed app from WhatsApp or Drive opens the preview');
ok(deleted===1&&!inbox.size,'the inbox is emptied, so it is not offered again');
ok(LOC.search==='','and ?receive=1 is taken off the address');
click('xferclose');
X.xferCheckInbox();await tick(5);
ok(!$('[role="dialog"]'),'an ordinary start-up does not look in the inbox');

// the file picker
X.go('settings');
const input=$('#importfile');
ok(input&&input.getAttribute('accept').indexOf('.json')>=0,'there is one file input, and it accepts .json');
ok(document.querySelectorAll('#importfile').length===1,'only one, wherever the button is');
Object.defineProperty(input,'files',{value:[new dom.window.File([JSON.stringify(older)],'b.json',{type:'application/json'})],configurable:true});
input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
await tick(20);
ok(/from a file/.test(($('[role="dialog"]')||{}).textContent||'')&&X.store.career.weeks===40,'a picked file opens the preview instead of overwriting at once');
click('xferclose');

// dropping a file on the window
const drop=(file)=>{const ev=new dom.window.Event('drop',{bubbles:true,cancelable:true});ev.dataTransfer={files:[file],types:['Files']};dom.window.dispatchEvent(ev);return ev;};
let ev=drop(new dom.window.File([JSON.stringify(newer)],'chess-career-backup.json',{type:'application/json'}));
await tick(20);
ok(ev.defaultPrevented&&/dropped on the window/.test(($('[role="dialog"]')||{}).textContent||''),'a backup dropped anywhere on the window opens the preview');
click('xferclose');
ev=drop(new dom.window.File(['hello'],'holiday.png',{type:'image/png'}));
ok(ev.defaultPrevented&&/not a Chess Career backup/.test($('[role="dialog"]').textContent),'any other file is refused with a reason instead of navigating away');
click('xferclose');

/* ================= a brand-new phone ================= */
localStorage.clear();blank();X.store.onboarded=false;X.app.view=null;X.app.onb=null;X.render();
ok(X.app.view==='onboard','a new phone starts on the setup questions');
ok($('[data-act="import"]')&&/another device/.test($('[data-act="import"]').textContent),'which offer “I already play on another device”');
X.receiveBackup(JSON.stringify(newer),'share');
ok($('[role="dialog"]')&&/In the file/.test($('[role="dialog"]').textContent),'a backup shared to it during setup still shows its preview');
click('xferapply');
ok(X.app.view==='career'&&X.store.onboarded&&X.store.career.weeks===55,'and moving it in skips the questions and lands on the career');
click('xferclose');

/* ================= reachable from everywhere ================= */
X.app.menuOpen=true;X.render();
ok($('[data-act="xferopen"]'),'the More menu has “Move progress to another device”');
click('xferopen');
ok(/Move your progress/.test($('[role="dialog"]').textContent)&&$('[role="dialog"] [data-act="xfersend"]'),'which opens the same send and receive buttons');
click('xferclose');
NAV.touch=5;X.go('settings');
ok(!/drop a backup file/.test($('#xfercard').textContent),'phones are not told to drop files on a window');
NAV.touch=0;X.render();
ok(/drop a backup file/.test($('#xfercard').textContent),'computers are');

/* ================= the service worker and the manifest agree ================= */
const man=JSON.parse(readFileSync('netlify/manifest.webmanifest','utf8'));
const sw=readFileSync('netlify/sw.js','utf8');
ok(man.share_target&&man.share_target.method==='POST'&&man.share_target.enctype==='multipart/form-data','the manifest offers the app as a share target');
ok(/share-target$/.test(man.share_target.action)&&sw.indexOf("endsWith('/share-target')")>=0,'posting to the same path the service worker catches');
ok(man.share_target.params.files[0].name==='backup'&&sw.indexOf("form.get('backup')")>=0,'under the same field name');
ok(man.share_target.params.files[0].accept.indexOf('application/json')>=0,'accepting JSON');
ok(sw.indexOf("'opening-trainer-inbox'")>=0&&script.indexOf("XFER_INBOX='opening-trainer-inbox'")>=0,'the inbox has the same name on both sides');
ok(/k !== CACHE && k !== INBOX/.test(sw),'and a new version of the app does not throw it away');
ok(/receive=1/.test(sw),'the worker sends the page to ?receive=1');

/* the worker itself, run against fake caches */
{
  const caches={},listeners={};
  const mkCache=()=>{const m=new Map();return {m,put:async(k,r)=>{m.set(typeof k==='string'?k:k.url,await r.text());},match:async(k,o)=>{const u=typeof k==='string'?k:k.url;
    if(m.has(u))return new Response(m.get(u));if(o&&o.ignoreSearch){const b=u.split('?')[0];for(const [kk,v] of m)if(kk.split('?')[0]===b)return new Response(v);}return undefined;},addAll:async()=>{},delete:async k=>m.delete(k)};};
  const env={self:{addEventListener:(t,f)=>listeners[t]=f,skipWaiting(){},clients:{claim(){}},registration:{scope:'https://example.test/app/'}},
    caches:{open:async n=>caches[n]||(caches[n]=mkCache()),keys:async()=>Object.keys(caches),delete:async n=>delete caches[n]},
    fetch:async()=>{throw new Error('offline');},Response,URL};
  new Function('self','caches','fetch','Response','URL',sw)(env.self,env.caches,env.fetch,env.Response,env.URL);
  const fd=new FormData();fd.append('backup',new Blob([JSON.stringify(newer)],{type:'application/json'}),'b.json');
  let responded=null;
  listeners.fetch({request:new Request('https://example.test/app/share-target',{method:'POST',body:fd}),respondWith:p=>responded=p});
  const res=await responded;
  ok(res.status===303&&res.headers.get('location')==='https://example.test/app/index.html?receive=1','a shared file is answered with a redirect into the app');
  ok(JSON.parse(caches['opening-trainer-inbox'].m.get('./__inbox__')).career.weeks===55,'with the file waiting in the inbox');
  await env.caches.open('opening-trainer-v1');
  let waited=null;listeners.activate({waitUntil:p=>waited=p});await waited;
  ok(caches['opening-trainer-inbox']&&!caches['opening-trainer-v1'],'activating a new version clears old caches but not the inbox');
  const shell=(sw.match(/const CACHE = '([^']+)'/)||[])[1];
  await (await env.caches.open(shell)).put('https://example.test/app/index.html',new Response('<shell>'));
  responded=null;
  listeners.fetch({request:{method:'GET',url:'https://example.test/app/index.html?receive=1',mode:'navigate'},respondWith:p=>responded=p});
  ok(await (await responded).text()==='<shell>','offline, the ?receive=1 page is still the cached app');
}

/* ================= the Android app ================= */
const am=readFileSync('app_project/android/app/src/main/AndroidManifest.xml','utf8');
const ma=readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/MainActivity.java','utf8');
const bp=readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/BackupProvider.java','utf8');
ok(/android\.intent\.action\.SEND[\s\S]*?application\/json/.test(am)&&/android\.intent\.action\.VIEW[\s\S]*?application\/json/.test(am),'the Android app is offered for .json shares and “Open with”');
const auth=(bp.match(/AUTHORITY = "([^"]+)"/)||[])[1];
ok(auth&&am.indexOf('android:authorities="'+auth+'"')>=0,'its file provider is registered under the authority the code uses');
ok(/android:exported="false"/.test(am.slice(am.indexOf('<provider')))&&/grantUriPermissions="true"/.test(am),'and is private, reachable only through the share grant');
ok(/addJavascriptInterface\(new Bridge\(\), "AndroidBridge"\)/.test(ma)&&/public void shareBackup\(String name, String json\)/.test(ma)&&/public String takeIncoming\(\)/.test(ma),'the bridge has the two methods the page calls');
ok(/window\.__androidIncoming&&window\.__androidIncoming\(\)/.test(ma)&&/window\.__androidIncoming=function/.test(script),'and calls back into the page under the name the page listens on');
ok(/onShowFileChooser/.test(ma)&&/parseResult/.test(ma),'“Receive progress” has a real file chooser inside the WebView');
ok(/pageUrl\.startsWith\(HOME\)/.test(ma),'only the bundled app may use the bridge');
ok(/contains\("\.\."\)/.test(bp),'the provider refuses paths outside its folder');

console.log('\n✅ xfer: '+pass+' checks passed');
