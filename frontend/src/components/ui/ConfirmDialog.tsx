import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
};

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={title} preventClose={loading} size="sm">
      <p className="mb-6 text-sm text-muted-foreground">{body}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} disabled={loading} className="btn-secondary flex-1">
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={
            variant === 'danger'
              ? 'flex-1 rounded-md bg-danger-text px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50'
              : 'btn-primary flex-1'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
