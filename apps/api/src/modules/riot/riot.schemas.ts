import { z } from "zod";

export const riotAccountLookupSchema = z.object({
  gameName: z.string().min(2).max(32),
  tagLine: z.string().min(2).max(12),
  game: z.string().min(2).max(50).default("LEAGUE_OF_LEGENDS"),
  platformRoute: z.string().min(2).max(20).default("LA1"),
  regionalRoute: z.string().min(2).max(30).default("AMERICAS")
});

export const linkRiotAccountSchema = riotAccountLookupSchema;

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
