import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { getSubscriptionStatus, syncSubscription } from "./services/billingService";
import LifeBalanceAuth from "./pages/LifeBalanceAuth";
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

        // Fallback: se não é popup (mesma aba), e houve sucesso, iniciar sync + polling leve
        if (checkout === 'success') {
          // Tenta sincronizar no backend (corrige casos de email divergente no Payment Link)
          (async () => { try { await syncSubscription(); } catch {} })();
          const started = Date.now();
          const timeoutMs = 2 * 60 * 1000; // 2 minutos
          const interval = 3000; // 3s
          const poll = window.setInterval(async () => {
            try {
              const info = await getSubscriptionStatus();
              if (info?.active) {
                try { sessionStorage.setItem('lb_show_sub_banner', '1'); } catch {}
                window.clearInterval(poll);
              } else if (Date.now() - started > timeoutMs) {
                window.clearInterval(poll);
              }
            } catch {
              if (Date.now() - started > timeoutMs) {
                window.clearInterval(poll);
              }
            }
          }, interval);
        }
      }
    } catch {
      // ignore
    }
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
      { index: true, element: <LifeBalanceAuth /> },
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
