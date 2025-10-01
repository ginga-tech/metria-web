import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import lifeBalanceLogo from "../assets/lifebalance-logo.svg";
import "../styles/slider.css";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { DIMENSIONS, type DimensionKey } from "../constants/assessment";

/**
 * LifeBalance Ã¢â‚¬â€œ AutoavaliaÃƒÂ§ÃƒÂ£o (10 dimensÃƒÂµes)
 * Stack: React + TailwindCSS
 * Fluxo: usuÃƒÂ¡rio avalia 1Ã¢â‚¬â€œ5 cada dimensÃƒÂ£o e envia Ã¢â€ â€™ salva no backend e navega p/ dashboard
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

  // Carrega os dados salvos do usuÃƒÂ¡rio
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
            // NÃƒÂ£o tem assessment ainda, usa dados locais se houver
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
        if (!r.ok) throw new Error(`Erro ao salvar avaliaÃƒÂ§ÃƒÂ£o (${r.status})`);
      } else {
        // fallback local (sem API) Ã¢â‚¬â€œ ÃƒÂºtil enquanto integra o backend
        const history = JSON.parse(localStorage.getItem("lb_assessment") || "[]");
        history.push(payload);
        localStorage.setItem("lb_assessment", JSON.stringify(history));
      }

      setMessage("AvaliaÃƒÂ§ÃƒÂ£o salva! Gerando seu Balance...");
      // navega para dashboard (crie a rota /dashboard no router)
      setTimeout(() => navigate("/dashboard"), 400);
    } catch (err: any) {
      setMessage(err?.message || "Erro inesperado ao enviar avaliaÃƒÂ§ÃƒÂ£o");
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
              <span className="text-white text-lg">Ã°Å¸â€œÅ </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2F6C92]">
                {isEditing ? "Editar Assessment" : "Novo Assessment"}
              </h1>
              <p className="text-sm text-[#2F6C92]/70">
                OlÃƒÂ¡, <span className="font-semibold text-[#2F6C92]">{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'UsuÃƒÂ¡rio'}</span>!
              </p>
            </div>
          </div>
          <UserMenu userEmail={user?.email} userName={user?.name} />
        </div>
      </header>

      <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SeÃƒÂ§ÃƒÂ£o esquerda - InformaÃƒÂ§ÃƒÂµes */}
        <section className="relative overflow-hidden rounded-2xl shadow-xl bg-white flex items-center justify-center p-10 order-2 lg:order-1">
          <div className="absolute inset-0 bg-white" />
          <div className="relative z-10 w-full max-w-[400px] text-[#6B3D0C]">
            <div className="flex justify-center mb-8">
              <img
                src={lifeBalanceLogo}
                alt="LifeBalance"
                className="w-48 sm:w-56 drop-shadow-lg"
              />
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight tracking-tight text-center mb-4">
              {isEditing ? "Editar AvaliaÃƒÂ§ÃƒÂ£o" : "AutoavaliaÃƒÂ§ÃƒÂ£o das 10 DimensÃƒÂµes"}
            </h2>
            <p className="text-[#7A4312]/90 text-center mb-6">
              {isEditing 
                ? "Ajuste suas pontuaÃƒÂ§ÃƒÂµes conforme sua evoluÃƒÂ§ÃƒÂ£o atual. As alteraÃƒÂ§ÃƒÂµes serÃƒÂ£o salvas com nova data."
                : "Avalie honestamente cada dimensÃƒÂ£o da sua vida de 1 a 5. Esta anÃƒÂ¡lise serÃƒÂ¡ a base para gerar seu radar de equilÃƒÂ­brio personalizado."
              }
            </p>

            {/* InformaÃƒÂ§ÃƒÂ£o da ÃƒÂºltima avaliaÃƒÂ§ÃƒÂ£o */}
            {isEditing && lastAssessmentDate && (
              <div className="mb-6 p-4 rounded-xl bg-[#41B36E]/10 border border-[#41B36E]/20">
                <p className="text-sm text-[#2F6C92] font-medium mb-1">Ã°Å¸â€œâ€¦ ÃƒÅ¡ltima avaliaÃƒÂ§ÃƒÂ£o:</p>
                <p className="text-sm text-[#2F6C92]/80">
                  {formatDate(lastAssessmentDate)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-[#F3F4F6] p-4 text-center">
                <p className="text-sm text-[#2F6C92]/70">MÃƒÂ©dia Atual</p>
                <p className="text-2xl font-semibold text-[#2F6C92]">{avg}</p>
              </div>
              <div className="rounded-xl bg-[#F3F4F6] p-4 text-center">
                <p className="text-sm text-[#2F6C92]/70">DimensÃƒÂµes</p>
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

        {/* SeÃƒÂ§ÃƒÂ£o direita - FormulÃƒÂ¡rio */}
        <section className="rounded-2xl shadow-xl bg-white p-6 sm:p-8 order-1 lg:order-2">
          <div className="mb-6">
            <p className="text-sm text-[#2F6C92] font-medium mb-1">
              {isEditing ? "Atualize sua avaliaÃƒÂ§ÃƒÂ£o" : "Sua jornada de autoconhecimento"}
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">
              {isEditing ? "Editar dimensÃƒÂµes" : "Avalie suas dimensÃƒÂµes"}
            </h3>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6C92]"></div>
              <span className="ml-3 text-[#2F6C92]">Carregando sua avaliaÃƒÂ§ÃƒÂ£o...</span>
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
                  ? (isEditing ? "Salvando alteraÃƒÂ§ÃƒÂµes..." : "Gerando seu Balance...") 
                  : (isEditing ? "Salvar AlteraÃƒÂ§ÃƒÂµes" : "Gerar meu LifeBalance")
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

// FunÃƒÂ§ÃƒÂ£o para ler assessment local
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

// FunÃƒÂ§ÃƒÂ£o para formatar data
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
