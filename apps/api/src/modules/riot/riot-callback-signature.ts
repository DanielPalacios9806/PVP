import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";

export function signRiotCallbackMetadata(nonce: string) {
  if (!env.RIOT_TOURNAMENT_CALLBACK_SECRET) {
    return undefined;
  }

  return createHmac("sha256", env.RIOT_TOURNAMENT_CALLBACK_SECRET).update(nonce).digest("hex");
}

export function buildRiotCallbackMetadata(nonce: string) {
  const signature = signRiotCallbackMetadata(nonce);
  return signature ? JSON.stringify({ nonce, signature }) : nonce;
}

export function parseRiotCallbackMetadata(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as { nonce?: unknown; signature?: unknown };
    if (typeof parsed.nonce === "string") {
      return {
        nonce: parsed.nonce,
        signature: typeof parsed.signature === "string" ? parsed.signature : undefined
      };
    }
  } catch {
    return {
      nonce: value
    };
  }

  return null;
}

export function verifyRiotCallbackMetadata(params: { nonce: string; signature?: string }) {
  const expected = signRiotCallbackMetadata(params.nonce);

  if (!expected) {
    return env.RIOT_API_MODE === "mock";
  }

  if (!params.signature) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(params.signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
