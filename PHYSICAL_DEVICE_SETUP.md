# Run the app on a physical Android phone (Expo Go)

On a **physical phone**, the app cannot use `localhost` or `10.0.2.2` (that’s only for the emulator).  
**Expo Go** also blocks plain HTTP, so the API must be reached over **HTTPS**.  
The easiest way is to expose your local server with a **tunnel**.

## Steps

### 1. Start your API server

In a terminal:

```bash
npm run server:dev
```

Leave it running (you should see “express server serving on port 5000”).

### 2. Expose port 5000 with a tunnel (HTTPS)

In a **second** terminal, run one of these:

**Option A – ngrok (simple, free tier):**

```bash
npx ngrok http 5000
```

**Option B – Cloudflare Tunnel (no account needed for quick test):**

```bash
npx cloudflared tunnel --url http://localhost:5000
```

You’ll get a public **HTTPS** URL, for example:

- ngrok: `https://abc123.ngrok-free.app`
- cloudflared: `https://something.trycloudflare.com`

Copy the **host part only** (no `https://`), e.g. `abc123.ngrok-free.app`.

### 3. Point the app at the tunnel

In your project root, create or edit `.env` and set:

```env
EXPO_PUBLIC_DOMAIN=abc123.ngrok-free.app
```

Use the host you got from ngrok or cloudflared (no port, no `https://`).

### 4. Restart Expo and open on the phone

1. Stop the Expo dev server (Ctrl+C) and start it again:
   ```bash
   npm start
   ```
2. On your phone, open **Expo Go** and scan the QR code (phone and PC on the same Wi‑Fi).
3. The app will load and call your API over HTTPS via the tunnel. Hotels should appear (after you’ve run `npm run db:seed`).

---

**Summary:**  
API server (port 5000) → tunnel (ngrok/cloudflared) → HTTPS URL → set `EXPO_PUBLIC_DOMAIN` in `.env` → restart Expo → open app on phone in Expo Go.
