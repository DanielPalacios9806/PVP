# Tournaments Hub Layout Fidelity

Esta fase reorganiza `/dashboard/tournaments` para que funcione como un centro competitivo y no solo como una lista de cards.

## Objetivo UX

- Mantener una columna izquierda de filtros clara y estable.
- Dar protagonismo al hero central del torneo destacado.
- Mostrar metricas utiles: abiertos, en vivo, filtrados y mis cupos.
- Convertir el listado en cards horizontales tipo marketplace competitivo.
- Evitar que filtros, tabs y busqueda compitan por espacio.
- Mantener el flujo compatible con el rail derecho global colapsable.

## Distribucion

- Desktop: `sidebar filtros + escenario central`.
- Mobile: filtros y juegos se apilan, las tabs usan scroll horizontal y las cards bajan a una sola columna.
- Cards premium: imagen, metadata, requisito Riot, estado, CTA e informacion de recompensa interna.

## Funcionalidad incluida

- Busqueda local por nombre, juego, formato y descripcion.
- Filtros por formato.
- Filtros por estado: todos, abiertos, en vivo y finalizados.
- Reset de filtros.
- CTA de creacion para admin, super admin u organizer.

## Alcance

No modifica API, Prisma ni reglas Riot. Es un ajuste de layout, experiencia y fidelidad visual del hub de torneos.
