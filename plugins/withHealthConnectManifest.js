const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const RATIONALE_ACTION = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';

module.exports = function withHealthConnectManifest(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const activity = (app.activity || []).find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

    if (!activity) return config;

    activity['intent-filter'] = activity['intent-filter'] || [];
    const hasRationale = activity['intent-filter'].some((filter) =>
      (filter.action || []).some(
        (action) => action.$['android:name'] === RATIONALE_ACTION
      )
    );

    if (!hasRationale) {
      activity['intent-filter'].push({
        action: [{ $: { 'android:name': RATIONALE_ACTION } }],
      });
    }

    app['activity-alias'] = app['activity-alias'] || [];
    const aliasName = 'ViewPermissionUsageActivity';
    const hasAlias = app['activity-alias'].some(
      (alias) => alias.$['android:name'] === aliasName
    );

    if (!hasAlias) {
      app['activity-alias'].push({
        $: {
          'android:name': aliasName,
          'android:exported': 'true',
          'android:targetActivity': '.MainActivity',
          'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE',
                },
              },
            ],
            category: [
              {
                $: {
                  'android:name':
                    'android.intent.category.HEALTH_PERMISSIONS',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
};
