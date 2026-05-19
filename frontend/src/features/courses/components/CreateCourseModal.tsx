import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CourseFormFields } from './CourseFormFields';
import {
  courseFormSchema,
  getCourseMutationError,
  toCourseApiPayload,
  type CourseFormValues,
} from '../schemas/course.schemas';
import type { useCourses } from '../hooks/useCourses';

type CreateCourseModalProps = {
  open: boolean;
  onClose: () => void;
  createCourse: ReturnType<typeof useCourses>['createCourse'];
};

const defaultValues: CourseFormValues = {
  nameEn: '',
  nameAm: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAm: '',
  descriptionAr: '',
  level: 'BEGINNER',
};

export const CreateCourseModal = ({ open, onClose, createCourse }: CreateCourseModalProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  if (!open) return null;

  const onSubmit = (data: CourseFormValues) => {
    createCourse.mutate(toCourseApiPayload(data), {
      onSuccess: () => {
        reset(defaultValues);
        onClose();
      },
    });
  };

  const apiError = createCourse.isError ? getCourseMutationError(createCourse.error) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">{t('courses.createTitle')}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CourseFormFields register={register} errors={errors} />
          {apiError && <p className="text-xs text-danger-text">{apiError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('courses.cancel')}
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={createCourse.isPending}>
              {createCourse.isPending ? t('courses.saving') : t('courses.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
