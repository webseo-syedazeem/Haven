// Haven - HealthConnect Integration
import { useCallback, useEffect, useState } from 'react';
import { File as FSFile } from 'expo-file-system';
import * as Print from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';
import AppleHealthKit, { type HealthKitPermissions } from 'react-native-health';
import {
  initialize,
  readRecords,
  requestPermission,
  getGrantedPermissions,
  getSdkStatus,
  revokeAllPermissions,
  openHealthConnectSettings,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';

import { apiClient } from '@/lib/api/client';
import { getAccessToken } from '@/lib/haven-api';
import { supabase } from '@/lib/supabase';

export type HealthProvider = 'apple' | 'google';

type HealthConnection = {
  id: string;
  user_id: string;
  provider: HealthProvider;
  is_connected: boolean;
  permissions: Record<string, unknown> | null;
};

type StatusResponse = {
  success: boolean;
  data: {
    connections: HealthConnection[];
  };
};

type SaveResponse = {
  success: boolean;
  data: {
    connection: HealthConnection;
  };
};

const APPLE_PERMISSION_NAMES = [
  'Steps',
  'DistanceWalkingRunning',
  'ActiveEnergyBurned',
  'SleepAnalysis',
  'HeartRate',
  'RestingHeartRate',
  'HeartRateVariability',
  'RespiratoryRate',
] as const;

const REQUIRED_GOOGLE_RECORDS = [
  'Steps',
  'Distance',
  'ActiveCaloriesBurned',
  'SleepSession',
  'HeartRate',
  'RestingHeartRate',
  'HeartRateVariabilityRmssd',
  'RespiratoryRate',
] as const;

const sevenDayRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};


const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const parsePermissions = (permissions: unknown): Record<string, unknown> => {
  if (!permissions) return {};

  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (typeof permissions === 'object') {
    return permissions as Record<string, unknown>;
  }

  return {};
};

const asStringArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const PROVIDER_LABELS: Record<HealthProvider, string> = {
  apple: 'Apple Health',
  google: 'Google Fit / Health Connect',
};

const buildExportHtml = (userId: string, connections: HealthConnection[]) => {
  const exportedAt = new Date().toLocaleString();

  const sections = connections.length
    ? connections
        .map((connection) => {
          const permissions = parsePermissions(connection.permissions);
          const requested = asStringArray(permissions.requested);
          const granted = asStringArray(permissions.granted);
          const lastRead = asRecord(permissions.last_read);

          const requestedRows = requested.length
            ? requested.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('')
            : '<span class="muted">None</span>';

          const grantedRows = granted.length
            ? granted.map((item) => `<span class="chip chip-green">${escapeHtml(item)}</span>`).join('')
            : '<span class="muted">Not provided</span>';

          const dataRows = Object.keys(lastRead).length
            ? Object.entries(lastRead)
                .map(
                  ([key, value]) =>
                    `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`
                )
                .join('')
            : '<tr><td colspan="2" class="muted">No readings available</td></tr>';

          return `
            <div class="card">
              <div class="card-head">
                <h2>${escapeHtml(PROVIDER_LABELS[connection.provider])}</h2>
                <span class="status ${connection.is_connected ? 'on' : 'off'}">
                  ${connection.is_connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              ${
                permissions.connected_at
                  ? `<p class="meta">Connected at: ${escapeHtml(
                      new Date(String(permissions.connected_at)).toLocaleString()
                    )}</p>`
                  : ''
              }
              <h3>Requested permissions</h3>
              <div class="chips">${requestedRows}</div>
              <h3>Granted permissions</h3>
              <div class="chips">${grantedRows}</div>
              <h3>Latest readings (last 7 days)</h3>
              <table>${dataRows}</table>
            </div>`;
        })
        .join('')
    : '<p class="muted">No connected health providers.</p>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @page { margin: 32px; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #173F5F; margin: 0; }
        .header { border-bottom: 3px solid #7B61FF; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { margin: 0 0 4px; font-size: 26px; }
        .header p { margin: 2px 0; color: #5F6F7A; font-size: 12px; }
        .card { border: 1px solid #E5E9F0; border-radius: 14px; padding: 18px; margin-bottom: 18px; }
        .card-head { display: flex; justify-content: space-between; align-items: center; }
        .card-head h2 { margin: 0; font-size: 18px; }
        .status { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
        .status.on { background: #EAF8F0; color: #2E8F57; }
        .status.off { background: #F1F1F1; color: #8C8C8C; }
        .meta { color: #5F6F7A; font-size: 12px; margin: 8px 0 0; }
        h3 { font-size: 13px; margin: 16px 0 8px; color: #173F5F; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { background: #EEF1FF; color: #4B4DED; font-size: 11px; padding: 4px 9px; border-radius: 8px; }
        .chip-green { background: #EAF8F0; color: #2E8F57; }
        .muted { color: #9AA6B0; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        td { border-bottom: 1px solid #EEF1F4; padding: 6px 4px; font-size: 12px; }
        td:last-child { text-align: right; color: #5F6F7A; }
        .footer { margin-top: 24px; color: #9AA6B0; font-size: 11px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Halcyon - Your Health Data</h1>
        <p>Exported: ${escapeHtml(exportedAt)}</p>
        <p>User ID: ${escapeHtml(userId)}</p>
      </div>
      ${sections}
      <p class="footer">Your data is used only to personalise your Halcyon experience. You can disconnect anytime.</p>
    </body>
    </html>`;
};
const showHealthError = (message: string) => {
  Alert.alert('Health connect', message);
};

function extractUserIdFromJwt(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    const id = payload.sub ?? payload.user_id ?? payload.id;
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

export function useHealthConnect() {
  const [appleConnected, setAppleConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const getCurrentUserId = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) return data.user.id;

    // Supabase has no session — try decoding the custom backend JWT
    const token = getAccessToken();
    if (token) {
      const id = extractUserIdFromJwt(token);
      if (id) return id;
    }

    throw new Error('Please sign in again to connect health data.');
  }, []);

  const saveConnection = useCallback(
    async (provider: HealthProvider, permissions: Record<string, unknown>) => {
      const response = await apiClient<SaveResponse>('/api/health-connect/save', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          is_connected: true,
          permissions,
        }),
      });

      if (response.data.connection.provider === 'apple') {
        setAppleConnected(response.data.connection.is_connected);
      } else {
        setGoogleConnected(response.data.connection.is_connected);
      }
    },
    []
  );

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const userId = await getCurrentUserId();
      const response = await apiClient<StatusResponse>(`/api/health-connect/status/${userId}`);
      const connections = response.data.connections ?? [];

      setAppleConnected(
        connections.some((connection) => connection.provider === 'apple' && connection.is_connected)
      );
      setGoogleConnected(
        connections.some((connection) => connection.provider === 'google' && connection.is_connected)
      );
    } catch (error) {
      console.warn('Fetch health connection status failed:', error);
    } finally {
      setStatusLoading(false);
    }
  }, [getCurrentUserId]);

  const connectAppleHealth = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      showHealthError('Apple Health is available on iOS devices only.');
      return false;
    }

    setLoading(true);

    try {
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
            AppleHealthKit.Constants.Permissions.HeartRateVariability,
            AppleHealthKit.Constants.Permissions.RespiratoryRate,
          ],
          write: [],
        },
      };

      // Apple does not expose read-grant status. If init succeeds, we can query HealthKit.
      await new Promise<void>((resolve, reject) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            reject(new Error(error));
            return;
          }
          resolve();
        });
      });

      const range = sevenDayRange();
      const lastRead: Record<string, unknown> = {};

      await Promise.allSettled([
        new Promise<void>((resolve) => {
          AppleHealthKit.getStepCount(range, (error, result) => {
            if (!error) lastRead.steps = result?.value ?? 0;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getDistanceWalkingRunning(range, (error, result) => {
            if (!error) lastRead.distance_meters = result?.value ?? 0;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getActiveEnergyBurned(range, (error, result) => {
            if (!error) lastRead.active_energy_samples = Array.isArray(result) ? result.length : 0;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getSleepSamples(range, (error, result) => {
            if (!error) lastRead.sleep_samples_count = result?.length ?? 0;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getHeartRateSamples(range, (error, result) => {
            if (!error) lastRead.heart_rate_samples_count = result?.length ?? 0;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getRestingHeartRate(range, (error, result) => {
            if (!error) lastRead.resting_heart_rate = result?.value ?? null;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getHeartRateVariabilitySamples(range, (error, result) => {
            if (!error) lastRead.hrv_samples_count = result?.length ?? 0;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          AppleHealthKit.getRespiratoryRateSamples(range, (error, result) => {
            if (!error) lastRead.respiratory_rate_samples_count = result?.length ?? 0;
            resolve();
          });
        }),
      ]);

      await saveConnection('apple', {
        requested: [...APPLE_PERMISSION_NAMES],
        last_read: lastRead,
        connected_at: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple Health connection failed.';
      showHealthError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [saveConnection]);

  const connectGoogleFit = useCallback(async () => {
    if (Platform.OS !== 'android') {
      showHealthError('Google Health Connect is available on Android devices only.');
      return false;
    }

    setLoading(true);

    try {
      const sdkStatus = await getSdkStatus();

      if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        Alert.alert(
          'Health Connect not installed',
          'Health Connect is required to access your health data. Would you like to install it from the Play Store?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Install',
              onPress: () =>
                Linking.openURL('market://details?id=com.google.android.apps.healthdata'),
            },
          ]
        );
        return false;
      }

      if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        showHealthError('Health Connect needs to be updated from the Play Store.');
        return false;
      }

      const isInitialized = await initialize();
      if (!isInitialized) {
        throw new Error('Health Connect could not be initialized.');
      }

      const permissions: Permission[] = REQUIRED_GOOGLE_RECORDS.map((recordType) => ({
        accessType: 'read' as const,
        recordType,
      }));
      await requestPermission(permissions);

      const granted = await getGrantedPermissions();
      const grantedReadTypes = granted
        .filter((permission) => permission.accessType === 'read')
        .map((permission) => permission.recordType);

      const hasAnyRequired = REQUIRED_GOOGLE_RECORDS.some((type) =>
        grantedReadTypes.includes(type)
      );

      if (!hasAnyRequired) {
        showHealthError('No permissions were allowed, so Health Connect was not connected.');
        return false;
      }

      const range = sevenDayRange();
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: range.startDate,
        endTime: range.endDate,
      };
      const lastRead: Record<string, unknown> = {};
      const readers: Promise<void>[] = [];

      if (grantedReadTypes.includes('Steps')) {
        readers.push(
          readRecords('Steps', { timeRangeFilter }).then((result) => {
            lastRead.steps_total = result.records.reduce(
              (total, record) => total + (Number(record.count) || 0),
              0
            );
          })
        );
      }

      if (grantedReadTypes.includes('Distance')) {
        readers.push(
          readRecords('Distance', { timeRangeFilter }).then((result) => {
            lastRead.distance_meters = result.records.reduce(
              (total, record) => total + (Number(record.distance?.inMeters) || 0),
              0
            );
          })
        );
      }

      if (grantedReadTypes.includes('ActiveCaloriesBurned')) {
        readers.push(
          readRecords('ActiveCaloriesBurned', { timeRangeFilter }).then((result) => {
            lastRead.active_kcal = result.records.reduce(
              (total, record) => total + (Number(record.energy?.inKilocalories) || 0),
              0
            );
          })
        );
      }

      if (grantedReadTypes.includes('SleepSession')) {
        readers.push(
          readRecords('SleepSession', { timeRangeFilter }).then((result) => {
            lastRead.sleep_sessions_count = result.records.length;
          })
        );
      }

      if (grantedReadTypes.includes('HeartRate')) {
        readers.push(
          readRecords('HeartRate', { timeRangeFilter }).then((result) => {
            lastRead.heart_rate_records_count = result.records.length;
          })
        );
      }

      if (grantedReadTypes.includes('RestingHeartRate')) {
        readers.push(
          readRecords('RestingHeartRate', { timeRangeFilter }).then((result) => {
            lastRead.resting_hr_records_count = result.records.length;
          })
        );
      }

      if (grantedReadTypes.includes('HeartRateVariabilityRmssd')) {
        readers.push(
          readRecords('HeartRateVariabilityRmssd', { timeRangeFilter }).then((result) => {
            lastRead.hrv_records_count = result.records.length;
          })
        );
      }

      if (grantedReadTypes.includes('RespiratoryRate')) {
        readers.push(
          readRecords('RespiratoryRate', { timeRangeFilter }).then((result) => {
            lastRead.respiratory_rate_records_count = result.records.length;
          })
        );
      }

      await Promise.allSettled(readers);

      await saveConnection('google', {
        requested: [...REQUIRED_GOOGLE_RECORDS],
        granted: grantedReadTypes,
        last_read: lastRead,
        connected_at: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Health Connect connection failed.';
      showHealthError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [saveConnection]);

  const disconnectProvider = useCallback(async (provider: HealthProvider) => {
    setLoading(true);

    try {
      await apiClient('/api/health-connect/disconnect', {
        method: 'DELETE',
        body: JSON.stringify({ provider }),
      });

      if (provider === 'google' && Platform.OS === 'android') {
        await revokeAllPermissions().catch(() => undefined);
      }

      if (provider === 'apple') {
        setAppleConnected(false);
      } else {
        setGoogleConnected(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to disconnect health provider.';
      showHealthError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openHealthSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await openHealthConnectSettings();
        return;
      }

      const url = 'x-apple-health://';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openSettings();
      }
    } catch {
      showHealthError('Settings could not be opened.');
    }
  }, []);

  const exportData = useCallback(async () => {
    setLoading(true);

    try {
      const userId = await getCurrentUserId();
      const response = await apiClient<StatusResponse>(`/api/health-connect/status/${userId}`);
      const connections = response.data.connections ?? [];

      const html = buildExportHtml(userId, connections);
      const { uri: tempUri } = await Print.printToFileAsync({ html });

      const date = new Date().toISOString().split('T')[0];
      const fileName = `Halcyon_Health_Data_${date}.pdf`;
      const parentDir = tempUri.substring(0, tempUri.lastIndexOf('/') + 1);
      const existing = new FSFile(parentDir + fileName);
      if (existing.exists) {
        existing.delete();
      }
      const tempFile = new FSFile(tempUri);
      tempFile.rename(fileName);

      if (await isAvailableAsync()) {
        await shareAsync(tempFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Halcyon health data',
          UTI: 'com.adobe.pdf',
        });
      } else {
        showHealthError('Sharing is not available on this device.');
      }

      try { tempFile.delete(); } catch { /* ignore cleanup errors */ }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Data export failed.';
      showHealthError(message);
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId]);

  
  const deleteAllData = useCallback(async () => {
    setLoading(true);

    try {
      await apiClient('/api/health-connect/delete-all', { method: 'DELETE' });

      if (Platform.OS === 'android') {
        await revokeAllPermissions().catch(() => undefined);
      }

      setAppleConnected(false);
      setGoogleConnected(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete data.';
      showHealthError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return {
    appleConnected,
    googleConnected,
    loading,
    statusLoading,
    connectAppleHealth,
    connectGoogleFit,
    disconnectProvider,
    openHealthSettings,
    exportData,
    deleteAllData,
    fetchStatus,
  };
}
