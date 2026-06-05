# Phase 4A-S2 - Resultados, disputas y confirmacion staff

## Objetivo

Permitir operacion realista de torneos beta cuando el perdedor no confirma el resultado o cuando una fuente externa como Toornament/bracket manual ya valida el ganador.

## Flujo

1. Capitan ganador reporta resultado.
2. Capitan rival puede confirmar o disputar.
3. Si el rival abandona/no responde, moderador puede confirmar ganador.
4. El staff puede confirmar usando evidencia del ganador, Toornament manual, bracket externo o decision operativa.
5. Las disputas abiertas se resuelven al confirmar resultado por staff.

## Seguridad

- Solo ORGANIZER, MODERATOR, ADMIN o SUPER_ADMIN pueden usar confirmacion staff.
- Se registra auditoria de la accion.
- Resultados pendientes anteriores se rechazan para evitar doble ganador.

## Futuro

Cuando Riot Tournament API sea aprobada, este flujo seguira sirviendo como fallback operativo y como panel de revision de resultados oficiales.
