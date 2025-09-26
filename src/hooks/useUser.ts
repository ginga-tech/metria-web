import { useState, useEffect } from 'react';

interface UserInfo {
  email: string;
  name?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Token inválido, remove do localStorage
          localStorage.removeItem('lb_token');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
