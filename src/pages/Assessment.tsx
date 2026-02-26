import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import metriaLogo from "../assets/metria-logo.svg";
import "../styles/slider.css";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { DIMENSIONS, type DimensionKey } from "../constants/assessment";

/**
 * metria — Autoavaliação (10 dimensões)
 * Stack: React + TailwindCSS
 * Fluxo: usuário avalia 1–5 cada dimensão e envia → salva no backend e navega p/ dashboard
 * Paleta: Azul #2F6C92 | Verde #41B36E | Laranja #F96B11 | Cinza #F3F4F6 | Branco #FFFFFF
 */

// DimensionKey agora importado de ../constants/assessment

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [values, setValues] = useState<Record<DimensionKey, number>>(() => {
    const v: Record<DimensionKey, number> = Object.create(null);
    DIMENSIONS.forEach((d) => (v[d.key] = 3)); // default inicial = 3
    return v;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Carrega os dados salvos do usuário
  useEffect(() => {
    let mounted = true;
    
    const loadSavedAssessment = async () => {
      setIsLoading(true);
      try {
        const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
        const token = localStorage.getItem("lb_token") ?? "";

        if (API && token) {
          const r = await fetch(`${API}/api/assessment/latest`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (r.ok) {
            const data = await r.json();
            if (mounted && data.scores) {
              // Carrega os valores salvos
              const savedValues: Record<DimensionKey, number> = Object.create(null);
              DIMENSIONS.forEach((d) => {
                savedValues[d.key] = data.scores[d.key] ?? 3;
              });
              setValues(savedValues);
              setLastAssessmentDate(data.createdAtUtc);
              setIsEditing(true);
            }
          } else if (r.status === 404) {
            // Não tem assessment ainda, usa dados locais se houver
            const local = readLocalAssessment();
            if (mounted && local?.scores) {
              const savedValues: Record<DimensionKey, number> = Object.create(null);
              DIMENSIONS.forEach((d) => {
                savedValues[d.key] = local.scores[d.key] ?? 3;
              });
              setValues(savedValues);
              setLastAssessmentDate(local.createdAtUtc);
              setIsEditing(true);
            }
          }
        } else {
          // Sem API, tenta carregar dados locais
          const local = readLocalAssessment();
          if (mounted && local?.scores) {
            const savedValues: Record<DimensionKey, number> = Object.create(null);
            DIMENSIONS.forEach((d) => {
              savedValues[d.key] = local.scores[d.key] ?? 3;
            });
            setValues(savedValues);
            setLastAssessmentDate(local.createdAtUtc);
            setIsEditing(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar assessment:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSavedAssessment();
    
    return () => {
      mounted = false;
    };
  }, []);

  const avg = useMemo(() =>
    Math.round((Object.values(values).reduce((a, b) => a + b, 0) / DIMENSIONS.length) * 10) / 10
  , [values]);

  function setScore(key: DimensionKey, val: number) {
    setValues((s) => ({ ...s, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // payload do MVP
    const payload = {
      scores: values,
      average: avg,
      createdAtUtc: new Date().toISOString(),
    };

    try {
      const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
      const token = localStorage.getItem("lb_token") ?? "";

      if (API) {
        const r = await fetch(`${API}/api/assessment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`Erro ao salvar avaliação (${r.status})`);
      } else {
        // fallback local (sem API) — útil enquanto integra o backend
        const history = JSON.parse(localStorage.getItem("lb_assessment") || "[]");
        history.push(payload);
        localStorage.setItem("lb_assessment", JSON.stringify(history));
      }

      setMessage("Avaliação salva! Gerando seu Balance...");
      // navega para dashboard (crie a rota /dashboard no router)
      setTimeout(() => navigate("/dashboard"), 400);
    } catch (err: any) {
      setMessage(err?.message || "Erro inesperado ao enviar avaliação");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetAll(to = 3) {
    const v: Record<DimensionKey, number> = Object.create(null);
    DIMENSIONS.forEach((d) => (v[d.key] = to));
    setValues(v);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4">
      {/* Header com UserMenu */}
      <header className="w-full max-w-[1200px] mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <circle cx="12" cy="12" r="5" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2F6C92]">
                {isEditing ? "Editar Avaliação" : "Nova Avaliação"}
              </h1>
              <p className="text-sm text-[#2F6C92]/70">
                Olá, <span className="font-semibold text-[#2F6C92]">{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}</span>!
              </p>
            </div>
          </div>
          <UserMenu userEmail={user?.email} userName={user?.name} />
        </div>
      </header>

      <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção esquerda - Informações */}
        <section className="relative overflow-hidden rounded-2xl shadow-xl bg-white flex items-center justify-center p-10 order-2 lg:order-1">
          <div className="absolute inset-0 bg-white" />
          <div className="relative z-10 w-full max-w-[400px] text-[#6B3D0C]">
            <div className="flex justify-center mb-8">
              <img
                src={metriaLogo}
                alt="metria"
                className="w-48 sm:w-56 drop-shadow-lg"
              />
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight tracking-tight text-center mb-4">
              {isEditing ? "Editar Avalia\u00E7\u00E3o" : "Autoavalia\u00E7\u00E3o das 10 Dimens\u00F5es"}
            </h2>
            <p className="text-[#7A4312]/90 text-center mb-6">
              {isEditing 
                ? "Ajuste suas pontua\u00E7\u00F5es conforme sua evolu\u00E7\u00E3o atual. As altera\u00E7\u00F5es ser\u00E3o salvas com nova data."
                : "Avalie honestamente cada dimens\u00E3o da sua vida de 1 a 5. Esta an\u00E1lise ser\u00E1 a base para gerar seu radar de equil\u00EDbrio personalizado."
              }
            </p>

            {/* Informações da última avaliação */}
            {isEditing && lastAssessmentDate && (
              <div className="mb-6 p-4 rounded-xl bg-[#41B36E]/10 border border-[#41B36E]/20">
                <p className="text-sm text-[#2F6C92] font-medium mb-1">Última avaliação:</p>
                <p className="text-sm text-[#2F6C92]/80">
                  {formatDate(lastAssessmentDate)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-[#F3F4F6] p-4 text-center">
                <p className="text-sm text-[#2F6C92]/70">Média Atual</p>
                <p className="text-2xl font-semibold text-[#2F6C92]">{avg}</p>
              </div>
              <div className="rounded-xl bg-[#F3F4F6] p-4 text-center">
                <p className="text-sm text-[#2F6C92]/70">Dimensões</p>
                <p className="text-2xl font-semibold text-[#2F6C92]">{DIMENSIONS.length}</p>
              </div>
            </div>

            <div className="text-center">
              <button 
                type="button"
                onClick={() => resetAll(3)} 
                className="h-11 px-6 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition"
              >
                Resetar para 3
              </button>
            </div>
          </div>
        </section>

        {/* Seção direita - Formulário */}
        <section className="rounded-2xl shadow-xl bg-white p-6 sm:p-8 order-1 lg:order-2">
          <div className="mb-6">
            <p className="text-sm text-[#2F6C92] font-medium mb-1">
              {isEditing ? "Atualize sua avaliação" : "Sua jornada de autoconhecimento"}
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">
              {isEditing ? "Editar Dimensões" : "Avalie suas Dimensões"}
            </h3>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6C92]"></div>
              <span className="ml-3 text-[#2F6C92]">Carregando sua avaliação...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`space-y-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {DIMENSIONS.map((d) => (
              <DimensionCard
                key={d.key}
                label={d.label}
                tooltip={d.tooltip}
                value={values[d.key]}
                onChange={(v) => setScore(d.key, v)}
              />
            ))}

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full h-12 rounded-xl bg-[#41B36E] text-white font-semibold hover:brightness-95 disabled:opacity-60 transition"
              >
                {isSubmitting 
                  ? (isEditing ? "Salvando alterações..." : "Gerando seu Balance...") 
                  : (isEditing ? "Salvar Alterações" : "Gerar meu metria")
                }
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full h-12 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium hover:bg-[#F3F4F6] transition"
              >
                Voltar ao Login
              </button>
            </div>

            {message && (
              <div className="mt-4 text-sm text-[#2F6C92] bg-[#F3F4F6] rounded-xl p-3 text-center">
                {message}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

// Função para ler assessment local
function readLocalAssessment() {
  try {
    const raw = localStorage.getItem("lb_assessment");
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[arr.length - 1];
  } catch {
    return null;
  }
}

// Função para formatar data
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

function DimensionCard({
  label,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#2F6C92]">
              {label}
            </label>
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-semibold text-[#2F6C92] bg-[#F3F4F6] px-2 py-1 rounded">
            {value}/5
          </span>
        </div>

        <div className="px-2">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-[#F3F4F6] rounded-lg appearance-none cursor-pointer slider"
            aria-label={label}
          />
          <div className="flex justify-between text-xs text-[#2F6C92]/70 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 left-0 top-full mt-2 w-80 max-w-sm bg-[#2F6C92] text-white text-xs rounded-lg p-3 shadow-lg">
          <div className="absolute -top-1 left-6 w-2 h-2 bg-[#2F6C92] rotate-45"></div>
          {tooltip}
        </div>
      )}
    </div>
  );
}
