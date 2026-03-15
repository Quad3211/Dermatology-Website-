import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface ToastData {
  id: string;
  title: string;
  message: string;
  onClick?: () => void;
  duration?: number;
}

let toastCount = 0;
let observers: ((toasts: ToastData[]) => void)[] = [];
let toasts: ToastData[] = [];

const notify = () => {
  observers.forEach((observer) => observer([...toasts]));
};

export const showToast = (toast: Omit<ToastData, "id">) => {
  const id = `toast-${toastCount++}`;
  const newToast = { ...toast, id };
  toasts = [newToast, ...toasts].slice(0, 3); // Keep last 3
  notify();

  if (toast.duration !== 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  }
  return id;
};

export const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
};

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    observers.push(setActiveToasts);
    return () => {
      observers = observers.filter((o) => o !== setActiveToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-80 flex gap-4 cursor-pointer hover:border-primary-200 transition-colors group relative overflow-hidden"
              onClick={() => {
                toast.onClick?.();
                removeToast(toast.id);
              }}
            >
              {/* Progress bar accent */}
              <div className="absolute bottom-0 left-0 h-1 bg-primary-500/20 w-full" />

              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-primary-600">
                <MessageSquare className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {toast.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToast(toast.id);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>
                <div className="mt-2 flex items-center text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                  View Message{" "}
                  <ChevronRight className="ml-0.5 w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
