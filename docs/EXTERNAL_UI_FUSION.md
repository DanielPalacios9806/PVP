# External UI Fusion - Darkside.gg

## Objetivo

Usar landings, blocks y patrones externos como base visual real, pero adaptados al sistema Darkside ya creado en la Fase 1. La meta no es pegar un template completo, sino fusionar patrones externos con:

- tokens Darkside;
- rutas reales;
- roles reales;
- beta cerrada;
- Riot mock/development sin exposición pública indebida;
- UX de esports premium.

## Stack externo permitido

| Área | Herramienta | Uso |
|---|---|---|
| Interacción accesible | Radix UI | Tabs, dialogs, dropdowns, popovers, selects, accordions, switches |
| Componentes base | shadcn/ui como inspiración | Dashboard shell, cards, tabs, navigation patterns |
| Landing premium | Aceternity/Magic UI como inspiración free | Hero, spotlight, glow cards, marquee, bento sections |
| Animación | Motion | Hover, reveal, transitions, sheets |
| Iconos | Lucide React | Iconografía coherente |
| Charts | Recharts | Dashboard, rankings, actividad, tokens |
| Mobile | Embla Carousel | Torneos, juegos, sponsors |
| QA visual | Playwright | Screenshots y comparación visual con mockups |

## Regla principal

La home pública no debe mostrar elementos de dashboard, admin u operación. Esos elementos viven en AppShell/AdminShell.

## Separación de shells

### PublicShell

Rutas: `/`, `/auth/login`, `/auth/register`, `/legal/*`.

Debe mostrar:

- hero;
- juegos;
- torneos destacados;
- comunidad;
- sponsors;
- login/registro.

No debe mostrar:

- Admin;
- Operación;
- Riot mock como botón principal;
- Tokens internos;
- Mis partidas;
- panel lateral privado.

### AppShell

Rutas: `/dashboard/*`.

Debe mostrar:

- sidebar izquierda;
- dashboard;
- torneos;
- equipos;
- partidas;
- tokens;
- cuenta;
- rail lateral de actividad.

### AdminShell

Rutas: `/dashboard/admin`, `/dashboard/moderation`.

Debe mostrar:

- auditoría;
- panel Riot;
- operación;
- perfiles;
- moderación.

## Secuencia de implementación

1. External UI base y navegación funcional.
2. Home pública estilo mockup.
3. Dashboard shell premium.
4. Tournaments hub premium.
5. Tournament detail/event page.
6. Visual QA con Playwright.
