import { ClipboardList, GraduationCap, ShieldCheck, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/router";
import Footer from "@/components/Footer";

const Index = () => {
  const { role, signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-16">
        <div className="flex justify-end mb-4 gap-2 items-center text-sm text-muted-foreground">
          <span>{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Controle de Faltas</h1>
          <p className="text-muted-foreground">Sistema de registro de faltas escolares</p>
        </div>

        <div className={`grid gap-4 ${role === "admin" ? "md:grid-cols-2" : ""}`}>
          {role !== "admin" && (
            <Link to="/lancamento">
              <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                <ClipboardList className="w-10 h-10 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Lançamento de Faltas</h2>
                <p className="text-sm text-muted-foreground">Registre as faltas dos alunos.</p>
              </Card>
            </Link>
          )}
          {role === "admin" && (
            <>
              <Link to="/admin">
                <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                  <ShieldCheck className="w-10 h-10 text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Painel do Administrador</h2>
                  <p className="text-sm text-muted-foreground">
                    Visualize lançamentos, gere PDFs e gerencie usuários.
                  </p>
                </Card>
              </Link>
              <Link to="/lancamento">
                <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                  <ClipboardList className="w-10 h-10 text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Lançamento de Faltas</h2>
                  <p className="text-sm text-muted-foreground">Registre faltas pela escola.</p>
                </Card>
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
