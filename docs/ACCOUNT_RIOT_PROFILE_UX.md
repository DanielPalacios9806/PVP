# Account + Riot Profile UX

## Objetivo

La macrofase 2X-L convierte `/dashboard/account` en un centro de cuenta competitiva. El usuario debe entender su identidad Darkside, su estado de Riot, sus accesos a torneos/equipos/partidas/tokens y las acciones de seguridad sin mezclar la experiencia de jugador con administracion.

## Criterios implementados

- Hero de cuenta con identidad competitiva, rol, estado de sesion y saldo interno.
- Card Riot destacada mediante `RiotLinkCard`, manteniendo la API key solo en backend.
- Accesos competitivos a torneos, equipos, partidas y tokens.
- Panel lateral de readiness Riot: modo development, LA1/AMERICAS, RSO pendiente y key no expuesta.
- Seguridad de cuenta: cambio de contrasena, OAuth conectado y cierre de sesion.
- Accesos Admin/Operacion ocultos para usuarios sin rol interno.
- Responsive mobile sin dropdown gigante ni contenido que tape la navegacion inferior.

## Reglas de seguridad

- No existe `NEXT_PUBLIC_RIOT_API_KEY`.
- La web nunca imprime ni recibe la `RIOT_API_KEY`.
- La vinculacion tecnica solo usa rutas backend protegidas.
- Riot Sign On queda como pendiente hasta aprobacion oficial de Riot.

## Pendiente futuro

- Mostrar datos reales de historial competitivo cuando Riot API lo permita.
- Activar RSO oficial al obtener credenciales aprobadas.
- Agregar panel de auditoria personal y sesiones activas.
- Mejorar `Mis partidas` con ruta real de listado cuando el modulo este completo.
