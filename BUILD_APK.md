# How to Build an APK and Connect to Your Backend

This app is an **Expo** (React Native) project. The app talks to your backend using the URL from **`EXPO_PUBLIC_DOMAIN`**. That value is baked into the app at **build time**, so you must set it before building the APK.

---

## ⚠️ App stuck on splash screen / symbol on physical phone?

**Cause**: You installed a **debug** APK (from `expo run:android`). Debug builds load JavaScript from your PC’s Metro bundler. On a physical device, the app can’t reach Metro, so the JS never loads → splash stays forever.

**Fix**: Build a **release** APK with the JS bundle embedded. Use one of:

- `npm run android:build:release` (local build)
- `eas build --platform android --profile preview` (Expo cloud)

See sections 3A and 3B below.

---

## 1. Backend must be live and reachable

- Deploy your backend (the `server/` in this repo) to a server with **HTTPS** (e.g. Railway, Render, Fly.io, VPS).
- Note the public URL, e.g. `https://your-app.railway.app` → the **host** is `your-app.railway.app` (no `https://`, no trailing slash).
- Ensure:
  - **CORS** allows your app (or `*` for testing).
  - **Database** (`DATABASE_URL`) and other env vars are set on the server.
  - API is on **HTTPS** (required by Android for non-localhost).

---

## 2. Set the backend URL for the app (required for APK)

The app reads the API base URL from **`EXPO_PUBLIC_DOMAIN`** in `lib/query-client.ts`. Use only the **host** (no `https://`, no path).

**Option A – Using a `.env` file (recommended)**

In the project root, create or edit `.env`:

```env
# Your backend host only (no https://, no port if 443)
EXPO_PUBLIC_DOMAIN=your-app.railway.app
```

Examples:

- `https://api.example.com` → `EXPO_PUBLIC_DOMAIN=api.example.com`
- `https://mybackend.herokuapp.com` → `EXPO_PUBLIC_DOMAIN=mybackend.herokuapp.com`
- Local tunnel (ngrok): `EXPO_PUBLIC_DOMAIN=abc123.ngrok-free.app`
- Local WiFi testing (PC IP, phone on same WiFi): `EXPO_PUBLIC_DOMAIN=192.168.0.103:5000` (use your PC's IP; app uses `http` for private IPs)

**Option B – EAS Build (Expo Application Services)**

If you use EAS Build, set the same variable in **EAS Secrets** or in `eas.json` under the build profile (see below). That way the APK is built with your production backend URL.

---

## 3. Build the APK

You can use **EAS Build** (cloud) or a **local Android build**. Both need the backend URL set as above.

### Option A – EAS Build (Expo cloud, easiest)

1. **Install EAS CLI and log in**

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure the project (first time only)**

   ```bash
   eas build:configure
   ```

   This creates or updates `eas.json`.

3. **Set backend URL for the build**

   - Either keep `EXPO_PUBLIC_DOMAIN` in `.env` and run the build from the same machine, or  
   - In [expo.dev](https://expo.dev) → your project → **Secrets**, add:
     - Name: `EXPO_PUBLIC_DOMAIN`  
     - Value: `your-app.railway.app` (your real backend host)

4. **Build Android APK**

   ```bash
   eas build --platform android --profile preview
   ```

   The `preview` profile in `eas.json` is set to produce an **APK** (not AAB). When the build finishes, download the APK from the link EAS gives you.

5. **Install on device**

   Transfer the APK to your phone and install it (allow “Install from unknown sources” if asked).

---

### Option B – Local build (no EAS account)

1. **Install Android Studio** and the Android SDK (including “Android SDK Build-Tools” and a recent SDK version).

2. **Set backend URL** in `.env` as in step 2 above.

3. **Generate native Android project**

   ```bash
   npx expo prebuild --platform android
   ```

4. **Build release APK**

   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   On Windows:

   ```bash
   cd android
   .\gradlew.bat assembleRelease
   ```

5. **APK location**

   ```text
   android/app/build/outputs/apk/release/app-release.apk
   ```

Install this file on your device. The app will use the `EXPO_PUBLIC_DOMAIN` value that was in `.env` when you ran `expo prebuild` / the build.

---

## 4. Ensure the APK uses your backend

- **EXPO_PUBLIC_DOMAIN** is embedded at build time. Whatever value is in `.env` (or in EAS Secrets for EAS Build) when you build is what the APK will use.
- After building, you do **not** need to change anything in the APK for the URL; just re-build with a new `.env` / secret if you change the backend host.
- In `lib/query-client.ts`, the app uses `https` for any host that is not `localhost` / `127.0.0.1` / `10.0.2.2`, so a production host will always use HTTPS.

---

## 5. Quick checklist

| Step | What to do |
|------|------------|
| Backend live | Deploy server, HTTPS, CORS and DB configured |
| Backend URL in app | Set `EXPO_PUBLIC_DOMAIN=your-backend-host` in `.env` or EAS Secrets |
| Build | Run EAS Build (`eas build --platform android --profile preview`) or local `expo prebuild` + `gradlew assembleRelease` |
| Install | Download APK (EAS) or use `app-release.apk` from `android/app/build/outputs/apk/release/` |
| Test | Open app on device; login, bookings, wallet, etc. should hit your backend |

---

## 6. Optional: Razorpay

- **Maps**: MapLibre + OpenStreetMap (Leaflet on web). No Google, no API key.
- **Razorpay**: Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the **server** (backend env), not in the app. The app already uses the backend for payment flows.

Once `EXPO_PUBLIC_DOMAIN` points to your live backend and you build the APK as above, the app will connect to that backend and all features (auth, bookings, wallet, etc.) will use it.
