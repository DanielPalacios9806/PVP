# Beta Rollback and Support Runbook

## Objetivo

Definir qué hacer si el despliegue beta presenta errores críticos.

## Severidad

| Nivel | Descripción | Acción |
|---|---|---|
| S1 | Web/API caída o login inutilizable | Rollback inmediato |
| S2 | API viva pero DB no lista | Revisar Supabase, pooler y variables |
| S3 | Riot falla por key expirada | Cambiar a `RIOT_API_MODE=mock` o rotar key |
| S4 | Error visual no bloqueante | Registrar issue y parchear |
| S5 | Texto/copy incorrecto | Corregir en siguiente patch |

## Comandos de diagnóstico

```powershell
npm run check:release
npm run check:riot
npm run check:riotapp
npm run check:prodhealth
npm run check:beta
```

## Smoke remoto

```powershell
$env:SMOKE_WEB_URL="https://arena-os-web-staging-6x5f.onrender.com"
$env:SMOKE_API_URL="https://arena-os-api-staging.onrender.com/api"

npm run check:prebeta
npm run check:prodhealth
```

## Rollback Git

```powershell
git checkout main
git log --oneline -5
git revert <commit_problematico>
git push origin main
```

## Fallback Riot

Si la key diaria expira o Riot devuelve errores no críticos:

```text
RIOT_API_MODE=mock
RIOT_TOURNAMENT_API_ENABLED=false
```

## Fallback DB

Si `/api/health/readiness` falla:

1. Revisar Supabase.
2. Revisar `DATABASE_URL`.
3. Revisar `DIRECT_URL` si aplica.
4. Revisar allowlist/red.
5. Revisar migraciones.

