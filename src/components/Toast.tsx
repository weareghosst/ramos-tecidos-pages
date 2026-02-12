// src/components/Toast.tsx
import React, { useEffect } from "react";

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export default function Toast({ open, message, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="card flex w-full max-w-md items-center justify-between gap-3 border border-zinc-200 bg-white/95 shadow-lg backdrop-blur">
        <div className="text-sm text-zinc-800">{message}</div>
        <button
          onClick={onClose}
          className="press rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          aria-label="Fechar"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
