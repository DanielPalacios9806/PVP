# RIOT_DEVELOPER_APPLICATION.md

## Objetivo

Preparar el argumento técnico y operativo para solicitar acceso de producción a Riot Developer API para Darkside.cool.

## Estado actual de Darkside.cool

Darkside.cool es una plataforma web de torneos esports orientada a comunidades universitarias y competitivas. El sistema incluye:

- autenticación local;
- roles operativos (`USER`, `ORGANIZER`, `MODERATOR`, `FINANCE`, `ADMIN`, `SUPER_ADMIN`);
- equipos y perfiles competitivos;
- torneos, inscripciones y brackets;
- salas de match;
- reporte de resultados;
- evidencias y disputas;
- moderación y auditoría;
- tokens internos no monetarios;
- preparación Riot server-side.

## Alcance solicitado por etapas

### Etapa 1 — Production API Key

Solicitar uso backend de endpoints necesarios para datos competitivos básicos:

- `account-v1`: resolver Riot ID y PUUID;
- `summoner-v4`: obtener datos básicos de perfil LoL;
- `league-v4`: mostrar ranking SoloQ/Flex;
- `match-v5`: mostrar historial reciente y métricas de partidas.

### Etapa 2 — Riot Sign On / OAuth

Solicitar Riot Sign On para confirmar propiedad real de cuenta Riot.

Regla interna:

- `LOOKUP_ONLY`: la cuenta existe, pero no se confirma propiedad.
- `RSO_PENDING`: Darkside está preparado, pero falta aprobación/configuración.
- `RSO_VERIFIED`: propiedad confirmada oficialmente mediante Riot Sign On.

Mientras no exista RSO real, la UI no debe decir que la cuenta está vinculada oficialmente.

### Etapa 3 — Tournament API / Tournament Codes

Solicitar Tournament Codes reales solo después de tener:

- Production API Key;
- RSO o flujo de propiedad aprobado;
- callback validado;
- moderación activa;
- auditoría de resultados;
- políticas visibles.

Hasta entonces, Darkside mantiene flujo manual/sandbox.

## Seguridad y cumplimiento

- `RIOT_API_KEY` vive solo en backend/API.
- No se usa `NEXT_PUBLIC_RIOT_API_KEY` ni claves Riot en frontend.
- `.env` y `apps/api/.env` no se versionan.
- La plataforma no permite apuestas, cash wagering, skins betting, blockchain ni conversión de tokens a dinero real.
- DS_TOKEN es interno, no monetario, no retirable y no convertible.
- La plataforma debe mostrar que no está afiliada, patrocinada ni respaldada por Riot Games.

## URLs que deben estar listas antes de enviar solicitud

- `https://darkside.cool`
- `https://darkside.cool/auth/login`
- `https://darkside.cool/dashboard`
- `https://darkside.cool/dashboard/account`
- `https://darkside.cool/dashboard/tournaments`
- `https://darkside.cool/legal/terms`
- `https://darkside.cool/legal/privacy`
- `https://darkside.cool/legal/data-deletion`

## Texto base para la solicitud

```text
Darkside.cool es una plataforma web de torneos esports orientada a comunidades universitarias y competitivas. La aplicación permite registro de usuarios, equipos, torneos, brackets, salas de match, reporte de resultados, disputas, moderación, auditoría y tokens internos no monetarios.

Solicitamos Production API Key para integrar datos competitivos de League of Legends de forma segura desde backend, sin exponer claves en frontend. Inicialmente usaremos Account-V1 para validar Riot ID y obtener PUUID, Summoner-V4 / League-V4 para mostrar información competitiva básica, y Match-V5 para historial reciente.

La plataforma diferencia claramente entre validación técnica y propiedad oficial de cuenta. No afirmamos que una cuenta está vinculada oficialmente hasta implementar Riot Sign On mediante OAuth. Por eso solicitamos también RSO para verificar propiedad real de cuenta Riot antes de habilitar torneos competitivos formales.

Darkside.cool no permite apuestas, gambling, cash wagering, skins betting, blockchain ni conversión de tokens internos a dinero real. Los DS_TOKEN son puntos internos no monetarios, no retirables y no convertibles.

La API key se mantiene exclusivamente en backend/variables de entorno de producción, nunca en frontend ni repositorios públicos.
```

## Evidencias recomendadas para adjuntar o mencionar

- Captura del dashboard competitivo.
- Captura de `/dashboard/account` mostrando Riot ID como validación técnica.
- Captura de admin Riot readiness.
- Captura de torneos/bracket/match room.
- Captura de términos/privacidad/data deletion.
- Explicación breve de moderación, disputas y auditoría.

## No prometer en la solicitud

- No prometer Tournament Codes reales si aún no están aprobados.
- No decir que Riot ID está oficialmente vinculado sin RSO.
- No presentar DS_TOKEN como moneda, premio económico o retiro.
- No usar logos de Riot como marca principal de Darkside.cool.
