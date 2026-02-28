"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TbAlertCircle, TbCheck, TbInfoCircle } from "react-icons/tb";

export type ToastVariant = "success" | "error" | "info";
type ToasterProps = {
  maxVisible?: number;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

const listeners = new Set<(toasts: ToastItem[]) => void>();
let toastQueue: ToastItem[] = [];

const emit = () => {
  listeners.forEach((listener) => listener(toastQueue));
};

const removeToast = (id: string) => {
  toastQueue = toastQueue.filter((toast) => toast.id !== id);
  emit();
};

export const showToast = (
  message: string,
  options?: { variant?: ToastVariant; duration?: number }
) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const toast: ToastItem = {
    id,
    message,
    variant: options?.variant ?? "info",
    duration: options?.duration ?? 2200,
  };

  toastQueue = [...toastQueue, toast];
  emit();

  setTimeout(() => {
    removeToast(id);
  }, toast.duration);
};

const subscribeToast = (listener: (toasts: ToastItem[]) => void) => {
  listeners.add(listener);
  listener(toastQueue);

  return () => {
    listeners.delete(listener);
  };
};

const variantStyle: Record<ToastVariant, string> = {
  success: "bg-green-100 text-green-700 border-green-300",
  error: "bg-red-100 text-red-700 border-red-300",
  info: "bg-amber-100 text-amber-700 border-amber-300",
};

const variantIcon: Record<ToastVariant, React.ReactNode> = {
  success: <TbCheck size="1.2em" />,
  error: <TbAlertCircle size="1.2em" />,
  info: <TbInfoCircle size="1.2em" />,
};

export default function Toaster({ maxVisible = 3 }: ToasterProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return subscribeToast(setToasts);
  }, []);

  const safeMaxVisible = Math.max(1, Math.floor(maxVisible));
  const visibleToasts = toasts.slice(-safeMaxVisible);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div className="absolute bottom-4 right-4 space-y-2">
        <AnimatePresence>
          {visibleToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 16, y: 16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 16, y: 16 }}
              transition={{ duration: 0.2 }}
              className={`min-w-56 max-w-80 rounded-xl border px-3 py-2 shadow ${variantStyle[toast.variant]}`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span>{variantIcon[toast.variant]}</span>
                <p className="text-sm">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
}
