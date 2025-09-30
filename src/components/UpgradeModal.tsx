interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseMonthly: () => void;
  onChooseAnnual: () => void;
  monthlyPriceLabel?: string;
  annualPriceLabel?: string;
  disabled?: boolean;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onChooseMonthly,
  onChooseAnnual,
  monthlyPriceLabel = 'R$ 14,90/mês',
  annualPriceLabel = 'R$ 11,90/mês (cobrança anual)',
  disabled,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full mx-4 sm:mx-6 border border-gray-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2F6C92]/60 hover:text-[#2F6C92] transition-colors p-2 rounded-lg hover:bg-[#F3F4F6]"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2F6C92] to-[#41B36E] flex items-center justify-center text-white">★</div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#2F6C92] leading-tight">Desbloqueie Metas Ilimitadas</h3>
              <p className="text-[#2F6C92]/80 text-sm mt-1">Você atingiu o limite do plano gratuito. Assine para continuar criando metas.</p>
            </div>
          </div>

          {/* Botões do site (redirecionam para Payment Links) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onChooseMonthly}
              disabled={disabled}
              className="p-4 rounded-2xl border-2 border-[#2F6C92] text-[#2F6C92] hover:bg-[#2F6C92] hover:text-white transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.99]"
            >
              Plano Mensal
              <div className="text-sm font-medium opacity-80 mt-1">{monthlyPriceLabel}</div>
            </button>

            <button
              onClick={onChooseAnnual}
              disabled={disabled}
              className="p-4 rounded-2xl bg-gradient-to-r from-[#41B36E] to-[#10B981] text-white hover:from-[#10B981] hover:to-[#41B36E] transition-colors font-semibold cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.99]"
            >
              Plano Anual
              <div className="text-sm font-medium opacity-90 mt-1">{annualPriceLabel}</div>
            </button>
          </div>

          {/* Sem Stripe Buy Button embutido: apenas botões do site */}

          <div className="mt-5 text-xs text-gray-500">
            Você pode cancelar quando quiser. O plano anual é cobrado de uma só vez.
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[#2F6C92]/20 text-[#2F6C92] font-medium hover:bg-[#F3F4F6] transition-colors">
              Continuar no gratuito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
