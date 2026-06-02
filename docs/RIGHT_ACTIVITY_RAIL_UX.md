# Right Activity Rail UX

El panel derecho del dashboard deja de ser una columna decorativa y pasa a funcionar como un rail de actividad similar a plataformas competitivas externas.

## Objetivo

- Mostrar actividad util del jugador.
- Permitir crear equipo o party desde el rail.
- Mostrar equipos, inscripciones y proximos pasos.
- Mantener acciones de operacion solo para roles autorizados.
- Permitir colapsar el panel cuando el usuario necesita mas espacio.

## Reglas de uso

- El rail se muestra en dashboard general y paginas privadas no inmersivas.
- En torneos y match rooms se oculta para no competir con el layout del torneo.
- El estado colapsado se guarda en `localStorage`.
- El rail colapsado conserva accesos rapidos: actividad, equipos, torneos y tokens.
- En mobile el rail no se muestra como columna fija; se debe resolver luego con un drawer/sheet.

## Inspiracion UX

La referencia es un panel tipo actividad: secciones compactas de `Your activities`, `Your party`, `Your teams`, `Your friends` y acciones directas. Para Darkside se adapta a:

- Your activities
- Your party
- Your teams
- Operacion, solo admin/moderador/organizador
- Internal balance
