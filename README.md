# IzzyDrive

**Stay Awake, Stay Safe -- Your Smart Driver Companion**

IzzyDrive is a React Native (Expo) drowsiness detection app that uses your phone's front camera to monitor for signs of driver fatigue in real time. All detection runs entirely on-device -- no cloud services, no data uploads.

---

## Features

- **Real-time Face Monitoring** -- Full-screen camera preview with semi-transparent HUD overlays showing speed, eye status, blink rate, yawn count, and more.
- **Drowsiness Detection** -- Combines Eye Aspect Ratio (EAR), blink frequency, and Mouth Aspect Ratio (MAR/yawn) analysis to detect fatigue.
- **Configurable Thresholds** -- Every detection parameter is adjustable via sliders in the Settings screen. Fine-tune sensitivity for your setup.
- **Sensitivity Presets** -- Quick Low / Medium / High buttons that auto-adjust all thresholds at once.
- **GPS Speed Tracking** -- Monitoring only activates above your configured speed threshold (default 0 mph for stationary testing).
- **Escalating Alerts** -- Mild warning banner first, then full-screen red flash + loud alarm + vibration if drowsiness persists.
- **Onboarding Tips** -- First-launch walkthrough with mounting advice, lighting tips, and testing suggestions.
- **Detection Log** -- Local timestamped log of every drowsiness event with triggered parameters for later review.
- **Dark Mode** -- Dark theme by default for minimal distraction while driving.
- **All On-Device** -- No internet required. Camera frames are processed locally.

---

## Configurable Settings

All settings are saved locally via AsyncStorage and persist across app restarts.

| Setting | Range | Default | Description |
|---|---|---|---|
| Min Speed Threshold | 0 -- 80 mph | 0 mph | Monitoring activates above this speed. Set to 0 for stationary testing. |
| EAR Threshold | 0.10 -- 0.30 | 0.18 | Eyes considered "closed" if average Eye Aspect Ratio falls below this. |
| Eye Closure Duration | 1 -- 5 sec | 2 sec | Flag drowsiness if eyes remain closed longer than this. |
| Long Blinks / Minute | 1 -- 10 | 3 | Flag if more than this many prolonged blinks per minute. |
| MAR Threshold (Yawn) | 0.40 -- 0.80 | 0.60 | Mouth considered "yawning" if Mouth Aspect Ratio exceeds this. |
| Yawns / Minute | 1 -- 5 | 2 | Flag if more than this many yawns per minute. |
| Escalation Delay | 3 -- 15 sec | 5 sec | Time before a mild warning escalates to full alarm + vibration. |
| Sensitivity Preset | Low / Medium / High | Medium | Quick buttons that auto-adjust all the above parameters. |

Use the **Reset to Defaults** button to restore all settings to their original values.

---

## Detection Logic

IzzyDrive combines multiple fatigue indicators:

1. **Prolonged Eye Closure** -- If eyes stay closed beyond the configured duration threshold.
2. **Excessive Long Blinks** -- If the rate of prolonged blinks exceeds the per-minute threshold.
3. **Frequent Yawning** -- If yawn count per minute exceeds the threshold.

Detection only triggers when your speed is at or above the minimum speed threshold. Flags from any of the above conditions trigger:
- **Mild Warning**: A non-intrusive banner at the bottom of the screen ("Drowsiness detected -- take a break?").
- **Severe Alert** (after escalation delay): Full-screen red flash, loud alarm sound, and device vibration.

Tap the warning banner to dismiss. The system resets once indicators return to normal.

---

## Mounting Advice

For best results:
- **Mount on center console or dashboard** -- Angle the phone toward your face.
- **Use a sturdy mount** -- Minimize vibration from road bumps.
- **Remove sunglasses** -- Tinted lenses interfere with eye detection. Prescription glasses are fine.
- **Ensure adequate lighting** -- Dashboard ambient light usually works. Avoid strong backlighting.
- **Test at 0 mph first** -- Verify face detection works with your setup before driving.
- **Keep phone plugged in** -- Camera + GPS use significant battery.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your iOS or Android device

### Installation

```bash
# Clone the repository
git clone https://github.com/sebaspany/IzzyDrive.git
cd IzzyDrive

# Install dependencies
npm install
```

### Testing with Expo Go

```bash
# Start the development server
npx expo start

# Scan the QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

> **Note:** `expo-face-detector` works in Expo Go on both iOS and Android. For full background location support, you may need a development build (see below).

### Development Build (Recommended for full features)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure the project
eas build:configure

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### EAS iOS Production Build

```bash
# Create a production build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

For detailed EAS Build documentation, see: https://docs.expo.dev/build/introduction/

---

## Project Structure

```
IzzyDrive/
  App.tsx                          # Main app entry, screen routing
  app.json                         # Expo configuration
  src/
    constants/
      defaults.ts                  # Default settings, presets, colors
    types/
      index.ts                     # TypeScript type definitions
    utils/
      storage.ts                   # AsyncStorage helpers
      faceAnalysis.ts              # EAR, MAR, confidence calculations
      alertManager.ts              # Audio alarm + haptic vibration
    hooks/
      useSettings.ts               # Settings state management
      useSpeed.ts                  # GPS speed tracking
      useDrowsinessDetection.ts    # Core detection logic
    screens/
      OnboardingScreen.tsx         # First-launch tips walkthrough
      MonitoringScreen.tsx         # Main camera + HUD monitoring UI
      SettingsScreen.tsx           # Configurable thresholds + presets
      DetectionLogScreen.tsx       # Historical detection event log
```

---

## Permissions

IzzyDrive requests the following permissions:
- **Camera** -- Required for face detection.
- **Location** -- Required for GPS speed measurement. Background location is requested for speed tracking when the screen dims.
- **Vibration** -- Used for haptic alert feedback.

---

## Battery Tips

- Keep your phone plugged into a car charger while using IzzyDrive.
- Camera and GPS are the main battery consumers.
- Consider lowering screen brightness (the dark theme helps).
- Close other apps to reduce background resource usage.

---

## Tech Stack

- [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) -- Camera preview
- [expo-face-detector](https://docs.expo.dev/versions/latest/sdk/facedetector/) -- Face landmark detection
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) -- GPS speed
- [expo-av](https://docs.expo.dev/versions/latest/sdk/av/) -- Alarm audio
- [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) -- Vibration feedback
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) -- Local data persistence
- TypeScript

---

## License

MIT
