# Development

How to get fitplan building and running on a phone. Written for a Linux machine;
the only genuinely machine-specific parts are the install paths in
`tools/env.sh`.

## What has to be installed

Nothing here needs root. Everything lives under your home directory, so it can
be removed by deleting a folder.

| Tool             | Version used      | Where it goes             |
| ---------------- | ----------------- | ------------------------- |
| Node             | 24 LTS            | `~/.local/opt/node`       |
| Java (Temurin)   | JDK 17            | `~/.local/opt/jdk17`      |
| Android SDK      | platform 35       | `~/Android/Sdk`           |

`tools/env.sh` points `PATH`, `JAVA_HOME` and `ANDROID_HOME` at those. Source it
in every shell you work in:

```bash
source tools/env.sh
```

To avoid typing that each time, add it to `~/.bashrc`:

```bash
echo 'source ~/Projects/fitplan/tools/env.sh' >> ~/.bashrc
```

### Installing from scratch

```bash
mkdir -p ~/.local/opt
curl -fsSL https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-x64.tar.xz \
  | tar -xJ -C ~/.local/opt && mv ~/.local/opt/node-v24.21.0-linux-x64 ~/.local/opt/node
```

```bash
mkdir -p ~/.local/opt/jdk17 && curl -fsSL "https://api.adoptium.net/v3/binary/version/jdk-17.0.20.1%2B1/linux/x64/jdk/hotspot/normal/eclipse" | tar -xz -C ~/.local/opt/jdk17 --strip-components=1
```

The Android SDK comes with Android Studio, or from the command-line tools alone.
It needs `platform-tools` (for `adb`), `platforms;android-35` and
`build-tools;35.0.0`.

## Everyday commands

```bash
npm install
```

```bash
npm run check
```

`check` runs, in order: format check, lint, type-check, tests. CI runs exactly
the same thing on every push, so if it passes here it passes there.

```bash
npm run engine test:watch
```

## Putting it on the phone

The app needs a **development build**, not Expo Go: Health Connect (stage 4) and
background audio (stage 5) both need native code Expo Go does not contain.

On the phone, once:

1. **Settings → About phone**, tap **Build number** seven times. It will say you
   are now a developer.
2. **Settings → System → Developer options**, turn on **USB debugging**.
3. Plug the phone into the computer with a cable that carries data (some charging
   cables do not).
4. The phone asks **Allow USB debugging?** — tick *Always allow from this
   computer* and accept.

Check the computer can see it:

```bash
adb devices -l
```

One line with your phone and the word `device` means it worked. `unauthorized`
means step 4 has not been accepted yet; `no permissions` means a udev rule is
missing on Linux.

Then build and install:

```bash
npm run mobile android
```

The first build takes several minutes because Gradle downloads its toolchain.
Later builds take well under a minute. The app installs itself and starts.

`tools/env.sh` sets `ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a`, so
development builds compile native code only for the phone's own architecture.
That is the difference between half a minute and ten minutes per build.

While it is running, `npm run mobile start` serves the JavaScript, so saving a
file reloads the app without rebuilding. You only need to build again when a
native dependency changes.

## The native project is generated, not committed

`apps/mobile/android/` is produced by `expo prebuild` from `app.json`, and is
in `.gitignore`. Never edit it by hand: the next prebuild overwrites it. Native
changes belong in `app.json` or an Expo config plugin.

```bash
npm run mobile prebuild
```

## Releases: an APK he can install without a cable

A debug build needs the computer. For a build KL can install from a file, we
need a *signed release APK*.

1. Make a signing key, once, and keep it somewhere safe. If it is lost, future
   versions cannot replace the installed app — they install as a separate app.

   ```bash
   keytool -genkey -v -keystore fitplan-release.keystore -alias fitplan -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Keep the keystore and its passwords **out of the repository**. `.gitignore`
   already excludes `*.keystore` and `local.properties`.

3. Build **with every architecture**, not just the development one:

   ```bash
   cd apps/mobile/android && ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64 ./gradlew assembleRelease
   ```

   The APK lands in `apps/mobile/android/app/build/outputs/apk/release/`.

4. Copy it to the phone and open it. Android asks permission to install from
   this source the first time.

**Quick variant for KL's own phone over USB** (no keystore yet): plain
`./gradlew assembleRelease` builds a release APK signed with the debug key,
arm64-only under `tools/env.sh`. It installs **in place of** the dev build
(same id, same signature), keeps all data, and runs without Metro — right for
"use it for a few days". It cannot be distributed; gap 39 still stands.

**Not decided yet:** whether releases are built on this machine by hand or by a
GitHub Actions job on a tag. Building in CI means the signing key has to live in
GitHub's secrets. For a personal app, building by hand is simpler and keeps the
key on one machine. Revisit when there is a second user.

## Known annoyances

- `npm audit` reports advisories (`braces`, `micromatch`, `node-forge`) inside
  Expo's and Metro's own build tooling. They affect the build machine, not the
  app, and the only "fix" npm offers is downgrading Expo by thirteen major
  versions. Left alone deliberately.
