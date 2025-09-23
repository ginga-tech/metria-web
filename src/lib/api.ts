const API = import.meta.env.VITE_API_BASE_URL;

export async function apiGet(path: string) {
  const token = localStorage.getItem("lb_token");
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!r.ok) throw new Error("Erro na API");
  return r.json();
}
