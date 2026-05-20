# Backlog

## Sprint 1: Auth, estructura base y usuarios

### Epica
Fundacion del sistema y acceso seguro.

### Historia
Como visitante quiero registrarme para participar en la plataforma.

### Criterios de aceptacion
- El usuario puede registrarse con email, username y password.
- El password se almacena hasheado.
- No se permite email duplicado ni username duplicado.

### Historia
Como usuario quiero iniciar sesion para acceder a mi dashboard.

### Criterios de aceptacion
- El login retorna un JWT valido.
- El usuario autenticado puede consultar su perfil.

### Historia
Como administrador quiero contar con roles base para controlar accesos.

### Criterios de aceptacion
- Existen roles definidos.
- Los endpoints protegidos validan autenticacion y autorizacion.

## Sprint 2: Equipos y Spaces

### Epica
Construccion de comunidad competitiva.

### Historia
Como jugador quiero crear un equipo para competir con otros usuarios.

### Criterios de aceptacion
- El usuario autenticado puede crear equipo.
- El creador queda como owner.
- El equipo puede editarse y archivarse.

### Historia
Como usuario quiero crear un Space para reunir una comunidad.

### Criterios de aceptacion
- Se puede crear Space con nombre, slug y visibilidad.
- El creador queda como owner del Space.

## Sprint 3: Torneos e inscripciones

### Epica
Operacion de torneos.

### Historia
Como organizador quiero crear un torneo para abrir inscripciones.

### Criterios de aceptacion
- El organizador puede crear y editar torneos.
- El torneo soporta modalidad individual o por equipos.
- El torneo maneja estados basicos.

### Historia
Como jugador o capitan quiero inscribirme a un torneo.

### Criterios de aceptacion
- Se valida el tipo de registro segun el torneo.
- La inscripcion queda asociada al usuario o equipo correcto.

## Sprint 4: Brackets y partidas

### Epica
Seguimiento de competencia.

### Historia
Como organizador quiero tener estructura inicial de brackets y matches.

### Criterios de aceptacion
- Se puede crear bracket base para un torneo.
- Se pueden listar rondas y matches relacionados.

## Sprint 5: Resultados, evidencias y disputas

### Epica
Integridad competitiva.

### Historia
Como jugador quiero reportar resultados con evidencia.

### Criterios de aceptacion
- Se pueden reportar scores y evidencia.
- El resultado queda pendiente de confirmacion.

### Historia
Como moderador quiero revisar disputas.

### Criterios de aceptacion
- Existe endpoint para crear disputa.
- La disputa queda asociada al match.

## Sprint 6: Recompensas internas y rankings

### Epica
Motivacion y progresion.

### Historia
Como usuario quiero recibir recompensas internas no monetarias.

### Criterios de aceptacion
- Las recompensas soportan puntos, XP, badges o beneficios.
- Ninguna recompensa interna es retiable ni convertible a dinero.

## Sprint 7: Panel admin y auditoria

### Epica
Gobernanza operativa.

### Historia
Como administrador quiero auditar acciones criticas del sistema.

### Criterios de aceptacion
- Se registran cambios de creacion, actualizacion y resolucion relevantes.
- El log almacena actor, entidad y timestamp.

## Sprint 8: Preparacion para Riot API

### Epica
Integraciones competitivas.

### Historia
Como producto quiero estar listo para verificar cuentas Riot mas adelante.

### Criterios de aceptacion
- Existe interfaz de adaptador Riot desacoplada.
- Las credenciales externas dependen de variables de entorno.

## Sprint 9: Wallet de premios futura

### Epica
Premios regulados.

### Historia
Como area de finanzas quiero diferenciar wallet de premios y recompensas internas.

### Criterios de aceptacion
- El modelo distingue claramente balances no monetarios y premios.
- No existe flujo de deposito o apuesta de usuarios.

## Sprint 10: QA, seguridad y despliegue

### Epica
Salida controlada a produccion.

### Historia
Como equipo quiero desplegar el sistema con seguridad basica.

### Criterios de aceptacion
- Variables sensibles salen de `.env`.
- Hay validaciones de entrada y manejo de errores.
- El README documenta instalacion y ejecucion.
