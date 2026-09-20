# OpeningTrainer — Android app

A thin native wrapper (a full-screen `WebView`) around the OpeningTrainer web
app. The whole app — board, spaced-repetition trainer, **course checklist**,
explorer, and **Play vs Stockfish with forward/back navigation** — is bundled
into `app/src/main/assets/www/`. The chess rules engine is inlined, so the
trainer works **fully offline**; Play-vs-Stockfish downloads the engine over the
network when one is available.

## Get the APK (no tools needed)

Use the GitHub Actions build — GitHub's runners have the Android SDK:

1. Push this repo to GitHub (the workflow is `.github/workflows/android.yml`).
2. Open the **Actions** tab → **Build Android APK** → run it (it also runs on
   push). When it finishes, grab **`OpeningTrainer.apk`** from the run's
   **Artifacts**, or from the **latest-android** pre-release on the Releases page
   (easier to open directly on a phone).
3. On your Android phone, open the APK, allow "install unknown apps" for your
   browser/Files app when prompted, and install.

## Build it yourself

**Android Studio:** *File → Open* this `android/` folder, let it sync, then
*Run* (▶) on a device/emulator, or *Build → Build APK(s)*.

**Command line** (needs JDK 17 + the Android SDK; set `ANDROID_HOME` or add a
`local.properties` with `sdk.dir=/path/to/Android/Sdk`):

```bash
cd android
./gradlew assembleDebug
# -> app/build/outputs/apk/debug/app-debug.apk
```

## Refreshing the bundled app

The web assets in `app/src/main/assets/www/` are copies. After changing the app,
regenerate and re-copy from the repo root:

```bash
node build-bundle.js   # inline chess.js into openingtrainer.html
node build-pwa.js      # regenerate index.html
node gen-android-icons.js
cp index.html manifest.webmanifest sw.js openingtrainer.html android/app/src/main/assets/www/
cp icon-192.png icon-512.png icon-512-maskable.png apple-touch-icon.png favicon-32.png android/app/src/main/assets/www/
```

(The CI workflow does all of this automatically before each build.)

## Details

- `applicationId` / namespace: `com.openingtrainer.app`
- `minSdk` 24 (Android 7.0), `targetSdk`/`compileSdk` 34
- Android Gradle Plugin 8.5.2, Gradle 8.7, Java 17
- Permissions: `INTERNET` only (for the Stockfish engine + optional online piece
  images; everything else is local).
