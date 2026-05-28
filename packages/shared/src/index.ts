export const USER_ROLES = ["USER", "ORGANIZER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "FINANCE"] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export const TOURNAMENT_TYPES = ["SOLO", "TEAM"] as const;
export type TournamentTypeValue = (typeof TOURNAMENT_TYPES)[number];

export const TOURNAMENT_FORMATS = [
  "SINGLE_ELIMINATION",
  "DOUBLE_ELIMINATION",
  "ROUND_ROBIN"
] as const;
export type TournamentFormatValue = (typeof TOURNAMENT_FORMATS)[number];

export const SPACE_VISIBILITIES = ["PUBLIC", "PRIVATE", "UNLISTED"] as const;
export type SpaceVisibilityValue = (typeof SPACE_VISIBILITIES)[number];
