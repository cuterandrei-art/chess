/* Screenshots of the expanded tracker, on a phone-sized screen, with a
   realistic set of imported games seeded into storage. */
import http from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { chromium } from 'playwright-core';
const HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
const server = http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';

/* ---- a plausible 240-game history: two time controls, real openings,
        a nemesis, a few long games, clocks, accuracy on some ---- */
const DAY=86400000, NOW=Date.now();
const OPEN=[['Italian Game',['e4','e5','Nf3','Nc6','Bc4','Bc5','d3','Nf6','O-O','d6']],
  ['Sicilian Defense: Najdorf',['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6','Be3','e5','Nb3','Be7','O-O','O-O']],
  ['Queen’s Gambit Declined',['d4','d5','c4','e6','Nc3','Nf6','Bg5','Be7','e3','O-O','Nf3','h6']],
  ['French Defense: Classical',['e4','e6','d4','d5','Nc3','Nf6','e5','Nfd7','f4','c5','Nf3','Nc6']],
  ['London System',['d4','d5','Nf3','Nf6','Bf4','e6','e3','Bd6','Bxd6','Qxd6','Nbd2','O-O']],
  ['Caro-Kann Defense',['e4','c6','d4','d5','exd5','cxd5','Bd3','Nc6','c3','Nf6','Bf4','Bg4']]];
const NAMES=['knightrider88','pawnstorm_pl','Tal_Fan_1971','blitzkrieg_bob','endgame_emma',
  'silent_rook','QueenBee','zugzwang_zed','tempo_thief','Fischer_Random'];
const REASONS=['resigned','checkmated','timeout','agreed','repetition','abandoned'];
const games=[]; let rB=1420, rR=1560;
function rnd(seed){const x=Math.sin(seed*12.9898)*43758.5453;return x-Math.floor(x);}
for(let i=0;i<240;i++){
  const r=rnd(i+1), blitz=i%3!==0;
  const o=OPEN[i%OPEN.length], colour=i%2?'w':'b';
  // a nemesis who takes three out of four
  const nem=i%11===0;
  const opp=nem?'zugzwang_zed':NAMES[(i*7)%NAMES.length];
  let res = nem ? (r<0.25?1:r<0.35?0.5:0) : (r<0.47?1:r<0.58?0.5:0);
  const reason=res===1?'resigned':res===0?REASONS[Math.floor(r*6)%6]:'agreed';
  const mine=blitz?(rB+=Math.round((res===1?9:res===0?-9:0)+rnd(i+99)*6-3)):(rR+=Math.round((res===1?8:res===0?-8:0)+rnd(i+55)*6-3));
  const moves=o[1].slice(0,6+Math.floor(rnd(i+3)*(o[1].length-6)));
  const nmoves=Math.round(14+rnd(i+7)*70);
  games.push({src:'chesscom',moves:moves,color:colour,result:res,tc:blitz?'blitz':'rapid',
    date:NOW-Math.round((239-i)*0.9*DAY)-Math.round(rnd(i+11)*8)*3600000,
    opp:opp,reason:reason,myRating:mine,oppRating:mine+Math.round((rnd(i+13)-0.5)*260),
    rated:i%37!==0,tcStr:blitz?'180+2':'600',nmoves:nmoves,ecoName:o[0],
    acc:i%3===0?Math.round((55+rnd(i+17)*42)*10)/10:null,
    oppAcc:i%3===0?Math.round((55+rnd(i+19)*42)*10)/10:null,
    avgSec:blitz?Math.round(rnd(i+23)*6*10)/10:Math.round(rnd(i+23)*14*10)/10,
    endSec:Math.round(rnd(i+29)*(blitz?60:180)),maxSec:Math.round(rnd(i+31)*(blitz?25:80)),
    base:blitz?180:600,inc:blitz?2:0,clk:null,
    url:'https://www.chess.com/game/live/'+(1000000+i)});
}
const seed={_app:'chess-career',onboarded:true,myGames:games,
  myGamesMeta:{src:'chesscom',user:'demo_player',at:NOW},
  ccAccount:{user:'demo_player',added:NOW-200*DAY,lastSync:NOW,lastGameTs:NOW},
  ccProfile:{user:'demo_player',name:'Demo Player',avatar:null,country:'Romania',
    joined:NOW-900*DAY,followers:37,stats:{blitz:{last:rB,best:rB+70,w:104,l:98,d:14},
    rapid:{last:rR,best:rR+55,w:41,l:33,d:6}}}};

const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:900},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(s=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify(s)),seed);
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(400);
// the app is offline in here, so the tracker's auto-sync will not fire
const tab=async t=>{await page.click(`[data-act="trktab"][data-val="${t}"]`);await page.waitForTimeout(250);};
const shot=async (n,full)=>{await page.screenshot({path:SP+'/tx-'+n+'.png',fullPage:!!full});};

const nav=page.locator('[data-act="nav"][data-val="tracker"]:visible').first();
if(await nav.count()) await nav.click();
else { await page.click('[data-act="menutoggle"]'); await page.waitForTimeout(120);
  await page.locator('[data-act="nav"][data-val="tracker"]:visible').first().click(); }
await page.waitForTimeout(500);
await shot('01-overview',true);
for(const t of ['games','results','openings','opponents','clock','activity','insights'])
  { await tab(t); await shot('02-'+t,true); }

/* the search box, the sort, the paging */
await tab('games');
await page.fill('#trk-q','zugzwang');
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
await shot('03-search',true);
const searchCount=await page.locator('[data-act="liveopenmine"]').count();
await page.click('[data-act="trksort"][data-val="len"]'); await page.waitForTimeout(220);
await shot('04-sorted',true);
await page.click('[data-act="trkqclear"]'); await page.waitForTimeout(220);
const pager=page.locator('[data-act="trkpage"]').last();
await pager.click(); await page.waitForTimeout(220);
await shot('05-page2',true);

/* the filter, and a filter that keeps nothing */
await page.click('[data-act="trkfcolor"][data-val="b"]'); await page.waitForTimeout(200);
await page.click('[data-act="trkftc"][data-val="rapid"]'); await page.waitForTimeout(200);
await page.click('[data-act="trkfperiod"][data-val="30"]'); await page.waitForTimeout(250);
await shot('06-filtered',true);
await tab('overview'); await shot('07-filtered-overview',true);
await page.click('[data-act="trkfreset"]'); await page.waitForTimeout(250);

/* opening a game from the list onto the analysis board */
await tab('games');
await page.locator('[data-act="liveopenmine"]').first().click();
await page.waitForTimeout(700);
await shot('08-board',false);

/* and on a desktop width */
await page.setViewportSize({width:1280,height:900});
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(400);
const nav2=page.locator('[data-act="nav"][data-val="tracker"]:visible').first();
if(await nav2.count()) await nav2.click();
else { await page.click('[data-act="menutoggle"]'); await page.waitForTimeout(120);
  await page.locator('[data-act="nav"][data-val="tracker"]:visible').first().click(); }
await page.waitForTimeout(500);
await shot('09-desktop-overview',false);
await tab('games'); await shot('10-desktop-games',false);
await tab('activity'); await shot('11-desktop-activity',false);

/* does the CSV actually come out? */
await tab('games');
const dl=page.waitForEvent('download',{timeout:5000}).catch(()=>null);
await page.click('[data-act="trkcsv"]');
const d=await dl;
let csvLines=0,csvHead='';
if(d){const p=SP+'/tx-export.csv';await d.saveAs(p);
  const txt=readFileSync(p,'utf8');csvLines=txt.trim().split('\n').length;csvHead=txt.split('\n')[0];}
await page.waitForTimeout(250);
await shot('12-exported',false);

console.log('search hits for "zugzwang": '+searchCount);
console.log('download: '+(d?d.suggestedFilename():'none')+' · '+csvLines+' lines');
console.log('csv header: '+csvHead);
console.log(errs.length?('⚠️ console errors:\n'+errs.slice(0,12).join('\n')):'✅ no console errors');
writeFileSync(SP+'/tx-errors.txt',errs.join('\n'));
await browser.close(); server.close();
