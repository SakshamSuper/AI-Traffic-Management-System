import * as React from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

let count = 0;
type Listener = () => void;
const listeners = new Set<Listener>();
let toasts: Toast[] = [];

export function toast(props: Omit<Toast, "id">) {
  count += 1;
  const id = count.toString();
  const newToast = { ...props, id };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener());

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener());
  }, 3000);
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = React.useState<Toast[]>(toasts);

  React.useEffect(() => {
    const listener = () => setCurrentToasts([...toasts]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { toasts: currentToasts, toast };
}
