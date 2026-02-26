import { useState } from "react";
import { useNavigate } from "react-router-dom";
import metriaLogo from "../assets/metria-logo.svg";
import Tooltip from "../components/Tooltip";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const eTrim = email.trim();

    if (!emailRegex.test(eTrim)) {
      setError("Por favor, insira um e-mail vÃ¡lido");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const API = import.meta.env.VITE_API_BASE_URL as string;
      const response = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: eTrim }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage("E-mail de recuperaÃ§Ã£o enviado! Verifique sua caixa de entrada e spam.");
      } else {
        await response.text();
        if (response.status === 404) {
          setError("E-mail nÃ£o encontrado em nossa base de dados.");
        } else {
          setError("Erro ao enviar e-mail de recuperaÃ§Ã£o. Tente novamente.");
        }
      }
    } catch (err) {
      setError("Erro de conexÃ£o. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-md rounded-2xl shadow-xl bg-white p-8 text-center">
          <div className="flex justify-center mb-6">
            <img
              src={metriaLogo}
              alt="Metria"
              className="w-32 drop-shadow-lg"
            />
          </div>

          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#2F6C92] mb-2">
              E-mail Enviado!
            </h2>
            <p className="text-[#2F6C92]/80 text-sm">
              Enviamos um link de recuperaÃ§Ã£o para <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-[#F3F4F6] rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-[#2F6C92] mb-2">PrÃ³ximos passos:</h3>
            <ul className="text-sm text-[#2F6C92]/80 space-y-1">
              <li>â€¢ Verifique sua caixa de entrada</li>
              <li>â€¢ Verifique a pasta de spam/lixo eletrÃ´nico</li>
              <li>â€¢ Clique no link para redefinir sua senha</li>
              <li>â€¢ O link expira em 1 hora</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full h-11 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition"
            >
              Voltar ao Login
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setMessage(null);
                setEmail("");
              }}
              className="w-full h-11 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium hover:bg-[#F3F4F6] transition"
            >
              Enviar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-white p-8">
        <div className="flex justify-center mb-6">
          <img
            src={metriaLogo}
            alt="Metria"
            className="w-32 drop-shadow-lg"
          />
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-[#2F6C92] mb-2">
            Esqueceu sua senha?
          </h2>
          <p className="text-[#2F6C92]/80 text-sm">
            Digite seu e-mail e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[#2F6C92]"
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
                className={`w-full h-11 rounded-xl px-3 outline-none focus:ring-2 border ${
                  error 
                    ? "border-red-400 focus:ring-red-300 pr-10" 
                    : "border-[#2F6C92]/20 focus:ring-[#41B36E]"
                }`}
                placeholder="voce@exemplo.com"
                title="Por favor, insira um endereÃ§o de e-mail vÃ¡lido"
              />
              {error && (
                <Tooltip content={error} type="error" position="bottom">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition disabled:opacity-60"
          >
            {isLoading ? "Enviando..." : "Enviar Link de RecuperaÃ§Ã£o"}
          </button>
        </form>

        {message && (
          <Tooltip 
            content="E-mail enviado com sucesso! Verifique sua caixa de entrada." 
            type="success"
            position="top"
          >
            <div className="mt-4 text-sm rounded-xl p-3 cursor-help transition-all duration-200 text-green-700 bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{message}</span>
              </div>
            </div>
          </Tooltip>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-[#F96B11] hover:underline font-medium"
          >
            â† Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
}
