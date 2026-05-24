# Seed demo Darkside.gg

Este seed carga datos iniciales para que el MVP no aparezca vacio en landing, dashboards y panel admin.

## Que crea

- Usuario `SUPER_ADMIN` demo.
- Usuario organizador demo.
- Usuario moderador demo.
- Cinco jugadores demo.
- Wallet interna no monetaria `DS_TOKEN` para cada usuario.
- Recompensas internas `XP de bienvenida` y `Riot ID Mock Listo`.
- Cuenta Riot simulada para un jugador.
- Cuatro equipos universitarios demo.
- Space publico `ESPE Darkside Arena`.
- Dos torneos demo:
  - `Darkside Cup ESPE - League of Legends`
  - `Red Sentinel Open - VALORANT`
- Inscripciones confirmadas y pendientes.
- Bracket single elimination demo para League of Legends.
- Audit log de inicializacion demo.

## Importante

Estos datos son para MVP/staging y pruebas visuales. No representan premios monetarios, apuestas ni integracion oficial de Riot.

Las credenciales demo deben rotarse o eliminarse antes de abrir la plataforma a publico amplio.

## Ejecutar local

Configura `DATABASE_URL` y ejecuta:

```bash
npm run db:seed
```

## Ejecutar en Render Shell

En el servicio API de Render, abre `Shell` y ejecuta:

```bash
npm run db:seed
```

Render usara las variables seguras ya configuradas en el servicio, incluyendo `DATABASE_URL`.

## Validaciones esperadas

Despues del seed:

- `GET /api/tournaments` devuelve al menos 2 torneos.
- `GET /api/teams` devuelve al menos 4 equipos.
- `GET /api/spaces` devuelve al menos 1 comunidad.
- La landing de `https://darkside.cool` deja de mostrar contadores en cero.
- El panel admin muestra usuarios, torneos y audit logs demo.
