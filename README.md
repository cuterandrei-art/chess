# ♞ Chess Career

A single-file chess game where you live a career: start unrated, climb the Elo
ladder, earn real FIDE titles from norms and rating, and try to reach the World
Championship. Around the board there is a whole life — tournaments, prep,
rivalries, sponsors, coaches, a chess park where you play for cash, simuls,
story arcs, rent that has to be paid on Sunday.

Everything is saved privately in your browser. No account, no server, and once
it has loaded once it works with no internet at all.

---

## First run

Thirty-odd screens is a lot to be dropped into. The first time you open it,
three questions — how much chess you play, what you want out of it, and how the
board should look — set the engine strength, the time control, the puzzle
difficulty and the career pace, and land you on the screen that matches what
you said. Skip it and nothing at all is changed. It runs once, and *Settings →
Run the setup questions again* puts you back through it.

---

## Connecting your Chess.com account

The tracker can read your real games. Chess.com's public API has **no login** —
no OAuth, no token, no password — so connecting is not authentication: every
endpoint the app touches is readable by anyone who knows the username, and the
only thing stored is that username. What connecting buys you is that it is
remembered and kept current: open **Learn → Chess.com tracker**, type your name
once, and from then on the app syncs by itself whenever you are online and the
last sync is more than six hours old.

Syncs are incremental. The app remembers the finish time of the newest game it
holds, skips every archive month that closed before it, and inside the months it
does read ignores anything already seen — so a catch-up after a session costs
one request, not a crawl of your whole history. *Re-import all* forces a full
re-read and leaves games imported from Lichess untouched. Offline, the card
says so, the buttons go quiet, and every number below it still works from the
last sync.

## Get it on your phone

**Android app (recommended).** Every push builds an installable APK and attaches
it to the auto-updated pre-release:

> **https://github.com/cuterandrei-art/chess/releases/tag/latest-android**

Open that link on your phone, download `ChessCareer.apk`, allow your browser to
"install unknown apps", and install it. It launches from your app drawer and
runs entirely offline.

**Web app (PWA).** Once GitHub Pages is switched on (see below) the app is live
at:

> **https://cuterandrei-art.github.io/chess/**

Open it on your phone and use *Add to Home Screen* (iOS: Share → Add to Home
Screen). It installs like an app and works offline.

**Just the file (fully offline).** `ChessCareer-standalone.html`, built by
`node build-standalone.mjs`, is the whole game in one file that fetches
*nothing* — the rules engine, all 25,000 puzzles and the piece graphics are
inlined, and the web-font links are removed. Put it on a phone, a USB stick or
a plane and open it. The only thing it will still reach for is Stockfish, and
only if you play the engine, open the eval bar or run Game Review; everything
else works with the radio off.

`work/openingtrainer.html` is the same app but still pulls the pieces and the
font from a CDN (pieces fall back to Unicode glyphs offline).

### One-time: switch Pages on

The deploy workflow cannot enable Pages by itself (GitHub does not give the
workflow token that permission). Once, by hand:

1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.

Re-run the *Deploy the app to GitHub Pages* workflow and every push after that
publishes automatically.

---

## Opponents that play like people

A rating only means something inside its own time control. The same person is
a different player at 3+2 and at 90+30, and the app now models that in two
places. First their **numbers**: a character's classical rating is their
anchor, and their rapid, blitz and bullet ratings sit below it — far below for
a club player, barely below for a super-GM, who is sharp at every speed.
Second their **moves**: a 1700 blitz rating is a fair rating among blitz
players, but the moves behind it are worse than 1700 moves played with two
hours on the clock, so the engine is given a lower quality target for the same
label. Pick a time control in *Play* and every character's headline rating,
and how they actually play, changes with it.

On top of that they **miss things**. That is the one thing an engine never
does and a person always does, and it was most of why the old bots felt two
hundred points stronger than their label: they made small errors at an even
rate and then never, ever hung anything. Every opponent now carries a slip
chance — rare and small for a 2700, routine for a 1200, worse for everyone in
time trouble.

### and use a clock like people

Real players do not spend an even slice of the clock on every move. They
rattle out the opening from memory, stop hard on the first move that is
genuinely theirs, snap off recaptures and forced moves, think longer when the
position is unclear or has just changed, keep a safety buffer, and then — short
of time — move almost on reflex and play worse for it. Each character also has
a **pace**: Blitz Bella moves fast, Grinder Grace does not.

What comes off their clock and how long you sit there are deliberately not the
same number. In blitz and bullet they are — that is the whole point of the
format. In a rapid or classical game the wait is compressed by a square root,
so the shape of the think survives: a quick move still feels quick, a hard one
still feels hard, and only the once-a-game monster think reaches the ceiling.
Their clock drains at the matching rate, so what you watch tick down is what a
person would really have burned. Over a 30+20 game that is about a minute a
move on their clock and two or three seconds of your life.

---

## Training by what a puzzle teaches

The bundled Lichess set carries six tags — mate, mate-in-1/2/3, endgame and
promotion — and 9,291 of its 25,000 puzzles carry none at all. The motifs
people actually want to drill were dropped when the set was built.

They did not need to be downloaded. A motif is a fact about the position and
the solution, so the app reads it off the board with the rules engine it
already bundles: **fork, pin, skewer, discovered attack, double check, hanging
piece, sacrifice, back-rank mate, smothered mate, quiet move, advanced pawn**.
No new data, no network, and it works in the fully offline build like
everything else. Pick one from the theme menu, or tap a motif under a puzzle
you have just solved to get more of the same.

Two rules keep the tagging honest. A motif is only reported when the key move
is what brings it about — a rook that already shared a file with two enemy
pieces before anyone moved is not what anybody means by a pin — and the set's
own tags always win where they exist. Detection costs about 0.8 ms per puzzle,
so filtering samples the set rather than scanning all 25,000, narrowing to the
mates first for the motifs that can only happen in one. Sampled over 1,500
puzzles, 948 carried a tag before and 1,397 do now.

---

## Exact endgames, and what people really play

Two optional lookups against Lichess's free, key-less public endpoints. Both
are strictly enhancements: nothing depends on either, every caller handles a
null answer, each has a switch in Settings, and with the radio off the app
behaves exactly as it did before. One request at a time, everything cached.

**Tablebase.** With seven men or fewer on the board, an engine gives you an
opinion and the Syzygy tables give you the answer. The play view and the
opening explorer show the verdict — *White wins — mate in 23* — and then every
legal move colour-coded by what it actually does: wins, draws, or throws it
away. For an endgame drill that is a different thing from an evaluation: not
"the engine likes Kf6" but "Kf6 is the only move that does not give away the
win". A cursed win is called what it really is — drawn by the fifty-move rule.

**Opening database.** The repertoire tree says what this app thinks you should
play; the database says what two million games actually did. Every position in
the explorer shows how often each move is played, how it scores as a
white/draw/black bar, the average rating of the players who chose it, and the
notable games it came from — switchable between **masters** (over-the-board,
2200+) and **online players**, which is where you find out that the move
nobody recommends scores well under 1800 because the refutation is hard to
find. Every move in the table is playable straight off it.

---

## Arrows on the board

Right-drag (or long-press and drag) draws an arrow; right-click circles a
square. Plain is green, **shift** red, **alt** blue, **ctrl** yellow, so a plan
and a threat can sit on the board at once. Drawing the same shape again rubs it
out; drawing it in another colour recolours it. A knight's arrow bends along
the move rather than cutting across the diagonal, the shape follows your
pointer as you drag it, and a left-click clears the board.

---

## Your backup really is a backup

Everything lives in your browser — no account, no server — so the exported
`.json` is the only way onto a new phone or back from a cleared cache. For a
long time it did not work: export wrote the whole store, and import read back
four fields of it and silently left the rest alone. On the machine you exported
from that looks fine, because those fields still hold their old values. Restore
the same file onto a new device and your career, your puzzle rating, your
studies, your brilliancies and your imported games were gone, under the word
*"Progress imported."*

Restore now goes through the same doors as the normal load path, including the
career migration, so an older file still works — and it tells you what it
actually brought back rather than claiming success:

> Restored:
> 🏆 Testa — 2350, CM/FM, week 87 · 📖 3 openings · 🧩 puzzle rating 1880 …

A file that is not one of ours is refused outright instead of being half
applied over what you already have.

---

## The draw

Every event used to be the same escalator. The field was generated, sorted by
rating and handed to you weakest first, so round one was always a warm-up and
the last round was always the hardest game of the week. You knew the shape of a
tournament before you entered it.

It is drawn now, the way European football does it. The field is seeded into
**pots** — Pot 1 the ones who can beat you, Pot 4 the ones you are expected to
beat — and your fixture list is drawn one round at a time from a shuffled plan.
You still face a balanced spread, so an event is never a walkover or a
massacre; what you no longer know is the order. Round one might be the top
seed.

The draw is a small ceremony when you enter an event: the pots are laid out and
your fixtures come out one ball at a time, or all at once for anyone who would
rather just play. It never blocks anything — pressing **Play** finishes the
draw itself. Over 600 nine-round draws, the weakest-to-strongest order that
used to be guaranteed now turns up twice, your first opponent comes out of all
four pots about equally often, and no two events are drawn the same way.

The World Championship match is not drawn, for the obvious reason that there is
only one opponent.

---

## What the round is worth

The tournament screen has always shown the crosstable and the norm tracker, and
never said the thing a player in that chair would be thinking. Now it does, in
one line worked out from the standings and the rounds left:

> **⏳ Final round — Win and you win Hastings Masters.**
> Level at the top going into the last round. This is the game.

A point clear with one to play and a draw wins it outright; half a point clear
and only the full point settles it, because a draw gets caught. Two behind with
one round left and it says you are out of it, because you are. The same line
leads the dashboard while an event is running, so you can see what is at stake
before you even open the tournament.

---

## Games that went differently

A result used to be 1, ½ or 0, which makes a career out of identical points.
The engine is already evaluating the position while you play, so the shape of
the game costs nothing to keep: how bad it got, how good it got, how long it
lasted, how it ended. Afterwards the game is told properly — *you were dead
lost, and you won it anyway*; *you had that won, and let it slip*; *over in 19
moves, never a contest*; *you held a position you had no business holding* —
and it lands on your **mood** and your **tilt** accordingly. Stealing a win is
worth more than a routine one; throwing a win away stings more than being
outplayed. With no engine available it falls back to the length and the ending,
and still says something true.

---

## Moments

You do not tell people your rating graph. You tell them about the time you beat
a grandmaster. Those are all detectable from what already happens, so the career
keeps them by itself — your first win over a titled player, a giant-killing, the
event you won, a norm, a title, beating your rival, and the games that went
somewhere worth remembering. **Legacy → Moments** is the shelf they land on.
There is nothing to manage and nothing to click: it fills up as you play, the
big ones toast as they land, and a first is only a first once.

---

## Automation

A career has a lot of small obvious decisions in it — claim the daily reward,
claim a finished quest, rest when you are exhausted, see the physio when you
are injured, take a coaching shift when rent is due and the money is thin.
None of them are interesting choices and all of them have to be clicked, so
**Life → Automation** will do them for you.

A **day plan** decides how a day gets spent: *Balanced*, *Train hard*, *Earn*,
*Recover* or *Have a life*. Whatever the plan, an injury, exhaustion, tilt, ill
health and unpayable rent come first — it will never pick something you cannot
afford or have not the energy for. Then six **switches** cover the routine
jobs: claiming the daily reward and finished quests, finishing the week in one
click, signing the best sponsor offer, upgrading where you live and buying
lifestyle upgrades, each never spending below a **cash reserve** you set.

Everything starts **off**. Automation never takes a decision you did not ask
it to take, nothing runs on a timer behind your back, and every switch only
ever does bounded, repeatable things. What it has done is written down, so you
can see exactly where your week went.

---

## The dashboard

The career spreads across seven tabs and forty panels. A single card above all
of them answers *what is going on*: who you are, what you are rated at
classical, rapid and blitz, the money against the bills that are coming, your
energy, health, mood, tilt and form, and one line for what is actually
happening right now — round three of nine, or Wednesday with rent due Sunday —
with the button to get on with it. Under that, everything quietly waiting for
you is a chip you can tap straight to: an injury, a debt, an unclaimed reward,
a sponsor offer, spare skill points. When there is nothing, it says so rather
than inventing a chore.

---

## Following a game live

The tracker's **Live** tab follows any Chess.com player. Chess.com's public API
publishes a player's **daily** (correspondence) games while they are in
progress — the position, whose move it is and the deadline — and does not
publish live blitz or rapid until they have finished. So the Live tab follows
daily games move by move, refreshing every 30 seconds while the tab is open,
and picks everything else up the moment it lands in the archive.

Open one and you get an analysis board: an **eval bar** and **engine
suggestions**, each on its own switch. Suggestions draw the top three moves as
arrows on the board — green, blue, violet — matching the lines listed beneath
it. Step back through the game and the engine re-analyses whatever position you
are looking at; return to the end and the board follows the game again. Your
own stored games open on the same board, so this works with the radio off too.
Variants (Chess960, bughouse) are listed but not analysed, because the engine
cannot read them.

The switches live in `settings.liveEval` and `settings.liveHints` and persist.
Polling only runs while a live screen is open, and a redraw never postpones the
next refresh.

---

## Repo layout

| Path | What it is |
|------|------------|
| `work/openingtrainer.html` | **The source of truth.** The entire app — markup, styles and logic — in one file. |
| `build/` | The PWA `<head>` block and service-worker snippet injected at build time. |
| `build-netlify.mjs` | Builds `netlify/` from the source file. `node build-netlify.mjs 51` also bumps the service-worker cache to `v51`. |
| `build-standalone.mjs` | Builds `ChessCareer-standalone.html` — inlines the piece set from `build/pieces/` and strips every network reference the page needs to render. |
| `build/pieces/` | The twelve cburnett piece SVGs, committed so the standalone build is reproducible without a network. |
| `netlify/` | The generated, installable web bundle (`index.html`, `sw.js`, manifest, icons). |
| `app_project/android/` | The Android WebView wrapper that bundles the same files into an APK. |
| `validate-*.mjs` | The test battery — one suite per system. |
| `visual-check.mjs` | Boots the real app in headless Chromium, screenshots key screens and reports page errors. |
| `engine-check.mjs` | Downloads the real Stockfish and checks the evaluation against positions whose answer is known. |
| `validate-strength.mjs` | The real-life strength model, the human clock, career automation, the dashboard, and that the board does not move. |
| `validate-motifs.mjs` | The motif detector against positions whose answer is known, the tablebase's reading of the API, the opening database, board annotations and the first-run setup. |
| `validate-moments.mjs` | The tournament draw, what a round is worth, the manner of a result, and the moments a career keeps. |

## Build it yourself

```bash
npm install

# run every test suite
for f in validate-*.mjs; do node "$f"; done

# rebuild the web bundle (optionally bumping the service-worker cache)
node build-netlify.mjs 51

# build the fully-offline single file
node build-standalone.mjs

# boot the app in a real browser and screenshot it
node visual-check.mjs

# check the real engine against known positions (needs a network once)
node engine-check.mjs

# build the APK
cd app_project/android && ./gradlew assembleDebug
```

## Learn from your mistakes

Game Review tells you where you went wrong. That is a report, not practice, so
a finished review offers **🎯 Learn from your mistakes**: it puts you back in
each position you got wrong, in the order you played them, with the move
hidden, and asks you to find something better.

It does not demand the engine's exact first choice. A move it did not name is
sent to the engine and measured — anything that keeps essentially as much as
the best move is accepted, because that is what finding the idea means. A move
that throws the position away too is refused with the damage named, and playing
your original mistake again is called out by name. After two wrong tries the
answer is offered. Either way the move is explained in words by the same coach
that narrates the opening trainer, and spoken aloud if the voice is on.

Only your own errors are practised, the session is capped so it can be
finished, and the end screen offers a second pass at just the ones you missed.
A lifetime tally lives in `stats.drill`. With no engine available only the
best move can be checked, and the drill says so rather than pretending.

## The engine

One Stockfish worker serves six callers: the bot in a game, the hint button,
the spectator, Game Review, the explorer's eval bar and the live board. Each
search therefore carries a ticket. Exactly one runs at a time, it owns its own
callbacks, and its results are delivered only to it — so an evaluation can
never belong to a position you have already left, and an eval refresh can
never take a bot's move with it. A newcomer either waits (a move the player is
waiting for is never thrown away) or stops the running search and takes its
place; stopping is done properly, with `stop` and a wait for that search's own
`bestmove` before the next `position` is sent. A caller whose search was
abandoned is told so rather than handed somebody else's numbers, and a search
the engine never answers times out instead of hanging.

Evaluations are always shown from White's side, so the number and the bar
agree, and the search depth is displayed so a shallow evaluation is not
mistaken for a considered one. A position with no legal moves is not put to
the engine at all — it reports no principal variation, which is not an error.

Game Review searches one principal variation rather than three (more accurate
for the same time) and will not call a move an error unless it gave up at
least `REV_NOISE_CP` centipawns: two positions searched for the same time
reach different depths, and small swings between them are search noise, not
mistakes. Being theory excuses an inaccuracy but never a lost piece.

`validate-engine.mjs` covers all of this with a mock worker, so it runs
anywhere. `engine-check.mjs` downloads the real Stockfish and drives the real
app in a browser against positions whose answers are known independently
(mates both ways, a queen up each way, finished games, stepping faster than
the engine can answer, and a game with one known blunder).

## Tests

`validate-smoke.mjs` is the gate: it parses the app, renders every career tab,
checks the puzzle set, and guards against **duplicate top-level declarations** —
legal inside `new Function` but a `SyntaxError` in a real module, so a plain
parse test misses them and the app silently never boots. The other suites cover
one system each (career pace, story arcs and the world feed, brilliancies, the
park and simuls, the weekly life sim, avatars and backdrops, profiles, courses,
endgames, and the rest).

Every push runs the whole battery in CI, and both the Pages deploy and the APK
build refuse to publish unless the smoke test passes first.
