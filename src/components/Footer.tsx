function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-[#2F6C92]/5 bg-white/5 backdrop-blur-sm text-center text-xs text-[#2F6C92]/50 font-light py-3 mt-8">
      Feito por GingaTech @ {year}
    </footer>
  );
}

export default Footer;
