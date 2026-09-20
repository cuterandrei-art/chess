# ♞ Chess Career

A single-file chess game where you live a career: start unrated, climb the Elo
ladder, earn real FIDE titles from norms and rating, and try to reach the World
Championship. Around the board there is a whole life — tournaments, prep,
rivalries, sponsors, coaches, a chess park where you play for cash, simuls,
story arcs, rent that has to be paid on Sunday.

Everything is saved privately in your browser. No account, no server, and once
it has loaded once it works with no internet at all.

---

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

**Just the file.** `work/openingtrainer.html` is the whole game in one file —
download it and open it in any browser.

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
