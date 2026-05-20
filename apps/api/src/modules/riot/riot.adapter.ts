export interface RiotLinkedAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerId?: string;
  platformRoute: string;
  regionalRoute: string;
}

export interface RiotTournamentCodeInput {
  matchId: string;
  mapType: string;
  pickType: string;
  teamSize: number;
  spectatorType: string;
}

export interface RiotTournamentCode {
  shortCode: string;
  metadataNonce: string;
}

export interface RiotAdapter {
  lookupAccountByRiotId(params: {
    gameName: string;
    tagLine: string;
    platformRoute: string;
    regionalRoute: string;
  }): Promise<RiotLinkedAccount | null>;
  generateTournamentCode(input: RiotTournamentCodeInput): Promise<RiotTournamentCode>;
}
