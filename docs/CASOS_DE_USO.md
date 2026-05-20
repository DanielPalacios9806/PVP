# Casos de Uso

## Actor: Visitante

### Nombre
Explorar la plataforma

### Actor
Visitante

### Precondiciones
La plataforma esta disponible publicamente.

### Flujo principal
1. El visitante accede al home.
2. Consulta torneos, comunidades y rankings visibles.
3. Revisa informacion de registro y beneficios.

### Flujo alternativo
- Si un torneo es privado, solo ve informacion limitada.

### Resultado esperado
El visitante entiende la propuesta de valor y puede registrarse.

## Actor: Usuario/Jugador

### Nombre
Registrarse e iniciar sesion

### Actor
Usuario/Jugador

### Precondiciones
No tener una cuenta activa o poseer credenciales validas.

### Flujo principal
1. Completa formulario de registro.
2. Acepta terminos y politicas.
3. Inicia sesion.
4. Accede a su dashboard y perfil gamer.

### Flujo alternativo
- Si el email ya existe, el sistema rechaza el registro.
- Si las credenciales fallan, el sistema informa error.

### Resultado esperado
El usuario accede a su cuenta y puede usar funciones autenticadas.

### Nombre
Reportar resultado de match

### Actor
Usuario/Jugador

### Precondiciones
Ser participante del match y el match estar en estado reportable.

### Flujo principal
1. El usuario abre el match.
2. Ingresa score y adjunta evidencia.
3. El sistema registra el reporte pendiente de confirmacion.
4. El rival confirma o se inicia disputa.

### Flujo alternativo
- Si el rival no confirma, se eleva a disputa.
- Si la evidencia es insuficiente, moderacion solicita mas datos.

### Resultado esperado
El resultado queda confirmado o en revision.

## Actor: Capitan de equipo

### Nombre
Gestionar equipo e inscribirlo en torneo

### Actor
Capitan de equipo

### Precondiciones
Ser owner o captain del equipo.

### Flujo principal
1. Crea equipo.
2. Invita o agrega integrantes.
3. Selecciona torneo elegible.
4. Inscribe al equipo.
5. Realiza check-in previo si aplica.

### Flujo alternativo
- Si el roster esta incompleto, el sistema bloquea la inscripcion.
- Si el torneo esta cerrado, no permite registrarse.

### Resultado esperado
El equipo queda inscrito correctamente.

## Actor: Organizador

### Nombre
Crear y administrar torneo

### Actor
Organizador

### Precondiciones
Tener permisos de organizador.

### Flujo principal
1. Crea torneo con reglas, formato y fechas.
2. Configura cupos, modalidad y visibilidad.
3. Abre inscripciones.
4. Revisa participantes.
5. Inicia check-in y genera bracket.
6. Supervisa progreso del torneo.

### Flujo alternativo
- Si no hay participantes suficientes, posterga o cancela.
- Si hay incidentes, solicita intervencion de moderacion.

### Resultado esperado
El torneo se publica y puede operarse de punta a punta.

## Actor: Moderador

### Nombre
Resolver disputa

### Actor
Moderador

### Precondiciones
Existir una disputa abierta y el moderador tener permisos.

### Flujo principal
1. Revisa match, historial y evidencias.
2. Analiza reportes de ambos lados.
3. Emite una resolucion.
4. El sistema actualiza el estado del match y registra auditoria.

### Flujo alternativo
- Si la evidencia es insuficiente, solicita informacion adicional.
- Si detecta fraude, escala a administrador.

### Resultado esperado
La disputa queda cerrada con resolucion trazable.

## Actor: Administrador

### Nombre
Gestionar configuracion y accesos

### Actor
Administrador

### Precondiciones
Tener rol administrativo.

### Flujo principal
1. Accede al panel admin.
2. Revisa usuarios, torneos, espacios y logs.
3. Ajusta roles o estados cuando corresponde.
4. Audita acciones criticas.

### Flujo alternativo
- Si una accion viola una regla de negocio, el sistema la rechaza.

### Resultado esperado
La plataforma se mantiene operativa y bajo control.

## Actor: Finanzas/Premios

### Nombre
Aprobar premio de torneo

### Actor
Finanzas/Premios

### Precondiciones
Torneo finalizado y premio habilitado bajo compliance.

### Flujo principal
1. Revisa asignaciones de premio.
2. Verifica aprobaciones, KYC y evidencia.
3. Autoriza payout.
4. El sistema registra movimiento y auditoria.

### Flujo alternativo
- Si KYC falla o falta documentacion, el payout queda retenido.

### Resultado esperado
Los premios monetarios futuros se gestionan de forma auditada y legal.
