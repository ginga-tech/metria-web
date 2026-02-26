function normalizeApiBaseUrl(raw?: string) {
  const value = raw?.trim();
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const api = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (!api) {
    throw new Error(
      "API nao configurada. Defina VITE_API_BASE_URL no .env.local (ex.: http://localhost:5104)."
    );
  }
  return api;
}

export async function apiGet(path: string) {
  const API = getApiBaseUrl();
  const token = localStorage.getItem("lb_token");
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!r.ok) throw new Error("Erro na API");
  return r.json();
}
