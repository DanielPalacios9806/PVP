# Tournament Detail Pro Bracket

## Objetivo

Transformar el bracket de `Tournament Detail` en una experiencia interactiva similar a los mockups finales de Darkside.gg: hero cinematografico, tabs limpias, bracket grande y panel contextual propio del torneo.

## Tecnologia usada

- `@xyflow/react` para nodos, conexiones, pan, zoom y controles de vista.
- `motion` se mantiene para polish visual del resto del flujo.
- Tokens Darkside para bordes neon, estados y fondos.

## Reglas UX

1. El bracket principal se muestra en la tab `Bracket`.
2. Los nodos de partidas enlazan a match rooms cuando el bracket real existe.
3. Si no hay bracket real, se muestra una vista preview con equipos simulados o registros existentes.
4. El panel lateral del torneo conserva informacion, recompensas y organizador.
5. El rail derecho global puede seguir visible/colapsable sin reemplazar al panel propio del torneo.

## Mobile

La vista usa pan y zoom para no romper el layout. En una fase posterior se puede agregar selector de ronda tipo carrusel si la experiencia mobile necesita menos mapa y mas lista.
