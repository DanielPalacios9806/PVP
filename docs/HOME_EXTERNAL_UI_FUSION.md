# Home External UI Fusion

La home publica de Darkside.cool usa una fusion visual externa controlada:
- patrones de landing premium inspirados en Aceternity/Magic UI,
- comportamiento accesible con primitives externas,
- iconografia Lucide React,
- tokens Darkside propios para colores, bordes, sombras y radios.

Reglas de implementacion:
1. La home publica no muestra Admin, Operacion, Tokens privados ni panel lateral derecho.
2. Los CTAs publicos llevan a rutas reales: torneos, equipos, login o registro.
3. Riot aparece como modo mock/development y disclaimer, no como integracion oficial aprobada.
4. Los assets oficiales Darkside se mantienen como fuente visual principal.
5. Los cambios visuales deben validarse con build, check:release y revision manual desktop/mobile.
