# UX Navigation Functional Map - Darkside.gg

## Problema detectado

La UI anterior mezclaba home pública, dashboard privado, tokens, operación y admin en una misma experiencia. Eso hacía que la página se aleje de los mockups y que varios botones parecieran funcionales sin tener una ruta clara.

## Regla del producto

Todo botón visible debe cumplir una de estas condiciones:

1. tener ruta real;
2. abrir una acción real;
3. estar oculto;
4. mostrarse como `Próximamente` sin parecer acción activa.

## Navegación pública

| Elemento | Ruta | Estado |
|---|---|---|
| Inicio | `/` | Activo |
| Torneos | `/dashboard/tournaments` | Activo temporal |
| Equipos | `/dashboard/teams` | Protegido |
| Comunidad | `/dashboard/spaces` | Protegido |
| Login | `/auth/login` | Activo |
| Registrarse | `/auth/register` | Activo |

## Navegación privada

| Elemento | Ruta | Estado |
|---|---|---|
| Dashboard | `/dashboard` | Activo |
| Mis partidas | `/dashboard/matches/mock-match-1` | Temporal |
| Mis tokens | `/dashboard/tokens` | Activo |
| Perfil | `/dashboard/account` | Activo |
| Torneos | `/dashboard/tournaments` | Activo |
| Equipos | `/dashboard/teams` | Activo |

## Navegación admin

| Elemento | Ruta | Estado |
|---|---|---|
| Operación | `/dashboard/moderation` | Admin/moderador |
| Admin | `/dashboard/admin` | Admin |
| Perfiles | `/dashboard/admin/profiles` | Superadmin |

## Ocultar en home pública

- Admin;
- Operación;
- Perfiles;
- Riot mock;
- Auditoría;
- Logs;
- Tokens internos;
- Mis partidas;
- Mis tokens;
- panel lateral de actividad privada.

## Información lateral

La información lateral se conserva, pero no en home pública.

- Dashboard: actividad, siguiente paso, tokens, operación admin.
- Torneos: filtros activos, mis inscripciones, recomendaciones, operación admin.
- Mobile: drawer/sheet, no columna fija.
