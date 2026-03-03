import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { login, signup } from "../services/authService";
import { useGoogleOAuth } from "../hooks/useGoogleOAuth";
import Tooltip from "../components/Tooltip";
import metriaLogo from "../assets/metria-logo.svg";
import { getApiBaseUrl } from "../lib/api";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("pt-BR", ptBR);

type UserStatusDto = {
  hasAssessment?: boolean;
};

type UserPreferencesDto = {
  name?: string;
  email?: string;
  birthDate?: string | null;
};

type AuthFlowOptions = {
  requireBirthDate: boolean;
};

const MIN_AGE = 16;
const MAX_AGE = 80;

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function yearsAgoIso(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return toIsoDate(date);
}

function parseIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function getAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

function validateBirthDate(value: string): string | null {
  if (!value) return "Data de nascimento obrigatoria.";

  const parsed = parseIsoDate(value);
  if (!parsed) return "Informe uma data valida.";

  const age = getAge(parsed);
  if (age < MIN_AGE || age > MAX_AGE) {
    return `Voce deve ter entre ${MIN_AGE} e ${MAX_AGE} anos.`;
  }

  return null;
}

export default function MetriaAuth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [showBirthDateModal, setShowBirthDateModal] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState("");
  const [birthDateValue, setBirthDateValue] = useState<Date | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [savingBirthDate, setSavingBirthDate] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingRedirectPath, setPendingRedirectPath] = useState("/assessment");

  const navigate = useNavigate();
  const { isLoading: isGoogleLoading, loginWithGoogle } = useGoogleOAuth();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const minBirthDateInput = useMemo(() => yearsAgoIso(MAX_AGE), []);
  const maxBirthDateInput = useMemo(() => yearsAgoIso(MIN_AGE), []);
  const minBirthDate = useMemo(() => parseIsoDate(minBirthDateInput), [minBirthDateInput]);
  const maxBirthDate = useMemo(() => parseIsoDate(maxBirthDateInput), [maxBirthDateInput]);

  async function resolvePostLoginData(token: string): Promise<{ nextPath: string; birthDate?: string | null }> {
    const API = getApiBaseUrl();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [statusResponse, preferencesResponse] = await Promise.all([
      fetch(`${API}/api/user/status`, { headers }),
      fetch(`${API}/api/user/preferences`, { headers }),
    ]);

    let nextPath = "/assessment";
    let birthDate: string | null | undefined;

    if (statusResponse.ok) {
      const status = (await statusResponse.json()) as UserStatusDto;
      nextPath = status.hasAssessment ? "/dashboard" : "/assessment";
    }

    if (preferencesResponse.ok) {
      const preferences = (await preferencesResponse.json()) as UserPreferencesDto;
      birthDate = preferences.birthDate;
    }

    return { nextPath, birthDate };
  }

  async function continueAfterAuthentication(token: string, options: AuthFlowOptions) {
    setMessage("Autenticacao realizada com sucesso!");

    try {
      const postLogin = await resolvePostLoginData(token);
      if (options.requireBirthDate && !postLogin.birthDate) {
        setBirthDateInput("");
        setBirthDateValue(null);
        setBirthDateError(null);
        setPendingToken(token);
        setPendingRedirectPath(postLogin.nextPath);
        setShowBirthDateModal(true);
        return;
      }

      navigate(postLogin.nextPath, { replace: true });
    } catch {
      navigate("/assessment", { replace: true });
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const fromQuery = url.searchParams.get("token") || "";
        const fromHash = url.hash.startsWith("#token=") ? url.hash.slice(7) : "";
        let token = fromQuery || fromHash;
        if (!token) return;

        try {
          token = decodeURIComponent(token);
        } catch {
          // ignore
        }
        token = token.replace(/^Bearer\s+/i, "");

        localStorage.setItem("lb_token", token);
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.pathname + url.search);
        await continueAfterAuthentication(token, { requireBirthDate: true });
      } catch {
        // ignore
      }
    })();
  }, []);

  function toggleMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setMessage(null);
    setErrors({});
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    const trimmedEmail = email.trim();

    if (mode === "signup" && name.trim().length < 2) {
      nextErrors.name = "O nome deve ter pelo menos 2 caracteres.";
    }
    if (!emailRegex.test(trimmedEmail)) {
      nextErrors.email = "Por favor, insira um e-mail valido.";
    }
    if (mode === "signup") {
      if (!password || password.length < 6) nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
      if (password !== confirmPassword) nextErrors.confirmPassword = "As senhas nao coincidem.";
    } else if (!password) {
      nextErrors.password = "A senha e obrigatoria.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsLoading(true);
      setMessage(null);

      let token = "";
      if (mode === "login") {
        const response = await login({ email: trimmedEmail, password });
        token = (response.token || "").replace(/^Bearer\s+/i, "");
      } else {
        const response = await signup({ name: name.trim(), email: trimmedEmail, password });
        token = (response.token || "").replace(/^Bearer\s+/i, "");
      }

      localStorage.setItem("lb_token", token);
      await continueAfterAuthentication(token, { requireBirthDate: mode === "login" });
    } catch (error: any) {
      const rawMessage = error?.message ?? "Erro ao realizar autenticacao.";
      let translatedMessage = rawMessage;
      const normalizedMessage = String(rawMessage).toLowerCase();
      if (rawMessage.includes("Email ja cadastrado")) {
        translatedMessage = "Este e-mail ja esta cadastrado. Tente fazer login.";
      } else if (
        mode === "login" &&
        (
          normalizedMessage.includes("erro 401") ||
          normalizedMessage.includes("401") ||
          normalizedMessage.includes("unauthorized") ||
          normalizedMessage.includes("invalid credentials")
        )
      ) {
        translatedMessage = "Senha ou usuário incorretos.";
      } else if (rawMessage.includes("Invalid email")) {
        translatedMessage = "E-mail invalido. Verifique o formato.";
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
      if (!token) return;

      const cleanToken = token.replace(/^Bearer\s+/i, "");
      localStorage.setItem("lb_token", cleanToken);
      await continueAfterAuthentication(cleanToken, { requireBirthDate: mode === "login" });
    } catch (error: any) {
      setMessage(error?.message || "Erro ao fazer login com Google.");
    }
  }

  async function handleSaveBirthDate() {
    const validationMessage = validateBirthDate(birthDateInput);
    if (validationMessage) {
      setBirthDateError(validationMessage);
      return;
    }

    const token = pendingToken || localStorage.getItem("lb_token");
    if (!token) {
      setBirthDateError("Sessao expirada. Faca login novamente.");
      return;
    }

    try {
      setSavingBirthDate(true);
      setBirthDateError(null);
      const API = getApiBaseUrl();
      const response = await fetch(`${API}/api/user/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ birthDate: birthDateInput }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Nao foi possivel salvar a data de nascimento.");
      }

      setShowBirthDateModal(false);
      navigate(pendingRedirectPath, { replace: true });
    } catch (error: any) {
      setBirthDateError(error?.message || "Erro ao salvar data de nascimento.");
    } finally {
      setSavingBirthDate(false);
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center overflow-hidden bg-[#F2F5F8] p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-[520px] grid grid-cols-1 gap-6">
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.6 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.9 3.7 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1-.1-1H12z" />
                </svg>
              )}
              {isGoogleLoading ? "Conectando com Google..." : mode === "login" ? "Entrar com Google" : "Cadastrar com Google"}
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">ou com e-mail</span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="grid gap-3">
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nome</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 text-slate-900 outline-none transition ${
                      errors.name ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"
                    }`}
                    placeholder="Seu nome"
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 text-slate-900 outline-none transition ${
                    errors.email ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"
                  }`}
                  placeholder="voce@exemplo.com"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Senha</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 pr-12 text-slate-900 outline-none transition ${
                      errors.password ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"
                    }`}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1 ${errors.password ? "right-10" : "right-3"}`}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirmar Senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className={`h-12 w-full rounded-xl border-2 bg-slate-50 px-3 text-slate-900 outline-none transition ${
                      errors.confirmPassword ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-slate-100 focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/20"
                    }`}
                    placeholder="********"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`mt-1 h-12 cursor-pointer rounded-xl font-bold transition disabled:opacity-60 ${
                  mode === "login" ? "bg-[#1E658D] text-white hover:bg-[#175575]" : "bg-[#A3E635] text-[#373D48] hover:bg-[#97d52d]"
                }`}
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
                <div
                  className={`mt-2 text-sm rounded-xl p-3 cursor-help transition-all duration-200 ${
                    message.includes("sucesso")
                      ? "text-green-700 bg-green-50 border border-green-200"
                      : "text-red-700 bg-red-50 border border-red-200"
                  }`}
                >
                  {message}
                </div>
              </Tooltip>
            )}

            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === "login" ? "Nao tem conta? " : "Ja possui conta? "}
              <button onClick={toggleMode} className="font-semibold text-[#1E658D] hover:underline cursor-pointer">
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </div>
        </section>
      </div>

      {showBirthDateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_-18px_rgba(15,23,42,0.28)] p-6">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#2F6C92]/10 text-[#2F6C92] grid place-items-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Complete seu perfil</h3>
              <p className="text-sm text-slate-600 mt-1">Informe sua data de nascimento para continuar.</p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="birthDateModal" className="text-sm font-semibold text-[#2F6C92]">
                Data de nascimento
              </label>
              <DatePicker
                id="birthDateModal"
                selected={birthDateValue}
                onChange={(date) => {
                  setBirthDateValue(date);
                  setBirthDateInput(date ? toIsoDate(date) : "");
                  if (birthDateError) setBirthDateError(null);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/aaaa"
                locale="pt-BR"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={minBirthDate ?? undefined}
                maxDate={maxBirthDate ?? undefined}
                autoComplete="off"
                className={`w-full h-12 rounded-xl border px-3 outline-none transition ${
                  birthDateError ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-slate-300 focus:ring-2 focus:ring-[#41B36E]/20 focus:border-[#41B36E]"
                }`}
              />
              {birthDateError && <p className="text-sm text-red-600">{birthDateError}</p>}
              <p className="text-xs text-slate-500">Idade permitida: {MIN_AGE} a {MAX_AGE} anos.</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleSaveBirthDate}
                disabled={savingBirthDate}
                className="flex-1 h-11 rounded-xl bg-[#1E658D] text-white font-semibold hover:bg-[#175575] transition disabled:opacity-60"
              >
                {savingBirthDate ? "Salvando..." : "Salvar e continuar"}
              </button>
              <button
                onClick={() => {
                  setShowBirthDateModal(false);
                  localStorage.removeItem("lb_token");
                  window.location.href = "/";
                }}
                className="h-11 px-4 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1E658D]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#A3E635]/15 blur-3xl" />
    </div>
  );
}
