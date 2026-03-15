import { AlertTriangle, MessageSquare } from "lucide-react";

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

export const subscribeToToasts = (observer: (toasts: ToastData[]) => void) => {
  observers.push(observer);
  return () => {
    observers = observers.filter((o) => o !== observer);
  };
};

export const DEFAULT_OPTIONS = {
  duration: 5000,
};

export const TOAST_ICONS = {
  success: MessageSquare,
  error: AlertTriangle,
  info: MessageSquare,
} as const;
