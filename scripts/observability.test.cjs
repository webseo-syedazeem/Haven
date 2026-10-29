const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('the root mounts Sentry, analytics lifecycle and service availability', () => {
  const layout = read('app/_layout.tsx')
  assert.match(layout, /Sentry\.wrap\(RootLayout\)/)
  assert.match(layout, /<AnalyticsLifecycle \/>/)
  assert.match(layout, /<ServiceAvailability>/)
})

test('an explicit 503 opens the nature-backed recovery screen and health polling closes it', () => {
  const client = read('lib/api/client.ts')
  const service = read('components/ServiceAvailability.tsx')
  assert.match(client, /res\.status === 503/)
  assert.match(service, /service-unavailable-nature\.png/)
  assert.match(service, /setInterval\(\(\) => void checkHealth\(\), 15_000\)/)
  assert.match(service, /setServiceUnavailable\(false\)/)
})

test('PostHog and backend analytics cover app opens, screens, onboarding and listening duration', () => {
  const lifecycle = read('components/AnalyticsLifecycle.tsx')
  const player = read('lib/player/PlayerProvider.tsx')
  const analytics = read('lib/analytics.ts')
  assert.match(lifecycle, /'app_open'/)
  assert.match(lifecycle, /'onboarding_step_viewed'/)
  assert.match(lifecycle, /'onboarding_dropoff'/)
  assert.match(analytics, /posthog\?\.screen/)
  assert.match(analytics, /\/api\/analytics\/events/)
  assert.match(player, /'soundscape_play'/)
  assert.match(player, /duration_seconds: durationSeconds/)
})

