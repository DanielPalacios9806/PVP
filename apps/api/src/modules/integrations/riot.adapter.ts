export interface RiotAccountLookup {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotAdapter {
  lookupAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccountLookup | null>;
}

export class RiotAdapterStub implements RiotAdapter {
  async lookupAccountByRiotId(_gameName: string, _tagLine: string) {
    return null;
  }
}
