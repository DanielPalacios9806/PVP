# RIOT_INTEGRATION_PLAN.md

## Objetivo

Preparar integración controlada con Riot sin comprometer seguridad ni estabilidad.

## Principios

- La API key de Riot solo debe estar en backend.
- No exponer claves en frontend.
- Registrar auditoría de consultas.
- Manejar rate limits.
- No depender de Riot para que el MVP funcione.
- El flujo manual debe seguir funcionando como respaldo.

## Fase 6.1 — Preparación Riot

- Crear servicio backend para Riot.
- Validar variables de entorno.
- Crear endpoint interno de salud Riot.
- Registrar errores y rate limits.
- No activar Tournament API todavía.

## Fase 6.2 — Vincular cuenta Riot

- Permitir que el usuario registre Riot ID.
- Validar formato.
- Consultar información básica.
- Guardar identificador seguro.
- Mostrar estado de vinculación en perfil.

## Fase 6.3 — Asociar Riot ID a inscripción

- Al inscribirse a torneo LoL/Valorant, solicitar Riot ID.
- Validar que el usuario tenga cuenta vinculada.
- Mostrar advertencia si falta Riot ID.

## Fase 6.4 — Resultados y verificación

- Mantener reporte manual.
- Usar Riot como verificación auxiliar.
- No bloquear el torneo si Riot falla.
- Registrar auditoría de validaciones.

## Fase 6.5 — Tournament API

Antes de solicitar producción a Riot:

- Tener dominio estable.
- Tener políticas legales visibles.
- Tener flujo de torneo claro.
- Tener moderación.
- Tener sistema antiabuso básico.
- Tener documentación técnica.
- Tener justificación universitaria/comunitaria.

## Nota

La integración Riot debe entrar después de estabilizar el MVP manual.
