# Bruno Collection

Esta carpeta deja una base de pruebas manuales para cuando PostgreSQL este disponible.

## Variables recomendadas
- `baseUrl`: `http://localhost:4000/api`
- `token`: JWT obtenido en login
- `teamId`
- `spaceId`
- `tournamentId`
- `registrationId`
- `matchId`
- `resultId`
- `disputeId`

## Flujo sugerido
1. Registrar usuario.
2. Login y guardar `token`.
3. Crear team.
4. Crear space.
5. Crear torneo con usuario admin.
6. Registrar participante.
7. Hacer check-in.
8. Generar bracket.
9. Crear match.
10. Reportar resultado.
11. Confirmar resultado o abrir disputa.
12. Revisar auditoría.
