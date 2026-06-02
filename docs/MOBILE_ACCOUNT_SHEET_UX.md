# Mobile Account Sheet UX

La cuenta del usuario usa dos patrones separados:

- **Desktop (`lg+`)**: `AccountMenu` se mantiene como dropdown compacto.
- **Mobile/tablet (`<lg`)**: `MobileAccountSheet` usa Radix Dialog para abrir un panel real con overlay, boton de cierre y accion fija de cerrar sesion.

## Motivo

El dropdown anterior intentaba resolver desktop y mobile en el mismo componente. En el rango de 640px a 1024px se activaban estilos de escritorio y el menu crecia demasiado, impidiendo cerrar sesion o navegar con comodidad.

## Regla

No se deben resolver comportamientos mobile con breakpoints dentro del dropdown de escritorio. El boton `DA` en mobile debe abrir siempre un sheet dedicado.
