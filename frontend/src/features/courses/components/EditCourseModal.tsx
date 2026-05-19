import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CourseFormFields } from './CourseFormFields';
import {
  courseFormFromApi,
  courseFormSchema,
  getCourseMutationError,
  toCourseApiPayload,
  type CourseFormValues,
} from '../schemas/course.schemas';
import type { CourseListItem } from '../types';
import type { useCourses } from '../hooks/useCourses';

type EditCourseModalProps = {
  open: boolean;
  course: CourseListItem | null;
  onClose: () => void;
  updateCourse: ReturnType<typeof useCourses>['updateCourse'];
};

export const EditCourseModal = ({ open, course, onClose, updateCourse }: EditCourseModalProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
  });

  useEffect(() => {
    if (course && open) {
      reset(courseFormFromApi(course));
    }
  }, [course, open, reset]);

  if (!open || !course) return null;

  const onSubmit = (data: CourseFormValues) => {
    updateCourse.mutate(
      { id: course.id, data: toCourseApiPayload(data) },
      { onSuccess: () => onClose() }
    );
  };

  const apiError = updateCourse.isError ? getCourseMutationError(updateCourse.error) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('courses.editTitle')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CourseFormFields register={register} errors={errors} showStatus />
          {apiError && <p className="text-xs text-danger-text">{apiError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('courses.cancel')}
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? t('courses.saving') : t('courses.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
