import { useState, useEffect } from "react";
import { login, signup } from "../services/authService";
import { useNavigate } from "react-router-dom";
import metriaLogo from "../assets/metria-logo.svg";
import Tooltip from "../components/Tooltip";
import { useGoogleOAuth } from "../hooks/useGoogleOAuth";
import { getApiBaseUrl } from "../lib/api";

/**
 * Metria - Tela de Login/Cadastro (MVP)
 * Paleta: Azul #2F6C92 | Verde #41B36E | Laranja #F96B11 | Cinza #F3F4F6
 */

export default function MetriaAuth() {
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
  const { isLoading: isGoogleLoading, loginWithGoogle } = useGoogleOAuth();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Capture token on root (fallback), in case backend redirected to "/?token=..." or "#token=..."
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get("token") || "";
      const fromHash = url.hash.startsWith("#token=") ? url.hash.slice(7) : "";
      let token = fromQuery || fromHash;
      if (token) {
        try { token = decodeURIComponent(token); } catch {}
        token = token.replace(/^Bearer\s+/i, '');
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
  
  if (mode === "signup" && name.trim().length < 2) next.name = "O nome deve ter pelo menos 2 caracteres";

  if (!emailRegex.test(eTrim)) next.email = "Por favor, insira um e-mail vÃ¡lido";
  
  if (mode === "signup") {
    if (!p || p.length < 6) next.password = "A senha deve ter pelo menos 6 caracteres";
    if (p !== confirmPassword) next.confirmPassword = "As senhas nÃ£o coincidem";
  } else {
    if (!p) next.password = "A senha Ã© obrigatÃ³ria";
  }
  
  setErrors(next);
  if (Object.keys(next).length > 0) return;
  try {
    setIsLoading(true);
    setMessage(null);
    let token = '';
    if (mode === "login") {
      const res = await login({ email: eTrim, password: p });
      token = (res.token || '').replace(/^Bearer\s+/i, '');
      localStorage.setItem("lb_token", token);
    } else {
      const res = await signup({ name: name.trim(), email: eTrim, password: p });
      token = (res.token || '').replace(/^Bearer\s+/i, '');
      localStorage.setItem("lb_token", token);
    }
    setMessage("AutenticaÃ§Ã£o realizada com sucesso!");
    
    // Verificar status do usuário antes de redirecionar
    try {
      const API = getApiBaseUrl();
      const statusResponse = await fetch(`${API}/api/user/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        // Se jÃ¡ tem assessment, vai para dashboard. Caso contrÃ¡rio, vai para assessment
        navigate(status.hasAssessment ? "/dashboard" : "/assessment");
      } else {
        // Se falhar ao verificar status, redireciona para assessment por seguranÃ§a
        navigate("/assessment");
      }
    } catch {
      // Em caso de erro, redireciona para assessment
      navigate("/assessment");
    }
  } catch (err: any) {
    const errorMessage = err?.message ?? "Erro ao realizar autenticaÃ§Ã£o";
    // Traduzir mensagens de erro comuns da API
    let translatedMessage = errorMessage;
    if (errorMessage.includes("Email ja cadastrado")) {
      translatedMessage = "Este e-mail jÃ¡ estÃ¡ cadastrado. Tente fazer login.";
    } else if (errorMessage.includes("Unauthorized")) {
      translatedMessage = "E-mail ou senha incorretos. Verifique suas credenciais.";
    } else if (errorMessage.includes("Invalid email")) {
      translatedMessage = "E-mail invÃ¡lido. Verifique o formato do e-mail.";
    } else if (errorMessage.includes("Password")) {
      translatedMessage = "Erro na senha. Verifique se atende aos requisitos.";
    }
    setMessage(translatedMessage);
  } finally {
    setIsLoading(false);
  }
}

  async function handleGoogle() {
    try {
      setMessage(null);
      const token = await loginWithGoogle();
      if (token) {
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        localStorage.setItem("lb_token", cleanToken);
        setMessage("Login com Google realizado com sucesso!");
        
        // Verificar status do usuário antes de redirecionar
        try {
          const API = getApiBaseUrl();
          const statusResponse = await fetch(`${API}/api/user/status`, {
            headers: {
              'Authorization': `Bearer ${cleanToken}`
            }
          });
          
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            // Se jÃ¡ tem assessment, vai para dashboard. Caso contrÃ¡rio, vai para assessment
            navigate(status.hasAssessment ? "/dashboard" : "/assessment");
          } else {
            // Se falhar ao verificar status, redireciona para assessment por seguranÃ§a
            navigate("/assessment");
          }
        } catch {
          // Em caso de erro, redireciona para assessment
          navigate("/assessment");
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao fazer login com Google";
      setMessage(errorMessage);
    }
  }
  return (
    <div className="relative min-h-screen grid place-items-center overflow-hidden bg-[#F2F5F8] p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-[520px] grid grid-cols-1 gap-6">
        <section className="hidden">
          <div className="absolute inset-0 bg-white" />
          <div className="relative z-10 w-full max-w-[360px] text-[#6B3D0C]">
            <div className="flex justify-center mb-8">
              <img
                src={metriaLogo}
                alt="metria"
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

        <section className="rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.28)] order-1">
          <div className="mb-6 flex justify-center">
            <div className="flex min-h-[120px] sm:min-h-[132px] items-center justify-center">
              <img src={metriaLogo} alt="Metria" className="h-[120px] sm:h-[132px] w-auto object-contain" />
            </div>
          </div>
          <div className="mb-5 text-center">
            <p className="text-sm font-medium text-slate-500 mb-1">
              {mode === "login" ? "Acesse sua jornada de autoconhecimento" : "Comece sua jornada de autoconhecimento"}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {mode === "login" ? "Bem-vindo(a) de volta" : "Crie sua conta"}
            </h3>
          </div>

          <div className="grid gap-3">
            <button
              onClick={handleGoogle}
              disabled={isLoading || isGoogleLoading}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#41B36E]"></div>
              ) : (
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
              )}
              {isGoogleLoading
                ? "Conectando com Google..."
                : mode === "login"
                ? "Entrar com Google"
                : "Cadastrar com Google"}
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  ou com e-mail
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="grid gap-3">
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Nome
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 text-slate-900 outline-none transition ${errors.name ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"}`}
                      placeholder="Seu nome"
                      title="Por favor, preencha seu nome completo"
                    />
                    {errors.name && (
                      <Tooltip content={errors.name} type="error" position="bottom">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  E-mail
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 text-slate-900 outline-none transition ${errors.email ? "border-red-300 focus:ring-2 focus:ring-red-200 pr-10" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"}`}
                    placeholder="voce@exemplo.com"
                    title="Por favor, insira um endereÃ§o de e-mail vÃ¡lido"
                  />
                  {errors.email && (
                    <Tooltip content={errors.email} type="error" position="bottom">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
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
                    className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 pr-12 text-slate-900 outline-none transition ${errors.password ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"}`}
                    placeholder="********"
                    title="Por favor, preencha este campo"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1 ${errors.password ? "right-10" : "right-3"}`}
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
                  {errors.password && (
                    <Tooltip content={errors.password} type="error" position="bottom">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>

              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-slate-700"
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
                      className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 text-slate-900 outline-none transition ${errors.confirmPassword ? "border-red-300 focus:ring-2 focus:ring-red-200 pr-20" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20 pr-12"}`}
                      placeholder="********"
                      title="Por favor, confirme sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1 ${errors.confirmPassword ? "right-10" : "right-3"}`}
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
                    {errors.confirmPassword && (
                      <Tooltip content={errors.confirmPassword} type="error" position="bottom">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`mt-1 h-12 cursor-pointer rounded-xl font-bold transition disabled:opacity-60 ${mode === "login" ? "bg-[#1E658D] text-white hover:bg-[#175575]" : "bg-[#A3E635] text-[#373D48] hover:bg-[#97d52d]"}`}
              >
                {isLoading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            {mode === "login" && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-[#1E658D] hover:underline font-semibold transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {message && (
              <Tooltip 
                content={message.includes("sucesso") ? "Login realizado com sucesso! Redirecionando..." : "Clique para mais detalhes sobre o erro"} 
                type={message.includes("sucesso") ? "success" : "error"}
                position="top"
              >
                <div className={`mt-2 text-sm rounded-xl p-3 cursor-help transition-all duration-200 ${
                  message.includes("sucesso") 
                    ? "text-green-700 bg-green-50 border border-green-200" 
                    : "text-red-700 bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {message.includes("sucesso") ? (
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{message}</span>
                  </div>
                </div>
              </Tooltip>
            )}

            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === "login" ? "Nao tem conta? " : "Ja possui conta? "}
              <button
                onClick={toggleMode}
                className="font-semibold text-[#1E658D] hover:underline cursor-pointer"
              >
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>

            <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
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

            {/* Atalho para Goals - apenas para desenvolvimento */}
            
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1E658D]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#A3E635]/15 blur-3xl" />
    </div>
  );
}
