import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import lifeBalanceLogo from "../assets/lifebalance-logo.svg";
import Tooltip from "../components/Tooltip";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    
    // Verificar se o token Ã© vÃ¡lido
    validateToken();
  }, [token, navigate]);

  async function validateToken() {
    try {
      const API = import.meta.env.VITE_API_BASE_URL as string;
      const response = await fetch(`${API}/api/auth/validate-reset-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      setTokenValid(response.ok);
      
      if (!response.ok) {
        setMessage("Link de recuperaÃ§Ã£o invÃ¡lido ou expirado.");
      }
    } catch (err) {
      setTokenValid(false);
      setMessage("Erro ao validar link de recuperaÃ§Ã£o.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: { password?: string; confirmPassword?: string } = {};

    if (!password || password.length < 6) {
      next.password = "A senha deve ter pelo menos 6 caracteres";
    }
    if (password !== confirmPassword) {
      next.confirmPassword = "As senhas nÃ£o coincidem";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsLoading(true);

    try {
      const API = import.meta.env.VITE_API_BASE_URL as string;
      const response = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token, 
          newPassword: password 
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Senha redefinida com sucesso!");
      } else {
        await response.text();
        if (response.status === 400) {
          setMessage("Link de recuperaÃ§Ã£o invÃ¡lido ou expirado.");
        } else {
          setMessage("Erro ao redefinir senha. Tente novamente.");
        }
      }
    } catch (err) {
      setMessage("Erro de conexÃ£o. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-md rounded-2xl shadow-xl bg-white p-8 text-center">
          <div className="flex justify-center mb-6">
            <img
              src={lifeBalanceLogo}
              alt="LifeBalance"
              className="w-32 drop-shadow-lg"
            />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#41B36E] mx-auto"></div>
          <p className="mt-4 text-[#2F6C92]/80">Validando link de recuperaÃ§Ã£o...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-md rounded-2xl shadow-xl bg-white p-8 text-center">
          <div className="flex justify-center mb-6">
            <img
              src={lifeBalanceLogo}
              alt="LifeBalance"
              className="w-32 drop-shadow-lg"
            />
          </div>

          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#2F6C92] mb-2">
              Link InvÃ¡lido
            </h2>
            <p className="text-[#2F6C92]/80 text-sm">
              Este link de recuperaÃ§Ã£o Ã© invÃ¡lido ou jÃ¡ expirou.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full h-11 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition"
            >
              Solicitar Novo Link
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full h-11 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium hover:bg-[#F3F4F6] transition"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-md rounded-2xl shadow-xl bg-white p-8 text-center">
          <div className="flex justify-center mb-6">
            <img
              src={lifeBalanceLogo}
              alt="LifeBalance"
              className="w-32 drop-shadow-lg"
            />
          </div>

          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#2F6C92] mb-2">
              Senha Redefinida!
            </h2>
            <p className="text-[#2F6C92]/80 text-sm">
              Sua senha foi alterada com sucesso. Agora vocÃª pode fazer login com sua nova senha.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full h-11 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-white p-8">
        <div className="flex justify-center mb-6">
          <img
            src={lifeBalanceLogo}
            alt="LifeBalance"
            className="w-32 drop-shadow-lg"
          />
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-[#2F6C92] mb-2">
            Nova Senha
          </h2>
          <p className="text-[#2F6C92]/80 text-sm">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[#2F6C92]"
            >
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full h-11 rounded-xl px-3 outline-none focus:ring-2 border ${
                  errors.password 
                    ? "border-red-400 focus:ring-red-300 pr-20" 
                    : "border-[#2F6C92]/20 focus:ring-[#41B36E] pr-12"
                }`}
                placeholder="********"
                title="A senha deve ter pelo menos 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1 ${
                  errors.password ? "right-10" : "right-3"
                }`}
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

          <div className="grid gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-[#2F6C92]"
            >
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full h-11 rounded-xl px-3 outline-none focus:ring-2 border ${
                  errors.confirmPassword 
                    ? "border-red-400 focus:ring-red-300 pr-20" 
                    : "border-[#2F6C92]/20 focus:ring-[#41B36E] pr-12"
                }`}
                placeholder="********"
                title="Confirme sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1 ${
                  errors.confirmPassword ? "right-10" : "right-3"
                }`}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#41B36E] text-white font-medium hover:brightness-95 transition disabled:opacity-60"
          >
            {isLoading ? "Redefinindo..." : "Redefinir Senha"}
          </button>
        </form>

        {message && !isSuccess && (
          <Tooltip 
            content="Erro ao redefinir senha. Tente novamente ou solicite um novo link." 
            type="error"
            position="top"
          >
            <div className="mt-4 text-sm rounded-xl p-3 cursor-help transition-all duration-200 text-red-700 bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
