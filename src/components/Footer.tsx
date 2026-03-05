function Footer() {
  const year = new Date().getFullYear();
  const showCommitVersion = true;
  const commitSha = (import.meta.env.VITE_COMMIT_SHA as string | undefined)?.trim() || "unknown";
  const commitDateRaw = (import.meta.env.VITE_COMMIT_DATE as string | undefined)?.trim();
  const commitDate = commitDateRaw
    ? new Date(commitDateRaw).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "data indisponivel";

  return (
    <footer className="w-full border-t border-[#2F6C92]/5 bg-white/5 backdrop-blur-sm text-xs text-[#2F6C92]/50 font-light py-3 mt-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span>Feito por GingaTech @ {year}</span>
        {showCommitVersion && (
          <span className="text-[#2F6C92]/60 sm:text-right">
            showCommitVersion: {commitSha} | {commitDate}
          </span>
        )}
      </div>
    </footer>
  );
}

export default Footer;