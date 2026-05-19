import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { CourseFormValues } from '../schemas/course.schemas';

type CourseFormFieldsProps = {
  register: UseFormRegister<CourseFormValues>;
  errors: FieldErrors<CourseFormValues>;
  showStatus?: boolean;
};

export const CourseFormFields = ({ register, errors, showStatus }: CourseFormFieldsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label className="field-label">{t('courses.form.nameEn')}</label>
        <input className="field-input" {...register('nameEn')} />
        {errors.nameEn && (
          <p className="text-xs text-danger-text mt-1">{errors.nameEn.message}</p>
        )}
      </div>
      <div>
        <label className="field-label">{t('courses.form.nameAm')}</label>
        <input className="field-input" {...register('nameAm')} />
      </div>
      <div>
        <label className="field-label">{t('courses.form.nameAr')}</label>
        <input className="field-input" {...register('nameAr')} />
      </div>
      <div>
        <label className="field-label">{t('courses.form.descriptionEn')}</label>
        <textarea className="field-input min-h-[80px]" {...register('descriptionEn')} />
        {errors.descriptionEn && (
          <p className="text-xs text-danger-text mt-1">{errors.descriptionEn.message}</p>
        )}
      </div>
      <div>
        <label className="field-label">{t('courses.form.descriptionAm')}</label>
        <textarea className="field-input min-h-[80px]" {...register('descriptionAm')} />
      </div>
      <div>
        <label className="field-label">{t('courses.form.descriptionAr')}</label>
        <textarea className="field-input min-h-[80px]" {...register('descriptionAr')} />
      </div>
      <div>
        <label className="field-label">{t('courses.form.level')}</label>
        <select className="field-input" {...register('level')}>
          <option value="BEGINNER">{t('courses.level.beginner')}</option>
          <option value="INTERMEDIATE">{t('courses.level.intermediate')}</option>
          <option value="ADVANCED">{t('courses.level.advanced')}</option>
        </select>
      </div>
      {showStatus && (
        <div>
          <label className="field-label">{t('courses.form.status')}</label>
          <select className="field-input" {...register('status')}>
            <option value="ACTIVE">{t('courses.status.active')}</option>
            <option value="INACTIVE">{t('courses.status.inactive')}</option>
          </select>
        </div>
      )}
    </>
  );
};
