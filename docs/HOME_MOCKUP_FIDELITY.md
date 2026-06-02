# Home Mockup Fidelity - Fase 2

## Objetivo

La Fase 2 transforma la pagina publica de Darkside.cool para acercarla a los mockups originales de `DarksideGG_Figma_Ready_Pack`. El foco es fidelidad visual, jerarquia UX y una landing que comunique claramente que el producto esta en beta cerrada y preparado para revision Riot sin afirmar una aprobacion oficial.

## Alcance aplicado

- Header premium con navegacion, busqueda visual y acciones de autenticacion.
- Hero cinematografico con assets oficiales locales, badges de estado, CTAs y metricas.
- Cards principales para League of Legends y VALORANT con imagen, metadata y estados.
- Seccion de torneos destacados con cards mas cercanas al mockup.
- Seccion de experiencia guiada para explicar el recorrido del usuario.
- Bloques de compliance: datos reales primero, Riot controlado, no monetario.
- Banda de confianza con tecnologias y principios del proyecto.
- Navegacion inferior mobile consistente con el diseño oscuro premium.

## Archivos modificados

- `apps/web/components/public-landing.tsx`
- `apps/web/app/globals.css`
- `scripts/check-release-readiness.mjs`

## Criterios UX

1. El usuario debe entender en menos de 60 segundos:
   - que es Darkside.cool;
   - que esta en beta cerrada;
   - que puede explorar torneos y crear equipo;
   - que Riot opera en modo mock/development hasta aprobacion;
   - que no hay apuestas ni premios monetarios.
2. La home debe mantener coherencia visual desktop/mobile.
3. La pagina no debe depender de datos falsos para verse funcional.
4. Los datos publicos deben usar API real cuando este disponible y fallback controlado cuando no existan torneos.

## Validacion esperada

Ejecutar:

```powershell
npm run build
npm run check:release
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

Luego generar ZIP:

```powershell
.\scripts\create-analysis-bundle.ps1 -NamePrefix "PVP_FASE2_HOME_MOCKUP_FIDELITY"
```

## Siguiente fase

Fase 3: `feat/tournaments-hub-fidelity`, enfocada en el explorador de torneos, filtros, cards, busqueda y responsive mobile.
