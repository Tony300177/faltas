import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContext = createContext<{ push: (msg: string, type?: ToastType) => void } | undefined>(
  undefined
);

let counter = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastType = "success") => {
    const id = counter++;
    setItems((p) => [...p, { id, type, message }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {items.map((t) => {
          const color =
            t.type === "success"
              ? "bg-emerald-600"
              : t.type === "error"
              ? "bg-red-600"
              : "bg-slate-700";
          const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
          return (
            <div
              key={t.id}
              className={`${color} text-white rounded-md shadow-lg px-4 py-3 text-sm flex items-center gap-2 min-w-[260px] animate-in fade-in slide-in-from-bottom-2`}
            >
              <Icon className="w-4 h-4" />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
