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

/**
 * LifeBalance – Dashboard (MVP)
 * - Lê o último assessment do backend (/api/assessment/latest) com Bearer Token
 * - Fallback: lê do localStorage ("lb_assessment")
 * - Exibe Radar Chart 0–5 (10 dimensões), forças e áreas de atenção
 * - Paleta: Azul #2F6C92 | Verde #41B36E | Laranja #F96B11 | Cinza #F3F4F6 | Branco #FFFFFF
 */

type Scores = Record<string, number>; // { saude: 3, conhecimento: 4, ... }

interface AssessmentDto {
  scores: Scores;
  average: number;
  createdAtUtc: string;
}

const DIMENSIONS: { key: keyof Scores; label: string }[] = [
  { key: "saude", label: "Saúde" },
  { key: "conhecimento", label: "Conhecimento" },
  { key: "disciplina", label: "Disciplina e Foco" },
  { key: "cultura", label: "Cultura Geral" },
  { key: "leitura", label: "Leitura" },
  { key: "inteligenciaEmocional", label: "Inteligência Emocional" },
  { key: "relacionamentos", label: "Relacionamentos" },
  { key: "maturidadeProfissional", label: "Maturidade Profissional" },
  { key: "visaoDeMundo", label: "Visão de Mundo" },
  { key: "dominioFinanceiro", label: "Domínio Financeiro" },
];

export default function Dashboard() {
  const navigate = useNavigate();
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
            // Sem avaliação no backend, tenta localStorage
            const local = readLocalAssessment();
            if (mounted) setData(local);
          } else {
            throw new Error(`Erro ${r.status} ao buscar assessment`);
          }
        } else {
          // Fallback local
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
    }));
  }, [data]);

  const strengths = useMemo(() => {
    if (!data?.scores) return [] as { label: string; score: number }[];
    return DIMENSIONS
      .map((d) => ({ label: d.label, score: data.scores[d.key] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [data]);

  const weaknesses = useMemo(() => {
    if (!data?.scores) return [] as { label: string; score: number }[];
    return DIMENSIONS
      .map((d) => ({ label: d.label, score: data.scores[d.key] ?? 0 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [data]);

  const when = useMemo(() => {
    if (!data?.createdAtUtc) return "—";
    try {
      const d = new Date(data.createdAtUtc);
      return d.toLocaleString();
    } catch {
      return data.createdAtUtc;
    }
  }, [data]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#F96B11]" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">Dashboard</h1>
          </div>
          <p className="text-[#2F6C92]/80 mt-1">Última avaliação: <span className="font-medium text-[#2F6C92]">{when}</span></p>
        </header>

        {error && (
          <div className="mb-4 rounded-xl bg-white border border-red-200 text-red-700 p-4">
            {error}
          </div>
        )}

        {/* Grid principal */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Radar Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-4 shadow">
            <h2 className="text-lg font-semibold text-[#2F6C92] mb-2">Equilíbrio de Vida (10 dimensões)</h2>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius={140}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: "#2F6C92", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: "#2F6C92", fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${v}/5`} />
                  <Radar name="Você" dataKey="score" stroke="#2F6C92" fill="#41B36E" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forças / Atenção */}
          <div className="rounded-2xl bg-white p-4 shadow">
            <h2 className="text-lg font-semibold text-[#2F6C92] mb-3">Insights</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-[#41B36E] mb-2">💪 Pontos fortes</h3>
                <ul className="space-y-1">
                  {strengths.map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-sm">
                      <span className="text-[#2F6C92]">{s.label}</span>
                      <span className="px-2 py-0.5 rounded bg-[#41B36E]/10 text-[#41B36E] font-semibold">{s.score}/5</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#F96B11] mb-2">⚠️ Áreas de atenção</h3>
                <ul className="space-y-1">
                  {weaknesses.map((w) => (
                    <li key={w.label} className="flex items-center justify-between text-sm">
                      <span className="text-[#2F6C92]">{w.label}</span>
                      <span className="px-2 py-0.5 rounded bg-[#F96B11]/10 text-[#F96B11] font-semibold">{w.score}/5</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={() => navigate("/assessment")} className="h-11 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] hover:bg-[#F3F4F6]">Refazer avaliação</button>
              <button onClick={() => navigate("/goals")} className="h-11 rounded-xl bg-[#41B36E] text-white hover:brightness-95">Gerar metas semanais</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow">
        <div className="h-5 w-48 bg-[#F3F4F6] rounded mb-4" />
        <div className="h-72 w-full bg-[#F3F4F6] rounded" />
        <div className="mt-4 h-4 w-1/2 bg-[#F3F4F6] rounded" />
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
