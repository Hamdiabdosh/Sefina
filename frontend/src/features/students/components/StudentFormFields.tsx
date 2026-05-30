import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { StudentFormValues } from '../schemas/student.schemas';

type StudentFormFieldsProps = {
  register: UseFormRegister<StudentFormValues>;
  errors: FieldErrors<StudentFormValues>;
};

export const StudentFormFields = ({ register, errors }: StudentFormFieldsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label className="field-label">{t('students.form.fullName')}</label>
        <input className="field-input" {...register('fullName')} />
        {errors.fullName && (
          <p className="text-danger-text text-xs mt-1">{errors.fullName.message}</p>
        )}
      </div>
      <div>
        <label className="field-label">{t('students.form.fullNameAm')}</label>
        <input className="field-input" {...register('fullNameAm')} />
      </div>
      <div>
        <label className="field-label">{t('students.form.fullNameAr')}</label>
        <input dir="rtl" className="field-input" {...register('fullNameAr')} />
      </div>
      <div>
        <label className="field-label">{t('students.form.dateOfBirth')}</label>
        <input type="date" className="field-input" {...register('dateOfBirth')} />
        {errors.dateOfBirth && (
          <p className="text-danger-text text-xs mt-1">{errors.dateOfBirth.message}</p>
        )}
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
        {errors.address && (
          <p className="text-danger-text text-xs mt-1">{errors.address.message}</p>
        )}
      </div>
      <div>
        <label className="field-label">{t('students.form.guardianName')}</label>
        <input className="field-input" {...register('guardianName')} />
        {errors.guardianName && (
          <p className="text-danger-text text-xs mt-1">{errors.guardianName.message}</p>
        )}
      </div>
      <div>
        <label className="field-label">{t('students.form.guardianPhone')}</label>
        <input className="field-input" {...register('guardianPhone')} />
        {errors.guardianPhone && (
          <p className="text-danger-text text-xs mt-1">{errors.guardianPhone.message}</p>
        )}
      </div>
    </>
  );
};
