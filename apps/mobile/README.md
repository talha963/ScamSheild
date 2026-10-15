# ScamShield Live — Android Mobile Call Guardian

This directory contains the native Android application for **ScamShield Live**. It provides background silent call monitoring and stealth fraud alerts.

---

## 🛡️ How It Works on Android

1. **Incoming Call Detection**:
   When an unknown caller calls your phone, `CallGuardianScreeningService` detects the call and activates `CallAudioListenerService` in the background.

2. **Silent Speech Stream**:
   The opponent's voice is processed in chunks and evaluated against ScamShield's 45+ fraud categories (`/v1/live/guardian/evaluate-chunk`).

3. **Secret Alert (Zero Audio Leak)**:
   When fraud (e.g. OTP demand, police threat, bank freeze) is confirmed:
   - The phone triggers an urgent physical vibration pulse (`VibrationEffect`).
   - A floating heads-up banner (`StealthOverlayService`) slides down on the screen with a red **"CUT CALL (HANG UP)"** button.
   - **Crucial**: No sound or audio cue is emitted into the call stream, so the scammer on the line hears **NOTHING**.

---

## 🚀 2 Ways to Test on Your Android Phone

### Method 1: Instant Mobile PWA (Test Right Now in 30 Seconds!)
You do not need to wait for Gradle compilation to test the real device vibration and full interface on your phone:

1. Connect your Android phone to the same Wi-Fi network as your computer.
2. Open Google Chrome on your phone and go to:
   ```
   http://192.168.100.109:5173
   ```
3. Tap **"Try Demos"** $\rightarrow$ **"Mobile Live Call Guardian"**.
4. In Chrome's menu (3 dots), tap **"Add to Home screen"** or **"Install app"**.
5. Test the incoming call simulation:
   - Your phone will physically vibrate in your hand when a scam trick is used!
   - You will see the floating stealth alert appear.
   - You can speak into your real phone microphone.

---

### Method 2: Building the Native Standalone APK

To compile the standalone APK using Android Studio:

1. Open **Android Studio**.
2. Select **File $\rightarrow$ Open** and choose:
   ```
   d:\AI Builder\scamshield-live\apps\mobile
   ```
3. Wait for Gradle sync to complete.
4. Click **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.
5. The generated APK will be located at:
   ```
   apps/mobile/app/build/outputs/apk/debug/app-debug.apk
   ```
6. Transfer `app-debug.apk` to your phone via USB or WhatsApp and install it.
7. Open **ScamShield Live** on your phone:
   - Turn on **"Enable Call Guardian"**.
   - Grant Overlay and Call Screening permissions.
   - Enter your computer's server IP: `http://192.168.100.109:8000`.

---

## ⚙️ Key Android Files

- `app/src/main/AndroidManifest.xml`: Declares permissions and background services.
- `app/src/main/java/com/scamshield/guardian/CallGuardianScreeningService.kt`: Intercepts incoming calls from unknown numbers.
- `app/src/main/java/com/scamshield/guardian/CallAudioListenerService.kt`: Silent background speech listener and haptic vibrator.
- `app/src/main/java/com/scamshield/guardian/StealthOverlayService.kt`: Floating heads-up overlay with 1-tap "Cut Call" button.
- `app/src/main/java/com/scamshield/guardian/MainActivity.kt`: Settings & Activation UI.
