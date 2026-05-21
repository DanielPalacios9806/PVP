# Plan UX Dashboard Darkside.gg

## Objetivo
Ordenar la experiencia visual y funcional de Darkside.gg antes de aplicar mockups finales. La prioridad es que cada usuario vea solo lo que corresponde a su rol y que ninguna pantalla prometa funciones que todavia estan en mock o preparacion.

## Estado Actual Desplegado
- Landing publica mobile-first con identidad temporal Darkside.gg.
- Login y registro como paginas dedicadas.
- Dashboard autenticado con rutas para jugador, equipos, comunidades, torneos, tokens y perfil.
- Panel de administracion separado disponible para `ADMIN` y `SUPER_ADMIN`.
- Moderacion separada disponible para `MODERATOR`, `ADMIN` y `SUPER_ADMIN`.
- Riot ID en modo mock desde perfil.
- Torneos, brackets, resultados y disputas conectados al MVP backend.

## Problemas UX A Resolver
- Algunas vistas mezclan lenguaje de jugador con lenguaje operativo.
- El dashboard necesita jerarquia clara entre jugador, organizador y admin.
- El rail lateral y sidebar derecho deben comunicar acciones reales, no accesos decorativos.
- La landing debe mantener datos reales o estados honestos, sin stats infladas ni premios monetarios.
- El logo final queda pendiente de reemplazo cuando se entregue el asset oficial.

## Arquitectura De Navegacion Propuesta
### Visitante
- Landing publica.
- Explorar torneos publicos.
- Login.
- Registro.
- Paginas legales.

### Jugador
- Inicio jugador.
- Torneos disponibles.
- Mis equipos.
- Comunidades.
- Perfil gamer y Riot mock.
- Tokens internos no monetarios.
- Match room cuando tenga partida asignada.
- No puede crear torneos ni cambiar su rol desde el frontend.

### Organizador
- Todo lo de jugador.
- Crear y editar torneos.
- Publicar torneos.
- Abrir y cerrar inscripciones.
- Aprobar o rechazar inscripciones.
- Generar brackets.
- Revisar resultados y disputas.

### Moderador
- Revisar reportes.
- Resolver disputas.
- Ver logs relacionados.
- Confirmar o escalar resultados.

### Admin
- Gestion de usuarios y roles.
- Auditoria.
- Operacion completa de torneos.
- Estado Riot mock/development/production.
- Configuracion futura de premios.

### Super Admin
- Creado solo por seed/base de datos/env interno.
- Puede asignar admins y controlar configuracion critica.
- No aparece como opcion de registro publico.
- Es el unico rol que puede elevar usuarios a roles administrativos.

## Pantallas Prioritarias Para Mockup
1. Landing mobile.
2. Landing desktop.
3. Login y registro.
4. Dashboard jugador nuevo.
5. Perfil gamer con Riot mock.
6. Listado/detalle de torneo.
7. Match room.
8. Panel admin desktop.

## Reglas Para Los Disenos
- Mobile-first: primero `390x844` o `430x932`.
- Desktop: `1440x1024`.
- No usar modales para login, registro, crear torneo completo o resolver disputas complejas.
- Si una funcion no existe, marcarla como `Proximamente`, `Modo mock` o no mostrarla.
- No mostrar dinero real, apuestas, cash wagering ni tokens canjeables.
- Exportar logo e iconos como `SVG`.
- Exportar fondos y artes como `WEBP` o `PNG`.

## Siguiente Fase De Implementacion
1. Reemplazar logo temporal por logo oficial.
2. Unificar tarjetas, botones, tabs y headers en componentes reutilizables.
3. Redisenar dashboard jugador.
4. Redisenar dashboard organizador/admin.
5. Revisar responsive real en localhost y Render.
6. Ajustar copy legal y Riot disclaimer.
