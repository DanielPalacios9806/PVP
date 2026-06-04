# Fase 4A-S1 - Manual Assisted Tournament Operations

## Objetivo

Preparar Darkside.cool para operar torneos beta sin depender todavía de Riot Tournament API directa ni de API profunda de Toornament.

## Alcance

- Sala manual asistida por match.
- Moderadores pueden definir horario, nombre de sala, contraseña, código/referencia e instrucciones.
- Capitanes ven y usan la información operativa cuando la sala está lista.
- Resultados y disputas siguen usando el flujo interno de Darkside.
- Se mantiene listo el espacio para reemplazar el código manual por Riot Tournament Code oficial en el futuro.

## Proveedores conceptuales

- internal: operación completa en Darkside.
- toornament_manual: apoyo externo manual con link/embed o códigos copiados por moderador.
- riot_pending: Riot está pendiente de aprobación.
- riot_official: futuro, cuando Riot Tournament API sea aprobado.

## Roles

- Admin/Super Admin: control total.
- Moderador: prepara salas, códigos, horarios y resuelve disputas.
- Capitán/Jugador: consulta instrucciones, reporta resultado y confirma/disputa.
- Público: ve reglas, bracket y resultados confirmados.

## Legal/reglamento

Se agrega acceso visible a reglas/información legal desde la navegación lateral cuando la estructura de navegación lo permite.

## Nota técnica

Este parche usa campos existentes del match para persistir datos de sala manual:

- riotShortCode: código/referencia manual.
- riotGameId: nombre de sala manual.
- riotPlatform: contraseña manual con prefijo interno.
- riotRegion: instrucciones de lobby manual.

Cuando Riot Tournament API sea aprobado, estos campos podrán migrarse a un modelo/adapter específico sin romper la UX.
