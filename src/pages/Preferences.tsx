import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Perfil/Preferências – MVP
 * - Nome do usuário
 * - Idioma (pt/en)
 * - Notificação semanal (toggle)
 * - Redefinir avaliação (limpa localStorage lb_assessment)
 */

type Lang = "pt" | "en";

export default function Preferences() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [lang, setLang] = useState<Lang>("pt");
  const [notifyWeekly, setNotifyWeekly] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      setName(localStorage.getItem("lb_name") || "");
      const l = (localStorage.getItem("lb_lang") as Lang | null) || "pt";
      setLang(l === "en" ? "en" : "pt");
      setNotifyWeekly(localStorage.getItem("lb_notify_weekly") === "true");
    } catch {}
  }, []);

  function save() {
    localStorage.setItem("lb_name", name.trim());
    localStorage.setItem("lb_lang", lang);
    localStorage.setItem("lb_notify_weekly", String(notifyWeekly));
    setMessage("Preferências salvas!");
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
    <div className="min-h-screen bg-[#F3F4F6] p-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#F96B11]" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2F6C92]">Perfil e Preferências</h1>
          </div>
          <p className="text-[#2F6C92]/80 mt-1">Ajuste seu perfil, idioma e notificações.</p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow">
          {/* Nome */}
          <div className="grid gap-1.5 mb-4">
            <label htmlFor="name" className="text-sm font-medium text-[#2F6C92]">Nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border border-[#2F6C92]/20 px-3 outline-none focus:ring-2 focus:ring-[#41B36E]"
              placeholder="Seu nome"
            />
          </div>

          {/* Idioma */}
          <div className="grid gap-1.5 mb-4">
            <label htmlFor="lang" className="text-sm font-medium text-[#2F6C92]">Idioma</label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang((e.target.value as Lang) || "pt")}
              className="h-11 rounded-xl border border-[#2F6C92]/20 px-3 outline-none focus:ring-2 focus:ring-[#41B36E] bg-white"
            >
              <option value="pt">Português (Brasil)</option>
              <option value="en">English (US)</option>
            </select>
          </div>

          {/* Notificação semanal */}
          <div className="mb-6">
            <p className="text-sm font-medium text-[#2F6C92] mb-1">Notificação semanal</p>
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyWeekly}
                onChange={(e) => setNotifyWeekly(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-[#2F6C92]/20 relative transition peer-checked:bg-[#41B36E]/70">
                <span className="absolute left-0 top-0 h-6 w-6 -translate-y-0.5 translate-x-0.5 rounded-full bg-white border border-[#2F6C92]/20 transition peer-checked:translate-x-5" />
              </span>
              <span className="text-[#2F6C92] text-sm">Receber lembrete semanal para revisar meu equilíbrio</span>
            </label>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={save} className="h-11 rounded-xl bg-[#41B36E] text-white font-semibold px-6 hover:brightness-95">Salvar alterações</button>
            <button onClick={resetAssessment} className="h-11 rounded-xl border border-[#F96B11]/30 text-[#F96B11] font-medium px-6 hover:bg-[#F96B11]/10">Redefinir autoavaliação</button>
            <button onClick={() => navigate(-1)} className="h-11 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium px-6 hover:bg-[#F3F4F6]">Voltar</button>
          </div>

          {message && (
            <div className="mt-3 text-sm text-[#2F6C92] bg-[#F3F4F6] rounded-xl p-3">{message}</div>
          )}
        </section>
      </div>
    </div>
  );
}
