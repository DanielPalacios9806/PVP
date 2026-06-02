# Riot Production Request Draft

## Short description

Darkside.cool / Arena OS is a web-based esports tournament platform for organizing competitive events, teams, brackets, match rooms, moderation workflows and administrative operations. The platform is currently in pre-beta with a functioning website and API deployed over HTTPS.

## Longer description

Darkside.cool helps communities and organizers manage esports tournaments for League of Legends and, in a later approved scope, VALORANT. Users can create accounts, join teams, browse tournaments, register for events, view brackets, manage match rooms and access account-level Riot readiness information. Organizers and admins can use an operations center for moderation, audit review, user management and tournament operations.

Riot API access is implemented through a protected backend API. Riot API keys are never exposed in the frontend, never stored in public client code and are managed only through environment variables on the backend service. The frontend does not use `NEXT_PUBLIC_RIOT_API_KEY`.

## Requested Riot API use

We are requesting production access in stages:

1. Standard Riot API access for player identity/profile context where approved.
2. Riot Sign On to confirm account ownership through OAuth after approval.
3. Tournament API / Tournament Codes in a later stage after provider/callback approval.

Until RSO is approved and implemented, Darkside.cool does not claim official Riot account ownership verification. The UI distinguishes lookup/development/pending states from verified states.

## Safety and compliance statement

Darkside.cool does not support gambling, cash wagering, skins betting, blockchain rewards, real-money withdrawals or conversion of internal tokens to money. DS tokens are internal, non-monetary, non-withdrawable and non-convertible. The product includes visible Terms, Privacy and Data Deletion pages. Riot-related routes are backend protected, and runtime checks verify that the API key is not exposed to the web app.

## Demo URLs

- Web staging: `https://arena-os-web-staging-6x5f.onrender.com`
- API staging: `https://arena-os-api-staging.onrender.com/api`
- Terms: `/legal/terms`
- Privacy: `/legal/privacy`
- Data Deletion: `/legal/data-deletion`

## Evidence available

- Production health check output.
- Pre-beta smoke test output.
- Riot readiness check output.
- Playwright visual QA screenshots for desktop and mobile.
- Architecture and compliance documents in the repository.

## Notes for final submission

Before submitting, rotate any development API key that may have appeared in chat, terminal history, screenshots or support tickets. Confirm the production request references the final domain and not only staging URLs.
