import { useEffect } from "react";

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tips: string[];
  onGoToGoals?: () => void;
}

export default function TipsModal({ isOpen, onClose, title, tips, onGoToGoals }: TipsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-1"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div>
          <h3 className="text-xl font-bold text-[#2F6C92] mb-2">{title}</h3>
          <p className="text-sm text-[#2F6C92]/80 mb-4">Sugestões de metas para impulsionar seu progresso nesta dimensão:</p>

          <ul className="space-y-2 mb-6">
            {(tips && tips.length > 0 ? tips : [
              'Defina uma meta pequena e atingível para começar',
              'Acompanhe o progresso diariamente por 1 semana',
              'Compartilhe sua meta com alguém de confiança'
            ]).map((t, i) => (
              <li key={i} className="p-3 rounded-lg bg-[#F3F4F6] text-sm text-[#2F6C92]">• {t}</li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium hover:bg-[#F3F4F6] transition-colors"
            >
              Fechar
            </button>
            {onGoToGoals && (
              <button
                onClick={onGoToGoals}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white font-medium hover:from-[#10B981] hover:to-[#41B36E] transition-colors shadow-lg"
              >
                Ir para Metas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
