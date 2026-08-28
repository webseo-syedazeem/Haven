# Halcyon Responsive Layout Rules

These rules are mandatory for every screen created or redesigned in this project.

- Do not use a fixed content or screen height when `minHeight` can be used.
- Prefer flexible layouts (`flex`, `flexGrow`, content-driven sizing, and `minHeight`) so added or translated content does not overlap or overflow.
- Always preserve a safe gap between neighboring sections and controls. Do not depend on absolute positioning for normal content flow.
- Respect top and bottom safe-area insets on every full-screen layout.
- Every input/form screen must remain usable while the keyboard is open.
- Wrap forms in a keyboard-aware layout appropriate to the screen, normally `KeyboardAvoidingView` plus a `ScrollView` whose `contentContainerStyle` uses `flexGrow: 1`.
- Add sufficient bottom content inset/padding so the final input and primary action can scroll fully above the keyboard.
- Use `keyboardShouldPersistTaps="handled"` where appropriate so taps on controls work while the keyboard is visible.
- Test compact screens and keyboard-visible states; fields, validation messages, and buttons must never stack on top of one another.
- Fixed height remains acceptable only for intentionally fixed individual controls such as buttons or icons, not for a form container or the whole screen.
- Do not assign `width: 100%` to buttons or to padded content containers. Let normal stretch behavior use the parent's available inner width; percentage width plus padding can overflow on web and compact devices.
- Prefer parent horizontal padding with naturally stretched children. Use `maxWidth` only for an intentional large-screen content cap and pair it with safe centering.
- Use `minHeight` plus vertical padding for buttons so labels can grow without clipping.

## Full-screen image rule

- Any image supplied as a screen background/reference must cover the complete viewport edge-to-edge; do not place it as a naturally sized standalone image.
- In React Native, use `ImageBackground` or an absolute-fill `Image` with `resizeMode="cover"`.
- Keep the crop centered by default and preserve the image aspect ratio. Never stretch or distort it.
- Screen UI must be layered above the covering image and must still respect safe-area insets and responsive spacing.
- Logos, icons, card thumbnails, and other intentionally contained assets are exceptions; use `contain` only when their full artwork must remain visible.
