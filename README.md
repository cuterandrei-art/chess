# ♞ Chess Career

A single-file chess game where you live a career: start unrated, climb the Elo
ladder, earn real FIDE titles from norms and rating, and try to reach the World
Championship. Around the board there is a whole life — tournaments, prep,
rivalries, sponsors, coaches, a chess park where you play for cash, simuls,
story arcs, rent that has to be paid on Sunday.

Everything is saved privately in your browser. No account, no server, and once
it has loaded once it works with no internet at all.

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
