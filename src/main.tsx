import ReactDOM from "react-dom/client";
import App from "./App";
import "../index.css";
import "./styles/forms.css";
import "./styles/datepicker.css";
import "./styles/forms.css";
import { startTokenValidationInterval } from "./utils/authInterceptor";

// Configura o interceptor global para requisições HTTP
// setupGlobalAuthInterceptor(); // Desabilitado temporariamente para não interferir no carregamento das metas

// Inicia verificação periódica do token (a cada 5 minutos)
startTokenValidationInterval();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
