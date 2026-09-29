/* The home-screen widget: what the page hands the Android app, the four
   lines it draws, and that WidgetLogic.java writes them exactly as the page
   does. */
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
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
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];dom.window.scrollTo=()=>{};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,EVENT_WEEK,widgetHead,widgetCareer,widgetEvent,widgetDue,widgetSnapshot,widgetLines,widgetSync,widgetCard,remindSync,viewSettings,dayKey};')();

console.log('\n— the lines —');
ok(X.widgetHead(2027,14)==='2027 · week 14'&&X.widgetHead(0,0)==='Chess Career','the head: the year and the week');
ok(X.widgetCareer('🇷🇴','Ada Marín','IM',2451,312)==='🇷🇴 Ada Marín · IM 2451 · world #312','who you are: '+X.widgetCareer('🇷🇴','Ada Marín','IM',2451,312));
ok(X.widgetCareer('','Bea','',0,0)==='Bea · unrated','unrated, no title, no rank');
ok(X.widgetEvent('Reykjavik Open','🇮🇸',3,9,2.5,'','',0)==='🇮🇸 Reykjavik Open · round 4 of 9 · 2½/3','in an event: the round and the score');
ok(X.widgetEvent('','',0,0,0,'Hastings Congress','🏴',1)==='🏴 Hastings Congress · next week','or the next one you can enter');
ok(X.widgetDue(5,2,7)==='5 reviews and 2 puzzles due · 🔥 7 days'&&X.widgetDue(0,0,0)==='Nothing due','what is due, and the streak');

console.log('\n— the snapshot —');
const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2450,peak:2450,ratedGames:300,
  ratingRapid:2450,ratingBlitz:2450,age:24,money:50000,titles:['FM','IM'],season:1,weeks:12,calDone:[]});
X.store.career=c;X.lifeInit(c);
let W=X.widgetSnapshot(Date.now());
ok(W.career&&W.career.name==='Ada Marín'&&W.career.title==='IM'&&W.career.rating===2450&&W.career.rank>0&&W.career.year===2026&&W.career.week===12,'the career: name, title, rating, world rank '+W.career.rank+', 2026 week 12');
ok(W.career.next&&W.career.next.inWeeks>=0&&!W.career.tour,'the next event you can enter: '+W.career.next.name+' in '+W.career.next.inWeeks+' weeks');
c.weeks=X.EVENT_WEEK.reykjavik;c.day=0;c.energy=100;X.joinTournament('reykjavik');
W=X.widgetSnapshot(Date.now());
ok(W.career.tour&&W.career.tour.name==='Reykjavik Open'&&W.career.tour.rounds===9&&!W.career.next,'in an event: the event, not the next one');
ok(JSON.stringify(W).length<2000,'small: '+JSON.stringify(W).length+' bytes');
const bridge={w:[],setWidget:j=>bridge.w.push(JSON.parse(j)),setReminder:()=>{}};
dom.window.AndroidBridge=bridge;await X.remindSync(Date.now());delete dom.window.AndroidBridge;
ok(bridge.w.length===1&&bridge.w[0].career.tour.name==='Reykjavik Open','every sync hands the Android app the widget’s snapshot too');
const L=X.widgetLines();
ok(L.length===4&&/Reykjavik Open · round 1 of 9/.test(L[2]),'the four lines: '+L.join(' | '));
ok(/id="widgetcard"/.test(X.viewSettings())&&/Reykjavik Open/.test(X.widgetCard()),'Settings shows the widget, with a preview of what it says');
c.retired=true;
ok(X.widgetSnapshot().career===null&&X.widgetLines()[1]==='No career yet — start one in the app','a retired career: the widget says to start one');

console.log('\n— the Android app writes the same lines —');
const cases=[];
const names=[['🇷🇴','Ada Marín','IM'],['','Bea','' ],['♟','Ivo Kern','GM'],['🇮🇳','A very long name that goes on and on','WGM']];
for(const [f,n,t] of names)for(const r of [0,1450,2451,2830])for(const k of [0,1,312])cases.push(['C',f,n,t,r,k]);
for(const [tn,te] of [['',''],['Reykjavik Open','🇮🇸'],['Club','']])for(const rd of [0,1,4,8])for(const sc of [0,0.5,2.5,3])for(const [nn,ne,w] of [['',' ',0],['Hastings Congress','🏴',0],['Tata Steel Masters','🇳🇱',1],['Olympiad','🤝',9]])
  cases.push(['E',tn,te,rd,9,Math.min(sc,rd),nn,ne.trim(),w]);
for(const rd of [0,1,5])for(const pd of [0,1,3])for(const st of [0,1,7])cases.push(['D',rd,pd,st]);
for(const [y,w] of [[0,0],[2026,0],[2031,51]])cases.push(['H',y,w]);
const js=k=>k[0]==='C'?X.widgetCareer(k[1],k[2],k[3],k[4],k[5]):k[0]==='E'?X.widgetEvent(k[1],k[2],k[3],k[4],k[5],k[6],k[7],k[8]):k[0]==='D'?X.widgetDue(k[1],k[2],k[3]):X.widgetHead(k[1],k[2]);
const jv=spawnSync('javac',['-version'],{encoding:'utf8'});
if(jv.status!==0)console.log('  · no JDK on this machine: the Java comparison is skipped here');
else{
  const dir=mkdtempSync(join(tmpdir(),'widget-'));
  writeFileSync(join(dir,'WidgetLogic.java'),readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/WidgetLogic.java','utf8').replace(/^package [^;]+;/m,''));
  writeFileSync(join(dir,'Harness.java'),`import java.io.*;
public class Harness{public static void main(String[] x)throws Exception{BufferedReader r=new BufferedReader(new InputStreamReader(System.in,"UTF-8"));PrintStream o=new PrintStream(System.out,true,"UTF-8");String l;
 while((l=r.readLine())!=null){String[] f=l.split("\\\\t",-1);String t;
  if(f[0].equals("C"))t=WidgetLogic.career(f[1],f[2],f[3],Integer.parseInt(f[4]),Integer.parseInt(f[5]));
  else if(f[0].equals("E"))t=WidgetLogic.event(f[1],f[2],Integer.parseInt(f[3]),Integer.parseInt(f[4]),Double.parseDouble(f[5]),f[6],f[7],Integer.parseInt(f[8]));
  else if(f[0].equals("D"))t=WidgetLogic.due(Integer.parseInt(f[1]),Integer.parseInt(f[2]),Integer.parseInt(f[3]));
  else t=WidgetLogic.head(Integer.parseInt(f[1]),Integer.parseInt(f[2]));
  o.println(t);}}}`);
  const cc=spawnSync('javac',['-encoding','UTF-8','-d',dir,join(dir,'WidgetLogic.java'),join(dir,'Harness.java')],{encoding:'utf8'});
  ok(cc.status===0,'WidgetLogic.java compiles on its own'+(cc.status?' — '+cc.stderr:''));
  const run=spawnSync('java',['-Dfile.encoding=UTF-8','-cp',dir,'Harness'],{input:cases.map(k=>k.join('\t')).join('\n')+'\n',encoding:'utf8'});
  ok(run.status===0,'and runs'+(run.status?' — '+run.stderr:''));
  const out=run.stdout.replace(/\n$/,'').split('\n');
  let diff=0,first=null;cases.forEach((k,i)=>{const want=js(k);if(out[i]!==want){diff++;if(!first)first={want,got:out[i],k};}});
  ok(diff===0,'the widget says exactly what the page says ('+cases.length+' cases)'+(first?' — first difference: '+JSON.stringify(first):''));
}

console.log('\n— the Android project —');
const man=readFileSync('app_project/android/app/src/main/AndroidManifest.xml','utf8');
ok(/android:name="\.CareerWidget"/.test(man)&&/APPWIDGET_UPDATE/.test(man)&&/@xml\/career_widget_info/.test(man),'the manifest declares the widget');
const info=readFileSync('app_project/android/app/src/main/res/xml/career_widget_info.xml','utf8');
ok(/updatePeriodMillis="1800000"/.test(info)&&/@layout\/widget_career/.test(info),'it redraws every half hour, from its layout');
const lay=readFileSync('app_project/android/app/src/main/res/layout/widget_career.xml','utf8');
ok(['w_root','w_head','w_career','w_event','w_due','w_open','w_due_btn'].every(id=>lay.includes('@+id/'+id)),'the layout has every view the widget fills in');
const act=readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/MainActivity.java','utf8');
ok(/public void setWidget\(String json\)/.test(act)&&/if \(!trusted\(\) \|\| json == null/.test(act.slice(act.indexOf('setWidget'))),'the bridge takes the snapshot, from the bundled app only');

console.log('\n✅ the home-screen widget: '+pass+' checks passed');
