import * as Sentry from '@sentry/react-native'
import PostHog from 'posthog-react-native'
import { setPlayerDiagnosticReporter } from '@/lib/player/types'

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim()

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? 'development' : 'production'),
  release: process.env.EXPO_PUBLIC_APP_RELEASE,
  tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  sendDefaultPii: false,
  enableNativeCrashHandling: true,
  enableAppHangTracking: true,
})

setPlayerDiagnosticReporter((event) => {
  const isFailure = event.event === 'failed' || event.event === 'session_error'
  Sentry.addBreadcrumb({ category: 'audio', message: event.event, level: isFailure ? 'error' : 'info', data: event })
  if (isFailure) {
    Sentry.captureMessage(`Audio playback: ${event.reason ?? event.event}`, {
      level: 'error',
      tags: { subsystem: 'audio', audio_event: event.event },
      fingerprint: ['audio', event.event, event.reason ?? 'unknown'],
      extra: event,
    })
  }
})

export const posthog = posthogKey
  ? new PostHog(posthogKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      captureAppLifecycleEvents: true,
      disableGeoip: true,
    })
  : null

export { Sentry }

