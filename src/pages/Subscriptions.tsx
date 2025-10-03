import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { getSubscriptions, type SubscriptionRecord } from "../services/billingService";

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

  const sorted = useMemo(() => {
    const enhanced = (items || []).map((s) => {
      const status = s.status?.toLowerCase?.() || 'unknown';
      const isActive = status === 'active';
      const endAt = s.currentPeriodEndUtc || s.canceledAtUtc || null;
      const endKey = endAt ? Date.parse(endAt) : 0;
      const createdKey = s.createdAtUtc ? Date.parse(s.createdAtUtc) : 0;
      return { ...s, isActive, endKey, createdKey, endAtUtc: endAt } as any;
    });
    const active = enhanced.find((s) => s.isActive);
    const others = enhanced
      .filter((s) => !s.isActive)
      .sort((a, b) => {
        // Ordena por data de fim de vigência desc, depois criação desc
        if (b.endKey !== a.endKey) return (b.endKey - a.endKey);
        return (b.createdKey - a.createdKey);
      });
    return active ? [active, ...others] : others;
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center">
                <span className="text-white text-xl">💳</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2F6C92]">Assinaturas</h1>
                <p className="text-[#2F6C92]/70 text-sm">
                  Olá, <span className="font-semibold text-[#2F6C92]">{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}</span>
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} userName={user?.name} />
          </div>
        </header>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2F6C92]">Histórico de Assinaturas</h2>
            <button onClick={() => navigate('/preferences')} className="h-10 px-4 rounded-lg border border-gray-200 text-[#2F6C92] hover:bg-[#F3F4F6] cursor-pointer">
              Dados Pessoais
            </button>
          </div>

          {loading && (
            <div className="py-10 text-center text-[#2F6C92]">Carregando assinaturas...</div>
          )}
          {error && (
            <div className="py-3 mb-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
          )}

          {!loading && sorted.length === 0 && !error && (
            <div className="py-10 text-center text-gray-500">Nenhuma assinatura encontrada.</div>
          )}

          <div className="space-y-3">
            {sorted.map((s, idx) => (
              <div key={s.id || idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${s.isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={s.isActive ? 'Ativa' : 'Inativa'} />
                  <div>
                    <p className="text-sm font-semibold text-[#2F6C92]">{s.plan || 'Plano'}</p>
                    <p className="text-xs text-gray-600">Status: {s.status || 'desconhecido'}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  {s.startedAtUtc && <p>Início: {new Date(s.startedAtUtc).toLocaleString('pt-BR')}</p>}
                  {s.endAtUtc && <p>Fim: {new Date(s.endAtUtc).toLocaleString('pt-BR')}</p>}
                  {s.createdAtUtc && <p>Criado: {new Date(s.createdAtUtc).toLocaleString('pt-BR')}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
