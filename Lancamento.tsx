import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Trash2, Save, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/router";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import { addAbsence, deleteAbsence, getAbsences } from "@/lib/storage";
import type { Absence } from "@/types";
import { formatDate } from "@/lib/utils";

export default function Lancamento() {
  const { user } = useAuth();
  const toast = useToast();

  const [absences, setAbsences] = useState<Absence[]>(() => getAbsences());

  const [studentName, setStudentName] = useState<string>("");
  const [classroom, setClassroom] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [guardianName, setGuardianName] = useState<string>("");
  const [guardianPhone, setGuardianPhone] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [search, setSearch] = useState("");

  const [schoolSelect, setSchoolSelect] = useState<string>("");

  const SCHOOLS_LIST = [
    "CEI LUIZ FELIPE", "CEI SAO CRISTOVAO", "CEI ARCO IRIS", "CEI BRUNO LEONARDO",
    "CEI DOM FRANCO", "CEI MENINO JESUS", "CEI NOSSO LAR", "CEI VASCO PAPA",
    "CEI CRIANÇA FELIZ", "CEM GUILHERME", "CEM ORLANDO PEREIRA", "EM MARIA HILDA",
    "EM PAULO FREIRE", "EM JOSE ANCHIETA", "ERM ALVARES AZEVEDO", "ERM CORA CORALINA",
    "ERM EUCLIDES CUNHA", "ERM OSVALDO CRUZ", "ERM VINICIUS DE MORAIS"
  ];

  const finalAbsences = useMemo(() => {
    let list = absences;
    if (user?.role !== "admin") {
      list = list.filter((a) => a.registeredById === user?.id);
    } else if (schoolSelect) {
      list = list.filter((a) => a.registeredBy.toUpperCase() === schoolSelect.toUpperCase());
    }
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (a) =>
        a.studentName.toLowerCase().includes(q) ||
        a.classroom.toLowerCase().includes(q) ||
        a.guardianName.toLowerCase().includes(q) ||
        a.guardianPhone.toLowerCase().includes(q)
    );
  }, [absences, user, schoolSelect, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!studentName.trim()) {
      toast.push("Informe o nome do aluno", "error");
      return;
    }
    if (!classroom.trim()) {
      toast.push("Informe a turma", "error");
      return;
    }
    addAbsence({
      studentId: studentName.trim().toLowerCase(),
      studentName: studentName.trim(),
      classroom: classroom.trim(),
      date,
      guardianName,
      guardianPhone,
      reason: reason.trim() || undefined,
      registeredBy: user.name,
      registeredById: user.id,
    });
    setAbsences(getAbsences());
    setStudentName("");
    setClassroom("");
    setGuardianName("");
    setGuardianPhone("");
    setReason("");
    toast.push("Falta registrada com sucesso!", "success");
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    deleteAbsence(id);
    setAbsences(getAbsences());
    toast.push("Lançamento excluído", "info");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
          <span className="text-sm text-muted-foreground">{user?.name}</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lançamento de Faltas</h1>
            <p className="text-sm text-muted-foreground">Registre faltas de alunos com dados do responsável</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <Card className="p-6 lg:col-span-2 h-fit">
            <h2 className="font-semibold mb-4">Nova falta</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Turma</Label>
                <Input
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  placeholder="Ex: 1º Ano A"
                  required
                />
              </div>
              <div>
                <Label>Nome do aluno</Label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nome completo do aluno"
                  required
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nome do responsável</Label>
                  <Input
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label>Número do celular</Label>
                  <Input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Justificativa (opcional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Atestado médico, motivo familiar..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                <Save className="w-4 h-4" /> Registrar falta
              </Button>
            </form>
          </Card>

          <Card className="p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="font-semibold">Lançamentos ({finalAbsences.length})</h2>
              <div className="flex gap-2 items-center flex-wrap">
                {user?.role === "admin" && (
                  <Select
                    value={schoolSelect}
                    onChange={(e) => setSchoolSelect(e.target.value)}
                    className="h-9 text-xs w-44"
                  >
                    <option value="">Todas as escolas</option>
                    {SCHOOLS_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                )}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 w-44"
                  />
                </div>
              </div>
            </div>

            {finalAbsences.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nenhuma falta registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                      <th className="px-2 py-2 font-medium">Data</th>
                      <th className="px-2 py-2 font-medium">Aluno</th>
                      <th className="px-2 py-2 font-medium">Turma</th>
                      <th className="px-2 py-2 font-medium">Responsável</th>
                      <th className="px-2 py-2 font-medium">Celular</th>
                      <th className="px-2 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalAbsences.map((a: Absence) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-2 py-2 whitespace-nowrap">{formatDate(a.date)}</td>
                        <td className="px-2 py-2">{a.studentName}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{a.classroom}</td>
                        <td className="px-2 py-2">{a.guardianName}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{a.guardianPhone}</td>
                        <td className="px-2 py-2 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
