# Riot Screenshot Evidence

## Purpose

This document maps the Playwright screenshots that should be reviewed or attached as supporting evidence for a Riot production request.

## How to generate evidence

```powershell
$env:VISUAL_QA_BASE_URL="https://arena-os-web-staging-6x5f.onrender.com"
npm run check:visual
```

The script creates a timestamped folder under:

```text
visual-qa-artifacts/<run-id>/
```

The folder contains:

- `manifest.json`
- `VISUAL_QA_REPORT.md`
- desktop screenshots
- mobile screenshots

## Evidence map

| Screenshot | Why it matters |
|---|---|
| `desktop-home.png` / `mobile-home.png` | Shows public product positioning |
| `desktop-login.png` / `mobile-login.png` | Shows user access flow |
| `desktop-dashboard.png` / `mobile-dashboard.png` | Shows logged-in product shell |
| `desktop-tournaments.png` / `mobile-tournaments.png` | Shows core tournament discovery |
| `desktop-tournament-detail.png` / `mobile-tournament-detail.png` | Shows bracket and tournament flow |
| `desktop-teams.png` / `mobile-teams.png` | Shows team/roster context |
| `desktop-account.png` / `mobile-account.png` | Shows Riot/account readiness UX |
| `desktop-admin.png` / `mobile-admin.png` | Shows operations center |
| `desktop-moderation.png` / `mobile-moderation.png` | Shows integrity/moderation workflow |

## Review checklist before sharing screenshots

- No API key visible.
- No private user data visible.
- Riot status is described as mock/development/pending unless formally approved.
- DS token language is internal/non-monetary.
- No misleading affiliation claim with Riot Games.
- Legal pages are reachable.
