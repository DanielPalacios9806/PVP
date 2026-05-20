"use client";

import Image from "next/image";
import { useState } from "react";
import { SectionCard } from "./section-card";

const initialRequests = [
  { id: "token-1", user: "mauro", amount: 250, status: "PENDIENTE", type: "RECARGA" },
  { id: "token-2", user: "rook", amount: 100, status: "PENDIENTE", type: "BONO" }
];

export function AdminTokenPanel() {
  const [requests, setRequests] = useState(initialRequests);

  function updateStatus(id: string, status: string) {
    setRequests((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <SectionCard title="Control de tokens" description="Asignacion, verificacion y revision interna de tokens no monetarios.">
      <div className="space-y-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image src="/assets/icons/monedas.svg" alt="" width={20} height={20} />
                <strong>{request.user}</strong>
              </div>
              <span className="text-xs text-brand-cyan">{request.status}</span>
            </div>
            <p className="mt-3 text-sm text-white/70">
              {request.type} de {request.amount} tokens internos.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => updateStatus(request.id, "VERIFICADO")}
                className="rounded-xl bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-ink"
              >
                Verificar
              </button>
              <button
                onClick={() => updateStatus(request.id, "ASIGNADO")}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm"
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
