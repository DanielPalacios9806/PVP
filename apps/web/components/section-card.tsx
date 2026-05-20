import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-panel p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold uppercase tracking-[0.05em] text-white">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm leading-7 text-white/65">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
