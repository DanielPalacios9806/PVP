# Riot Application Checklist

## Before requesting production access

- [ ] Web application is live over HTTPS.
- [ ] API service is live over HTTPS.
- [ ] Terms of Service is visible.
- [ ] Privacy Policy is visible.
- [ ] Data deletion page is visible.
- [ ] `npm run check:release` passes.
- [ ] `npm run check:riot` passes or only has accepted non-blocking warnings.
- [ ] `npm run check:prodhealth` passes against deployed services.
- [ ] `npm run check:visual` has generated fresh screenshots.
- [ ] No API key appears in frontend code, screenshots, docs, commits or logs.
- [ ] Any exposed development key has been rotated.
- [ ] Riot account ownership language is clear: lookup is not RSO verification.
- [ ] DS tokens are documented as internal and non-monetary.
- [ ] Admin/Ops and moderation flows are demonstrable.
- [ ] Tournament API remains disabled until approved.

## Submission package

- [ ] `RIOT_APPLICATION_PACKAGE.md`
- [ ] `RIOT_API_USAGE_MAP.md`
- [ ] `RIOT_COMPLIANCE_MATRIX.md`
- [ ] `RIOT_DEMO_SCRIPT.md`
- [ ] `RIOT_SCREENSHOT_EVIDENCE.md`
- [ ] `RIOT_PRODUCTION_REQUEST_DRAFT.md`

## After approval

- [ ] Store production key only in backend API environment.
- [ ] Configure RSO callback only through approved Riot instructions.
- [ ] Test production health after each env change.
- [ ] Keep mock/development fallback available.
- [ ] Update docs with approved scope and limitations.
