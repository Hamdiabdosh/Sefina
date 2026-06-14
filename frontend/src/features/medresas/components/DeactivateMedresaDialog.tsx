import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/toast/ToastProvider';
import type { MedresaListItem } from '../types';
import type { useMedresas } from '../hooks/useMedresas';

type DeactivateMedresaDialogProps = {
  medresa: MedresaListItem | null;
  onClose: () => void;
  deactivateMedresa: ReturnType<typeof useMedresas>['deactivateMedresa'];
  reactivateMedresa: ReturnType<typeof useMedresas>['reactivateMedresa'];
};

export const DeactivateMedresaDialog = ({
  medresa,
  onClose,
  deactivateMedresa,
  reactivateMedresa,
}: DeactivateMedresaDialogProps) => {
  const { t } = useTranslation();
  const { success } = useToast();

  if (!medresa) return null;

  const isActive = medresa.status === 'ACTIVE';
  const pending = deactivateMedresa.isPending || reactivateMedresa.isPending;

  const handleConfirm = () => {
    if (isActive) {
      deactivateMedresa.mutate(medresa.id, {
        onSuccess: () => {
          success(t('medresas.deactivateSuccess'));
          onClose();
        },
      });
    } else {
      reactivateMedresa.mutate(medresa.id, {
        onSuccess: () => {
          success(t('medresas.reactivateSuccess'));
          onClose();
        },
      });
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(medresa)}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={isActive ? t('medresas.deactivateTitle') : t('medresas.reactivateTitle')}
      body={
        isActive
          ? t('medresas.deactivateBody', { name: medresa.name })
          : t('medresas.reactivateBody', { name: medresa.name })
      }
      confirmLabel={isActive ? t('medresas.deactivateConfirm') : t('medresas.reactivateConfirm')}
      variant={isActive ? 'danger' : 'primary'}
      loading={pending}
    />
  );
};
