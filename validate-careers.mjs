// Several careers at once: keep them side by side and switch between them.
//   node validate-careers.mjs
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
globalThis.fetch=async()=>{throw new Error('offline in the test');};
dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.__PUZZLES=[];
const LS='opening-trainer-standalone-v1',RESUME='chess-career-resume-v1';
localStorage.setItem(LS,JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const RET='store,app,go,render,careerSlots,careerCount,careerPack,careerUnpack,careerSwitch,careerStartAnother,MAX_CAREERS,backupJson,restoreBackup,previewBackup,progressLines,srchFind,srchGoScreen,playSavedGame,joinTournament,TOURNAMENTS';
const X=new Function(script+'\nreturn {'+RET+'};')();
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const click=(act,val)=>{const b=$('[data-act="'+act+'"]'+(val!=null?'[data-val="'+val+'"]':''));if(!b)throw new Error('no button '+act+' '+(val||''));b.click();return b;};
const idle=async()=>{for(let i=0;i<300&&X.app.careerBusy;i++)await tick(5);await tick(5);};
const setup=(name,fed)=>{X.go('career');$('#cr-name').value=name;if(fed)$('#cr-fed').value=fed;click('careersetup');return X.store.career;};
// what a career is, less two bits of bookkeeping: a game parked for later, and which of
// the other careers its world has caught up with (that changes when they do)
const strip=c=>{const x=JSON.parse(JSON.stringify(c));delete x.parked;if(x.wx)delete x.wx.gsync;return JSON.stringify(x);};
const text=()=>$('#app').textContent;

/* ================= one career, then another beside it ================= */
let A=setup('Ana Popescu','ROU');
Object.assign(A,{provisional:false,rating:2104,peak:2150,ratedGames:60,money:3210,weeks:77,season:2,titles:['CM']});
A.story={note:'a line that must come back exactly'};
X.render();
ok(A.cid&&/^c/.test(A.cid),'a career gets an identity when it begins');
ok($('[data-act="careersopen"]')&&!$('[data-act="careersopen"] b'),'the career line has a 👥 button (no count while there is only one career)');
click('careersopen');
ok($('#careerscard')&&/Ana Popescu/.test($('#careerscard').textContent)&&/playing now/.test($('#careerscard').textContent),'it opens “Your careers”, with the one you are playing');
ok(/1 of 8/.test($('#careerscard').textContent)&&$('[data-act="careeranother"]')&&!$('[data-act="careeranother"]').disabled,'room for '+X.MAX_CAREERS+', and a button to start another');
const aJson=strip(A);
click('careeranother');await idle();
ok(X.careerSlots().length===1&&X.careerSlots()[0].meta.name==='Ana Popescu'&&X.careerSlots()[0].meta.rating===2104,'“Start another career” puts Ana’s aside, with what the list shows about it');
ok(!X.store.career.setup&&$('#cr-name'),'and opens the setup for a new one');
ok($('#careerscard')&&/Or carry on with one of your careers/.test(text())&&$('[data-act="careerswitch"][data-val="'+A.cid+'"]'),'which offers Ana’s career to go back to');
const slot=X.careerSlots()[0];
ok(typeof slot.z==='string'&&slot.z.length<aJson.length,'kept gzipped ('+slot.z.length+' characters for '+aJson.length+' of career)');
let B=setup('Bogdan Ionescu','ROU');
Object.assign(B,{rating:null,provisional:true,ratedGames:3,money:120,weeks:4});
X.render();
ok(B.cid&&B.cid!==A.cid,'the second career has its own identity');
ok($('[data-act="careersopen"] b')&&$('[data-act="careersopen"] b').textContent==='2','the 👥 button now says 2');

/* ================= switching ================= */
X.app.careerFinish={published:true,rating:1500};X.app.decLater=['press'];X.app.careerTab='world';X.app.careerToast='old news';
click('careersopen');
const bJson=strip(X.store.career);      // as it is when put aside (drawing the screen fills in a few things on first sight)
click('careerswitch',A.cid);await idle();
ok(X.store.career.name==='Ana Popescu'&&strip(X.store.career)===aJson,'▶ Play brings Ana’s career back exactly as it was left — every field');
ok(X.careerSlots().length===1&&X.careerSlots()[0].meta.name==='Bogdan Ionescu','and puts Bogdan’s aside');
ok(!X.app.careerFinish&&!X.app.decLater&&X.app.careerTab==='play'&&!X.app.careersOpen,'nothing on the screen from the other career comes with it (the result banner, the decisions put off, the tab)');
ok(/Now playing CM Ana Popescu’s career — Bogdan Ionescu waits where you left it/.test(text()),'and it says which career you are in');
click('careersopen');click('careerswitch',B.cid);await idle();
ok(strip(X.store.career)===bJson,'and back again: Bogdan exactly as left');
ok(JSON.parse(localStorage.getItem(LS)).careerSlots.length===1,'the careers are saved');

/* ================= an unfinished game belongs to its career ================= */
const fen='rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const game={v:1,fen,startFen:new Chess().fen(),stack:[new Chess().fen(),fen],moves:[{from:'e2',to:'e4',san:'e4'}],side:'w',title:'Bogdan vs the club champion',at:Date.now(),career:{opp:{name:'Club Champion',rating:1650}}};
localStorage.setItem(RESUME,JSON.stringify(game));
X.render();
ok(/You have a game in progress/.test(text()),'Bogdan has a career game in progress');
click('careersopen');click('careerswitch',A.cid);await idle();
ok(!localStorage.getItem(RESUME)&&!/You have a game in progress/.test(text()),'switching to Ana takes it off the screen — it is not her game');
click('careersopen');click('careerswitch',B.cid);await idle();
ok(localStorage.getItem(RESUME)&&JSON.parse(localStorage.getItem(RESUME)).title==='Bogdan vs the club champion'&&/You have a game in progress/.test(text()),'back with Bogdan, the game is waiting to be resumed');
// a free game saved in the meantime keeps its place, and the career game waits for it
click('careersopen');click('careerswitch',A.cid);await idle();
const free=Object.assign({},game,{title:'A free game',career:null});
localStorage.setItem(RESUME,JSON.stringify(free));
click('careersopen');click('careerswitch',B.cid);await idle();
ok(JSON.parse(localStorage.getItem(RESUME)).title==='A free game'&&X.store.career.parked,'if a free game is saved when you come back, it keeps its place, and Bogdan’s game waits');
localStorage.removeItem(RESUME);X.render();
ok(JSON.parse(localStorage.getItem(RESUME)).title==='Bogdan vs the club champion'&&!X.store.career.parked,'and returns as soon as the free game is done');
localStorage.removeItem(RESUME);

/* ================= an event in progress travels too ================= */
const club=X.TOURNAMENTS.find(t=>t.id==='club');
X.joinTournament('club');
const tourB=X.store.career.tour?JSON.stringify(X.store.career.tour):null;
click('careersopen');click('careerswitch',A.cid);await idle();
ok(!X.store.career.tour||JSON.stringify(X.store.career.tour)!==tourB,'Ana is not in Bogdan’s event');
click('careersopen');click('careerswitch',B.cid);await idle();
ok(tourB===null||JSON.stringify(X.store.career.tour)===tourB,'and Bogdan is still in it, at the same round'+(tourB?'':' (no event joinable here)'));

/* ================= deleting, and the limit ================= */
click('careersopen');
click('careerdel',A.cid);
ok(X.app.confirm&&/Delete CM Ana Popescu|Delete Ana Popescu/.test(X.app.confirm.msg)&&/cannot be brought back/.test(X.app.confirm.msg),'🗑 asks first, and says it cannot be undone');
click('confirmno');
ok(X.careerSlots().length===1,'Cancel keeps it');
for(let i=0;X.careerCount()<X.MAX_CAREERS;i++){await X.careerStartAnother();setup('Player '+i);}
X.app.careersOpen=true;X.render();
ok(X.careerCount()===X.MAX_CAREERS&&$('[data-act="careeranother"]').disabled&&/most there is room for/.test($('#careerscard').textContent),'with '+X.MAX_CAREERS+' careers there is no room for another, and it says so');
const before=JSON.stringify(X.store.career);await X.careerStartAnother();
ok(JSON.stringify(X.store.career)===before&&X.careerCount()===X.MAX_CAREERS,'and asking anyway changes nothing');
const victim=X.careerSlots().find(x=>/Player 0/.test(x.meta.name));
click('careerdel',victim.id);click('confirmyes');
ok(!X.careerSlots().some(x=>x.id===victim.id)&&X.careerCount()===X.MAX_CAREERS-1,'Confirm deletes that career, and only that one');

/* ================= nothing is lost when something goes wrong ================= */
const cur=JSON.stringify(X.store.career),sl0=JSON.stringify(X.careerSlots());
const broken=X.careerSlots()[1];const keepZ=broken.z;broken.z='not gzip at all';
X.app.careersOpen=true;X.render();click('careerswitch',broken.id);await idle();
ok(JSON.stringify(X.store.career)===cur&&/could not be opened/.test(text())&&/Nothing was changed/.test(text()),'a career that cannot be opened is reported, and the one you are in stays');
broken.z=keepZ;ok(JSON.stringify(X.careerSlots())===sl0,'and the list is as it was');

/* ================= an old browser ================= */
const CS=globalThis.CompressionStream;delete globalThis.CompressionStream;
const rawSlot=await X.careerPack(Object.assign({},X.store.career));
ok(rawSlot.raw&&!rawSlot.z,'a browser without compression keeps a career as it is');
ok((await X.careerUnpack(rawSlot)).name===X.store.career.name,'and opens it again');
globalThis.CompressionStream=CS;

/* ================= backups and the move between devices ================= */
const back=JSON.parse(X.backupJson());
ok(Array.isArray(back.careerSlots)&&back.careerSlots.length===X.careerSlots().length,'a backup carries every career, not only the one being played');
ok(X.progressLines(back).some(l=>/👥 \d+ more careers?: /.test(l)),'and the restore preview lists them ('+X.progressLines(back).find(l=>/👥/.test(l))+')');
const noSlots=Object.assign({},back);delete noSlots.careerSlots;
const pv=X.previewBackup(JSON.stringify(noSlots));
ok(pv.ok&&pv.warn&&/more careers? that the file does not/.test(pv.warn),'restoring a file without them warns that they would be deleted');
const n=X.careerSlots().length;
X.store.careerSlots=[];X.restoreBackup(JSON.stringify(back));
ok(X.careerSlots().length===n&&X.careerSlots()[0].id===back.careerSlots[0].id,'and restoring a backup brings every career back');
X.store.careerSlots=[];X.restoreBackup(JSON.stringify(Object.assign({},back,{careerSlots:undefined})));
ok(Array.isArray(X.store.careerSlots)&&X.store.careerSlots.length===0,'an older backup, from before there were several careers, restores with just the one');
X.restoreBackup(JSON.stringify(back));X.render();

/* ================= a reload ================= */
const X2=new Function(script+'\nreturn {'+RET+'};')();
ok(X2.careerSlots().length===n&&X2.store.career.name===X.store.career.name,'after a reload every career is still there');
ok((await X2.careerUnpack(X2.careerSlots()[0])).setup,'and each one opens');

/* ================= finding it ================= */
ok(X.srchFind('switch career').some(r=>r.t==='Your careers'),'search finds “Your careers”');
X.go('settings');X.srchGoScreen('careers');
ok(X.app.view==='career'&&$('#careerscard'),'and opens the list');

/* ================= retiring ================= */
X.store.career.retired=true;X.store.career.hof={peak:2200};X.app.careersOpen=false;X.render();
ok(/Or go back to one of your other careers/.test(text())&&$('[data-act="careerswitch"]'),'a retired career offers the others to go back to');

console.log('\n✅ careers: '+pass+' checks passed');
process.exit(0);
