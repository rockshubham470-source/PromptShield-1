# Deploying PromptShield — Vercel + Supabase (100% Free)

Both services have generous free tiers:
- **Vercel Hobby**: static hosting + Python serverless, 100 GB bandwidth/month
- **Supabase Free**: 500 MB PostgreSQL, unlimited API calls, 2 projects

---

## 1. Set Up Supabase (Database)

1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New project** → fill in a name, choose a region close to you, set a strong database password.
3. Wait ~2 minutes for the project to be ready.
4. Go to **Project Settings → Database → Connection string → URI**.
5. Select **Transaction** mode (port `6543`) — required for serverless.
6. Copy the connection string; it looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
7. **The tables are created automatically** on first API call via SQLAlchemy's `create_all`.  
   To also seed the default detection rules, run locally:
   ```bash
   cd backend
   DATABASE_URL="<your-supabase-url>" python init_db.py
   ```

---

## 2. Deploy the Backend (Vercel Python Serverless)

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- A Vercel account (free at [vercel.com](https://vercel.com))

### Steps

```bash
cd backend
vercel login          # one-time login
vercel                # follow the prompts — deploy from backend/ directory
```

When prompted:
- **Link to existing project?** → No, create a new one
- **Project name** → e.g. `promptshield-api`
- **Root directory** → `.` (the backend folder)

After the first deploy, set the required environment variables:

```bash
vercel env add DATABASE_URL        # paste your Supabase pooler URL
vercel env add SECRET_KEY          # generate: python -c "import secrets; print(secrets.token_hex(32))"
vercel env add ENVIRONMENT         # production
vercel env add DEBUG               # false
vercel env add FRONTEND_URL        # https://your-frontend.vercel.app  (set after step 3)
vercel env add ALLOWED_ORIGINS     # ["https://your-frontend.vercel.app","http://localhost:3000"]
vercel env add TRUSTED_HOSTS       # ["*"]
```

Re-deploy to pick up the env vars:
```bash
vercel --prod
```

Note the backend URL (e.g. `https://promptshield-api.vercel.app`).

---

## 3. Deploy the Frontend (Vercel Static + Vite)

```bash
cd web-app
npm install
vercel                 # follow the prompts
```

When prompted:
- **Root directory** → `.` (the web-app folder)
- **Build command** → `npm run build`
- **Output directory** → `dist`
- **Framework** → Vite (Vercel auto-detects)

Set the environment variable:
```bash
vercel env add VITE_API_URL   # https://promptshield-api.vercel.app/api
```

Re-deploy:
```bash
vercel --prod
```

Note the frontend URL (e.g. `https://promptshield-app.vercel.app`).

---

## 4. Wire Frontend ↔ Backend

Go back to the **backend** project and update:
```bash
cd backend
vercel env rm FRONTEND_URL          # remove old value
vercel env add FRONTEND_URL         # https://promptshield-app.vercel.app
vercel env rm ALLOWED_ORIGINS
vercel env add ALLOWED_ORIGINS      # ["https://promptshield-app.vercel.app"]
vercel --prod
```

Also go to Supabase → **Project Settings → API → CORS** and add your frontend URL if you ever use Supabase Storage or Realtime from the browser.

---

## 5. Verify

- Backend health: `https://promptshield-api.vercel.app/health`
- Backend docs: `https://promptshield-api.vercel.app/docs`
- Frontend: `https://promptshield-app.vercel.app`

---

## Free Tier Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Vercel (backend) | 100k serverless invocations/month | Resets monthly |
| Vercel (frontend) | 100 GB bandwidth/month | More than enough |
| Supabase DB | 500 MB storage | Upgrade when needed |
| Supabase Auth | 50k monthly active users | Built-in if you switch |

---

## Local Development (unchanged)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env   # edit .env with your local SQLite or Supabase URL
uvicorn app.main:app --reload

# Frontend
cd web-app
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```
