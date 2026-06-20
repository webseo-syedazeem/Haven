// Haven - HealthConnect Integration
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AppleHealthKit, { type HealthKitPermissions } from 'react-native-health';
import {
  initialize,
  readRecords,
  requestPermission,
  revokeAllPermissions,
  type Permission,
} from 'react-native-health-connect';

import { apiClient } from '@/lib/api/client';
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
  'SleepAnalysis',
  'HeartRateVariability',
  'RestingHeartRate',
] as const;

const GOOGLE_PERMISSION_NAMES = ['Steps', 'SleepSession', 'HeartRate'] as const;

const sevenDayRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const showHealthError = (message: string) => {
  Alert.alert('Health connect', message);
};

export function useHealthConnect() {
  const [appleConnected, setAppleConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCurrentUserId = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.id) {
      throw new Error('Please sign in again to connect health data.');
    }

    return data.user.id;
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
    }
  }, [getCurrentUserId]);

  const connectAppleHealth = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      showHealthError('Apple Health is available on iOS devices only.');
      return;
    }

    setLoading(true);

    try {
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.HeartRateVariability,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
          ],
          write: [],
        },
      };

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
          AppleHealthKit.getSleepSamples(range, (error, result) => {
            if (!error) lastRead.sleep_samples_count = result?.length ?? 0;
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
          AppleHealthKit.getRestingHeartRate(range, (error, result) => {
            if (!error) lastRead.resting_heart_rate = result?.value ?? null;
            resolve();
          });
        }),
      ]);

      await saveConnection('apple', {
        requested: [...APPLE_PERMISSION_NAMES],
        last_read: lastRead,
        connected_at: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple Health connection failed.';
      showHealthError(message);
    } finally {
      setLoading(false);
    }
  }, [saveConnection]);

  const connectGoogleFit = useCallback(async () => {
    if (Platform.OS !== 'android') {
      showHealthError('Google Health Connect is available on Android devices only.');
      return;
    }

    setLoading(true);

    try {
      const isInitialized = await initialize();

      if (!isInitialized) {
        throw new Error('Health Connect is not available on this device.');
      }

      const permissions: Permission[] = [
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'HeartRate' },
      ];
      const grantedPermissions = await requestPermission(permissions);
      const range = sevenDayRange();
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: range.startDate,
        endTime: range.endDate,
      };
      const lastRead: Record<string, unknown> = {};

      await Promise.allSettled([
        readRecords('Steps', { timeRangeFilter }).then((result) => {
          lastRead.steps_records_count = result.records.length;
          lastRead.steps_total = result.records.reduce(
            (total, record) => total + (Number(record.count) || 0),
            0
          );
        }),
        readRecords('SleepSession', { timeRangeFilter }).then((result) => {
          lastRead.sleep_sessions_count = result.records.length;
        }),
        readRecords('HeartRate', { timeRangeFilter }).then((result) => {
          lastRead.heart_rate_records_count = result.records.length;
        }),
      ]);

      await saveConnection('google', {
        requested: [...GOOGLE_PERMISSION_NAMES],
        granted: grantedPermissions,
        last_read: lastRead,
        connected_at: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Health Connect connection failed.';
      showHealthError(message);
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

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return {
    appleConnected,
    googleConnected,
    loading,
    connectAppleHealth,
    connectGoogleFit,
    disconnectProvider,
    fetchStatus,
  };
}
