-- Tournament lifecycle states.
ALTER TYPE "TournamentStatus" ADD VALUE IF NOT EXISTS 'REGISTRATION_OPEN';
ALTER TYPE "TournamentStatus" ADD VALUE IF NOT EXISTS 'REGISTRATION_CLOSED';

-- New match states. The old SCHEDULED value remains in PostgreSQL for backward compatibility.
ALTER TYPE "MatchStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "MatchStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

-- Source of truth for match results.
CREATE TYPE "ResultSource" AS ENUM ('MANUAL', 'MOCK_RIOT', 'RIOT_CALLBACK', 'ADMIN_OVERRIDE');

ALTER TABLE "Tournament"
  ADD COLUMN "platformRoute" TEXT,
  ADD COLUMN "regionalRoute" TEXT,
  ADD COLUMN "teamSize" INTEGER,
  ADD COLUMN "publicRules" TEXT,
  ADD COLUMN "prizes" TEXT,
  ADD COLUMN "entryFeeTokens" INTEGER DEFAULT 0,
  ADD COLUMN "minParticipants" INTEGER DEFAULT 20,
  ADD COLUMN "registrationClosesAt" TIMESTAMP(3);

ALTER TABLE "TournamentRegistration"
  ADD COLUMN "approvedByUserId" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedReason" TEXT;

ALTER TABLE "Match"
  ADD COLUMN "riotShortCode" TEXT,
  ADD COLUMN "riotGameId" TEXT,
  ADD COLUMN "riotPlatform" TEXT,
  ADD COLUMN "riotRegion" TEXT,
  ADD COLUMN "resultSource" "ResultSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "callbackReceivedAt" TIMESTAMP(3),
  ADD COLUMN "resultSyncedAt" TIMESTAMP(3);

UPDATE "Match" SET "status" = 'PENDING' WHERE "status" = 'SCHEDULED';
ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
