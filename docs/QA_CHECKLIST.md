# QA_CHECKLIST.md

## Objetivo

Checklist de pruebas para validar que Darkside.cool funciona correctamente antes y después de cada despliegue.

## 1. Login y registro

- [ ] Login con usuario normal.
- [ ] Login con ADMIN.
- [ ] Login con MODERATOR.
- [ ] Login con FINANCE.
- [ ] Registro de nueva cuenta.
- [ ] Mensajes claros en errores de contraseña o usuario inexistente.
- [ ] No aparece error técnico al usuario final.

## 2. Roles y accesos

### USER

- [ ] Puede entrar a dashboard.
- [ ] Puede ver torneos.
- [ ] Puede ver equipos y spaces.
- [ ] Puede ver tokens propios.
- [ ] No puede entrar a `/dashboard/admin`.
- [ ] No puede entrar a `/dashboard/moderation`.

### ORGANIZER

- [ ] Puede operar solo sus propios torneos.
- [ ] No puede operar torneos de otro organizador.
- [ ] No puede administrar usuarios.
- [ ] No puede administrar tokens financieros.

### MODERATOR

- [ ] Puede entrar a moderación.
- [ ] Puede revisar disputas y matches.
- [ ] No puede cambiar roles.
- [ ] No puede ajustar tokens.

### FINANCE

- [ ] Puede entrar a tokens.
- [ ] Puede revisar movimientos.
- [ ] No puede entrar a moderación.
- [ ] No puede operar torneos.

### ADMIN / SUPER_ADMIN

- [ ] Puede acceder a admin.
- [ ] Puede ver auditoría.
- [ ] Puede ver historial de actividad de usuario.
- [ ] Puede moderar disputas.
- [ ] Puede gestionar tokens.
- [ ] Puede operar torneos.

## 3. Torneos

- [ ] Listado de torneos carga correctamente.
- [ ] Torneos donde participa el usuario aparecen primero.
- [ ] Detalle premium del torneo carga sin errores.
- [ ] Hero del torneo no rompe aunque no exista imagen.
- [ ] Bracket se muestra correctamente.
- [ ] Panel operativo aparece solo a roles permitidos.
- [ ] Inscripción bloquea conflictos de horario.
- [ ] Inscripción bloquea torneo lleno.
- [ ] Inscripción bloquea torneo cerrado.
- [ ] Check-in aparece solo cuando corresponde.

## 4. Matches

- [ ] Sala de match carga correctamente.
- [ ] Se ve Equipo A vs Equipo B.
- [ ] Se ve estado del match.
- [ ] Se puede reportar resultado.
- [ ] Se puede adjuntar evidencia por URL.
- [ ] Resultado pendiente se muestra claramente.
- [ ] Rival/staff puede aceptar o disputar.
- [ ] Admin/moderador puede resolver disputa.
- [ ] Ganador avanza en bracket.
- [ ] Final muestra campeón.

## 5. Moderación

- [ ] Panel de moderación carga.
- [ ] Muestra disputas abiertas.
- [ ] Muestra resultados pendientes.
- [ ] Permite abrir sala de match.
- [ ] Permite resolver disputa.
- [ ] Permite confirmar/rechazar resultado.

## 6. Auditoría

- [ ] Panel de auditoría carga en admin.
- [ ] Búsqueda por token funciona.
- [ ] Búsqueda por tournament funciona.
- [ ] Búsqueda por match/dispute funciona.
- [ ] Filtro de críticos funciona.
- [ ] Detalle técnico muestra metadata sin romper.

## 7. Tokens

- [ ] Panel de tokens carga.
- [ ] Se puede buscar usuario.
- [ ] Ajuste positivo funciona.
- [ ] Ajuste negativo pide confirmación.
- [ ] Historial de transacciones se muestra.
- [ ] No aparece selector blanco ilegible.

## 8. Seguridad

- [ ] Rutas protegidas no abren con rol incorrecto.
- [ ] API no expone stack trace en producción.
- [ ] CORS no bloquea frontend oficial.
- [ ] Render no muestra errores P1001/P2028.
- [ ] Variables de entorno están completas.
- [ ] `.env` no está versionado.

## 9. Producción

- [ ] `https://darkside.cool/auth/login` carga.
- [ ] `https://darkside.cool/dashboard` carga.
- [ ] `https://darkside.cool/dashboard/admin` carga solo para admin.
- [ ] `https://darkside.cool/dashboard/moderation` carga solo para moderación/admin.
- [ ] `https://darkside.cool/dashboard/tournaments` carga.
- [ ] `https://darkside.cool/dashboard/tokens` carga según rol.


## 10. Requisitos Riot para torneos LoL/VALORANT

- [ ] Un torneo LoL/VALORANT muestra visualmente “Riot ID requerido”.
- [ ] Un usuario sin Riot ID no puede inscribirse y es guiado a `/dashboard/account`.
- [ ] Un usuario con Riot ID validado técnicamente puede inscribirse en modo MVP.
- [ ] La UI aclara que la validación técnica no confirma propiedad oficial.
- [ ] Un torneo que no es LoL/VALORANT no exige Riot ID.
- [ ] En torneos por equipo, todos los miembros deben tener Riot ID validado técnicamente.
- [ ] El backend bloquea la inscripción aunque el usuario intente llamar el endpoint manualmente.
