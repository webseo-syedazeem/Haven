import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ConfirmActionModal } from '@/components/profile/ConfirmActionModal';
import { AppFonts } from '@/constants/theme';
import { useHealthConnect, type HealthProvider } from '@/hooks/useHealthConnect';

const backgroundImage = require('@/assets/images/4a78c0b5bcbe750563b0d0e3ecbe9951c1d0f0cc.png');

const CONNECTED_APPS = [
  {
    key: 'apple' as const,
    name: 'Apple health',
    icon: require('@/assets/icons/dashbord-heart-icon.svg'),
    iconBg: '#FF005914',
    iconColor: '#FF0059',
  },
  {
    key: 'google' as const,
    name: 'Google fit',
    icon: require('@/assets/icons/dashbord-flower-icon.svg'),
    iconBg: '#3770FC14',
    iconColor: '#3770FC',
  },
];

const PRIVACY_ACTIONS = [
  { key: 'permission', label: 'Manage permission' },
  { key: 'download', label: 'Download my data' },
  { key: 'delete', label: 'Delete my data' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedProvider, setSelectedProvider] = useState<HealthProvider | null>(null);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const {
    appleConnected,
    googleConnected,
    loading,
    connectAppleHealth,
    connectGoogleFit,
    disconnectProvider,
    openHealthSettings,
    exportData,
    deleteAllData,
  } = useHealthConnect();

  const isProviderConnected = (provider: HealthProvider) =>
    provider === 'apple' ? appleConnected : googleConnected;

  const selectedProviderApp = CONNECTED_APPS.find((app) => app.key === selectedProvider);

  const handleProviderPress = (provider: HealthProvider) => {
    const connected = isProviderConnected(provider);

    if (!connected) {
      if (provider === 'apple') {
        void connectAppleHealth();
      } else {
        void connectGoogleFit();
      }
      return;
    }

    setSelectedProvider(provider);
  };

  const closeProviderModal = () => setSelectedProvider(null);

  const handleManagePermissions = () => {
    closeProviderModal();
    void openHealthSettings();
  };

  const handleDisconnectProvider = () => {
    if (!selectedProvider) {
      return;
    }

    const provider = selectedProvider;
    closeProviderModal();
    void disconnectProvider(provider);
  };

  const handlePrivacyAction = (key: string) => {
    if (key === 'permission') {
      void openHealthSettings();
      return;
    }

    if (key === 'download') {
      void exportData();
      return;
    }

    if (key === 'delete') {
      setShowDeleteDataModal(true);
    }
  };

  const handleConfirmDeleteData = () => {
    setShowDeleteDataModal(false);
    void deleteAllData();
  };

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color="#000000" />
          </Pressable>

          <Text style={styles.title}>Privacy</Text>
          <Text style={styles.subtitle}>Manage your connected data</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Connected data</Text>
            <View style={styles.connectedList}>
              {CONNECTED_APPS.map((app, index) => {
                const connected = isProviderConnected(app.key);

                return (
                  <Pressable
                    key={app.key}
                    disabled={loading}
                    onPress={() => handleProviderPress(app.key)}
                    style={({ pressed }) => [
                      styles.connectedRow,
                      index < CONNECTED_APPS.length - 1 && styles.rowDivider,
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.appIconCircle, { backgroundColor: app.iconBg }]}>
                      <Image
                        source={app.icon}
                        style={[styles.appIcon, { tintColor: app.iconColor }]}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.appText}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={[styles.appStatus, { color: connected ? '#2EB668' : '#8C8C8C' }]}>
                        {connected ? 'Connected' : 'Not Connected'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#8C8C8C" />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            <View style={styles.actionList}>
              {PRIVACY_ACTIONS.map((action, index) => {
                const isDestructive = action.key === 'delete';

                return (
                  <Pressable
                    key={action.key}
                    disabled={loading}
                    onPress={() => handlePrivacyAction(action.key)}
                    style={({ pressed }) => [
                      styles.actionRow,
                      index < PRIVACY_ACTIONS.length - 1 && styles.rowDivider,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.actionLabel, isDestructive && styles.destructiveLabel]}>
                      {action.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isDestructive ? '#E5484D' : '#8C8C8C'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>


        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7B61FF" />
          </View>
        )}

        <ConfirmActionModal
          confirmLabel="Delete"
          icon="trash-outline"
          loading={loading}
          message="This permanently deletes your connected health data from Haven. This cannot be undone."
          title="Delete my data?"
          visible={showDeleteDataModal}
          onCancel={() => setShowDeleteDataModal(false)}
          onConfirm={handleConfirmDeleteData}
        />

        <Modal
          animationType="fade"
          onRequestClose={closeProviderModal}
          transparent
          visible={Boolean(selectedProviderApp)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeProviderModal} />
            {selectedProviderApp && (
              <View style={styles.providerModal}>
                <Pressable
                  accessibilityLabel="Close provider options"
                  hitSlop={10}
                  onPress={closeProviderModal}
                  style={({ pressed }) => [styles.modalCloseButton, pressed && styles.pressed]}>
                  <Ionicons name="close" size={18} color="#173F5F" />
                </Pressable>

                <View
                  style={[
                    styles.modalIconWrap,
                    { backgroundColor: selectedProviderApp.iconBg },
                  ]}>
                  <Image
                    contentFit="contain"
                    source={selectedProviderApp.icon}
                    style={[styles.modalIcon, { tintColor: selectedProviderApp.iconColor }]}
                  />
                </View>

                <Text style={styles.modalTitle}>{selectedProviderApp.name}</Text>
                <View style={styles.connectedBadge}>
                  <Ionicons name="checkmark-circle" size={15} color="#2EB668" />
                  <Text style={styles.connectedBadgeText}>Connected to Haven</Text>
                </View>
                <Text style={styles.modalMessage}>
                  Your health data sync is active. You can update permissions or disconnect this
                  provider anytime.
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={handleManagePermissions}
                    style={({ pressed }) => [
                      styles.primaryModalButton,
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryModalButtonText}>Manage permissions</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleDisconnectProvider}
                    style={({ pressed }) => [
                      styles.disconnectModalButton,
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="link-outline" size={18} color="#E5484D" />
                    <Text style={styles.disconnectModalButtonText}>Disconnect</Text>
                  </Pressable>

                  <Pressable
                    onPress={closeProviderModal}
                    style={({ pressed }) => [styles.cancelModalButton, pressed && styles.pressed]}>
                    <Text style={styles.cancelModalButtonText}>Not now</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8BFEE' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 76 },

  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 15,
    width: 32,
    zIndex: 3,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },

  title: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8C8C8C',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  sectionTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },

  connectedList: { gap: 0 },
  connectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingVertical: 8,
  },
  appIconCircle: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  appIcon: { height: 24, width: 24 },
  appText: { flex: 1 },
  appName: {
    color: '#173F5F',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  appStatus: {
    color: '#2EB668',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  sectionDivider: {
    backgroundColor: 'rgba(23,63,95,0.08)',
    height: 1,
    marginVertical: 16,
  },

  actionList: { gap: 0 },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: 8,
  },
  actionLabel: {
    color: '#173F5F',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  destructiveLabel: { color: '#E5484D' },
  rowDivider: {
    borderBottomColor: 'rgba(23,63,95,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  consent: {
    color: '#414040',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(13, 30, 48, 0.58)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  providerModal: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    elevation: 14,
    paddingBottom: 22,
    paddingHorizontal: 22,
    paddingTop: 30,
    shadowColor: '#0D1E30',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    width: '100%',
  },
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: '#F1F6F8',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
  },
  modalIconWrap: {
    alignItems: 'center',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    marginBottom: 16,
    width: 68,
  },
  modalIcon: { height: 34, width: 34 },
  modalTitle: {
    color: '#173F5F',
    fontFamily: AppFonts.displayBold,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  connectedBadge: {
    alignItems: 'center',
    backgroundColor: '#EAF8F0',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  connectedBadgeText: {
    color: '#2E8F57',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  modalMessage: {
    color: '#5F6F7A',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
  modalActions: {
    gap: 10,
    marginTop: 24,
    width: '100%',
  },
  primaryModalButton: {
    alignItems: 'center',
    backgroundColor: '#173F5F',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
  },
  primaryModalButtonText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  disconnectModalButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    borderColor: '#FFD4D6',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
  },
  disconnectModalButtonText: {
    color: '#E5484D',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  cancelModalButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
  },
  cancelModalButtonText: {
    color: '#7A8A94',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
