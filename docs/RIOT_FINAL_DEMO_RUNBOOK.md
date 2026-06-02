# Riot Final Demo Runbook

## Goal

Demonstrate Darkside.cool as a working pre-beta product ready for Riot Developer Portal review.

Note: Arena OS is a legacy internal codename that may appear in Render service names. The public product name is Darkside.cool.

## Preparation

1. Confirm Render Web is live.
2. Confirm Render API is live.
3. Rotate RIOT_API_KEY if needed.
4. Run final checks.
5. Generate fresh visual QA screenshots.
6. Open required demo tabs in the browser.

## Demo flow

### 1. Public product

Open:

```text
https://arena-os-web-staging-6x5f.onrender.com
```

Show:

- Public landing page.
- League of Legends / VALORANT tournament positioning.
- Login and register links.
- Legal links.

### 2. Authentication

Open:

```text
/auth/login
/auth/register
```

Show:

- Login UI.
- Register UI.
- No Riot API key exposed in frontend.

### 3. Player dashboard

Open:

```text
/dashboard
/dashboard/account
```

Show:

- Competitive profile.
- Riot integration state.
- Account security.
- Teams, tournaments and token navigation.

### 4. Tournaments

Open:

```text
/dashboard/tournaments
/dashboard/tournaments/mock-tournament-1
```

Show:

- Tournament hub.
- Search/filter UX.
- Tournament detail page.
- Bracket visualization.
- Countdown and tournament side panel.

### 5. Admin/Ops

Open:

```text
/dashboard/admin
/dashboard/moderation
```

Show:

- Ops Center.
- Riot/admin readiness.
- Moderation/war room.
- Token ledger as non-monetary internal system.

### 6. Technical checks

Run:

```powershell
npm run check:release
npm run check:riot
npm run check:riotapp
npm run check:prodhealth
npm run check:beta
npm run check:riotsubmit
```

## Closing statement

Darkside.cool is a working pre-beta product with secure backend-only Riot API handling, staging deployment, compliance documentation, visual QA artifacts and operational runbooks.
