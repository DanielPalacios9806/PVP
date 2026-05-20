"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getStoredWallet } from "../lib/session";
import { SectionCard } from "./section-card";

export function TokenBalanceCard() {
  const [wallet, setWallet] = useState(getStoredWallet());

  useEffect(() => {
    setWallet(getStoredWallet());
  }, []);

  return (
    <SectionCard title="Tus tokens" description="Cada cuenta registrada recibe tokens internos para su experiencia en plataforma.">
      <div className="flex items-center gap-4 rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,79,99,0.12),rgba(47,107,255,0.12))] p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
          <Image src="/assets/icons/monedas.svg" alt="Tokens" width={28} height={28} />
        </div>
        <div>
          <p className="eyebrow">Saldo disponible</p>
          <h3 className="mt-2 text-3xl font-semibold">
            {wallet.balance} {wallet.currencyCode}
          </h3>
        </div>
      </div>
    </SectionCard>
  );
}
