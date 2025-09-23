import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeGoogleCode } from "../services/authService";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        console.log('OAuth Callback URL:', url.href);
        
        // Só processa se estiver na rota de callback
        if (!url.pathname.includes('/oauth/callback')) {
          console.log('Não está na rota de callback, ignorando');
          return;
        }
        
        // Primeiro, tenta pegar o token do hash fragment (formato da API)
        let token = '';
        if (url.hash.includes('token=')) {
          token = url.hash.replace('#token=', '').split('&')[0];
          token = decodeURIComponent(token);
          console.log('Token encontrado no hash fragment');
        }
        
        // Se não encontrou no hash, tenta nos query parameters
        if (!token) {
          token = url.searchParams.get('token') || '';
          if (token) {
            console.log('Token encontrado nos query parameters');
          }
        }
        
        if (token) {
          console.log('Salvando token e redirecionando para assessment');
          localStorage.setItem('lb_token', token);
          // Pequeno delay para garantir que o token foi salvo
          setTimeout(() => {
            navigate('/assessment', { replace: true });
          }, 100);
          return;
        }
        
        // Se não tem token, tenta processar o código de autorização
        const code = url.searchParams.get('code');
        if (code) {
          console.log('Código de autorização encontrado, trocando por token');
          setError(null);
          try {
            const res = await exchangeGoogleCode(code);
            console.log('Token obtido com sucesso via código');
            localStorage.setItem('lb_token', res.token);
            // Pequeno delay para garantir que o token foi salvo
            setTimeout(() => {
              navigate('/assessment', { replace: true });
            }, 100);
            return;
          } catch (exchangeError: any) {
            console.error('Erro ao trocar código por token:', exchangeError);
            setError(`Erro ao processar código: ${exchangeError.message}`);
            setTimeout(() => navigate('/', { replace: true }), 5000);
            return;
          }
        }
        
        // Verificar se há erro nos parâmetros
        const error = url.searchParams.get('error');
        if (error) {
          console.error('Erro OAuth retornado:', error);
          setError(`Erro OAuth: ${error}`);
          setTimeout(() => navigate('/', { replace: true }), 5000);
          return;
        }
        
        // Se chegou aqui, algo deu errado
        console.error('Nenhum token, código ou erro encontrado na URL');
        setError('Nenhum token ou código de autorização encontrado');
        setTimeout(() => navigate('/', { replace: true }), 5000);
      } catch (e: any) {
        console.error('Erro no callback OAuth:', e);
        setError(e?.message || 'Erro ao processar autenticação');
        setTimeout(() => navigate('/', { replace: true }), 5000);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <div className="h-5 w-48 bg-[#F3F4F6] rounded mb-4" />
        <div className="h-24 w-full bg-[#F3F4F6] rounded" />
        {error ? (
          <div className="mt-4 text-sm text-red-600 text-center">
            <p className="font-medium">Erro na autenticação:</p>
            <p>{error}</p>
            <p className="mt-2 text-[#2F6C92]/70">Redirecionando...</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#2F6C92]/70 text-center">Conectando com o Google...</p>
        )}
      </div>
    </div>
  );
}
