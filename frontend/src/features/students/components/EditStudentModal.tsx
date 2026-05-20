import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { StudentFormFields } from './StudentFormFields';
import {
  getStudentMutationError,
  studentFormSchema,
  type StudentFormValues,
} from '../schemas/student.schemas';
import type { StudentDetail } from '../types';
import type { useStudent } from '../hooks/useStudent';

type EditStudentModalProps = {
  open: boolean;
  onClose: () => void;
  student: StudentDetail;
  updateStudent: ReturnType<typeof useStudent>['updateStudent'];
};

export const EditStudentModal = ({
  open,
  onClose,
  student,
  updateStudent,
}: EditStudentModalProps) => {
  const { t } = useTranslation();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth.slice(0, 10),
      gender: student.gender,
      address: student.address,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: student.fullName,
        dateOfBirth: student.dateOfBirth.slice(0, 10),
        gender: student.gender,
        address: student.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
      });
    }
  }, [open, student, reset]);

  if (!open) return null;

  const onSubmit = (data: StudentFormValues) => {
    updateStudent.mutate(
      { values: data, photo: photoFile },
      {
        onSuccess: () => {
          setPhotoFile(null);
          onClose();
        },
      }
    );
  };

  const apiError = updateStudent.isError
    ? (getStudentMutationError(updateStudent.error) ?? t('students.updateError'))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('students.editTitle')}</h3>
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
              disabled={updateStudent.isPending}
              className="btn-primary flex-1"
            >
              {updateStudent.isPending ? t('students.saving') : t('students.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
