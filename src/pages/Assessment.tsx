import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import lifeBalanceLogo from "../assets/lifebalance-logo.svg";
import "../styles/slider.css";

/**
 * LifeBalance – Autoavaliação (10 dimensões)
 * Stack: React + TailwindCSS
 * Fluxo: usuário avalia 1–5 cada dimensão e envia → salva no backend e navega p/ dashboard
 * Paleta: Azul #2F6C92 | Verde #41B36E | Laranja #F96B11 | Cinza #F3F4F6 | Branco #FFFFFF
 */

type DimensionKey =
  | "saude"
  | "conhecimento"
  | "disciplina"
  | "cultura"
  | "leitura"
  | "inteligenciaEmocional"
  | "relacionamentos"
  | "maturidadeProfissional"
  | "visaoDeMundo"
  | "dominioFinanceiro";

const DIMENSIONS: { key: DimensionKey; label: string; tooltip: string }[] = [
  { 
    key: "saude", 
    label: "Saúde", 
    tooltip: "Você já sabe o quanto cuidar da saúde é importante. Com peso, alimentação, exercícios físicos, sono e estresse equilibrados, você tem a energia necessária para conquistar seus objetivos e sonhos."
  },
  { 
    key: "conhecimento", 
    label: "Conhecimento", 
    tooltip: "Você tem uma boa bagagem técnica, com hard skills variadas e conhecimentos avançados. Isso permite que você tenha uma visão estratégica apurada, essencial para a boa tomada de decisão."
  },
  { 
    key: "disciplina", 
    label: "Disciplina e Foco", 
    tooltip: "A constância faz parte da sua vida. Com uma rotina diária bem estabelecida, organização e consistência nas atividades, você consegue fazer entregas de resultados impactando sua vida pessoal e profissional."
  },
  { 
    key: "cultura", 
    label: "Cultura Geral", 
    tooltip: "Possuir conhecimentos variados possibilita criar conexões com diferentes pessoas. Do interesse sobre economia até saber curiosidades sobre outros países e culturas, você se relaciona bem em qualquer ambiente."
  },
  { 
    key: "leitura", 
    label: "Leitura", 
    tooltip: "Você sabe a importância da leitura e leu vários livros nos últimos meses. Valorizar esse conhecimento adquirido permite que você alcance diferentes pessoas, lugares e oportunidades."
  },
  { 
    key: "inteligenciaEmocional", 
    label: "Inteligência Emocional", 
    tooltip: "Você consegue lidar com serenidade com as suas emoções, seja em situações de estresse ou adversidades. Sua maturidade emocional faz com que você tenha mais equilíbrio no dia a dia."
  },
  { 
    key: "relacionamentos", 
    label: "Relacionamentos", 
    tooltip: "Você tem a habilidade de criar e manter relacionamentos, seja no âmbito familiar, nas amizades, no trabalho ou até mesmo na sua rede de networking. Essa característica pode ser um diferencial para chegar mais longe."
  },
  { 
    key: "maturidadeProfissional", 
    label: "Maturidade Profissional", 
    tooltip: "Você tem exata noção das suas responsabilidades e domínio total do que faz. Por isso, sempre entrega além do que é pedido. Se bem trabalhadas, essas características podem provocar grandes melhorias na sua vida."
  },
  { 
    key: "visaoDeMundo", 
    label: "Visão de Mundo", 
    tooltip: "Suas noções gerais de economia, economia digital, tecnologia, geopolítica e atualidades proporcionam uma visão única sobre o mundo. Isso pode trazer oportunidades, facilitar networking e abrir portas profissionais."
  },
  { 
    key: "dominioFinanceiro", 
    label: "Domínio Financeiro", 
    tooltip: "Você tem uma boa relação com o dinheiro. Pode ser que ainda seja conservador na forma de fazer investimentos, mas está disposto a aprender mais para conquistar sua liberdade financeira."
  },
];

export default function Assessment() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<DimensionKey, number>>(() => {
    const v: Record<DimensionKey, number> = Object.create(null);
    DIMENSIONS.forEach((d) => (v[d.key] = 3)); // default = 3 (equilíbrio neutro)
    return v;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
        // fallback local (sem API) – útil enquanto integra o backend
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
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção esquerda - Informações */}
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
              Autoavaliação das 10 Dimensões
            </h2>
            <p className="text-[#7A4312]/90 text-center mb-6">
              Avalie honestamente cada dimensão da sua vida de 1 a 5. Esta análise será a base para gerar seu radar de equilíbrio personalizado.
            </p>

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
              Sua jornada de autoconhecimento
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">
              Avalie suas dimensões
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#41B36E] text-white font-semibold hover:brightness-95 disabled:opacity-60 transition"
              >
                {isSubmitting ? "Gerando seu Balance..." : "Gerar meu LifeBalance"}
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
