# Tournament Detail Layout Fidelity

La vista `/dashboard/tournaments/[id]` se reorganiza para parecerse al mockup de Tournament Detail:

- Hero cinematográfico con contador, CTA y métricas principales.
- Tabs limpias y horizontales sin secciones técnicas públicas.
- Bracket como protagonista del contenido central.
- Panel contextual del torneo a la derecha en desktop.
- Vista mobile por rondas para no depender del canvas interactivo en pantallas pequeñas.
- React Flow se mantiene para desktop/tablet con pan, zoom y fit view.

## Reglas UX

- En desktop el contenido principal usa una relación aproximada 70/30: bracket central + panel del torneo.
- En mobile el bracket se presenta primero como lista por rondas, con tarjetas legibles.
- El panel global de actividad puede existir como drawer/rail colapsable, pero no debe competir con el panel propio del torneo.
- Las tabs públicas deben ser: Información, Bracket, Equipos, Reglas y Partidos.

## Siguiente mejora

La siguiente fase puede convertir el panel de información del torneo en acordeones mobile usando Radix Accordion.
