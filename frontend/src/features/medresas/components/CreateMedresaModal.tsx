import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedresaFormValues>({
    resolver: zodResolver(medresaFormSchema),
    defaultValues,
  });

  if (!open) return null;

  const onSubmit = (data: MedresaFormValues) => {
    createMedresa.mutate(toMedresaApiPayload(data), {
      onSuccess: () => {
        reset(defaultValues);
        onClose();
      },
    });
  };

  const apiError = createMedresa.isError
    ? (getMedresaMutationError(createMedresa.error) ?? 'Could not create medresa.')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Add medresa</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <MedresaFormFields register={register} errors={errors} />
          {apiError && <p className="text-xs text-danger-text">{apiError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={createMedresa.isPending} className="btn-primary flex-1">
              {createMedresa.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
