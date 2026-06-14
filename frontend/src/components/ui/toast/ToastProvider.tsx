import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ToastInput, ToastItem, ToastVariant } from './types';

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-success-border bg-success-bg text-success-text',
  error: 'border-danger-border bg-danger-bg text-danger-text',
  info: 'border-info-border bg-info-bg text-info-text',
};

const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  const className = 'h-4 w-4 shrink-0';
  if (variant === 'success') return <CheckCircle2 className={className} aria-hidden />;
  if (variant === 'error') return <AlertCircle className={className} aria-hidden />;
  return <Info className={className} aria-hidden />;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ message, variant = 'info' }: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), 4500);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (message) => push({ message, variant: 'success' }),
      error: (message) => push({ message, variant: 'error' }),
      info: (message) => push({ message, variant: 'info' }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
          aria-live="polite"
          aria-relevant="additions"
        >
          {toasts.map((item) => (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg sm:w-auto',
                variantStyles[item.variant]
              )}
            >
              <VariantIcon variant={item.variant} />
              <p className="flex-1 text-sm font-medium">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded p-0.5 opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
