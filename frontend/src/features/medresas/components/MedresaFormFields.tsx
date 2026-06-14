import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Field } from '../../../components/ui/Field';
import type { MedresaFormValues } from '../schemas/medresa.schemas';

type MedresaFormFieldsProps = {
  register: UseFormRegister<MedresaFormValues>;
  errors: FieldErrors<MedresaFormValues>;
};

export const MedresaFormFields = ({ register, errors }: MedresaFormFieldsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Field label={t('medresas.form.name')} error={errors.name?.message}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className="field-input"
            {...register('name')}
          />
        )}
      </Field>
      <Field label={t('medresas.form.location')} error={errors.location?.message}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className="field-input"
            {...register('location')}
          />
        )}
      </Field>
      <Field label={t('medresas.form.phone')} error={errors.phone?.message}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="tel"
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className="field-input"
            {...register('phone')}
          />
        )}
      </Field>
    </>
  );
};
