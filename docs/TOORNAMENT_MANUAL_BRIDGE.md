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
5. Staff copia URL/ID del torneo Toornament en notas operativas del torneo Darkside.
6. Staff copia referencias de encuentro, sala, password y horario en la match room Darkside.
7. Capitanes juegan la partida y reportan evidencia en Darkside.
8. Staff confirma el resultado usando `Confirmacion staff del bracket`.
9. Darkside guarda audit log y resuelve disputas abiertas.

## Mapeo temporal de datos

| Dato Toornament | Uso temporal en Darkside |
| --- | --- |
| Tournament ID / URL | Reglas, descripcion o nota operativa del torneo |
| Participantes | Inscripciones aprobadas en Darkside |
| Match ID / referencia | Campo `Codigo / referencia` de sala manual |
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

## Siguiente fase

- Persistir `externalProvider`, `externalTournamentId`, `externalBracketUrl` y `externalMatchId` con migracion Prisma controlada.
- Agregar import manual/CSV de participantes y matches.
- Evaluar Toornament Organizer API si el plan y credenciales lo permiten.
