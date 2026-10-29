# iOS crash repair — 29 October 2026

The artwork race identified in the build 16 crash reports has a code repair in this checkout. Relevant audio-session blocking paths, cancellation races, endless buffering, and playback diagnostics were also addressed. **Native compilation and physical-iPhone verification are still required.** This Windows session did not produce or submit an IPA.

**What changed**

- `plugins/ios-audio/MediaController.swift`: all Now Playing metadata and artwork state run on the main queue. Old player/item/image completions are ignored; outstanding remote artwork downloads are cancelled on replacement. A single cover is loaded once instead of on every playback tick. Failed artwork retries wait 30 seconds. Local artwork reads and image decoding run in the background. Remote command targets are removed using their actual registration tokens. Released-player callbacks cannot revive controls or clear a newer player's controls.
- `plugins/ios-audio/patches.cjs`: focused changes to expo-audio's `AudioPlayer.swift` and `AudioModule.swift`. Metadata writes are dispatched to the main queue. Audio mode/activation/deactivation work uses a dedicated serial queue, avoiding the main thread and Expo's shared async queue. Interruption bookkeeping stays on the main queue; delayed interruption recovery is guarded against a later interruption.
- `lib/player/engine.ts`: iOS players opt into `keepAudioSessionActive` and explicitly await asynchronous session activation before calling native play. The native patch skips the redundant synchronous activation for this opt-in path. Pause, source replacement, reset, and subsequent play requests invalidate earlier completions. Setup and activation waits time out after 15 seconds per operation. Reset state is cleared before awaiting native cleanup, so old cleanup cannot erase a newer source.
- Recovery permits five automatic reloads with backoff, then shows the existing retryable error instead of buffering forever. Transient recovery still works, and healthy playback restores the retry budget.
- `PlayerProvider.tsx` ignores superseded startup results/errors. Scoped-preview resume errors are caught. Mode/detail screens ignore late player navigation after another tap or leaving the screen.
- `lib/observability.ts` records audio breadcrumbs and failure/session-error events in Sentry without recording audio URLs or titles. Native crash handling and iOS app-hang tracking are explicitly enabled. Delivery still depends on the production DSN, native integration, and release configuration.

The session change intentionally keeps the iOS audio session active during an ordinary pause/source swap; full player stop/reset releases it. Check expected interactions with other audio apps and headphones during device validation.

This is a project-specific SDK 54 backport, informed by [Expo's artwork repair](https://github.com/expo/expo/pull/44498) and the [audio-session blocking report](https://github.com/expo/expo/issues/48531). It is not a wholesale copy of a newer Expo SDK. The app always supplies Now Playing metadata; the replacement controller uses that supplied metadata rather than synchronously inspecting embedded media tags.

**Persistence and version checks**

`expo-audio` is pinned to `1.1.1` in both package files. The patch runs in npm `postinstall` and as the `with-expo-audio-ios-fixes` iOS config plugin. The installed native files in this workspace have already been patched.

The installer verifies complete source hashes, checks each replacement, validates all inputs before writing, and supports repeat runs. An unknown dependency version, partial modification, or source drift causes a clear failure rather than silently shipping an incomplete fix. Review/remove this backport as part of a future compatible SDK upgrade. Do not edit patched `node_modules` files manually.

The implementation depends on **both** the TypeScript engine changes and the native patch. Send/commit the complete changes, including the new plugin directory and postinstall script; copying only `engine.ts` is insufficient. Existing staged work was preserved and no commits were created in this session.

**Checks completed**

- Full Node suite: **170 passed, 0 failed**.
- TypeScript: `tsc --noEmit` passed.
- ESLint on changed TypeScript/JavaScript/test files passed.
- Native patch application, idempotence, original-source round-trip, CRLF handling, and unknown-source rejection passed.
- Regression cases cover delayed activation followed by pause/source replacement, activation timeout and late response, setup completing after reset, old cleanup completing after a new load, bounded buffering recovery, and overlapping provider requests/errors.
- The existing dev-button test incorrectly required a literal `true` although the release flag is already `false`. Its assertion now accepts either boolean literal, as the test description requires. No dev flag was changed.

The tests use mocked native players and source-contract checks. They do **not** compile Swift, prove race freedom on an iPhone, validate the client's particular Yellowstone freeze, or confirm Sentry event delivery.

**Build steps for the Mac/EAS developer**

Run from the `Haven` project directory after bringing over all changes:

```sh
npm ci
node plugins/with-expo-audio-ios-fixes.js
npm test
npm run build
```

`npm ci` installs dependencies and runs the patch via postinstall. The explicit patch command is a safe repeat check. The success message should mention Passage iOS audio fixes for expo-audio 1.1.1.

For a new physical-device/store build, use the existing **production** EAS profile. The project's **preview** profile explicitly targets an iOS simulator and is unsuitable for this client's TestFlight validation. Rebuild native code; restarting Metro, Expo Go, or a JavaScript-only update cannot install these Swift changes. Expo describes dependency installation and native compilation in its [iOS build process](https://docs.expo.dev/build-reference/ios-builds/).

On a Mac, the project's standard local native route can also be used to diagnose on a connected phone:

```sh
npx expo run:ios --device
```

If an existing Xcode workspace is used, run the dependency install/patch before rebuilding and ensure Xcode recompiles the affected ExpoAudio sources. Keep the new archive and dSYMs. Validate the Release/TestFlight configuration as well as Debug; record the new build number and source revision. Do not use build 16 to judge whether the patch worked.

**Required device checks before submission**

1. On the client's iPhone 15 (or a comparable real iPhone), browse Sleep sounds sequentially and rapidly for 30–60 minutes, including French Watermill and Yellowstone Steam Vent.
2. Repeat with first-use and already-cached cover images, slow/offline network, rapid play/pause/stop, seeking, and switching sounds while loading. Confirm a timeout/failure remains recoverable and an old request cannot start a different sound.
3. Check lock screen/Control Center artwork, title, elapsed time, pause/resume/seek controls, and old artwork downloads completing after a new sound starts.
4. Test lock/unlock, background/foreground, Bluetooth/headphone removal, phone-call interruption, and another app taking audio focus. Use native thread diagnostics where supported.
5. Verify the actual release DSN and uploaded debug symbols/source maps. Send a controlled test event from a development build and verify it arrives; reproduce a controlled native crash only in a disposable diagnostic build. Sentry app-hang tracking alone is not a guarantee of detecting every JS-thread freeze.
6. If any freeze remains, capture both main and JS thread stacks while it is frozen. Obtain the other four original crash reports to check whether they represent an additional signature.

No backend deployment is needed for the diagnosed native artwork race. No production deployment, TestFlight submission, SDK upgrade, or unrelated UI-layout change was performed here.
