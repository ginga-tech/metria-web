const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lb_token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

export type SubscriptionInfo = {
  active: boolean;
  plan?: 'monthly' | 'annual' | string;
  renewsAtUtc?: string | null;
};

export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  if (!API_BASE) {
    return { active: false };
  }
  const r = await fetch(`${API_BASE}/api/billing/subscription`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) return { active: false };
  return r.json();
}

export async function createCheckoutSession(plan: 'monthly' | 'annual'): Promise<{ url: string }> {
  if (!API_BASE) throw new Error('API base URL nao configurada');
  const successUrl = `${window.location.origin}/dashboard?checkout=success`;
  const cancelUrl = `${window.location.origin}/dashboard?checkout=cancel`;
  const r = await fetch(`${API_BASE}/api/billing/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan, successUrl, cancelUrl }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || 'Falha ao iniciar checkout');
  }
  return r.json();
}

export async function createCustomerPortal(): Promise<{ url: string }> {
  if (!API_BASE) throw new Error('API base URL nao configurada');
  const returnUrl = `${window.location.origin}/dashboard`;
  const r = await fetch(`${API_BASE}/api/billing/portal`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ returnUrl }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || 'Falha ao abrir portal do cliente');
  }
  return r.json();
}

export async function syncSubscription(payload?: {
  email?: string;
  subscriptionId?: string;
  customerId?: string;
  checkoutSessionId?: string;
}): Promise<{ ok: boolean; subId?: string; status?: string; plan?: string }> {
  if (!API_BASE) throw new Error('API base URL nao configurada');

  const r = await fetch(`${API_BASE}/api/billing/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload ?? {}),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || 'Falha ao sincronizar assinatura');
  }

  return r.json();
}

export type SubscriptionRecord = {
  id?: string;
  provider?: string | null;
  status: string;
  plan?: string | null;
  startedAtUtc?: string | null;
  currentPeriodStartUtc?: string | null;
  currentPeriodEndUtc?: string | null;
  canceledAtUtc?: string | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

export async function getSubscriptions(): Promise<SubscriptionRecord[]> {
  if (!API_BASE) return [];
  const r = await fetch(`${API_BASE}/api/billing/subscriptions/history`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) return [];
  const raw = await r.json();
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any, idx: number) => ({
    id: String(idx + 1),
    provider: s.provider ?? null,
    plan: s.plan ?? null,
    status: s.status ?? 'unknown',
    startedAtUtc: s.startedAtUtc ?? null,
    currentPeriodStartUtc: s.currentPeriodStartUtc ?? null,
    currentPeriodEndUtc: s.currentPeriodEndUtc ?? null,
    canceledAtUtc: s.canceledAtUtc ?? null,
    createdAtUtc: s.createdAtUtc ?? null,
    updatedAtUtc: s.updatedAtUtc ?? null,
  }));
}

// Legacy helpers kept for compatibility (unused in current paywall flow)
export function getPaymentLinkUrl(): string | undefined {
  return import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL as string | undefined;
}

export function getMonthlyPaymentLinkUrl(): string | undefined {
  return import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL_MONTHLY as string | undefined;
}

export function getAnnualPaymentLinkUrl(): string | undefined {
  return import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL_ANNUAL as string | undefined;
}