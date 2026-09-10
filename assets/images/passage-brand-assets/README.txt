Passage App Icon & Splash Assets
=================================

Files:
- icon.png            1024x1024  Main app icon (full-bleed dark square, iOS/Android will round it)
- adaptive-icon.png    1024x1024  Android adaptive icon foreground layer (smaller wave, more padding for safe zone)
- splash-icon.png      1024x1024  Splash screen mark (smallest wave, most padding, for centering on launch screen)
- favicon.png          48x48      Web favicon
- PREVIEW.png                     Visual reference sheet: icon at multiple small sizes + splash mockup

Usage in app.json (Expo):
  "icon": "./assets/images/icon.png"
  "android": { "adaptiveIcon": { "foregroundImage": "./assets/images/adaptive-icon.png", "backgroundColor": "#0B0B0D" } }
  "splash": { "image": "./assets/images/splash-icon.png", "backgroundColor": "#0B0B0D" }
  "web": { "favicon": "./assets/images/favicon.png" }

All assets share the same interwoven-wave gold mark on the #0B0B0D dark background, matching the client-approved logo.
