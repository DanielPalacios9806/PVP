# RIOT_PRODUCTION_APPLICATION.md

## Proposito

Este documento resume como Darkside.cool debe presentarse ante Riot Developer Portal para solicitar Production Key, Riot Sign On (RSO) y, posteriormente, acceso a Tournament Codes.

## Producto

Darkside.cool es una plataforma de torneos esports orientada a comunidades universitarias y competitivas. El MVP incluye autenticacion, roles, equipos, torneos, brackets, salas de match, reporte de resultados, disputas, moderacion, auditoria y tokens internos no monetarios.

## Uso previsto de Riot API

- `account-v1`: validar que un Riot ID existe y obtener PUUID.
- `summoner-v4`: mostrar informacion competitiva basica de League of Legends como icono de perfil y nivel.
- `league-v4`: mostrar ranking SoloQ/Flex por PUUID.
- `match-v5`: mostrar historial reciente y datos de partida.
- RSO: confirmar propiedad oficial de la cuenta Riot antes de torneos competitivos formales.
- Tournament Codes: automatizar salas y resultados cuando Riot apruebe provider/callback.

## Diferencia entre lookup y propiedad

Darkside no considera una cuenta como oficialmente vinculada solo porque exista un `gameName#tagLine`.

Estados usados:

- `LOOKUP_ONLY`: Riot ID existe, pero propiedad no confirmada.
- `RSO_PENDING`: cuenta guardada para pruebas internas; requiere Riot Sign On.
- `RSO_VERIFIED`: estado futuro, solo cuando el usuario inicie sesion mediante Riot Sign On.

## Seguridad

- La `RIOT_API_KEY` vive solo en backend.
- No se expone en `NEXT_PUBLIC_*`.
- No se guarda en GitHub.
- Las consultas a Riot pasan por endpoints internos protegidos.
- Las acciones administrativas requieren rol adecuado.
- Se registran eventos en auditoria.

## Politicas y cumplimiento

- La plataforma no permite apuestas, gambling, cash wagering, skins betting, blockchain ni conversion de tokens a dinero.
- `DS_TOKEN` es interno, no retirable y no convertible a moneda real.
- El usuario puede consultar politicas visibles en:
  - `/legal/terms`
  - `/legal/privacy`
  - `/legal/data-deletion`
- Darkside.cool no esta afiliado, patrocinado ni respaldado por Riot Games.

## Flujo RSO objetivo

1. Usuario presiona **Conectar con Riot**.
2. Backend genera un `state` seguro.
3. Darkside redirige al login oficial de Riot.
4. Usuario inicia sesion en Riot y autoriza.
5. Riot redirige al `RIOT_RSO_REDIRECT_URI`.
6. Backend valida `state` e intercambia `code` por token.
7. Backend consulta identidad Riot autenticada.
8. Backend actualiza la cuenta como `RSO_VERIFIED` y `ownershipVerified=true`.
9. Se registra auditoria de exito o fallo.

## Estado actual

- Lookup tecnico funcionando.
- Compatibility spike probado con Account-V1, Summoner-V4, League-V4 por PUUID y Match-V5.
- Dashboard competitivo muestra datos Riot sin afirmar propiedad oficial.
- RSO queda en modo preparado hasta Production Key.
- Tournament Codes quedan en modo futuro hasta aprobacion y callback publico.

## Checklist antes de enviar a Riot

- [ ] Deploy estable en `https://darkside.cool`.
- [ ] Politica de privacidad visible.
- [ ] Terminos visibles.
- [ ] Politica de eliminacion visible.
- [ ] No gambling ni tokens monetarios.
- [ ] API key solo backend.
- [ ] RSO copy claro: lookup no prueba propiedad.
- [ ] Demo de torneos funcionando.
- [ ] Moderacion y auditoria funcionando.
- [ ] Dominio verificado cuando Riot lo solicite.
