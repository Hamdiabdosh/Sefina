import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeacherFormFields } from './TeacherFormFields';
import {
  getTeacherMutationError,
  teacherFormSchema,
  toTeacherApiPayloadFromBasic,
  type TeacherFormValues,
} from '../schemas/teacher.schemas';
import type { TeacherListItem } from '../types';
import type { useTeachers } from '../hooks/useTeachers';
import { getLocalizedValue } from '../utils/localizedJson';

type EditTeacherModalProps = {
  teacher: TeacherListItem | null;
  onClose: () => void;
  updateTeacher: ReturnType<typeof useTeachers>['updateTeacher'];
  uploadPhoto: ReturnType<typeof useTeachers>['uploadPhoto'];
};

export const EditTeacherModal = ({
  teacher,
  onClose,
  updateTeacher,
  uploadPhoto,
}: EditTeacherModalProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
  });

  useEffect(() => {
    if (teacher) {
      const spec = teacher.specialization;
      reset({
        fullName: teacher.fullName,
        phone: teacher.phone,
        email: teacher.email,
        specializationEn: spec.en ?? getLocalizedValue(spec),
        specializationAm: spec.am ?? '',
        specializationAr: spec.ar ?? '',
        dateJoined: teacher.dateJoined.slice(0, 10),
        cbeAccount: teacher.cbeAccount ?? '',
      });
    }
  }, [teacher, reset]);

  if (!teacher) return null;

  const onSubmit = (data: TeacherFormValues) => {
    updateTeacher.mutate(
      { id: teacher.id, data: toTeacherApiPayloadFromBasic(data) },
      {
        onSuccess: () => {
          if (photoFile) {
            uploadPhoto.mutate(
              { id: teacher.id, file: photoFile },
              {
                onSettled: () => {
                  setPhotoFile(null);
                  onClose();
                },
              }
            );
          } else {
            onClose();
          }
        },
      }
    );
  };

  const apiError = updateTeacher.isError
    ? (getTeacherMutationError(updateTeacher.error) ?? 'Could not save teacher.')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Edit teacher</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TeacherFormFields register={register} errors={errors} />
          <div>
            <label className="field-label">Photo (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="field-input"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {apiError && <p className="text-xs text-danger-text">{apiError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTeacher.isPending || uploadPhoto.isPending}
              className="btn-primary flex-1"
            >
              {updateTeacher.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
