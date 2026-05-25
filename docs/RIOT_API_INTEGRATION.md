# Integracion Riot API - Darkside.cool

## Estado actual

Darkside.cool mantiene el login propio de la plataforma. Riot Sign On no se activa hasta contar con aprobacion de Production Key/RSO. La vinculacion actual de Riot ID puede operar en:

- `mock`: no llama a Riot Games.
- `development`: permite llamadas backend con Development API Key.
- `production`: reservado para Production API Key aprobada.

La API key nunca debe ir en frontend, HTML, React, `NEXT_PUBLIC_*`, repositorio ni logs.

## Variables de entorno

```bash
RIOT_API_MODE=mock
RIOT_API_KEY=
RIOT_REGION=la1
RIOT_REGIONAL_ROUTE=americas
RIOT_API_TIMEOUT_MS=8000
RIOT_TOURNAMENT_API_ENABLED=false
RIOT_TOURNAMENT_PROVIDER_ID=
RIOT_TOURNAMENT_CALLBACK_SECRET=
RIOT_CALLBACK_URL=https://api.darkside.cool/api/riot/tournament/callback
RIOT_TOURNAMENT_ID=
```

Compatibilidad temporal:

- `RIOT_MODE` se acepta como alias antiguo de `RIOT_API_MODE`.
- `RIOT_PLATFORM` y `RIOT_REGION=AMERICAS` antiguos se normalizan, pero deben migrarse al formato nuevo.

## Regla de seguridad inmediata

Si una API key fue pegada en chat, ticket, screenshot o repositorio, se considera comprometida. Debe revocarse y regenerarse desde Riot Developer Portal antes de usarla.

## Flujo Standard API

1. Usuario ingresa `gameName` y `tagLine`.
2. Backend llama a Riot desde `apps/api`.
3. Se consulta cuenta por Riot ID en ruta regional.
4. Si aplica, se consulta Summoner por PUUID en ruta plataforma.
5. Se guarda `UserGameAccount` con `verificationStatus`.
6. Se registra auditoria interna.

## Flujo Tournament API preparado

1. Crear Provider con callback HTTPS.
2. Crear Tournament Riot asociado al torneo local.
3. Generar Tournament Code solo cuando el match este programado o listo.
4. Guardar `RiotTournamentCode` asociado a un unico match.
5. Riot llama a `POST /api/riot/tournament/callback`.
6. Backend valida metadata con `RIOT_TOURNAMENT_CALLBACK_SECRET`.
7. Se guarda `RiotCallbackEvent`.
8. Se actualiza el match como callback recibido.
9. El avance de bracket se realiza solo cuando el resultado sea confiable y auditable.

## Rate limits y errores

El cliente centralizado:

- Usa header `X-Riot-Token` solo en backend.
- Maneja `400`, `401`, `403`, `404`, `415`, `429`, `500` y `503`.
- Lee `Retry-After` en `429`.
- Registra endpoint, metodo, status, duracion, region, usuario interno, torneo, match y error.
- No guarda ni imprime la API key.

## Endpoints internos agregados o preparados

Admin:

- `GET /api/admin/riot/overview`
- `GET /api/admin/riot/logs`
- `POST /api/admin/riot/test-connection`

Riot usuario/match:

- `GET /api/riot/status`
- `POST /api/riot/accounts/link`
- `GET /api/riot/accounts/me`
- `DELETE /api/riot/accounts/:id`
- `POST /api/riot/matches/:matchId/code`
- `POST /api/riot/tournament/callback`

## Callback simulado con curl

En modo `mock`, si no hay `RIOT_TOURNAMENT_CALLBACK_SECRET`, solo se aceptan callbacks con metadata de pruebas creada por el sistema. En desarrollo/produccion, la metadata debe incluir firma valida.

Ejemplo estructural:

```bash
curl -X POST https://api.darkside.cool/api/riot/tournament/callback \
  -H "Content-Type: application/json" \
  -d '{"metadata":"{\"nonce\":\"NONCE_DEL_CODE\",\"signature\":\"FIRMA_HMAC\"}","gameId":"123456789"}'
```

## Checklist antes de Production API Key

- Dominio HTTPS funcionando: `darkside.cool` y `api.darkside.cool`.
- API key solo como secreto en Render.
- Footer con disclaimer Riot visible.
- Sin gambling, apuestas, skins betting, cripto o blockchain.
- Sin datos en vivo que den ventaja competitiva durante partida.
- Torneos con reglas claras, condiciones de victoria transparentes y evidencia auditada.
- Minimo recomendado de 20 participantes para torneos aplicables.
- Si existiera inscripcion pagada futura, minimo 70% al prize pool y cumplimiento legal antes de cobrar.
- Logs Riot revisables desde admin.
- Callback validado con secreto/metadata.
- Riot Sign On apagado hasta aprobacion formal.

## Pendientes tecnicos

- Crear provider real desde admin cuando Riot apruebe acceso.
- Asociar provider/tournament real por torneo local.
- Definir politica de reintentos asincronos si `Retry-After` supera el timeout operativo.
- Agregar tests automatizados para callback invalido, 429 y permisos de tournament code.
