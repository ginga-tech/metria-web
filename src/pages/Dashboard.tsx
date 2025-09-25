import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";

/**
 * LifeBalance – Dashboard Melhorado
 * - Design moderno com cards informativos
 * - Múltiplas visualizações dos dados
 * - Sugestões personalizadas
 * - Estatísticas e progresso
 */

type Scores = Record<string, number>;

interface AssessmentDto {
  scores: Scores;
  average: number;
  createdAtUtc: string;
}

const DIMENSIONS: { key: keyof Scores; label: string; icon: string; color: string }[] = [
  { key: "saude", label: "Saúde", icon: "💪", color: "#41B36E" },
  { key: "conhecimento", label: "Conhecimento", icon: "🧠", color: "#2F6C92" },
  { key: "disciplina", label: "Disciplina e Foco", icon: "🎯", color: "#F96B11" },
  { key: "cultura", label: "Cultura Geral", icon: "🎭", color: "#8B5CF6" },
  { key: "leitura", label: "Leitura", icon: "📚", color: "#06B6D4" },
  { key: "inteligenciaEmocional", label: "Inteligência Emocional", icon: "❤️", color: "#EF4444" },
  { key: "relacionamentos", label: "Relacionamentos", icon: "👥", color: "#10B981" },
  { key: "maturidadeProfissional", label: "Maturidade Profissional", icon: "💼", color: "#6366F1" },
  { key: "visaoDeMundo", label: "Visão de Mundo", icon: "🌍", color: "#F59E0B" },
  { key: "dominioFinanceiro", label: "Domínio Financeiro", icon: "💰", color: "#059669" },
];

const SUGGESTIONS = {
  saude: [
    "Pratique 30 minutos de exercício 3x por semana",
    "Mantenha uma rotina de sono de 7-8 horas",
    "Inclua mais vegetais e frutas na sua dieta",
    "Faça pausas regulares durante o trabalho"
  ],
  conhecimento: [
    "Dedique 20 minutos diários para aprender algo novo",
    "Inscreva-se em um curso online relevante",
    "Participe de webinars e palestras",
    "Mantenha-se atualizado com tendências da sua área"
  ],
  disciplina: [
    "Use a técnica Pomodoro para focar melhor",
    "Crie uma rotina matinal consistente",
    "Elimine distrações do seu ambiente de trabalho",
    "Defina metas claras e mensuráveis"
  ],
  cultura: [
    "Visite museus e exposições culturais",
    "Assista documentários educativos",
    "Explore diferentes estilos musicais",
    "Participe de eventos culturais locais"
  ],
  leitura: [
    "Leia pelo menos 20 páginas por dia",
    "Diversifique os gêneros literários",
    "Participe de clubes de leitura",
    "Mantenha um diário de leituras"
  ],
  inteligenciaEmocional: [
    "Pratique mindfulness e meditação",
    "Desenvolva a escuta ativa",
    "Trabalhe o autoconhecimento",
    "Aprenda técnicas de gestão de estresse"
  ],
  relacionamentos: [
    "Dedique tempo de qualidade para família e amigos",
    "Pratique a comunicação assertiva",
    "Desenvolva sua rede de contatos profissionais",
    "Seja mais empático nas interações"
  ],
  maturidadeProfissional: [
    "Busque feedback regular sobre seu desempenho",
    "Desenvolva habilidades de liderança",
    "Mantenha-se atualizado com o mercado",
    "Invista em networking profissional"
  ],
  visaoDeMundo: [
    "Leia notícias de fontes diversas",
    "Converse com pessoas de diferentes backgrounds",
    "Viaje ou explore culturas diferentes",
    "Questione suas próprias crenças e preconceitos"
  ],
  dominioFinanceiro: [
    "Crie e mantenha um orçamento mensal",
    "Invista em educação financeira",
    "Diversifique seus investimentos",
    "Tenha uma reserva de emergência"
  ]
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [data, setData] = useState<AssessmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
        const token = localStorage.getItem("lb_token") ?? "";

        if (API && token) {
          const r = await fetch(`${API}/api/assessment/latest`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) {
            const dto = (await r.json()) as AssessmentDto;
            if (mounted) setData(dto);
          } else if (r.status === 404) {
            const local = readLocalAssessment();
            if (mounted) setData(local);
          } else {
            throw new Error(`Erro ${r.status} ao buscar assessment`);
          }
        } else {
          const local = readLocalAssessment();
          if (mounted) setData(local);
        }
      } catch (e: any) {
        setError(e?.message || "Falha ao carregar dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!data?.scores) return [];
    return DIMENSIONS.map((d) => ({
      dimension: d.label,
      score: clampScore(data.scores[d.key] ?? 0),
      fullMark: 5,
    }));
  }, [data]);

  const strengths = useMemo(() => {
    if (!data?.scores) return [];
    return DIMENSIONS
      .map((d) => ({ ...d, score: data.scores[d.key] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [data]);

  const weaknesses = useMemo(() => {
    if (!data?.scores) return [];
    return DIMENSIONS
      .map((d) => ({ ...d, score: data.scores[d.key] ?? 0 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [data]);

  const personalizedSuggestions = useMemo(() => {
    if (!data?.scores) return [];
    const suggestions: Array<{ area: string; suggestion: string; icon: string }> = [];
    
    weaknesses.forEach(weakness => {
      const areaSuggestions = SUGGESTIONS[weakness.key as keyof typeof SUGGESTIONS];
      if (areaSuggestions && areaSuggestions.length > 0) {
        const randomSuggestion = areaSuggestions[Math.floor(Math.random() * areaSuggestions.length)];
        suggestions.push({
          area: weakness.label,
          suggestion: randomSuggestion,
          icon: weakness.icon
        });
      }
    });
    
    return suggestions;
  }, [weaknesses]);

  const overallScore = useMemo(() => {
    if (!data?.average) return 0;
    return Math.round(data.average * 10) / 10;
  }, [data]);

  const scoreLevel = useMemo(() => {
    if (overallScore >= 4.5) return { label: "Excelente", color: "#10B981", emoji: "🌟" };
    if (overallScore >= 3.5) return { label: "Bom", color: "#41B36E", emoji: "👍" };
    if (overallScore >= 2.5) return { label: "Regular", color: "#F59E0B", emoji: "⚠️" };
    return { label: "Precisa melhorar", color: "#EF4444", emoji: "🎯" };
  }, [overallScore]);

  const when = useMemo(() => {
    if (!data?.createdAtUtc) return "—";
    try {
      const d = new Date(data.createdAtUtc);
      return d.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return data.createdAtUtc;
    }
  }, [data]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2F6C92]">Dashboard</h1>
                <p className="text-[#2F6C92]/70 text-sm">
                  Olá, <span className="font-semibold text-[#2F6C92]">{user?.email?.split('@')[0] || 'Usuário'}</span>! 
                  Última avaliação em <span className="font-medium text-[#2F6C92]">{when}</span>
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} />
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl bg-white border-l-4 border-red-500 text-red-700 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Cards de estatísticas */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pontuação Geral</p>
                <p className="text-3xl font-bold text-[#2F6C92]">{overallScore}/5</p>
                <p className="text-sm" style={{ color: scoreLevel.color }}>
                  {scoreLevel.emoji} {scoreLevel.label}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center">
                <span className="text-white text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pontos Fortes</p>
                <p className="text-3xl font-bold text-[#41B36E]">{strengths.length}</p>
                <p className="text-sm text-[#41B36E]">💪 Áreas desenvolvidas</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#41B36E] to-[#10B981] flex items-center justify-center">
                <span className="text-white text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-3xl font-bold text-[#F96B11]">{weaknesses.length}</p>
                <p className="text-sm text-[#F96B11]">🎯 Para melhorar</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#F96B11] to-[#F59E0B] flex items-center justify-center">
                <span className="text-white text-2xl">🚀</span>
              </div>
            </div>
          </div>
        </section>

        {/* Grid principal */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#2F6C92]">Radar de Equilíbrio</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full bg-[#41B36E]"></span>
                <span>Sua pontuação</span>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius={150}>
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: "#2F6C92", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: "#6B7280", fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value}/5`, 'Pontuação']}
                    labelStyle={{ color: '#2F6C92' }}
                  />
                  <Radar 
                    name="Pontuação" 
                    dataKey="score" 
                    stroke="#2F6C92" 
                    fill="#41B36E" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights e Ações */}
          <div className="space-y-6">
            {/* Pontos Fortes e Fracos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-4">Análise Rápida</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#41B36E] mb-3 flex items-center gap-2">
                    <span>🏆</span> Seus pontos fortes
                  </h3>
                  <div className="space-y-2">
                    {strengths.map((s) => (
                      <div key={s.key} className="flex items-center justify-between p-2 rounded-lg bg-[#41B36E]/5">
                        <div className="flex items-center gap-2">
                          <span>{s.icon}</span>
                          <span className="text-sm font-medium text-[#2F6C92]">{s.label}</span>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-[#41B36E] text-white text-xs font-bold">
                          {s.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F96B11] mb-3 flex items-center gap-2">
                    <span>🎯</span> Focar nestas áreas
                  </h3>
                  <div className="space-y-2">
                    {weaknesses.map((w) => (
                      <div key={w.key} className="flex items-center justify-between p-2 rounded-lg bg-[#F96B11]/5">
                        <div className="flex items-center gap-2">
                          <span>{w.icon}</span>
                          <span className="text-sm font-medium text-[#2F6C92]">{w.label}</span>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-[#F96B11] text-white text-xs font-bold">
                          {w.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-4">Ações Rápidas</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    sessionStorage.setItem('editAssessment', 'true');
                    navigate("/assessment");
                  }}
                  className="w-full h-12 rounded-xl border-2 border-[#2F6C92] text-[#2F6C92] hover:bg-[#2F6C92] hover:text-white transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <span>📊</span>
                  Refazer Avaliação
                </button>
                
                <button 
                  onClick={() => navigate("/goals")}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white hover:from-[#10B981] hover:to-[#41B36E] transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>🎯</span>
                  Definir Metas Semanais
                </button>
              </div>
            </div>

            {/* Sugestões Personalizadas */}
            {personalizedSuggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#2F6C92] mb-4">💡 Sugestões para Você</h2>
                <div className="space-y-3">
                  {personalizedSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border-l-4 border-[#41B36E]">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#2F6C92]">{suggestion.area}</p>
                          <p className="text-sm text-gray-700 mt-1">{suggestion.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-[#F3F4F6] rounded mb-4" />
          <div className="h-72 w-full bg-[#F3F4F6] rounded mb-4" />
          <div className="h-4 w-1/2 bg-[#F3F4F6] rounded" />
        </div>
        <p className="mt-4 text-sm text-[#2F6C92]/70 text-center">Carregando seu dashboard...</p>
      </div>
    </div>
  );
}

function clampScore(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return n;
}

function readLocalAssessment(): AssessmentDto | null {
  try {
    const raw = localStorage.getItem("lb_assessment");
    if (!raw) return null;
    const arr = JSON.parse(raw) as AssessmentDto[];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[arr.length - 1];
  } catch {
    return null;
  }
}
