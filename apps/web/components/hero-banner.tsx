import { ReactNode } from "react";

interface HeroBannerProps {
  game: "LOL" | "VALORANT" | "CUSTOM";
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  children?: ReactNode;
}

/**
 * Hero Banner Component
 * Large impact banner with game background and title
 */
export function HeroBanner({
  game,
  title,
  subtitle,
  backgroundImage,
  children
}: HeroBannerProps) {
  const gameIcon = game === "LOL" ? "⚔️" : game === "VALORANT" ? "🎯" : "🎮";
  const gameColor =
    game === "LOL"
      ? "from-yellow-600/40 via-orange-600/20 to-transparent"
      : game === "VALORANT"
        ? "from-red-600/40 via-purple-600/20 to-transparent"
        : "from-cyan-600/40 via-blue-600/20 to-transparent";

  return (
    <div
      className="relative overflow-hidden rounded-[4px] border border-white/10"
      style={{
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Background overlay gradients */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gameColor} pointer-events-none`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-riot-darkest/90 pointer-events-none" />

      {/* Content */}
      <div className="relative flex items-center gap-8 px-8 py-16 min-h-[300px] z-10">
        {/* Icon/Logo Left */}
        <div className="hidden md:flex items-center justify-center h-32 w-32 rounded-[4px] border border-white/10 bg-riot-darker/60 flex-shrink-0 text-6xl">
          {gameIcon}
        </div>

        {/* Title/Subtitle Right */}
        <div className="flex-1">
          <h2 className="text-4xl md:text-5xl font-heading uppercase font-bold tracking-[0.08em] text-white mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-text-secondary text-lg mb-4">{subtitle}</p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>

      {/* Accent border bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-red via-accent-cyan to-accent-red/20" />
    </div>
  );
}
