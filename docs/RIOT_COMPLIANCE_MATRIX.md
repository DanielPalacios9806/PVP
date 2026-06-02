# Riot Compliance Matrix - Darkside.cool

## Purpose

This matrix tracks the product controls that matter before a Riot Developer Portal production request. It should be reviewed before every formal submission.

| Requirement / concern | Darkside status | Evidence |
|---|---|---|
| Functioning website exists | Compliant for staging | Render Web staging live |
| API service exists | Compliant for staging | Render API staging live |
| HTTPS used | Compliant | Render Web/API HTTPS URLs |
| Terms of Service visible | Compliant | `/legal/terms` |
| Privacy Policy visible | Compliant | `/legal/privacy` |
| Data deletion page visible | Compliant | `/legal/data-deletion` |
| API key not committed | Compliant | `check:release` secret scan |
| API key not exposed in frontend | Compliant | `check:riot`, no `NEXT_PUBLIC_RIOT_API_KEY` |
| Riot API calls go through backend | Compliant | API routes and backend config |
| Protected Riot routes | Compliant | Smoke test returns `401` without session |
| RSO ownership language | Controlled | Account UX distinguishes readiness vs verified ownership |
| Tournament API enabled | Pending Riot approval | `RIOT_TOURNAMENT_API_ENABLED=false` for pre-beta |
| Tournament callback | Prepared, not public production | callback docs and route planning |
| No gambling / betting | Compliant by policy | Terms/docs and DS token policy |
| DS tokens are non-monetary | Compliant | Admin token panel and docs |
| Production key use per product | Planned | one product scope: Darkside.cool / Arena OS |
| Visual product evidence | Compliant | Playwright visual QA screenshots |
| Runtime health | Compliant | `/api/health/runtime` |
| Database readiness | Compliant | `/api/health/readiness` |
| Rollback procedure | Compliant | Incident rollback runbook |

## Remaining approval-dependent items

- Riot production key approval.
- RSO/OAuth client approval and callback configuration.
- Tournament API / provider / tournament code approval.
- Final production domain mapping if moving from staging to `darkside.cool` / `api.darkside.cool`.

## Submission rule

Do not submit a formal Riot production request while a development API key has been exposed in chat, screenshots, logs or tickets. Rotate the key first, then update local and Render API secrets.
