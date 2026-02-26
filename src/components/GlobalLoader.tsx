import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * GlobalLoader - Componente de loading global simples para transições de página
 * Aparece automaticamente durante mudanças de rota
 */

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

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

  return (
    <>
      <style>{`
        .simple-loader {
          width: 45px;
          aspect-ratio: 1;
          --c1: no-repeat linear-gradient(#41B36E 0 0);
          --c2: no-repeat linear-gradient(#2F6C92 0 0);
          --c3: no-repeat linear-gradient(#F96B11 0 0);
          background: var(--c1), var(--c2), var(--c3);
          animation: 
            loader-size 1s infinite,
            loader-position 1s infinite;
        }
        @keyframes loader-size {
          0%, 100% { background-size: 20% 100%; }
          33%, 66% { background-size: 20% 40%; }
        }
        @keyframes loader-position {
          0%, 33%   { background-position: 0 0, 50% 100%, 100% 100%; }
          66%, 100% { background-position: 100% 0, 0 100%, 50% 100%; }
        }
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {/* Loader simples com cores da logo */}
          <div className="simple-loader"></div>
          
          {/* Texto opcional */}
          <div className="text-center">
            <p className="text-sm font-medium text-[#2F6C92]">Metria</p>
          </div>
        </div>
      </div>
    </>
  );
}
