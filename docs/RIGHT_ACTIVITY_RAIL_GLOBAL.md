# Right Activity Rail global

El panel lateral derecho se mantiene disponible en las rutas privadas del dashboard, incluyendo torneos y partidas.

## Decisión UX

- El rail izquierdo de iconos se oculta en experiencias inmersivas como `/dashboard/tournaments` y `/dashboard/matches`.
- El rail derecho permanece visible porque ahora es colapsable y aporta navegación rápida, actividad, equipo, wallet interna y operación.
- Cuando el usuario lo colapsa se guarda el estado en `localStorage` y queda una barra compacta de accesos.

## Tournament detail

El detalle de torneo conserva su panel contextual interno para información del torneo, inscripción, recompensas y organizador, pero también mantiene el rail global plegable para actividad general del usuario.

## Countdown

El contador del hero de torneo se recalcula cada segundo mientras exista fecha de inicio (`startsAt`).
