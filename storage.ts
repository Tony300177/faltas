import type { User, Student, Absence } from "@/types";
import { uid } from "@/lib/utils";

const KEYS = {
  users: "cf_users",
  students: "cf_students",
  absences: "cf_absences",
  session: "cf_session",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Users ---
export function getUsers(): User[] {
  type LegacyUser = Omit<User, "role"> & { role: User["role"] | "professor" };
  const users = read<LegacyUser[]>(KEYS.users, []).map((user) => ({
    ...user,
    role: user.role === "professor" ? "escola" : user.role,
  }));
  const admins = users.filter((user) => user.role === "admin");
  const schools = users.filter((user) => user.role !== "admin");
  const fixedAdmin: User = admins[0]
    ? { ...admins[0], name: "SME", email: "sme", password: "123456", role: "admin" }
    : {
        id: "sme-admin",
        name: "SME",
        email: "sme",
        password: "123456",
        role: "admin",
        createdAt: new Date().toISOString(),
      };
  return [fixedAdmin, ...schools];
}
export function saveUsers(users: User[]) {
  write(KEYS.users, users);
}
export function addUser(u: Omit<User, "id" | "createdAt">): User {
  const users = getUsers();
  if (users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
    throw new Error("Nome de acesso já cadastrado");
  }
  const user: User = { ...u, id: uid(), createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  return user;
}
export function updateUser(id: string, patch: Partial<User>) {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveUsers(users);
}
export function deleteUser(id: string) {
  saveUsers(getUsers().filter((u) => u.id !== id));
}

// --- Students ---
export function getStudents(): Student[] {
  return read<Student[]>(KEYS.students, []);
}
export function saveStudents(s: Student[]) {
  write(KEYS.students, s);
}
export function addStudent(s: Omit<Student, "id">): Student {
  const list = getStudents();
  const student = { ...s, id: uid() };
  list.push(student);
  saveStudents(list);
  return student;
}
export function deleteStudent(id: string) {
  saveStudents(getStudents().filter((s) => s.id !== id));
}

// --- Absences ---
export function getAbsences(): Absence[] {
  type LegacyAbsence = Absence & { guardianName?: string; guardianPhone?: string };
  return read<LegacyAbsence[]>(KEYS.absences, []).map((absence) => ({
    ...absence,
    guardianName: absence.guardianName || "Não informado",
    guardianPhone: absence.guardianPhone || "Não informado",
  }));
}
export function saveAbsences(list: Absence[]) {
  write(KEYS.absences, list);
}
export function addAbsence(a: Omit<Absence, "id" | "createdAt">): Absence {
  const list = getAbsences();
  const item: Absence = { ...a, id: uid(), createdAt: new Date().toISOString() };
  list.push(item);
  saveAbsences(list);
  return item;
}
export function deleteAbsence(id: string) {
  saveAbsences(getAbsences().filter((a) => a.id !== id));
}

// --- Session ---
export function getSession(): string | null {
  return read<string | null>(KEYS.session, null);
}
export function setSession(userId: string | null) {
  if (userId) write(KEYS.session, userId);
  else localStorage.removeItem(KEYS.session);
}

// --- Seed ---
export function seedIfEmpty() {
  const users = getUsers();
  saveUsers(users);
  const students = getStudents();
  if (students.length === 0) {
    const turmas = ["1º Ano A", "1º Ano B", "2º Ano A", "3º Ano A"];
    const nomes = [
      "Ana Beatriz Souza", "Bruno Almeida", "Carlos Eduardo Lima", "Daniela Ferreira",
      "Eduardo Martins", "Fernanda Costa", "Gabriel Rocha", "Helena Dias",
      "Igor Pereira", "Juliana Ribeiro", "Kauã Mendes", "Larissa Barbosa",
      "Marcos Vinícius", "Natália Carvalho", "Otávio Henrique", "Patrícia Gomes",
    ];
    nomes.forEach((nome, i) => {
      addStudent({ name: nome, classroom: turmas[i % turmas.length] });
    });
  }
}
