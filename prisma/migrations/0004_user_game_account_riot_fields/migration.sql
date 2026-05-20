ALTER TABLE "UserGameAccount"
  ADD COLUMN "puuid" TEXT,
  ADD COLUMN "summonerId" TEXT,
  ADD COLUMN "platformRoute" TEXT,
  ADD COLUMN "regionalRoute" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
