import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from './PageLoader';

/**
 * GlobalLoader - Componente de loading global simples para transições de página
 * Aparece automaticamente durante mudanças de rota
 */

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const getLoadingMessage = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Carregando dashboard...';
    if (pathname.startsWith('/assessment')) return 'Carregando autoavaliação...';
    if (pathname.startsWith('/goals')) return 'Carregando metas...';
    if (pathname.startsWith('/preferences')) return 'Carregando preferências...';
    if (pathname.startsWith('/subscriptions')) return 'Carregando assinaturas...';
    if (pathname.startsWith('/forgot-password')) return 'Carregando recuperação de senha...';
    if (pathname.startsWith('/reset-password')) return 'Carregando redefinição de senha...';
    return 'Carregando página...';
  };

  useEffect(() => {
    // Mostra o loader quando a rota muda
    setIsLoading(true);
    
    // Esconde o loader após um pequeno delay para permitir que a página carregue
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading) return null;

  return <PageLoader overlay message={getLoadingMessage(location.pathname)} />;
}
