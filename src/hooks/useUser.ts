import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserInfo {
  email: string;
  name?: string;
  birthDate?: string;
}

function clearAuthData() {
  localStorage.removeItem("lb_token");
  localStorage.removeItem("lb_goals");
  localStorage.removeItem("lb_assessment");
  localStorage.removeItem("lb_user_data");

  sessionStorage.removeItem("editAssessment");
  sessionStorage.clear();

  document.cookie.split(";").forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  });
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    clearAuthData();
    setUser(null);
    navigate("/", { replace: true });
    window.location.reload();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("lb_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const API = import.meta.env.VITE_API_BASE_URL as string;
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const preferencesResponse = await fetch(`${API}/api/user/preferences`, { headers });

        if (preferencesResponse.ok) {
          const userData = await preferencesResponse.json();
          setUser({
            email: userData.email,
            name: userData.name,
            birthDate: userData.birthDate,
          });
          return;
        }

        if (preferencesResponse.status === 401 || preferencesResponse.status === 403) {
          logout();
          return;
        }

        const meResponse = await fetch(`${API}/api/me`, { headers });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          setUser({
            email: meData.email,
            name: meData.name,
          });
          return;
        }

        if (meResponse.status === 401 || meResponse.status === 403) {
          logout();
          return;
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, logout };
}
