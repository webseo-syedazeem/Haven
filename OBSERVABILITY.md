# Mobile observability

Set the `EXPO_PUBLIC_SENTRY_*` and `EXPO_PUBLIC_POSTHOG_*` values documented in
`.env.example`. Configure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`
as private EAS build environment variables so release source maps are uploaded;
the auth token must never use the `EXPO_PUBLIC_` prefix.

PostHog receives app lifecycle and manually named screen views. Touch autocapture
and session replay are intentionally not enabled, keeping free-form wellbeing and
check-in content out of analytics. The Passage backend receives the small event
subset needed by the admin monitoring dashboard.
