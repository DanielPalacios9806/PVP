# Incident Rollback Runbook

## Objetivo

Tener un procedimiento corto para volver a un estado estable si Render, Supabase o Riot API fallan durante pre-beta.

## Señales de incidente

- Web no carga.
- API `/api/health` no responde.
- `/api/health/readiness` devuelve 503 por varios minutos.
- Riot API falla por key vencida o rate limit.
- Login o dashboard fallan después de deploy.

## Diagnóstico rápido

```powershell
git log --oneline -5
npm run check:release
npm run check:riot
$env:SMOKE_WEB_URL="https://arena-os-web-staging-6x5f.onrender.com"
$env:SMOKE_API_URL="https://arena-os-api-staging.onrender.com/api"
npm run check:prodhealth
```

## Rollback por Git

```powershell
git checkout main
git pull origin main
git revert <commit_problematico>
git push origin main
```

## Rollback operativo Riot

Si Riot API diaria venció o causa fallos:

```text
RIOT_API_MODE=mock
RIOT_TOURNAMENT_API_ENABLED=false
```

Luego redeploy del servicio API.

## Rollback Supabase

Si Supabase no responde:

1. Validar desde local:

```powershell
npx prisma migrate status --schema prisma/schema.prisma
```

2. Revisar Dashboard de Supabase.
3. No aplicar migraciones nuevas hasta recuperar conexión.
4. Mantener Web online si API está parcialmente degradada.

## Cierre del incidente

- Documentar commit afectado.
- Documentar variable corregida.
- Ejecutar `check:prodhealth`.
- Confirmar Render Web y API live.
