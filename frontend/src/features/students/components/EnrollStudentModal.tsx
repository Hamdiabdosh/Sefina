import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  getStudentMutationError,
  studentFormSchema,
  type StudentFormValues,
} from '../schemas/student.schemas';
import type { useStudents } from '../hooks/useStudents';

type EnrollStudentModalProps = {
  open: boolean;
  onClose: () => void;
  createStudent: ReturnType<typeof useStudents>['createStudent'];
};

const defaultValues: StudentFormValues = {
  fullName: '',
  dateOfBirth: '',
  gender: 'MALE',
  address: '',
  guardianName: '',
  guardianPhone: '',
};

const STEP_ONE_FIELDS = ['fullName', 'dateOfBirth', 'gender', 'address'] as const;

export const EnrollStudentModal = ({
  open,
  onClose,
  createStudent,
}: EnrollStudentModalProps) => {
  const { t } = useTranslation();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  if (!open) return null;

  const watched = watch();

  const handleClose = () => {
    reset(defaultValues);
    setPhotoFile(null);
    setStep(1);
    onClose();
  };

  const onSubmit = (data: StudentFormValues) => {
    createStudent.mutate(
      { values: data, photo: photoFile },
      {
        onSuccess: () => {
          reset(defaultValues);
          setPhotoFile(null);
          setStep(1);
          onClose();
        },
      }
    );
  };

  const handleNext = async () => {
    const valid = await trigger([...STEP_ONE_FIELDS]);
    if (valid) setStep(2);
  };

  const apiError = createStudent.isError
    ? (getStudentMutationError(createStudent.error) ?? t('students.enrollError'))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-medium text-teal-800">{t('students.enrollTitle')}</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('students.enrollStep', { step, total: 2 })}
        </p>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2].map((dot) => (
            <span
              key={dot}
              className={`h-2 w-2 rounded-full ${step >= dot ? 'bg-teal-600' : 'bg-cream-dark'}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="field-label">{t('students.form.fullName')}</label>
                <input className="field-input" {...register('fullName')} />
                {errors.fullName ? (
                  <p className="mt-1 text-xs text-danger-text">{errors.fullName.message}</p>
                ) : null}
              </div>
              <div>
                <label className="field-label">{t('students.form.dateOfBirth')}</label>
                <input type="date" className="field-input" {...register('dateOfBirth')} />
                {errors.dateOfBirth ? (
                  <p className="mt-1 text-xs text-danger-text">{errors.dateOfBirth.message}</p>
                ) : null}
              </div>
              <div>
                <label className="field-label">{t('students.form.gender')}</label>
                <select className="field-input" {...register('gender')}>
                  <option value="MALE">{t('students.gender.male')}</option>
                  <option value="FEMALE">{t('students.gender.female')}</option>
                </select>
              </div>
              <div>
                <label className="field-label">{t('students.form.address')}</label>
                <input className="field-input" {...register('address')} />
                {errors.address ? (
                  <p className="mt-1 text-xs text-danger-text">{errors.address.message}</p>
                ) : null}
              </div>
              <div>
                <label className="field-label">{t('students.form.photo')}</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="field-input text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1">
                  {t('students.cancel')}
                </button>
                <button type="button" onClick={() => void handleNext()} className="btn-primary flex-1">
                  {t('students.next')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-cream-dark bg-cream/40 p-4 text-sm">
                <p className="font-medium text-teal-800">{watched.fullName}</p>
                <p className="mt-1 text-muted-foreground">
                  {watched.dateOfBirth
                    ? new Date(watched.dateOfBirth).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <label className="field-label">{t('students.form.guardianName')}</label>
                <input className="field-input" {...register('guardianName')} />
                {errors.guardianName ? (
                  <p className="mt-1 text-xs text-danger-text">{errors.guardianName.message}</p>
                ) : null}
              </div>
              <div>
                <label className="field-label">{t('students.form.guardianPhone')}</label>
                <input className="field-input" {...register('guardianPhone')} />
                {errors.guardianPhone ? (
                  <p className="mt-1 text-xs text-danger-text">{errors.guardianPhone.message}</p>
                ) : null}
              </div>
              {apiError ? <p className="text-sm text-danger-text">{apiError}</p> : null}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  {t('students.back')}
                </button>
                <button
                  type="submit"
                  disabled={createStudent.isPending}
                  className="btn-primary flex-1"
                >
                  {createStudent.isPending ? t('students.saving') : t('students.enroll')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
