# Main release bridge

## Propósito

Este puente documenta cómo pasar la experiencia pre-beta de `feat/external-ui-fusion` a `main` con controles técnicos, Riot readiness y smoke test.

## Alcance del macroparche 2X-K

Incluye:

- Script `check:riot` para validar Riot sin exponer la key.
- Script `check:prebeta` para smoke test web/API.
- Checklist de variables Render.
- Flujo de rotación de `RIOT_API_KEY`.
- Controles extra en `check:release`.
- Ajustes menores de documentación para cerrar la fase visual.

No incluye:

- Valores reales de `.env`.
- API keys.
- Cambios de Prisma schema.
- Migraciones nuevas.
- Rediseño grande de UI.

## Comandos de cierre

```powershell
npm run build
npm run check:release
npm run check:riot
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

Con servidores locales:

```powershell
npm run dev
npm run check:prebeta
```

## Comando de push seguro

```powershell
git add .
git commit -m "chore: add pre-beta release bridge and Riot readiness"
git push origin main
```

## Rollback

Si Render falla después del push:

```powershell
git log --oneline -5
git revert <commit_del_merge_o_release_bridge>
git push origin main
```

También puedes dejar `RIOT_API_MODE=mock` en Render API para volver a demo estable sin depender de la key diaria.
