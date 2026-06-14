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
import type { useMedresas } from '../hooks/useMedresas';

type CreateMedresaModalProps = {
  open: boolean;
  onClose: () => void;
  createMedresa: ReturnType<typeof useMedresas>['createMedresa'];
};

const defaultValues: MedresaFormValues = {
  name: '',
  location: '',
  phone: '',
};

export const CreateMedresaModal = ({ open, onClose, createMedresa }: CreateMedresaModalProps) => {
  const { t } = useTranslation();
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedresaFormValues>({
    resolver: zodResolver(medresaFormSchema),
    defaultValues,
  });

  const onSubmit = (data: MedresaFormValues) => {
    createMedresa.mutate(toMedresaApiPayload(data), {
      onSuccess: () => {
        reset(defaultValues);
        success(t('medresas.createSuccess'));
        onClose();
      },
    });
  };

  const apiError = createMedresa.isError
    ? (getMedresaMutationError(createMedresa.error) ?? t('medresas.createError'))
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('medresas.addTitle')}
      preventClose={createMedresa.isPending}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <MedresaFormFields register={register} errors={errors} />
        {apiError ? <p className="text-xs text-danger-text">{apiError}</p> : null}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={createMedresa.isPending} className="btn-primary flex-1">
            {createMedresa.isPending ? t('common.creating') : t('common.create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
