// Reminders when reviews and missed puzzles are due.   node validate-remind.mjs
// A timezone with daylight saving, so "your hour" and "today" are tested where they are hardest.
process.env.TZ='Europe/Bucharest';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
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
dom.window.__PUZZLES=[['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','c4f7',1200,['mate'],'e7e5'],['rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1','g1f3',1400,[],'e7e5']];
if(!globalThis.navigator||typeof globalThis.navigator!=='object')globalThis.navigator={};
const LOC={search:''};
globalThis.location={get protocol(){return 'https:';},get href(){return 'https://example.test/'+LOC.search;},get search(){return LOC.search;},pathname:'/',reload(){}};
globalThis.history={replaceState(){LOC.search='';}};
// what the browser lets a page do
const shown=[];let permState='default',askAnswer='granted',visible='visible';
globalThis.Notification=class{constructor(t,o){shown.push({via:'page',title:t,body:o&&o.body});}static get permission(){return permState;}static async requestPermission(){permState=askAnswer;return askAnswer;}};
Object.defineProperty(dom.window.document,'visibilityState',{get:()=>visible,configurable:true});
const badge={n:null,cleared:0};
globalThis.navigator.setAppBadge=async n=>{badge.n=n;};globalThis.navigator.clearAppBadge=async()=>{badge.n=null;badge.cleared++;};
const cacheStore={};
const mkCache=()=>{const m=new Map();return {m,put:async(k,r)=>{m.set(k,await r.text());},match:async k=>m.has(k)?new Response(m.get(k)):undefined,delete:async k=>m.delete(k)};};
globalThis.caches={open:async n=>cacheStore[n]||(cacheStore[n]=mkCache())};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const LS='opening-trainer-standalone-v1';
localStorage.setItem(LS,JSON.stringify({onboarded:true}));
const X=new Function(script+'\nreturn {store,app,render,go,save,DEF,dayKey,dayStreak,dueTimes,remindCfg,remindSnapshot,remindText,remindDecide,remindSync,remindSoon,remindTick,remindTurnOn,remindTurnOff,remindTest,remindCard,openDue,remindBoot,remindSupport,remindPermission,previewBackup,receiveBackup,applyReceived,backupJson};')();
const $=q=>document.querySelector(q);
const click=act=>{const b=$('[data-act="'+act+'"]');if(!b)throw new Error('no button '+act);b.click();};
const H=3600e3,D=86400e3;
const at=(y,mo,d,h,mi)=>new Date(y,mo-1,d,h,mi||0).getTime();

/* ================= what is due ================= */
const now=Date.now();
X.store.repertoire=['italian'];
X.store.srs={'italian::a':{seen:true,due:now-5*H,interval:1},'italian::b':{seen:true,due:now-H,interval:1},'italian::c':{seen:true,due:now+3*H,interval:4},
  'italian::d':{seen:false,due:now-H},'french::x':{seen:true,due:now-H,interval:1}};
X.store.puzzle.miss={'0':{box:0,due:now-2*H},'1':{box:1,due:now+2*D}};
let d=X.dueTimes();
ok(d.reviews.length===3&&d.reviews[0]===now-5*H&&d.reviews[2]===now+3*H,'reviews: only seen cards from openings in your repertoire, earliest first');
ok(d.puzzles.length===2&&d.puzzles[0]===now-2*H,'puzzles: every missed puzzle waiting to come back');

/* ================= the words ================= */
ok(X.remindText(1,0,0)==='1 opening review is due.','one review');
ok(X.remindText(3,2,0)==='3 opening reviews and 2 puzzles you got wrong are due.','reviews and puzzles together');
ok(X.remindText(0,1,5)==='1 puzzle you got wrong is due. Keep your 5-day streak going.','a streak worth keeping is mentioned');
ok(X.remindText(0,0,5)==='Your 5-day streak ends at midnight — one puzzle keeps it.','a streak on its own is enough to remind');
ok(X.remindText(0,0,0)===null,'nothing to say, nothing said');

/* ================= when ================= */
const snap=(o)=>Object.assign({on:true,hour:19,reviews:true,puzzles:true,streak:true,reviewTimes:[at(2026,9,24,8)],puzzleTimes:[],streakDays:0,lastActive:null},o||{});
ok(X.remindDecide(snap(),at(2026,9,24,18,59),null)===null,'not before your hour');
ok(/1 opening review/.test(X.remindDecide(snap(),at(2026,9,24,19,0),null).text),'from your hour on');
ok(X.remindDecide(snap(),at(2026,9,24,21),'2026-09-24')===null,'once a day');
ok(X.remindDecide(snap(),at(2026,9,25,19,5),'2026-09-24'),'and again the next day');
ok(X.remindDecide(snap({on:false}),at(2026,9,24,20),null)===null,'nothing when switched off');
ok(X.remindDecide(snap({reviews:false}),at(2026,9,24,20),null)===null,'a kind you switched off is not counted');
ok(X.remindDecide(snap({reviewTimes:[at(2026,9,24,22)]}),at(2026,9,24,20),null)===null,'something due later tonight is not due yet');
ok(/streak ends/.test(X.remindDecide(snap({reviewTimes:[],streakDays:6,lastActive:'2026-09-23'}),at(2026,9,24,20),null).text),'a streak at risk: active yesterday, not yet today');
ok(X.remindDecide(snap({reviewTimes:[],streakDays:6,lastActive:'2026-09-24'}),at(2026,9,24,20),null)===null,'no nagging once you have trained today');
ok(X.remindDecide(snap({reviewTimes:[],streakDays:1,lastActive:'2026-09-23'}),at(2026,9,24,20),null)===null,'a one-day "streak" is not worth a notification');
ok(X.remindDecide(snap({hour:3,reviewTimes:[at(2026,3,29,1)]}),at(2026,3,29,3,30),null)&&X.remindDecide(snap({hour:4,reviewTimes:[at(2026,3,29,1)]}),at(2026,3,29,3,59),null),'the night the clocks go forward (03:00 does not exist) still reminds');

/* ================= the page, the worker and the Android app agree ================= */
const sw=readFileSync('netlify/sw.js','utf8');
const SWX=new Function('self','caches',sw+'\nreturn {remindDecide,remindCheck};');
const swListeners={};const swShown=[];const swWins=[];let swBadge=null;const swCaches={};
const swEnv={addEventListener:(t,f)=>swListeners[t]=f,skipWaiting(){},registration:{scope:'https://example.test/app/',showNotification:async(t,o)=>swShown.push({t,o})},
  clients:{claim(){},matchAll:async()=>swWins,openWindow:async u=>{swWins.opened=u;}},navigator:{setAppBadge:async n=>{swBadge=n;}}};
const SW=SWX(swEnv,{open:async n=>swCaches[n]||(swCaches[n]=mkCache()),keys:async()=>Object.keys(swCaches),delete:async n=>delete swCaches[n]});
let rnd=12345;const R=()=>{rnd=(rnd*1103515245+12345)&0x7fffffff;return rnd/0x7fffffff;};
const cases=[];
for(let i=0;i<3000;i++){
  const base=at(2026,1+Math.floor(R()*12),1+Math.floor(R()*28),Math.floor(R()*24),Math.floor(R()*60));
  const list=()=>{const n=Math.floor(R()*5),a=[];for(let j=0;j<n;j++)a.push(base+Math.round((R()-0.6)*3*D));return a.sort((x,y)=>x-y);};
  const t=base;const today=X.dayKey(t),yest=X.dayKey(t-D);
  const c={on:R()<0.9,hour:Math.floor(R()*24),reviews:R()<0.8,puzzles:R()<0.8,streak:R()<0.8,reviewTimes:list(),puzzleTimes:list(),
    streakDays:Math.floor(R()*9),lastActive:[null,today,yest][Math.floor(R()*3)]};
  cases.push({c,t,sent:[null,today,yest][Math.floor(R()*3)]});
}
let diffs=0,said=0;
for(const k of cases){const a=X.remindDecide(k.c,k.t,k.sent),b=SW.remindDecide(k.c,k.t,k.sent);
  if(JSON.stringify(a)!==JSON.stringify(b))diffs++;if(a)said++;}
ok(diffs===0&&said>300,'the service worker decides exactly as the page does ('+cases.length+' cases, '+said+' reminders)');
{
  const jv=spawnSync('javac',['-version'],{encoding:'utf8'});
  if(jv.status!==0){console.log('  · no JDK on this machine: the Java comparison is skipped here');}
  else{
    const dir=mkdtempSync(join(tmpdir(),'remind-'));
    writeFileSync(join(dir,'RemindLogic.java'),readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/RemindLogic.java','utf8').replace(/^package [^;]+;/m,''));
    writeFileSync(join(dir,'Harness.java'),`import java.io.*;import java.util.*;
public class Harness{static long[] arr(String s){if(s.isEmpty())return new long[0];String[] p=s.split(",");long[] a=new long[p.length];for(int i=0;i<p.length;i++)a[i]=Long.parseLong(p[i]);return a;}
 static String nz(String s){return s.equals("-")?null:s;}
 public static void main(String[] x)throws Exception{BufferedReader r=new BufferedReader(new InputStreamReader(System.in,"UTF-8"));PrintStream o=new PrintStream(System.out,true,"UTF-8");String l;
  while((l=r.readLine())!=null){String[] f=l.split("\\\\|",-1);
   if(f[0].equals("N")){o.println(RemindLogic.nextCheck(Integer.parseInt(f[1]),arr(f[2]),arr(f[3]),Long.parseLong(f[4]),f[5].equals("1")));continue;}
   String t=RemindLogic.decide(f[0].equals("1"),Integer.parseInt(f[1]),f[2].equals("1"),f[3].equals("1"),f[4].equals("1"),arr(f[5]),arr(f[6]),Integer.parseInt(f[7]),nz(f[8]),Long.parseLong(f[9]),nz(f[10]));
   o.println(t==null?"null":t);}}}`);
    const cc=spawnSync('javac',['-encoding','UTF-8','-d',dir,join(dir,'RemindLogic.java'),join(dir,'Harness.java')],{encoding:'utf8'});
    ok(cc.status===0,'RemindLogic.java compiles on its own'+(cc.status?' — '+cc.stderr:''));
    const b=v=>v?'1':'0';
    const lines=cases.map(k=>[b(k.c.on),k.c.hour,b(k.c.reviews),b(k.c.puzzles),b(k.c.streak),k.c.reviewTimes.join(','),k.c.puzzleTimes.join(','),k.c.streakDays,k.c.lastActive||'-',k.t,k.sent||'-'].join('|'));
    // nextCheck: before the hour, sent today, due now, due later today, due after tomorrow's hour
    const T=at(2026,9,24,17);
    const nc=[[19,'','',T,0],[19,'','',at(2026,9,24,20),1],[19,String(at(2026,9,24,10)),'',at(2026,9,24,20),0],[19,'',String(at(2026,9,24,22)),at(2026,9,24,20),0],[19,String(at(2026,9,26,9)),'',at(2026,9,24,20),0]];
    const run=spawnSync('java',['-Duser.timezone=Europe/Bucharest','-cp',dir,'Harness'],{input:lines.concat(nc.map(n=>['N',...n].join('|'))).join('\n')+'\n',encoding:'utf8'});
    ok(run.status===0,'and runs'+(run.status?' — '+run.stderr:''));
    const out=run.stdout.trim().split('\n');
    let jd=0,first=null;
    cases.forEach((k,i)=>{const a=X.remindDecide(k.c,k.t,k.sent);const want=a?a.text:'null';if(out[i]!==want){jd++;if(!first)first={want,got:out[i],k};}});
    ok(jd===0,'the Android app decides exactly as the page does ('+cases.length+' cases)'+(first?' — first difference: '+JSON.stringify(first):''));
    const n=out.slice(cases.length).map(Number);
    ok(n[0]===at(2026,9,24,19),'Android looks again at your hour when it is earlier in the day');
    ok(n[1]===at(2026,9,25,19),'at tomorrow’s hour once today’s reminder has gone');
    ok(n[2]===at(2026,9,24,21),'in an hour when something was due but the app was on screen');
    ok(n[3]===at(2026,9,24,22),'when the next thing falls due later tonight');
    ok(n[4]===at(2026,9,25,19),'and never later than tomorrow’s hour');
  }
}

/* ================= the snapshot goes everywhere ================= */
X.store.settings.remindOn=true;X.store.settings.remindHour=19;
const bridge={snaps:[],setReminder:j=>bridge.snaps.push(JSON.parse(j))};
let sn=await X.remindSync(now);
ok(JSON.parse(cacheStore['opening-trainer-remind'].m.get('./__remind__')).reviewTimes.length===3,'the worker’s copy of the snapshot is written');
ok(sn.reviewTimes.length===3&&sn.puzzleTimes.length===2&&sn.on===true&&sn.reviews===true,'switches and due times do not overwrite each other');
ok(badge.n===3,'the app icon shows what is due now (2 reviews + 1 puzzle = '+badge.n+')');
dom.window.AndroidBridge=bridge;await X.remindSync(now);delete dom.window.AndroidBridge;
ok(bridge.snaps.length===1&&bridge.snaps[0].puzzleTimes.length===2,'and the Android app gets the same snapshot');
X.store.settings.remindOn=false;await X.remindSync(now);
ok(badge.n===null&&badge.cleared>0,'with reminders off the badge is cleared');
X.store.settings.remindOn=true;
cacheStore['opening-trainer-remind'].m.delete('./__remind__');
X.save();await tick(1700);
ok(cacheStore['opening-trainer-remind'].m.has('./__remind__'),'every save refreshes it, a moment later');

/* ================= turning them on ================= */
X.store.settings.remindOn=false;X.go('settings');
ok($('#remindcard')&&$('[data-act="remindon"]'),'Settings has a Reminders card with one button to turn them on');
ok(/Due now: 2 opening reviews, 1 puzzle you got wrong\./.test($('#remindcard').textContent),'it says what is due right now');
ok(/Next one in 3 h\./.test($('#remindcard').textContent),'and when the next thing falls due');
permState='default';askAnswer='denied';
await X.remindTurnOn();
ok(!X.store.settings.remindOn&&/blocked/.test($('#remindcard').textContent),'refused permission leaves them off and says how to unblock');
permState='default';askAnswer='granted';
await X.remindTurnOn();
ok(X.store.settings.remindOn&&X.store.settings.remindMode==='open','allowed without a service worker: reminders while the app is open');
ok($('select[data-setting="remindHour"]')&&$('input[data-setting="remindPuzzles"]')&&$('[data-act="remindtest"]')&&$('[data-act="remindoff"]'),'once on: the hour, what to include, a test and an off switch');
ok(/background tab or a minimised window/.test($('#remindcard').textContent),'and it is honest about when they can arrive');
const sel=$('select[data-setting="remindHour"]');sel.value='8';sel.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
ok(X.remindCfg().hour===8,'the hour can be changed');
const cb=$('input[data-setting="remindStreak"]');cb.checked=false;cb.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
ok(X.remindCfg().streak===false,'and a kind switched off');
// an installed app with Periodic Background Sync
const registered=[];
const reg={showNotification:async(t,o)=>shown.push({via:'worker',title:t,body:o.body,data:o.data}),periodicSync:{register:async(tag,o)=>registered.push({tag,o}),unregister:async tag=>registered.push({tag,off:true})}};
globalThis.navigator.serviceWorker={getRegistration:async()=>reg,addEventListener(){}};
globalThis.navigator.permissions={query:async()=>({state:'granted'})};
X.store.settings.remindOn=false;permState='granted';
await X.remindTurnOn();
ok(X.store.settings.remindMode==='background'&&registered[0].tag==='due-check'&&registered[0].o.minInterval>=H,'an installed app asks the browser to wake the worker in the background');
ok(/even with the app closed/.test($('#remindcard').textContent),'and says reminders can now come with the app closed');
click('remindoff');await tick();
ok(!X.store.settings.remindOn&&registered.some(r=>r.off),'turning them off unregisters the background check');
// no notifications at all
const N=globalThis.Notification;delete globalThis.Notification;
await X.remindTurnOn();
ok(!X.store.settings.remindOn&&/Home Screen/.test($('#remindcard').textContent),'a browser without notifications (Safari in a tab) is told how to get them');
globalThis.Notification=N;
// the Android app asks Android
const abr={asked:0,perm:'default',setReminder(){},notifyPermission(){return abr.perm;},requestNotify(){abr.asked++;},testReminder(t){shown.push({via:'android',body:t});},takeLaunch(){return '';}};
dom.window.AndroidBridge=abr;X.app.remindMsg=null;
await X.remindTurnOn();
ok(abr.asked===1&&X.app.remindAsking&&/Waiting for your answer/.test($('#remindcard').textContent),'inside the Android app it asks Android for permission');
dom.window.__remindPermission('granted');
ok(X.store.settings.remindOn&&X.store.settings.remindMode==='android'&&/even with the app closed/.test($('#remindcard').textContent),'and Android’s yes turns them on, with the app closed too');
X.store.settings.remindOn=false;dom.window.__remindPermission('denied');
ok(!X.store.settings.remindOn&&/Settings → Apps → Chess Career/.test($('#remindcard').textContent),'Android’s no says where to change it');
delete dom.window.AndroidBridge;

/* ================= a reminder while the app is open but hidden ================= */
X.store.settings.remindOn=true;X.store.settings.remindHour=0;X.store.settings.remindStreak=true;permState='granted';shown.length=0;
delete cacheStore['opening-trainer-remind'];X.store.settings.remindSent=null;
visible='visible';
ok(await X.remindTick()===null&&!shown.length,'nothing while you are looking at the app');
visible='hidden';
const r1=await X.remindTick();
ok(r1&&shown.length===1&&shown[0].via==='worker'&&/2 opening reviews and 1 puzzle/.test(shown[0].body),'in a background tab it notifies through the worker ('+(shown[0]&&shown[0].body)+')');
ok(shown[0].data&&/due=1/.test(shown[0].data.url),'and tapping it opens the app on what is due');
ok(await X.remindTick()===null&&shown.length===1,'only once a day');
ok(await (await caches.open('opening-trainer-remind')).match('./__remind_sent__'),'the “told you today” mark is shared with the worker');
visible='visible';
globalThis.navigator.serviceWorker=undefined;
shown.length=0;const how=await X.remindTest();
ok(how==='page'&&shown.length===1&&/opening review/.test(shown[0].body),'“Send a test reminder” shows one straight away with the real text');

/* ================= tapping one ================= */
X.go('settings');
ok(X.openDue()==='reviews'&&X.app.view==='train'&&X.app.mode==='review','it opens on the due reviews first');
X.store.srs={};X.go('settings');
ok(X.openDue()==='puzzles'&&X.app.view==='puzzles'&&X.app.pzFilter&&X.app.pzFilter.type==='miss','then on the puzzles you got wrong');
X.store.puzzle.miss={};X.go('settings');
ok(X.openDue()==='puzzles'&&X.app.view==='puzzles','and for a streak, on the puzzles');
X.store.srs={'italian::a':{seen:true,due:now-H,interval:1}};
X.go('settings');LOC.search='?due=1';X.remindBoot();
ok(X.app.view==='train'&&LOC.search==='','opened from a notification (?due=1) it goes straight there');
X.go('settings');dom.window.AndroidBridge={takeLaunch:()=>'due',setReminder(){}};X.remindBoot();delete dom.window.AndroidBridge;
ok(X.app.view==='train','and from an Android notification too');

/* ================= a backup does not carry this device's permission ================= */
X.store.settings.remindOn=true;X.store.settings.remindMode='background';
const other=JSON.parse(X.backupJson());other.settings.remindOn=false;other.settings.remindMode='android';other.settings.remindHour=7;other.career=Object.assign({},other.career,{setup:true,name:'P',weeks:3,played:9});
X.receiveBackup(JSON.stringify(other),'file');X.applyReceived();
ok(X.store.settings.remindOn===true&&X.store.settings.remindMode==='background','moving progress in keeps this device’s reminder switch and how it can deliver');
ok(X.store.settings.remindHour===7,'but brings the preferred hour');

/* ================= the worker on its own ================= */
{
  const snapW={on:true,hour:0,reviews:true,puzzles:true,streak:true,reviewTimes:[now-H],puzzleTimes:[now-H,now+D],streakDays:0,lastActive:null};
  const c=mkCache();swCaches['opening-trainer-remind']=c;await c.put('./__remind__',new Response(JSON.stringify(snapW)));
  let waited=null;swListeners.periodicsync({tag:'due-check',waitUntil:p=>waited=p});const got=await waited;
  ok(got&&swShown.length===1&&swShown[0].o.body==='1 opening review and 1 puzzle you got wrong are due.','woken in the background, the worker counts what is due and notifies');
  ok(swBadge===2,'and sets the badge');
  swListeners.periodicsync({tag:'due-check',waitUntil:p=>waited=p});
  ok(await waited===null&&swShown.length===1,'once a day');
  c.m.delete('./__remind_sent__');swWins.push({visibilityState:'visible',focus:async()=>{swWins.focused=1;},postMessage:m=>{swWins.msg=m;}});
  swListeners.periodicsync({tag:'due-check',waitUntil:p=>waited=p});
  ok(await waited===null,'not while the app is on screen');
  let clickWait=null;let closed=0;
  swListeners.notificationclick({notification:{close(){closed++;}},waitUntil:p=>clickWait=p});await clickWait;
  ok(closed===1&&swWins.focused===1&&swWins.msg&&swWins.msg.type==='open-due','tapping it brings an open app forward, on what is due');
  swWins.length=0;
  swListeners.notificationclick({notification:{close(){}},waitUntil:p=>clickWait=p});await clickWait;
  ok(swWins.opened==='https://example.test/app/index.html?due=1','or opens the app when it is closed');
  swCaches['opening-trainer-v1']=mkCache();
  swListeners.activate({waitUntil:p=>waited=p});await waited;
  ok(swCaches['opening-trainer-remind']&&!swCaches['opening-trainer-v1'],'a new version keeps the reminder snapshot');
}

/* ================= the Android app ================= */
const am=readFileSync('app_project/android/app/src/main/AndroidManifest.xml','utf8');
const ma=readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/MainActivity.java','utf8');
const rr=readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/ReminderReceiver.java','utf8');
ok(/POST_NOTIFICATIONS/.test(am)&&/RECEIVE_BOOT_COMPLETED/.test(am),'the Android app declares the notification and after-reboot permissions');
ok(/android:name="\.ReminderReceiver"[\s\S]*?BOOT_COMPLETED/.test(am),'and its receiver sets the alarm again after a reboot');
for(const m of ['setReminder(String json)','notifyPermission()','requestNotify()','testReminder(String text)','takeLaunch()'])
  ok(ma.indexOf('public '+(m.startsWith('notify')||m.startsWith('take')?'String ':'void ')+m)>=0,'the bridge has '+m.split('(')[0]);
ok(/window\.__remindPermission&&window\.__remindPermission\(/.test(ma)&&/window\.__remindPermission=function/.test(script),'Android answers the permission request under the name the page listens on');
ok(/window\.__openDue&&window\.__openDue\(\)/.test(ma)&&/window\.__openDue=openDue/.test(script),'and a tapped reminder calls the page’s openDue');
ok(/AlarmManager\.RTC,/.test(rr)&&!/setExact/.test(rr),'the alarm is inexact and does not wake the phone — no special alarm permission');
ok(/MainActivity\.inFront/.test(rr),'and it stays quiet while the app is on screen');
ok(/"reviewTimes"/.test(rr)&&/"puzzleTimes"/.test(rr)&&/"streakDays"/.test(rr)&&/"lastActive"/.test(rr),'it reads the snapshot under the names the page writes');

console.log('\n✅ remind: '+pass+' checks passed');
