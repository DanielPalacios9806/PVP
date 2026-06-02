# Riot API Usage Map

## Scope

This document maps planned Riot API usage for Darkside.cool. It is a planning and compliance artifact; it does not contain credentials.

## Current implementation stance

| Area | Current status | Production intent |
|---|---|---|
| API key handling | Backend only | Keep backend only |
| Riot ID lookup | Development/mock prepared | Use approved APIs only |
| RSO | UI/readiness prepared | Enable after Riot approval |
| Tournament Codes | Backend/service prepared | Enable after provider/callback approval |
| Match history / rank | Planned | Use only approved game scopes |

## API groups and intended use

### Account / identity

**Purpose:** Resolve a player identity from Riot ID and store a safe internal reference such as PUUID when allowed.

**User value:** helps players build a competitive profile without exposing credentials.

**Safeguard:** a successful lookup is not treated as proof of account ownership. Darkside uses a state such as `LOOKUP_ONLY` until a proper RSO flow is approved and completed.

### Summoner / League profile data

**Purpose:** show basic League of Legends competitive profile information, such as profile identity and ranking context when permitted.

**User value:** lets tournament pages and profiles feel more relevant for League players.

**Safeguard:** data is read by the backend and displayed only as profile context, not as betting, gambling, or real-money reward logic.

### Match data

**Purpose:** future display of recent match context, match room evidence or competitive history where allowed.

**User value:** improves profiles, tournament history and dispute review.

**Safeguard:** no live competitive advantage is intended during active matches.

### Riot Sign On (RSO)

**Purpose:** confirm account ownership through an official OAuth-based flow after Riot approval.

**User value:** a user can explicitly authorize Darkside to link their Riot account without sharing a password.

**Safeguard:** until approval, UI must say pending, mock, development or lookup-only instead of verified ownership.

### Tournament API / Tournament Codes

**Purpose:** future automation of tournament code creation and callback-based match results after Riot approval.

**User value:** reduces manual organization overhead for approved tournament workflows.

**Safeguard:** tournament code generation remains disabled or mock until provider, tournament and callback requirements are approved and tested.

## Internal backend routes

Darkside routes Riot work through the API service. Typical internal routes include:

| Internal route | Purpose | Protection |
|---|---|---|
| `/api/riot/health` | Riot runtime health | Auth-protected |
| `/api/riot/status` | Riot integration status | Auth-protected |
| `/api/riot/rso/status` | RSO status | Auth-protected |
| `/api/admin/riot/overview` | Admin overview | Admin/role-protected |
| `/api/riot/tournament/callback` | Future callback receiver | Signature/metadata validation |

## Non-goals

Darkside does not use Riot APIs to support gambling, real-money rewards, crypto, blockchain, betting, or wagering.
