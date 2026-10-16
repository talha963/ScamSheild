# Running ScamShield with Docker

Everything runs in containers. One command, nothing to install but Docker Desktop.

```bash
docker compose up -d --build
```

Then open **<http://localhost:5173>**.

Give it about a minute the first time: the backend waits for the database, and n8n takes ~40
seconds before it answers. Check progress with:

```bash
docker compose ps
```

All four should eventually read `healthy` (n8n has no healthcheck and simply shows `Up`).

---

## What is running

| Container | Port | What it does |
|---|---|---|
| `scamshield-frontend` | **5173**, 3000 | nginx serving the React app, and proxying `/v1/`, `/bank/` and WebSockets to the backend |
| `scamshield-backend` | 8000 | FastAPI: call guardian, banking circuit-breaker, Scam Lens, evaluation |
| `scamshield-db` | 5432 | Postgres, seeded from `infra/init_db.sql` |
| `scamshield-n8n` | 5678 | Guardian WhatsApp automation |

You only need **5173** for the demo. The others are there for judges who ask.

---

## The AI key

Live call analysis needs a Gemini key. Put it in `.env` **next to `docker-compose.yml`** before
starting:

```ini
GEMINI_API_KEY=your_key_here
```

Compose reads that file and passes the key to the backend as an environment variable. The key is
**not** baked into the image — `.dockerignore` keeps `.env` out of the build context.

Without a key the banking circuit-breaker, the scam-call simulator and the whole web demo still
work; only live speech transcription is unavailable.

Confirm the container picked it up:

```bash
curl http://localhost:8000/health
```

`models.live_analysis` should read `gemini-3.8-flash`.

---

## Demo checklist

Open <http://localhost:5173> and go to **Mock Bank**:

1. **Reset** — clean slate
2. **Trigger Tier 3 hold** — Rs. 85,000 moves to escrow, the calm green "Your money is safe"
   card appears in English and Roman Urdu, and the guardian is alerted
3. **Block & return money** — the balance goes back to Rs. 248,500

For the call side, use **Call Guard** from the ☰ menu.

To verify everything from a terminal:

```bash
curl -X POST http://localhost:5173/bank/transfers/validate -H "Content-Type: application/json" -d "{\"account_id\":\"acc_pk_9941\",\"recipient_iban\":\"PK44MBL00098472910\",\"amount\":85000,\"is_call_active\":true,\"active_call_risk_score\":96}"
```

Expect `"tier": 3`, `"action": "GUARDIAN_HOLD"`, `"allowed": false`.

---

## Everyday commands

```bash
docker compose logs -f scamshield-backend    # follow backend logs
docker compose restart scamshield-backend    # restart one service
docker compose down                          # stop everything (data is kept)
docker compose down -v                       # stop and wipe the database too
docker compose up -d --build                 # rebuild after changing code
```

Source changes are **baked into the image**, so rebuild after editing code — a plain `restart`
keeps the old build.

---

## If something is wrong

**A port is already taken.** Something else is using 5173, 8000, 5432 or 5678 — often a dev server
from an earlier session. Find it with `netstat -ano | findstr :8000` and close that program.
Do not kill Docker's own processes: that stops the engine.

**The page loads but the data does not.** nginx is up but the backend is not. Check
`docker compose ps` and `docker compose logs scamshield-backend`.

**Changes are not showing.** Rebuild: `docker compose up -d --build`.

**The engine is not running.** Start Docker Desktop and wait for the whale icon to settle.

---

## Phones on your Wi-Fi

Containers listen on all interfaces, so a phone on the same Wi-Fi can reach the demo at
`http://YOUR-PC-IP:5173`. Find the IP with `ipconfig`. Windows Firewall will probably block the
port until you allow it once, in an **Administrator** PowerShell:

```powershell
New-NetFirewallRule -DisplayName "ScamShield 5173" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Private
```
