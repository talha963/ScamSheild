# Putting the ScamShield server online

The Android app sends call audio to this server. A Wi-Fi address like `192.168.1.10:8000` only
works on your own network, so to hand the app to other people the server needs a public HTTPS
address. Pick one of the options below, then bake the address into the APK (last section).

Your Gemini API key stays on the server. It is never put in the APK.

---

## Option A — Google Cloud Run (recommended)

Free tier is generous and it gives you HTTPS automatically.

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

Store the key as a secret rather than a plain environment variable:

```bash
printf '%s' 'YOUR_GEMINI_API_KEY' | gcloud secrets create gemini-api-key --data-file=-
```

Deploy from the repository root (the folder holding `Dockerfile.backend`):

```bash
gcloud run deploy scamshield --source . --region asia-south1 --allow-unauthenticated --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

Cloud Run prints a URL like `https://scamshield-abc123-el.a.run.app`. Check it:

```bash
curl https://YOUR-URL/health
```

`--allow-unauthenticated` is required because the phones call it directly. Anyone with the URL can
use your quota, so treat it as semi-private and watch your Gemini billing.

Cloud Run sets `PORT` itself and `run_system.py` already honours it, so no change is needed.

---

## Option B — A quick tunnel for testing today

No hosting account needed, but **the address changes every time you restart it**. Good for
testing and demos, not for giving the app away.

Double-click **`start_scamshield.bat`** in the project root. It starts the backend, opens the
tunnel, prints the public address and copies it to your clipboard:

```text
   PUT THIS ADDRESS IN THE PHONE APP:

     https://something-random.trycloudflare.com
```

In ScamShield: tap the **Shield Active** pill, paste it into *ScamShield Server URL*, then tap
**Save & Test Server**. Keep the window open while you use the app.

> **Never hardcode a trycloudflare address as the app's default.** It stops working the moment the
> tunnel closes, and every build afterwards ships a dead address — the app then reports
> "Cannot reach the server" even though everything else is fine. Pass it with
> `-Pscamshield.serverUrl=` only when you want a specific build to carry it.

---

## Option C — Your own Wi-Fi only

Nothing to deploy, but there are three ways it silently breaks:

1. **The server is not running.** Start it with `start_scamshield.bat` or `python run_system.py`.
2. **Your computer's IP changed.** Windows hands out a new one over time, so an address that
   worked last week may now belong to nothing. Check with `ipconfig`.
3. **Windows Firewall blocks the port.** By default nothing may reach port 8000 from your phone.
   Open an **Administrator** PowerShell once and run:

   ```powershell
   New-NetFirewallRule -DisplayName "ScamShield Backend 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -Profile Private
   ```

The phone must also be on that same Wi-Fi, not mobile data. The tunnel in Option B avoids all
three problems.

---

## Put the address into the APK

Once you have the address, build the app with it baked in so the people you give it to never have
to type anything:

```bash
cd apps/mobile && ./gradlew assembleDebug -Pscamshield.serverUrl=https://YOUR-URL
```

The APK lands at `apps/mobile/app/build/outputs/apk/debug/app-debug.apk`. Users can still change
the address in the app, and **Save and test** tells them straight away whether it works.

Built without that flag, the app simply starts with an empty address and asks for one.

---

## Before handing it to other people

- Open the app on a phone that has never had it, and confirm the address is already filled in.
- Tap **Save and test** and confirm the green "Connected" dialog.
- Make a real call and confirm the notification appears.
- Remember the app is a debug build: Android will warn about installing from an unknown source,
  and Play Protect may ask for confirmation. For wider distribution sign a release build.
