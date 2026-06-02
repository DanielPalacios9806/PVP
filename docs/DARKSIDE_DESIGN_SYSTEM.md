# Darkside.gg Design System - Fase 1

Este documento define la base visual que debe usar el frontend para acercarse a los mockups originales de Darkside.gg.

## Objetivo de la fase

Crear una capa de diseño reutilizable antes de rediseñar páginas grandes como Home, Torneos, Tournament Detail y Dashboard.

## Principios visuales

- Fondo oscuro premium con profundidad y gradientes rojo/cyan.
- Cards de vidrio oscuro con borde sutil, glow controlado y sombras profundas.
- CTA principal rojo, CTA secundario cyan.
- Tipografía fuerte para títulos y lectura limpia para cuerpo.
- Mobile first, pero con densidad visual de plataforma esports en desktop.
- Estados hover/focus visibles, sin sacrificar accesibilidad.

## Archivos base

- `apps/web/lib/design-tokens.ts`: tokens y clases reutilizables para componentes.
- `apps/web/components/ui/ds-primitives.tsx`: primitivos visuales reutilizables.
- `apps/web/app/globals.css`: utilidades CSS globales para hero, panels, cards y fondo.
- `apps/web/tailwind.config.ts`: tokens Darkside disponibles desde Tailwind.

## Componentes primitivos

- `DSContainer`: contenedor ancho para páginas premium.
- `DSPanel`: panel glass/strong.
- `DSCard`: card interactiva con tono neutral/cyan.
- `DSButton`: botón primary/secondary/ghost.
- `DSBadge`: badge red/cyan/gold/neutral.
- `DSSectionHeader`: encabezado estándar de secciones.
- `DSStatTile`: bloque de métrica.
- `DSSearchInput`: input de búsqueda visualmente alineado al mockup.

## Uso recomendado

1. No rediseñar todas las páginas al mismo tiempo.
2. Migrar primero componentes de layout: navbar, hero, section cards.
3. Después migrar Home, Torneos Hub, Tournament Detail y Dashboard por ramas separadas.
4. Mantener `npm run build` y `npm run check:release` verdes en cada rama.

## Criterio de aceptación

La fase se considera completa cuando:

- El build compila.
- `check:release` pasa.
- Los tokens Darkside están disponibles en Tailwind y TypeScript.
- Existe documentación para el sistema visual.
- No se introducen nuevas dependencias ni cambios funcionales riesgosos.
