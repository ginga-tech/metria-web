const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export type GoalPeriod = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';

export interface Goal {
  id: string;
  text: string;
  done: boolean;
  period: string;
  startDate: string;
  endDate: string;
  category?: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  updatedBy?: string;
  isActive?: boolean;
}

export interface CreateGoalRequest {
  text: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  category?: string;
}

export interface UpdateGoalRequest {
  done?: boolean;
  isActive?: boolean;
  updatedAtUtc?: string;
  updatedBy?: string;
}

export interface GetGoalsParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lb_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function periodToBackend(p: GoalPeriod): string {
  switch (p) {
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'semiannual': return 'Semiannual';
    case 'annual': return 'Annual';
    case 'custom': default: return 'Custom';
  }
}

export async function createGoal(request: CreateGoalRequest): Promise<Goal> {
  if (!API_BASE) throw new Error('API não configurada (VITE_API_BASE_URL ausente).');
  // Convert frontend period to backend enum format and format dates properly
  const backendRequest = {
    text: request.text,
    period: periodToBackend(request.period),
    startDate: new Date(request.startDate).toISOString(),
    endDate: new Date(request.endDate).toISOString(),
    category: request.category
  };

  const response = await fetch(`${API_BASE}/api/goals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(backendRequest),
  });

  if (!response.ok) {
    let msg: any = null;
    const ct = response.headers.get('content-type') || '';
    try { msg = ct.includes('application/json') ? await response.json() : await response.text(); } catch {}
    const details = typeof msg === 'string' ? msg : (msg?.message || msg?.title || JSON.stringify(msg));
    throw new Error(details || `Erro ${response.status} ao criar meta`);
  }

  return response.json();
}

export async function getGoals(params?: GetGoalsParams): Promise<Goal[]> {
  if (!API_BASE) throw new Error('API não configurada (VITE_API_BASE_URL ausente).');
  const searchParams = new URLSearchParams();
  
  if (params?.period) {
    searchParams.append('period', capitalizeFirst(params.period));
  }
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }

  const url = `${API_BASE}/api/goals${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      return []; // Nenhuma meta encontrada
    }
    let msg: any = null;
    const ct = response.headers.get('content-type') || '';
    try { msg = ct.includes('application/json') ? await response.json() : await response.text(); } catch {}
    const details = typeof msg === 'string' ? msg : (msg?.message || msg?.title || JSON.stringify(msg));
    throw new Error(details || `Erro ${response.status} ao buscar metas`);
  }

  return response.json();
}

export async function updateGoal(id: string, request: UpdateGoalRequest): Promise<Goal> {
  if (!API_BASE) throw new Error('API não configurada (VITE_API_BASE_URL ausente).');
  const response = await fetch(`${API_BASE}/api/goals/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let msg: any = null;
    const ct = response.headers.get('content-type') || '';
    try { msg = ct.includes('application/json') ? await response.json() : await response.text(); } catch {}
    const details = typeof msg === 'string' ? msg : (msg?.message || msg?.title || JSON.stringify(msg));
    throw new Error(details || `Erro ${response.status} ao atualizar meta`);
  }

  return response.json();
}

export async function deleteGoal(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/goals/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Erro ${response.status} ao remover meta`);
  }
}

// Utility functions
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getPeriodDates(period: GoalPeriod, customEndDate?: string): { start: string; end: string; label: string } {
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

// Legacy function for backward compatibility (if needed)
export function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // 1..7 (Mon..Sun)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}
