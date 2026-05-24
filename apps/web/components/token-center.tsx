"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getStoredWallet, persistSession } from "../lib/session";
import { SectionCard } from "./section-card";

const packs = [100, 250, 500];

export function TokenCenter() {
  const [wallet, setWallet] = useState(getStoredWallet());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setWallet(getStoredWallet());
  }, []);

  function recharge(amount: number) {
    const nextWallet = {
      ...wallet,
      balance: wallet.balance + amount
    };

    persistSession({ wallet: nextWallet });
    setWallet(nextWallet);
    setMessage(`Se acreditaron ${amount} tokens internos a tu cuenta visual.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard title="Saldo de tokens" description="Cada cuenta registrada inicia con tokens internos para su experiencia dentro de la plataforma.">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,79,99,0.12),rgba(47,107,255,0.12))] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
              <Image src="/assets/icons/monedas.svg" alt="Tokens" width={30} height={30} />
            </div>
            <div>
              <p className="eyebrow">Saldo disponible</p>
              <h3 className="mt-2 text-4xl font-semibold">
                {wallet.balance} {wallet.currencyCode}
              </h3>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/72">
            Los tokens forman parte del ecosistema interno de la plataforma. No representan apuestas
            ni saldos convertibles a dinero.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Recargar tokens internos" description="Vista demo para revisar la experiencia del jugador sin pagos reales.">
        <div className="space-y-4">
          {packs.map((pack) => (
            <button
              key={pack}
              onClick={() => recharge(pack)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-left transition hover:border-brand-cyan/40"
            >
              <span className="flex items-center gap-3">
                <Image src="/assets/icons/monedas.svg" alt="" width={20} height={20} />
                <span className="text-sm text-white/80">Agregar {pack} tokens</span>
              </span>
              <span className="text-sm text-brand-cyan">Cargar</span>
            </button>
          ))}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
            En el MVP visual no existe pago real. Los tokens no son retirables, no representan apuestas
            y no se convierten a dinero. Los premios de torneo futuros tendran aprobacion manual.
          </div>
          {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
        </div>
      </SectionCard>
    </div>
  );
}
