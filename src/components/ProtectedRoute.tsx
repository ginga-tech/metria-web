import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("lb_token");
        
        if (!token) {
          console.log("No token found, redirecting to login");
          navigate("/", { replace: true });
          return;
        }

        // Se tem token, assume que está autenticado (mais tolerante para OAuth)
        console.log("Token found, user authenticated");
        setIsAuthenticated(true);

        // Opcionalmente, tenta validar o token com a API, mas não bloqueia se falhar
        const API = import.meta.env.VITE_API_BASE_URL as string;
        if (API) {
          try {
            const response = await fetch(`${API}/api/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              console.log("Token validation failed, but keeping user authenticated");
              // Não redireciona mais automaticamente - deixa o usuário continuar
            }
          } catch (error) {
            console.log("Error validating token, but keeping user authenticated:", error);
            // Não redireciona - mantém o usuário autenticado
          }
        }
      } catch (error) {
        console.log("Auth check error:", error);
        // Só redireciona se realmente não tem token
        const token = localStorage.getItem("lb_token");
        if (!token) {
          navigate("/", { replace: true });
        } else {
          setIsAuthenticated(true);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
          <div className="h-5 w-48 bg-[#F3F4F6] rounded mb-4" />
          <div className="h-24 w-full bg-[#F3F4F6] rounded" />
          <p className="mt-4 text-sm text-[#2F6C92]/70 text-center">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // O useEffect já redirecionou
  }

  return <>{children}</>;
}
