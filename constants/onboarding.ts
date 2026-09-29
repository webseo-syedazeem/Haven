/**
 * Controls whether the duration-selection step ("How long do you usually need?")
 * is shown during Focus and Sleep onboarding.
 *
 * Set to false because the app currently only has 1-hour soundscapes, so asking
 * the user to pick a duration adds no value. The screen's code (personalise.tsx)
 * and its target_minutes-saving logic remain fully intact.
 *
 * TO RE-ENABLE: flip this constant to `true`. The flow will automatically route
 * through /onboarding/personalise again, and target_minutes will be collected and
 * submitted as before.
 */
export const DURATION_STEP_ENABLED = false;
