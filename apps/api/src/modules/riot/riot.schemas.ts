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

export const checkRiotAccountSchema = z.object({
  gameName: riotGameNameSchema,
  tagLine: riotTagLineSchema,
  platformRoute: platformRouteSchema.default("LA1"),
  regionalRoute: regionalRouteSchema.default("AMERICAS")
});

export const linkRiotAccountSchema = checkRiotAccountSchema.extend({
  game: z.string().trim().min(2).max(50).default("LEAGUE_OF_LEGENDS")
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
