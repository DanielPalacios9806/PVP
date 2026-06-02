# Tournaments Hub Mobile Polish

Este documento registra la fase **2X-I: Tournaments Hub Mobile Polish**.

## Objetivo

Mejorar la experiencia móvil de `/dashboard/tournaments` para que el centro de torneos se sienta como un hub competitivo y no como una versión comprimida del escritorio.

## Cambios principales

- La barra lateral de filtros queda oculta en móvil para no consumir espacio vertical.
- Se agrega un bloque superior compacto de resumen competitivo.
- La búsqueda queda visible arriba en pantallas pequeñas.
- Los filtros se abren desde un drawer móvil.
- Las tarjetas de torneo se compactan para lectura rápida.
- Los metadatos de juego, formato, estado y equipos se mantienen visibles.
- En escritorio se conserva la experiencia completa con sidebar.

## Comportamiento esperado

### Desktop

- Sidebar izquierda visible.
- Filtros persistentes por juego, formato y estado.
- Hero central tipo arena competitiva.
- Cards premium con acciones claras.

### Mobile

- Sin sidebar fija.
- Botón **Filtros** visible.
- Drawer con filtros por juego, formato y estado.
- Búsqueda arriba.
- Cards más compactas.
- Bottom nav sin quedar tapada por el contenido.

## Definition of Done

- `npm run build` pasa.
- `npm run check:release` detecta esta documentación.
- `npx prisma validate --schema prisma/schema.prisma` pasa.
- `npx prisma migrate status --schema prisma/schema.prisma` confirma las migraciones cuando Supabase está disponible.
- `/dashboard/tournaments` mantiene sidebar en desktop.
- `/dashboard/tournaments` usa drawer de filtros en móvil.
- La experiencia móvil no muestra la sidebar larga al inicio.

## Nota operativa
