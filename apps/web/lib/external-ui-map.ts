export type ExternalUiLibrary = {
  name: string;
  packageNames: string[];
  role: string;
  darksideUsage: string[];
  applyNow: boolean;
};

export const externalUiLibraries: ExternalUiLibrary[] = [
  {
    name: "Radix UI",
    packageNames: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-accordion",
      "@radix-ui/react-select",
      "@radix-ui/react-switch"
    ],
    role: "Primitivos accesibles para interacción real.",
    darksideUsage: ["menus", "tabs", "drawers", "filters", "admin dropdowns", "mobile sheets"],
    applyNow: true
  },
  {
    name: "Motion",
    packageNames: ["motion"],
    role: "Microinteracciones y transiciones premium.",
    darksideUsage: ["hero reveal", "card hover", "tab transitions", "mobile drawer motion"],
    applyNow: true
  },
  {
    name: "Lucide React",
    packageNames: ["lucide-react"],
    role: "Iconografía consistente y tree-shakable.",
    darksideUsage: ["nav icons", "dashboard widgets", "tournament metadata", "empty states"],
    applyNow: true
  },
  {
    name: "Recharts",
    packageNames: ["recharts"],
    role: "Gráficas de dashboard y métricas competitivas.",
    darksideUsage: ["radar", "line charts", "bar stats", "token/activity trends"],
    applyNow: true
  },
  {
    name: "Embla Carousel",
    packageNames: ["embla-carousel-react"],
    role: "Carruseles mobile ligeros.",
    darksideUsage: ["featured tournaments", "game cards", "sponsors", "community highlights"],
    applyNow: true
  },
  {
    name: "clsx + tailwind-merge",
    packageNames: ["clsx", "tailwind-merge"],
    role: "Composición segura de clases Tailwind.",
    darksideUsage: ["UI wrappers", "variant components", "external block adaptation"],
    applyNow: true
  },
  {
    name: "Playwright",
    packageNames: ["@playwright/test"],
    role: "Capturas y QA visual contra mockups.",
    darksideUsage: ["home screenshot", "dashboard screenshot", "tournaments screenshot", "mobile regression"],
    applyNow: true
  }
];

export const externalUiScreens = {
  publicHome: {
    objective: "Landing pública estilo esports premium; no debe mezclar dashboard/admin.",
    externalPatterns: ["Aceternity-style hero", "Magic UI-style border glow", "shadcn navigation"],
    files: ["apps/web/components/public-landing.tsx", "apps/web/components/navbar-top.tsx"]
  },
  dashboard: {
    objective: "App shell privado tipo dashboard premium con panel lateral vinculado.",
    externalPatterns: ["shadcn dashboard layout", "bento cards", "Recharts widgets"],
    files: ["apps/web/components/competitive-dashboard.tsx", "apps/web/components/sidebar-right.tsx"]
  },
  tournaments: {
    objective: "Marketplace/listing de torneos con filtros, tabs y cards anchas.",
    externalPatterns: ["filter sidebar", "Radix tabs", "Embla mobile cards"],
    files: ["apps/web/components/tournaments-hub.tsx", "apps/web/components/filter-chips.tsx"]
  },
  tournamentDetail: {
    objective: "Event page cinematográfica con bracket y operación contextual.",
    externalPatterns: ["event hero", "Radix tabs", "bracket panel", "right activity rail"],
    files: ["apps/web/components/tournament-detail.tsx", "apps/web/components/bracket-board.tsx"]
  }
} as const;
