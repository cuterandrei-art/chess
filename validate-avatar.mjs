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
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,AV_PARTS,AV_ACC,AV_ACC_LOCK,AV_HAIR,avatarChar,avatarOf,avatarFromSeed,avatarDefaults,avAccUnlocked,playerAvatar,oppAvatar,careerAvatarPanel,SCENES,applySceneBg,isUnlocked,UNLOCKS,lifeInit,careerTabContent};')();

/* ---- the avatar itself ---- */
ok(X.AV_PARTS.length>=8,'an avatar is built from eight or more parts');
ok(Object.keys(X.AV_HAIR).length>=8&&Object.keys(X.AV_ACC).length>=8,'there are plenty of hairstyles and accessories to choose from');
const svg=X.avatarChar({skin:'tan',hair:'curly',hairCol:'auburn',eyes:'sharp',mouth:'smirk',acc:'glasses',shirt:'crimson',bg:'ember'},64,'#fbbf24',7);
ok(/^<svg /.test(svg)&&/<\/svg>$/.test(svg),'it renders as a self-contained inline SVG — nothing to download');
ok(/#dda472/.test(svg)&&/#a8432a/.test(svg)&&/#991b1b/.test(svg),'the parts you picked actually show up in the drawing');
ok(/r="30" fill="none" stroke="#fbbf24"/.test(svg)&&/>7</.test(svg),'the title ring colour and your level badge are drawn on it');

/* ---- every opponent has a face, and it is always the same face ---- */
const a1=X.oppAvatar({id:'f12',name:'M. Carlsen',rating:2830,title:'GM'},40);
const a2=X.oppAvatar({id:'f12',name:'M. Carlsen',rating:2830,title:'GM'},40);
ok(a1===a2,'the same opponent always gets the same face');
const b1=X.oppAvatar({id:'f13',name:'S. Frost',rating:2050,title:''},40);
ok(a1!==b1,'different opponents look different');
const ringOf=sv=>(sv.match(/r="30" fill="none" stroke="([^"]+)"/)||[])[1];
ok(ringOf(a1)==='#fbbf24'&&ringOf(b1)==='#475569','a grandmaster gets a gold ring and an untitled player does not');
ok(/<svg /.test(X.oppAvatar({rating:1500},32)),'an opponent with no name still gets a face');

/* ---- your own avatar is yours ---- */
const c=X.store.career; c.setup=true; c.name='Ana Rivera'; X.lifeInit(c);
ok(c.avatar&&c.avatar.skin&&c.avatar.hair,'a new career starts with an avatar already made for you');
const mine=X.playerAvatar(c,64);
ok(/<svg /.test(mine),'your avatar renders');
c.avatar.acc='cap'; c.avatar.hairCol='blue';
ok(X.playerAvatar(c,64)!==mine,'changing a part changes what you look like');
c.avatarStyle='piece';
ok(/font-family:Georgia/.test(X.playerAvatar(c,64)),'you can switch back to the classic piece avatar');
c.avatarStyle='char';

// locked accessories
ok(!X.avAccUnlocked(c,'crown'),'the crown is locked until you are world champion');
c.honors=['World Champion'];
ok(X.avAccUnlocked(c,'crown'),'winning the title unlocks the crown');
ok(X.avAccUnlocked(c,'glasses'),'ordinary accessories are never locked');
const panel=X.careerAvatarPanel(c);
ok(/Your avatar/.test(panel)&&/data-act="avset"/.test(panel)&&/data-act="avrandom"/.test(panel),'the customiser offers every part plus a randomiser');
ok(/Hair colour/.test(panel)&&/Backdrop/.test(panel),'the customiser is grouped into named rows');
ok(/careerAvatarPanel\(c\)/.test(script),'the customiser is placed in the career');
ok(/data-act="avset"/.test(X.careerTabContent(c,'you')),'it lives on the You tab');

/* ---- scene backdrops ---- */
ok(Object.keys(X.SCENES).length>=9,'there is a real choice of backdrops ('+Object.keys(X.SCENES).length+')');
ok(Object.keys(X.SCENES).every(k=>X.SCENES[k].label),'every backdrop has a name for the settings menu');
ok(Object.keys(X.SCENES).filter(k=>k!=='none').every(k=>X.SCENES[k].bg),'every backdrop but "None" paints something');
ok(/--scene-bg/.test(html)&&/body\{background:var\(--scene-bg/.test(html),'the backdrop is a real CSS layer behind the app');
X.store.settings.scene='park'; X.applySceneBg();
ok(/rgba\(21,128,61/.test(dom.window.document.documentElement.style.getPropertyValue('--scene-bg')),'choosing a backdrop applies it');
c.honors=[]; c.park=null; X.lifeInit(c);
ok(!X.isUnlocked('scene','gold'),'the champion backdrop has to be earned');
X.store.settings.scene='gold'; X.applySceneBg();
ok(dom.window.document.documentElement.style.getPropertyValue('--scene-bg')==='none','a locked backdrop falls back to none instead of appearing anyway');
ok(Object.keys(X.UNLOCKS).filter(k=>k.indexOf('scene:')===0).length>=5,'several backdrops are career rewards');

console.log('\n✅ avatar+backdrop: '+pass+' checks passed');
