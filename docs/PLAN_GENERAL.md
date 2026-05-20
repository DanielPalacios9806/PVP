# Plan General

## Vision del producto
Construir una plataforma de torneos de eSports enfocada en experiencias competitivas organizadas para juegos como League of Legends, VALORANT y futuros titulos, con enfasis en comunidad, integridad competitiva, operacion legal y crecimiento modular. La plataforma debe permitir organizar torneos, gestionar equipos, validar resultados y distribuir recompensas internas no monetarias, dejando preparado un camino controlado para premios monetarios exclusivos de torneos bajo cumplimiento legal y operativo.

## Alcance
La primera etapa cubre un MVP operativo para comunidades, equipos y torneos con gestion administrativa, auditoria y base tecnica para futuras integraciones con proveedores externos como Riot.

## Lo que si hara la plataforma
- Registro, inicio de sesion y gestion de perfiles gamer.
- Asignacion inicial de tokens internos a cada cuenta registrada.
- Roles y permisos para jugadores, capitanes, organizadores, moderadores, administradores y finanzas.
- Creacion de equipos, espacios comunitarios y torneos.
- Inscripcion individual o por equipos segun configuracion del torneo.
- Check-in previo al inicio del torneo.
- Generacion y administracion de brackets y partidas.
- Reporte manual de resultados con confirmacion bilateral.
- Carga de evidencias para resultados y disputas.
- Historial de partidas, torneos y rankings.
- Sistema de recompensas internas no monetarias.
- Gestion administrativa de tokens internos y validaciones operativas asociadas.
- Paneles administrativos y moderacion con auditoria.
- Preparacion para integracion futura con Riot API y premios monetarios regulados.

## Lo que no hara la plataforma
- No sera una casa de apuestas.
- No permitira gambling, cash wagering ni apuestas entre usuarios.
- No permitira duelos 1 vs 1 con dinero apostado.
- No emitira tokens convertibles a dinero real.
- No tratara saldos internos como deposito de usuarios para apuestas.
- No expondra API keys en frontend.
- No activara pagos reales en el MVP inicial.

## Modulos principales
- Autenticacion y autorizacion.
- Perfiles de usuario y cuentas de juego.
- Tokens internos y saldo de usuario.
- Equipos y membresias.
- Spaces o comunidades.
- Torneos, inscripciones y check-in.
- Brackets, rondas y matches.
- Resultados, evidencias y disputas.
- Recompensas internas y rankings.
- Wallet de premios de torneos futura.
- Moderacion, administracion y auditoria.
- Integraciones externas futuras.

## Roadmap por fases
### Fase 1. Descubrimiento y definicion
- Requisitos funcionales y no funcionales.
- Definicion legal y limites del producto.
- Arquitectura base y modelo de datos.

### Fase 2. Fundacion tecnica
- Monorepo con frontend, backend, paquete compartido y Prisma.
- Configuracion de entornos, linting, estructura modular y convenciones.

### Fase 3. MVP competitivo
- Auth, usuarios, roles.
- Equipos y Spaces.
- Torneos, inscripciones, matches y resultados.
- Disputas y auditoria.

### Fase 4. Operacion y confianza
- Moderacion y panel admin.
- Ranking, recompensas internas y notificaciones.
- Hardening de seguridad, observabilidad y QA.

### Fase 5. Integraciones y escalado
- Riot API.
- Jobs asincronos y antifraude.
- Mejoras de performance y cache.

### Fase 6. Premios monetarios regulados
- KYC.
- Aprobacion manual.
- Ledger de premios y payouts auditables.

## Riesgos legales
- Confundir premios de torneo con actividad de apuestas o wagering.
- Manejo de premios monetarios sin controles KYC/AML en etapas futuras.
- Moderacion insuficiente de contenido, fraude o suplantacion.
- Incumplimiento de politicas de publishers o APIs de terceros.

## Riesgos tecnicos
- Disputas complejas si no existe evidencia suficiente o trazabilidad.
- Modelado insuficiente para distintos formatos de torneos.
- Escalabilidad de brackets y reportes simultaneos en eventos grandes.
- Exceso de acoplamiento entre frontend, backend e integraciones.
- Exposicion accidental de secretos o credenciales.

## MVP recomendado
El MVP debe enfocarse en validacion operativa, no en monetizacion. El conjunto ideal es:
- Registro, login y roles basicos.
- Asignacion de tokens internos por cuenta.
- Perfil gamer simple.
- CRUD de equipos.
- CRUD de Spaces.
- CRUD de torneos.
- Inscripcion a torneos.
- Estructura inicial de brackets y matches.
- Reporte y confirmacion manual de resultados.
- Disputas basicas con evidencia.
- Auditoria de acciones criticas.

## Separacion de experiencia por rol
- Jugador: registro, inicio de sesion, consulta de torneos, participacion competitiva, check-in y recarga visible de tokens internos sin pago real.
- Administracion: creacion de torneos, control de calendario operativo, verificacion de acciones criticas, asignacion y validacion de tokens internos.
- Moderacion: revision de disputas, evidencia y trazabilidad de resultados.

## Indicadores iniciales de exito
- Tiempo promedio de creacion de torneo menor a 10 minutos.
- Tasa de finalizacion de torneos mayor al 80%.
- Menos del 10% de matches con disputa.
- Retencion semanal de organizadores y capitanes.
- Tiempo de resolucion de disputas moderadas.
