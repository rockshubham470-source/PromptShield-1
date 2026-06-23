"""
One-time setup: registers a demo user, creates an app, and prints the API key.
Run this ONCE before running demo.py or server.py.

    python setup.py
"""

import sys
import requests
import json

BASE = "http://localhost:8000/api"

EMAIL    = "demo@promptshield-demo.com"
PASSWORD = "DemoPass123!"
APP_NAME = "Demo Chatbot"

def main():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})

    # ── 1. Register ──────────────────────────────────────────────────────────
    print("→ Registering demo user…")
    r = s.post(f"{BASE}/auth/signup", json={
        "email": EMAIL, "password": PASSWORD, "name": "Demo User"
    })
    if r.status_code not in (200, 201):
        if "already" in r.text.lower() or r.status_code == 400:
            print("  (user already exists, logging in instead)")
        else:
            print(f"  Register failed: {r.status_code} {r.text}")
            sys.exit(1)

    # ── 2. Login ─────────────────────────────────────────────────────────────
    print("→ Logging in…")
    r = s.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        print(f"  Login failed: {r.status_code} {r.text}")
        sys.exit(1)
    token = r.json()["access_token"]
    user_data = r.json().get("user", {})
    org_id = user_data.get("organization_id", "")
    s.headers.update({"Authorization": f"Bearer {token}"})
    if org_id:
        s.headers.update({"X-Organization-ID": org_id})
    print(f"  ✓ Logged in  (org={org_id})")

    # ── 3. Create application + API key in one shot ──────────────────────────
    print("→ Creating application + API key…")
    r = s.post(f"{BASE}/applications?create_api_key=true", json={
        "name": APP_NAME, "description": "PromptShield demo chatbot",
        "environment": "development", "provider": "openai"
    })
    if r.status_code not in (200, 201):
        # Maybe already exists — list and reuse
        r2 = s.get(f"{BASE}/applications")
        apps = r2.json() if r2.ok else []
        app = next((a for a in (apps if isinstance(apps, list) else apps.get("items", [])) if a["name"] == APP_NAME), None)
        if not app:
            print(f"  Create application failed: {r.status_code} {r.text}")
            sys.exit(1)
        app_id = app["id"]
        print(f"  (reusing existing app id={app_id})")
        # Need to create a key separately
        r3 = s.post(f"{BASE}/application-keys/{app_id}")
        if r3.status_code not in (200, 201):
            print(f"  API key creation failed: {r3.status_code} {r3.text}")
            sys.exit(1)
        api_key = r3.json()["api_key"]
    else:
        body = r.json()
        app_id = body.get("id") or body.get("application", {}).get("id", "")
        # response_data["api_key"] = {"api_key": raw_key, "api_key_info": {...}}
        api_key_block = body.get("api_key", {})
        if isinstance(api_key_block, dict):
            api_key = api_key_block.get("api_key", "")
        else:
            api_key = ""
        if not api_key:
            # fallback — create key separately
            r3 = s.post(f"{BASE}/application-keys/{app_id}")
            if r3.status_code not in (200, 201):
                print(f"  API key creation failed: {r3.status_code} {r3.text}")
                sys.exit(1)
            api_key = r3.json()["api_key"]

    print(f"  ✓ Application id={app_id}")
    print(f"  ✓ API Key: {api_key}")

    # ── 5. Save config ────────────────────────────────────────────────────────
    cfg = {
        "base_url": BASE,
        "api_key": api_key,
        "app_id": app_id,
        "email": EMAIL,
        "password": PASSWORD,
        "org_id": org_id,
    }
    with open("config.json", "w") as f:
        json.dump(cfg, f, indent=2)

    print("\n✅ Setup complete!  config.json saved.")
    print("   Now run:  python demo.py   or   python server.py")

if __name__ == "__main__":
    main()
