import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { getPreferredFirstName } from "../utils/userDisplay";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("pt-BR", ptBR);

type Lang = "pt" | "en";

interface UserPreferences {
  name: string;
  email: string;
  birthDate?: string;
}

const MIN_AGE = 16;
const MAX_AGE = 80;

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function parseDisplayDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function parseBirthDate(value: string): Date | null {
  return parseIsoDate(value) ?? parseDisplayDate(value);
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

export default function Preferences() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateObj, setBirthDateObj] = useState<Date | null>(null);
  const [lang, setLang] = useState<Lang>("pt");
  const [notifyWeekly, setNotifyWeekly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const maxBirthDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - MIN_AGE);
    return date;
  }, []);

  const minBirthDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - MAX_AGE);
    return date;
  }, []);

  useEffect(() => {
    loadPreferences();
  }, []);

  function validateBirthDate(value: string): { valid: boolean; message?: string; normalized?: string } {
    if (!value.trim()) {
      return { valid: false, message: "Data de nascimento é obrigatória." };
    }

    const parsed = parseBirthDate(value);
    if (!parsed) {
      return { valid: false, message: "Informe uma data válida no formato dd/mm/aaaa." };
    }

    const age = getAge(parsed);
    if (age < MIN_AGE || age > MAX_AGE) {
      return { valid: false, message: "Você deve ter entre 16 e 80 anos." };
    }

    return { valid: true, normalized: toIsoDate(parsed) };
  }

  function validateFields(): { valid: boolean; normalizedBirthDate?: string } {
    const newErrors: { [key: string]: string } = {};

    const birthDateValidation = validateBirthDate(birthDate);
    if (!birthDateValidation.valid) {
      newErrors.birthDate = birthDateValidation.message || "Data de nascimento inválida.";
    }

    setErrors(newErrors);
    return {
      valid: Object.keys(newErrors).length === 0,
      normalizedBirthDate: birthDateValidation.normalized,
    };
  }

  function onBirthDateChange(date: Date | null) {
    setBirthDateObj(date);
    setBirthDate(date ? toIsoDate(date) : "");
    if (errors.birthDate) {
      setErrors((previous) => ({ ...previous, birthDate: "" }));
    }
  }

  async function loadPreferences() {
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
      const token = localStorage.getItem("lb_token") ?? "";

      if (API && token) {
        const response = await fetch(`${API}/api/user/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data: UserPreferences = await response.json();
          const currentBirthDate = data.birthDate || "";
          setName(data.name || "");
          setBirthDate(currentBirthDate);
          setBirthDateObj(currentBirthDate ? parseBirthDate(currentBirthDate) : null);
        }
      }

      const currentLang = (localStorage.getItem("lb_lang") as Lang | null) || "pt";
      setLang(currentLang === "en" ? "en" : "pt");
      setNotifyWeekly(localStorage.getItem("lb_notify_weekly") === "true");
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
      setMessage("Erro ao carregar preferências.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setErrors({});

    const { valid, normalizedBirthDate } = validateFields();
    if (!valid || !normalizedBirthDate) {
      setSaving(false);
      return;
    }

    setBirthDate(normalizedBirthDate);

    try {
      const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
      const token = localStorage.getItem("lb_token") ?? "";

      if (API && token) {
        const response = await fetch(`${API}/api/user/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim() || null,
            birthDate: normalizedBirthDate,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao salvar no servidor.");
        }
      }

      localStorage.setItem("lb_lang", lang);
      localStorage.setItem("lb_notify_weekly", String(notifyWeekly));
      setMessage("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      setMessage("Erro ao salvar preferências. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function resetAssessment() {
    const ok = window.confirm("Tem certeza que deseja redefinir sua autoavaliação?");
    if (!ok) return;

    try {
      localStorage.removeItem("lb_assessment");
      setMessage("Autoavaliação redefinida.");
    } catch {
      setMessage("Não foi possível redefinir agora.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l.756.327a1 1 0 001.138-.245l.53-.61a1 1 0 011.536 0l.53.61a1 1 0 001.138.245l.756-.327a1 1 0 011.35.936l.1.861a1 1 0 00.712.861l.83.27a1 1 0 01.621 1.28l-.3.824a1 1 0 00.21 1.047l.58.631a1 1 0 010 1.355l-.58.632a1 1 0 00-.21 1.047l.3.824a1 1 0 01-.621 1.28l-.83.27a1 1 0 00-.712.861l-.1.861a1 1 0 01-1.35.936l-.756-.327a1 1 0 00-1.138.245l-.53.61a1 1 0 01-1.536 0l-.53-.61a1 1 0 00-1.138-.245l-.756.327a1 1 0 01-1.35-.936l-.1-.861a1 1 0 00-.712-.861l-.83-.27a1 1 0 01-.621-1.28l.3-.824a1 1 0 00-.21-1.047l-.58-.632a1 1 0 010-1.355l.58-.631a1 1 0 00.21-1.047l-.3-.824a1 1 0 01.621-1.28l.83-.27a1 1 0 00.712-.861l.1-.861z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2F6C92]">Perfil e Preferências</h1>
                <p className="text-[#2F6C92]/70 text-sm sm:text-base">
                  Olá, <span className="font-semibold text-[#2F6C92]">{getPreferredFirstName(user?.name, user?.email)}</span>! Ajuste seu perfil, idioma e notificações.
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} userName={user?.name} />
          </div>
        </header>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6C92]"></div>
              <span className="ml-3 text-[#2F6C92]">Carregando preferências...</span>
            </div>
          )}

          <div className={`space-y-6 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-6 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#2F6C92]/10 text-[#2F6C92]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-[#2F6C92]">Nome Completo</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none focus:ring-2 focus:ring-[#41B36E]/30 focus:border-[#41B36E] transition-all"
                    placeholder="Digite seu nome completo"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="birthDate" className="text-sm font-semibold text-[#2F6C92] flex items-center gap-1">
                    Data de Nascimento
                    <span className="text-red-500 text-xs">*obrigatório</span>
                  </label>
                  <DatePicker
                    id="birthDate"
                    selected={birthDateObj}
                    onChange={onBirthDateChange}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/aaaa"
                    locale="pt-BR"
                    className={`w-full h-12 rounded-xl border bg-white px-4 outline-none focus:ring-2 transition-all ${
                      errors.birthDate ? "border-red-500 focus:ring-red-500/25" : "border-slate-300 focus:ring-[#41B36E]/30 focus:border-[#41B36E]"
                    }`}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={maxBirthDate}
                    minDate={minBirthDate}
                    disabled={loading}
                  />
                  {errors.birthDate && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86l-7.4 12.82A1 1 0 003.75 18h16.5a1 1 0 00.86-1.5l-7.4-12.82a1 1 0 00-1.72 0z" />
                      </svg>
                      {errors.birthDate}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Idade permitida: {MIN_AGE} a {MAX_AGE} anos</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-6 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#41B36E]/10 text-[#41B36E]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l.756.327a1 1 0 001.138-.245l.53-.61a1 1 0 011.536 0l.53.61a1 1 0 001.138.245l.756-.327a1 1 0 011.35.936l.1.861a1 1 0 00.712.861l.83.27a1 1 0 01.621 1.28l-.3.824a1 1 0 00.21 1.047l.58.631a1 1 0 010 1.355l-.58.632a1 1 0 00-.21 1.047l.3.824a1 1 0 01-.621 1.28l-.83.27a1 1 0 00-.712.861l-.1.861a1 1 0 01-1.35.936l-.756-.327a1 1 0 00-1.138.245l-.53.61a1 1 0 01-1.536 0l-.53-.61a1 1 0 00-1.138-.245l-.756.327a1 1 0 01-1.35-.936l-.1-.861a1 1 0 00-.712-.861l-.83-.27a1 1 0 01-.621-1.28l.3-.824a1 1 0 00-.21-1.047l-.58-.632a1 1 0 010-1.355l.58-.631a1 1 0 00.21-1.047l-.3-.824a1 1 0 01.621-1.28l.83-.27a1 1 0 00.712-.861l.1-.861z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Preferências do Sistema
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="lang" className="text-sm font-semibold text-[#2F6C92]">Idioma da Interface</label>
                  <select
                    id="lang"
                    value={lang}
                    onChange={(e) => setLang((e.target.value as Lang) || "pt")}
                    className="w-full h-12 rounded-xl border border-slate-300 px-4 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-[#41B36E]/30 focus:border-[#41B36E] transition-all"
                    disabled={loading}
                  >
                    <option value="pt">Português (Brasil)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#2F6C92]">Notificações</label>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifyWeekly}
                      onClick={() => setNotifyWeekly((current) => !current)}
                      className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#41B36E]/30 ${notifyWeekly ? "bg-[#41B36E]" : "bg-slate-300"}`}
                    >
                      <span
                        className={`absolute top-0 h-6 w-6 rounded-full bg-white border border-slate-300 transition-transform ${notifyWeekly ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2F6C92]">Lembrete Semanal</p>
                      <p className="text-xs text-gray-600">Receber notificação para revisar seu equilíbrio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <button
                  onClick={save}
                  disabled={saving || loading}
                  className="h-12 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white font-semibold px-5 hover:from-[#10B981] hover:to-[#41B36E] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h12l2 2v14H5V4zm3 0v5h8V4M9 14h6" />
                      </svg>
                      Salvar Alterações
                    </>
                  )}
                </button>

                <button
                  onClick={resetAssessment}
                  disabled={loading}
                  className="h-12 rounded-xl border border-[#F96B11] text-[#F96B11] font-semibold px-5 hover:bg-[#F96B11] hover:text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5.64 18.36A9 9 0 1020 12" />
                  </svg>
                  Redefinir Avaliação
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="h-12 rounded-xl border border-slate-300 text-slate-600 font-medium px-5 hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>

                <button
                  onClick={() => navigate("/subscriptions")}
                  className="h-12 rounded-xl border border-[#2F6C92] text-[#2F6C92] font-semibold px-5 hover:bg-[#F3F4F6] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4m8 0a4 4 0 01-4 4m0-8a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                  Gerenciar Assinatura
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 text-sm rounded-xl p-3 border ${
                message.includes("sucesso")
                  ? "text-green-700 bg-green-50 border-green-200"
                  : "text-[#2F6C92] bg-[#F3F4F6] border-[#D5DEE6]"
              }`}
            >
              {message}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
