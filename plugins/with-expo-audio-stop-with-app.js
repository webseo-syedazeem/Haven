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
      const sourcePath = path.join(modConfig.modRequest.projectRoot, EXPO_AUDIO_SERVICE_SOURCE);
      const source = await fs.readFile(sourcePath, 'utf8');
      const patched = patchAudioControlsServiceSource(source);
      if (patched !== source) await fs.writeFile(sourcePath, patched, 'utf8');
      return modConfig;
    },
  ]);
}

module.exports = withExpoAudioStopWithApp;
module.exports.patchAudioControlsServiceSource = patchAudioControlsServiceSource;
