# Deployment Checklist – StayEase

## "No rooms available" Fix

If the app shows **"No rooms available for this hotel"** for all hotels, the production database likely has no room data.

### 1. Seed the production database

Your `.env` has `DATABASE_URL` pointing to Render PostgreSQL. Run the seed **from your PC** (it writes to the remote DB):

```bash
# Ensure .env has DATABASE_URL for your Render PostgreSQL
npm run db:push    # Create/update tables
npm run db:seed    # Add hotels, rooms, reviews
```

Or with force (clears and re-seeds):

```bash
npm run seed:force
```

### 2. Verify backend connection

- **API URL:** App uses `EXPO_PUBLIC_DOMAIN` from `.env` (e.g. `hotel-app-2-quwz.onrender.com`)
- **Test:** Open `https://hotel-app-2-quwz.onrender.com/api/hotels` in a browser – you should see a JSON array of hotels.
- **Rooms:** Open `https://hotel-app-2-quwz.onrender.com/api/hotels/<any-hotel-id>` – the response should include a `rooms` array.

### 3. Render setup

1. **Web Service** – Backend (Node server)
2. **PostgreSQL** – Database
3. **Environment** – `DATABASE_URL` from the PostgreSQL instance must be set on the Web Service

---

## Quick checks

| Issue | Action |
|-------|--------|
| No hotels on home | Run `npm run db:seed` with production `DATABASE_URL` |
| No rooms on hotel detail | Same – seed creates rooms per hotel |
| Connection timeout | Ensure backend URL in `.env` (EXPO_PUBLIC_DOMAIN) matches your Render service |
| 404 on /api/hotels | Backend not deployed or wrong URL |
