import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserStatus {
  hasAssessment: boolean;
  hasGoals: boolean;
  lastAssessmentDate: string | null;
  email: string;
  name: string;
}

export function useSmartRedirect() {
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = localStorage.getItem('lb_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const API = import.meta.env.VITE_API_BASE_URL as string;
        const response = await fetch(`${API}/api/user/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const status = await response.json();
          setUserStatus(status);
          
          // Lógica de redirecionamento inteligente
          const currentPath = window.location.pathname;
          
          // Se está na página de login/cadastro e tem assessment, redireciona para dashboard
          if ((currentPath === '/' || currentPath === '/login') && status.hasAssessment) {
            navigate('/dashboard', { replace: true });
            return;
          }
          
          // Se está tentando acessar assessment mas já tem um, redireciona para dashboard
          if (currentPath === '/assessment' && status.hasAssessment) {
            // Permite editar assessment se vier do menu do usuário
            const fromUserMenu = sessionStorage.getItem('editAssessment');
            if (!fromUserMenu) {
              navigate('/dashboard', { replace: true });
              return;
            } else {
              sessionStorage.removeItem('editAssessment');
            }
          }
          
          // Se não tem assessment e não está na página de assessment, redireciona
          if (!status.hasAssessment && currentPath !== '/assessment' && currentPath !== '/' && currentPath !== '/login') {
            navigate('/assessment', { replace: true });
            return;
          }
          
        } else {
          // Token inválido, remove do localStorage
          localStorage.removeItem('lb_token');
        }
      } catch (error) {
        console.error('Erro ao verificar status do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  return { loading, userStatus };
}
