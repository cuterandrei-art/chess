/* The rating and norm calculator, and FIDE's own numbers under the career:
   table 8.1.2, the 400-point rule for players under 2650 (from 1 October
   2025), the K rules, rounding, first ratings, and every norm requirement. */
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
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,go,render,fidePD,fideD,fideExpect,fideRound,calcState,calcCompute,calcAct,calcSave,calcResultsHtml,viewCalc,paceDelta,freshCareer,applyRatedGame,publishRating,SRCH_SCREENS,srchFind};')();
const S0=()=>({rating:'',fed:'ROU',track:'open',k:'auto',new30:false,junior:false,hi2400:false,exempt:false,rows:[]});
const row=(r,res,t,f)=>({r:r==null?'':String(r),t:t||'',f:f||'',res:res});

console.log('\n— FIDE’s table 8.1.2 and the 400-point rule —');
ok(X.fidePD(0)===0.5&&X.fidePD(3)===0.5&&X.fidePD(4)===0.51&&X.fidePD(25)===0.53&&X.fidePD(26)===0.54,'the table steps at 3, 10, 17, 25 … (0 → .50, 4 → .51, 26 → .54)');
ok(X.fidePD(400)===0.92&&X.fidePD(-400)===0.08&&X.fidePD(735)===0.99&&X.fidePD(736)===1,'400 apart is .92 and .08; over 735 is certain');
ok(X.fideExpect(2500,1400)===0.92,'a 2500 against a 1400 counts as 400 apart (.92)');
ok(X.fideExpect(2700,2200)===0.96&&X.fideExpect(2649,2100)===0.92,'from 1 October 2025 the cap is for players under 2650: a 2700 is 500 apart from a 2200 (.96)');
ok(X.fideExpect(1400,2500)===0.08,'and the lower-rated player is capped as well');
ok(X.fideRound(2.5)===3&&X.fideRound(-2.5)===-3&&X.fideRound(-2.4)===-2&&X.fideRound(7.2)===7,'rounded to the nearest whole number, 0.5 away from zero');

console.log('\n— the career rates games by it —');
{const c=Object.assign(X.freshCareer(),{setup:true,provisional:false,rating:2500,peak:2500,ratedGames:200,age:30});
 X.applyRatedGame(c,1400,1);ok(c.rating===2501,'a 2500 beating a 1400: 10 × (1 − .92) = +0.8 → +1');
 const d=Object.assign(X.freshCareer(),{setup:true,provisional:false,rating:2700,peak:2700,ratedGames:200,age:30});
 X.applyRatedGame(d,2200,1);ok(d.rating===2700,'a 2700 beating a 2200: 10 × (1 − .96) = +0.4 → 0 — no free points above 2650');
 const u=Object.assign(X.freshCareer(),{setup:true,provisional:true,rating:null,ratedGames:9,provScore:8.5,provOppSum:9*2400,age:16});
 X.publishRating(u);ok(u.rating===2200,'a first rating is at most 2200 (8.2), however well the first event went');}

console.log('\n— a rated player’s tournament —');
let S=S0();S.rating='1850';S.new30=true;
S.rows=[row(2000,'1'),row(1800,'0.5'),row(1700,'1')];
let R=X.calcCompute(S);
ok(R.rating.K===40&&/fewer than 30/.test(R.rating.kWhy),'K 40 for a player with fewer than 30 rated games');
ok(Math.abs(R.rating.sum-0.93)<1e-9&&R.rating.change===37&&R.rating.to===1887,'win against 2000 (+.70), draw with 1800 (−.07), win against 1700 (+.30): Σ .93 × 40 = +37');
S.new30=false;R=X.calcCompute(S);ok(R.rating.K===20&&R.rating.change===19,'K 20 otherwise: +18.6 → +19');
S.junior=true;R=X.calcCompute(S);ok(R.rating.K===40&&/under 18/.test(R.rating.kWhy),'K 40 for a junior under 2300 until the end of the year they turn 18');
S.junior=false;S.hi2400=true;R=X.calcCompute(S);ok(R.rating.K===10,'K 10 once rated 2400');
S.hi2400=false;S.k='10';R=X.calcCompute(S);ok(R.rating.K===10&&/set by you/.test(R.rating.kWhy),'K can be set by hand');
S=S0();S.rating='1900';S.new30=true;for(let i=0;i<20;i++)S.rows.push(row(1900,'0.5'));
R=X.calcCompute(S);ok(R.rating.K===35&&/700/.test(R.rating.kWhy),'twenty games at K 40 is over 700: K becomes 35 (8.3.3)');
S=S0();S.rating='2000';S.rows=[row(2100,'1'),row(null,'1'),row(1900,'0'),row(2000,'-')];
R=X.calcCompute(S);
ok(R.rating.per.length===2&&R.unratedOpp===1,'a game against an unrated opponent does not change your rating, and an unplayed one does not count');
S=S0();S.rating='2500';S.rows=[row(1400,'1')];R=X.calcCompute(S);X.app.calc=S;
ok(R.rating.capped===1&&/400-point rule counted 1 game/.test(X.calcResultsHtml()),'the 400-point rule is applied, and said');

console.log('\n— a first rating —');
S=S0();S.rows=[row(1600,'1'),row(1600,'0'),row(1600,'1'),row(1600,'1'),row(1600,'0')];
R=X.calcCompute(S);
ok(R.first&&R.first.Ru===1707&&R.first.Ra===1657,'five games against 1600s, 3/5: average with two 1800 draws 1657, and 4/7 → +50 = 1707');
S.rows=S.rows.slice(0,4);R=X.calcCompute(S);ok(/at least five games/.test(R.first.why),'four games are not enough for a first rating');
S=S0();for(let i=0;i<9;i++)S.rows.push(row(2400,i<8?'1':'0.5'));R=X.calcCompute(S);
ok(R.first.Ru===2200&&R.first.capped,'8½/9 against 2400s is capped at a first rating of 2200');
S=S0();for(let i=0;i<5;i++)S.rows.push(row(1500,'0'));R=X.calcCompute(S);ok(/zero score/.test(R.first.why),'a zero score in a first event is disregarded');
S=S0();for(let i=0;i<5;i++)S.rows.push(row(1100,i?'0':'0.5'));R=X.calcCompute(S);ok(/from 1400/.test(R.first.why),'and a first rating under 1400 is not published');

console.log('\n— norms —');
const feds=['GER','FRA','ESP','ITA','NED','HUN','POL','CZE','SRB'];
S=S0();S.rating='2450';
S.rows=[row(2560,'1','GM','GER'),row(2540,'0.5','GM','FRA'),row(2530,'1','GM','ESP'),row(2500,'0.5','IM','ITA'),row(2480,'1','IM','NED'),row(2470,'0.5','IM','HUN'),
  row(2460,'1','FM','POL'),row(2450,'0.5','GM','CZE'),row(2440,'1','FM','SRB')];
R=X.calcCompute(S);let GM=R.norms.find(n=>n.bar.kind==='GM');
ok(GM.k.ok&&GM.k.Rp>=2600,'7/9 against a 2497 field with four GMs from nine federations is a GM norm (performance '+GM.k.Rp+')');
ok(R.norms.map(n=>n.bar.kind).join()==='GM,IM','on the open track the calculator checks GM and IM norms');
S.track='women';R=X.calcCompute(S);ok(R.norms.map(n=>n.bar.kind).join()==='GM,IM,WGM,WIM','and the women’s norms too when asked');
S.track='open';S.rows.forEach(r=>r.f='ROU');R=X.calcCompute(S);GM=R.norms.find(n=>n.bar.kind==='GM');
ok(!GM.k.ok&&GM.k.failed.some(r=>r.key==='feds'||r.key==='own'),'the same result against nine compatriots is not a norm — the federation rules');
S.exempt=true;R=X.calcCompute(S);GM=R.norms.find(n=>n.bar.kind==='GM');ok(GM.k.ok,'unless the event is exempt from them (a national championship final)');
S.exempt=false;S.rows.forEach((r,i)=>r.f=feds[i]);[3,4,5,6,7].forEach(i=>S.rows[i].t='CM');
R=X.calcCompute(S);GM=R.norms.find(n=>n.bar.kind==='GM');
ok(GM.k.failed.some(r=>r.key==='titled')&&!GM.k.failed.some(r=>r.key==='hi'),'with five of them CMs only four are title holders — not half — and it is no norm (a CM does not count)');
// rounds still to play
S=S0();S.rating='2450';
S.rows=[row(2560,'1','GM','GER'),row(2540,'0.5','GM','FRA'),row(2530,'1','GM','ESP'),row(2500,'0.5','IM','ITA'),row(2480,'1','IM','NED'),row(2470,'0.5','IM','HUN'),
  row(2460,'?','FM','POL'),row(2450,'?','GM','CZE'),row(2440,'?','FM','SRB')];
R=X.calcCompute(S);GM=R.norms.find(n=>n.bar.kind==='GM');
ok(GM.left===3&&GM.need!=null&&GM.fromNow>0&&GM.fromNow<=3,'with three rounds to play it says what the norm needs: '+GM.need+'/9, '+GM.fromNow+' from the last three');
let H=(()=>{X.app.calc=S;return X.calcResultsHtml();})();
ok(/from your last 3/.test(H),'and says it on the screen');
S.rows[8].res='-';R=X.calcCompute(S);GM=R.norms.find(n=>n.bar.kind==='GM');
ok(GM.k.n===8&&GM.k.failed.some(r=>r.key==='games'),'an unplayed game does not count, and eight games cannot make a norm');

console.log('\n— on the screen —');
localStorage.removeItem('chess-career-calc-v1');X.app.calc=null;
X.go('calc');
ok(document.querySelector('#calcout')&&document.querySelectorAll('.calcrow').length===9,'the calculator opens with nine rounds to fill in');
const inp=document.querySelector('input[data-calc="r"][data-idx="0"]');
inp.value='2100';inp.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
document.querySelector('input[data-calc="rating"]').value='2000';document.querySelector('input[data-calc="rating"]').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
ok(document.querySelector('input[data-calc="r"][data-idx="0"]')===inp,'typing updates the numbers without redrawing the form under your fingers');
document.querySelector('[data-act="calcres"][data-idx="0"][data-val="1"]').click();
ok(/\+13/.test(document.getElementById('calcout').textContent)&&/→ 2013/.test(document.getElementById('calcout').textContent),'a win against a 2100 at K 20: 20 × (1 − .36) = +12.8 → +13, 2013');
document.querySelector('[data-act="calcadd"]').click();
ok(document.querySelectorAll('.calcrow').length===10,'a round can be added');
X.app.calc=null;const back=X.calcState();
ok(back.rows.length===10&&back.rows[0].r==='2100'&&back.rows[0].res==='1'&&back.rating==='2000','and it is all still there next time (kept on this device)');
ok(X.srchFind('norm calculator').some(r=>/calculator/i.test(r.t)),'search finds it');

console.log('\n✅ the rating and norm calculator: '+pass+' checks passed');
