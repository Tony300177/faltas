import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RouterProvider, useRouter } from "@/router";
import { ToastProvider } from "@/components/Toast";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Lancamento from "@/pages/Lancamento";
import Admin from "@/pages/Admin";

function Routes() {
  const { user, loading } = useAuth();
  const { path } = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  if (path === "/lancamento") return <Lancamento />;
  if (path === "/admin") {
    if (user.role !== "admin") return <Index />;
    return <Admin />;
  }
  return <Index />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider>
          <Routes />
        </RouterProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
