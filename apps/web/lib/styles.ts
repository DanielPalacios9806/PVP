/**
 * Reusable Tailwind CSS classes and constants
 * Riot/Valorant Aesthetic
 */

// ============================================================================
// GLOW EFFECTS
// ============================================================================

export const glow = {
  red: "shadow-glow-red",
  redLg: "shadow-glow-red-lg",
  cyan: "shadow-glow-cyan",
  inset: "shadow-glow-inset"
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const text = {
  // Headings - Oxanium, uppercase, bold, wide tracking
  heading: "font-heading uppercase font-bold tracking-[0.06em]",
  headingLarge: "text-3xl font-heading uppercase font-bold tracking-[0.06em]",
  headingMedium: "text-xl font-heading uppercase font-bold tracking-[0.06em]",
  headingSmall: "text-sm font-heading uppercase font-bold tracking-[0.06em]",

  // Labels - Oxanium, uppercase, semibold
  label: "text-xs font-heading uppercase font-semibold tracking-[0.04em]",
  labelMedium: "text-sm font-heading uppercase font-semibold tracking-[0.04em]",

  // Body - Sora, normal case
  body: "font-body text-base text-text-primary leading-relaxed",
  bodySm: "font-body text-sm text-text-secondary leading-relaxed",
  bodyXs: "font-body text-xs text-text-tertiary leading-relaxed"
};

// ============================================================================
// BUTTONS
// ============================================================================

export const button = {
  base: "inline-flex items-center justify-center gap-2 transition-all duration-200 rounded-[4px]",

  // Primary - Red accent
  primary:
    "bg-accent-red text-riot-darkest font-bold uppercase tracking-[0.04em] px-4 py-2 hover:bg-opacity-90 hover:shadow-glow-red active:scale-95",
  primaryLarge:
    "bg-accent-red text-riot-darkest font-bold uppercase tracking-[0.04em] px-6 py-3 hover:bg-opacity-90 hover:shadow-glow-red active:scale-95",

  // Secondary - Cyan accent
  secondary:
    "border-2 border-accent-cyan text-accent-cyan font-bold uppercase tracking-[0.04em] px-4 py-2 hover:bg-accent-cyan/10 hover:shadow-glow-cyan active:scale-95",

  // Tertiary - Ghost
  tertiary:
    "border border-white/20 text-text-primary font-bold uppercase tracking-[0.04em] px-4 py-2 hover:border-accent-red/50 hover:text-accent-red active:scale-95",

  // Disabled
  disabled: "opacity-50 cursor-not-allowed"
};

// ============================================================================
// PANELS & CARDS
// ============================================================================

export const panel = {
  base: "rounded-[4px] border border-white/10 bg-riot-dark/40 backdrop-blur-sm",
  baseAccent: "rounded-[4px] border border-white/10 border-l-4 border-l-accent-red/50 bg-riot-dark/40 backdrop-blur-sm",

  // With padding
  default: "rounded-[4px] border border-white/10 bg-riot-dark/40 backdrop-blur-sm p-4",
  defaultAccent:
    "rounded-[4px] border border-white/10 border-l-4 border-l-accent-red/50 bg-riot-dark/40 backdrop-blur-sm p-4",

  // Large padding
  large: "rounded-[4px] border border-white/10 bg-riot-dark/40 backdrop-blur-sm p-6",
  largeAccent:
    "rounded-[4px] border border-white/10 border-l-4 border-l-accent-red/50 bg-riot-dark/40 backdrop-blur-sm p-6",

  // Hover effect
  hover: "hover:border-accent-red/50 hover:bg-riot-dark/60 transition-all"
};

// ============================================================================
// INPUTS & FORMS
// ============================================================================

export const input = {
  base: "w-full rounded-[4px] border border-white/10 bg-riot-darker/50 px-3 py-2 text-text-primary placeholder-text-tertiary outline-none transition-all focus:border-accent-red/50 focus:shadow-glow-red",
  large: "w-full rounded-[4px] border border-white/10 bg-riot-darker/50 px-4 py-3 text-text-primary placeholder-text-tertiary outline-none transition-all focus:border-accent-red/50 focus:shadow-glow-red"
};

// ============================================================================
// GRIDS & LAYOUTS
// ============================================================================

export const grid = {
  dashboard: "grid grid-cols-[240px_1fr_300px] gap-4",
  dashboardTablet: "md:grid-cols-[80px_1fr]",
  dashboardMobile: "sm:grid-cols-1",

  // For responsive sidebars
  responsiveLeft: "flex md:hidden lg:flex",
  responsiveRight: "hidden lg:flex"
};

// ============================================================================
// SPACING UTILITIES
// ============================================================================

export const spacing = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8"
};

// ============================================================================
// BORDERS & SHADOWS
// ============================================================================

export const border = {
  accent: "border-b-2 border-accent-red",
  accentSoft: "border-b border-accent-red/50",
  subtle: "border border-white/5",
  medium: "border border-white/10",
  strong: "border border-white/20",
  left: "border-l-4 border-l-accent-red/50",
  leftCyan: "border-l-4 border-l-accent-cyan/50"
};

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transition = {
  fast: "transition-all duration-150",
  normal: "transition-all duration-300",
  slow: "transition-all duration-500"
};

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536
};

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Riot Palette
  riotDarkest: "#0F1923",
  riotDark: "#1F2933",
  riotDarker: "#18242E",

  // Accents
  accentRed: "#FF4655",
  accentCyan: "#0AC8B9",
  accentGold: "#D6AF37",

  // Text
  textPrimary: "#ECE8E1",
  textSecondary: "#C3BFB7",
  textTertiary: "#9A9590"
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combines multiple style classes into a single string
 * @param classes - Variable number of class strings
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Creates a glow effect with custom color
 * @param color - hex color code
 * @param intensity - opacity 0-1
 * @returns Tailwind shadow class
 */
export function createGlow(color: string, intensity: number = 0.5): string {
  const rgb = hexToRgb(color);
  if (!rgb) return "";
  return `shadow-[0_0_20px_rgba(${rgb.r},${rgb.g},${rgb.b},${intensity})]`;
}

/**
 * Convert hex color to RGB
 * @param hex - hex color code
 * @returns Object with r, g, b values or null
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}
