import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'
import * as Crypto from 'expo-crypto'
import { Platform } from 'react-native'

import { getAccessToken } from '@/lib/passage-api'
import { posthog, Sentry } from '@/lib/observability'
import { supabase } from '@/lib/supabase'
import {
  captureProductEvent,
  configureProductEventSink,
  type ProductEventProperties,
} from '@/lib/analytics-events'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') || 'https://thehappyapp.co.uk'
export const ONBOARDING_PROGRESS_KEY = 'passage.analytics.onboarding_progress'
export const analyticsSessionId = Crypto.randomUUID()

export type AnalyticsProperties = ProductEventProperties

function clean(properties: AnalyticsProperties = {}): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, string | number | boolean | null] => entry[1] !== undefined)
  )
}

async function token() {
  const passageToken = getAccessToken()
  if (passageToken) return passageToken
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function sendToBackend(eventName: string, properties: AnalyticsProperties) {
  try {
    const bearer = await token()
    await fetch(`${API_BASE_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({
        event_name: eventName,
        event_data: clean(properties),
        session_id: analyticsSessionId,
      }),
    })
  } catch {
    // Analytics is best effort and must never interrupt the listener experience.
  }
}

function dispatchEvent(eventName: string, properties: AnalyticsProperties = {}) {
  const safeProperties = clean(properties)
  posthog?.capture(eventName, safeProperties)
  void sendToBackend(eventName, safeProperties)
}

configureProductEventSink(dispatchEvent)
export const captureEvent = captureProductEvent

export function captureScreen(screenName: string) {
  const properties = { screen_name: screenName, platform: Platform.OS }
  posthog?.screen(screenName, properties)
  void sendToBackend('screen_view', properties)
}

export async function identifyObservabilityUser() {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({ id: user.id })
  posthog?.identify(user.id)
}

export function appOpenProperties(): AnalyticsProperties {
  return {
    platform: Platform.OS,
    app_version: Application.nativeApplicationVersion || 'web',
    build_version: Application.nativeBuildVersion || null,
  }
}

export async function readOnboardingProgress(): Promise<{ step: string; entered_at: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveOnboardingProgress(step: string) {
  return AsyncStorage.setItem(
    ONBOARDING_PROGRESS_KEY,
    JSON.stringify({ step, entered_at: new Date().toISOString() })
  )
}

export function clearOnboardingProgress() {
  return AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY)
}

