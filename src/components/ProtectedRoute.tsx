import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSmartRedirect } from '../hooks/useSmartRedirect';
import PageLoader from './PageLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading } = useSmartRedirect();
  const token = localStorage.getItem('lb_token');
  
  // Se não tem token, redireciona para login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Mostra loading enquanto verifica o status do usuário
  if (loading) {
    return <PageLoader message="Verificando seu progresso..." />;
  }

  // O hook useSmartRedirect já fez os redirecionamentos necessários
  // Se chegou aqui, pode renderizar o conteúdo
  return <>{children}</>;
}
