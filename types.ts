export type Role = "admin" | "escola";

export interface User {
  id: string;
  email: string; // internal login field
  password: string; // demo only - plaintext; real apps must hash
  name: string;
  role: Role;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  classroom: string; // turma
}

export interface Absence {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  date: string; // ISO date (yyyy-mm-dd)
  subject?: string; // legacy field kept for old saved records
  guardianName: string;
  guardianPhone: string;
  reason?: string;
  registeredBy: string; // school name
  registeredById: string;
  createdAt: string;
}
