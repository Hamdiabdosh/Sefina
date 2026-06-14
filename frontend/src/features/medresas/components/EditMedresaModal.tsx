import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/toast/ToastProvider';
import { MedresaFormFields } from './MedresaFormFields';
import {
  getMedresaMutationError,
  medresaFormSchema,
  toMedresaApiPayload,
  type MedresaFormValues,
} from '../schemas/medresa.schemas';
import type { MedresaListItem } from '../types';
import type { useMedresas } from '../hooks/useMedresas';

type EditMedresaModalProps = {
  medresa: MedresaListItem | null;
  onClose: () => void;
  updateMedresa: ReturnType<typeof useMedresas>['updateMedresa'];
};

export const EditMedresaModal = ({ medresa, onClose, updateMedresa }: EditMedresaModalProps) => {
  const { t } = useTranslation();
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedresaFormValues>({
    resolver: zodResolver(medresaFormSchema),
    defaultValues: { name: '', location: '', phone: '' },
  });

  useEffect(() => {
    if (medresa) {
      reset({
        name: medresa.name,
        location: medresa.location,
        phone: medresa.phone ?? '',
      });
    }
  }, [medresa, reset]);

  if (!medresa) return null;

  const onSubmit = (data: MedresaFormValues) => {
    updateMedresa.mutate(
      { id: medresa.id, data: toMedresaApiPayload(data) },
      {
        onSuccess: () => {
          success(t('medresas.updateSuccess'));
          onClose();
        },
      }
    );
  };

  const apiError = updateMedresa.isError
    ? (getMedresaMutationError(updateMedresa.error) ?? t('medresas.updateError'))
    : null;

  return (
    <Modal
      open={Boolean(medresa)}
      onClose={onClose}
      title={t('medresas.editTitle')}
      preventClose={updateMedresa.isPending}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <MedresaFormFields register={register} errors={errors} />
        {apiError ? <p className="text-xs text-danger-text">{apiError}</p> : null}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={updateMedresa.isPending} className="btn-primary flex-1">
            {updateMedresa.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
