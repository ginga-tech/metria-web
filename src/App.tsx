import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import LifeBalanceAuth from "./pages/LifeBalanceAuth";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Preferences from "./pages/Preferences";
import Goals from "./pages/Goals";
import OAuthCallback from "./pages/OAuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalLoader from "./components/GlobalLoader";

// Layout component que inclui o GlobalLoader
function Layout() {
  return (
    <>
      <Outlet />
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
