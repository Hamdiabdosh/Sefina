import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { StudentFormFields } from './StudentFormFields';
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

export const EnrollStudentModal = ({
  open,
  onClose,
  createStudent,
}: EnrollStudentModalProps) => {
  const { t } = useTranslation();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  if (!open) return null;

  const onSubmit = (data: StudentFormValues) => {
    createStudent.mutate(
      { values: data, photo: photoFile },
      {
        onSuccess: () => {
          reset(defaultValues);
          setPhotoFile(null);
          onClose();
        },
      }
    );
  };

  const apiError = createStudent.isError
    ? (getStudentMutationError(createStudent.error) ?? t('students.enrollError'))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('students.enrollTitle')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <StudentFormFields register={register} errors={errors} />
          <div>
            <label className="field-label">{t('students.form.photo')}</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="field-input text-sm"
            />
          </div>
          {apiError && <p className="text-danger-text text-sm">{apiError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('students.cancel')}
            </button>
            <button
              type="submit"
              disabled={createStudent.isPending}
              className="btn-primary flex-1"
            >
              {createStudent.isPending ? t('students.saving') : t('students.enroll')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
