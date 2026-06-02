"use client";

import { Coins, ShieldCheck, TimerReset, WalletCards, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { SectionCard } from "./section-card";

const initialRequests = [
  { id: "token-1", user: "mauro", amount: 250, status: "PENDIENTE", type: "RECARGA", note: "Recarga de prueba para torneo cerrado" },
  { id: "token-2", user: "rook", amount: 100, status: "PENDIENTE", type: "BONO", note: "Bono interno por participación beta" },
  { id: "token-3", user: "luna", amount: 75, status: "VERIFICADO", type: "AJUSTE", note: "Ajuste manual validado por staff" }
];

const statusClasses: Record<string, string> = {
  PENDIENTE: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  VERIFICADO: "border-[#18e6f2]/25 bg-[#18e6f2]/10 text-[#18e6f2]",
  ASIGNADO: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
};

export function AdminTokenPanel() {
  const [requests, setRequests] = useState(initialRequests);

  function updateStatus(id: string, status: string) {
    setRequests((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const metrics = useMemo(() => {
    const pending = requests.filter((item) => item.status === "PENDIENTE").length;
    const verified = requests.filter((item) => item.status === "VERIFICADO").length;
    const assigned = requests.filter((item) => item.status === "ASIGNADO").length;
    const totalAmount = requests.reduce((acc, item) => acc + item.amount, 0);
    return { pending, verified, assigned, totalAmount };
  }, [requests]);

  return (
    <SectionCard title="Token Ledger" description="Control interno de tokens no monetarios para beta cerrada. No representa dinero real ni apuestas.">
      <div className="grid gap-3 md:grid-cols-4">
        <TokenMetric icon={WalletCards} label="Total revisión" value={String(metrics.totalAmount)} tone="cyan" />
        <TokenMetric icon={TimerReset} label="Pendientes" value={String(metrics.pending)} tone="amber" />
        <TokenMetric icon={ShieldCheck} label="Verificados" value={String(metrics.verified)} tone="cyan" />
        <TokenMetric icon={Coins} label="Asignados" value={String(metrics.assigned)} tone="emerald" />
      </div>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs leading-5 text-amber-50/80">
        Los tokens son internos y no monetarios. Cualquier flujo de asignación debe quedar auditado antes de exponerlo a usuarios externos.
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-[26px] border border-white/10 bg-black/22 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">{request.type}</p>
                <strong className="mt-2 block text-lg text-white">{request.user}</strong>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses[request.status] ?? statusClasses.PENDIENTE}`}>
                {request.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/70">
              {request.amount} tokens internos.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/45">{request.note}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => updateStatus(request.id, "VERIFICADO")}
                className="rounded-xl bg-[#18e6f2] px-3 py-2 text-xs font-semibold text-[#07111f] transition hover:bg-white"
              >
                Verificar
              </button>
              <button
                onClick={() => updateStatus(request.id, "ASIGNADO")}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/78 transition hover:border-white/30 hover:bg-white/[0.04]"
              >
                Asignar
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function TokenMetric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: "cyan" | "amber" | "emerald" }) {
  const classes = {
    cyan: "border-[#18e6f2]/22 bg-[#18e6f2]/10 text-[#18e6f2]",
    amber: "border-amber-300/22 bg-amber-300/10 text-amber-100",
    emerald: "border-emerald-300/22 bg-emerald-300/10 text-emerald-100"
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className={`w-fit rounded-xl border p-2 ${classes[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      <strong className="mt-1 block text-2xl text-white">{value}</strong>
    </div>
  );
}
