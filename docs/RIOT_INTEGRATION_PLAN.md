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


## Fase 6.1 implementada: backend prep seguro

La integracion debe iniciar con endpoints server-side y modo mock por defecto:

- `GET /api/riot/status`: configuracion segura sin exponer secretos.
- `GET /api/riot/health`: readiness para lookup de Riot ID y tournament codes.
- `POST /api/riot/accounts/check`: valida un Riot ID desde backend sin guardarlo.
- `POST /api/riot/accounts/link`: vincula Riot ID al usuario autenticado.

### Configuracion local controlada

```env
RIOT_API_MODE=development
RIOT_API_KEY=RGAPI_xxxxx
RIOT_REGION=la1
RIOT_REGIONAL_ROUTE=americas
RIOT_TOURNAMENT_API_ENABLED=false
```

### Configuracion recomendada en Render hasta tener aprobacion

```env
RIOT_API_MODE=mock
RIOT_API_KEY=
RIOT_TOURNAMENT_API_ENABLED=false
```

La API key temporal de desarrollo solo debe cargarse en el backend, nunca en `NEXT_PUBLIC_*`, nunca en GitHub y nunca en el navegador.
