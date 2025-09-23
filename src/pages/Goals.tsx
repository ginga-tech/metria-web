import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Metas Semanais (MVP)
 * - Lista com checkbox
 * - Progresso semanal
 * - Adicionar meta
 * Persistência local em localStorage (lb_goals)
 */

type Goal = { id: string; text: string; done: boolean };
interface GoalsState { weekId: string; items: Goal[] }

function getWeekId(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // 1..7 (Mon..Sun)
  date.setUTCDate(date.getUTCDate() + 4 - dayNum); // Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
}

export default function Goals() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [state, setState] = useState<GoalsState>(() => {
    const cur = getWeekId();
    try {
      const raw = localStorage.getItem("lb_goals");
      if (raw) {
        const parsed = JSON.parse(raw) as GoalsState;
        if (parsed && parsed.weekId === cur) return parsed;
        if (parsed && Array.isArray(parsed.items)) {
          // carry items, reset done for new week
          return { weekId: cur, items: parsed.items.map((g) => ({ ...g, done: false })) };
        }
      }
    } catch {}
    return { weekId: cur, items: [] };
  });

  useEffect(() => {
    try { localStorage.setItem("lb_goals", JSON.stringify(state)); } catch {}
  }, [state]);

  const stats = useMemo(() => {
    const total = state.items.length;
    const done = state.items.filter((g) => g.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [state.items]);

  function addGoal() {
    const t = text.trim();
    if (!t) return;
    const g: Goal = { id: Math.random().toString(36).slice(2), text: t, done: false };
    setState((s) => ({ ...s, items: [g, ...s.items] }));
    setText("");
  }

  function toggle(id: string) {
    setState((s) => ({ ...s, items: s.items.map((g) => g.id === id ? { ...g, done: !g.done } : g) }));
  }

  function remove(id: string) {
    setState((s) => ({ ...s, items: s.items.filter((g) => g.id !== id) }));
  }

  function clearCompleted() {
    setState((s) => ({ ...s, items: s.items.filter((g) => !g.done) }));
  }

  function resetWeek() {
    const cur = getWeekId();
    setState((s) => ({ weekId: cur, items: s.items.map((g) => ({ ...g, done: false })) }));
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#41B36E]" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">Metas Semanais</h1>
          </div>
          <p className="text-[#2F6C92]/80 mt-1">Semana {state.weekId} • {stats.done}/{stats.total} concluídas</p>
        </header>

        {/* Progresso */}
        <div className="rounded-2xl bg-white p-4 shadow mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#2F6C92]/80">Progresso</span>
            <span className="text-sm font-medium text-[#2F6C92]">{stats.pct}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#2F6C92]/10 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-[#41B36E] to-[#2F6C92]"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        {/* Adicionar */}
        <div className="rounded-2xl bg-white p-4 shadow mb-4">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
              className="flex-1 h-11 rounded-xl border border-[#2F6C92]/20 px-3 outline-none focus:ring-2 focus:ring-[#41B36E]"
              placeholder="Descreva sua nova meta semanal"
            />
            <button
              onClick={addGoal}
              className="h-11 px-4 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95"
            >
              Adicionar meta
            </button>
          </div>
        </div>

        {/* Lista */}
        <section className="rounded-2xl bg-white p-2 sm:p-4 shadow">
          {state.items.length === 0 ? (
            <p className="text-sm text-[#2F6C92]/70">Nenhuma meta ainda. Comece adicionando uma acima.</p>
          ) : (
            <ul className="divide-y divide-[#2F6C92]/10">
              {state.items.map((g) => (
                <li key={g.id} className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={g.done}
                    onChange={() => toggle(g.id)}
                    className="h-5 w-5 rounded border-[#2F6C92]/30 text-[#41B36E] focus:ring-[#41B36E]"
                  />
                  <span className={g.done ? "flex-1 text-[#2F6C92]/60 line-through" : "flex-1 text-[#2F6C92]"}>
                    {g.text}
                  </span>
                  <button
                    onClick={() => remove(g.id)}
                    className="text-sm text-[#2F6C92]/60 hover:text-[#2F6C92]"
                    aria-label="Remover"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Ações de lista */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button onClick={clearCompleted} className="h-10 px-3 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] hover:bg-[#F3F4F6]">Limpar concluídas</button>
            <button onClick={resetWeek} className="h-10 px-3 rounded-xl border border-[#F96B11]/30 text-[#F96B11] hover:bg-[#F96B11]/10">Reiniciar semana</button>
            <button onClick={() => navigate('/dashboard')} className="h-10 px-3 rounded-xl bg-[#2F6C92] text-white hover:brightness-95">Voltar ao Dashboard</button>
          </div>
        </section>
      </div>
    </div>
  );
}
