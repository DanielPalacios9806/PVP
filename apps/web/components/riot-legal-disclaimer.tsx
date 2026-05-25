export function RiotLegalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? "px-4 py-5 text-[11px] leading-5 text-white/38" : "mx-auto max-w-7xl px-4 pb-24 pt-2 text-xs leading-6 text-white/42 sm:px-6 lg:pb-8"}>
      Darkside.cool isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
    </footer>
  );
}
