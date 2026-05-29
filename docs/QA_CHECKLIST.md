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


## 11. Riot API compatibility spike

- [ ] El panel admin muestra el bloque “Compatibility spike”.
- [ ] `POST /api/riot/capabilities/check` solo responde para ADMIN/SUPER_ADMIN.
- [ ] Account-V1 devuelve estado OK para un Riot ID real.
- [ ] Summoner-V4 muestra nivel e ícono cuando están disponibles.
- [ ] League-V4 muestra SoloQ/Flex cuando la cuenta tiene ranked.
- [ ] Match-V5 devuelve historial reciente.
- [ ] Match detail muestra campeón, resultado, KDA y posición de una partida de muestra.
- [ ] RSO aparece como pendiente/requiere aprobación y no se presenta como vinculación oficial.
- [ ] Tournament Codes aparecen como futuro/no configurado si falta provider/callback.

## 12. Riot visual dashboard

- [ ] El dashboard carga aunque Riot API no responda.
- [ ] Si existe Riot ID validado, se muestra ícono de perfil por Data Dragon.
- [ ] Si League-V4 responde, se muestra ranking SoloQ/Flex.
- [ ] Si Match-V5 responde, se muestra historial reciente con campeón y KDA.
- [ ] Si no hay Riot ID, el dashboard muestra CTA hacia `/dashboard/account`.
- [ ] El panel no afirma propiedad oficial sin Riot Sign On.
- [ ] Las imágenes remotas de Data Dragon cargan correctamente.

## 13. RSO readiness y solicitud Riot

- [ ] `GET /api/riot/rso/status` responde sin exponer secretos.
- [ ] `GET /api/riot/rso/start` no intenta OAuth real sin Production Key.
- [ ] `GET /api/riot/rso/callback-preview` muestra redirect URI objetivo y controles de seguridad.
- [ ] `GET /api/riot/compliance/readiness` solo responde para ADMIN/SUPER_ADMIN.
- [ ] Panel admin Riot muestra checklist RSO readiness.
- [ ] Se ve el estado de credenciales RSO faltantes.
- [ ] Se listan Terms, Privacy y Data Deletion como rutas visibles.
- [ ] La UI sigue diferenciando lookup tecnico de propiedad oficial.
- [ ] El texto legal indica no gambling y tokens no monetarios.
- [ ] El sistema no afirma afiliacion oficial con Riot.

## 14. Automatización simulada de torneos

- [ ] El detalle del torneo muestra timeline de automatización.
- [ ] El panel operativo guía cierre de registro, check-in, bracket e inicio.
- [ ] La pestaña Automatización explica cada fase del flujo.
- [ ] La match room muestra código de sala manual/simulado.
- [ ] El código simulado no se presenta como Tournament Code oficial.
- [ ] El reporte de resultado sigue funcionando.
- [ ] La disputa y confirmación siguen actualizando el estado.
- [ ] El bracket avanza después de confirmar resultado.


## 15. Tournament callback sandbox

- [ ] Desde el panel admin Riot se puede pegar un matchId válido.
- [ ] El simulador permite seleccionar ganador A/B.
- [ ] El callback sandbox crea un evento `RiotCallbackEvent`.
- [ ] El match pasa a COMPLETED.
- [ ] El ganador queda registrado.
- [ ] El bracket avanza si aplica.
- [ ] El resultado queda marcado como `MOCK_RIOT`, no como callback oficial Riot.
- [ ] Un usuario sin rol permitido no puede simular callback.
- [ ] El match room sigue mostrando reporte/disputa sin romperse.

## 16. Release candidate / entrada a producción

- [ ] `git status --short` solo muestra cambios esperados de la fase actual.
- [ ] No quedan ZIPs, carpetas de revisión ni patches locales en el status.
- [ ] `npm.cmd run build:shared` pasa.
- [ ] `npm.cmd run build:api` pasa.
- [ ] `npm.cmd run build:web` pasa.
- [ ] `/dashboard`, `/dashboard/account`, `/dashboard/tournaments` y `/dashboard/matches` cargan en local.
- [ ] `/legal/terms`, `/legal/privacy` y `/legal/data-deletion` cargan en local y producción.
- [ ] `git grep -n "RGAPI-"` no encuentra claves reales.
- [ ] `git grep -n "NEXT_PUBLIC_RIOT"` no encuentra variables Riot expuestas al frontend.
- [ ] Render despliega API y Web sin errores.
- [ ] La `RIOT_API_KEY` está solo en Render API Environment, no en Web.

## 17. Paquete para Riot Developer Portal

- [ ] `docs/RIOT_DEVELOPER_APPLICATION.md` está actualizado.
- [ ] Existe demo funcional en `https://darkside.cool`.
- [ ] Se puede explicar el flujo de torneos, matches, disputas y auditoría.
- [ ] Se puede mostrar que DS_TOKEN no es dinero real, no es retirable y no habilita apuestas.
- [ ] Se puede mostrar que Riot ID lookup no confirma propiedad.
- [ ] Se puede explicar que RSO será obligatorio para propiedad oficial.
- [ ] Se puede explicar que Tournament Codes reales son fase futura posterior a aprobación.
