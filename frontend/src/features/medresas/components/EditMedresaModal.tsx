import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
      { onSuccess: () => onClose() }
    );
  };

  const apiError = updateMedresa.isError
    ? (getMedresaMutationError(updateMedresa.error) ?? 'Could not save medresa.')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Edit medresa</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <MedresaFormFields register={register} errors={errors} />
          {apiError && <p className="text-xs text-danger-text">{apiError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={updateMedresa.isPending} className="btn-primary flex-1">
              {updateMedresa.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
