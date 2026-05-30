# RIOT_INTEGRATION_PLAN.md

## Objetivo

Preparar integración controlada con Riot sin comprometer seguridad ni estabilidad.

## Principios

- La API key de Riot solo debe estar en backend.
- No exponer claves en frontend.
- Registrar auditoría de consultas.
- Manejar rate limits.
- No depender de Riot para que el MVP funcione.
- El flujo manual debe seguir funcionando como respaldo.

## Fase 6.1 — Preparación Riot

- Crear servicio backend para Riot.
- Validar variables de entorno.
- Crear endpoint interno de salud Riot.
- Registrar errores y rate limits.
- No activar Tournament API todavía.

## Fase 6.2 — Vincular cuenta Riot

- Permitir que el usuario registre Riot ID.
- Validar formato.
- Consultar información básica.
- Guardar identificador seguro.
- Mostrar estado de vinculación en perfil.

## Fase 6.3 — Asociar Riot ID a inscripción

- Al inscribirse a torneo LoL/Valorant, solicitar Riot ID.
- Validar que el usuario tenga cuenta vinculada.
- Mostrar advertencia si falta Riot ID.

## Fase 6.4 — Resultados y verificación

- Mantener reporte manual.
- Usar Riot como verificación auxiliar.
- No bloquear el torneo si Riot falla.
- Registrar auditoría de validaciones.

## Fase 6.5 — Tournament API

Antes de solicitar producción a Riot:

- Tener dominio estable.
- Tener políticas legales visibles.
- Tener flujo de torneo claro.
- Tener moderación.
- Tener sistema antiabuso básico.
- Tener documentación técnica.
- Tener justificación universitaria/comunitaria.

## Nota

La integración Riot debe entrar después de estabilizar el MVP manual.

## Nota crítica sobre vinculación de cuentas

La validación por Riot ID (`gameName#tagLine`) solo confirma que la cuenta existe en Riot. No confirma que el usuario de Darkside.cool sea el dueño de esa cuenta.

Estados recomendados:

- `LOOKUP_ONLY`: Riot ID existe, pero propiedad no confirmada.
- `MANUAL`: validación interna/manual para pruebas.
- `RSO_PENDING`: Darkside está listo para Riot Sign On, pero falta aprobación/configuración.
- `RSO_VERIFIED`: cuenta vinculada oficialmente mediante Riot Sign On.

Para torneos serios, la inscripción debería exigir `RSO_VERIFIED` cuando Riot apruebe RSO. Mientras tanto, el modo `LOOKUP_ONLY` solo debe usarse para pruebas controladas y debe mostrarse claramente al usuario.

## Flujo RSO recomendado

1. Usuario presiona **Conectar con Riot**.
2. Darkside genera `state` seguro.
3. Darkside redirige al login oficial de Riot.
4. El usuario inicia sesión y autoriza la aplicación.
5. Riot redirige al callback configurado.
6. Darkside intercambia el código por token.
7. Darkside consulta la cuenta autenticada.
8. Darkside guarda Riot ID, PUUID y marca `ownershipVerified=true`.

No se debe usar iframe para el login oficial. Para MVP, se recomienda redirección completa; una ventana emergente puede implementarse después.


## Fase 6.4 — Requisitos Riot para inscripción

Para torneos de League of Legends y VALORANT, Darkside debe revisar el estado Riot antes de permitir inscripción.

Estados permitidos en MVP:

- `LOOKUP_ONLY` / `RSO_PENDING`: el Riot ID existe y puede usarse en pruebas internas, pero la propiedad oficial no está confirmada.
- `RSO_VERIFIED`: estado futuro para cuenta oficialmente vinculada con Riot Sign On.

Regla actual de MVP:

- Si el torneo es LoL/VALORANT y el usuario no tiene Riot ID validado técnicamente, se bloquea la inscripción y se redirige a Mi cuenta.
- Si el usuario tiene Riot ID validado técnicamente, se permite inscripción con advertencia visual.
- Para equipos, todos los miembros del equipo deben tener Riot ID validado técnicamente antes de inscribir el roster.

Regla futura para producción competitiva:

- Cuando Riot apruebe RSO, los torneos oficiales podrán exigir `RSO_VERIFIED` para confirmar propiedad real de la cuenta.


## Fase 6.4.5 — Riot API Compatibility Spike

Antes de automatizar torneos con Riot, Darkside debe comprobar qué endpoints responde realmente la key activa.

Endpoint interno recomendado:

- `POST /api/riot/capabilities/check`

Capacidades revisadas:

- `account-v1`: valida Riot ID y PUUID.
- `summoner-v4`: obtiene `profileIconId`, `summonerLevel` y datos básicos LoL.
- `league-v4`: obtiene colas rankeadas por PUUID, tier, división, LP, wins/losses y winrate.
- `match-v5`: obtiene historial reciente y una partida de muestra.
- RSO: queda marcado como requisito de Production Key/aprobación Riot.
- Tournament Codes: queda marcado como futuro mientras no exista provider/callback aprobado.

Esta fase no confirma propiedad de cuenta. Solo documenta compatibilidad técnica de la API y ayuda a decidir qué partes pueden alimentar el dashboard competitivo.

## Fase 6.4.6 — Capa visual Riot/Data Dragon

Objetivo: mejorar el dashboard competitivo con datos visuales reales de League of Legends sin afirmar una afiliación oficial con Riot.

Implementaciones previstas:

- Uso de Data Dragon para íconos de perfil, campeones e items.
- Uso de League-V4 por PUUID para mostrar SoloQ/Flex, LP, victorias y derrotas.
- Uso de Match-V5 para historial reciente, campeón, KDA, posición y resultado.
- Uso de Recharts para radar de rendimiento.
- Uso de assets propios de Darkside para shields, placeholders y badges.

Reglas:

- No usar logos oficiales de Riot como marca principal de Darkside.
- Mantener la advertencia de que la propiedad oficial de cuenta requiere Riot Sign On.
- Mantener un fallback si Riot API falla, vence la development key o hay rate limit.

## Fase 6.4.7 — RSO readiness y solicitud Riot

Objetivo: preparar Darkside.cool para solicitar Production Key y Riot Sign On sin ejecutar OAuth real antes de la aprobacion.

Endpoints internos:

- `GET /api/riot/rso/status`: estado de RSO y variables faltantes.
- `GET /api/riot/rso/start`: placeholder seguro; no redirige si falta aprobacion.
- `GET /api/riot/rso/callback-preview`: contrato esperado del callback OAuth.
- `GET /api/riot/compliance/readiness`: checklist operativo para Riot review.

Reglas:

- No afirmar propiedad oficial hasta `RSO_VERIFIED`.
- Mantener `LOOKUP_ONLY` solo como validacion tecnica interna.
- No activar Tournament Codes reales antes de provider/callback aprobado.
- Mantener politica de privacidad, terminos, eliminacion de datos y disclaimer Riot visibles.

El objetivo de esta fase es que el panel admin muestre claramente que Darkside tiene MVP funcional, politicas, seguridad de API key, auditoria, separacion lookup/ownership y callback RSO preparado.

## Fase 6.5 — Automatización simulada de torneos

Antes de activar Tournament Codes reales, Darkside opera un flujo competitivo simulado:

- inscripción abierta y cierre de registro;
- check-in opcional;
- generación de bracket;
- creación de match rooms;
- código de sala manual/simulado;
- reporte de resultado con evidencia;
- aceptación, disputa o resolución por staff;
- avance automático de bracket al confirmar resultado.

Este flujo permite demostrar a Riot que la plataforma ya tiene operación competitiva, moderación y trazabilidad antes de solicitar Production Key, RSO y Tournament API real.


## Fase 6.6 — Tournament callback sandbox

Objetivo: preparar el flujo de resultados automáticos antes de usar Tournament Codes reales.

- Endpoint sandbox: `POST /api/riot/tournament/callback/sandbox`.
- Acceso: ORGANIZER, ADMIN o SUPER_ADMIN autenticado.
- Entrada: `matchId`, `winningSide` o `winnerRegistrationId`, marcador y `riotGameId` opcional.
- Efecto: registra `RiotCallbackEvent`, crea `MatchResult` confirmado, marca el match como completado, asigna ganador y dispara avance de bracket.
- Seguridad: se marca como `MOCK_RIOT`, no como callback oficial de Riot.
- Propósito: validar arquitectura de callbacks sin depender de Production Key ni Tournament Codes reales.

Cuando Riot apruebe Production Key y Tournament API, este flujo servirá como base para reemplazar el payload sandbox por el callback oficial firmado/validado.

## Fase 7 — Release candidate y entrada a producción

Objetivo: convertir la rama `feat/riot-integration-prep` en una versión estable lista para merge controlado a `main`.

Criterios de cierre:

- La rama activa no debe ser `main` durante la aplicación de patches.
- No deben quedar ZIPs, carpetas de revisión ni patches locales sin ignorar en `git status`.
- Deben pasar `build:shared`, `build:api` y `build:web`.
- Deben cargar las rutas principales: `/dashboard`, `/dashboard/account`, `/dashboard/tournaments`, `/dashboard/matches` y `/legal/*`.
- Debe confirmarse que no existen claves reales de Riot, JWT o Supabase en Git.
- Render debe tener variables separadas: Riot solo en API, nunca en Web.

Comandos recomendados antes del merge:

```powershell
cd D:\Codex
git branch --show-current
git status --short
npm.cmd run build:shared
npm.cmd run build:api
npm.cmd run build:web
git grep -n "RGAPI-"
git grep -n "NEXT_PUBLIC_RIOT"
```

## Fase 8 — Hardening, compliance y demo pública

Objetivo: dejar Darkside.cool listo para revisión externa sin prometer capacidades Riot que todavía no están aprobadas.

Criterios de cierre:

- Términos, privacidad y eliminación de datos deben estar visibles.
- La UI debe indicar que Darkside.cool no está afiliado, patrocinado ni respaldado por Riot Games.
- DS_TOKEN debe quedar descrito como token interno no monetario, no retirable y no convertible a dinero real.
- No debe existir gambling, cash wagering, skins betting, blockchain ni apuestas.
- Riot ID lookup debe presentarse como validación técnica, no como prueba de propiedad.
- RSO debe mostrarse como pendiente hasta que Riot apruebe el flujo oficial.
- Tournament Codes reales deben quedar desactivados hasta contar con provider/callback aprobados.

## Fase 9 — Solicitud Riot Developer API

Objetivo: solicitar primero Production API Key, luego RSO y después Tournament API/Tournament Codes.

Orden recomendado:

1. Production API Key para uso backend de Account-V1, Summoner-V4, League-V4 y Match-V5.
2. Riot Sign On / OAuth client para verificar propiedad real de cuentas Riot.
3. Tournament API / Tournament Codes cuando el flujo competitivo, callback y moderación estén aprobados.

Argumentos clave para la solicitud:

- Darkside.cool es una plataforma de torneos esports con enfoque universitario/comunitario.
- Ya cuenta con auth, roles, equipos, torneos, brackets, match rooms, resultados, disputas, auditoría y moderación.
- La API key se usa únicamente desde backend.
- La plataforma diferencia validación técnica de propiedad oficial.
- No hay apuestas ni monetización convertible.
- RSO será usado para confirmar propiedad de Riot ID antes de torneos competitivos oficiales.
- Tournament Codes se activarán solo después de aprobación de Riot.

La solicitud formal y el texto reutilizable están en `docs/RIOT_DEVELOPER_APPLICATION.md`.
