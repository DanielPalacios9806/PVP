import "dotenv/config";
import { z } from "zod";

const rawEnv = {
  ...process.env,
  RIOT_API_MODE: process.env.RIOT_API_MODE ?? process.env.RIOT_MODE,
  RIOT_REGION: process.env.RIOT_API_MODE
    ? process.env.RIOT_REGION
    : process.env.RIOT_PLATFORM ?? process.env.RIOT_REGION,
  RIOT_REGIONAL_ROUTE:
    process.env.RIOT_REGIONAL_ROUTE ?? (process.env.RIOT_PLATFORM ? process.env.RIOT_REGION : undefined)
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),
  API_PORT: z.string().default("4000"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  FRONTEND_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z.string().optional(),
  OAUTH_STATE_SECRET: z.string().optional(),
  RIOT_MODE: z.enum(["mock", "development", "production"]).optional(),
  RIOT_API_MODE: z.enum(["mock", "development", "production"]).default("mock"),
  RIOT_API_KEY: z.string().optional(),
  RIOT_REGION: z.string().default("la1"),
  RIOT_REGIONAL_ROUTE: z.string().default("americas"),
  RIOT_API_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  RIOT_TOURNAMENT_API_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  RIOT_PLATFORM: z.string().optional(),
  RIOT_API_BASE_URL: z.string().optional(),
  RIOT_CALLBACK_URL: z.string().optional(),
  RIOT_TOURNAMENT_PROVIDER_ID: z.string().optional(),
  RIOT_TOURNAMENT_CALLBACK_SECRET: z.string().optional(),
  RIOT_PROVIDER_ID: z.string().optional(),
  RIOT_TOURNAMENT_ID: z.string().optional()
});

export const env = envSchema.parse(rawEnv);
