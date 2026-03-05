import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import PageLoader from "../components/PageLoader";
import { useUser } from "../hooks/useUser";
import { getPreferredFirstName } from "../utils/userDisplay";
import { createGoal, updateGoal, deleteGoal, getGoals } from "../services/goalsService";
import UpgradeModal from "../components/UpgradeModal";
import { 
  getSubscriptionStatus, 
  createCheckoutSession,
  syncSubscription,
  type SubscriptionInfo,
} from "../services/billingService";
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
  isActive?: boolean;
  updatedAtUtc?: string;
  updatedBy?: string;
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
  const ACTIVE_GOALS_PAGE_SIZE = 10;
  const navigate = useNavigate();
  const { user } = useUser();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [goalsView, setGoalsView] = useState<"period" | "all_active">("period");
  const [activeGoalsPage, setActiveGoalsPage] = useState(1);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean>(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [checkoutStatusMessage, setCheckoutStatusMessage] = useState("Aguardando confirmacao do pagamento...");
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [lastPlan, setLastPlan] = useState<'monthly' | 'annual' | null>(null);
  const [showFreeBanner, setShowFreeBanner] = useState(true);
  const [subscriptionSuccessModal, setSubscriptionSuccessModal] = useState<{
    planLabel: string;
    validUntilLabel: string;
  } | null>(null);

  useEffect(() => {
    if (!subscriptionSuccessModal) return;
    const timer = window.setTimeout(() => {
      setSubscriptionSuccessModal(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [subscriptionSuccessModal]);

  function getPlanLabel(plan?: string | null) {
    const normalized = (plan || "").toLowerCase();
    if (normalized === "annual") return "Anual";
    if (normalized === "monthly") return "Mensal";
    return "Ativo";
  }

  function getValidUntilLabel(renewsAtUtc?: string | null) {
    if (!renewsAtUtc) return "data não informada";
    const date = new Date(renewsAtUtc);
    if (Number.isNaN(date.getTime())) return "data não informada";
    return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }

  function showSubscriptionSuccess(info?: SubscriptionInfo | null) {
    setSubscriptionSuccessModal({
      planLabel: getPlanLabel(info?.plan),
      validUntilLabel: getValidUntilLabel(info?.renewsAtUtc),
    });
  }

  function openCenteredPopup(url: string, title: string, w = 520, h = 720) {
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
    const width = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
    const height = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;
    const systemZoom = width / screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft;
    const top = (height - h) / 2 / systemZoom + dualScreenTop;
    const specs = `scrollbars=yes, width=${w}, height=${h}, top=${top}, left=${left}`;
    const newWindow = window.open(url, title, specs);
    if (newWindow && newWindow.focus) newWindow.focus();
    return newWindow;
  }

  async function pollSubscriptionUntilActive(
    popup: Window | null,
    timeoutMs = 10 * 60 * 1000,
    intervalMs = 3000,
    postCloseGraceMs = 20 * 1000
  ) {
    if (!popup) {
      setUpgradeError("Nao foi possivel abrir o popup de pagamento. Habilite popups e tente novamente.");
      setIsCheckingSubscription(false);
      return;
    }

    setCheckoutStatusMessage("Aguardando confirmacao do pagamento...");
    setIsCheckingSubscription(true);
    try { sessionStorage.setItem("lb_checkout_polling", "1"); } catch { /* ignore */ }

    const start = Date.now();
    let closedAt: number | null = null;
    let checkoutSessionId: string | null = null;
    let attempts = 0;
    let checkoutStatus: "pending" | "success" | "cancel" = "pending";
    let done = false;
    let timer: number | null = null;
    let resolvePromise: (() => void) | null = null;

    const cleanup = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      window.removeEventListener("message", onCheckoutMessage);
      setIsCheckingSubscription(false);
      try { sessionStorage.removeItem("lb_checkout_polling"); } catch { /* ignore */ }
    };

    const finish = (status: "success" | "cancel" | "timeout" | "closed") => {
      if (done) return;
      done = true;
      cleanup();
      if (resolvePromise) {
        resolvePromise();
        resolvePromise = null;
      }

      if (status === "success") {
        setSubscriptionActive(true);
        setShowUpgrade(false);
        return;
      }

      if (status === "cancel") {
        setUpgradeError("Pagamento cancelado. Voce continua no plano gratuito e pode tentar novamente.");
        return;
      }

      if (status === "closed") {
        setUpgradeError("Pagamento nao confirmado. Feche o popup e tente novamente quando quiser.");
        return;
      }

      setUpgradeError("Pagamento nao foi confirmado dentro do tempo esperado. Tente novamente.");
    };

    const onCheckoutMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = (e.data ?? {}) as { type?: string; status?: string; checkoutSessionId?: string | null };
      if (data.type !== "lb:checkout") return;

      if (data.checkoutSessionId) {
        checkoutSessionId = data.checkoutSessionId;
      }

      if (data.status === "cancel") {
        checkoutStatus = "cancel";
        try { if (popup && !popup.closed) popup.close(); } catch { /* ignore */ }
        finish("cancel");
      } else if (data.status === "success") {
        checkoutStatus = "success";
        setCheckoutStatusMessage("Sincronizando assinatura...");
      }
    };

    window.addEventListener("message", onCheckoutMessage);

    return new Promise<void>((resolve) => {
      resolvePromise = resolve;
      timer = window.setInterval(async () => {
        if (done) return;

        attempts++;
        const now = Date.now();

        if (popup) {
          try {
            const href = popup.location.href;
            if (href && href.startsWith(window.location.origin)) {
              if (href.includes("checkout=success")) {
                checkoutStatus = "success";
                try {
                  const callbackUrl = new URL(href);
                  checkoutSessionId = callbackUrl.searchParams.get("session_id");
                } catch {
                  // ignore
                }
                setCheckoutStatusMessage("Sincronizando assinatura...");
                try { popup.close(); } catch { /* ignore */ }
                closedAt = closedAt ?? now;
                popup = null;
              } else if (href.includes("checkout=cancel")) {
                checkoutStatus = "cancel";
                try { popup.close(); } catch { /* ignore */ }
                popup = null;
                finish("cancel");
                return;
              }
            }
          } catch {
            // CORS enquanto ainda estiver no dominio do Stripe
          }
        }

        if (popup && popup.closed) {
          closedAt = closedAt ?? now;
          popup = null;
          if (checkoutStatus !== "success") {
            setCheckoutStatusMessage("Verificando confirmacao do pagamento...");
          }
        }

        try {
          if (checkoutStatus === "success" || attempts % 2 === 0) {
            if (checkoutStatus === "success") {
              setCheckoutStatusMessage("Atualizando status do plano...");
            }
            try { await syncSubscription({ checkoutSessionId: checkoutSessionId || undefined }); } catch { /* ignore */ }
          }

          const info = await getSubscriptionStatus();
          if (info?.active) {
            showSubscriptionSuccess(info);
            try { if (popup && !popup.closed) popup.close(); } catch { /* ignore */ }
            finish("success");
            return;
          }
        } catch {
          // tenta novamente ate o timeout
        }

        const baseTimedOut = now - start > timeoutMs;
        const graceTimedOut = closedAt ? now - closedAt > postCloseGraceMs : false;

        if (baseTimedOut || (closedAt && graceTimedOut)) {
          if (checkoutStatus === "success") {
            finish("timeout");
          } else {
            finish("closed");
          }
        }
      }, intervalMs);
    });
  }
  
  const [state, setState] = useState<GoalsState>(() => {
    try {
      const raw = localStorage.getItem("lb_goals");
      if (raw) {
        const parsed = JSON.parse(raw) as GoalsState;
        if (parsed && parsed.currentPeriod && Array.isArray(parsed.items)) {
          const mapDateOnly = (s: string | undefined | null) => s ? (s.includes('T') ? s.split('T')[0] : s) : '';
          return {
            ...parsed,
            items: parsed.items.map((g) => ({
              ...g,
              startDate: mapDateOnly(g.startDate),
              endDate: mapDateOnly(g.endDate),
              isActive: g.isActive !== false,
            })),
          };
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
  const currentPeriodPluralLabel = currentPeriodInfo.label.endsWith('al')
    ? `${currentPeriodInfo.label.slice(0, -2)}ais`
    : `${currentPeriodInfo.label}s`;
  const periodDates = getPeriodDates(state.currentPeriod, state.customStartDate, state.customEndDate, state.periodOffset ?? 0);
  
  // Carrega todas as metas do backend ao entrar na tela
  useEffect(() => {
    const normalize = (p: string): GoalPeriod => {
      const period = (p || '').toLowerCase();
      console.log('🔄 Normalizando período:', p, '→', period);
      switch (period) {
        case 'weekly': return 'weekly';
        case 'monthly': return 'monthly';
        case 'quarterly': return 'quarterly';
        case 'semiannual': return 'semiannual';
        case 'annual': return 'annual';
        case 'custom': 
        default: 
          console.log('⚠️ Período não reconhecido, usando custom:', p);
          return 'custom';
      }
    };
    const dateOnly = (s: string | undefined | null): string => {
      if (!s) return '';
      const i = s.indexOf('T');
      return i >= 0 ? s.slice(0, i) : s;
    };
    (async () => {
      try {
        console.log('🔄 Carregando metas do backend...');
        const goals = await getGoals();
        console.log('📊 Metas recebidas do backend:', goals);
        
          const mapped: Goal[] = goals.map((g) => ({
            id: g.id,
            text: g.text,
            done: g.done,
            period: normalize(g.period),
            startDate: dateOnly(g.startDate),
            endDate: dateOnly(g.endDate),
            category: g.category,
            isActive: g.isActive !== false,
            updatedAtUtc: g.updatedAtUtc,
            updatedBy: g.updatedBy,
          }));
        
        console.log('🔄 Metas mapeadas:', mapped);
        setState((s) => ({ ...s, items: mapped }));
        console.log('✅ Metas carregadas no estado');
      } catch (err) {
        console.error('❌ Erro ao carregar metas:', err);
      }
    })();
  }, []);

  // Carrega status de assinatura
  useEffect(() => {
    (async () => {
      try {
        const info = await getSubscriptionStatus();
        setSubscriptionActive(!!info.active);
      } catch {
        setSubscriptionActive(false);
      }
    })();
  }, []);

  const currentPeriodGoals = useMemo(() => {
    console.log('🔍 Filtrando metas para o período atual:');
    console.log('- Período atual:', state.currentPeriod);
    console.log('- Datas do período:', periodDates);
    console.log('- Total de metas no estado:', state.items.length);
    console.log('- Todas as metas:', state.items);
    
    // CORREÇÃO TEMPORÁRIA: Mostrar todas as metas do período, independente das datas exatas
    const filtered = state.items
      .filter((goal) => goal.isActive !== false)
      .filter((goal) => {
        const periodMatch = goal.period === state.currentPeriod;
        console.log(`Meta "${goal.text}": período ${goal.period} === ${state.currentPeriod}? ${periodMatch}`);
        
        if (!periodMatch) return false;
        
        // Para período custom, sempre mostrar
        if (state.currentPeriod === 'custom') return true;
        
        // TEMPORÁRIO: Para outros períodos, mostrar todas as metas do período
        // (ignorando verificação exata de datas por enquanto)
        console.log(`Meta "${goal.text}": aprovada por período ${goal.period}`);
        return true;
      })
      .filter((goal) => {
        const categoryMatch = !filterCategory || goal.category === filterCategory;
        console.log(`Meta "${goal.text}": categoria ${goal.category} match? ${categoryMatch}`);
        return categoryMatch;
      });
    
    console.log('📊 Metas filtradas:', filtered);
    return filtered;
  }, [state.items, state.currentPeriod, periodDates, filterCategory]);

  const activeGoalsAll = useMemo(() => {
    return state.items
      .filter((goal) => goal.isActive !== false)
      .filter((goal) => !filterCategory || goal.category === filterCategory)
      .sort((a, b) => {
        const aTime = Date.parse(a.updatedAtUtc || a.endDate || a.startDate || "");
        const bTime = Date.parse(b.updatedAtUtc || b.endDate || b.startDate || "");
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });
  }, [state.items, filterCategory]);

  const totalActiveGoalsPages = Math.max(1, Math.ceil(activeGoalsAll.length / ACTIVE_GOALS_PAGE_SIZE));
  const safeActiveGoalsPage = Math.min(activeGoalsPage, totalActiveGoalsPages);

  useEffect(() => {
    setActiveGoalsPage(1);
  }, [goalsView, filterCategory]);

  useEffect(() => {
    if (activeGoalsPage > totalActiveGoalsPages) {
      setActiveGoalsPage(totalActiveGoalsPages);
    }
  }, [activeGoalsPage, totalActiveGoalsPages]);

  const paginatedActiveGoals = useMemo(() => {
    const start = (safeActiveGoalsPage - 1) * ACTIVE_GOALS_PAGE_SIZE;
    const end = start + ACTIVE_GOALS_PAGE_SIZE;
    return activeGoalsAll.slice(start, end);
  }, [activeGoalsAll, safeActiveGoalsPage, ACTIVE_GOALS_PAGE_SIZE]);

  const displayedGoals = goalsView === "all_active" ? paginatedActiveGoals : currentPeriodGoals;

  const stats = useMemo(() => {
    const total = displayedGoals.length;
    const done = displayedGoals.filter((g) => g.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [displayedGoals]);

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
    // Paywall simples: limite de 5 metas ativas no plano gratuito
    const FREE_LIMIT = 5;
    const totalGoals = state.items.filter(g => g.isActive !== false).length;
    if (!subscriptionActive && totalGoals >= FREE_LIMIT) {
      setShowUpgrade(true);
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
        startDate: dates.start,
        endDate: dates.end,
        category: newGoal.category ?? category,
        isActive: true
      };
      
      setState((s) => ({ ...s, items: [localGoal, ...s.items] }));
      setText("");
      setCategory("");
    } catch (error: any) {
      console.error('Erro ao criar meta:', error);
      alert(error?.message || 'Erro ao criar meta. Tente novamente.');
    }
  }

  async function startCheckoutFlow(plan: "monthly" | "annual") {
    const { url } = await createCheckoutSession(plan);
    const popup = openCenteredPopup(url, plan === "annual" ? "Assinatura Anual" : "Assinatura Mensal");
    await pollSubscriptionUntilActive(popup);
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
    const prevItems = state.items;
    // Remove locally first (optimistic update)
    setState((s) => ({ 
      ...s, 
      items: s.items.filter((g) => g.id !== id)
    }));
    // Call DELETE endpoint on backend
    deleteGoal(id).catch((err) => {
      console.error('Erro ao remover meta:', err);
      // revert on error
      setState((s) => ({ ...s, items: prevItems }));
      alert('Falha ao remover meta. Tente novamente.');
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
                  Olá, <span className="font-semibold text-[#2F6C92]">{getPreferredFirstName(user?.name, user?.email)}</span>! 
                  Defina e acompanhe suas metas de vida.
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} userName={user?.name} />
          </div>
        </header>

        {/* Aviso de plano gratuito (sem assinatura ativa) - versão alerta */}
        {!subscriptionActive && showFreeBanner && (
          <div
            className="relative mb-6 rounded-xl border border-[#F59E0B]/60 bg-[#F59E0B]/15 p-4 shadow-sm cursor-pointer"
            role="alert"
            aria-live="polite"
            onClick={() => setShowUpgrade(true)}
          >
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={(e) => { e.stopPropagation(); setShowFreeBanner(false); }}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7C2D12] hover:bg-black/10"
            >
              ×
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pr-10">
              <p className="text-sm text-[#7C2D12]">
                Você está no plano gratuito. É possível cadastrar até 5 metas. Para metas ilimitadas e recursos premium, faça sua assinatura.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#F59E0B] px-4 text-sm font-medium text-white hover:brightness-110 cursor-pointer"
              >
                Assinar agora
              </button>
            </div>
          </div>
        )}

        {/* ... */}

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
                } cursor-pointer hover:shadow-sm`}
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
                  className="px-4 py-2 rounded-lg bg-[#41B36E] text-white font-medium hover:brightness-110 disabled:opacity-50 cursor-pointer"
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
                  className="w-full h-10 rounded-xl border-2 border-[#41B36E] text-[#41B36E] hover:bg-[#41B36E] hover:text-white hover:brightness-110 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Limpar Concluídas
                </button>
                
                <button 
                  onClick={resetPeriod}
                  disabled={stats.total === 0}
                  className="w-full h-10 rounded-xl border-2 border-[#F96B11] text-[#F96B11] hover:bg-[#F96B11] hover:text-white hover:brightness-110 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Reiniciar Período
                </button>
                
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-[#2F6C92] to-[#1E5A7A] text-white hover:from-[#1E5A7A] hover:to-[#2F6C92] hover:brightness-110 transition-all duration-200 font-medium cursor-pointer"
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
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white font-semibold hover:from-[#10B981] hover:to-[#41B36E] hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#2F6C92] mb-4 flex items-center gap-2">
                <span style={{ color: currentPeriodInfo.color }}>{currentPeriodInfo.icon}</span>
                {goalsView === "all_active" ? "Todas as Metas Ativas" : `Metas ${currentPeriodPluralLabel}`}
              </h3>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Exibição:</label>
                  <select
                    value={goalsView}
                    onChange={(e) => setGoalsView(e.target.value as "period" | "all_active")}
                    className="h-10 w-full md:w-72 rounded-xl border border-gray-200 px-3 bg-white text-[#2F6C92] outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                  >
                    <option value="period">Metas do período atual</option>
                    <option value="all_active">Todas as metas ativas</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Filtrar por categoria:</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-10 w-full md:w-72 rounded-xl border border-gray-200 px-3 bg-white text-[#2F6C92] outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                  >
                    <option value="">Todas</option>
                    {SHARED_GOAL_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {goalsView === "all_active" && (
                <p className="mb-4 text-xs text-gray-500">
                  Exibindo metas ativas ordenadas pelas mais recentes (10 por página).
                </p>
              )}
               
              {displayedGoals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500 text-lg mb-2">Nenhuma meta encontrada</p>
                  <p className="text-gray-400 text-sm">
                    {goalsView === "all_active"
                      ? "Não há metas ativas para o filtro selecionado."
                      : `Comece adicionando sua primeira meta ${currentPeriodInfo.label.toLowerCase()}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedGoals.map((goal) => (
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
                        className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 cursor-pointer font-bold text-lg leading-none"
                        aria-label="Remover meta"
                        title="Remover meta"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {goalsView === "all_active" && activeGoalsAll.length > ACTIVE_GOALS_PAGE_SIZE && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-slate-50 p-3">
                  <p className="text-xs text-gray-600">
                    {(() => {
                      const start = (safeActiveGoalsPage - 1) * ACTIVE_GOALS_PAGE_SIZE + 1;
                      const end = Math.min(safeActiveGoalsPage * ACTIVE_GOALS_PAGE_SIZE, activeGoalsAll.length);
                      return `Mostrando ${start}-${end} de ${activeGoalsAll.length} metas ativas`;
                    })()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveGoalsPage((p) => Math.max(1, p - 1))}
                      disabled={safeActiveGoalsPage <= 1}
                      className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-[#2F6C92] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="min-w-[110px] text-center text-sm font-medium text-[#2F6C92]">
                      Página {safeActiveGoalsPage} de {totalActiveGoalsPages}
                    </span>
                    <button
                      onClick={() => setActiveGoalsPage((p) => Math.min(totalActiveGoalsPages, p + 1))}
                      disabled={safeActiveGoalsPage >= totalActiveGoalsPages}
                      className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-[#2F6C92] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal (paywall) */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          setUpgradeError(null);
        }}
        onChooseMonthly={async () => {
  try {
    setUpgradeError(null);
    setLastPlan('monthly');
    await startCheckoutFlow("monthly");
  } catch (e: any) {
    setUpgradeError(e?.message || 'Falha ao iniciar checkout mensal');
  }
}}
        onChooseAnnual={async () => {
  try {
    setUpgradeError(null);
    setLastPlan('annual');
    await startCheckoutFlow("annual");
  } catch (e: any) {
    setUpgradeError(e?.message || 'Falha ao iniciar checkout anual');
  }
}}
        monthlyPriceLabel="R$ 14,90/mês"
        annualPriceLabel="R$ 11,90/mês (cobrança anual)"
      
        disabled={isCheckingSubscription}
        errorMessage={upgradeError}
        onRetry={async () => {
          try {
            setUpgradeError(null);
            const plan = lastPlan === 'annual' ? 'annual' : 'monthly';
            await startCheckoutFlow(plan);
          } catch (e:any) {
            setUpgradeError(e?.message || 'Falha ao iniciar checkout');
          }
        }}/>

      {isCheckingSubscription && (
        <PageLoader overlay message={checkoutStatusMessage} />
      )}

      {subscriptionSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          <div className="relative w-full max-w-md rounded-2xl border border-[#41B36E]/30 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#2F6C92]">Assinatura confirmada</h3>
            <p className="mt-2 text-sm text-[#2F6C92]/85">
              Inscrição realizada com sucesso no plano <span className="font-semibold">{subscriptionSuccessModal.planLabel}</span>.
            </p>
            <p className="mt-1 text-sm text-[#2F6C92]/85">
              Válido até <span className="font-semibold">{subscriptionSuccessModal.validUntilLabel}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
