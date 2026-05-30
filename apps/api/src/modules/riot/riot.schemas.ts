import { z } from "zod";

const riotGameNameSchema = z.string().trim().min(2).max(32);

const riotTagLineSchema = z
  .string()
  .trim()
  .min(2)
  .max(12)
  .transform((value) => value.replace(/^#/, "").toUpperCase());

const platformRouteSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .transform((value) => value.toUpperCase());

const regionalRouteSchema = z
  .string()
  .trim()
  .min(2)
  .max(30)
  .transform((value) => value.toUpperCase());

export const riotAccountLookupSchema = z.object({
  gameName: riotGameNameSchema,
  tagLine: riotTagLineSchema,
  game: z.string().trim().min(2).max(50).default("LEAGUE_OF_LEGENDS"),
  platformRoute: platformRouteSchema.default("LA1"),
  regionalRoute: regionalRouteSchema.default("AMERICAS")
});

export const checkRiotAccountSchema = riotAccountLookupSchema.omit({
  game: true
});

export const linkRiotAccountSchema = riotAccountLookupSchema;

export const riotCapabilitiesCheckSchema = riotAccountLookupSchema.pick({
  gameName: true,
  tagLine: true,
  platformRoute: true,
  regionalRoute: true
});

export const generateTournamentCodeSchema = z.object({
  mapType: z.string().default("SUMMONERS_RIFT"),
  pickType: z.string().default("TOURNAMENT_DRAFT"),
  teamSize: z.number().int().positive().max(5).default(5),
  spectatorType: z.string().default("ALL")
});

export const finishMockMatchSchema = z.object({
  winnerRegistrationId: z.string().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  riotGameId: z.string().optional()
});

export const tournamentCallbackSandboxSchema = z
  .object({
    matchId: z.string().min(1),
    winningSide: z.enum(["HOME", "AWAY", "A", "B", "home", "away", "a", "b"]).optional(),
    winnerRegistrationId: z.string().min(1).optional(),
    homeScore: z.number().int().min(0).default(1),
    awayScore: z.number().int().min(0).default(0),
    riotGameId: z.string().min(1).optional(),
    source: z.string().default("SIMULATED_TOURNAMENT_CODE"),
    notes: z.string().max(500).optional()
  })
  .refine((value) => Boolean(value.winningSide || value.winnerRegistrationId), {
    message: "winningSide or winnerRegistrationId is required",
    path: ["winningSide"]
  });
