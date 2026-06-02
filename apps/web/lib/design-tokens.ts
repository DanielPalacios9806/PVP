export const darksideTokens = {
  brand: {
    name: "Darkside.cool",
    red: "#ff2438",
    redDeep: "#b90f24",
    redGlow: "#ff3a4e",
    cyan: "#18e6f2",
    cyanDeep: "#0796a8",
    gold: "#ffb21a"
  },
  background: {
    page: "#05080c",
    pageSoft: "#080d12",
    surface: "#0e151c",
    surfaceStrong: "#121b24",
    glass: "rgba(14, 21, 28, 0.78)"
  },
  text: {
    primary: "#f5f7fa",
    secondary: "#b4bec8",
    muted: "#6d7886",
    disabled: "#3e4854"
  },
  border: {
    soft: "rgba(255, 255, 255, 0.08)",
    strong: "rgba(255, 255, 255, 0.14)",
    red: "rgba(255, 36, 56, 0.55)",
    cyan: "rgba(24, 230, 242, 0.55)"
  },
  radius: {
    xs: "6px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
    full: "999px"
  },
  shadow: {
    card: "0 16px 40px rgba(0, 0, 0, 0.35)",
    panel: "0 24px 80px rgba(0, 0, 0, 0.42)",
    redGlow: "0 0 24px rgba(255, 36, 56, 0.35)",
    cyanGlow: "0 0 24px rgba(24, 230, 242, 0.25)"
  }
} as const;

export const darksideClass = {
  pageShell: "min-h-screen bg-ds-page text-ds-primary selection:bg-ds-red/30",
  container: "mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8",
  section: "py-6 md:py-8 lg:py-10",
  panel:
    "rounded-ds-lg border border-ds-border-soft bg-ds-surface/80 shadow-ds-card backdrop-blur-xl",
  panelStrong:
    "rounded-ds-xl border border-ds-border-strong bg-gradient-to-b from-ds-surface-strong/95 to-ds-surface/85 shadow-ds-panel backdrop-blur-xl",
  card:
    "rounded-ds-lg border border-ds-border-soft bg-ds-surface/75 shadow-ds-card backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-ds-red/40 hover:shadow-ds-red-glow",
  cardCyan:
    "rounded-ds-lg border border-ds-border-soft bg-ds-surface/75 shadow-ds-card backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-ds-cyan/40 hover:shadow-ds-cyan-glow",
  buttonPrimary:
    "inline-flex items-center justify-center gap-2 rounded-ds-md border border-ds-red/60 bg-gradient-to-r from-ds-red to-ds-red-deep px-5 py-3 text-sm font-bold text-white shadow-ds-red-glow transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
  buttonSecondary:
    "inline-flex items-center justify-center gap-2 rounded-ds-md border border-ds-cyan/60 bg-ds-page/70 px-5 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-ds-cyan/10 hover:shadow-ds-cyan-glow active:translate-y-0",
  buttonGhost:
    "inline-flex items-center justify-center gap-2 rounded-ds-md border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-ds-secondary transition duration-200 hover:border-ds-red/40 hover:text-white",
  badgeRed:
    "inline-flex items-center rounded-full border border-ds-red/45 bg-ds-red/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ds-red",
  badgeCyan:
    "inline-flex items-center rounded-full border border-ds-cyan/45 bg-ds-cyan/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ds-cyan",
  badgeGold:
    "inline-flex items-center rounded-full border border-ds-gold/45 bg-ds-gold/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ds-gold",
  stat:
    "rounded-ds-lg border border-white/10 bg-white/[0.035] p-4 shadow-inner shadow-black/20",
  eyebrow: "text-[11px] font-bold uppercase tracking-[0.34em] text-ds-red",
  h1: "font-heading text-4xl font-bold leading-[0.96] tracking-[-0.035em] text-white md:text-6xl lg:text-7xl",
  h2: "font-heading text-2xl font-bold leading-tight tracking-[-0.02em] text-white md:text-3xl",
  body: "text-sm leading-7 text-ds-secondary md:text-base",
  muted: "text-xs leading-6 text-ds-muted"
} as const;

export type DarksideTokenGroup = keyof typeof darksideTokens;
