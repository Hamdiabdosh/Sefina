import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { CreateTeacherFormValues, TeacherFormValues } from '../schemas/teacher.schemas';

type TeacherFormFieldsProps = {
  register: UseFormRegister<TeacherFormValues | CreateTeacherFormValues>;
  errors: FieldErrors<TeacherFormValues | CreateTeacherFormValues>;
};

export const TeacherFormFields = ({ register, errors }: TeacherFormFieldsProps) => (
  <>
    <div>
      <label className="field-label">Full name</label>
      <input type="text" className="field-input" {...register('fullName')} />
      {errors.fullName && <p className="text-xs text-danger-text mt-1">{errors.fullName.message}</p>}
    </div>
    <div>
      <label className="field-label">Phone</label>
      <input type="tel" className="field-input" {...register('phone')} />
      {errors.phone && <p className="text-xs text-danger-text mt-1">{errors.phone.message}</p>}
    </div>
    <div>
      <label className="field-label">Email</label>
      <input type="email" className="field-input" {...register('email')} />
      {errors.email && <p className="text-xs text-danger-text mt-1">{errors.email.message}</p>}
    </div>
        <div>
      <label className="field-label">Specialization (English)</label>
      <input type="text" className="field-input" {...register('specializationEn')} />
      {errors.specializationEn && (
        <p className="text-xs text-danger-text mt-1">{errors.specializationEn.message}</p>
      )}
    </div>
    <div>
      <label className="field-label">Specialization (Amharic, optional)</label>
      <input type="text" className="field-input" {...register('specializationAm')} />
    </div>
    <div>
      <label className="field-label">Specialization (Arabic, optional)</label>
      <input type="text" className="field-input" {...register('specializationAr')} />
    </div>
    <div>
      <label className="field-label">Date joined</label>
      <input type="date" className="field-input" {...register('dateJoined')} />
      {errors.dateJoined && (
        <p className="text-xs text-danger-text mt-1">{errors.dateJoined.message}</p>
      )}
    </div>
    <div>
      <label className="field-label">CBE Account Number (optional)</label>
      <input type="text" className="field-input" {...register('cbeAccount')} />
    </div>
  </>
);
