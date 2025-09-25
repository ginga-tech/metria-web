import { useEffect } from "react";

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OAuthModal({ isOpen, onClose }: OAuthModalProps) {
  // Previne scroll da página quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fecha modal ao pressionar ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Google Icon */}
          <div className="mx-auto w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.2-1.6 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.9 3.7 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1-.1-1H12z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-[#2F6C92] mb-2">
            Conectando com Google
          </h3>
          
          <p className="text-[#2F6C92]/80 text-sm mb-6">
            Uma nova janela foi aberta para autenticação. Complete o login no popup para continuar.
          </p>

          {/* Loading Animation */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#41B36E]"></div>
          </div>

          {/* Instructions */}
          <div className="bg-[#F3F4F6] rounded-xl p-4 text-left">
            <h4 className="font-medium text-[#2F6C92] mb-2 text-sm">Instruções:</h4>
            <ul className="text-xs text-[#2F6C92]/80 space-y-1">
              <li>• Complete o login na janela popup</li>
              <li>• Não feche esta janela</li>
              <li>• Se o popup não abrir, verifique se está bloqueado</li>
              <li>• Pressione ESC para cancelar</li>
            </ul>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="mt-6 w-full h-10 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium hover:bg-[#F3F4F6] transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
