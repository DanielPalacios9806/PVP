# Riot Submission Evidence Index

## Technical evidence

| Evidence | Location |
|---|---|
| Release readiness | npm run check:release |
| Riot readiness | npm run check:riot |
| Riot application package | npm run check:riotapp |
| Production health | npm run check:prodhealth |
| Beta launch readiness | npm run check:beta |
| Visual QA screenshots | npm run check:visual |
| Riot final submission | npm run check:riotsubmit |

## Product evidence

| Area | Evidence |
|---|---|
| Home | Public landing page available |
| Authentication | Login and register pages available |
| Dashboard | Private dashboard loads |
| Tournaments | Tournaments hub and detail pages load |
| Bracket | Interactive bracket supported through XYFlow |
| Teams | Teams area available |
| Account | Account + Riot status UX available |
| Admin/Ops | Admin command center available |
| Moderation | War room/integrity workflow available |
| Legal | Terms, Privacy and Data Deletion pages available |

## Visual QA evidence

Visual QA artifacts are generated locally under:

```text
visual-qa-artifacts/<run-id>/
```

Expected files:

- desktop-home.png
- desktop-login.png
- desktop-dashboard.png
- desktop-tournaments.png
- desktop-tournament-detail.png
- desktop-teams.png
- desktop-account.png
- desktop-admin.png
- desktop-moderation.png
- mobile-home.png
- mobile-login.png
- mobile-dashboard.png
- mobile-tournaments.png
- mobile-tournament-detail.png
- mobile-teams.png
- mobile-account.png
- mobile-admin.png
- mobile-moderation.png
- VISUAL_QA_REPORT.md
- manifest.json

## URLs

- Web staging: https://arena-os-web-staging-6x5f.onrender.com
- API staging: https://arena-os-api-staging.onrender.com/api
