const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export interface Goal {
  id: string;
  text: string;
  done: boolean;
  weekId: string;
  createdAtUtc: string;
}

export interface CreateGoalRequest {
  text: string;
  weekId: string;
}

export interface UpdateGoalRequest {
  done: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lb_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function createGoal(request: CreateGoalRequest): Promise<Goal> {
  const response = await fetch(`${API_BASE}/api/goals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Erro ${response.status} ao criar meta`);
  }

  return response.json();
}

export async function getGoalsByWeek(weekId: string): Promise<Goal[]> {
  const response = await fetch(`${API_BASE}/api/goals/week/${encodeURIComponent(weekId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      return []; // Nenhuma meta encontrada para esta semana
    }
    const error = await response.text();
    throw new Error(error || `Erro ${response.status} ao buscar metas`);
  }

  return response.json();
}

export async function updateGoal(id: string, request: UpdateGoalRequest): Promise<Goal> {
  const response = await fetch(`${API_BASE}/api/goals/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Erro ${response.status} ao atualizar meta`);
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

// Função utilitária para calcular o ID da semana (ISO week)
export function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // 1..7 (Mon..Sun)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}
