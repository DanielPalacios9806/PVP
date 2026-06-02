import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/styles";
import { darksideClass } from "@/lib/design-tokens";

type Tone = "red" | "cyan" | "gold" | "neutral";
type ButtonVariant = "primary" | "secondary" | "ghost";

export function DSContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(darksideClass.container, className)} {...props} />;
}

export function DSPanel({
  className,
  strong = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return <div className={cn(strong ? darksideClass.panelStrong : darksideClass.panel, className)} {...props} />;
}

export function DSCard({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  const toneClass = tone === "cyan" ? darksideClass.cardCyan : darksideClass.card;
  return <div className={cn(toneClass, className)} {...props} />;
}

export function DSButton({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: darksideClass.buttonPrimary,
    secondary: darksideClass.buttonSecondary,
    ghost: darksideClass.buttonGhost
  };

  return <button className={cn(variants[variant], className)} {...props} />;
}

export function DSBadge({
  className,
  tone = "red",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const variants: Record<Tone, string> = {
    red: darksideClass.badgeRed,
    cyan: darksideClass.badgeCyan,
    gold: darksideClass.badgeGold,
    neutral:
      "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ds-secondary"
  };

  return (
    <span className={cn(variants[tone], className)} {...props}>
      {children}
    </span>
  );
}

export function DSSectionHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl space-y-2">
        {eyebrow ? <p className={darksideClass.eyebrow}>{eyebrow}</p> : null}
        <h2 className={darksideClass.h2}>{title}</h2>
        {description ? <p className={darksideClass.body}>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DSStatTile({
  label,
  value,
  helper,
  icon,
  className
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(darksideClass.stat, "flex items-center gap-4", className)}>
      {icon ? <div className="grid size-11 place-items-center rounded-full bg-ds-red/12 text-ds-red">{icon}</div> : null}
      <div>
        <p className="font-heading text-2xl font-semibold tracking-[-0.02em] text-white">{value}</p>
        <p className="text-sm text-ds-secondary">{label}</p>
        {helper ? <p className="mt-1 text-xs text-ds-muted">{helper}</p> : null}
      </div>
    </div>
  );
}

export function DSSearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "rounded-ds-md border border-white/10 bg-ds-page/80 px-4 py-3 text-sm text-white placeholder:text-ds-muted outline-none transition focus:border-ds-cyan/60 focus:shadow-ds-cyan-glow",
        className
      )}
      {...props}
    />
  );
}
