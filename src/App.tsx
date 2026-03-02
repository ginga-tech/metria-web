import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
import PageLoader from "./components/PageLoader";

// Layout component que inclui o GlobalLoader
function CheckoutAutoClose() {
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("Processando pagamento...");
  const isReconcilingRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clearCheckoutParamsFromUrl = () => {
      try {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("checkout") && !url.searchParams.has("session_id")) return;
        url.searchParams.delete("checkout");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      } catch {
        // ignore
      }
    };
    const reconcileCheckout = async (status: string, checkoutSessionId?: string | null) => {
      if (status !== "success") return;
      if (isReconcilingRef.current) return;
      isReconcilingRef.current = true;
      setIsProcessingCheckout(true);
      setCheckoutMessage("Confirmando seu pagamento...");
      const started = Date.now();
      const timeoutMs = 5 * 60 * 1000;
      const intervalMs = 2000;
      let attempts = 0;
      try {
        try {
          setCheckoutMessage("Sincronizando assinatura...");
          await syncSubscription({ checkoutSessionId: checkoutSessionId || undefined });
        } catch {
          // segue com polling
        }
        await new Promise<void>((resolve) => {
          const timer = window.setInterval(async () => {
            attempts++;
            try {
              if (attempts % 5 === 0) {
                setCheckoutMessage("Atualizando status do plano...");
                try {
                  await syncSubscription({ checkoutSessionId: checkoutSessionId || undefined });
                } catch {
                  // segue
                }
              }

              const info = await getSubscriptionStatus();
              if (info?.active) {
                window.clearInterval(timer);
                try {
                  sessionStorage.setItem("lb_show_sub_banner", "1");
                } catch {
                  // ignore
                }
                clearCheckoutParamsFromUrl();
                window.location.reload();
                resolve();
                return;
              }

              if (Date.now() - started > timeoutMs) {
                window.clearInterval(timer);
                setCheckoutMessage("Pagamento confirmado no Stripe, aguardando sincronizacao final...");
                resolve();
              }
            } catch {
              if (Date.now() - started > timeoutMs) {
                window.clearInterval(timer);
                setCheckoutMessage("Nao foi possivel confirmar o plano automaticamente.");
                resolve();
              }
            }
          }, intervalMs);
        });
      } finally {
        setIsProcessingCheckout(false);
        isReconcilingRef.current = false;
      }
    };
    try {
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get("checkout");
      const sessionId = params.get("session_id");
      if (checkout === "success" || checkout === "cancel") {
        try {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage(
              { type: "lb:checkout", status: checkout, checkoutSessionId: sessionId },
              window.location.origin
            );
            window.close();
            return;
          }
        } catch {
          // ignore postMessage errors
        }
        if (checkout === "cancel") {
          clearCheckoutParamsFromUrl();
        } else {
          reconcileCheckout(checkout, sessionId);
        }
      }
    } catch {
      // ignore
    }
    const onMessage = (e: MessageEvent) => {
      try {
        if (e.origin !== window.location.origin) return;
        try {
          if (sessionStorage.getItem("lb_checkout_polling") === "1") return;
        } catch {
          // ignore
        }
        const data: any = e.data || {};
        if (data?.type === "lb:checkout") {
          reconcileCheckout(data?.status, data?.checkoutSessionId);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  if (!isProcessingCheckout) return null;
  return <PageLoader overlay message={checkoutMessage} />;
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
