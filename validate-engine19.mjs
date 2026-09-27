// Two engines: Stockfish 19 for analysis and Game Review, Stockfish 10 for
// your opponents, each falling back to the other.   node validate-engine19.mjs
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolveObjectURL } from 'buffer';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/app/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};
dom.window.__PUZZLES=[];
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const until=async(f,ms)=>{const t0=Date.now();while(!f()&&Date.now()-t0<(ms||3000))await tick(10);return f();};

/* ---- where the page is: a web address, or a file on the device ---- */
let loc={protocol:'http:',href:'http://localhost/app/'};
Object.defineProperty(globalThis,'location',{get:()=>loc,configurable:true});

/* ---- the network: exactly these addresses answer ---- */
const SF19='stockfish-19-lite-single';
const SITE19='http://localhost/app/engine/'+SF19;
const JSD19='https://cdn.jsdelivr.net/npm/stockfish@19.0.0/bin/'+SF19,UNPKG19='https://unpkg.com/stockfish@19.0.0/bin/'+SF19;
const SF10='https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';
let served={},fetched=[];
const online=()=>{served={[SITE19+'.js']:'SF19 from the site',[JSD19+'.js']:'SF19 from jsDelivr',[UNPKG19+'.js']:'SF19 from unpkg',[SF10]:'SF10'};};
globalThis.fetch=async(u)=>{u=String(u);fetched.push(u);if(!(u in served))throw new Error('offline');const v=served[u];
  return v==null?{ok:false,status:404,text:async()=>''}:{ok:true,status:200,text:async()=>v};};

/* ---- a stand-in engine worker. What it does depends on which build it is:
   'ok' answers like Stockfish, 'silent' never answers, 'error' fails to start ---- */
const workers=[];let mode=()=>'ok';
globalThis.Worker=class{
  constructor(url){
    this.url=url;this.sent=[];workers.push(this);
    const [blob,hash]=String(url).split('#');this.wasm=hash?decodeURIComponent(hash):null;
    this.boot=resolveObjectURL(blob).text().then(t=>{this.js=t;this.mode=mode(t);
      if(this.mode==='error')setTimeout(()=>this.onerror&&this.onerror(new Error('WebAssembly unavailable')),5);});
  }
  postMessage(cmd){this.sent.push(cmd);this.boot.then(()=>{
    if(this.mode!=='ok'||this.dead)return;
    const say=l=>setTimeout(()=>{if(!this.dead&&this.onmessage)this.onmessage({data:l});},2);
    if(cmd==='isready')say('readyok');
    if(cmd.indexOf('go')===0){say('info depth 14 seldepth 20 multipv 1 score cp 31 nodes 1000 pv e2e4 e7e5');say('bestmove e2e4 ponder e7e5');}
  });}
  terminate(){this.dead=true;}
};
const X=new Function(script+'\nreturn {store,app,go,render,Engine,BotEngine,ENGINE_WAIT,sf19Sources,sf10Sources,startPlay,playHint,anaOpen,reviewStart,analysePos};')();
const $=q=>document.querySelector(q);
const fresh=E=>{if(E.worker&&E.worker.terminate)E.worker.terminate();
  Object.assign(E,{worker:null,ready:false,loading:null,label:null,_cur:null,_next:null,_stopping:false,_orphans:0});};
const both=()=>{fresh(X.Engine);fresh(X.BotEngine);workers.length=0;fetched.length=0;};
const gos=w=>w?w.sent.filter(c=>c.indexOf('go')===0).length:0;

/* ================= which engine each one tries, and in what order ================= */
online();
let src=X.Engine.sources();
ok(src.slice(0,3).every(x=>x.label==='Stockfish 19')&&src.slice(3).every(x=>x.label==='Stockfish 10')&&src.length===6,
  'analysis tries Stockfish 19 first, then Stockfish 10');
ok(src[0].jsUrl===SITE19+'.js'&&src[0].wasmUrl===SITE19+'.wasm','on the website it comes from the site itself (the engine/ folder beside the page)');
ok(src[1].jsUrl===JSD19+'.js'&&src[2].jsUrl===UNPKG19+'.js','then from npm’s CDNs');
src=X.BotEngine.sources();
ok(src.slice(0,3).every(x=>x.label==='Stockfish 10')&&src.slice(3).every(x=>x.label==='Stockfish 19'),'your opponents try Stockfish 10 first, the engine their strengths were calibrated on');
ok(X.Engine.sources().filter(x=>x.label==='Stockfish 19').every(x=>x.strict)&&X.sf10Sources().every(x=>!x.strict),
  'Stockfish 19 has to answer to be used; Stockfish 10 keeps its old benefit of the doubt');
loc={protocol:'file:',href:'file:///sdcard/Download/ChessCareer-standalone.html'};
ok(!X.sf19Sources().some(x=>/^file:/.test(x.jsUrl||'')),'opened as a file there is no folder to fetch from (a worker cannot read file://), so only the CDNs are left');
const WASM=Buffer.from([0x00,0x61,0x73,0x6d,0x01,0x00,0x00,0x00,0x2a]);
dom.window.__SF19={js:'SF19 embedded',wasm:WASM.toString('base64')};
ok(X.sf19Sources()[0].js==='SF19 embedded'&&X.sf19Sources()[0].wasmB64,'with the engine inside the file, that copy comes first');
loc={protocol:'http:',href:'http://localhost/app/'};delete dom.window.__SF19;

/* ================= on the website ================= */
both();online();
ok(await X.Engine.load()&&X.Engine.label==='Stockfish 19','the analysis engine loads: Stockfish 19');
let aw=X.Engine.worker;
ok(aw.js==='SF19 from the site'&&aw.wasm===SITE19+'.wasm','from the site, told where its .wasm is after the # (a worker made from a blob has no folder)');
ok(!fetched.some(u=>/stockfish\.js@10/.test(u)),'without fetching the old engine at all');
ok(await X.BotEngine.load()&&X.BotEngine.label==='Stockfish 10','your opponents load Stockfish 10');
let bw=X.BotEngine.worker;
ok(bw&&bw!==aw&&bw.js==='SF10','in a worker of their own');

/* ================= each question goes to the right engine ================= */
let ev=null;X.analysePos('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',v=>{ev=v;},{force:true});
await until(()=>ev);
ok(ev&&ev.eng==='Stockfish 19'&&ev.d===14,'an evaluation says which engine gave it ('+(ev&&ev.eng)+', depth '+(ev&&ev.d)+')');
ok(gos(aw)===1&&gos(bw)===0,'analysis runs on Stockfish 19 only');
X.startPlay(new Chess().fen(),'b',null,'vs engine',{});
await until(()=>X.app.playMoves&&X.app.playMoves.length===1,5000);
ok(X.app.playMoves.length===1&&gos(bw)===1&&gos(aw)===1,'the opponent’s move is thought on Stockfish 10, not the analysis engine');
X.app.playStatus='play';X.playHint();
await until(()=>gos(aw)===2);
ok(gos(aw)===2&&gos(bw)===1,'a hint is analysis: Stockfish 19');
X.app.playStatus='over';

/* ================= what you see ================= */
X.store.settings.anaEngine=true;
X.anaOpen(new Chess().fen(),['e4','e5'],2,'Test');X.go('analysis');
await until(()=>/Stockfish 19 · depth 14/.test($('#app').textContent));
ok(/Stockfish 19 · depth 14/.test($('#app').textContent),'the analysis board says “Stockfish 19 · depth 14”');
X.reviewStart([{san:'e4'},{san:'e5'},{san:'Nf3'}]);
await until(()=>X.app.review&&X.app.review.status==='done',5000);
ok(X.app.review.status==='done'&&X.app.review.eng==='Stockfish 19','Game Review runs on Stockfish 19');
ok($('#reveng')&&/Reviewed by Stockfish 19\./.test($('#reveng').textContent),'and says so under the accuracy');

/* ================= when a copy is missing ================= */
both();online();delete served[SITE19+'.js'];served[SITE19+'.js']=null;   // a 404
await X.Engine.load();
ok(X.Engine.label==='Stockfish 19'&&X.Engine.worker.js==='SF19 from jsDelivr'&&X.Engine.worker.wasm===JSD19+'.wasm','no engine/ folder on the site: Stockfish 19 from jsDelivr instead');

/* ================= when a browser cannot run it ================= */
both();online();mode=t=>/^SF19/.test(t)?'error':'ok';
let t0=Date.now();await X.Engine.load();
ok(X.Engine.label==='Stockfish 10','a browser that cannot run Stockfish 19 analyses with Stockfish 10');
ok(Date.now()-t0<X.ENGINE_WAIT.strict/2,'straight away, on the worker’s error, not after the full wait ('+(Date.now()-t0)+' ms)');
ok(workers.filter(w=>/^SF19/.test(w.js)).every(w=>w.dead),'each failed worker is shut down');
X.ENGINE_WAIT.strict=60;X.ENGINE_WAIT.lenient=60;
both();online();mode=t=>/^SF19/.test(t)?'silent':'ok';
await X.Engine.load();
ok(X.Engine.label==='Stockfish 10'&&workers.filter(w=>/^SF19/.test(w.js)).length===3&&workers.filter(w=>/^SF19/.test(w.js)).every(w=>w.dead),
  'one that starts but never answers is given its time, shut down, and the next one tried');
both();online();mode=t=>t==='SF10'?'silent':'ok';
await X.BotEngine.load();
ok(X.BotEngine.label==='Stockfish 10'&&!X.BotEngine.worker.dead,'a slow Stockfish 10 is still used for your opponents, as it always was');
mode=()=>'ok';

/* ================= the standalone file, offline ================= */
both();served={};loc={protocol:'file:',href:'file:///sdcard/Download/ChessCareer-standalone.html'};
dom.window.__SF19={js:'SF19 embedded',wasm:WASM.toString('base64')};
ok(await X.Engine.load()&&X.Engine.label==='Stockfish 19'&&X.Engine.worker.js.endsWith('SF19 embedded'),'offline, the standalone file analyses with the Stockfish 19 inside it');
// A worker started from a page opened as a file has an origin of its own and may not read
// the page's blob: URLs (Chromium: "Failed to fetch"), so the .wasm goes inside the worker's script.
const ew=X.Engine.worker,pre=ew.js.slice(0,ew.js.length-'SF19 embedded'.length);
ok(ew.wasm==='embedded-engine.wasm'&&!/^blob:/.test(ew.wasm),'its .wasm is not handed over as a page blob, which such a worker could not read');
const passed=[];const wself={fetch:async u=>{passed.push(String(u));return 'network';}};
new Function('self','atob','Response',pre)(wself,atob,Response);
const res=await wself.fetch(ew.wasm);
ok(res.headers.get('content-type')==='application/wasm'&&Buffer.from(await res.arrayBuffer()).equals(WASM)&&passed.length===0,
  'it travels inside the worker’s own script, and the loader’s fetch of it gets exactly the embedded bytes, as application/wasm');
ok(Buffer.from(await (await wself.fetch(ew.wasm)).arrayBuffer()).equals(WASM),'every time it asks (a failed streaming compile retries)');
ok(await wself.fetch('https://example.test/x')==='network'&&passed[0]==='https://example.test/x','anything else the worker fetches goes to the network as usual');
ok(await X.BotEngine.load()&&X.BotEngine.label==='Stockfish 19','and with no way to fetch Stockfish 10, your opponents play on it too — the game still works');
ok(!fetched.some(u=>/stockfish-19/.test(u)),'without trying to download a copy it already has');
both();delete dom.window.__SF19;
ok(!(await X.Engine.load()),'with no copy and no network the engine reports that it could not load');
loc={protocol:'http:',href:'http://localhost/app/'};X.ENGINE_WAIT.strict=10000;X.ENGINE_WAIT.lenient=4000;

/* ================= the files and the builds ================= */
const bin=readFileSync('build/engine/'+SF19+'.wasm'),js=readFileSync('build/engine/'+SF19+'.js','utf8');
ok(bin.slice(0,4).equals(Buffer.from([0,0x61,0x73,0x6d]))&&bin.length>1e6,'build/engine has the WebAssembly engine ('+(bin.length/1048576).toFixed(1)+' MB)');
ok(js.length>10000&&/location\.hash|self\.location/.test(js),'and its loader, which reads the .wasm address from after the #');
ok(/GNU GENERAL PUBLIC LICENSE/.test(readFileSync('build/engine/COPYING.txt','utf8'))&&/Version 3/.test(readFileSync('build/engine/COPYING.txt','utf8')),'with the GPL v3 it is distributed under');
ok(/"stockfish" version 19\.0\.0/.test(readFileSync('build/engine/README.txt','utf8'))&&/github\.com/.test(readFileSync('build/engine/README.txt','utf8')),'and where it comes from, and where its source is');
const netl=readdirSync('netlify/engine').sort().join(',');
ok(netl===readdirSync('build/engine').sort().join(',')&&readdirSync('build/engine').every(f=>readFileSync('build/engine/'+f).equals(readFileSync('netlify/engine/'+f))),
  'the netlify bundle carries the same files in engine/');
ok(/build\/engine|'build',\s*'engine'/.test(readFileSync('build-netlify.mjs','utf8'))&&/netlify\/engine|'engine'/.test(readFileSync('build-netlify.mjs','utf8')),'copied there by build-netlify.mjs');
const { embedEngine } = await import('./build/embed-engine.mjs');
const page='<!doctype html><html><head></head><body><script type="module">/* app */</script></body></html>';
const emb=embedEngine(page);
const at=emb.indexOf('window.__SF19='),end=emb.indexOf(';</script>',at);
const data=JSON.parse(emb.slice(at+'window.__SF19='.length,end).replace(/<\\\//g,'</'));
ok(at>0&&at<emb.indexOf('<script type="module">'),'embedding puts the engine in a script before the app’s own');
ok(data.js===js&&Buffer.from(data.wasm,'base64').equals(bin),'the loader and every byte of the .wasm');
ok(!/<\/script/i.test(emb.slice(at,end)),'without anything inside it that could end the script early');
ok(embedEngine(emb)===emb,'and embedding twice changes nothing');
ok(/embedEngine\(html\)/.test(readFileSync('build-standalone.mjs','utf8')),'the standalone build embeds it');
if(existsSync('ChessCareer-standalone.html'))ok(/window\.__SF19=/.test(readFileSync('ChessCareer-standalone.html','utf8')),'and the built standalone file has it inside');
const sw=readFileSync('netlify/sw.js','utf8');
ok(/const ENGINE = \[[^\]]*engine\/stockfish-19-lite-single\.js[^\]]*engine\/stockfish-19-lite-single\.wasm/.test(sw),'the installed web app keeps the engine for offline use');
ok(/c\.addAll\(SHELL\)\.catch[^;]*c\.addAll\(ENGINE\)\.catch/.test(sw),'cached apart from the app shell, so a missing engine never stops the app from installing');
ok(/cp -r netlify\/engine _site\/engine/.test(readFileSync('.github/workflows/pages.yml','utf8')),'GitHub Pages publishes engine/ beside the page');
const andr=readFileSync('.github/workflows/android.yml','utf8');
ok(/node build\/embed-engine\.mjs "\$WWW\/index\.html"/.test(andr)&&andr.indexOf('embed-engine')>andr.indexOf('cp netlify/index.html'),'the Android build puts the engine inside the app’s page (its WebView workers cannot read file://)');

const www=readFileSync('app_project/android/app/src/main/assets/www/index.html','utf8');
ok(www===embedEngine(readFileSync('netlify/index.html','utf8')),'and the app’s committed page is the web page with the engine inside, so a local ./gradlew build has it too');

console.log('\n✅ engine19: '+pass+' checks passed');
process.exit(0);
