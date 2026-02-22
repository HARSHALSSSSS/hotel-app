# Deploy Backend to Render – Step-by-Step Guide

## Prerequisites

- GitHub account
- Render account (free at [render.com](https://render.com))
- Project code pushed to a GitHub repository

---

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub (e.g. `stayease` or `hotel-booking-app`).
2. In your project folder (`bha` or project root), run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Create a PostgreSQL Database on Render

1. Log in to [render.com](https://render.com).
2. Click **New +** → **PostgreSQL**.
3. Configure:
   - **Name**: `stayease-db` (or any name)
   - **Database**: `stayease`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users (e.g. Singapore for India)
   - **Plan**: Free (or paid for production)
4. Click **Create Database**.
5. Wait for it to be ready, then go to the database dashboard.
6. Copy the **Internal Database URL** (use this in Step 4).  
   Format: `postgresql://user:password@host:5432/dbname`

---

## Step 3: Create a Web Service (Backend API)

1. In Render, click **New +** → **Web Service**.
2. Connect your GitHub account if not already.
3. Select your repository.
4. Configure:

| Field | Value |
|-------|-------|
| **Name** | `stayease-api` (or any name) |
| **Region** | Same as database |
| **Branch** | `main` |
| **Root Directory** | `bha` *(if your app is in a `bha` subfolder)* or leave empty *(if server is at root)* |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run server:build` |
| **Start Command** | `npm run server:prod` |
| **Plan** | Free (or paid) |

5. Click **Advanced** and add **Environment Variables** (Step 4).

---

## Step 4: Add Environment Variables

In your Web Service → **Environment** tab, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the **Internal Database URL** from Step 2 |
| `SESSION_SECRET` | A random string. Generate with: `openssl rand -hex 32` or use any 32+ character string |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `EXPO_PUBLIC_DOMAIN` | `your-service-name.onrender.com` *(Replace with your actual Render service URL from the dashboard)* |
| `RAZORPAY_KEY_ID` | Your Razorpay key (from [dashboard.razorpay.com](https://dashboard.razorpay.com)) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `CHAT_SUPPORT_EMAIL` | `support@hotelbookinghub.com` *(optional)* |

**Important**: Use the **Internal Database URL** so the Web Service and DB talk within Render’s network (no extra cost, faster).  
If your DB and Web Service are in the same Render account, Render can auto-link the DB and provide `DATABASE_URL`.

---

## Step 5: Deploy

1. Click **Create Web Service**.
2. Render will build and deploy. This can take 5–10 minutes.
3. When done, you’ll see a URL like `https://stayease-api.onrender.com`.

---

## Step 6: Run Database Migrations and Seed

Render Free tier does not support background jobs, so run migrations locally pointing at the hosted DB:

1. In your local project, create a `.env` with:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Use the **External Database URL** from your Render PostgreSQL service (for access from your computer).

2. Run:

```bash
cd bha
npm run db:push
npm run seed
```

3. Remove or comment out `DATABASE_URL` from your local `.env` if you don’t want to keep using the production DB locally.

---

## Step 7: Update EXPO_PUBLIC_DOMAIN

1. In Render, open your Web Service → **Environment**.
2. Set `EXPO_PUBLIC_DOMAIN` to your service hostname, e.g.:

```
EXPO_PUBLIC_DOMAIN=stayease-api.onrender.com
```

No `https://`, no trailing slash, no port (Render uses 443).

3. Redeploy if needed (Environment → **Save Changes** → redeploy).

---

## Step 8: Connect Your App to the Backend

1. In your app’s `.env` (project root or `bha`):

```env
EXPO_PUBLIC_DOMAIN=stayease-api.onrender.com
```

2. Rebuild your app (APK/Expo build) so this URL is embedded.
3. The app will then use `https://stayease-api.onrender.com` for API calls.

---

## Render Free Tier Notes

- **Spins down after 15 min** of no requests. First request after that may take ~30–60 seconds.
- **Build minutes**: 500 minutes/month.
- **Bandwidth**: 100 GB/month.
- **Database**: 1 GB, 90-day expiry on free Postgres (data deleted after that).

---

## Optional: CORS for Web / Custom Domains

If you use Expo Web or a custom web frontend, you may need to allow its origin.

Add this env var in Render:

```
REPLIT_DOMAINS=your-expo-web-url.expo.dev,yourapp.com
```

Or, if you add a `CORS_ORIGINS` env, the server code would need to read it. The current server uses `REPLIT_DOMAINS` for extra origins.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App can’t connect | Ensure `EXPO_PUBLIC_DOMAIN` is correct and app was rebuilt after changing it |
| 503 / Build fails | Check build logs; often `npm run server:build` or missing deps |
| DB connection error | Verify `DATABASE_URL`; use Internal URL for Web Service |
| CORS errors | Add your app’s origin to `REPLIT_DOMAINS` |
| Slow first load | Normal on free tier due to spin-down; consider paid plan for always-on |

---

## Project Structure Reference

If your repo root is `bha`:

- Root directory: *(leave empty)*
- Build/Start: as above

If your repo has `bha` as a subfolder (e.g. `my-repo/bha/`):

- Root directory: `bha`
- Build/Start: same commands, run from `bha`
