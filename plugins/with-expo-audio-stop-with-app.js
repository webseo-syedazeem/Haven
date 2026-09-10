const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const EXPO_AUDIO_PLAYBACK_SERVICE = 'expo.modules.audio.service.AudioControlsService';

/**
 * expo-audio@1.1.1 has no killed-playback config option. Declare its existing
 * playback service in the app manifest so Android stops that foreground service
 * when the user removes the app task from Recents.
 */
module.exports = function withExpoAudioStopWithApp(config) {
  return withAndroidManifest(config, (manifestConfig) => {
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
};
