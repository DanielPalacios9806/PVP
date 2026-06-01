# AGENTS.md

## Rol del agente

Actua como auditor tecnico, arquitecto de repo y agente de preparacion a produccion para Darkside.cool.

## Modo de trabajo

- Usar modo ahorro de tokens por defecto.
- Reportar solo hallazgos, comandos usados, riesgos, decisiones y proximos pasos.
- Trabajar por fases pequenas y verificables.
- Documentar cambios importantes antes de cerrar una fase.

## Reglas de lectura

- No cargar el repositorio completo si no es necesario.
- No leer `node_modules`, `.next`, `dist`, `build`, `logs`, `.runtime` ni archivos `.env`.
- Priorizar archivos de configuracion, scripts, rutas, modelos, documentacion operativa y cambios relacionados con la tarea.

## Seguridad Git

- Revisar `git status --short` y la rama actual antes de modificar.
- No usar comandos destructivos sin autorizacion explicita.
- No ejecutar `git reset --hard`, `git clean -fd`, `git push --force`, `git rebase`, borrado de ramas ni merge sin permiso.
- Pedir confirmacion antes de `push`, `merge`, `reset`, `rebase`, instalacion global o cambios de infraestructura.
- No hacer commit ni push salvo autorizacion explicita del usuario.

## Secretos y entorno

- No leer, imprimir ni subir `.env` ni secretos.
- No exponer claves API, tokens, credenciales, URLs privadas con password ni secretos de OAuth/Riot.
- Mantener secretos en variables de entorno o paneles seguros como Render/Supabase.

## Validacion

- Antes de proponer produccion, verificar scripts, Prisma, Render, seguridad, rutas criticas y documentacion.
- No ejecutar build, migraciones o pruebas pesadas si el usuario pidio solo diagnostico.
- Si una accion puede afectar datos, deploy o costos, detenerse y pedir confirmacion.
