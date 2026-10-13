"""
ScamShield Live - Master Execution & Health Verification Runner
AI Builder Cup 2026 | Banking, Financial Services & Insurance Track
"""

import sys
import os
import uvicorn
from pathlib import Path

# Ensure root package is in sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

def print_banner():
    banner = r"""
   _____                     _____ _     _eld  _     _           
  / ____|                   / ____| |   (_)   | |   (_)          
 | (___   ___ __ _ _ __ ___| (___ | |__  _ ___| |    ___   _____ 
  \___ \ / __/ _` | '_ ` _ \\___ \| '_ \| / _ \ |   | \ \ / / _ \
  ____) | (_| (_| | | | | | |___) | | | | |  __/ |___| |\ V /  __/
 |_____/ \___\__,_|_| |_| |_|_____/|_| |_|_|\___|______|_| \_/ \___|
       The real-time guardian that stops voice scams before money moves
    """
    print(banner)
    print("=" * 70)
    print("  AI Builder Cup 2026 | BFSI Track | Real-Time Voice Fraud Defense")
    print("=" * 70)

def main():
    print_banner()
    print("Starting ScamShield Live FastAPI Backend on http://localhost:8000 ...")
    print("Endpoints:")
    print("  • Core API:         http://localhost:8000/")
    print("  • Mock Bank API:    http://localhost:8000/bank/accounts/acc_pk_9941")
    print("  • Scam Lens API:    http://localhost:8000/v1/lens/analyze")
    print("  • Scam Radar API:   http://localhost:8000/v1/radar/campaigns")
    print("  • Evidence Dossier: http://localhost:8000/v1/evidence/c_8f21")
    print("\nTo start the React 19 Frontend Web PWA:")
    print("  cd apps/web && npm run dev")
    print("=" * 70)

    from services.shared.config import settings
    uvicorn.run("services.main:app", host=settings.HOST, port=settings.PORT, reload=False)

if __name__ == "__main__":
    main()
