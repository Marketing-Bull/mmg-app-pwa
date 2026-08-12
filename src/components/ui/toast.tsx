"use client";

import { CalendarCheck, CheckCircle2, Info, MessageCircle, TriangleAlert } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning" | "calendar" | "comment";

interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}

interface ToastValue {
  toast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; chip: string }> = {
  success: { icon: CheckCircle2, chip: "bg-teal text-cream" },
  info: { icon: Info, chip: "bg-espresso text-gold" },
  warning: { icon: TriangleAlert, chip: "bg-mango text-espresso" },
  calendar: { icon: CalendarCheck, chip: "bg-red text-cream" },
  comment: { icon: MessageCircle, chip: "bg-teal-dark text-cream" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-2), { ...input, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {toasts.map((item) => {
          const { icon: Icon, chip } = TONE_STYLES[item.tone];
          return (
            <div
              key={item.id}
              className="bg-espresso text-cream shadow-mmg pointer-events-auto flex w-full max-w-[26rem] animate-[mmg-toast-in_0.32s_var(--ease-out-soft)] items-start gap-3 rounded-2xl px-3.5 py-3"
            >
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", chip)}>
                <Icon className="size-[1.05rem]" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[0.87rem] leading-snug font-semibold">{item.title}</p>
                {item.body ? (
                  <p className="text-cream/70 mt-0.5 text-[0.78rem] leading-snug">{item.body}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
