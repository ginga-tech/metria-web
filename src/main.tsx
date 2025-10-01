import ReactDOM from "react-dom/client";
import App from "./App";
import "../index.css";
import { setupGlobalAuthInterceptor, startTokenValidationInterval } from "./utils/authInterceptor";

// Configura o interceptor global para requisições HTTP
setupGlobalAuthInterceptor();

// Inicia verificação periódica do token (a cada 5 minutos)
startTokenValidationInterval();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
