# Riot Developer Application Package - Darkside.cool / Arena OS

## Purpose

This package summarizes the current pre-beta state of Darkside.cool for a future Riot Developer Portal application. It is intended to be used internally before submitting a production request. It does not contain API keys, secrets or private credentials.

## Product summary

**Product name:** Darkside.cool / Arena OS

**Product type:** Web-based esports tournament platform for community and competitive events.

**Primary games:**

- League of Legends
- VALORANT, planned through approved production access and game-specific permissions

**Architecture:** Modular monolith with a Web workspace and an API workspace in the same repository. Riot API access is routed through the backend only.

**Current environment:** Pre-beta staging deployed on Render.

**Staging URLs:**

- Web: `https://arena-os-web-staging-6x5f.onrender.com`
- API: `https://arena-os-api-staging.onrender.com/api`
- Legal Terms: `/legal/terms`
- Privacy: `/legal/privacy`
- Data Deletion: `/legal/data-deletion`

## What the product does

Darkside.cool helps organizers run esports events with:

- user accounts and competitive profile center;
- teams and roster management;
- tournament hub and tournament detail pages;
- registrations and match rooms;
- bracket visualization;
- moderation and disputes workflow;
- admin / ops center;
- internal non-monetary DS tokens;
- Riot integration readiness through a protected backend.

## Riot integration stage

Darkside currently separates three concepts:

1. **Mock/demo mode:** UI and workflows can be demonstrated without Riot API dependency.
2. **Development key mode:** backend can validate integration behavior with a temporary development key.
3. **Production request stage:** production key, RSO and Tournament API access are requested only after the product demonstrates stable user flows, legal pages, security controls and functioning web/API deploys.

## Security posture

- `RIOT_API_KEY` is backend-only.
- `NEXT_PUBLIC_RIOT_API_KEY` is not used.
- Riot routes are protected behind backend authorization.
- Web and API are served over HTTPS in Render.
- Release scripts scan for obvious versioned secrets.
- DS tokens are internal, non-monetary, non-withdrawable and non-convertible.
- The platform does not support gambling, cash wagering, skins betting, blockchain rewards, or real-money withdrawal.

## Technical evidence already available

- `npm run build`
- `npm run check:release`
- `npm run check:riot`
- `npm run check:render`
- `npm run check:prebeta`
- `npm run check:prodhealth`
- `npm run check:visual`

The visual QA run captures home, auth, dashboard, tournaments, tournament detail, teams, account, admin and moderation in desktop and mobile.

## Production request readiness statement

Darkside.cool is in pre-beta with a live web application and live API service. The product can demonstrate user flows, legal pages, tournament UX, profile/Riot readiness UX, admin operations, runtime health checks, database readiness checks and visual QA evidence. Riot production permissions remain gated until Riot approves the relevant application scope.
