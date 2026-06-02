export type NavigationVisibility = "public" | "auth" | "user" | "admin";
export type NavigationSurface = "public-home" | "app-shell" | "admin-shell" | "mobile";

export type DarksideRoute = {
  label: string;
  href: string;
  description: string;
  visibility: NavigationVisibility;
  surfaces: NavigationSurface[];
  status: "active" | "protected" | "coming-soon";
  reason?: string;
};

export const publicRoutes: DarksideRoute[] = [
  {
    label: "Inicio",
    href: "/",
    description: "Landing pública con hero, juegos, torneos destacados, comunidad y sponsors.",
    visibility: "public",
    surfaces: ["public-home", "mobile"],
    status: "active"
  },
  {
    label: "Torneos",
    href: "/dashboard/tournaments",
    description: "Explorador de torneos disponible mientras se define una ruta pública dedicada.",
    visibility: "public",
    surfaces: ["public-home", "app-shell", "mobile"],
    status: "active"
  },
  {
    label: "Equipos",
    href: "/dashboard/teams",
    description: "Centro de equipos. Si no hay sesión, el CTA debe enviar a login o registro.",
    visibility: "auth",
    surfaces: ["public-home", "app-shell", "mobile"],
    status: "protected"
  },
  {
    label: "Comunidad",
    href: "/dashboard/spaces",
    description: "Espacios/comunidades para jugadores y equipos.",
    visibility: "auth",
    surfaces: ["public-home", "app-shell"],
    status: "protected"
  }
];

export const appRoutes: DarksideRoute[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Vista privada del jugador con resumen, actividad, equipo y próximos pasos.",
    visibility: "user",
    surfaces: ["app-shell", "mobile"],
    status: "active"
  },
  {
    label: "Mis partidas",
    href: "/dashboard/matches/mock-match-1",
    description: "Acceso a match room o partida destacada mientras se completa el listado general.",
    visibility: "user",
    surfaces: ["app-shell"],
    status: "protected"
  },
  {
    label: "Mis tokens",
    href: "/dashboard/tokens",
    description: "Saldo interno no monetario y recompensas de la plataforma.",
    visibility: "user",
    surfaces: ["app-shell"],
    status: "protected"
  },
  {
    label: "Perfil",
    href: "/dashboard/account",
    description: "Perfil, cuenta y conexiones OAuth/Riot.",
    visibility: "user",
    surfaces: ["app-shell", "mobile"],
    status: "protected"
  }
];

export const adminRoutes: DarksideRoute[] = [
  {
    label: "Operación",
    href: "/dashboard/moderation",
    description: "Panel operativo para moderación y seguimiento de la beta.",
    visibility: "admin",
    surfaces: ["admin-shell"],
    status: "protected"
  },
  {
    label: "Admin",
    href: "/dashboard/admin",
    description: "Centro administrativo, Riot mock/development status, usuarios y auditoría.",
    visibility: "admin",
    surfaces: ["admin-shell"],
    status: "protected"
  },
  {
    label: "Perfiles",
    href: "/dashboard/admin/profiles",
    description: "Centro de perfiles para superadmin.",
    visibility: "admin",
    surfaces: ["admin-shell"],
    status: "protected"
  }
];

export const primaryCtas = {
  exploreTournaments: {
    label: "Explorar torneos",
    href: "/dashboard/tournaments",
    visibility: "public" as const,
    description: "CTA principal de home; debe abrir el hub de torneos."
  },
  createTeam: {
    label: "Crear equipo",
    href: "/dashboard/teams",
    visibility: "auth" as const,
    description: "CTA secundario; si no hay sesión, redirigir a registro/login."
  },
  signIn: {
    label: "Login",
    href: "/auth/login",
    visibility: "public" as const,
    description: "Acceso público de autenticación."
  },
  signUp: {
    label: "Registrarse",
    href: "/auth/register",
    visibility: "public" as const,
    description: "Registro público de beta cerrada."
  }
};

export const hiddenFromPublicHome = [
  "Admin",
  "Operación",
  "Perfiles",
  "Riot mock",
  "Auditoría",
  "Logs",
  "Tokens internos",
  "Mis partidas",
  "Mis tokens"
];

export const navigationContract = {
  publicRoutes,
  appRoutes,
  adminRoutes,
  primaryCtas,
  hiddenFromPublicHome
} as const;
