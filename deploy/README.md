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

No hosting account needed, but the URL dies when you close the terminal. Good for showing someone,
not for giving the app away.

```bash
python run_system.py
```

In a second terminal:

```bash
cloudflared tunnel --url http://localhost:8000
```

Use the `https://....trycloudflare.com` address it prints. (`cloudflared` is already on your PATH.)

---

## Option C — Your own Wi-Fi only

Nothing to deploy. Run `python run_system.py`, find your computer's IP with `ipconfig`, and use
`http://THAT-IP:8000`. Only phones on the same Wi-Fi can reach it.

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
