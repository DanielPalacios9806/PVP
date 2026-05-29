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

## Nota crítica sobre vinculación de cuentas

La validación por Riot ID (`gameName#tagLine`) solo confirma que la cuenta existe en Riot. No confirma que el usuario de Darkside.cool sea el dueño de esa cuenta.

Estados recomendados:

- `LOOKUP_ONLY`: Riot ID existe, pero propiedad no confirmada.
- `MANUAL`: validación interna/manual para pruebas.
- `RSO_PENDING`: Darkside está listo para Riot Sign On, pero falta aprobación/configuración.
- `RSO_VERIFIED`: cuenta vinculada oficialmente mediante Riot Sign On.

Para torneos serios, la inscripción debería exigir `RSO_VERIFIED` cuando Riot apruebe RSO. Mientras tanto, el modo `LOOKUP_ONLY` solo debe usarse para pruebas controladas y debe mostrarse claramente al usuario.

## Flujo RSO recomendado

1. Usuario presiona **Conectar con Riot**.
2. Darkside genera `state` seguro.
3. Darkside redirige al login oficial de Riot.
4. El usuario inicia sesión y autoriza la aplicación.
5. Riot redirige al callback configurado.
6. Darkside intercambia el código por token.
7. Darkside consulta la cuenta autenticada.
8. Darkside guarda Riot ID, PUUID y marca `ownershipVerified=true`.

No se debe usar iframe para el login oficial. Para MVP, se recomienda redirección completa; una ventana emergente puede implementarse después.


## Fase 6.4 — Requisitos Riot para inscripción

Para torneos de League of Legends y VALORANT, Darkside debe revisar el estado Riot antes de permitir inscripción.

Estados permitidos en MVP:

- `LOOKUP_ONLY` / `RSO_PENDING`: el Riot ID existe y puede usarse en pruebas internas, pero la propiedad oficial no está confirmada.
- `RSO_VERIFIED`: estado futuro para cuenta oficialmente vinculada con Riot Sign On.

Regla actual de MVP:

- Si el torneo es LoL/VALORANT y el usuario no tiene Riot ID validado técnicamente, se bloquea la inscripción y se redirige a Mi cuenta.
- Si el usuario tiene Riot ID validado técnicamente, se permite inscripción con advertencia visual.
- Para equipos, todos los miembros del equipo deben tener Riot ID validado técnicamente antes de inscribir el roster.

Regla futura para producción competitiva:

- Cuando Riot apruebe RSO, los torneos oficiales podrán exigir `RSO_VERIFIED` para confirmar propiedad real de la cuenta.
