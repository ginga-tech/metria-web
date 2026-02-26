import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Verifica se está rodando em um popup
      const isPopup = window.opener && window.opener !== window;
      
      try {
        const url = new URL(window.location.href);
        console.log('OAuth Callback URL:', url.href);
        
        // CORREÇÃO TEMPORÁRIA: Se estiver na porta 5174, redireciona para 5173
        if (url.port === '5174') {
          console.log('Detectada porta 5174, redirecionando para 5173');
          const newUrl = url.href.replace('localhost:5174', 'localhost:5173');
          window.location.replace(newUrl);
          return;
        }
        
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
          token = token.replace(/^Bearer\s+/i, '');
          console.log('Token encontrado no hash fragment');
        }
        
        // Se não encontrou no hash, tenta nos query parameters
        if (!token) {
          token = url.searchParams.get('token') || '';
          if (token) {
            token = token.replace(/^Bearer\s+/i, '');
            console.log('Token encontrado nos query parameters');
          }
        }
        
        if (token) {
          console.log('Token encontrado:', token.substring(0, 20) + '...');
          try { sessionStorage.removeItem('oauth_google_forwarded_code'); } catch {}
          
          if (isPopup) {
            // Se está em popup, envia mensagem para a janela pai
            console.log('Enviando token via postMessage para janela pai');
            window.opener.postMessage({
              type: 'OAUTH_RESULT',
              success: true,
              token: token
            }, '*');
            window.close();
            return;
          } else {
            // Se não está em popup, comportamento normal
            console.log('Salvando token normalizado e redirecionando para assessment');
            localStorage.setItem('lb_token', token.replace(/^Bearer\s+/i, ''));
            setTimeout(() => {
              navigate('/assessment', { replace: true });
            }, 100);
            return;
          }
        }
        
        // Se não tem token, tenta processar o código de autorização
        const code = url.searchParams.get('code');
        if (code) {
          const state = url.searchParams.get('state') || '';
          const forwardedCodeKey = 'oauth_google_forwarded_code';
          const alreadyForwarded = (() => {
            try { return sessionStorage.getItem(forwardedCodeKey) === code; } catch { return false; }
          })();

          if (!alreadyForwarded) {
            try { sessionStorage.setItem(forwardedCodeKey, code); } catch {}
            const API = import.meta.env.VITE_API_BASE_URL as string;
            const backendCallbackUrl = new URL(`${API}/api/auth/google/callback`);
            backendCallbackUrl.searchParams.set('code', code);
            if (state) backendCallbackUrl.searchParams.set('state', state);

            console.log('Encaminhando codigo de autorizacao para callback do backend');
            window.location.replace(backendCallbackUrl.toString());
            return;
          }

          console.error('Codigo OAuth ja foi encaminhado e retornou sem token');
          setError('Nao foi possivel concluir o login com Google. Verifique a configuracao do backend OAuth.');
          setTimeout(() => navigate('/', { replace: true }), 5000);
          return;
        }

        const error = url.searchParams.get('error');
        if (error) {
          console.error('Erro OAuth retornado:', error);
          const errorMessage = `Erro OAuth: ${error}`;
          
          if (isPopup) {
            // Se está em popup, envia erro para a janela pai
            window.opener.postMessage({
              type: 'OAUTH_RESULT',
              success: false,
              error: errorMessage
            }, window.location.origin);
            window.close();
            return;
          } else {
            setError(errorMessage);
            setTimeout(() => navigate('/', { replace: true }), 5000);
            return;
          }
        }
        
        // Se chegou aqui, algo deu errado
        console.error('Nenhum token, código ou erro encontrado na URL');
        const errorMessage = 'Nenhum token ou código de autorização encontrado';
        
        if (isPopup) {
          // Se está em popup, envia erro para a janela pai
          window.opener.postMessage({
            type: 'OAUTH_RESULT',
            success: false,
            error: errorMessage
          }, window.location.origin);
          window.close();
          return;
        } else {
          setError(errorMessage);
          setTimeout(() => navigate('/', { replace: true }), 5000);
        }
      } catch (e: any) {
        console.error('Erro no callback OAuth:', e);
        const errorMessage = e?.message || 'Erro ao processar autenticação';
        
        if (isPopup) {
          // Se está em popup, envia erro para a janela pai
          window.opener.postMessage({
            type: 'OAUTH_RESULT',
            success: false,
            error: errorMessage
          }, window.location.origin);
          window.close();
          return;
        } else {
          setError(errorMessage);
          setTimeout(() => navigate('/', { replace: true }), 5000);
        }
      }
    })();
  }, [navigate]);

  return (
    <div className="relative min-h-screen grid place-items-center overflow-hidden bg-[#F2F5F8] p-4 sm:p-6">
      <div className="relative z-10 w-full max-w-md rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.25)] text-center">
        <div className="h-5 w-48 bg-[#F3F4F6] rounded mb-4" />
        <div className="h-24 w-full bg-[#F3F4F6] rounded" />
        {error ? (
          <div className="mt-4 text-sm text-red-600 text-center">
            <p className="font-medium">Erro na autenticação:</p>
            <p>{error}</p>
            <p className="mt-2 text-slate-500">Redirecionando...</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 text-center">Conectando com o Google...</p>
        )}
      </div>
    </div>
  );
}
