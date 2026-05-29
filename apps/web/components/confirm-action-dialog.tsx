"use client";

import { useEffect, useState } from "react";

export type ConfirmActionTone = "danger" | "warning" | "info";

export type ConfirmActionRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmActionTone;
  requireText?: string;
  consequence?: string;
  onConfirm: () => void | Promise<void>;
};

const toneStyles: Record<ConfirmActionTone, { badge: string; button: string; border: string }> = {
  danger: {
    badge: "border-[#ff4f63]/35 bg-[#ff2438]/12 text-[#ffc7cc]",
    button: "border-[#ff4f63]/45 bg-[#ff2438]/85 text-white hover:bg-[#ff2438]",
    border: "border-[#ff2438]/35 shadow-[0_0_45px_rgba(255,36,56,0.14)]"
  },
  warning: {
    badge: "border-amber-300/35 bg-amber-300/10 text-amber-100",
    button: "border-amber-300/45 bg-amber-300/20 text-amber-50 hover:bg-amber-300/28",
    border: "border-amber-300/25 shadow-[0_0_45px_rgba(251,191,36,0.08)]"
  },
  info: {
    badge: "border-[#18e6f2]/35 bg-[#18e6f2]/10 text-[#bffaff]",
    button: "border-[#18e6f2]/45 bg-[#18e6f2]/16 text-[#dffcff] hover:bg-[#18e6f2]/24",
    border: "border-[#18e6f2]/25 shadow-[0_0_45px_rgba(24,230,242,0.1)]"
  }
};

export function ConfirmActionDialog({ request, onClose }: { request: ConfirmActionRequest | null; onClose: () => void }) {
  const [typedText, setTypedText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTypedText("");
    setSubmitting(false);
  }, [request]);

  if (!request) {
    return null;
  }

  const tone = request.tone ?? "warning";
  const styles = toneStyles[tone];
  const requiredPhrase = request.requireText?.trim();
  const isBlocked = Boolean(requiredPhrase && typedText.trim() !== requiredPhrase);

  async function handleConfirm() {
    if (isBlocked || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const currentRequest = request;
      if (!currentRequest) return;
      await currentRequest.onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/72 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={`w-full max-w-lg overflow-hidden rounded-[28px] border bg-[#080b16] ${styles.border}`}>
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,36,56,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5">
          <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${styles.badge}`}>
            Acción crítica
          </span>
          <h3 className="mt-4 text-2xl font-black text-white">{request.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/68">{request.description}</p>
        </div>

        <div className="space-y-4 p-5">
          {request.consequence ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-white/68">
              <span className="font-semibold text-white">Consecuencia:</span> {request.consequence}
            </div>
          ) : null}

          {requiredPhrase ? (
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                Escribe <span className="text-[#ff9aa7]">{requiredPhrase}</span> para continuar
              </span>
              <input
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                className="w-full border-white/10 bg-black/30 text-white placeholder:text-white/25 focus:border-[#ff4f63]"
                placeholder={requiredPhrase}
                autoFocus
              />
            </label>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/72 transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              {request.cancelLabel ?? "Volver"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBlocked || submitting}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${styles.button}`}
            >
              {submitting ? "Procesando..." : request.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

