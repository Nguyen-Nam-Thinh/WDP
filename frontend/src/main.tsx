  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AuthProvider } from "./app/hooks/useAuth.tsx";
  import { Toaster } from "sonner";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <Toaster theme="light" position="top-right" richColors offset="80px" />
      <App />
    </AuthProvider>
  );