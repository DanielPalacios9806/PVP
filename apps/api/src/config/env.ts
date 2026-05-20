import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),
  API_PORT: z.string().default("4000"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  FRONTEND_URL: z.string().optional(),
  RIOT_MODE: z.enum(["mock", "development", "production"]).default("mock"),
  RIOT_API_KEY: z.string().optional(),
  RIOT_API_BASE_URL: z.string().default("https://americas.api.riotgames.com"),
  RIOT_PLATFORM: z.string().default("LA1"),
  RIOT_REGION: z.string().default("AMERICAS"),
  RIOT_CALLBACK_URL: z.string().optional(),
  RIOT_PROVIDER_ID: z.string().optional(),
  RIOT_TOURNAMENT_ID: z.string().optional()
});

export const env = envSchema.parse(process.env);
