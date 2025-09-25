import { useState, useCallback } from 'react';

interface UseGoogleOAuthResult {
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<string | null>;
}

export function useGoogleOAuth(): UseGoogleOAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const API = import.meta.env.VITE_API_BASE_URL as string;
      // FORÇA a porta 5173 para evitar problemas com configuração do Google Console
      const redirectUri = `http://localhost:5173/oauth/callback`;
      const authUrl = `${API}/api/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`;

      // Configurações do popup
      const popupWidth = 500;
      const popupHeight = 600;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        authUrl,
        'google-oauth',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Popup bloqueado. Permita popups para este site e tente novamente.');
      }

      // Monitora o popup usando postMessage
      return new Promise<string | null>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            setIsLoading(false);
            reject(new Error('Login cancelado pelo usuário'));
          }
        }, 1000);

        // Handler para receber mensagens do popup
        const messageHandler = (event: MessageEvent) => {
          // Verifica se a mensagem vem do popup
          if (event.source !== popup) return;
          
          // Verifica se é uma mensagem OAuth
          if (event.data && event.data.type === 'OAUTH_RESULT') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            popup.close();
            setIsLoading(false);
            
            if (event.data.success) {
              resolve(event.data.token);
            } else {
              reject(new Error(event.data.error || 'Erro no OAuth'));
            }
          }
        };

        // Adiciona listener para mensagens
        window.addEventListener('message', messageHandler);

        // Monitora mudanças na URL do popup (fallback)
        const checkAuth = setInterval(() => {
          try {
            // Tenta acessar a URL do popup
            const popupUrl = popup.location.href;
            
            // Se conseguiu acessar, significa que está no mesmo domínio
            if (popupUrl.includes('localhost:5173')) {
              const url = new URL(popupUrl);
              
              // Verifica se tem token no hash
              if (url.hash.includes('token=')) {
                const token = url.hash.replace('#token=', '').split('&')[0];
                const decodedToken = decodeURIComponent(token);
                
                clearInterval(checkAuth);
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                popup.close();
                setIsLoading(false);
                resolve(decodedToken);
                return;
              }

              // Verifica se tem código para trocar por token
              const code = url.searchParams.get('code');
              if (code) {
                clearInterval(checkAuth);
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                popup.close();
                
                // Troca código por token
                exchangeCodeForToken(code)
                  .then(token => {
                    setIsLoading(false);
                    resolve(token);
                  })
                  .catch(err => {
                    setIsLoading(false);
                    reject(err);
                  });
                return;
              }

              // Verifica se há erro
              const error = url.searchParams.get('error');
              if (error) {
                clearInterval(checkAuth);
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                popup.close();
                setIsLoading(false);
                reject(new Error(`Erro OAuth: ${error}`));
                return;
              }
            }
          } catch (e) {
            // Erro de CORS - popup ainda está em domínio externo (Google)
            // Continua monitorando
          }
        }, 500);

        // Timeout de 5 minutos
        setTimeout(() => {
          clearInterval(checkAuth);
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (!popup.closed) {
            popup.close();
          }
          setIsLoading(false);
          reject(new Error('Timeout: Login demorou muito para ser concluído'));
        }, 300000);
      });

    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err?.message || 'Erro ao fazer login com Google';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    isLoading,
    error,
    loginWithGoogle
  };
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  // FORÇA a porta 5173 para manter consistência
  const redirectUri = `http://localhost:5173/oauth/callback`;
  
  const response = await fetch(`${API}/api/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, redirectUri }),
  });

  if (!response.ok) {
    throw new Error('Erro ao trocar código por token');
  }

  const data = await response.json();
  return data.token;
}
