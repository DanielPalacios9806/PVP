# Riot Mock y preparacion para API oficial

## Estado actual

El proyecto corre por defecto con `RIOT_MODE=mock`. En este modo no se llama a Riot Games, no se necesita API key y no se expone ningun secreto al frontend.

## Variables

```env
RIOT_MODE=mock
RIOT_API_KEY=
RIOT_PLATFORM=LA1
RIOT_REGION=AMERICAS
RIOT_CALLBACK_URL=
RIOT_PROVIDER_ID=
RIOT_TOURNAMENT_ID=
```

`RIOT_API_KEY` nunca debe usar prefijo `NEXT_PUBLIC_`.

## Endpoints mock disponibles

- `GET /api/riot/status`: devuelve modo actual y configuracion no sensible.
- `POST /api/riot/accounts/link`: vincula Riot ID simulado al usuario autenticado.
- `GET /api/riot/accounts/me`: lista cuentas Riot vinculadas del usuario autenticado.
- `POST /api/riot/matches/:matchId/code`: genera un Tournament Code mock para un match.
- `POST /api/riot/mock/matches/:matchId/finish`: simula resultado Riot, marca match como completado y avanza ganador.
- `POST /api/riot/tournament/callback`: callback mock protegido para pruebas internas.
- `POST /api/riot/matches/:matchId/resync`: placeholder de resincronizacion futura.

## Flujo demo sin Riot API

1. Crear usuario admin o usar el seed.
2. Crear usuario jugador.
3. Crear equipo con el jugador.
4. Vincular Riot ID simulado con `POST /api/riot/accounts/link`.
5. Crear torneo como admin u organizador.
6. Publicar torneo con `POST /api/tournaments/:id/publish`.
7. Abrir inscripcion con `POST /api/tournaments/:id/open-registration`.
8. Inscribir equipo con `POST /api/tournaments/:id/register-team`.
9. Aprobar inscripcion con `PATCH /api/registrations/:id/approve`.
10. Cerrar inscripcion con `POST /api/tournaments/:id/close-registration`.
11. Generar bracket con `POST /api/tournaments/:id/generate-bracket`.
12. Generar codigo mock con `POST /api/riot/matches/:matchId/code`.
13. Simular resultado con `POST /api/riot/mock/matches/:matchId/finish`.
14. Revisar avance automatico del ganador en el bracket.
15. Revisar auditoria con `GET /api/admin/audit`.

## Pendiente para Production API Key

- Implementar llamadas reales en `riot.real-adapter.ts` usando documentacion oficial vigente de Riot.
- Validar firma, metadata y nonce del callback real.
- Crear modelos dedicados si Riot exige guardar providers, tournament ids y codes historicos fuera de `Match`.
- Preparar evidencias del caso de uso: torneos universitarios, sin apuestas, sin cash wagering y sin tokens convertibles.
