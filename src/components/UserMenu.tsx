import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UserMenuProps {
  userEmail?: string;
}

export default function UserMenu({ userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('lb_token');
    navigate('/', { replace: true });
  };

  const handleEditAssessment = () => {
    // Marca que o usuário quer editar o assessment (para permitir acesso mesmo tendo um)
    sessionStorage.setItem('editAssessment', 'true');
    navigate('/assessment');
    setIsOpen(false);
  };

  const handleEditProfile = () => {
    navigate('/preferences');
    setIsOpen(false);
  };

  const handleGoToGoals = () => {
    navigate('/goals');
    setIsOpen(false);
  };

  // Pega as iniciais do email para o avatar
  const getInitials = (email: string) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2F6C92] text-white font-medium hover:bg-[#2F6C92]/90 transition-colors"
        aria-label="Menu do usuário"
      >
        {userEmail ? getInitials(userEmail) : 'U'}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg border border-[#2F6C92]/10 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[#2F6C92]/10">
            <p className="text-sm font-medium text-[#2F6C92]">Conectado como:</p>
            <p className="text-sm text-[#2F6C92]/80 truncate">{userEmail || 'Usuário'}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleGoToGoals}
              className="w-full px-4 py-2 text-left text-sm text-[#2F6C92] hover:bg-[#F3F4F6] flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <circle cx="12" cy="12" r="3" strokeWidth={2} />
              </svg>
              Definir Metas
            </button>

            <button
              onClick={handleEditAssessment}
              className="w-full px-4 py-2 text-left text-sm text-[#2F6C92] hover:bg-[#F3F4F6] flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Editar Assessment
            </button>

            <button
              onClick={handleEditProfile}
              className="w-full px-4 py-2 text-left text-sm text-[#2F6C92] hover:bg-[#F3F4F6] flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Dados Pessoais
            </button>

            <div className="border-t border-[#2F6C92]/10 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-[#F96B11] hover:bg-[#F96B11]/5 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
