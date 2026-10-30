import { usePathname } from 'expo-router'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'

import {
  appOpenProperties,
  captureEvent,
  captureScreen,
  clearOnboardingProgress,
  identifyObservabilityUser,
  loadAnalyticsConsent,
  readOnboardingProgress,
  saveOnboardingProgress,
} from '@/lib/analytics'

export function AnalyticsLifecycle() {
  const pathname = usePathname()
  const launched = useRef(false)
  const currentPath = useRef(pathname)
  currentPath.current = pathname

  useEffect(() => {
    if (launched.current) return
    launched.current = true
    void loadAnalyticsConsent().then(async () => {
      await identifyObservabilityUser()
      captureEvent('app_open', appOpenProperties())
    })
    void readOnboardingProgress().then((progress) => {
      if (progress) {
        captureEvent('onboarding_dropoff', {
          step: progress.step,
          reason: 'previous_session_ended',
        })
      }
    })
  }, [])

  useEffect(() => {
    captureScreen(pathname)
    if (pathname.startsWith('/onboarding/')) {
      const step = pathname.replace('/onboarding/', '')
      captureEvent('onboarding_step_viewed', { step })
      void saveOnboardingProgress(step)
    } else if (pathname === '/welcome') {
      void readOnboardingProgress().then((progress) => {
        if (!progress) return
        captureEvent('onboarding_completed', { previous_step: progress.step })
        void clearOnboardingProgress()
      })
    }
  }, [pathname])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void identifyObservabilityUser()
        captureEvent('app_foreground', appOpenProperties())
      }
    })
    return () => subscription.remove()
  }, [])

  return null
}

