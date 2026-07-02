import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

let toastListeners: Array<(toast: ToastMessage) => void> = [];

export function toast(text: string, type: ToastType = "info") {
  const id = Math.random().toString(36).substr(2, 9);
  const message: ToastMessage = { id, text, type };
  toastListeners.forEach((listener) => listener(message));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const addToast = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        removeToast(msg.id);
      }, 4000);
    };

    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full p-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 p-4 rounded-xl border glass-panel-heavy pointer-events-auto shadow-2xl transition-all duration-300 transform translate-y-0"
          style={{
            borderColor:
              t.type === "success"
                ? "rgba(16, 185, 129, 0.3)"
                : t.type === "error"
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(99, 102, 241, 0.3)",
          }}
        >
          {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {t.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
          {t.type === "info" && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}

          <p className="text-sm font-medium text-gray-200 flex-1">{t.text}</p>

          <button
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-white shrink-0 clickable"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
