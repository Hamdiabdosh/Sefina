import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { MedresaFormValues } from '../schemas/medresa.schemas';

type MedresaFormFieldsProps = {
  register: UseFormRegister<MedresaFormValues>;
  errors: FieldErrors<MedresaFormValues>;
};

export const MedresaFormFields = ({ register, errors }: MedresaFormFieldsProps) => (
  <>
    <div>
      <label className="field-label">Medresa name</label>
      <input className="field-input" {...register('name')} />
      {errors.name && <p className="text-xs text-danger-text mt-1">{errors.name.message}</p>}
    </div>
    <div>
      <label className="field-label">Location</label>
      <input className="field-input" {...register('location')} />
      {errors.location && (
        <p className="text-xs text-danger-text mt-1">{errors.location.message}</p>
      )}
    </div>
    <div>
      <label className="field-label">Phone (optional)</label>
      <input type="tel" className="field-input" {...register('phone')} />
      {errors.phone && <p className="text-xs text-danger-text mt-1">{errors.phone.message}</p>}
    </div>
  </>
);
