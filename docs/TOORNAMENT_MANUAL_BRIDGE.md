# Toornament Manual Bridge

## Objetivo

Usar Toornament Organizer como bracket externo provisional mientras Riot Tournament API sigue pendiente de aprobacion oficial.
Darkside.cool conserva login, equipos, perfiles, Riot mock/development, auditoria, evidencias, tokens internos y confirmacion operativa de resultados.

## Modo actual

- `TOORNAMENT_MODE=manual` conceptual, sin API obligatoria.
- No se requiere credencial Toornament para operar la beta.
- No se toca Riot Production ni Tournament API.
- No se implementan pagos, apuestas, crypto, skins betting ni premios monetarios falsos.

## Flujo operativo recomendado

1. Admin crea torneo en Darkside.cool.
2. Admin crea torneo espejo en Toornament Organizer.
3. Staff agrega participantes manualmente en Toornament.
4. Staff crea estructura/fase/bracket en Toornament.
5. Staff guarda URL/ID del torneo Toornament en el puente externo del torneo Darkside.
6. Staff guarda referencia de encuentro, URL de bracket, sala, password y horario en la match room Darkside.
7. Capitanes juegan la partida y reportan evidencia en Darkside.
8. Staff confirma el resultado usando `Confirmacion staff del bracket`.
9. Darkside guarda audit log y resuelve disputas abiertas.

## Mapeo temporal de datos

| Dato Toornament | Uso temporal en Darkside |
| --- | --- |
| Tournament ID / URL | `Tournament.externalTournamentId` / `Tournament.externalBracketUrl` |
| Participantes | Inscripciones aprobadas en Darkside |
| Match ID / referencia | `Match.externalMatchId` o campo `Codigo / referencia` de sala manual |
| Bracket URL del match | `Match.externalBracketUrl` |
| Nombre de sala | Campo `Nombre de sala` |
| Password / codigo lobby | Campo `Contrasena de sala` |
| Horario | Campo `scheduledAt` del match |
| Resultado validado | Confirmacion staff con fuente `TOORNAMENT_MANUAL` |

## Limites del plan gratis

El plan Free de Toornament debe tratarse como apoyo para torneos pequenos. Si el torneo supera los limites del plan, se debe planificar upgrade, importacion CSV/API o migracion a Riot Tournament API cuando sea aprobada.

## Seguridad

- Solo `ADMIN` y `SUPER_ADMIN` ven el puente Toornament en el panel administrativo.
- `MODERATOR`, `ADMIN`, `SUPER_ADMIN` pueden operar salas y disputas segun permisos existentes.
- Usuarios normales no crean brackets externos ni confirman resultados oficiales.
- Toda confirmacion staff queda en audit log.

## Persistencia implementada

- `Tournament.externalProvider`
- `Tournament.externalTournamentId`
- `Tournament.externalBracketUrl`
- `Match.externalProvider`
- `Match.externalMatchId`
- `Match.externalBracketUrl`
- Endpoint staff: `PATCH /api/tournaments/:id/external-bridge`
- Endpoint staff existente ampliado: `PATCH /api/matches/:id/lobby`
- Endpoint staff de importacion: `POST /api/tournaments/:id/toornament/import`

## Importacion manual / CSV

Desde el panel admin se puede pegar CSV simple para participantes y matches. El import no crea usuarios ni equipos nuevos: solo resuelve participantes existentes y devuelve filas `unresolved` para corregir manualmente.

El parser acepta:

- Separador coma, punto y coma o tab.
- Celdas entre comillas.
- Headers en ingles o espanol, por ejemplo `team`, `equipo`, `match id`, `codigo`, `fecha`.
- Vista previa con `dryRun=true` antes de escribir datos.

Participantes:

```csv
name,email,teamName,teamTag,externalParticipantId
Dark Ravens,,Dark Ravens,DRV,toornament-participant-1
```

Matches:

```csv
roundName,externalMatchId,home,away,scheduledAt,lobbyCode,externalBracketUrl
Ronda 1,match-001,Dark Ravens,Blue Phoenix,2026-06-15T20:00:00.000Z,ROOM-001,https://organizer.toornament.com/...
```

Modos:

- `dryRun=true`: previsualiza creaciones/errores sin escribir datos.
- `dryRun=false`: confirma inscripciones existentes, crea bracket/rondas si hace falta y crea o actualiza matches por `externalMatchId`.

## Siguiente fase

- Evaluar Toornament Organizer API si el plan y credenciales lo permiten.
- Agregar una vista de historial de importaciones si el volumen operativo crece.
