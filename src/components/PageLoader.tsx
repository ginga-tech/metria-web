interface PageLoaderProps {
  message?: string;
  overlay?: boolean;
}

export default function PageLoader({ message = "Carregando...", overlay = false }: PageLoaderProps) {
  const containerClass = overlay
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
    : "min-h-screen grid place-items-center bg-[#F3F4F6] p-4";

  return (
    <div className={containerClass}>
      <style>{`
        .metria-color-loader {
          width: 45px;
          aspect-ratio: 1;
          --c1: no-repeat linear-gradient(#41B36E 0 0);
          --c2: no-repeat linear-gradient(#2F6C92 0 0);
          --c3: no-repeat linear-gradient(#F96B11 0 0);
          background: var(--c1), var(--c2), var(--c3);
          animation:
            metria-loader-size 1s infinite,
            metria-loader-position 1s infinite;
        }
        @keyframes metria-loader-size {
          0%, 100% { background-size: 20% 100%; }
          33%, 66% { background-size: 20% 40%; }
        }
        @keyframes metria-loader-position {
          0%, 33%   { background-position: 0 0, 50% 100%, 100% 100%; }
          66%, 100% { background-position: 100% 0, 0 100%, 50% 100%; }
        }
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <div className="metria-color-loader" />
        <p className="text-sm text-[#2F6C92]/70 text-center">{message}</p>
      </div>
    </div>
  );
}
