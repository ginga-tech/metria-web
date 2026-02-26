// Global auth utilities: interceptor and token checks

// Clear all auth-related data and redirect to root
function clearAuthDataAndRedirect() {
  // Local storage
  localStorage.removeItem('lb_token');
  localStorage.removeItem('lb_goals');
  localStorage.removeItem('lb_assessment');
  localStorage.removeItem('lb_user_data');

  // Session storage
  sessionStorage.removeItem('editAssessment');
  sessionStorage.clear();

  // Cookies
  document.cookie.split(';').forEach((c) => {
    const eqPos = c.indexOf('=');
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
  });

  // Redirect to login
  window.location.href = '/';
}

let originalFetchRef: typeof window.fetch | null = null;

// Authenticated fetch using the original fetch implementation
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const stored = localStorage.getItem('lb_token');
  const token = stored ? stored.replace(/^Bearer\s+/i, '') : '';

  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const fetchImpl = originalFetchRef ?? window.fetch;
  const response = await fetchImpl(url as any, { ...options, headers });

  if (response.status === 401) {
    console.log('Token invalido detectado no authenticatedFetch, fazendo logout automatico...');
    clearAuthDataAndRedirect();
    throw new Error('Sessao expirada. Redirecionando para login...');
  }

  return response;
}

// Global fetch interceptor
export function setupGlobalAuthInterceptor() {
  originalFetchRef = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

    if (url.includes(API_BASE)) {
      const stored = localStorage.getItem('lb_token');
      const token = stored ? stored.replace(/^Bearer\s+/i, '') : '';
      const headers = new Headers(init?.headers as HeadersInit | undefined);
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const response = await originalFetchRef!(input, { ...init, headers });
      if (response.status === 401) {
        console.log('Token invalido detectado no interceptor, fazendo logout automatico...');
        clearAuthDataAndRedirect();
        throw new Error('Sessao expirada. Redirecionando para login...');
      }
      return response;
    }

    return originalFetchRef!(input, init);
  };
}

// Validate current token by calling /api/me
export async function validateToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('lb_token');
    if (!token) return false;

    const API = import.meta.env.VITE_API_BASE_URL as string;
    const response = await fetch(`${API}/api/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// Periodic token validation (default: every 5 minutes)
export function startTokenValidationInterval(intervalMs: number = 5 * 60 * 1000) {
  return setInterval(async () => {
    const isValid = await validateToken();
    if (!isValid) {
      console.log('Token invalido detectado na verificacao periodica, fazendo logout automatico...');
      clearAuthDataAndRedirect();
    }
  }, intervalMs);
}

