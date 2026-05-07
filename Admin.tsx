import { useMemo, useState } from "react";
import {
  ArrowLeft, ShieldCheck, FileDown, Users, ClipboardList,
  Trash2, UserPlus, Search, BarChart3,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/router";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import {
  addUser, deleteAbsence, deleteUser, getAbsences, getStudents, getUsers,
} from "@/lib/storage";
import type { Absence, User } from "@/types";
import { formatDate } from "@/lib/utils";

type Tab = "absences" | "users" | "stats";

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("absences");

  const [absences, setAbsences] = useState<Absence[]>(() => getAbsences());
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const students = useMemo(() => getStudents(), []);

  // filters
  const [filterClass, setFilterClass] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");

  const classrooms = useMemo(
    () => Array.from(new Set(students.map((s) => s.classroom))).sort(),
    [students]
  );
  const filteredAbsences = useMemo(() => {
    return absences
      .filter((a) => !filterClass || a.classroom === filterClass)
      .filter((a) => !filterFrom || a.date >= filterFrom)
      .filter((a) => !filterTo || a.date <= filterTo)
      .filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          a.studentName.toLowerCase().includes(q) ||
          a.guardianName.toLowerCase().includes(q) ||
          a.guardianPhone.toLowerCase().includes(q) ||
          a.registeredBy.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [absences, filterClass, filterFrom, filterTo, search]);

  function handleDeleteAbsence(id: string) {
    if (!confirm("Excluir lançamento?")) return;
    deleteAbsence(id);
    setAbsences(getAbsences());
    toast.push("Lançamento excluído", "info");
  }

  function exportPDF() {
    if (filteredAbsences.length === 0) {
      toast.push("Nenhum lançamento para exportar", "error");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Faltas", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    let sub = `Gerado em ${new Date().toLocaleString("pt-BR")}`;
    if (filterClass) sub += ` • Turma: ${filterClass}`;
    if (filterFrom || filterTo) {
      sub += ` • Período: ${filterFrom ? formatDate(filterFrom) : "..."} a ${
        filterTo ? formatDate(filterTo) : "..."
      }`;
    }
    doc.text(sub, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Data", "Aluno", "Turma", "Responsável", "Celular", "Justificativa", "Escola"]],
      body: filteredAbsences.map((a) => [
        formatDate(a.date),
        a.studentName,
        a.classroom,
        a.guardianName,
        a.guardianPhone,
        a.reason || "-",
        a.registeredBy,
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`relatorio-faltas-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.push("PDF gerado!", "success");
  }

  function exportCSV() {
    if (filteredAbsences.length === 0) {
      toast.push("Nenhum lançamento para exportar", "error");
      return;
    }
    const header = ["Data", "Aluno", "Turma", "Responsável", "Celular", "Justificativa", "Escola"];
    const rows = filteredAbsences.map((a) => [
      a.date, a.studentName, a.classroom, a.guardianName, a.guardianPhone, a.reason || "", a.registeredBy,
    ]);
    const csv =
      [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-faltas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.push("CSV gerado!", "success");
  }

  // Stats
  const stats = useMemo(() => {
    const total = absences.length;
    const byClass = new Map<string, number>();
    const byStudent = new Map<string, number>();
    absences.forEach((a) => {
      byClass.set(a.classroom, (byClass.get(a.classroom) || 0) + 1);
      byStudent.set(a.studentName, (byStudent.get(a.studentName) || 0) + 1);
    });
    const top = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      total,
      classes: top(byClass),
      students: top(byStudent),
    };
  }, [absences]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
          <span className="text-sm text-muted-foreground">{user?.name}</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel do Administrador</h1>
            <p className="text-sm text-muted-foreground">Visualize lançamentos, gere relatórios e gerencie usuários.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/60 p-1 rounded-lg w-fit">
          <TabBtn active={tab === "absences"} onClick={() => setTab("absences")} icon={<ClipboardList className="w-4 h-4" />}>
            Lançamentos
          </TabBtn>
          <TabBtn active={tab === "stats"} onClick={() => setTab("stats")} icon={<BarChart3 className="w-4 h-4" />}>
            Estatísticas
          </TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="w-4 h-4" />}>
            Usuários
          </TabBtn>
        </div>

        {tab === "absences" && (
          <Card className="p-6">
            <div className="flex flex-wrap gap-3 mb-4 items-end">
              <div className="min-w-[140px]">
                <Label>Turma</Label>
                <Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                  <option value="">Todas</option>
                  {classrooms.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>De</Label>
                <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div>
                <Label>Até</Label>
                <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Aluno, responsável ou escola..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={exportCSV}>
                <FileDown className="w-4 h-4" /> CSV
              </Button>
              <Button onClick={exportPDF}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {filteredAbsences.length} lançamento(s)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                    <th className="px-2 py-2 font-medium">Data</th>
                    <th className="px-2 py-2 font-medium">Aluno</th>
                    <th className="px-2 py-2 font-medium">Turma</th>
                    <th className="px-2 py-2 font-medium">Responsável</th>
                    <th className="px-2 py-2 font-medium">Celular</th>
                    <th className="px-2 py-2 font-medium">Justificativa</th>
                    <th className="px-2 py-2 font-medium">Escola</th>
                    <th className="px-2 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsences.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        Nenhum lançamento encontrado.
                      </td>
                    </tr>
                  )}
                  {filteredAbsences.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-2 py-2 whitespace-nowrap">{formatDate(a.date)}</td>
                      <td className="px-2 py-2">{a.studentName}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{a.classroom}</td>
                      <td className="px-2 py-2">{a.guardianName}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{a.guardianPhone}</td>
                      <td className="px-2 py-2 text-muted-foreground">{a.reason || "—"}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">{a.registeredBy}</td>
                      <td className="px-2 py-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAbsence(a.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "stats" && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total de faltas</p>
              <p className="text-4xl font-bold mt-1">{stats.total}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Turmas</p>
              <p className="text-4xl font-bold mt-1">{classrooms.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Usuários</p>
              <p className="text-4xl font-bold mt-1">{users.length}</p>
            </Card>

            <StatCard title="Top turmas" rows={stats.classes} />
            <StatCard title="Alunos com mais faltas" rows={stats.students} />
          </div>
        )}

        {tab === "users" && (
          <UsersTab users={users} setUsers={setUsers} currentUserId={user?.id ?? ""} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function TabBtn({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors ${
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatCard({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Card className="p-6 md:col-span-1">
      <h3 className="font-semibold mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(([label, count]) => (
            <li key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate pr-2">{label}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function UsersTab({
  users, setUsers, currentUserId,
}: { users: User[]; setUsers: (u: User[]) => void; currentUserId: string }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const accessName = name.trim();
      if (!accessName) throw new Error("Informe o nome de acesso");
      addUser({ name: accessName, email: accessName, password, role: "escola" });
      setUsers(getUsers());
      setName(""); setPassword("");
      toast.push("Usuário adicionado!", "success");
    } catch (err) {
      toast.push((err as Error).message, "error");
    }
  }

  function handleDelete(id: string) {
    const selectedUser = users.find((u) => u.id === id);
    if (id === currentUserId || selectedUser?.role === "admin") {
      toast.push("O administrador SME não pode ser excluído", "error");
      return;
    }
    if (!confirm("Excluir este usuário?")) return;
    deleteUser(id);
    setUsers(getUsers());
    toast.push("Usuário excluído", "info");
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <Card className="p-6 lg:col-span-2 h-fit">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Adicionar usuário
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <Label>Nome de acesso</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Escola Municipal Centro"
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
          </div>
          <Button type="submit" className="w-full">Adicionar</Button>
        </form>
      </Card>

      <Card className="p-6 lg:col-span-3">
        <h2 className="font-semibold mb-4">Usuários ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                <th className="px-2 py-2 font-medium">Nome de acesso</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-2">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs text-primary">(você)</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {u.role === "admin" ? "Administrador SME" : "Escola"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
