# Riot Submission Final Checklist

## Objetivo

Este documento define el cierre operativo antes de enviar Darkside.cool a Riot Developer Portal para solicitar una Production API Key o una revisión formal del producto.

Nota: Arena OS es un codename interno heredado que puede aparecer en nombres de servicios Render y URLs staging históricas. El producto público es Darkside.cool.

## Estado mínimo requerido

- Web staging activa.
- API staging activa.
- Build local aprobado.
- `check:release` aprobado.
- `check:riot` aprobado.
- `check:riotapp` aprobado.
- `check:prodhealth` aprobado.
- `check:beta` aprobado.
- `check:visual` ejecutado con capturas desktop y mobile.
- `check:riotsubmit` aprobado.

## URLs de referencia

- Web staging: https://arena-os-web-staging-6x5f.onrender.com
- API staging: https://arena-os-api-staging.onrender.com/api
- Terms: https://arena-os-web-staging-6x5f.onrender.com/legal/terms
- Privacy: https://arena-os-web-staging-6x5f.onrender.com/legal/privacy
- Data deletion: https://arena-os-web-staging-6x5f.onrender.com/legal/data-deletion

## Antes de enviar a Riot

1. Rotar la RIOT_API_KEY diaria si apareció en consola, logs o capturas.
2. Confirmar que la key está únicamente en el servicio API/backend.
3. Confirmar que no existe NEXT_PUBLIC_RIOT_API_KEY.
4. Confirmar que Web y API usan HTTPS.
5. Confirmar que las rutas Riot protegidas responden 401/403 sin sesión.
6. Confirmar que el producto usa tokens internos no monetarios.
7. Confirmar que RSO y Tournament API avanzada están marcados como pendientes de aprobación Riot.
8. Confirmar que la solicitud no promete funciones que aún no están aprobadas.

## Comandos finales

```powershell
npm run build
npm run check:release
npm run check:riot
npm run check:riotapp
npm run check:beta
npm run check:prodhealth
$env:VISUAL_QA_BASE_URL="https://arena-os-web-staging-6x5f.onrender.com"
npm run check:visual
npm run check:riotsubmit
```

## Criterio de envío

Darkside.cool está listo para enviarse a Riot si todos los checks anteriores pasan y el equipo puede demostrar:

- Funcionamiento real del sitio.
- Valor para jugadores/organizadores.
- Manejo seguro de API keys.
- Cumplimiento de términos, privacidad y eliminación de datos.
- Uso controlado de Riot API desde backend.
- Alcance claro de funciones futuras que requieren aprobación.
