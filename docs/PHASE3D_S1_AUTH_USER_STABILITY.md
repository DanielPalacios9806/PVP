# Phase 3D-S1 Auth + Real User Stability

Objetivo: estabilizar la entrada de usuarios reales y el dashboard antes de operar beta con jugadores externos.

## Cambios

- Login mobile-first: el formulario queda primero en movil para reducir scroll.
- Header auth: Inicio/Torneos se ocultan en movil; Login/Registro se mantienen visibles.
- Registro: los usuarios nuevos requieren correo con formato real y confirmacion de contrasena.
- Compatibilidad: no se migran ni bloquean cuentas antiguas de prueba.
- Login: se prepara el identificador de acceso para correo o usuario sin exigir migracion.
- Dashboard: avatar Riot con fallback a marca Darkside si Data Dragon falla.
- Auditoria: la UI enmascara IPs; el backend conserva la auditoria original.

## Fuera de alcance

- No se activa RSO real.
- No se toca Riot API key ni riot.txt.
- No se implementa Toornament ni Tournament API.
- No se migra usuarios existentes.
