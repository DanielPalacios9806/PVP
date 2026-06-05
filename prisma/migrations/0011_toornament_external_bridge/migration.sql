ALTER TABLE "Tournament"
ADD COLUMN "externalProvider" TEXT,
ADD COLUMN "externalTournamentId" TEXT,
ADD COLUMN "externalBracketUrl" TEXT;

ALTER TABLE "Match"
ADD COLUMN "externalProvider" TEXT,
ADD COLUMN "externalMatchId" TEXT,
ADD COLUMN "externalBracketUrl" TEXT;

CREATE INDEX "Tournament_externalProvider_idx" ON "Tournament"("externalProvider");
CREATE INDEX "Tournament_externalTournamentId_idx" ON "Tournament"("externalTournamentId");
CREATE INDEX "Match_externalProvider_idx" ON "Match"("externalProvider");
CREATE INDEX "Match_externalMatchId_idx" ON "Match"("externalMatchId");
