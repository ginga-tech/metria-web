const API = import.meta.env.VITE_API_BASE_URL;

export type LoginDto = { email: string; password: string };
export type SignupDto = { name: string; email: string; password: string };

export async function login(dto: LoginDto) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!r.ok) await handleError(r);
  return r.json() as Promise<{ token: string; expiresInSeconds: number }>;
}

export async function signup(dto: SignupDto) {
  const r = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!r.ok) await handleError(r);
  return r.json() as Promise<{ token: string; expiresInSeconds: number }>;
}

export function startGoogleLogin(redirectUri?: string) {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  const target = redirectUri || `${window.location.origin}/oauth/callback`;
  // Redirect the browser to backend OAuth start endpoint
  window.location.href = `${API}/api/auth/google/start?redirectUri=${encodeURIComponent(target)}`;
}

export async function exchangeGoogleCode(code: string, redirectUri?: string) {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  const target = redirectUri || `${window.location.origin}/oauth/callback`;
  // Try GET first
  let r = await fetch(`${API}/api/auth/google/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(target)}`);
  if (!r.ok) {
    // Fallback to POST if backend expects it
    r = await fetch(`${API}/api/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri: target })
    });
  }
  if (!r.ok) await handleError(r);
  return (await r.json()) as { token: string; expiresInSeconds?: number };
}
export async function forgotPassword(email: string) {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  const r = await fetch(`${API}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!r.ok) await handleError(r);
  return r.json() as Promise<{ message: string }>;
}

export async function validateResetToken(token: string) {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  const r = await fetch(`${API}/api/auth/validate-reset-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!r.ok) await handleError(r);
  return r.json() as Promise<{ valid: boolean }>;
}

export async function resetPassword(token: string, newPassword: string) {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  const r = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!r.ok) await handleError(r);
  return r.json() as Promise<{ message: string }>;
}

async function handleError(r: Response) {
  let msg = `Erro ${r.status}`;
  try {
    const text = await r.text();
    if (text) {
      try { const j = JSON.parse(text); msg = (j.message || j.error || text); }
      catch { msg = text; }
    }
  } catch {}
  throw new Error(msg);
}
