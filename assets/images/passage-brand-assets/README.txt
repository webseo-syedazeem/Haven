Passage — New Client P Brand Assets
===================================

Files
-----
icon.png              1024x1024  Main Expo app icon, full-bleed #0B0B0D background
adaptive-icon.png     1024x1024  Android adaptive foreground, transparent safe zone
splash-icon.png       1024x1024  Splash mark, transparent with generous padding
favicon.png             48x48    Web favicon
notification-icon.png   96x96    Android notification icon, pure white + transparent
logo-transparent.png  1024x1024  Extra transparent master for screens / branding

Recommended app.json usage
--------------------------
"icon": "./assets/images/passage-brand-assets/icon.png"

"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/passage-brand-assets/adaptive-icon.png",
    "backgroundColor": "#0B0B0D"
  }
}

"web": {
  "favicon": "./assets/images/passage-brand-assets/favicon.png"
}

For expo-notifications, use notification-icon.png instead of the normal app icon:
[
  "expo-notifications",
  {
    "icon": "./assets/images/passage-brand-assets/notification-icon.png",
    "color": "#0B0B0D",
    "defaultChannel": "default",
    "sounds": []
  }
]

For expo-splash-screen:
[
  "expo-splash-screen",
  {
    "backgroundColor": "#0B0B0D",
    "image": "./assets/images/passage-brand-assets/splash-icon.png",
    "imageWidth": 250,
    "dark": {
      "backgroundColor": "#0B0B0D",
      "image": "./assets/images/passage-brand-assets/splash-icon.png",
      "imageWidth": 250
    }
  }
]
