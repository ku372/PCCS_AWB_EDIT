# Building the PCCS AWB Tool as an Android APK

This document explains how to wrap the existing **static PWA** in a
Capacitor native shell and produce an installable `.apk` (or `.aab`
for Play Store) — **without touching any of the existing PDF /
calculator logic**.

The web app continues to work in any browser exactly as before. The
Android wrapper is purely additive.

---

## 1 · Prerequisites (one-time setup on your machine)

| Tool | Version | Where to get it |
|------|---------|------------------|
| **Node.js** | 20 LTS or newer | <https://nodejs.org> |
| **JDK** | 17 (recommended) or 21 | <https://adoptium.net> |
| **Android Studio** | Hedgehog or newer | <https://developer.android.com/studio> |
| **Android SDK Platform** | API 34 (Android 14) | install via Android Studio → SDK Manager |
| **Android SDK Build-Tools** | 34.0.0 | install via Android Studio → SDK Manager |

After installing Android Studio, set these environment variables
(the **exact** paths will vary by OS):

```bash
# Linux / macOS — add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Windows (PowerShell, run once)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
```

Verify everything works:

```bash
node -v          # → v20.x or v22.x
java -version    # → 17.x or 21.x
adb --version    # ships with Android SDK Platform-Tools
```

---

## 2 · Install JS dependencies

From the repository root (where `package.json` lives):

```bash
npm install
```

This installs Capacitor 7 plus the SplashScreen, StatusBar, and App
plugins listed in `package.json`.

---

## 3 · Generate the native Android project (one time only)

```bash
npm run cap:add:android
```

What this does:

1. Runs `node scripts/build-web.js` which copies the static web app
   (`index.html`, `manifest.json`, `sw.js`, icons, `assets/`) into
   the `dist/` folder. Anything Capacitor-specific (`node_modules`,
   `android`, `scripts`, etc.) is excluded.
2. Runs `npx cap add android` which scaffolds the `android/` Gradle
   project and copies `dist/` into
   `android/app/src/main/assets/public/`.

After this command you should have a new `android/` folder. **Commit
it once if you want a reproducible baseline** — Capacitor recommends
committing it. The `.gitignore` keeps generated/build artefacts out
of git.

---

## 4 · Daily workflow — sync web changes into the APK

Every time you change `index.html`, `assets/`, `sw.js`, or the
manifest:

```bash
npm run cap:sync
```

This rebuilds `dist/` and syncs it into `android/app/src/main/assets/`.

To see changes live on a connected device or emulator:

```bash
npm run cap:run:android
```

---

## 5 · Customise the Android app icon and splash screen

The web icons (`icon-192.png`, `icon-512.png`) are already used inside
the WebView. For the **native launcher icon and splash screen** you
have two options.

### Option A · Quick (manual)

Drop your finished assets into the standard Android folders:

```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png         (48×48)
├── mipmap-hdpi/ic_launcher.png         (72×72)
├── mipmap-xhdpi/ic_launcher.png        (96×96)
├── mipmap-xxhdpi/ic_launcher.png       (144×144)
├── mipmap-xxxhdpi/ic_launcher.png      (192×192)
├── drawable/splash.png                 (2732×2732 — center-cropped)
└── values/ic_launcher_background.xml   (color #0a0e1a recommended)
```

### Option B · Use `@capacitor/assets` (auto-generates every density)

```bash
npm install --save-dev @capacitor/assets
mkdir -p resources

# Place ONE master icon (1024×1024 PNG) and ONE splash (2732×2732 PNG):
#   resources/icon.png
#   resources/splash.png

npx capacitor-assets generate --android
npx cap sync android
```

Splash background colour and timing are already configured in
[`capacitor.config.json`](./capacitor.config.json) under the
`SplashScreen` plugin block.

---

## 6 · Build a debug APK (for testing)

```bash
npm run android:assemble:debug
```

Output:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Install on a connected phone:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7 · Build a signed release APK (for distribution)

### 7.1 · Create a signing key (one time only)

```bash
keytool -genkey -v \
  -keystore pccs-awb-release.keystore \
  -alias pccs-awb \
  -keyalg RSA -keysize 2048 -validity 10000
```

Move the keystore somewhere safe (NEVER commit it to git — the
`.gitignore` already excludes `*.keystore` and `*.jks`).

### 7.2 · Tell Gradle about the key

Create `android/key.properties`:

```properties
storeFile=/absolute/path/to/pccs-awb-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=pccs-awb
keyPassword=YOUR_KEY_PASSWORD
```

Then edit `android/app/build.gradle` (Capacitor leaves a
`signingConfigs` placeholder — uncomment and wire it to
`key.properties`).  The Capacitor docs walk through this:
<https://capacitorjs.com/docs/android/deploying-to-google-play>

### 7.3 · Assemble the release APK

```bash
npm run android:assemble:release
```

Output:

```
android/app/build/outputs/apk/release/app-release.apk
```

### 7.4 · Or build an `.aab` for Google Play

```bash
npm run android:bundle:release
```

Output:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` directly to the Google Play Console.

---

## 8 · Open the project in Android Studio

```bash
npm run cap:open:android
```

Use Android Studio for:

* visual layout / resource tweaks
* on-device debugging with the Profiler
* generating signed APKs through the GUI (Build → Generate Signed
  Bundle / APK)

---

## 9 · Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SDK location not found` | Set `ANDROID_HOME` and create `android/local.properties` with `sdk.dir=/path/to/sdk` |
| Build fails on `Java version` | Switch JDK to 17 (`export JAVA_HOME=...`) |
| White screen after splash | Run `npm run cap:sync` again — `dist/` was probably stale |
| Service worker doesn't activate inside the APK | This is normal behaviour — Capacitor uses `https://localhost`-like origins; offline cache works once first launch completes online. |
| `gradle wrapper not found` | Run `./gradlew wrapper` once inside `android/` |
| Old version still installs | Bump `versionCode` in `android/app/build.gradle` |

---

## 10 · What stays the same

* All existing PDF.js + pdf-lib calculator logic in `index.html` is
  **untouched**.
* PWA continues to work in any browser at `/index.html`.
* `python3 -m http.server 5000` (Replit dev workflow) continues to
  work for browser testing.
* Removing the `android/`, `dist/`, `node_modules/`, `package.json`,
  `capacitor.config.json`, and `scripts/` folders fully reverts the
  repo to a pure-PWA state.

---

## 11 · Versioning checklist

When you ship a new version:

1. Update the visible build stamp inside `index.html`
   (`#appBuild` text and the `.version` footer).
2. Bump `CACHE_NAME` in `sw.js` (e.g. `pccs-awb-v3.3.0`).
3. Bump `version` in `package.json`.
4. Bump `versionCode` and `versionName` in `android/app/build.gradle`.
5. `npm run android:assemble:release` (or `:bundle:release`).

That's it — the existing pattern from `replit.md` is preserved.
