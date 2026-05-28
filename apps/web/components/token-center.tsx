"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { getStoredUser, getStoredWallet, persistSession, subscribeSessionChange, type AppRole } from "../lib/session";
import { SectionCard } from "./section-card";

type MessageTone = "info" | "success" | "error";

type WalletSummary = {
  id: string;
  type: string;
  currencyCode: string;
  balance: number;
  nonWithdrawable: boolean;
  updatedAt?: string;
};

type FinanceUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: AppRole;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  wallet: WalletSummary | null;
};

type TokenTransactionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: AppRole;
};

type TokenTransaction = {
  id: string;
  type: "ADMIN_ADJUSTMENT" | "TOURNAMENT_REWARD" | "CORRECTION";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
  wallet?: {
    id: string;
    type: string;
    currencyCode: string;
    nonWithdrawable: boolean;
  };
  user?: TokenTransactionUser;
  actorUser?: TokenTransactionUser | null;
};

const roleLabels: Record<AppRole, string> = {
  USER: "Jugador",
  ORGANIZER: "Organizador",
  MODERATOR: "Moderador",
  ADMIN: "Administrador",
  SUPER_ADMIN: "Super administrador",
  FINANCE: "Finanzas"
};

const transactionTypeLabels: Record<TokenTransaction["type"], string> = {
  ADMIN_ADJUSTMENT: "Ajuste administrativo",
  TOURNAMENT_REWARD: "Recompensa de torneo",
  CORRECTION: "Correccion"
};

function getHumanApiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const payload = data as { message?: unknown; errors?: unknown };

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (Array.isArray(payload.errors)) {
      const details = payload.errors
        .map((error) => {
          if (error && typeof error === "object" && "message" in error) {
            return String((error as { message?: unknown }).message ?? "");
          }
          return "";
        })
        .filter(Boolean);

      if (details.length > 0) {
        return details.join(" ");
      }
    }
  }

  return fallback;
}

function canViewFinancePanel(role?: AppRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "FINANCE";
}

function canAdjustTokens(role?: AppRole) {
  return role === "SUPER_ADMIN" || role === "FINANCE";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatAmount(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function transactionTone(value: number) {
  return value >= 0 ? "text-brand-cyan" : "text-brand-red";
}

export function TokenCenter() {
  const [wallet, setWallet] = useState(getStoredWallet());
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [financeUsers, setFinanceUsers] = useState<FinanceUser[]>([]);
  const [userTransactions, setUserTransactions] = useState<TokenTransaction[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<TokenTransaction[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const canViewFinance = canViewFinancePanel(currentUser?.role);
  const canAdjust = canAdjustTokens(currentUser?.role);

  const selectedUser = useMemo(() => financeUsers.find((user) => user.id === selectedUserId) ?? null, [financeUsers, selectedUserId]);

  function showMessage(text: string, tone: MessageTone = "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  function refreshLocalSession() {
    setWallet(getStoredWallet());
    setCurrentUser(getStoredUser());
  }

  async function loadUserTokenHistory() {
    try {
      const response = await fetch(`${apiUrl}/users/me/tokens/history?limit=10`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getHumanApiMessage(data, "No se pudo cargar tu historial de tokens."));
      }

      setUserTransactions(Array.isArray(data) ? (data as TokenTransaction[]) : []);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudo cargar tu historial de tokens.", "error");
    }
  }

  async function loadFinanceUsers() {
    if (!canViewFinance) {
      setFinanceUsers([]);
      return;
    }

    try {
      setLoadingFinance(true);
      const response = await fetch(`${apiUrl}/admin/wallets?limit=100`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getHumanApiMessage(data, "No se pudieron cargar las billeteras internas."));
      }

      const users = Array.isArray(data) ? (data as FinanceUser[]) : [];
      setFinanceUsers(users);

      if (!selectedUserId && users.length > 0) {
        setSelectedUserId(users[0].id);
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudieron cargar las billeteras internas.", "error");
    } finally {
      setLoadingFinance(false);
    }
  }

  async function loadFinanceTokenHistory() {
    if (!canViewFinance) {
      setFinanceTransactions([]);
      return;
    }

    try {
      setLoadingHistory(true);
      const response = await fetch(`${apiUrl}/admin/wallet-transactions?limit=25`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getHumanApiMessage(data, "No se pudo cargar el historial financiero."));
      }

      setFinanceTransactions(Array.isArray(data) ? (data as TokenTransaction[]) : []);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudo cargar el historial financiero.", "error");
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    refreshLocalSession();
    return subscribeSessionChange(refreshLocalSession);
  }, []);

  useEffect(() => {
    void loadUserTokenHistory();
  }, [currentUser?.id]);

  useEffect(() => {
    void loadFinanceUsers();
    void loadFinanceTokenHistory();
  }, [canViewFinance]);

  async function adjustTokens(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUserId) {
      showMessage("Selecciona un usuario para ajustar tokens.", "error");
      return;
    }

    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount) || parsedAmount === 0) {
      showMessage("Ingresa un ajuste entero distinto de cero.", "error");
      return;
    }

    if (reason.trim().length < 8) {
      showMessage("Escribe una justificacion de al menos 8 caracteres.", "error");
      return;
    }

    try {
      setAdjusting(true);
      showMessage("Registrando ajuste de tokens...", "info");

      const response = await fetch(`${apiUrl}/admin/users/${selectedUserId}/tokens`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          amount: parsedAmount,
          reason: reason.trim()
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getHumanApiMessage(data, "No se pudo ajustar el saldo de tokens."));
      }

      showMessage(data.message ?? "Ajuste de tokens registrado correctamente.", "success");
      setAmount("");
      setReason("");
      await Promise.all([loadFinanceUsers(), loadFinanceTokenHistory(), loadUserTokenHistory()]);

      if (data?.user?.id === currentUser?.id && data?.wallet) {
        const nextWallet = {
          balance: Number(data.wallet.balance ?? wallet.balance),
          currencyCode: String(data.wallet.currencyCode ?? wallet.currencyCode)
        };
        persistSession({ wallet: nextWallet });
        setWallet(nextWallet);
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudo ajustar el saldo de tokens.", "error");
    } finally {
      setAdjusting(false);
    }
  }

  const messageClass =
    messageTone === "error" ? "text-brand-red" : messageTone === "success" ? "text-brand-cyan" : "text-white/70";

  const userHistoryTitle = canViewFinance ? "Mi historial de tokens" : "Historial de tokens";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Saldo de tokens" description="Los tokens son puntos internos para beneficios, experiencia y recompensas no monetarias.">
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
              Los tokens forman parte del ecosistema interno de la plataforma. No representan apuestas, saldos retirables
              ni valores convertibles a dinero.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title={canViewFinance ? "Administracion interna de tokens" : "Politica de tokens internos"}
          description={
            canViewFinance
              ? "Ajusta saldos internos con justificacion. Cada cambio queda registrado en auditoria e historial financiero."
              : "Los tokens se acreditan por participacion, premios internos o ajustes aprobados."
          }
        >
          {canViewFinance ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
                {canAdjust
                  ? "Puedes sumar o restar tokens internos siempre que exista una justificacion. No se permite dejar saldos negativos."
                  : "Tu rol puede revisar saldos internos e historial financiero, pero no aplicar ajustes financieros."}
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void loadFinanceUsers()} className="btn-secondary rounded-[12px]" disabled={loadingFinance}>
                  {loadingFinance ? "Actualizando..." : "Actualizar billeteras"}
                </button>
                <button type="button" onClick={() => void loadFinanceTokenHistory()} className="btn-secondary rounded-[12px]" disabled={loadingHistory}>
                  {loadingHistory ? "Cargando historial..." : "Actualizar historial"}
                </button>
              </div>

              {canAdjust ? (
                <form onSubmit={adjustTokens} className="space-y-3">
                  <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} aria-label="Usuario para ajuste de tokens">
                    <option value="">Selecciona usuario</option>
                    {financeUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.username} · {user.email} · {user.wallet?.balance ?? 0} TOKENS
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-3 md:grid-cols-[0.35fr_1fr]">
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      step={1}
                      placeholder="+50 o -20"
                      aria-label="Cantidad de tokens"
                    />
                    <input
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Justificacion del ajuste"
                      aria-label="Justificacion del ajuste"
                    />
                  </div>

                  <button className="btn-primary rounded-[12px]" disabled={adjusting}>
                    {adjusting ? "Registrando..." : "Aplicar ajuste"}
                  </button>
                </form>
              ) : null}

              {selectedUser ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
                  <p className="font-semibold text-white">{selectedUser.displayName || selectedUser.username}</p>
                  <p>{selectedUser.email}</p>
                  <p>Rol: {roleLabels[selectedUser.role]}</p>
                  <p>
                    Saldo actual:{" "}
                    <span className="font-semibold text-brand-cyan">
                      {selectedUser.wallet?.balance ?? 0} {selectedUser.wallet?.currencyCode ?? "TOKENS"}
                    </span>
                  </p>
                </div>
              ) : null}

              {message ? <p className={`text-sm ${messageClass}`}>{message}</p> : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
                En esta etapa del MVP no existen pagos reales ni recargas monetarias. Las acreditaciones futuras se
                asignaran por premios, participacion o ajustes aprobados por administracion.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
                Si necesitas revisar un ajuste, contacta al organizador o al equipo administrativo de la plataforma.
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title={userHistoryTitle} description="Movimientos vinculados a tu billetera interna no monetaria.">
        {userTransactions.length > 0 ? (
          <div className="space-y-3">
            {userTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{transactionTypeLabels[transaction.type] ?? transaction.type}</p>
                    <p className="mt-1 text-white/60">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <div className={`text-lg font-semibold ${transactionTone(transaction.amount)}`}>
                    {formatAmount(transaction.amount)} {transaction.wallet?.currencyCode ?? wallet.currencyCode}
                  </div>
                </div>
                <p className="mt-3 text-white/70">{transaction.reason}</p>
                <p className="mt-2 text-white/50">
                  Saldo: {transaction.balanceBefore} → {transaction.balanceAfter}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
            Aun no tienes movimientos registrados en tu billetera interna.
          </div>
        )}
      </SectionCard>

      {canViewFinance ? (
        <SectionCard title="Historial financiero interno" description="Ultimos ajustes y movimientos de tokens internos registrados en la plataforma.">
          {financeTransactions.length > 0 ? (
            <div className="space-y-3">
              {financeTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {transaction.user?.displayName || transaction.user?.username || "Usuario"} ·{" "}
                        {transaction.user?.email ?? "sin correo"}
                      </p>
                      <p className="mt-1 text-white/60">
                        {transactionTypeLabels[transaction.type] ?? transaction.type} · {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className={`text-lg font-semibold ${transactionTone(transaction.amount)}`}>
                      {formatAmount(transaction.amount)} {transaction.wallet?.currencyCode ?? "TOKENS"}
                    </div>
                  </div>
                  <p className="mt-3 text-white/70">{transaction.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-white/50">
                    <span>
                      Saldo: {transaction.balanceBefore} → {transaction.balanceAfter}
                    </span>
                    {transaction.actorUser ? <span>Actor: {transaction.actorUser.displayName || transaction.actorUser.username}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
              Todavia no existen movimientos financieros registrados.
            </div>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
