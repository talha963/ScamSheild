# ScamShield Live — Android Call Guardian

The native Android app. You answer a call as normal; ScamShield judges what the **other person**
says and warns you silently if they are running a scam.

---

## How it works on the phone

1. **Incoming call** — `CallGuardianScreeningService` sees the call and notes the caller's number.
   The call rings normally; ScamShield never blocks or silences it.
2. **You answer** — `CallStateReceiver` detects the answered call (`OFFHOOK`) and starts
   `CallAudioListenerService`.
3. **Listening** — the service records 6-second chunks and uploads each one to
   `POST /v1/live/guardian/audio-chunk`. The backend transcribes it, works out who said what,
   and scores scam tactics **on the caller's words only** — your own replies never raise the risk.
4. **Silent warning** — once the caller's score passes 85 (Tier 3):
   - the phone vibrates in a distinctive triple pulse,
   - `StealthOverlayService` drops a red banner over the call screen with a **CUT CALL** button,
   - **nothing is played into the call**, so the person on the line gets no cue at all.
5. **Call ends** — `CallStateReceiver` stops the service and removes the banner.

---

## What Android does and does not allow

Please read this before testing — it shapes how the app must be used.

- **An installed app cannot read the call audio stream.** Since Android 10, `VOICE_CALL` /
  `VOICE_DOWNLINK` need the privileged `CAPTURE_AUDIO_OUTPUT` permission, which is granted only
  to apps pre-installed by the manufacturer. ScamShield therefore listens through the
  **microphone**, and the service **switches the call to speakerphone** when it starts so the
  caller's voice reaches the mic. On a handset held to the ear, only your own side is captured.
- **The microphone cannot be used invisibly.** Android requires an ongoing notification (and shows
  a mic indicator) the whole time. That is by design: the phone's owner can always see it and turn
  it off. What stays hidden is the **warning**, from the caller — which is the point of the feature.
- **Recording a call may need the other person's consent** depending on where you are. Check your
  local rules before relying on this in the field.
- `TelecomManager.endCall()` (the CUT CALL button) needs Android 9+ and the `ANSWER_PHONE_CALLS`
  permission. Without it the banner still appears and you hang up yourself.
- **Android 14 blocks a microphone service started from the background.** Starting the listener
  straight from the PHONE_STATE broadcast throws
  `SecurityException: Starting FGS with type microphone ... must be in the eligible state` and
  kills the app the moment a call is answered. ScamShield therefore goes through the invisible
  `CallGuardActivity`, which puts the app in a foreground state first. That shim needs the
  **Display over other apps** permission - without it nothing starts at all, which is why the
  setup screen treats it as required.

---

## Build the APK

Already built and ready at `app/build/outputs/apk/debug/app-debug.apk`.

Bake the server address in so the people you give it to never have to type one:

```bash
cd apps/mobile && ./gradlew assembleDebug -Pscamshield.serverUrl=https://your-server
```

Without that flag the app starts with an empty address and asks for one. See
[`deploy/README.md`](../../deploy/README.md) for putting the server online.

Or open `apps/mobile` in Android Studio and use **Build → Build APK(s)**.

`local.properties` points at the Android SDK. In a `.properties` file the path must use forward
slashes or escaped backslashes (`C\:/Users/you/AppData/Local/Android/Sdk`) — a raw Windows path
fails with `Invalid file path`.

---

## Set it up on the phone

1. Start the backend on your computer, reachable on the network:
   ```bash
   python run_system.py
   ```
   The live listener needs `GEMINI_API_KEY` set in `.env`; without it `/audio-chunk` returns 503
   (the typed-text demo still works).
2. Put the phone on the **same Wi-Fi** as the computer.
3. Install `app-debug.apk` and open **ScamShield Live**.
4. Enter your computer's Wi-Fi IP and port, e.g. `http://192.168.100.109:8000`, then tap
   **Save and test connection** — it calls `/health` and tells you if the phone can reach it.
5. Grant the prompts: microphone, phone state, notifications, **Display over other apps**, and the
   **call screening** role.
6. Turn on **Enable Call Guardian**.
7. Call the phone from another number, answer, and have the caller say something like
   *"I am from the bank, your account will be blocked, tell me the OTP"* — the phone vibrates and
   the red banner appears.

Tip: tick **I am also using my banking app** to make the app warn you sooner (+15 risk), which
mirrors the real case where a scammer talks you through a transfer.

---

## Key files

| File | Role |
|---|---|
| `CallGuardianScreeningService.kt` | Sees incoming calls, records the caller's number |
| `CallStateReceiver.kt` | Starts monitoring on answer, stops it when the call ends |
| `CallAudioListenerService.kt` | Records chunks, uploads them, vibrates, raises the banner |
| `GuardianApi.kt` | HTTP client for the `/v1/live/guardian` endpoints |
| `WavEncoder.kt` | Wraps PCM as WAV, measures loudness to skip silence |
| `StealthOverlayService.kt` | The silent warning banner with CUT CALL / Ignore |
| `CallGuardActivity.kt` | Invisible shim so the mic service starts in a foreground state |
| `SetupChecks.kt` | Works out what this phone is missing and why |
| `MainActivity.kt` | Setup screen: readiness checklist and connection test |

If the server is busy the app **keeps the audio and sends it with the next chunk** (capped at three
chunks), so a momentary model overload never loses the part of the call where the scam happens.

## It never pretends to be protecting you

Three cases are reported on screen instead of failing quietly:

- **Server unreachable** - the call is not monitored at all, and an amber banner says so.
- **No audio for ~30s** - the handset is not giving the app any call audio; an amber banner
  suggests turning the speakerphone on.
- **Missing permissions** - the setup screen shows a cross and a Fix button for each one, and the
  banner at the top says "Not ready" until they are granted.
