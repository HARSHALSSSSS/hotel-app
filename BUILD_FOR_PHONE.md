# Build APK for Physical Phone + Local Server

To run the release APK on your phone against your PC's backend (e.g. `http://192.168.0.103:5000`):

## Maps (MapLibre + OpenStreetMap – no API key)

The app uses **MapLibre Native** for mobile maps and **Leaflet** for web. All map tiles come from OpenStreetMap (via Carto). No Google, no API key, no billing.

## 1. Set your PC IP in `.env`

```bash
# Use your PC's local IP (find with ipconfig on Windows, ifconfig on Mac/Linux)
EXPO_PUBLIC_DOMAIN=192.168.0.103:5000
```

**Important:** Phone and PC must be on the same WiFi network.

## 2. Start the backend

```bash
npm run server:dev
```

## 3. Build the APK

```bash
npm run android:build:release
```

## 4. Install on phone

The APK is at `android/app/build/outputs/apk/release/app-release.apk`. Transfer and install it on your phone.

The app will connect to `http://192.168.0.103:5000` (cleartext/HTTP is allowed for local IPs).

## If you get "cleartext not permitted"

The project uses `expo-build-properties` to allow HTTP for local development. After any config change, run a clean prebuild:

```bash
npx expo prebuild --platform android --clean
cd android && .\gradlew.bat assembleRelease && cd ..
```
