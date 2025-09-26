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

type Scores = Record<string, number>;

interface AssessmentDto {
  scores: Scores;
  average: number;
  createdAtUtc: string;
}

const DIMENSIONS: { key: keyof Scores; label: string; icon: string; color: string }[] = [
  { key: "saude", label: "Saúde", icon: "🫀", color: "#41B36E" },
  { key: "conhecimento", label: "Conhecimento", icon: "📚", color: "#2F6C92" },
  { key: "disciplina", label: "Disciplina e Foco", icon: "🎯", color: "#F96B11" },
  { key: "cultura", label: "Cultura Geral", icon: "🎭", color: "#8B5CF6" },
  { key: "leitura", label: "Leitura", icon: "📖", color: "#06B6D4" },
  { key: "inteligenciaEmocional", label: "Inteligência Emocional", icon: "🧠", color: "#EF4444" },
  { key: "relacionamentos", label: "Relacionamentos", icon: "🤝", color: "#10B981" },
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

export default function DashboardReordered() {
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

  const overallScore = useMemo(() => {
    if (!data?.average) return 0;
    return Math.round(data.average * 10) / 10;
  }, [data]);

  const scoreLevel = useMemo(() => {
    if (overallScore >= 4.5) return { label: "Excelente", color: "#10B981", emoji: "🌟" };
    if (overallScore >= 3.5) return { label: "Bom", color: "#41B36E", emoji: "👍" };
    if (overallScore >= 2.5) return { label: "Regular", color: "#F59E0B", emoji: "🟡" };
    return { label: "Precisa melhorar", color: "#EF4444", emoji: "⚠️" };
  }, [overallScore]);

  const when = useMemo(() => {
    if (!data?.createdAtUtc) return "";
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
                  Olá, <span className="font-semibold text-[#2F6C92]">{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}</span>! Última avaliação em <span className="font-medium text-[#2F6C92]">{when}</span>
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
                <p className="text-sm text-[#41B36E]">✅ Áreas desenvolvidas</p>
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
                <p className="text-sm text-[#F96B11]">⚠️ Para melhorar</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#F96B11] to-[#F59E0B] flex items-center justify-center">
                <span className="text-white text-2xl">🛠️</span>
              </div>
            </div>
          </div>
        </section>

        {/* Grid principal reordenado */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Esquerda (2 colunas): Entenda as 10 Dimensões */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-[#2F6C92] mb-6 flex items-center gap-3">
                <span className="text-3xl">🧭</span>
                Entenda as 10 Dimensões do Equilíbrio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DIMENSIONS.map((dimension) => (
                  <div key={dimension.key} className="p-4 rounded-xl border border-gray-200 hover:border-[#41B36E] transition-colors duration-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${dimension.color}15` }}>
                          {dimension.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#2F6C92] mb-2">{dimension.label}</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {getCategoryDescription(dimension.key as keyof typeof SUGGESTIONS)}
                        </p>
                        {data?.scores && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Sua pontuação:</span>
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: getScoreColor(data.scores[dimension.key] ?? 0) }}
                            >
                              {clampScore(data.scores[dimension.key] ?? 0)}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direita: Radar + Ações Rápidas (com Análise Rápida) */}
          <div className="space-y-6">
            {/* Radar de Equilíbrio */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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

            {/* Ações Rápidas + Análise Rápida */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-4">Ações Rápidas</h2>
              <div className="space-y-3 mb-4">
                <button 
                  onClick={() => {
                    sessionStorage.setItem('editAssessment', 'true');
                    navigate("/assessment");
                  }}
                  className="w-full h-12 rounded-xl bg-[#2F6C92] text-white hover:bg-[#1E5A7A] transition-colors duration-200 font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🧭</span>
                  Refazer Avaliação
                </button>
                
                <button 
                  onClick={() => navigate("/goals")}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white hover:from-[#10B981] hover:to-[#41B36E] hover:brightness-110 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>🎯</span>
                  Definir Metas
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#2F6C92]">Análise Rápida</h3>
                <div>
                  <h4 className="text-sm font-semibold text-[#41B36E] mb-3 flex items-center gap-2">
                    <span>🏆</span> Seus pontos fortes
                  </h4>
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
                  <h4 className="text-sm font-semibold text-[#F96B11] mb-3 flex items-center gap-2">
                    <span>⚠️</span> Focar nestas áreas
                  </h4>
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
          </div>
        </section>

        {/* Botão flutuante para nova meta */}
        <button
          aria-label="Adicionar nova meta"
          onClick={() => navigate('/goals')}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#41B36E] text-white text-3xl leading-none shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Adicionar nova meta"
        >
          +
        </button>
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

function getCategoryDescription(key: keyof typeof SUGGESTIONS): string {
  const descriptions = {
    saude: "Engloba seu bem-estar físico e mental. Inclui exercícios regulares, alimentação equilibrada, qualidade do sono, gestão do estresse e cuidados preventivos com a saúde. Uma base sólida para todas as outras dimensões da vida.",
    
    conhecimento: "Refere-se ao desenvolvimento contínuo de habilidades técnicas e conhecimentos específicos da sua área de atuação. Inclui aprendizado formal, certificações, cursos e atualização profissional constante.",
    
    disciplina: "Capacidade de manter foco, consistência e autocontrole para alcançar objetivos. Envolve gestão do tempo, eliminação de distrações, criação de rotinas produtivas e perseverança diante dos desafios.",
    
    cultura: "Exposição e apreciação às artes, história, tradições e manifestações culturais diversas. Inclui visitas a museus, teatro, cinema, música, literatura e participação em eventos culturais que ampliam sua perspectiva.",
    
    leitura: "Hábito regular de leitura que expande vocabulário, conhecimento e capacidade de reflexão. Abrange diferentes gêneros literários, livros técnicos, artigos e publicações que contribuem para o crescimento pessoal e profissional.",
    
    inteligenciaEmocional: "Habilidade de reconhecer, compreender e gerenciar suas próprias emoções e as dos outros. Inclui autoconhecimento, empatia, comunicação eficaz, resolução de conflitos e resiliência emocional.",
    
    relacionamentos: "Qualidade das conexões pessoais e profissionais. Envolve família, amigos, colegas de trabalho, networking, comunicação assertiva, confiança mútua e capacidade de construir vínculos saudáveis e duradouros.",
    
    maturidadeProfissional: "Desenvolvimento de competências comportamentais no ambiente de trabalho. Inclui liderança, trabalho em equipe, ética profissional, adaptabilidade, pensamento estratégico e capacidade de tomar decisões assertivas.",
    
    visaoDeMundo: "Compreensão ampla sobre questões globais, diversidade cultural, política, economia e sociedade. Envolve pensamento crítico, abertura a diferentes perspectivas e consciência sobre seu papel como cidadão global.",
    
    dominioFinanceiro: "Gestão eficiente dos recursos financeiros pessoais. Inclui planejamento orçamentário, controle de gastos, investimentos, educação financeira, construção de patrimônio e preparação para o futuro financeiro."
  };
  
  return descriptions[key] || "Descrição não disponível.";
}

function getScoreColor(score: number): string {
  const roundedScore = Math.round(score);
  switch (roundedScore) {
    case 1: return "#EF4444"; // Vermelho
    case 2: return "#F97316"; // Laranja
    case 3: return "#EAB308"; // Amarelo
    case 4: return "#3B82F6"; // Azul
    case 5: return "#22C55E"; // Verde
    default: return "#6B7280"; // Cinza para scores 0 ou inválidos
  }
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
