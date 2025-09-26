import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { createGoal, updateGoal, deleteGoal, getGoals } from "../services/goalsService";
import { GOAL_CATEGORIES as SHARED_GOAL_CATEGORIES } from "../constants/assessment";

/**
 * Sistema de Metas Completo
 * - Diferentes períodos: semanal, mensal, trimestral, semestral, anual, personalizado
 * - Design moderno similar ao Dashboard
 * - Progresso visual aprimorado
 * - Persistência local em localStorage
 */

type GoalPeriod = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';

type Goal = { 
  id: string; 
  text: string; 
  done: boolean; 
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  category?: string;
};

// Categorias baseadas nas dimensões do Assessment


interface GoalsState { 
  currentPeriod: GoalPeriod;
  items: Goal[];
  customStartDate?: string;
  customEndDate?: string;
  periodOffset?: number;
}

const GOAL_PERIODS = {
  weekly: { label: 'Semanal', icon: '📅', color: '#41B36E' },
  monthly: { label: 'Mensal', icon: '🗓️', color: '#2F6C92' },
  quarterly: { label: 'Trimestral', icon: '📊', color: '#8B5CF6' },
  semiannual: { label: 'Semestral', icon: '📋', color: '#F59E0B' },
  annual: { label: 'Anual', icon: '🎯', color: '#EF4444' },
  custom: { label: 'Personalizado', icon: '⚙️', color: '#6B7280' }
};

function getPeriodDates(
  period: GoalPeriod,
  customStartDate?: string,
  customEndDate?: string,
  offset: number = 0
): { start: string; end: string; label: string } {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  
  switch (period) {
    case 'weekly':
      {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(now.getDate() - daysToMonday + offset * 7);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
      }
      break;
    case 'monthly':
      start.setDate(1);
      start.setMonth(start.getMonth() + offset, 1);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    case 'quarterly':
      {
        const quarter = Math.floor(now.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setMonth(start.getMonth() + offset * 3, 1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 3, 0);
      }
      break;
    case 'semiannual':
      {
        const semester = now.getMonth() < 6 ? 0 : 1;
        start.setMonth(semester * 6, 1);
        start.setMonth(start.getMonth() + offset * 6, 1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 6, 0);
      }
      break;
    case 'annual':
      start.setMonth(0, 1);
      start.setFullYear(start.getFullYear() + offset);
      end = new Date(start);
      end.setMonth(11, 31);
      break;
    case 'custom':
      if (customStartDate) {
        start = new Date(customStartDate);
      }
      if (customEndDate) {
        end = new Date(customEndDate);
      } else {
        end.setFullYear(end.getFullYear() + 1);
      }
      break;
  }
  
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const label = `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  
  return { start: startStr, end: endStr, label };
}

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  
  const [state, setState] = useState<GoalsState>(() => {
    try {
      const raw = localStorage.getItem("lb_goals");
      if (raw) {
        const parsed = JSON.parse(raw) as GoalsState;
        if (parsed && parsed.currentPeriod && Array.isArray(parsed.items)) {
          return parsed;
        }
      }
    } catch {}
    return { 
      currentPeriod: 'weekly' as GoalPeriod, 
      items: [],
      customStartDate: undefined,
      customEndDate: undefined,
      periodOffset: 0
    };
  });

  useEffect(() => {
    try { 
      localStorage.setItem("lb_goals", JSON.stringify(state)); 
    } catch {}
  }, [state]);

  const currentPeriodInfo = GOAL_PERIODS[state.currentPeriod];
  const periodDates = getPeriodDates(state.currentPeriod, state.customStartDate, state.customEndDate, state.periodOffset ?? 0);
  
  // Carrega todas as metas do backend ao entrar na tela
  useEffect(() => {
    const normalize = (p: string): GoalPeriod => {
      switch ((p || '').toLowerCase()) {
        case 'weekly': return 'weekly';
        case 'monthly': return 'monthly';
        case 'quarterly': return 'quarterly';
        case 'semiannual': return 'semiannual';
        case 'annual': return 'annual';
        case 'custom': default: return 'custom';
      }
    };
    (async () => {
      try {
        const goals = await getGoals();
        const mapped: Goal[] = goals.map((g) => ({
          id: g.id,
          text: g.text,
          done: g.done,
          period: normalize(g.period),
          startDate: g.startDate,
          endDate: g.endDate,
          category: g.category,
        }));
        setState((s) => ({ ...s, items: mapped }));
      } catch (err) {
        console.error('Erro ao carregar metas:', err);
      }
    })();
  }, []);
  
  const currentPeriodGoals = useMemo(() => {
    return state.items
      .filter((goal) => {
        if (goal.period !== state.currentPeriod) return false;
        if (state.currentPeriod === 'custom') return true;
        return goal.startDate === periodDates.start && goal.endDate === periodDates.end;
      })
      .filter((goal) => !filterCategory || goal.category === filterCategory);
  }, [state.items, state.currentPeriod, periodDates, filterCategory]);

  const stats = useMemo(() => {
    const total = currentPeriodGoals.length;
    const done = currentPeriodGoals.filter((g) => g.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [currentPeriodGoals]);

  function changePeriod(newPeriod: GoalPeriod) {
    setState(s => ({ 
      ...s, 
      currentPeriod: newPeriod,
      customStartDate: newPeriod === 'custom' ? s.customStartDate : undefined,
      customEndDate: newPeriod === 'custom' ? s.customEndDate : undefined,
      periodOffset: 0
    }));
    if (newPeriod === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
    }
  }

  function applyCustomPeriod() {
    const start = customStartDate ? new Date(customStartDate) : null;
    const end = customEndDate ? new Date(customEndDate) : null;
    if (!start || !end) {
      alert('Informe a data inicial e a data final.');
      return;
    }
    if (start >= end) {
      alert('A data inicial deve ser anterior à data final.');
      return;
    }
    const maxDate = new Date(start);
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    if (end > maxDate) {
      alert('O período máximo é de 5 anos.');
      return;
    }
    setState((s) => ({ ...s, customStartDate: customStartDate, customEndDate: customEndDate }));
    setShowCustomDate(false);
  }

  async function addGoal() {
    const t = text.trim();
    if (!t) return;
    if (!category) {
      alert('Selecione uma categoria do Assessment para vincular sua meta.');
      return;
    }
    
    try {
      if (state.currentPeriod === 'custom' && (!state.customStartDate || !state.customEndDate)) {
        alert('Defina a data inicial e final para metas personalizadas.');
        return;
      }
      const dates = getPeriodDates(state.currentPeriod, state.customStartDate, state.customEndDate, state.periodOffset ?? 0);
      const newGoal = await createGoal({
        text: t,
        period: state.currentPeriod,
        startDate: dates.start,
        endDate: dates.end,
        category
      });
      
      // Convert API response to local format
      const localGoal: Goal = {
        id: newGoal.id,
        text: newGoal.text,
        done: newGoal.done,
        period: state.currentPeriod,
        startDate: newGoal.startDate,
        endDate: newGoal.endDate,
        category: newGoal.category ?? category
      };
      
      setState((s) => ({ ...s, items: [localGoal, ...s.items] }));
      setText("");
      setCategory("");
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      alert('Erro ao criar meta. Tente novamente.');
    }
  }

  function toggle(id: string) {
    setState((s) => ({ 
      ...s, 
      items: s.items.map((g) => g.id === id ? { ...g, done: !g.done } : g) 
    }));
    const goal = state.items.find(g => g.id === id);
    if (goal) {
      updateGoal(id, { done: !goal.done }).catch((err) => {
        console.error('Erro ao atualizar meta:', err);
        // revert on error
        setState((s) => ({ 
          ...s, 
          items: s.items.map((g) => g.id === id ? { ...g, done: goal.done } : g) 
        }));
      });
    }
  }

  function remove(id: string) {
    const prev = state.items;
    setState((s) => ({ ...s, items: s.items.filter((g) => g.id !== id) }));
    deleteGoal(id).catch((err) => {
      console.error('Erro ao remover meta:', err);
      // revert on error
      setState((s) => ({ ...s, items: prev }));
    });
  }

  function clearCompleted() {
    setState((s) => ({ 
      ...s, 
      items: s.items.filter((g) => !g.done || g.period !== s.currentPeriod) 
    }));
  }

  function resetPeriod() {
    const dates = getPeriodDates(state.currentPeriod, state.customStartDate, state.customEndDate, state.periodOffset ?? 0);
    setState((s) => ({ 
      ...s, 
      items: s.items.map((g) => 
        g.period === s.currentPeriod && g.startDate === dates.start && g.endDate === dates.end
          ? { ...g, done: false } 
          : g
      ) 
    }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2F6C92]">Minhas Metas</h1>
                <p className="text-[#2F6C92]/70 text-sm">
                  Olá, <span className="font-semibold text-[#2F6C92]">{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}</span>! 
                  Defina e acompanhe suas metas de vida.
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} />
          </div>
        </header>

        {/* Seletor de Período */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-[#2F6C92] mb-4 flex items-center gap-2">
            <span>📊</span> Período das Metas
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {Object.entries(GOAL_PERIODS).map(([key, info]) => (
              <button
                key={key}
                onClick={() => changePeriod(key as GoalPeriod)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  state.currentPeriod === key
                    ? 'border-[#41B36E] bg-[#41B36E]/10'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{info.icon}</span>
                <span className={`text-sm font-medium ${
                  state.currentPeriod === key ? 'text-[#41B36E]' : 'text-gray-600'
                }`}>
                  {info.label}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Date Selector */}
          {showCustomDate && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#2F6C92] mb-2">Data Inicial</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate || undefined}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-[#41B36E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2F6C92] mb-2">Data Final (máximo 5 anos)</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate || new Date().toISOString().split('T')[0]}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-[#41B36E]"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={applyCustomPeriod}
                  disabled={!customStartDate || !customEndDate}
                  className="px-4 py-2 rounded-lg bg-[#41B36E] text-white font-medium hover:brightness-95 disabled:opacity-50"
                >
                  Definir período
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[#41B36E]/10 to-[#2F6C92]/10 border border-[#41B36E]/20">
            <p className="text-sm font-medium text-[#2F6C92]">
              <span className="inline-flex items-center gap-1">
                {currentPeriodInfo.icon} Período Atual: {currentPeriodInfo.label}
              </span>
            </p>
            <p className="text-xs text-gray-600 mt-1">{periodDates.label}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2F6C92]">Progresso</h3>
                <span className="text-2xl font-bold text-[#41B36E]">{stats.pct}%</span>
              </div>
              
              <div className="space-y-3">
                <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-4 bg-gradient-to-r from-[#41B36E] to-[#10B981] transition-all duration-500"
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Concluídas: {stats.done}</span>
                  <span className="text-gray-600">Total: {stats.total}</span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#2F6C92] mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button 
                  onClick={clearCompleted}
                  disabled={stats.done === 0}
                  className="w-full h-10 rounded-xl border-2 border-[#41B36E] text-[#41B36E] hover:bg-[#41B36E] hover:text-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Limpar Concluídas
                </button>
                
                <button 
                  onClick={resetPeriod}
                  disabled={stats.total === 0}
                  className="w-full h-10 rounded-xl border-2 border-[#F96B11] text-[#F96B11] hover:bg-[#F96B11] hover:text-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reiniciar Período
                </button>
                
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-[#2F6C92] to-[#1E5A7A] text-white hover:from-[#1E5A7A] hover:to-[#2F6C92] transition-all duration-200 font-medium"
                >
                  ← Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Metas */}
          <div className="xl:col-span-2">
            {/* Adicionar Meta */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-lg font-bold text-[#2F6C92] mb-4 flex items-center gap-2">
                <span>➕</span> Nova Meta {currentPeriodInfo.label}
              </h3>
              
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                  placeholder={`Descreva sua nova meta`}
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 md:w-72 rounded-xl border border-gray-200 px-3 bg-white text-[#2F6C92] outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                >
                  <option value="">Selecione a categoria</option>
                  {SHARED_GOAL_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <button
                  onClick={addGoal}
                  disabled={!text.trim() || !category}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white font-semibold hover:from-[#10B981] hover:to-[#41B36E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#2F6C92] mb-4 flex items-center gap-2">
                <span style={{ color: currentPeriodInfo.color }}>{currentPeriodInfo.icon}</span>
                Metas {currentPeriodInfo.label}s
              </h3>
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm text-gray-600">Filtrar por categoria:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-10 md:w-72 rounded-xl border border-gray-200 px-3 bg-white text-[#2F6C92] outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                >
                  <option value="">Todas</option>
                  {SHARED_GOAL_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              
              {currentPeriodGoals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500 text-lg mb-2">Nenhuma meta definida ainda</p>
                  <p className="text-gray-400 text-sm">Comece adicionando sua primeira meta {currentPeriodInfo.label.toLowerCase()}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPeriodGoals.map((goal) => (
                    <div key={goal.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      goal.done 
                        ? 'border-[#41B36E]/30 bg-[#41B36E]/5' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={goal.done}
                        onChange={() => toggle(goal.id)}
                        className="h-5 w-5 rounded border-gray-300 text-[#41B36E] focus:ring-[#41B36E] focus:ring-offset-0"
                      />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className={`${
                        goal.done 
                          ? "text-gray-500 line-through" 
                          : "text-[#2F6C92] font-medium"
                        }`}>
                          {goal.text}
                        </span>
                        {goal.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-[#2F6C92]/10 text-[#2F6C92]">
                            {SHARED_GOAL_CATEGORIES.find(c => c.key === goal.category)?.label || goal.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => remove(goal.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                        aria-label="Remover meta"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
