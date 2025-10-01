import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserInfo {
  email: string;
  name?: string;
}

// Função para limpar todos os dados de autenticação e cache
function clearAuthData() {
  // Remove token do localStorage
  localStorage.removeItem('lb_token');
  
  // Remove dados específicos da aplicação
  localStorage.removeItem('lb_goals');
  localStorage.removeItem('lb_assessment');
  localStorage.removeItem('lb_user_data');
  
  // Remove dados do sessionStorage
  sessionStorage.removeItem('editAssessment');
  sessionStorage.clear();
  
  // Limpa cookies relacionados à autenticação
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
  });
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    clearAuthData();
    setUser(null);
    navigate('/', { replace: true });
    // Força reload da página para limpar qualquer estado residual
    window.location.reload();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('lb_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const API = import.meta.env.VITE_API_BASE_URL as string;
        const response = await fetch(`${API}/api/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({ 
            email: userData.email,
            name: userData.name 
          });
        } else {
          // Só força logout com 401/403. Para outros erros, mantém sessão e tenta novamente depois.
          if (response.status === 401 || response.status === 403) {
            console.log('Token inválido (', response.status, '), fazendo logout automático...');
            logout();
          } else {
            console.warn('Falha ao buscar /me (status:', response.status, '). Mantendo sessão.');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        // Em erro de rede, mantém sessão para evitar logout indevido
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, logout };
}
