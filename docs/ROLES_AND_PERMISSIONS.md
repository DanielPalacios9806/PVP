# ROLES_AND_PERMISSIONS.md

## Roles del sistema

Darkside.cool maneja los siguientes roles:

- USER
- ORGANIZER
- MODERATOR
- FINANCE
- ADMIN
- SUPER_ADMIN

## Matriz general de accesos

| Ruta | USER | ORGANIZER | MODERATOR | FINANCE | ADMIN | SUPER_ADMIN |
|---|---:|---:|---:|---:|---:|---:|
| `/dashboard` | Sí | Sí | Sí | Sí | Sí | Sí |
| `/dashboard/account` | Sí | Sí | Sí | Sí | Sí | Sí |
| `/dashboard/tournaments` | Sí | Sí | Sí | Sí | Sí | Sí |
| `/dashboard/teams` | Sí | Sí | Sí | Sí | Sí | Sí |
| `/dashboard/spaces` | Sí | Sí | Sí | Sí | Sí | Sí |
| `/dashboard/tokens` | Propios | No financiero | No | Sí | Sí | Sí |
| `/dashboard/moderation` | No | No | Sí | No | Sí | Sí |
| `/dashboard/admin` | No | No | No | No | Sí | Sí |
| `/dashboard/admin/profiles` | No | No | No | No | Sí | Sí |

## USER

Puede:

- Ver dashboard.
- Ver torneos.
- Inscribirse si cumple requisitos.
- Ver sus matches.
- Reportar resultados donde participa.
- Ver sus tokens.

No puede:

- Moderar disputas.
- Operar torneos.
- Ajustar tokens.
- Ver auditoría.
- Administrar usuarios.

## ORGANIZER

Puede:

- Operar torneos donde realmente es organizador.
- Abrir/cerrar registro de sus torneos.
- Abrir check-in de sus torneos.
- Generar bracket de sus torneos.
- Iniciar/finalizar sus torneos.

No puede:

- Operar torneos ajenos.
- Administrar usuarios.
- Ajustar tokens financieros.
- Ver auditoría global.
- Entrar al panel de moderación general.

## MODERATOR

Puede:

- Entrar a moderación.
- Revisar disputas.
- Confirmar/rechazar resultados según permisos.
- Resolver conflictos de matches.

No puede:

- Ajustar tokens.
- Cambiar roles.
- Operar torneos como organizer.
- Acceder a administración general de usuarios.

## FINANCE

Puede:

- Entrar al panel de tokens.
- Revisar movimientos.
- Ajustar tokens si el backend lo permite.
- Ver historial financiero interno.

No puede:

- Moderar disputas.
- Operar torneos.
- Cambiar roles.
- Entrar al panel admin general.

## ADMIN

Puede:

- Administrar usuarios.
- Ver auditoría.
- Ver historial de actividad de usuarios.
- Moderar disputas.
- Operar torneos.
- Gestionar tokens.
- Validar resultados.

## SUPER_ADMIN

Tiene acceso total al sistema.

Debe usarse solo para operaciones críticas:

- Cambios de rol.
- Desactivación de usuarios.
- Revisión de auditoría.
- Correcciones administrativas.
- Operaciones sensibles de producción.

## Reglas importantes

- Ocultar botones en frontend no es suficiente.
- Toda acción sensible debe estar bloqueada también en backend.
- Las acciones críticas deben mostrar confirmación.
- Cancelar, finalizar, generar bracket o descontar tokens debe requerir confirmación explícita.
