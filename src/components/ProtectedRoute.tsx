import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSmartRedirect } from '../hooks/useSmartRedirect';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, userStatus } = useSmartRedirect();
  const token = localStorage.getItem('lb_token');
  
  // Se não tem token, redireciona para login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Mostra loading enquanto verifica o status do usuário
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
          <div className="h-5 w-48 bg-[#F3F4F6] rounded mb-4" />
          <div className="h-24 w-full bg-[#F3F4F6] rounded" />
          <p className="mt-4 text-sm text-[#2F6C92]/70 text-center">Verificando seu progresso...</p>
        </div>
      </div>
    );
  }

  // O hook useSmartRedirect já fez os redirecionamentos necessários
  // Se chegou aqui, pode renderizar o conteúdo
  return <>{children}</>;
}
