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
const X=new Function(script+'\nreturn {store,app,ccIsOnline,ccAccount,ccConnected,ccConnect,ccDisconnect,ccMergeGames,ccSync,ccSyncAge,ccSyncLabel,ccSyncNow,ccAutoSync,ccConnectThenSync,ccConnectCard,ccArchiveEndsBefore,CC_AUTO_MS,impFetchChessCom,viewTracker,viewImport};')();

/* online is assumed unless the browser says otherwise: a missing navigator.onLine
   must not lock the feature out */
const onlineFlag={v:true};
// the app reads a bare `navigator`, which inside this harness is Node's own
Object.defineProperty(globalThis.navigator,'onLine',{get:()=>onlineFlag.v,configurable:true});
ok(X.ccIsOnline()===true,'the browser reporting online is taken at face value');
onlineFlag.v=false; ok(X.ccIsOnline()===false,'and so is offline');
onlineFlag.v=true;

/* ================= which months are worth fetching ================= */
const AR='https://api.chess.com/pub/player/me/games/';
ok(X.ccArchiveEndsBefore(AR+'2024/01',0)===false,'with no watermark every month is in play');
// a game finishing 1 Mar 2024 means January and February hold nothing new
const mar=Date.UTC(2024,2,1);
ok(X.ccArchiveEndsBefore(AR+'2024/01',mar)===true,'a month that ended before the newest stored game is skipped');
ok(X.ccArchiveEndsBefore(AR+'2024/02',mar)===true,'including the month immediately before');
ok(X.ccArchiveEndsBefore(AR+'2024/03',mar)===false,'the month the newest game is in is still read');
ok(X.ccArchiveEndsBefore(AR+'2024/04',mar)===false,'and so is everything after it');
ok(X.ccArchiveEndsBefore(AR+'2023/12',Date.UTC(2024,0,1))===true,'the year boundary is handled');
ok(X.ccArchiveEndsBefore('nonsense',mar)===false,'an unparseable url is fetched rather than silently dropped');

/* ================= merging without duplicating ================= */
const G=(o)=>Object.assign({src:'chesscom',moves:['e4','e5','Nf3','Nc6','Bc4','Bc5'],color:'w',result:1,
  tc:'blitz',date:1000,opp:'a',reason:'win',myRating:1500,oppRating:1500,rated:true,tcStr:'600',
  nmoves:30,url:null},o);
let merged=X.ccMergeGames([G({url:'/1',date:1}),G({url:'/2',date:2})],[G({url:'/2',date:2}),G({url:'/3',date:3})]);
ok(merged.length===3,'a game already stored is not added twice ('+merged.length+')');
ok(merged.map(g=>g.url).join(',')==='/3,/2,/1','and the result is newest first');
merged=X.ccMergeGames([G({date:5,opp:'bob'})],[G({date:5,opp:'bob'}),G({date:6,opp:'ann'})]);
ok(merged.length===2,'without a url, the finish time and opponent identify a game');
merged=X.ccMergeGames([G({url:'/x',date:9,nmoves:1})],[G({url:'/x',date:9,nmoves:40})]);
ok(merged[0].nmoves===40,'the freshly fetched copy wins, so corrections land');
const many=[];for(let i=0;i<900;i++)many.push(G({url:'/g'+i,date:i}));
ok(X.ccMergeGames(many,[]).length===600,'the store is capped so it cannot grow without bound');
ok(X.ccMergeGames(null,null).length===0,'merging nothing is safe');

/* ================= connecting ================= */
function stubApi(games,seen){
  // games: [{end_time, white, black, pgn, url}] keyed by 'YYYY/MM'
  globalThis.fetch=async(u)=>{
    u=String(u); seen&&seen.push(u);
    if(/\/games\/archives$/.test(u))
      return {ok:true,status:200,json:async()=>({archives:Object.keys(games).map(k=>AR+k)})};
    const m=/\/games\/(\d{4}\/\d{2})$/.exec(u);
    if(m)return {ok:true,status:200,json:async()=>({games:games[m[1]]||[]})};
    if(/\/stats$/.test(u))return {ok:true,status:200,json:async()=>({chess_blitz:{last:{rating:1500}}})};
    if(/pub\/country\//.test(u))return {ok:true,status:200,json:async()=>({name:'Norway'})};
    return {ok:true,status:200,json:async()=>({username:'Hikaru'})};
  };
}
const PGN='[Event "Live Chess"]\n[White "hikaru"]\n[Black "opp"]\n[Result "1-0"]\n[TimeControl "600"]\n[ECO "C50"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 d6 1-0';
function apiGame(ts,url){return {url:url,rules:'chess',time_class:'blitz',time_control:'600',rated:true,
  end_time:Math.floor(ts/1000),white:{username:'hikaru',rating:1500,result:'win'},
  black:{username:'opp',rating:1490,result:'resigned'},pgn:PGN};}

X.store.myGames=[];X.store.ccAccount=null;X.store.myGamesMeta=null;
ok(X.ccConnected()===false,'nothing is connected to begin with');
ok(/Connect your Chess.com account/.test(X.ccConnectCard()),'so the card offers to connect');
ok(/no login/.test(X.ccConnectCard()),'and is honest that there is no login to perform');

onlineFlag.v=false;
let threw=null; try{await X.ccConnect('hikaru');}catch(err){threw=err.message;}
ok(/offline/.test(threw||''),'connecting while offline is refused with a plain reason');
ok(/You are offline/.test(X.ccConnectCard()),'and the card says so rather than showing a dead button');
ok(/disabled/.test(X.ccConnectCard()),'the connect button is disabled offline');
onlineFlag.v=true;

threw=null; try{await X.ccConnect('   ');}catch(err){threw=err.message;}
ok(/username/.test(threw||''),'an empty username is refused');

globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({})});
threw=null; try{await X.ccConnect('nobody-at-all');}catch(err){threw=err.message;}
ok(/no player called/.test(threw||''),'a username that does not exist is reported, not stored');
ok(X.ccConnected()===false,'and nothing is remembered after a failed connect');

const seen=[];
stubApi({'2024/01':[apiGame(Date.UTC(2024,0,10),'/j1')],
         '2024/02':[apiGame(Date.UTC(2024,1,10),'/f1')],
         '2024/03':[apiGame(Date.UTC(2024,2,10),'/m1'),apiGame(Date.UTC(2024,2,20),'/m2')]},seen);
const acct=await X.ccConnect('hikaru');
ok(X.ccConnected()===true,'a real account connects');
ok(acct.user==='Hikaru','the name is stored as Chess.com spells it, not as it was typed');
ok(acct.autoSync===true,'auto-sync is on by default — that is the point of connecting');
ok(acct.lastGameTs===0&&acct.lastSync===0,'but nothing has been synced yet');
ok(X.store.ccProfile&&X.store.ccProfile.profile.username==='Hikaru','the profile is kept from the check, so no second fetch is needed');
ok(/Connected as Hikaru/.test(X.ccConnectCard()),'the card switches to the connected state');
ok(/never synced/.test(X.ccConnectCard()),'and admits it has not synced yet');

/* ================= the first sync reads everything ================= */
let r=await X.ccSync({});
ok(r.total===4,'the first sync brings in every game it can find ('+r.total+')');
ok(X.store.myGames.length===4,'and stores them');
ok(X.store.myGames[0].url==='/m2','newest first');
ok(X.ccAccount().lastGameTs===Date.UTC(2024,2,20),'the watermark is the newest game, not the clock');
ok(X.ccAccount().lastSync>0,'and the sync time is recorded');
ok(X.store.myGamesMeta&&X.store.myGamesMeta.user==='Hikaru','the importer metadata is kept in step, so the rest of the app agrees');
ok(/synced just now/.test(X.ccConnectCard()),'the card reports a fresh sync');
ok(/4 games stored/.test(X.ccConnectCard()),'and how much it holds');

/* ================= the second sync reads only what is new ================= */
seen.length=0;
r=await X.ccSync({});
ok(r.added===0,'syncing again with nothing new adds nothing');
ok(X.store.myGames.length===4,'and does not duplicate what is there');
ok(!seen.some(u=>/2024\/01$/.test(u))&&!seen.some(u=>/2024\/02$/.test(u)),
  'the months that closed before the newest stored game are never requested');
ok(seen.some(u=>/2024\/03$/.test(u)),'the current month is still checked');

seen.length=0;
stubApi({'2024/01':[apiGame(Date.UTC(2024,0,10),'/j1')],
         '2024/02':[apiGame(Date.UTC(2024,1,10),'/f1')],
         '2024/03':[apiGame(Date.UTC(2024,2,10),'/m1'),apiGame(Date.UTC(2024,2,20),'/m2'),
                    apiGame(Date.UTC(2024,2,25),'/m3')]},seen);
r=await X.ccSync({});
ok(r.added===1,'a game played since the last sync is picked up ('+r.added+' added)');
ok(X.store.myGames.length===5&&X.store.myGames[0].url==='/m3','and lands at the top of the list');
ok(X.ccAccount().lastGameTs===Date.UTC(2024,2,25),'the watermark moves forward');

/* ================= a full re-import leaves other sources alone ================= */
X.store.myGames=X.store.myGames.concat([{src:'lichess',moves:['d4','d5'],color:'w',result:1,date:50,opp:'z'}]);
r=await X.ccSync({full:true});
ok(X.store.myGames.filter(g=>g.src==='lichess').length===1,'re-importing Chess.com does not delete Lichess games');
ok(X.store.myGames.filter(g=>g.src==='chesscom').length===5,'and re-reads the whole Chess.com archive');

/* ================= offline and disconnected ================= */
onlineFlag.v=false;
threw=null; try{await X.ccSync({});}catch(err){threw=err.message;}
ok(/offline/.test(threw||''),'syncing offline is refused with a reason a person can act on');
ok(/offline/.test(X.ccConnectCard()),'the connected card marks itself offline');
ok(/last sync/.test(X.ccConnectCard()),'and warns that the numbers below are stale');
onlineFlag.v=true;

X.ccDisconnect();
ok(X.ccConnected()===false,'disconnecting forgets the account');
ok(X.store.myGames.length>0,'but keeps the games already downloaded');
threw=null; try{await X.ccSync({});}catch(err){threw=err.message;}
ok(/No account connected/.test(threw||''),'and syncing without an account says so');

/* ================= the automatic catch-up ================= */
stubApi({'2024/03':[apiGame(Date.UTC(2024,2,10),'/m1')]});
X.store.ccAccount={src:'chesscom',user:'Hikaru',connectedAt:1,lastSync:Date.now(),lastGameTs:Date.UTC(2024,2,10),autoSync:true};
X.app._ccAutoTried=false;X.app.ccSyncing=false;
X.ccAutoSync();
ok(X.app._ccAutoTried===false,'a sync from minutes ago is not repeated on every view');
X.store.ccAccount.lastSync=Date.now()-X.CC_AUTO_MS-1000;
X.ccAutoSync();
ok(X.app._ccAutoTried===true,'but a stale account is caught up automatically');
X.app._ccAutoTried=false;
X.store.ccAccount.autoSync=false;
X.ccAutoSync();
ok(X.app._ccAutoTried===false,'turning auto-sync off means it stays off');
X.store.ccAccount.autoSync=true;
onlineFlag.v=false; X.ccAutoSync();
ok(X.app._ccAutoTried===false,'and it never tries while offline');
onlineFlag.v=true;
X.store.ccAccount=null; X.ccAutoSync();
ok(X.app._ccAutoTried===false,'with no account there is nothing to catch up');

/* ================= how long ago ================= */
ok(X.ccSyncAge()===null&&X.ccSyncLabel()==='never synced','with no account there is no sync age');
X.store.ccAccount={src:'chesscom',user:'Hikaru',connectedAt:1,lastSync:Date.now()-5*60000,lastGameTs:1,autoSync:true};
ok(X.ccSyncLabel()==='synced 5 min ago','minutes are reported ('+X.ccSyncLabel()+')');
X.store.ccAccount.lastSync=Date.now()-3*3600000;
ok(X.ccSyncLabel()==='synced 3 hours ago','hours are reported ('+X.ccSyncLabel()+')');
X.store.ccAccount.lastSync=Date.now()-50*3600000;
ok(X.ccSyncLabel()==='synced 2 days ago','and days ('+X.ccSyncLabel()+')');
X.store.ccAccount.lastSync=Date.now()-26*3600000;
ok(X.ccSyncLabel()==='synced 1 day ago','singular where it should be singular');

/* ================= wiring ================= */
X.store.myGames=[];X.store.ccAccount=null;
ok(/Connect your Chess.com account/.test(X.viewTracker()),'the tracker leads with the connect card');
ok(!/Connect your Chess.com account/.test(X.viewImport()),'the import page does not repeat the username box while disconnected');
X.store.ccAccount={src:'chesscom',user:'Hikaru',connectedAt:1,lastSync:Date.now(),lastGameTs:1,autoSync:true};
ok(/Connected as Hikaru/.test(X.viewImport()),'but it does show the connected account, so you can sync from there');
ok(/ccAutoSync\(\);/.test(script)&&/function viewTracker\(\)\{\s*ccAutoSync\(\)/.test(script),'opening the tracker triggers the catch-up');
for(const act of ['ccconnect','ccsync','ccfull','ccauto','ccdisconnect'])
  ok(new RegExp("act==='"+act+"'").test(script),'the '+act+' button is wired');
ok(/addEventListener\('online'/.test(script)&&/addEventListener\('offline'/.test(script),
  'the page re-renders when the connection comes and goes');
ok(/ccAccount:d\.ccAccount\|\|null/.test(script),'the account survives a reload');
ok(/ccAccount:null/.test(script),'and has a default in the store');
ok(/_cl\.lastGameTs=0/.test(script),'clearing the games resets the watermark, so a later sync refills them');
// the account is a username and nothing more: no secret is stored or sent
const layer=script.slice(script.indexOf('CONNECTING AN ACCOUNT'),script.indexOf('the voice itself'));
ok(!/Authorization|Bearer|client_secret|api[_-]?key/i.test(layer),
  'the connection layer sends no credential — there is none to send');
X.store.ccAccount=null;
stubApi({'2024/03':[apiGame(Date.UTC(2024,2,10),'/m1')]});
const stored=await X.ccConnect('hikaru');
ok(Object.keys(stored).sort().join(',')==='autoSync,connectedAt,lastGameTs,lastSync,src,user',
  'and stores nothing but the username, the flags and the timestamps ('+Object.keys(stored).sort().join(',')+')');

console.log('\n✅ connect: '+pass+' checks passed');
