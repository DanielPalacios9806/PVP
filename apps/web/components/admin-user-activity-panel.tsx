"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { SectionCard } from "./section-card";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  role: string;
  status: string;
};

type ActivityUser = AdminUser & {
  country?: string | null;
  mustChangePassword?: boolean;
  passwordChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: {
    id: string;
    type: string;
    currencyCode: string;
    balance: number;
    nonWithdrawable: boolean;
    updatedAt: string;
  } | null;
};

type ActivitySummary = {
  registrations: number;
  reportedResults: number;
  openedDisputes: number;
  walletTransactions: number;
  auditLogs: number;
  criticalAuditEvents: number;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  module?: string;
  severity?: string;
  createdAt: string;
  actorUser?: AdminUser | null;
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
  actorUser?: AdminUser | null;
};

type RegistrationActivity = {
  id: string;
  status: string;
  checkedInAt?: string | null;
  createdAt: string;
  tournament: {
    id: string;
    name: string;
    slug: string;
    game: string;
    status: string;
    startsAt?: string | null;
  };
  team?: { id: string; name: string; tag?: string | null } | null;
};

type ResultActivity = {
  id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  createdAt: string;
  confirmedAt?: string | null;
  match: {
    id: string;
    status: string;
    tournament: { id: string; name: string; slug: string; game: string };
    round?: { id: string; name: string; sequence: number } | null;
  };
};

type DisputeActivity = {
  id: string;
  matchId: string;
  reason: string;
  status: string;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  match: {
    id: string;
    status: string;
    tournament: { id: string; name: string; slug: string; game: string };
    round?: { id: string; name: string; sequence: number } | null;
  };
  resolvedByUser?: AdminUser | null;
};

type ActivityResponse = {
  user: ActivityUser;
  summary: ActivitySummary;
  auditLogs: AuditLog[];
  walletTransactions: WalletTransaction[];
  registrations: RegistrationActivity[];
  reportedResults: ResultActivity[];
  openedDisputes: DisputeActivity[];
};

type ActivityTab = "overview" | "audit" | "tokens" | "tournaments" | "matches" | "disputes";

const tabLabels: Record<ActivityTab, string> = {
  overview: "Resumen",
  audit: "Auditoria",
  tokens: "Tokens",
  tournaments: "Torneos",
  matches: "Resultados",
  disputes: "Disputas"
};

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function displayName(user?: Pick<AdminUser, "displayName" | "username" | "email"> | null) {
  if (!user) return "Sistema";
  return user.displayName ?? user.username ?? user.email;
}

function severityClass(severity?: string) {
  if (severity === "critical") return "border-rose-400/35 bg-rose-500/10 text-rose-100";
  if (severity === "warning") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-[#18e6f2]/25 bg-[#18e6f2]/10 text-[#18e6f2]";
}

export function AdminUserActivityPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [tab, setTab] = useState<ActivityTab>("overview");
  const [message, setMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? activity?.user ?? null, [activity?.user, selectedUserId, users]);

  async function loadUsers(query = search) {
    setLoadingUsers(true);
    setMessage("");

    try {
      const params = new URLSearchParams({ limit: "25" });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`${apiUrl}/admin/users?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = (await response.json()) as AdminUser[] | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "No se pudieron cargar usuarios.");
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar usuarios.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadActivity(userId = selectedUserId) {
    if (!userId) {
      setMessage("Selecciona un usuario para revisar su actividad.");
      return;
    }

    setLoadingActivity(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/activity?limit=50`, {
        headers: getAuthHeaders()
      });
      const data = (await response.json()) as ActivityResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "No se pudo cargar la actividad.");
      }

      setActivity(data as ActivityResponse);
      setTab("overview");
    } catch (error) {
      setActivity(null);
      setMessage(error instanceof Error ? error.message : "No se pudo cargar la actividad del usuario.");
    } finally {
      setLoadingActivity(false);
    }
  }

  useEffect(() => {
    void loadUsers("");
  }, []);

  return (
    <SectionCard title="Historial de actividad por usuario" description="Revisa trazabilidad, tokens, torneos, resultados y disputas de un perfil concreto.">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void loadUsers();
          }}
          placeholder="Buscar usuario, correo o nombre visible..."
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
        />
        <select
          value={selectedUserId}
          onChange={(event) => setSelectedUserId(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
        >
          <option value="" className="bg-[#08111f] text-white">
            Selecciona usuario
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id} className="bg-[#08111f] text-white">
              {displayName(user)} · {user.role}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loadingUsers}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-60"
          >
            {loadingUsers ? "Buscando..." : "Buscar"}
          </button>
          <button
            type="button"
            onClick={() => void loadActivity()}
            disabled={loadingActivity || !selectedUserId}
            className="rounded-2xl bg-[#18e6f2] px-4 py-3 text-sm font-semibold text-[#07111f] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingActivity ? "Cargando..." : "Ver actividad"}
          </button>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{message}</p> : null}

      {activity ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-[#18e6f2]/20 bg-[#18e6f2]/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#18e6f2]">Perfil auditado</p>
                <h3 className="mt-2 text-2xl font-black text-white">{displayName(activity.user)}</h3>
                <p className="mt-1 text-sm text-white/60">{activity.user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">{activity.user.role}</span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/70">{activity.user.status}</span>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  {activity.user.wallet?.balance ?? 0} {activity.user.wallet?.currencyCode ?? "TOKENS"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Metric label="Registros" value={activity.summary.registrations} />
            <Metric label="Resultados" value={activity.summary.reportedResults} />
            <Metric label="Disputas" value={activity.summary.openedDisputes} tone={activity.summary.openedDisputes > 0 ? "warning" : "default"} />
            <Metric label="Mov. tokens" value={activity.summary.walletTransactions} />
            <Metric label="Auditoria" value={activity.summary.auditLogs} />
            <Metric label="Criticos" value={activity.summary.criticalAuditEvents} tone={activity.summary.criticalAuditEvents > 0 ? "danger" : "default"} />
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(tabLabels) as ActivityTab[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTab(option)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  tab === option ? "border-[#18e6f2]/60 bg-[#18e6f2]/15 text-[#18e6f2]" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"
                }`}
              >
                {tabLabels[option]}
              </button>
            ))}
          </div>

          {tab === "overview" ? <Overview activity={activity} /> : null}
          {tab === "audit" ? <AuditList logs={activity.auditLogs} /> : null}
          {tab === "tokens" ? <WalletList transactions={activity.walletTransactions} /> : null}
          {tab === "tournaments" ? <RegistrationList registrations={activity.registrations} /> : null}
          {tab === "matches" ? <ResultList results={activity.reportedResults} /> : null}
          {tab === "disputes" ? <DisputeList disputes={activity.openedDisputes} /> : null}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
          Busca un usuario y selecciona “Ver actividad” para cargar su historial operativo.
        </div>
      )}
    </SectionCard>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "border-rose-400/25 bg-rose-500/10 text-rose-100" : tone === "warning" ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/[0.03] text-white";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] opacity-60">{label}</p>
      <strong className="mt-2 block text-2xl">{value}</strong>
    </div>
  );
}

function Overview({ activity }: { activity: ActivityResponse }) {
  const lastAudit = activity.auditLogs[0];
  const lastToken = activity.walletTransactions[0];
  const lastRegistration = activity.registrations[0];
  const lastDispute = activity.openedDisputes[0];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoCard title="Ultima accion auditada" value={lastAudit?.action ?? "Sin eventos"} detail={lastAudit ? formatDate(lastAudit.createdAt) : "No existen eventos recientes."} />
      <InfoCard title="Ultimo movimiento de tokens" value={lastToken ? `${lastToken.amount > 0 ? "+" : ""}${lastToken.amount} tokens` : "Sin movimientos"} detail={lastToken?.reason ?? "No hay ajustes registrados."} />
      <InfoCard title="Ultimo torneo" value={lastRegistration?.tournament.name ?? "Sin registros"} detail={lastRegistration ? `${lastRegistration.status} · ${formatDate(lastRegistration.createdAt)}` : "No participa en torneos."} />
      <InfoCard title="Ultima disputa" value={lastDispute?.status ?? "Sin disputas"} detail={lastDispute?.reason ?? "No hay disputas abiertas por este usuario."} />
    </div>
  );
}

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{title}</p>
      <strong className="mt-2 block text-base text-white">{value}</strong>
      <p className="mt-2 text-sm text-white/55">{detail}</p>
    </div>
  );
}

function AuditList({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) return <EmptyState text="No hay auditoria relacionada con este usuario." />;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${severityClass(log.severity)}`}>{log.severity ?? "info"}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/50">{log.module ?? "system"}</span>
            </div>
            <span className="text-xs text-white/45">{formatDate(log.createdAt)}</span>
          </div>
          <strong className="mt-3 block text-sm text-white">{log.action}</strong>
          <p className="mt-1 text-xs text-white/50">
            {log.entityType} {log.entityId ? `#${log.entityId}` : ""} · Actor: {displayName(log.actorUser)}
          </p>
        </div>
      ))}
    </div>
  );
}

function WalletList({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) return <EmptyState text="No hay movimientos de tokens relacionados." />;

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong className={transaction.amount >= 0 ? "text-emerald-200" : "text-rose-200"}>
              {transaction.amount >= 0 ? "+" : ""}{transaction.amount} tokens
            </strong>
            <span className="text-xs text-white/45">{formatDate(transaction.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm text-white/60">{transaction.reason}</p>
          <p className="mt-1 text-xs text-white/45">
            Saldo: {transaction.balanceBefore} → {transaction.balanceAfter} · Actor: {displayName(transaction.actorUser)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RegistrationList({ registrations }: { registrations: RegistrationActivity[] }) {
  if (registrations.length === 0) return <EmptyState text="No hay registros en torneos." />;

  return (
    <div className="space-y-3">
      {registrations.map((registration) => (
        <div key={registration.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong className="text-white">{registration.tournament.name}</strong>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/60">{registration.status}</span>
          </div>
          <p className="mt-2 text-sm text-white/55">{registration.tournament.game} · {registration.tournament.status}</p>
          <p className="mt-1 text-xs text-white/45">Registro: {formatDate(registration.createdAt)} · Check-in: {formatDate(registration.checkedInAt)}</p>
        </div>
      ))}
    </div>
  );
}

function ResultList({ results }: { results: ResultActivity[] }) {
  if (results.length === 0) return <EmptyState text="No hay resultados reportados por este usuario." />;

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div key={result.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong className="text-white">{result.match.tournament.name}</strong>
            <span className="rounded-full border border-[#18e6f2]/20 bg-[#18e6f2]/10 px-2.5 py-1 text-xs text-[#18e6f2]">{result.homeScore} - {result.awayScore}</span>
          </div>
          <p className="mt-2 text-sm text-white/55">{result.match.round?.name ?? "Ronda"} · Estado resultado: {result.status}</p>
          <p className="mt-1 text-xs text-white/45">Reportado: {formatDate(result.createdAt)} · Confirmado: {formatDate(result.confirmedAt)}</p>
        </div>
      ))}
    </div>
  );
}

function DisputeList({ disputes }: { disputes: DisputeActivity[] }) {
  if (disputes.length === 0) return <EmptyState text="No hay disputas abiertas por este usuario." />;

  return (
    <div className="space-y-3">
      {disputes.map((dispute) => (
        <div key={dispute.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong className="text-white">{dispute.match.tournament.name}</strong>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-100">{dispute.status}</span>
          </div>
          <p className="mt-2 text-sm text-white/60">{dispute.reason}</p>
          <p className="mt-1 text-xs text-white/45">Creada: {formatDate(dispute.createdAt)} · Resolucion: {dispute.resolution ?? "Pendiente"}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-white/55">{text}</div>;
}
