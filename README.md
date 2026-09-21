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

# build the APK
cd app_project/android && ./gradlew assembleDebug
```

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
