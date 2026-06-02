# Riot Demo Script - Darkside.cool

## Goal

Use this script to demonstrate Darkside.cool to a reviewer or teammate before a Riot Developer Portal production request.

## Demo prerequisites

- Web staging is live.
- API staging is live.
- `check:prodhealth` passes.
- `check:visual` has recent screenshots.
- Riot API key is configured only in API/backend environment.
- No `NEXT_PUBLIC_RIOT_API_KEY` exists.

## Demo path

### 1. Public website

Open the landing page and explain:

- Darkside.cool is a tournament platform, not a gambling or betting product.
- The public experience exposes login/register and tournament discovery, not admin operations.

### 2. Authentication

Open `/auth/login` and `/auth/register`.

Explain that account access is required for protected tournament, team and Riot features.

### 3. Dashboard

Open `/dashboard`.

Show:

- player activity;
- rail/drawer behavior;
- access to tournaments, teams, tokens and account.

### 4. Tournaments Hub

Open `/dashboard/tournaments`.

Show:

- search and filters;
- available tournaments;
- non-gambling positioning;
- responsive layout.

### 5. Tournament Detail

Open a tournament detail route.

Show:

- hero and tournament metadata;
- bracket view;
- round cards on mobile;
- contextual tournament panel;
- live countdown.

### 6. Account + Riot profile UX

Open `/dashboard/account`.

Show:

- Riot readiness card;
- protected backend status;
- account not marked as officially verified unless RSO is approved;
- no exposed API key.

### 7. Admin / Ops Center

Open `/dashboard/admin` and `/dashboard/moderation` using an admin-capable session.

Show:

- operational separation;
- moderation and audit posture;
- token ledger described as non-monetary;
- Riot/admin readiness without exposing secrets.

### 8. Runtime evidence

Run or show output for:

```powershell
npm run check:release
npm run check:riot
npm run check:prodhealth
npm run check:visual
```

## Closing statement

Darkside.cool is currently pre-beta. Riot production features remain gated until Riot approves the requested product scope, RSO and Tournament API access.
