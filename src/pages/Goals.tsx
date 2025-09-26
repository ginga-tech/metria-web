import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { createGoal, updateGoal, deleteGoal } from "../services/goalsService";

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

interface GoalsState { 
  currentPeriod: GoalPeriod;
  items: Goal[];
  customEndDate?: string;
}

const GOAL_PERIODS = {
  weekly: { label: 'Semanal', icon: '📅', color: '#41B36E' },
  monthly: { label: 'Mensal', icon: '🗓️', color: '#2F6C92' },
  quarterly: { label: 'Trimestral', icon: '📊', color: '#8B5CF6' },
  semiannual: { label: 'Semestral', icon: '📈', color: '#F59E0B' },
  annual: { label: 'Anual', icon: '🎯', color: '#EF4444' },
  custom: { label: 'Personalizado', icon: '⚙️', color: '#6B7280' }
};

function getPeriodDates(period: GoalPeriod, customEndDate?: string): { start: string; end: string; label: string } {
  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);
  
  switch (period) {
    case 'weekly':
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(now.getDate() - daysToMonday);
      end.setDate(start.getDate() + 6);
      break;
    case 'monthly':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      break;
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      end.setMonth(quarter * 3 + 3, 0);
      break;
    case 'semiannual':
      const semester = now.getMonth() < 6 ? 0 : 1;
      start.setMonth(semester * 6, 1);
      end.setMonth(semester * 6 + 6, 0);
      break;
    case 'annual':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    case 'custom':
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
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customEndDate, setCustomEndDate] = useState("");
  
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
      customEndDate: undefined
    };
  });

  useEffect(() => {
    try { 
      localStorage.setItem("lb_goals", JSON.stringify(state)); 
    } catch {}
  }, [state]);

  const currentPeriodInfo = GOAL_PERIODS[state.currentPeriod];
  const periodDates = getPeriodDates(state.currentPeriod, state.customEndDate);
  
  const currentPeriodGoals = useMemo(() => {
    return state.items.filter(goal => 
      goal.period === state.currentPeriod &&
      goal.startDate === periodDates.start &&
      goal.endDate === periodDates.end
    );
  }, [state.items, state.currentPeriod, periodDates]);

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
      customEndDate: newPeriod === 'custom' ? s.customEndDate : undefined
    }));
    if (newPeriod === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
    }
  }

  function setCustomPeriodEnd(endDate: string) {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    const selectedDate = new Date(endDate);
    
    if (selectedDate > maxDate) {
      alert('O período máximo é de 5 anos.');
      return;
    }
    
    setState(s => ({ ...s, customEndDate: endDate }));
    setCustomEndDate(endDate);
    setShowCustomDate(false);
  }

  async function addGoal() {
    const t = text.trim();
    if (!t) return;
    
    try {
      const dates = getPeriodDates(state.currentPeriod, state.customEndDate);
      const newGoal = await createGoal({
        text: t,
        period: state.currentPeriod,
        startDate: dates.start,
        endDate: dates.end
      });
      
      // Convert API response to local format
      const localGoal: Goal = {
        id: newGoal.id,
        text: newGoal.text,
        done: newGoal.done,
        period: state.currentPeriod,
        startDate: newGoal.startDate,
        endDate: newGoal.endDate,
        category: newGoal.category
      };
      
      setState((s) => ({ ...s, items: [localGoal, ...s.items] }));
      setText("");
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
  }

  function remove(id: string) {
    setState((s) => ({ 
      ...s, 
      items: s.items.filter((g) => g.id !== id) 
    }));
  }

  function clearCompleted() {
    setState((s) => ({ 
      ...s, 
      items: s.items.filter((g) => !g.done || g.period !== s.currentPeriod) 
    }));
  }

  function resetPeriod() {
    const dates = getPeriodDates(state.currentPeriod, state.customEndDate);
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
              <label className="block text-sm font-semibold text-[#2F6C92] mb-2">
                Data Final (máximo 5 anos)
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="flex-1 h-10 rounded-lg border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-[#41B36E]"
                />
                <button
                  onClick={() => setCustomPeriodEnd(customEndDate)}
                  disabled={!customEndDate}
                  className="px-4 py-2 rounded-lg bg-[#41B36E] text-white font-medium hover:brightness-95 disabled:opacity-50"
                >
                  Definir
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
              
              <div className="flex gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                  placeholder={`Descreva sua nova meta ${currentPeriodInfo.label.toLowerCase()}`}
                />
                <button
                  onClick={addGoal}
                  disabled={!text.trim()}
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
                      <span className={`flex-1 ${
                        goal.done 
                          ? "text-gray-500 line-through" 
                          : "text-[#2F6C92] font-medium"
                      }`}>
                        {goal.text}
                      </span>
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
