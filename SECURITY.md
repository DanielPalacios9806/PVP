# Security Policy & Guidelines

## Overview

This document outlines security best practices, secret management, and incident response procedures for the eSports Platform.

---

## Secret Management

### Never Commit to Repository

The following MUST NEVER be committed to Git:

- `.env` files with real values
- AWS/Azure/GCP credentials
- Private SSH keys
- API keys (Riot, Discord, Stripe, etc.)
- Database passwords
- JWT secrets
- OAuth tokens
- Certificates (private keys)

### Files to Never Commit

```
.env
.env.local
.env.server
.env.render
.env.production
*.pem
*.key
id_rsa
id_rsa.pub
secrets.json
credentials.json
```

These are already in `.gitignore`. **Verify before committing**:
```bash
git status  # Ensure .env files don't appear
git diff --staged  # Check staged changes for secrets
```

### How to Handle Secrets

**Development**:
```bash
# Create local .env from template
cp .env.example .env
# Edit with real local values (not committed)
nano .env
```

**GitHub Actions**:
```bash
# Store in GitHub Secrets (encrypted)
# Accessed in workflows via ${{ secrets.SECRET_NAME }}
```

**Ubuntu Production**:
```bash
# Store in /opt/pvp-os/env/.env.server (not in Git)
# File permissions: 600 (owner read/write only)
chmod 600 /opt/pvp-os/env/.env.server
```

**Render**:
```bash
# Set in Render Dashboard → Service → Environment
# Stored encrypted in Render
```

### Rotate Secrets Regularly

- **JWT_SECRET**: Every 3 months (invalidates active sessions)
- **POSTGRES_PASSWORD**: Every 6 months
- **API Keys** (Riot, etc.): Per provider recommendations

**Process to rotate JWT_SECRET**:
1. Generate new secret: `openssl rand -base64 32`
2. Update in GitHub Secrets
3. Update in Ubuntu `.env.server`
4. Restart API services: `docker compose restart api`
5. Users will need to re-login (existing tokens invalid)

---

## Environment Variables

### Frontend (NEXT_PUBLIC_*)

⚠️ **WARNING**: These ARE sent to browser. Never put secrets here.

**Safe to expose**:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_DOMAIN`
- `NEXT_PUBLIC_SENTRY_DSN` (if using error tracking)

**Example**:
```
NEXT_PUBLIC_API_URL=https://api.ejemplo.com/api
```

### Backend (not prefixed with NEXT_PUBLIC_)

These are server-side only. Safe for secrets:
- `DATABASE_URL`
- `JWT_SECRET`
- `RIOT_API_KEY`
- `POSTGRES_PASSWORD`

**Example**:
```
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=super-secret-string
```

---

## Authentication & Authorization

### JWT (JSON Web Tokens)

**How it works**:
1. User logs in with email + password
2. Backend validates against hashed password
3. Backend issues JWT token with user claims (id, role, email)
4. Frontend stores JWT in localStorage
5. Frontend sends JWT in `Authorization: Bearer <token>` header
6. Backend validates JWT signature and expiration

**Security**:
- JWT_SECRET is symmetric (keep private)
- JWT expires in 7 days (configurable)
- Passwords are hashed with bcryptjs (10 rounds)
- No plain passwords stored

**Token Expiration Flow**:
```
User logs in → Backend issues 7-day token
           ↓
User uses app → Token valid
           ↓
After 7 days → Token expired
           ↓
User forced to re-login
```

### Password Requirements

Users must follow:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

**Validation** (backend, `apps/api/src/modules/auth/auth.schemas.ts`):
```typescript
password: z.string()
  .min(8)
  .regex(/[A-Z]/, "Debe contener mayuscula")
  .regex(/[0-9]/, "Debe contener numero")
  .regex(/[!@#$%^&*]/, "Debe contener caracter especial")
```

### Roles & Permissions

**Roles**:
- `USER`: Basic player
- `ORGANIZER`: Can create tournaments
- `MODERATOR`: Can review disputes
- `ADMIN`: Full platform access
- `FINANCE`: Handles rewards/payouts (future)

**Authorization** (route middleware):
```typescript
app.post('/tournaments', requireRole('ADMIN', 'ORGANIZER'), createTournament)
```

Unauthenticated requests get 401. Insufficient role gets 403.

---

## Database Security

### SQL Injection Prevention

✅ **Using Prisma ORM** (PROTECTED):
```typescript
// Safe - uses prepared statements
const user = await prisma.user.findUnique({
  where: { email: userInput }
})
```

❌ **Raw SQL** (VULNERABLE):
```typescript
// Dangerous - don't do this
const user = await db.query(`SELECT * FROM users WHERE email = '${userInput}'`)
```

**Rule**: Use Prisma methods. If you need raw SQL, use parameterized queries:
```typescript
const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`
```

### Database Access Control

- **Production DB**: Only accessible from API container (Docker network)
- **Staging DB (Supabase)**: Connection string restricted to Render API service
- **Development**: Local PostgreSQL in Docker

**Credentials**:
- Never share `DATABASE_URL` in public repos
- Rotate `POSTGRES_PASSWORD` every 6 months
- Use read-only users for reporting tools if needed

### Backup Encryption

Backups are stored at `/opt/pvp-os/backups/`:
- Should be encrypted at rest (if stored externally)
- Access restricted to `deploy` user only

**Backup encryption** (future):
```bash
# Encrypt backup before sending to S3
gpg --encrypt --recipient admin@example.com backup-20260518.sql
```

---

## API Security

### CORS (Cross-Origin Resource Sharing)

**Configured** in backend via environment variable:
```
CORS_ORIGIN=https://app.ejemplo.com
```

**How it works**:
1. Browser sends `Origin` header with request
2. Backend checks if `Origin` matches `CORS_ORIGIN`
3. If match, allows request. Otherwise, rejects.

**Prevents**: JavaScript from other domains calling API directly

### Rate Limiting (Future)

Planned via Redis:
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per 15 minutes
})
app.use('/api/', limiter)
```

### HTTPS/TLS

**Required**: All connections must be HTTPS.

**Enforcement**:
- Caddy automatically redirects HTTP → HTTPS
- Let's Encrypt certificates auto-renew
- No unencrypted data transmission

---

## API Keys (Third-party)

### Riot API Key

- **Where stored**: Only in backend `.env`, never frontend
- **Usage**: Tournament validation, player data fetching
- **Rotation**: Per Riot's guidelines
- **Leak response**: Revoke key immediately, regenerate

**Implementation**:
```typescript
// Backend only
const riotApiKey = process.env.RIOT_API_KEY
const response = await fetch(`https://americas.api.riotgames.com/lol/...`, {
  headers: { 'X-Riot-Token': riotApiKey }
})
```

**Never expose to frontend** (use backend proxy):
```typescript
// ❌ Frontend: DON'T DO THIS
fetch(riotApiUrl, { headers: { 'X-Riot-Token': apiKey } })

// ✅ Frontend: Call your API
fetch('/api/riot/player-data', { /* your API calls your Riot API */ })

// ✅ Backend: Call Riot with key
app.get('/api/riot/player-data', async (req, res) => {
  const riot = await fetch(riotApiUrl, {
    headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
  })
  res.json(riot.data)
})
```

---

## Code Security

### Dependency Vulnerabilities

**Scanning**:
```bash
# Check for vulnerabilities in dependencies
npm audit

# Fix automatically (if patches available)
npm audit fix

# Detailed report
npm audit --detailed
```

**In CI/CD** (GitHub Actions):
- Every push runs npm audit
- Workflow fails if HIGH/CRITICAL vulns found
- Team must fix before merge

### Input Validation

**Always validate** user input:

```typescript
// ✅ Using Zod schemas (backend)
const createTournamentSchema = z.object({
  name: z.string().min(1).max(100),
  format: z.enum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN']),
  maxTeams: z.number().int().min(2).max(1000),
})

const data = createTournamentSchema.parse(req.body) // Throws if invalid
```

**Frontend validation**:
```typescript
// React form with validation
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })
  // ...
}
```

### Error Handling

**Do NOT expose internal errors to client**:

```typescript
// ❌ Bad: leaks stack trace
app.get('/api/data', async (req, res) => {
  try {
    const data = await db.query(req.body.id)
    res.json(data)
  } catch (error) {
    res.status(500).json(error) // Exposes error details
  }
})

// ✅ Good: generic error message
app.get('/api/data', async (req, res) => {
  try {
    const data = await db.query(req.body.id)
    res.json(data)
  } catch (error) {
    console.error(error) // Log internally
    res.status(500).json({ message: 'Internal server error' }) // Generic
  }
})
```

---

## Incident Response

### Potential Incidents

1. **Leaked Secret** (API key, password)
2. **SQL Injection Attack**
3. **Unauthorized Access** (account compromise)
4. **Data Breach**
5. **DDoS Attack**
6. **Ransomware/Malware**

### Response Process

**Immediate (0-1 hour)**:
1. Identify incident type
2. Notify team (Slack, email)
3. Take system offline if necessary
4. Preserve logs (don't delete)
5. Contact infrastructure provider (if needed)

**Short-term (1-24 hours)**:
1. Investigate: what, when, who affected
2. Contain: prevent spread/further compromise
3. Rotate affected secrets
4. Notify users (if data exposed)
5. Deploy patch if applicable

**Long-term (24+ hours)**:
1. Post-mortem: what went wrong
2. Implement preventive measures
3. Update security policies
4. Monitor for similar incidents
5. Close incident ticket

### Example: Leaked JWT_SECRET

**Response**:
1. Announce incident to team
2. Generate new JWT_SECRET: `openssl rand -base64 32`
3. Update in GitHub Secrets
4. Update in Ubuntu `.env.server`
5. Restart API: `docker compose restart api`
6. Notify users: "Please log in again"
7. Monitor for unauthorized access attempts
8. Review API logs for suspicious activity from the past 7 days

---

## Compliance & Legal

### Data Handling

- **User Data**: Stored encrypted in PostgreSQL
- **Payment Info**: NOT stored (future external provider)
- **Audit Logs**: All actions logged to DB
- **Deletion**: Users can request data deletion (GDPR)

### Terms & Privacy

- Create Privacy Policy (data we collect, how we use it)
- Create Terms of Service (user responsibilities, limitations)
- Data retention: document how long we keep data

### Gaming Compliance

- **No gambling**: Platform explicitly does NOT allow wagering/betting
- **No money**: Tokens are non-monetary
- **Age**: Recommend 13+ (COPPA compliance for US)
- **Fraud prevention**: Monitor for fraudulent accounts/tournaments

---

## DevOps Security

### SSH Access

- Use key-based authentication (no passwords)
- Private keys stored in GitHub Secrets
- Access logs monitored
- Rotate keys every 6 months

### Docker Security

- Use official base images (`node:22-bookworm-slim`)
- Run as non-root user (Dockerfile: `USER node`)
- Scan images for vulnerabilities: `docker scan image-name`
- Update base images regularly

### Firewall

**Ubuntu Server**:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# View rules
sudo ufw status verbose
```

Only allow necessary ports.

---

## Best Practices Checklist

- [ ] No secrets in .git history
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enforced everywhere
- [ ] Database password rotated in last 6 months
- [ ] JWT_SECRET rotated in last 3 months
- [ ] API keys (Riot, etc.) securely stored
- [ ] Input validation on all endpoints
- [ ] Error handling doesn't leak internals
- [ ] Rate limiting in place (or planned)
- [ ] Backups tested and working
- [ ] SSH keys restricted to necessary users
- [ ] CI/CD checks for vulnerabilities
- [ ] Team trained on security practices

---

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- Prisma Security: https://www.prisma.io/docs/concepts/components/prisma-client/advanced-usage/security
- PostgreSQL Security: https://www.postgresql.org/docs/current/sql-syntax.html#SQL-SYNTAX-IDENTIFIERS
