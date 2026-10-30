import { Ionicons } from '@expo/vector-icons'
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { AppFonts } from '@/constants/theme'
import {
  isServiceUnavailable,
  setHealthCheckRequester,
  setServiceUnavailable,
  subscribeToServiceStatus,
} from '@/lib/service-status'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') || 'https://passagesounds.app'

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (response.status === 503) {
      setServiceUnavailable(true)
      return false
    }
    if (response.ok) setServiceUnavailable(false)
    return response.ok
  } catch {
    // Offline mode remains usable; only an explicit service 503 takes over the UI.
    return false
  }
}

export function ServiceAvailability({ children }: { children: ReactNode }) {
  const [unavailable, setUnavailable] = useState(isServiceUnavailable())
  const [retrying, setRetrying] = useState(false)

  useEffect(() => subscribeToServiceStatus(setUnavailable), [])
  useEffect(() => {
    void checkHealth()
  }, [])
  // A 503 from any endpoint routes here (via the global bridge) to confirm the
  // outage against `/health`, rather than each endpoint flipping the takeover
  // itself (audit H-4).
  useEffect(() => {
    setHealthCheckRequester(() => void checkHealth())
    return () => setHealthCheckRequester(null)
  }, [])
  useEffect(() => {
    if (!unavailable) return
    const interval = setInterval(() => void checkHealth(), 15_000)
    return () => clearInterval(interval)
  }, [unavailable])

  const retry = useCallback(async () => {
    setRetrying(true)
    await checkHealth()
    setRetrying(false)
  }, [])

  // The app stays mounted underneath at all times: the maintenance screen is an
  // overlay, not a replacement, so navigation history, scroll position, form
  // input and the mini-player/audio survive a transient outage (audit H-4).
  return (
    <View style={styles.root}>
      {children}
      {unavailable ? (
        <ImageBackground
          source={require('../assets/images/service-unavailable-nature.png')}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, styles.background]}
        >
          <View style={styles.scrim} />
          <View style={styles.card}>
            <View style={styles.icon}><Ionicons name="leaf-outline" size={28} color="#F5F1E8" /></View>
            <Text style={styles.title}>A quiet pause</Text>
            <Text style={styles.message}>
              Passage is temporarily unavailable while we restore the service. Your space and saved settings are safe.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.button}>
              <Text style={styles.buttonText}>{retrying ? 'Checking…' : 'Try again'}</Text>
            </Pressable>
            <Text style={styles.note}>We’ll reconnect automatically when everything is ready.</Text>
          </View>
        </ImageBackground>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  background: { justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 24, 29, 0.38)' },
  card: {
    margin: 20, marginBottom: 42, paddingHorizontal: 26, paddingVertical: 30,
    borderRadius: 28, backgroundColor: 'rgba(13, 35, 39, 0.88)', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.28)',
  },
  icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { color: '#FFFFFF', fontFamily: AppFonts.displayRegular, fontSize: 34, lineHeight: 40 },
  message: { color: '#E9EFEC', fontFamily: AppFonts.sansRegular, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 12 },
  button: { marginTop: 24, minWidth: 164, minHeight: 50, borderRadius: 25, backgroundColor: '#F5F1E8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  buttonText: { color: '#17383C', fontFamily: AppFonts.sansRegular, fontSize: 16, fontWeight: '700' },
  note: { color: '#C8D5D2', fontFamily: AppFonts.sansRegular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
})

