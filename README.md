# The Wheel

## 🚀 How to get the wheel turnin'

> `npm install`  
> `cd ios && RCT_NEW_ARCH_ENABLED=1 pod install && cd ..`  
> `npx expo run:ios` or `npx expo run:android`  
> `npm start`  

> config changes require `npx expo prebuild` to update native directories

> `patches/` is applied on install by `patch-package`. It includes a native iOS change, so
> after an install run `npx expo run:ios` rather than just `npm start` — a JS reload alone
> won't pick it up.

### Staying current on SDK 57

`package.json` tracks patch releases (`~57.0.x`), so the intent is to run the latest 57.
`npm install` on its own will *not* move you: with a lockfile present it installs what the
lock already pins. To actually pick up new patch releases:

> `npx expo install --fix` — bumps every `expo-*` package to the version the installed SDK
> expects, and updates `package.json` + the lockfile  
> `npm update` — moves everything else to the newest release inside its existing range  
> `cd ios && RCT_NEW_ARCH_ENABLED=1 pod update --no-repo-update && cd ..` — resyncs
> `Podfile.lock`. It must be `pod update`, not `pod install`: every pod here is path-based,
> pointing into `node_modules`, and `pod install` refuses to re-resolve a local podspec whose
> version moved — it fails with *"could not find compatible versions ... you've changed the
> version of the dependency"*. After the update, plain `pod install` is a clean no-op again.  
> `npx expo-doctor` — checks the result (note: `npx expo doctor` is not supported; it's a
> separate `expo-doctor` package)

Commit `package.json`, `package-lock.json` and `ios/Podfile.lock` together — they describe
one dependency state and are misleading apart.

`npx expo install --fix` may also add config plugins to `app.json` for packages that are
installed but unregistered. Read that diff before keeping it: this project has checked-in
`ios/` and `android/` folders, so an unconfigured native config plugin changes what the next
`expo prebuild` generates.

### CocoaPods

Pods are invoked directly — there is no `Gemfile`, so `bundle exec pod install` fails with
"Could not locate Gemfile". Use plain `pod install` as above.

### Known `expo-doctor` warnings

Two checks fail by design; neither is a regression.

- **App config fields not synced in a non-CNG project.** `ios/` and `android/` are checked in
  *and* `app.json` carries native config, so `orientation`, `ios`, `android`, `icon`,
  `plugins` and `userInterfaceStyle` only reach the native projects via `expo prebuild`.
- **`react-native-track-player` unsupported on New Architecture.** React Native Directory
  metadata says so, but this app runs New Arch and the library works here — that is what
  `patches/react-native-track-player+4.1.2.patch` is for, including a bridgeless fix on
  Android and an `invalidate()` fix on iOS.
