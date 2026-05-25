DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RiotLinkedAccountStatus') THEN
    CREATE TYPE "RiotLinkedAccountStatus" AS ENUM ('MANUAL', 'VERIFIED', 'RSO_PENDING', 'RSO_VERIFIED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RiotTournamentCodeStatus') THEN
    CREATE TYPE "RiotTournamentCodeStatus" AS ENUM ('GENERATED', 'ASSIGNED', 'LOBBY_STARTED', 'CALLBACK_RECEIVED', 'COMPLETED', 'FAILED', 'REVOKED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RiotCallbackStatus') THEN
    CREATE TYPE "RiotCallbackStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED', 'FAILED');
  END IF;
END $$;

ALTER TABLE "UserGameAccount"
  ADD COLUMN IF NOT EXISTS "verificationStatus" "RiotLinkedAccountStatus" NOT NULL DEFAULT 'MANUAL';

CREATE TABLE IF NOT EXISTS "RiotApiLog" (
  "id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "region" TEXT,
  "platformRoute" TEXT,
  "statusCode" INTEGER,
  "durationMs" INTEGER NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "errorType" TEXT,
  "errorMessage" TEXT,
  "retryAfter" INTEGER,
  "userId" TEXT,
  "tournamentId" TEXT,
  "matchId" TEXT,
  "requestId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiotApiLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RiotTournamentProvider" (
  "id" TEXT NOT NULL,
  "riotProviderId" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "platformRoute" TEXT,
  "callbackUrl" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "apiKeyFingerprint" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiotTournamentProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RiotTournament" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "riotTournamentProviderId" TEXT,
  "riotProviderId" TEXT,
  "riotTournamentId" TEXT,
  "name" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiotTournament_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RiotTournamentCode" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "riotTournamentRecordId" TEXT,
  "riotTournamentId" TEXT,
  "shortCode" TEXT NOT NULL,
  "metadataNonce" TEXT NOT NULL,
  "mapType" TEXT,
  "pickType" TEXT,
  "teamSize" INTEGER,
  "spectatorType" TEXT,
  "allowedSummonerIds" JSONB,
  "status" "RiotTournamentCodeStatus" NOT NULL DEFAULT 'GENERATED',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),
  "callbackReceivedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiotTournamentCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RiotCallbackEvent" (
  "id" TEXT NOT NULL,
  "matchId" TEXT,
  "riotTournamentCodeId" TEXT,
  "riotGameId" TEXT,
  "metadataNonce" TEXT,
  "status" "RiotCallbackStatus" NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL,
  "sourceIp" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  CONSTRAINT "RiotCallbackEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RiotTournamentProvider_riotProviderId_key" ON "RiotTournamentProvider"("riotProviderId");
CREATE INDEX IF NOT EXISTS "RiotTournamentProvider_active_idx" ON "RiotTournamentProvider"("active");
CREATE INDEX IF NOT EXISTS "RiotTournamentProvider_region_idx" ON "RiotTournamentProvider"("region");

CREATE UNIQUE INDEX IF NOT EXISTS "RiotTournament_tournamentId_key" ON "RiotTournament"("tournamentId");
CREATE INDEX IF NOT EXISTS "RiotTournament_riotTournamentId_idx" ON "RiotTournament"("riotTournamentId");
CREATE INDEX IF NOT EXISTS "RiotTournament_status_idx" ON "RiotTournament"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "RiotTournamentCode_matchId_key" ON "RiotTournamentCode"("matchId");
CREATE UNIQUE INDEX IF NOT EXISTS "RiotTournamentCode_shortCode_key" ON "RiotTournamentCode"("shortCode");
CREATE INDEX IF NOT EXISTS "RiotTournamentCode_status_idx" ON "RiotTournamentCode"("status");
CREATE INDEX IF NOT EXISTS "RiotTournamentCode_generatedAt_idx" ON "RiotTournamentCode"("generatedAt");

CREATE INDEX IF NOT EXISTS "RiotCallbackEvent_receivedAt_idx" ON "RiotCallbackEvent"("receivedAt");
CREATE INDEX IF NOT EXISTS "RiotCallbackEvent_status_idx" ON "RiotCallbackEvent"("status");
CREATE INDEX IF NOT EXISTS "RiotCallbackEvent_metadataNonce_idx" ON "RiotCallbackEvent"("metadataNonce");

CREATE INDEX IF NOT EXISTS "RiotApiLog_createdAt_idx" ON "RiotApiLog"("createdAt");
CREATE INDEX IF NOT EXISTS "RiotApiLog_endpoint_idx" ON "RiotApiLog"("endpoint");
CREATE INDEX IF NOT EXISTS "RiotApiLog_statusCode_idx" ON "RiotApiLog"("statusCode");
CREATE INDEX IF NOT EXISTS "RiotApiLog_success_idx" ON "RiotApiLog"("success");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotApiLog_userId_fkey') THEN
    ALTER TABLE "RiotApiLog" ADD CONSTRAINT "RiotApiLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotApiLog_tournamentId_fkey') THEN
    ALTER TABLE "RiotApiLog" ADD CONSTRAINT "RiotApiLog_tournamentId_fkey"
      FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotApiLog_matchId_fkey') THEN
    ALTER TABLE "RiotApiLog" ADD CONSTRAINT "RiotApiLog_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotTournamentProvider_createdByUserId_fkey') THEN
    ALTER TABLE "RiotTournamentProvider" ADD CONSTRAINT "RiotTournamentProvider_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotTournament_tournamentId_fkey') THEN
    ALTER TABLE "RiotTournament" ADD CONSTRAINT "RiotTournament_tournamentId_fkey"
      FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotTournament_riotTournamentProviderId_fkey') THEN
    ALTER TABLE "RiotTournament" ADD CONSTRAINT "RiotTournament_riotTournamentProviderId_fkey"
      FOREIGN KEY ("riotTournamentProviderId") REFERENCES "RiotTournamentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotTournamentCode_matchId_fkey') THEN
    ALTER TABLE "RiotTournamentCode" ADD CONSTRAINT "RiotTournamentCode_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotTournamentCode_riotTournamentRecordId_fkey') THEN
    ALTER TABLE "RiotTournamentCode" ADD CONSTRAINT "RiotTournamentCode_riotTournamentRecordId_fkey"
      FOREIGN KEY ("riotTournamentRecordId") REFERENCES "RiotTournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotTournamentCode_createdByUserId_fkey') THEN
    ALTER TABLE "RiotTournamentCode" ADD CONSTRAINT "RiotTournamentCode_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotCallbackEvent_matchId_fkey') THEN
    ALTER TABLE "RiotCallbackEvent" ADD CONSTRAINT "RiotCallbackEvent_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RiotCallbackEvent_riotTournamentCodeId_fkey') THEN
    ALTER TABLE "RiotCallbackEvent" ADD CONSTRAINT "RiotCallbackEvent_riotTournamentCodeId_fkey"
      FOREIGN KEY ("riotTournamentCodeId") REFERENCES "RiotTournamentCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
