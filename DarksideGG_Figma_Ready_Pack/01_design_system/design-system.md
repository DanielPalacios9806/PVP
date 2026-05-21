# Darkside.gg — Design System Base

## Concepto visual

Darkside.gg usa una estética **premium esports / cyber arena**: fondo negro profundo, paneles translúcidos, acentos rojos agresivos y cian tecnológico. El diseño debe sentirse competitivo, moderno y serio, no infantil.

## Paleta principal

| Token | HEX | Uso |
|---|---:|---|
| `red_primary` | `#FF2438` | Botones principales, estados activos, CTA |
| `red_deep` | `#B90F24` | Gradientes rojos, hover, sombras |
| `red_glow` | `#FF3A4E` | Efectos neón |
| `cyan_primary` | `#18E6F2` | .gg, links, acentos secundarios |
| `cyan_deep` | `#0796A8` | Bordes secundarios, hover |
| `gold_prize` | `#FFB21A` | Premios, trofeos, prize pool |
| `bg_950` | `#05080C` | Fondo general |
| `surface_900` | `#0E151C` | Cards y paneles |
| `surface_800` | `#121B24` | Estados hover / panel destacado |
| `text_primary` | `#F5F7FA` | Títulos y texto principal |
| `text_secondary` | `#B4BEC8` | Texto descriptivo |
| `text_muted` | `#6D7886` | Labels y metadata |

## Tipografía recomendada

Para acercarte al mockup:

- **Títulos / Display:** Rajdhani Bold, Sora Bold o Eurostile Extended si tienes licencia.
- **Texto UI:** Inter, Sora o Montserrat.
- **Números / stats:** Rajdhani SemiBold o Sora SemiBold.

Jerarquía sugerida:

| Estilo | Desktop | Mobile | Peso |
|---|---:|---:|---:|
| Hero title | 64–76 px | 42–52 px | 700 |
| Section title | 20–24 px | 18–20 px | 700 |
| Card title | 18–22 px | 16–18 px | 600 |
| Body | 15–17 px | 14–16 px | 400 |
| Caption | 12–13 px | 11–12 px | 500 |

## Bordes y radios

- Cards principales: 16 px.
- Botones: 10–12 px.
- Badges: 999 px.
- Inputs: 10 px.

## Efectos

- Cards: `border: 1px solid rgba(255,255,255,0.08)`.
- Glass: fondo `rgba(14,21,28,0.78)` + blur suave.
- Glow rojo: `0 0 24px rgba(255,36,56,0.35)`.
- Glow cian: `0 0 24px rgba(24,230,242,0.25)`.

## Reglas de estilo

- El rojo se usa para acción, peligro, torneos destacados y navegación activa.
- El cian se usa para links, .gg, bordes secundarios y énfasis tecnológico.
- El dorado se reserva para premios y trofeos.
- No abuses de fondos con imagen; usa overlays oscuros para mantener legibilidad.
