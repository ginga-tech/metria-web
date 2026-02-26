import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { getSubscriptionStatus, syncSubscription } from "./services/billingService";
import MetriaAuth from "./pages/MetriaAuth";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/DashboardReordered";
import Preferences from "./pages/Preferences";
import Subscriptions from "./pages/Subscriptions";
import Goals from "./pages/Goals";
import OAuthCallback from "./pages/OAuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalLoader from "./components/GlobalLoader";
import Footer from "./components/Footer";

// Layout component que inclui o GlobalLoader
function CheckoutAutoClose() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get('checkout');
      if (checkout === 'success' || checkout === 'cancel') {
        try {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage({ type: 'lb:checkout', status: checkout }, window.location.origin);
            window.close();
            return;
          }
        } catch {
          // ignore postMessage errors
        }

        // Fallback: se não é popup (mesma aba), e houve sucesso, iniciar sync + polling mais agressivo
        if (checkout === 'success') {
          console.log('🎉 Checkout success detected, starting subscription sync...');
          
          // Tenta sincronizar imediatamente
          (async () => { 
            try { 
              console.log('🔄 Attempting immediate sync...');
              const result = await syncSubscription(); 
              console.log('✅ Immediate sync result:', result);
            } catch (error) {
              console.log('❌ Immediate sync failed:', error);
            }
          })();
          
          const started = Date.now();
          const timeoutMs = 5 * 60 * 1000; // 5 minutos (aumentado)
          const interval = 2000; // 2s (mais frequente)
          let attempts = 0;
          const maxAttempts = 150; // 5 minutos / 2s = 150 tentativas
          
          const poll = window.setInterval(async () => {
            attempts++;
            console.log(`🔍 Polling attempt ${attempts}/${maxAttempts}...`);
            
            try {
              // Primeiro tenta sync novamente
              if (attempts % 5 === 0) { // A cada 10 segundos
                console.log('🔄 Attempting sync again...');
                try {
                  await syncSubscription();
                } catch (syncError) {
                  console.log('❌ Sync retry failed:', syncError);
                }
              }
              
              // Verifica status
              const info = await getSubscriptionStatus();
              console.log('📊 Subscription status:', info);
              
              if (info?.active) {
                console.log('🎉 Subscription activated! Stopping polling.');
                try { sessionStorage.setItem('lb_show_sub_banner', '1'); } catch {}
                window.clearInterval(poll);
                // Força reload da página para atualizar UI
                window.location.reload();
              } else if (Date.now() - started > timeoutMs || attempts >= maxAttempts) {
                console.log('⏰ Polling timeout reached. Stopping.');
                window.clearInterval(poll);
              }
            } catch (error) {
              console.log('❌ Polling error:', error);
              if (Date.now() - started > timeoutMs || attempts >= maxAttempts) {
                console.log('⏰ Polling timeout reached after error. Stopping.');
                window.clearInterval(poll);
              }
            }
          }, interval);
        }
      }
    } catch {
      // ignore
    }
    // Also listen for popup messages globally and trigger sync + polling
    function onMessage(e: MessageEvent) {
      try {
        if (e.origin !== window.location.origin) return;
        const data: any = e.data || {};
        if (data?.type === 'lb:checkout') {
          (async () => {
            if (data?.status === 'success') {
              try { await syncSubscription(); } catch {}
            }
            // Start a short polling period to reflect state
            const started = Date.now();
            const timeoutMs = 2 * 60 * 1000;
            const interval = 2000;
            const poll = window.setInterval(async () => {
              try {
                const info = await getSubscriptionStatus();
                if (info?.active) {
                  window.clearInterval(poll);
                  try { sessionStorage.setItem('lb_show_sub_banner', '1'); } catch {}
                  window.location.reload();
                } else if (Date.now() - started > timeoutMs) {
                  window.clearInterval(poll);
                }
              } catch {
                if (Date.now() - started > timeoutMs) {
                  window.clearInterval(poll);
                }
              }
            }, interval);
          })();
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return null as any;
}

function Layout() {
  return (
    <>
      <CheckoutAutoClose />
      <Outlet />
      <Footer />
      <GlobalLoader />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MetriaAuth /> },
      { 
        path: "assessment", 
        element: (
          <ProtectedRoute>
            <Assessment />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "dashboard", 
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "preferences", 
        element: (
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "subscriptions", 
        element: (
          <ProtectedRoute>
            <Subscriptions />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "goals", 
        element: (
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        ) 
      },
      { path: "oauth/callback", element: <OAuthCallback /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
