/* The press, the stream and the timeline: the news board only prints what
   happened, the chat only reads what is on the board, and a post is answered
   by people who have a reason to answer it. */
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
const X=new Function(script+'\nreturn {store,app,lifeInit,worldWeek,worldIndex,wxInit,buildWorld,worldRanking,wpRating,wpAge,TOURNAMENTS,'+
  'wirePush,wireUnread,wireInit,wireListTick,newsBoard,newsToggle,feedStory,feedTick,pushFeed,OUTLETS,WIRE_CATS,'+
  'startChallenge,stopClockTick,streamStart,streamMove,streamIdle,streamFinish,streamAnswer,streamPoll,streamBan,streamClip,streamPanel,streamBackseat,streamReset,STREAM_QA,CHAT,'+
  'boothMove,socialDrafts,socialCompose,socialPublish,socialAnswer,careerSocialPanel,socialInit,SOCIAL_TONES,careerTabContent};')();
function career(o){
  const c=X.store.career;
  for(const k of Object.keys(c))delete c[k];
  Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',rating:2450,provisional:false,peak:2450,season:1,weeks:0,titles:['FM','IM'],
    played:50,won:20,drawn:20,lost:10,money:5000,subs:800,fans:3000,fame:25,history:[],games:[],h2h:{}},o||{});
  X.lifeInit(c);return c;
}
const season=c=>{for(let i=0;i<52;i++){X.worldWeek(c);c.weeks++;}};

console.log('\n— M1 · the news board prints what happened —');
let c=career();
season(c);
const W=c.wire,Xw=X.wxInit(c),I=X.worldIndex().id;
ok(W.length>=30,'a season fills the board ('+W.length+' stories) without you playing a game');
const named=Xw.results.filter(r=>r.s===1&&r.winner&&r.winner.id&&r.id!=='natch'&&r.id!=='olympiad');
const told=named.filter(r=>W.some(x=>x.pid===r.winner.id&&x.cat==='results'&&x.h.indexOf(r.winner.name)>=0&&x.w===W.find(y=>y.pid===r.winner.id).w));
ok(named.length>=12&&told.length===named.length,'every event the world played is a story, with the name of whoever actually won it in the headline ('+told.length+'/'+named.length+')');
ok(W.filter(x=>x.cat==='results'&&x.pid&&!/^Shock/.test(x.h)).every(x=>I[x.pid]),'and every winner written about is somebody on the list');
const lists=W.filter(x=>x.cat==='ratings'&&x.tbl);
ok(lists.length>=11&&lists.length<=13,'the rating list comes out once a month ('+lists.length+' lists)');
const top=X.worldRanking(c,'classical').filter(p=>p.rank<=10);
ok(lists[0].tbl.length===10&&lists[0].tbl[0].n===top[0].name,'with the top ten as they stand ('+lists[0].tbl[0].n+' '+lists[0].tbl[0].r+')');
ok(lists.slice(0,-1).every(l=>l.tbl.some(r=>r.d!=null)),'and every list after the first shows who moved since the last one');
const shocks=W.filter(x=>/^Shock at/.test(x.h));
ok(shocks.every(x=>{const m=x.d.match(/\((\w+), (\d+)\) beat .*\((\w+), (\d+)\), (\d+) points/);return m&&(+m[4]-+m[2])===+m[5]&&+m[5]>=150;}),
  'a “shock” is a real game won by somebody 150+ points lower, with both ratings printed ('+shocks.length+' this season)');
ok(W.some(x=>x.cat==='leagues'&&/champions/.test(x.h)),'the leagues report every weekend, and crown their champions');
ok(W.some(x=>/Champions crowned in \d+ federations/.test(x.h))&&W.some(x=>x.src==='home'&&/ROU (champion|title)/.test(x.h)),'the national championships get a round-up, and yours gets the paper at home');
ok(W.every(x=>X.OUTLETS[x.src]),'every story has an outlet');
ok(Object.values(X.OUTLETS).every(o=>!/chess\.com|chessbase|lichess|new in chess|fide/i.test(o.n)),'and the outlets are made up — nobody real is impersonated');
ok(!/FEED_CITIES|FEED_OPENINGS/.test(script),'the invented cities and openings the old feed filled itself with are gone');
// the ticker says only true things
c.rating=2650;c.provisional=false;
let facts=0,checked=0;
for(let i=0;i<200;i++){const s=X.feedStory(c);if(!s)continue;checked++;
  const m=s[1].match(/^Prodigy watch: (.+?) \(\w+\), (\d+),/);
  if(m){const p=X.worldIndex().name[m[1]];if(p&&Math.floor(X.wpAge(p))===+m[2]&&+m[2]<18)facts++;else facts-=1000;}
  const v=s[1].match(/^At (\d+), (.+?) is the oldest/);
  if(v){const p=X.worldIndex().name[v[2]];if(p&&Math.floor(X.wpAge(p))===+v[1])facts++;else facts-=1000;}}
ok(checked>50&&facts>0,'the ticker’s facts check out against the list (ages of '+facts+' players checked)');

console.log('\n— M2 · unread, read, and the button —');
c=career();X.worldWeek(c);c.weeks++;X.worldWeek(c);c.weeks++;
ok(X.wireUnread(c)>0&&X.wireUnread(c)===c.wire.length,'new stories arrive unread ('+X.wireUnread(c)+')');
X.app.view='career';
let h=X.newsBoard();
ok(/id="newsfab"/.test(h)&&/class="nbadge"/.test(h),'the floating button carries the count');
X.newsToggle();
ok(X.app.newsOpen&&X.wireUnread(c)===0,'opening the board reads them');
h=X.newsBoard();
ok(/class="newspanel"/.test(h)&&X.WIRE_CATS.every(k=>h.indexOf('data-val="'+k[0]+'"')>=0),'the board opens with its filters');
X.newsToggle();
const n0=c.wire.length;X.wirePush(c,{h:'Same story',cat:'you'});X.wirePush(c,{h:'Same story',cat:'you'});
ok(c.wire.length===n0+1,'the same story is not printed twice');
X.store.settings.newsFab=false;ok(X.newsBoard()==='','the button can be put away');X.store.settings.newsFab=true;
ok(/News board/.test(X.careerTabContent(c,'world')),'and the World tab opens the board');

console.log('\n— M3 · the stream reads the board, never the engine —');
c=career({subs:1500,fans:6000,fame:30});
c.rival={id:'nakamura',name:'H. Nakamura',flag:'🇺🇸',rating:2780,intensity:2};
ok(X.streamStart()===null,'there is no stream without a career game to stream');
X.app.chalFormat='classical';X.startChallenge('nakamura');X.stopClockTick();
let S=X.streamStart(false);
ok(S&&S.on&&S.chat.length>=2,'going live: the chat arrives ('+S.base+' expected)');
const engineFree=[X.streamMove,X.streamIdle,X.streamBackseat].every(f=>!/playEval|Engine\.|evalLabel|app\.playHint/.test(f.toString()));
ok(engineFree,'nothing the chat says is read from the engine');
const OPERA=['e4','e5','Nf3','d6','d4','Bg4','dxe5','Bxf3','Qxf3','dxe5','Bc4','Nf6','Qb3','Qe7','Nc3','c6','Bg5','b5','Nxb5','cxb5','Bxb5+','Nbd7','O-O-O','Rd8','Rxd7','Rxd7','Rd1','Qe6','Bxd7+','Nxd7','Qb8+','Nxb8','Rd8#'];
X.app.playSide='w';
const ch=new Chess();let reacted=0;
for(const san of OPERA){const m=ch.move(san);X.app.playMoves.push({san:m.san,from:m.from,to:m.to});X.app.playStack.push(ch.fen());X.app.playFen=ch.fen();
  const before=S.n;X.boothMove();if(S.n>before)reacted++;}
ok(S.ply===OPERA.length,'the chat follows the game move by move');
const said=S.chat.map(m=>m.t).join(' | ');
ok(reacted>=8,'and reacts to what happens ('+reacted+' of '+OPERA.length+' moves got a reaction)');
ok(/SACRIFICE|sac sac|COOKING|trust the process|madness|why I watch/.test(said),'Morphy’s sacrifice is noticed');
ok(/CHECKMATE|GGGG|WHAT A FINISH|🏆🏆🏆/.test(said),'and so is the mate');
ok(S.moment&&/mate/i.test(S.moment.label),'and the mate is offered as a clip ('+(S.moment&&S.moment.label)+')');
// between moves, in a long game, chat keeps talking — about this game
X.app.view='play';X.app.playStatus='play';
const ch2=new Chess();X.app.playFen=ch2.fen();
let ctx=0;for(let i=0;i<120;i++){S.next=0;const k=S.n;X.streamIdle();S.chat.filter(m=>m.id>k&&m.k==='chat').forEach(m=>{if(/Nakamura|RIVAL|rival|2450|2500|#\d/.test(m.t))ctx++;});}
ok(ctx>=3,'in a classical game chat talks while you think, about this game and this career ('+ctx+' lines)');
const bs=[];for(let i=0;i<40;i++){const m=X.streamBackseat();if(m)bs.push(m);}
const legal=ch2.moves();
ok(bs.length&&bs.every(m=>legal.indexOf(m)>=0),'the moves chat begs for are legal ones ('+[...new Set(bs)].slice(0,4).join(', ')+')');
// a question, answered spicy
S.qa={k:'rival',u:'fork_lift',q:'what do you think of H. Nakamura?'};
const int0=c.rival.intensity;X.streamAnswer(1);
ok(c.rival.intensity===int0+1&&S.quotes.length===1,'calling your rival overrated on stream turns the rivalry up, and is remembered');
// a poll closes on your move
X.app.playStatus='play';X.app.playSide='w';X.app.playFen=ch2.fen();X.app.playMoves=[];X.app.playStack=[ch2.fen()];S.ply=0;S.st={};
X.streamPoll();
ok(S.poll&&S.poll.opts.length===3&&S.poll.opts.every(o=>legal.indexOf(o.san)>=0),'a poll offers chat three legal moves');
const pick=S.poll.opts[0].san;S.poll.opts[0].v=99;
{const m=ch2.move(pick);X.app.playMoves.push({san:m.san,from:m.from,to:m.to});X.app.playStack.push(ch2.fen());X.app.playFen=ch2.fen();X.streamMove();}
ok(!S.poll&&/CHAT PLAYS CHESS|WE PICKED THAT|chat was right|democracy/.test(S.chat.map(m=>m.t).join(' ')),'and playing chat’s move makes chat very happy');
// trolls left alone poison the stream
for(let i=0;i<4;i++){const t={id:++S.n,u:'ez_clap_99',t:'ez',k:'troll'};S.chat.push(t);}
S.n+=10;X.streamIdle();
ok(S.tox>=3,'trolls left in the chat add up');
const subs0=c.subs,money0=c.money,tilt0=c.tilt||0;
const R=X.streamFinish(1,'checkmate');
ok(c.subs>subs0&&c.money>money0,'the stream pays when it ends: +'+(c.subs-subs0)+' subscribers, +'+(c.money-money0)+' money');
ok((c.tilt||0)>tilt0&&R.tilted,'and a chat you did not moderate gets to you');
ok(c.stream.sessions===1&&c.stream.last.peak>0,'the career keeps the stream’s record');
ok(c.wire.some(x=>x.cat==='media'&&/On stream/.test(x.h)),'what you said about your rival is in the tabloid');
ok(/Stream over/.test(X.streamPanel()),'and the panel says how it went');
// blitz: no time to talk
X.app.chalFormat='blitz';X.startChallenge('nakamura');X.stopClockTick();
S=X.streamStart(false);X.app.view='play';X.app.playStatus='play';
const k0=S.n;for(let i=0;i<40;i++){S.next=0;X.streamIdle();}
ok(S.chat.filter(m=>m.id>k0&&m.k!=='sub'&&m.k!=='tip'&&m.k!=='raid').length===0,'in blitz the chat only reacts; nobody has time to chat');
ok(/barely keep up/.test(X.streamPanel()),'and says so');
X.streamReset();
ok(!X.app.stream&&!X.app._streamTimer,'leaving the game ends the stream and stops its clock');

console.log('\n— M4 · the timeline answers back —');
c=career({subs:1500,fans:6000,fame:30});
c.rival={id:'nakamura',name:'H. Nakamura',flag:'🇺🇸',rating:2780,intensity:2};
c.history=[{name:'Gibraltar Masters',emoji:'🇬🇮',score:7.5,rounds:10,avg:2480,tpr:2640,place:1,date:12345,format:'classical'}];
X.socialInit(c).followers=5000;
const D=X.socialDrafts(c);
ok(D[0]&&D[0].ctx==='event'&&/You won the Gibraltar Masters/.test(D[0].l),'there is something to post about: the event you just won');
ok(D.some(d=>d.ctx==='rival')&&D.some(d=>d.ctx==='next'),'your rival and the next event on the calendar too');
const txt=X.socialCompose(c,D[0],'insight');
ok(/Gibraltar Masters/.test(txt)&&/7½\/10/.test(txt)&&/2640/.test(txt),'the words come from the facts: “'+txt+'”');
const f0=c.social.followers,rep0=c.reputation;
const P=X.socialPublish(c,D[0],'humble',X.socialCompose(c,D[0],'humble'));
ok(c.social.followers>f0&&c.reputation>rep0,'a humble post wins followers and respect');
ok(P.rp.length>=2&&P.rp.every(r=>r.a&&r.t),'and gets replies');
ok(P.rp.some(r=>r.a.pid&&X.worldIndex().id[r.a.pid]&&X.worldIndex().id[r.a.pid].fed==='ROU'),'a compatriot off the world list congratulates you');
ok(!X.socialDrafts(c).some(d=>d.key===D[0].key),'and the same thing is not offered twice');
const rv=X.socialDrafts(c).find(d=>d.ctx==='rival');
let spicy=null;for(let i=0;i<20&&!(spicy&&spicy.rp.some(r=>r.acts&&r.acts.some(a=>a[0]==='fire')));i++)spicy=X.socialPublish(c,rv,'spicy',X.socialCompose(c,rv,'spicy'));
ok(spicy.rp.some(r=>/Nakamura/.test(r.a.n)),'a spicy post about your rival gets your rival’s answer');
ok(spicy.rp.some(r=>r.a.kind==='troll')&&spicy.rp.some(r=>r.a.kind==='press'),'and the trolls, and the press');
const R2=spicy.rp.find(r=>r.acts&&r.acts.some(a=>a[0]==='fire')),i0=c.rival.intensity;
X.socialAnswer(spicy.id,R2.id,'fire');
ok(c.rival.intensity===i0+1&&/trade shots online/.test(c.wire[0].h),'firing back turns up the rivalry, and it is news');
X.socialAnswer(spicy.id,R2.id,'laugh');
ok(R2.done==='fire','a reply is answered once');
const pr=spicy.rp.find(r=>r.a.kind==='press');X.socialAnswer(spicy.id,pr.id,'quote');
ok(/^Ada Marín: “/.test(c.wire[0].h),'a quote given to the press is printed ('+c.wire[0].h+')');
X.app.socialOpen=spicy.id;
ok(/Social media/.test(X.careerSocialPanel(c))&&X.careerSocialPanel(c).indexOf('H. Nakamura knows.')>=0,'the timeline shows the posts and their replies');
// the list posts too
c=career();c.social.tl=[];season(c);
const npc=c.social.tl.filter(p=>p.npc);
ok(npc.length>=2&&npc.every(p=>X.worldIndex().id[p.a.pid]),'the winners of the big events post about it, as themselves ('+npc.length+' posts)');

console.log('\n✅ media: '+pass+' checks passed');
process.exit(0);
