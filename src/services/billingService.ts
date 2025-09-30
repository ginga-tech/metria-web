const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lb_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
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

export async function createCheckoutSession(priceId: string): Promise<{ url: string }> {
  if (!API_BASE) throw new Error('API base URL não configurada');
  const successUrl = `${window.location.origin}/dashboard?checkout=success`;
  const cancelUrl = `${window.location.origin}/dashboard?checkout=cancel`;
  const r = await fetch(`${API_BASE}/api/billing/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ priceId, successUrl, cancelUrl }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || 'Falha ao iniciar checkout');
  }
  return r.json();
}

export async function createCustomerPortal(): Promise<{ url: string }> {
  if (!API_BASE) throw new Error('API base URL não configurada');
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

// Optional: Payment Link shortcut (single URL that contains both plans)
export function getPaymentLinkUrl(): string | undefined {
  // When set, front can redirect directly without creating a Checkout Session
  return import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL as string | undefined;
}

// Preferred: separate links for each plan
export function getMonthlyPaymentLinkUrl(): string | undefined {
  return import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL_MONTHLY as string | undefined;
}

export function getAnnualPaymentLinkUrl(): string | undefined {
  return import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL_ANNUAL as string | undefined;
}
