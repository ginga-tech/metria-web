import { useState, useEffect } from "react";
import { login, signup } from "../services/authService";
import { useNavigate } from "react-router-dom";
import lifeBalanceLogo from "../assets/lifebalance-logo.svg";

/**
 * LifeBalance - Tela de Login/Cadastro (MVP)
 * Paleta: Azul #2F6C92 | Verde #41B36E | Laranja #F96B11 | Cinza #F3F4F6
 */

export default function LifeBalanceAuth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const navigate = useNavigate();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Capture token on root (fallback), in case backend redirected to "/?token=..."
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token") || url.hash.replace("#token=", "") || "";
      if (token) {
        localStorage.setItem("lb_token", token);
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.pathname + url.search);
        navigate("/assessment", { replace: true });
      }
    } catch {}
  }, [navigate]);function toggleMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setMessage(null);
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const next: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
  const eTrim = email.trim();
  const p = password;
  
  if (mode === "signup" && name.trim().length < 2) next.name = "Nome deve ter ao menos 2 caracteres";

  if (!emailRegex.test(eTrim)) next.email = "E-mail invalido";
  
  if (mode === "signup") {
    if (!p || p.length < 6) next.password = "Senha deve ter ao menos 6 caracteres";
    if (p !== confirmPassword) next.confirmPassword = "Senhas não coincidem";
  } else {
    if (!p) next.password = "Senha obrigatoria";
  }
  
  setErrors(next);
  if (Object.keys(next).length > 0) return;
  try {
    setIsLoading(true);
    setMessage(null);
    if (mode === "login") {
      const res = await login({ email: eTrim, password: p });
      localStorage.setItem("lb_token", res.token);
    } else {
      const res = await signup({ name: name.trim(), email: eTrim, password: p });
      localStorage.setItem("lb_token", res.token);
    }
    setMessage("Autenticacao realizada com sucesso!");
    navigate("/assessment");
  } catch (err: any) {
    setMessage(err?.message ?? "Erro ao autenticar");
  } finally {
    setIsLoading(false);
  }
}

  async function handleGoogle() {
    const API = (import.meta as any).env.VITE_API_BASE_URL as string;
    const redirectUri = `${window.location.origin}/oauth/callback`;
    window.location.href = `${API}/api/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`;
  }
  return (
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
      <div className="w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="relative overflow-hidden rounded-2xl shadow-xl bg-white flex items-center justify-center p-10 order-2 lg:order-1">
          <div className="absolute inset-0 bg-white" />
          <div className="relative z-10 w-full max-w-[360px] text-[#6B3D0C]">
            <div className="flex justify-center mb-8">
              <img
                src={lifeBalanceLogo}
                alt="LifeBalance"
                className="w-48 sm:w-56 drop-shadow-lg"
              />
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight tracking-tight text-center mb-4">
              Seu Super Trunfo da Vida
            </h2>
            <p className="text-[#7A4312]/90 text-center mb-6">
              Organize sua vida em 10 dimensoes, visualize desequilibrios e
              receba metas praticas semanais para evoluir com constancia.
            </p>

            <ul className="space-y-3 text-[#6B3D0C] text-sm sm:text-base font-medium">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F96B11]" />
                Autoavaliacao simples (escala 1-5)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#2F6C92]" />
                Radar de equilibrio (10 dimensoes)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#41B36E]" />
                Metas personalizadas semanais
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl shadow-xl bg-white p-6 sm:p-8 order-1 lg:order-2">
          <div className="mb-6">
            <p className="text-sm text-[#2F6C92] font-medium mb-1">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">
              {mode === "login" ? "Entrar" : "Cadastrar"}
            </h3>
          </div>

          <div className="grid gap-3">
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 h-11 rounded-xl border border-[#2F6C92]/20 bg-white hover:bg-[#F3F4F6] transition disabled:opacity-60"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.4c-.2 1.2-1.6 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.9 3.7 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1-.1-1H12z"
                />
              </svg>
              {isLoading
                ? "Conectando..."
                : mode === "login"
                ? "Entrar com Google"
                : "Cadastrar com Google"}
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2F6C92]/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#2F6C92]/60">
                  ou com e-mail
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="grid gap-3">
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-[#2F6C92]"
                  >
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`h-11 rounded-xl px-3 outline-none focus:ring-2 ${errors.name ? "border-red-400 focus:ring-red-300" : "border-[#2F6C92]/20 focus:ring-[#41B36E]"}` }
                    placeholder="Seu nome" />
                  {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
                </div>
              )}

              <div className="grid gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-[#2F6C92]"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`h-11 rounded-xl px-3 outline-none focus:ring-2 ${errors.email ? "border-red-400 focus:ring-red-300" : "border-[#2F6C92]/20 focus:ring-[#41B36E]"}` }
                  placeholder="voce@exemplo.com" />
                {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
              </div>

              <div className="grid gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#2F6C92]"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`h-11 rounded-xl px-3 pr-12 outline-none focus:ring-2 ${errors.password ? "border-red-400 focus:ring-red-300" : "border-[#2F6C92]/20 focus:ring-[#41B36E]"}`}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-600">{errors.password}</span>}
              </div>

              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-[#2F6C92]"
                  >
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`h-11 rounded-xl px-3 pr-12 outline-none focus:ring-2 ${errors.confirmPassword ? "border-red-400 focus:ring-red-300" : "border-[#2F6C92]/20 focus:ring-[#41B36E]"}`}
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="text-xs text-red-600">{errors.confirmPassword}</span>}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 h-11 cursor-pointer rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition disabled:opacity-60"
              >
                {isLoading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            {message && (
              <div className="mt-2 text-sm text-[#2F6C92] bg-[#F3F4F6] rounded-xl p-3">
                {message}
              </div>
            )}

            <p className="mt-4 text-sm text-[#2F6C92]/80">
              {mode === "login" ? "Nao tem conta? " : "Ja possui conta? "}
              <button
                onClick={toggleMode}
                className="font-medium text-[#F96B11] hover:underline cursor-pointer"
              >
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>

            <p className="mt-6 text-xs text-[#2F6C92]/60 leading-relaxed">
              Ao continuar, voce concorda com nossos{" "}
              <a className="underline" href="#">
                Termos
              </a>{" "}
              e{" "}
              <a className="underline" href="#">
                Politica de Privacidade
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
