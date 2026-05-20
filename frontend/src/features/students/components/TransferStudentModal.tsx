import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  getStudentMutationError,
  transferFormSchema,
  type TransferFormValues,
} from '../schemas/student.schemas';
import type { StudentDetail, TransferDestination } from '../types';
import type { useStudent } from '../hooks/useStudent';

type TransferStudentModalProps = {
  open: boolean;
  onClose: () => void;
  student: StudentDetail;
  destinations: TransferDestination[];
  transferStudent: ReturnType<typeof useStudent>['transferStudent'];
};

export const TransferStudentModal = ({
  open,
  onClose,
  student,
  destinations,
  transferStudent,
}: TransferStudentModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      toMedresaId: '',
      transferDate: new Date().toISOString().slice(0, 10),
      reason: '',
    },
  });

  if (!open) return null;

  const onSubmit = (data: TransferFormValues) => {
    transferStudent.mutate(data, { onSuccess: () => onClose() });
  };

  const apiError = transferStudent.isError
    ? (getStudentMutationError(transferStudent.error) ?? t('students.transferError'))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-2">{t('students.transferTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{student.fullName}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="field-label text-xs uppercase text-muted-foreground">
              {t('students.transferFrom')}
            </label>
            <p className="font-medium text-teal-800">{student.currentMedresaName}</p>
          </div>
          <div>
            <label className="field-label">{t('students.transferTo')}</label>
            <select className="field-input" {...register('toMedresaId')}>
              <option value="">{t('students.selectMedresa')}</option>
              {destinations.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.toMedresaId && (
              <p className="text-danger-text text-xs mt-1">{errors.toMedresaId.message}</p>
            )}
          </div>
          <div>
            <label className="field-label">{t('students.transferDate')}</label>
            <input type="date" className="field-input" {...register('transferDate')} />
          </div>
          <div>
            <label className="field-label">{t('students.transferReason')}</label>
            <textarea className="field-input min-h-[80px]" {...register('reason')} />
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
            {t('students.transferWarning')}
          </p>
          {apiError && <p className="text-danger-text text-sm">{apiError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('students.cancel')}
            </button>
            <button
              type="submit"
              disabled={transferStudent.isPending}
              className="btn-primary flex-1"
            >
              {transferStudent.isPending ? t('students.saving') : t('students.transfer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
