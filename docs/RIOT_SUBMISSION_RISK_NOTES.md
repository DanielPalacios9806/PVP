# Riot Submission Risk Notes

## Known risks before formal submission

### Development API key rotation

A Riot development API key has a limited lifetime and must be rotated for fresh tests. If the key appeared in console output or logs during development, rotate it before any formal review.

### RSO approval

Riot Sign On is documented as future scope. It should not be represented as production-ready until Riot grants the required production-level access and OAuth/RSO setup.

### Tournament API approval

Tournament API production behavior is future scope and requires Riot approval. Darkside currently documents this as a planned operational capability.

### Staging URLs

The current environment uses Render staging URLs. For a stronger production request, a custom domain such as darkside.cool should be connected and verified.

### Token wording

DS_TOKEN is an internal non-monetary participation and audit token. Avoid wording that implies cryptocurrency, cash value, trading, wagering or financial rewards.

### Privacy and legal

Terms, Privacy and Data Deletion pages must stay reachable before submission.

## Mitigation checklist

- Rotate Riot development key.
- Confirm no secrets in GitHub.
- Confirm HTTPS.
- Confirm backend-only Riot calls.
- Confirm legal pages.
- Confirm smoke tests.
- Confirm visual screenshots.
- Confirm demo script.
- Confirm production request draft.
