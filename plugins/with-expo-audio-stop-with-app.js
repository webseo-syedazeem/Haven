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
const TASK_REMOVAL_PATCH_MARKER = 'Passage: clear playback when Android removes the app task.';

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

function patchAudioControlsServiceSource(source) {
  if (source.includes(TASK_REMOVAL_PATCH_MARKER)) return source;

  const onDestroyStart = /(  override fun onDestroy\(\) \{\r?\n)(    super\.onDestroy\(\)\r?\n)/;
  if (!onDestroyStart.test(source)) {
    throw new Error(
      'Could not patch expo-audio AudioControlsService.onDestroy; its native source has changed.'
    );
  }

  return source.replace(
    onDestroyStart,
    `$1    // ${TASK_REMOVAL_PATCH_MARKER}\n` +
      '    // Pause before releasing the media session so Samsung/Android System UI\n' +
      '    // cannot retain playback or its media card after a Recents swipe-close.\n' +
      '    currentPlayer?.ref?.pause()\n' +
      '    hideNotification()\n' +
      '    clearSessionInternal()\n' +
      '$2'
  );
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
  if (source.includes(BECOMING_NOISY_PATCH_MARKER)) return source;

  const builderTail =
    /(\.setSeekBackIncrementMs\(SEEK_JUMP_INTERVAL_MS\)\r?\n)([ \t]*)\.build\(\),/;
  if (!builderTail.test(source)) {
    throw new Error(
      'Could not patch expo-audio AudioPlayer ExoPlayer.Builder; its native source has changed.'
    );
  }

  return source.replace(
    builderTail,
    `$1$2// ${BECOMING_NOISY_PATCH_MARKER}\n` +
      `$2.setHandleAudioBecomingNoisy(true)\n` +
      `$2.setWakeMode(C.WAKE_MODE_NETWORK)\n` +
      `$2.build(),`
  );
}

/**
 * expo-audio@1.1.1 has no killed-playback config option. Declare its existing
 * playback service in the app manifest so Android stops that foreground service
 * when the user removes the app task from Recents.
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
    service.$['android:stopWithTask'] = 'true';

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
