const fs = require('node:fs/promises');
const path = require('node:path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const EXPO_AUDIO_PLAYBACK_SERVICE = 'expo.modules.audio.service.AudioControlsService';
const EXPO_AUDIO_SERVICE_SOURCE = path.join(
  'node_modules',
  'expo-audio',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'audio',
  'service',
  'AudioControlsService.kt'
);
const TASK_REMOVAL_PATCH_MARKER =
  'Passage: stop playback and clear the media notification when the app task is removed.';

const EXPO_AUDIO_PLAYER_SOURCE = path.join(
  'node_modules',
  'expo-audio',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'audio',
  'AudioPlayer.kt'
);
const BECOMING_NOISY_PATCH_MARKER =
  'Passage: pause on headset/Bluetooth disconnect and keep the radio awake while playing.';
const AUDIO_FOCUS_PATCH_MARKER =
  'Passage: take audio focus so playback pauses when another app plays (YouTube, calls, etc.).';

function patchAudioControlsServiceSource(source) {
  if (source.includes(TASK_REMOVAL_PATCH_MARKER)) return source;

  // Anchor on onDestroy. onTaskRemoved is inserted just before it: that is the
  // reliable hook, fired while the app process is still alive when the user
  // swipes the app away. onDestroy keeps a fallback teardown for any other path
  // that stops the service directly.
  const anchor = /(  override fun onDestroy\(\) \{\r?\n    super\.onDestroy\(\)\r?\n)/;
  if (!anchor.test(source)) {
    throw new Error(
      'Could not patch expo-audio AudioControlsService; its native source has changed.'
    );
  }

  const onTaskRemoved =
    `  // ${TASK_REMOVAL_PATCH_MARKER}\n` +
    '  // media3 keeps its MediaSessionService alive after a Recents swipe while the\n' +
    "  // player is still playing, which strands Passage's media card in the status\n" +
    '  // bar / Quick Settings. Tear it all down here, while the process is still\n' +
    '  // alive, so the notification and the system media controls are removed.\n' +
    '  override fun onTaskRemoved(rootIntent: Intent?) {\n' +
    '    currentPlayer?.ref?.pause()\n' +
    '    hideNotification()\n' +
    '    clearSessionInternal()\n' +
    '    stopSelf()\n' +
    '  }\n\n';

  const onDestroyCleanup =
    '    // Fallback for a direct service stop: pause before releasing the media\n' +
    '    // session so System UI cannot retain playback or its media card.\n' +
    '    currentPlayer?.ref?.pause()\n' +
    '    hideNotification()\n' +
    '    clearSessionInternal()\n';

  return source.replace(anchor, `${onTaskRemoved}$1${onDestroyCleanup}`);
}

/**
 * ExoPlayer, unlike iOS AVPlayer, does not pause when the audio output route
 * disappears unless "becoming noisy" handling is enabled, and it will not hold
 * a wake lock while streaming with the screen off unless a wake mode is set.
 * expo-audio@1.1.1 builds the player without either, so a sleep/relaxation app
 * would keep playing through the phone speaker when earbuds are removed at
 * night (audit H-5) and could stall during long screen-off sessions (P-3).
 * Add both to the ExoPlayer.Builder.
 */
function patchAudioPlayerSource(source) {
  let next = source;

  // Audio focus. expo-audio builds ExoPlayer with `setAudioAttributes(DEFAULT,
  // false)`: the `false` tells ExoPlayer NOT to manage audio focus, so a
  // soundscape plays straight over whatever else the phone is doing. Giving it
  // real media attributes and `handleAudioFocus = true` makes ExoPlayer request
  // focus on play and honour its loss — it pauses when another app takes over
  // the audio output (YouTube, Instagram, a phone call) and resumes after a
  // brief, transient interruption. That is the Spotify-style behaviour listeners
  // expect. (iOS already does this through the `doNotMix` interruption handler.)
  if (!next.includes(AUDIO_FOCUS_PATCH_MARKER)) {
    const defaultAttributes = '.setAudioAttributes(AudioAttributes.DEFAULT, false)';
    if (!next.includes(defaultAttributes)) {
      throw new Error(
        'Could not patch expo-audio AudioPlayer audio focus; its native source has changed.'
      );
    }
    next = next.replace(
      defaultAttributes,
      `// ${AUDIO_FOCUS_PATCH_MARKER}\n` +
        '    .setAudioAttributes(\n' +
        '      AudioAttributes.Builder()\n' +
        '        .setUsage(C.USAGE_MEDIA)\n' +
        '        .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)\n' +
        '        .build(),\n' +
        '      true\n' +
        '    )'
    );
  }

  // Becoming-noisy + wake mode (audit H-5 / P-3).
  if (!next.includes(BECOMING_NOISY_PATCH_MARKER)) {
    const builderTail =
      /(\.setSeekBackIncrementMs\(SEEK_JUMP_INTERVAL_MS\)\r?\n)([ \t]*)\.build\(\),/;
    if (!builderTail.test(next)) {
      throw new Error(
        'Could not patch expo-audio AudioPlayer ExoPlayer.Builder; its native source has changed.'
      );
    }
    next = next.replace(
      builderTail,
      `$1$2// ${BECOMING_NOISY_PATCH_MARKER}\n` +
        `$2.setHandleAudioBecomingNoisy(true)\n` +
        `$2.setWakeMode(C.WAKE_MODE_NETWORK)\n` +
        `$2.build(),`
    );
  }

  return next;
}

/**
 * expo-audio@1.1.1 has no killed-playback config option. Pin the playback
 * service's android:stopWithTask to false so it receives onTaskRemoved when the
 * user swipes the app away, where the native patch above fully stops playback
 * and removes the media notification (with onDestroy as a fallback).
 */
function withExpoAudioStopWithApp(config) {
  config = withAndroidManifest(config, (manifestConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      manifestConfig.modResults
    );

    application.service ??= [];
    let service = application.service.find(
      (entry) => entry.$?.['android:name'] === EXPO_AUDIO_PLAYBACK_SERVICE
    );

    if (!service) {
      service = { $: { 'android:name': EXPO_AUDIO_PLAYBACK_SERVICE } };
      application.service.push(service);
    }

    service.$ ??= {};
    // Must be false: Android only delivers onTaskRemoved (where Passage tears
    // down the media session + notification) when the service is NOT set to stop
    // with the task. With 'true' the system kills the service and skips it.
    service.$['android:stopWithTask'] = 'false';

    return manifestConfig;
  });

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const servicePath = path.join(modConfig.modRequest.projectRoot, EXPO_AUDIO_SERVICE_SOURCE);
      const serviceSource = await fs.readFile(servicePath, 'utf8');
      const patchedService = patchAudioControlsServiceSource(serviceSource);
      if (patchedService !== serviceSource) await fs.writeFile(servicePath, patchedService, 'utf8');

      const playerPath = path.join(modConfig.modRequest.projectRoot, EXPO_AUDIO_PLAYER_SOURCE);
      const playerSource = await fs.readFile(playerPath, 'utf8');
      const patchedPlayer = patchAudioPlayerSource(playerSource);
      if (patchedPlayer !== playerSource) await fs.writeFile(playerPath, patchedPlayer, 'utf8');

      return modConfig;
    },
  ]);
}

module.exports = withExpoAudioStopWithApp;
module.exports.patchAudioControlsServiceSource = patchAudioControlsServiceSource;
module.exports.patchAudioPlayerSource = patchAudioPlayerSource;
