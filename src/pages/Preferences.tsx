import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useUser } from "../hooks/useUser";
import { getPreferredFirstName } from "../utils/userDisplay";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("pt-BR", ptBR);

/**
 * Perfil/Preferências – Atualizado
 * - Nome do usuário (salvo no banco)
 * - Data de nascimento (salvo no banco)
 * - Idioma (pt/en) - localStorage
 * - Notificação semanal (toggle) - localStorage
 * - Redefinir avaliação (limpa localStorage lb_assessment)
 */

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
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function parseDisplayDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
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
  const [notifyWeekly, setNotifyWeekly] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
    const newErrors: {[key: string]: string} = {};

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
      // Carrega preferências do servidor
      const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
      const token = localStorage.getItem("lb_token") ?? "";

      if (API && token) {
        const response = await fetch(`${API}/api/user/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data: UserPreferences = await response.json();
          setName(data.name || "");
          const bd = data.birthDate || "";
          setBirthDate(bd);
          setBirthDateObj(bd ? parseBirthDate(bd) : null);
        }
      }

      // Carrega preferências locais
      const l = (localStorage.getItem("lb_lang") as Lang | null) || "pt";
      setLang(l === "en" ? "en" : "pt");
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
      // Salva preferências no servidor
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
          throw new Error("Erro ao salvar no servidor");
        }
      }

      // Salva preferências locais
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
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] via-[#EEF3F7] to-[#E5E7EB] p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center shadow-lg shadow-[#2F6C92]/20">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#2F6C92]">Perfil e Preferências</h1>
                <p className="text-[#2F6C92]/80 text-lg">
                  Olá, <span className="font-semibold text-[#2F6C92]">{getPreferredFirstName(user?.name, user?.email)}</span>! 
                  Ajuste seu perfil, idioma e notificações.
                </p>
              </div>
            </div>
            <UserMenu userEmail={user?.email} userName={user?.name} />
          </div>
        </header>

        <section className="bg-white rounded-[26px] p-6 sm:p-8 shadow-[0_24px_45px_-20px_rgba(15,23,42,0.28)] border border-slate-200/90">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6C92]"></div>
              <span className="ml-3 text-[#2F6C92]">Carregando preferências...</span>
            </div>
          )}

          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            {/* Informações Pessoais */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-6 flex items-center gap-2">
                <span>👤</span> Informações Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-[#2F6C92]">Nome Completo</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent transition-all"
                    placeholder="Digite seu nome completo"
                    disabled={loading}
                  />
                </div>

                {/* Data de Nascimento */}
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
                    className={`w-full h-12 rounded-xl border px-4 outline-none focus:ring-2 transition-all ${
                      errors.birthDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#41B36E] focus:border-transparent'
                    }`}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={maxBirthDate}
                    minDate={minBirthDate}
                    disabled={loading}
                  />
                  {errors.birthDate && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span> {errors.birthDate}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Idade permitida: {MIN_AGE} a {MAX_AGE} anos</p>
                </div>
              </div>
            </div>

            {/* Preferências do Sistema */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold text-[#2F6C92] mb-6 flex items-center gap-2">
                <span>🔧</span> Preferências do Sistema
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Idioma */}
                <div className="space-y-2">
                  <label htmlFor="lang" className="text-sm font-semibold text-[#2F6C92]">Idioma da Interface</label>
                  <select
                    id="lang"
                    value={lang}
                    onChange={(e) => setLang((e.target.value as Lang) || "pt")}
                    className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-[#41B36E] focus:border-transparent bg-white transition-all"
                    disabled={loading}
                  >
                    <option value="pt">🇧🇷 Português (Brasil)</option>
                    <option value="en">🇺🇸 English (US)</option>
                  </select>
                </div>

                {/* Notificação semanal */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#2F6C92]">Notificações</label>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border border-gray-100">
                    <input
                      type="checkbox"
                      checked={notifyWeekly}
                      onChange={(e) => setNotifyWeekly(e.target.checked)}
                      className="peer sr-only"
                      id="notifyWeekly"
                    />
                    <label htmlFor="notifyWeekly" className="cursor-pointer">
                      <span className="h-6 w-11 rounded-full bg-gray-300 relative transition peer-checked:bg-[#41B36E] flex">
                        <span className={`absolute left-0 top-0 h-6 w-6 rounded-full bg-white border border-gray-300 transition-transform ${notifyWeekly ? 'translate-x-5' : 'translate-x-0'}`} />
                      </span>
                    </label>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2F6C92]">Lembrete Semanal</p>
                      <p className="text-xs text-gray-600">Receber notificação para revisar seu equilíbrio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex flex-col lg:flex-row gap-3">
                <button 
                  onClick={save} 
                  disabled={saving || loading}
                  className="h-14 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white font-semibold px-8 hover:from-[#10B981] hover:to-[#41B36E] hover:brightness-110 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 cursor-pointer min-w-[220px]"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Salvar Alterações
                    </>
                  )}
                </button>
                
                <button 
                  onClick={resetAssessment} 
                  disabled={loading}
                  className="h-14 rounded-xl border-2 border-[#F96B11] text-[#F96B11] font-semibold px-6 hover:bg-[#F96B11] hover:text-white hover:brightness-110 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer min-w-[220px]"
                >
                  <span>🔄</span>
                  Redefinir Avaliação
                </button>
                
                <button 
                  onClick={() => navigate(-1)} 
                  className="h-14 rounded-xl border-2 border-gray-300 text-gray-600 font-medium px-6 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer min-w-[150px]"
                >
                  <span>←</span>
                  Voltar
                </button>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="h-14 rounded-xl border-2 border-[#2F6C92] text-[#2F6C92] font-semibold px-6 hover:bg-[#F3F4F6] hover:border-[#2F6C92] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer min-w-[240px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4m8 0a4 4 0 01-4 4m0-8a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                  Gerenciar Assinatura
                </button>
            </div>
          </div>
          </div>

          {message && (
            <div className="mt-3 text-sm text-[#2F6C92] bg-[#F3F4F6] rounded-xl p-3">{message}</div>
          )}
        </section>
      </div>
    </div>
  );
}
