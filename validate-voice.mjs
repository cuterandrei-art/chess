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
const X=new Function(script+'\nreturn {store,app,explainMove,Voice,coachSay,coachCard,vxAttacks,vxBoard,vxPinned,exCoachText};')();

const say=(fen,san,opts)=>{const r=X.explainMove(fen,san,opts);return r?r.text:'';};
const from=(sans)=>{const c=new Chess();for(const s of sans)c.move(s);return c.fen();};
const START=new Chess().fen();

/* ---- it explains the standard opening principles ---- */
ok(/centre/i.test(say(START,'e4')),'1.e4 is explained as a fight for the centre');
ok(/line for the (queen and bishop|bishop and queen)/i.test(say(START,'e4')),'and as opening lines for the pieces behind it');
const nf3 = say(from(['e4','e5']),'Nf3');
ok(/develop|brings|off the back rank/i.test(nf3),'Nf3 is explained as development');
ok(/e5|centre/i.test(nf3),'and it notices what the knight now covers');
ok(/castles/i.test(say(from(['e4','e5','Nf3','Nc6','Bc4','Bc5']),'O-O')),'castling is explained as castling');
ok(/king/i.test(say(from(['e4','e5','Nf3','Nc6','Bc4','Bc5']),'O-O')),'and mentions the king going to safety');
ok(/f7/.test(say(from(['e4','e5','Nf3','Nc6']),'Bc4')),'Bc4 is explained as pointing at f7');
ok(/long diagonal|fianchetto/i.test(say(from(['d4','Nf6','c4','g6','Nc3']),'Bg7')),'a fianchetto is called a fianchetto');

/* ---- it understands pawn moves that prepare and challenge ---- */
ok(/push to d4|centre/i.test(say(from(['e4','e5','Nf3','Nc6','Bc4','Bc5']),'c3')),'c3 is explained as preparing d4, not dismissed as nothing');
ok(/challenges/i.test(say(from(['d4','d5']),'c4')),'the Queen’s Gambit c4 is explained as challenging d5');

/* ---- tactics ---- */
const forkPos = from(['e4','e5','Nf3','Nc6','Bc4','Nd4','Nxe5','Qg5']);
ok(/forks/i.test(say(forkPos,'Nxf7')),'a knight fork is called a fork');
ok(/cannot save both/i.test(say(forkPos,'Nxf7')),'and says why a fork wins');
ok(/check/i.test(say('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1','Qh4')),'a check is reported as a check');
ok(/checkmate/i.test(say('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1','Qh4#')),'mate is announced as mate');
// an undefended piece is free material: after 3...Nd4 the e5 pawn is loose
ok(/wins the undefended pawn/i.test(say(from(['e4','e5','Nf3','Nc6','Bc4','Nd4']),'Nxe5')),'taking a genuinely undefended pawn is called winning it');
// a defended pawn is a trade, not a win
ok(/trades|takes/i.test(say(from(['e4','d5']),'exd5')),'taking a defended pawn is described as a trade, not free material');
// recaptures are named as such
ok(/recaptures/i.test(say(from(['e4','d5','exd5']),'Qxd5',{prevTo:'d5'})),'a recapture is called a recapture');
ok(!/pins/i.test(say(from(['e4','e5','Nf3','Nc6','Bb5']),'a6')),'a quiet pawn move is not called a pin');
// on d8 sits the queen, not the king — so this is a pin to the queen, and the
// coach should say exactly that rather than claiming an absolute pin
const bg5=say(from(['d4','Nf6','c4','e6','Nc3','d5']),'Bg5');
ok(/pins the knight on f6 to the queen/i.test(bg5),'Bg5 is called a pin of the knight to the queen behind it');
ok(!/against the king/i.test(bg5),'and is not mis-sold as an absolute pin');
ok(!/attacks the knight/i.test(bg5),'the same knight is not reported as both pinned and attacked');
// black king d8, knight d7: Qd5 pins the knight absolutely
ok(/against the king/i.test(say('3k4/3n4/8/8/8/8/8/3Q3K w - - 0 1','Qd5')),'a genuine pin against the king is called one');
ok(!/pins the pawn/i.test(say(from(['e4','e5']),'Qh5')),'a pawn lined up with a rook is not called a pin');
ok(/attacks the knight/i.test(say(from(['e4','e5','Nf3','Nc6']),'Bb5')),'the Ruy Lopez Bb5 is explained as pressure on the c6 knight');

/* ---- it warns when a move leaves something loose ---- */
// h6 already played, so Ng5 drops the knight to a pawn
const loose = X.explainMove('rnbqkb1r/pppp1pp1/5n1p/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','Ng5');
ok(loose && typeof loose.caveat==='string' && /loose on g5/.test(loose.caveat),'it warns when a move leaves a piece loose');
ok(/Watch out/.test(loose.text),'and the warning is part of what gets read out');
const safeMove = X.explainMove(from(['e4','e5']),'Nf3');
ok(safeMove && safeMove.caveat===null,'a safe move carries no warning');

/* ---- it never returns nonsense ---- */
const c=new Chess(); let checked=0;
for(const san of ['e4','c5','Nf3','d6','d4','cxd4','Nxd4','Nf6','Nc3','a6','Be3','e5','Nb3','Be7','f3','O-O','Qd2','Nbd7']){
  const f=c.fen(); const r=X.explainMove(f,san);
  ok(!!r && r.text.length>12 && r.text.startsWith(san) && /\.$/.test(r.text), 'Najdorf move '+(++checked)+' ('+san+') gets a complete sentence');
  c.move(san);
}
ok(X.explainMove(START,'Qh8')===null,'an illegal move is refused rather than guessed at');

/* ---- the voice plumbing ---- */
ok(typeof X.Voice.ok==='function'&&X.Voice.ok()===false,'speech reports itself unavailable where the browser has none');
ok(X.Voice.say('hello')===false,'so nothing is spoken and it fails quietly instead of throwing');
ok(X.Voice.list().length===0&&(X.Voice.stop()||true),'listing voices and stopping are safe with no speech engine');
X.store.settings.voiceOn=false;
ok(X.coachSay(START,'e4')&&X.coachSay(START,'e4').indexOf('centre')>=0,'coachSay still returns the text when the voice is off, so it can be shown');
ok(X.coachSay(START,'e4',{note:'Author’s own note.'})==='Author’s own note.','a hand-written course note wins over the generated one');
ok(X.coachSay(START,'Qh8')===null,'coachSay returns nothing for an illegal move');

/* ---- the card ---- */
const card=X.coachCard('Some explanation.','🎓 Why this move');
ok(/Why this move/.test(card)&&/Some explanation\./.test(card),'the coach card shows the label and the text');
ok(/data-act="coachsay"/.test(card)&&/data-act="coachtoggle"/.test(card),'and offers replay and an on/off toggle');
ok(X.coachCard('')==='' ,'no text means no card');
ok(/coachCard\(exCoachText\(\)/.test(script),'the card is placed in the opening explorer');
ok(/coachCard\(app\.coachNote/.test(script),'and in the trainer');
ok(/voiceOn/.test(script)&&/data-act="voicetest"/.test(script),'Settings can turn the voice on and test it');

console.log('\n✅ voice+coach: '+pass+' checks passed');
