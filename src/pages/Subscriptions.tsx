import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import PageLoader from "../components/PageLoader";
import { useUser } from "../hooks/useUser";
import { getPreferredFirstName } from "../utils/userDisplay";
import { getSubscriptions, type SubscriptionRecord } from "../services/billingService";

type SubscriptionView = SubscriptionRecord & {
  isActive: boolean;
  endAtUtc: string | null;
  endKey: number;
  createdKey: number;
};

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "-";
  return new Date(time).toLocaleString("pt-BR");
}

function formatExpirationAt2359(value?: string | null): string {
  if (!value) return "-";
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "-";
  const datePart = new Date(time).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return `${datePart} 23:59`;
}

function planLabel(plan?: string | null): string {
  if (!plan) return "Plano nao informado";
  const raw = plan.toLowerCase();
  if (raw.includes("annual") || raw.includes("anual")) return "Plano Anual";
  if (raw.includes("monthly") || raw.includes("mensal")) return "Plano Mensal";
  return plan;
}

function statusMeta(status?: string) {
  const value = (status || "unknown").toLowerCase();
  if (value === "active") {
    return {
      label: "Ativa",
      badgeClass: "bg-green-100 text-green-700 border-green-200",
      dotClass: "bg-[#41B36E]",
    };
  }
  if (value.includes("cancel")) {
    return {
      label: "Cancelada",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
      dotClass: "bg-[#F96B11]",
    };
  }
  if (value.includes("expired") || value.includes("inactive")) {
    return {
      label: "Inativa",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      dotClass: "bg-slate-400",
    };
  }
  return {
    label: status || "Desconhecido",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
  };
}

export default function Subscriptions() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [items, setItems] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSubscriptions();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || "Falha ao carregar assinaturas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo<SubscriptionView[]>(() => {
    const enhanced = (items || []).map((s) => {
      const status = s.status?.toLowerCase?.() || "unknown";
      const isActive = status === "active";
      const endAt = s.currentPeriodEndUtc || s.canceledAtUtc || null;
      const endKey = endAt ? Date.parse(endAt) : 0;
      const createdKey = s.createdAtUtc ? Date.parse(s.createdAtUtc) : 0;
      return { ...s, isActive, endKey, createdKey, endAtUtc: endAt };
    });

    const active = enhanced.find((s) => s.isActive);
    const others = enhanced
      .filter((s) => !s.isActive)
      .sort((a, b) => {
        if (b.endKey !== a.endKey) return b.endKey - a.endKey;
        return b.createdKey - a.createdKey;
      });

    return active ? [active, ...others] : others;
  }, [items]);

  const active = useMemo(() => sorted.find((s) => s.isActive) || null, [sorted]);

  if (loading) return <PageLoader message="Carregando assinaturas..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E]">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4m8 0a4 4 0 01-4 4m0-8a8 8 0 100 16 8 8 0 000-16z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#2F6C92] sm:text-4xl">Assinaturas</h1>
                <p className="text-sm text-[#2F6C92]/70 sm:text-base">
                  Ola, <span className="font-semibold text-[#2F6C92]">{getPreferredFirstName(user?.name, user?.email)}</span>. Acompanhe o status do seu plano.
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} userName={user?.name} />
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Plano atual</p>
            <p className="mt-1 text-xl font-bold text-[#2F6C92]">{active ? planLabel(active.plan) : "Plano gratuito"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Validade</p>
            <p className="mt-1 text-xl font-bold text-[#2F6C92]">{active?.endAtUtc ? formatExpirationAt2359(active.endAtUtc) : "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Historico</p>
            <p className="mt-1 text-xl font-bold text-[#2F6C92]">{sorted.length} registro(s)</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-[#2F6C92]">Historico de Assinaturas</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/goals")}
                className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] px-4 font-semibold text-white transition hover:from-[#10B981] hover:to-[#41B36E]"
              >
                Ir para Metas
              </button>
              <button
                onClick={() => navigate("/preferences")}
                className="h-10 cursor-pointer rounded-xl border border-slate-300 px-4 text-[#2F6C92] transition hover:bg-slate-50"
              >
                Preferencias
              </button>
            </div>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {sorted.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
              Nenhuma assinatura encontrada.
            </div>
          )}

          <div className="space-y-3">
            {sorted.map((s, idx) => {
              const meta = statusMeta(s.status);
              return (
                <div key={s.id || idx} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#2F6C92]/40">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${meta.dotClass}`} />
                      <div>
                        <p className="text-sm font-semibold text-[#2F6C92]">{planLabel(s.plan)}</p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-xs text-slate-600 md:text-right">
                      <p>Inicio: {formatDate(s.startedAtUtc)}</p>
                      <p>Fim: {formatExpirationAt2359(s.endAtUtc)}</p>
                      <p>Criado: {formatDate(s.createdAtUtc)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
