import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Prevent closing via backdrop / Escape (e.g. while submitting). */
  preventClose?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const Modal = ({
  open,
  onClose,
  title,
  children,
  preventClose = false,
  className,
  size = 'md',
}: ModalProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const tryClose = useCallback(() => {
    if (!preventClose) onClose();
  }, [onClose, preventClose]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') tryClose();
    };

    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, tryClose]);

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) tryClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onBackdropClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'max-h-[90vh] w-full overflow-y-auto rounded-xl bg-surface p-6 shadow-xl outline-none',
          sizeClass[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-medium text-teal-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={tryClose}
            disabled={preventClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-cream-dark disabled:opacity-40"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};
