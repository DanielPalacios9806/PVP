export const DDRAGON_VERSION = "15.10.1";

const DDRAGON_CDN = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeChampionName(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/[^A-Za-z0-9]/g, "");
}

export function profileIconUrl(profileIconId?: number | string | null) {
  const id = safeNumber(profileIconId);
  return id ? `${DDRAGON_CDN}/img/profileicon/${id}.png` : "/assets/darkside/logos/darkside-logo-mark.svg";
}

export function championIconUrl(championName?: string | null) {
  const normalized = safeChampionName(championName);
  return normalized ? `${DDRAGON_CDN}/img/champion/${normalized}.png` : "/assets/darkside/logos/game-lol-icon.svg";
}

export function itemIconUrl(itemId?: number | string | null) {
  const id = safeNumber(itemId);
  return id ? `${DDRAGON_CDN}/img/item/${id}.png` : "/assets/darkside/logos/darkside-logo-mark.svg";
}

export function rankIconUrl(tier?: string | null) {
  const normalized = (tier ?? "unranked").toLowerCase();
  const allowed = new Set(["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"]);
  return `/images/ranks/${allowed.has(normalized) ? normalized : "unranked"}.svg`;
}

export function queueLabel(queueType?: string | null) {
  const labels: Record<string, string> = {
    RANKED_SOLO_5x5: "SoloQ",
    RANKED_FLEX_SR: "Flex 5v5"
  };

  return queueType ? labels[queueType] ?? queueType.replaceAll("_", " ") : "Ranked";
}

export function formatRank(tier?: string | null, rank?: string | null, leaguePoints?: number | null) {
  if (!tier || tier === "UNRANKED") {
    return "Unranked";
  }

  const lp = typeof leaguePoints === "number" ? ` · ${leaguePoints} LP` : "";
  return `${tier} ${rank ?? ""}${lp}`.trim();
}

export function winRate(wins?: number | null, losses?: number | null) {
  const total = Number(wins ?? 0) + Number(losses ?? 0);
  return total ? Math.round((Number(wins ?? 0) / total) * 100) : 0;
}
