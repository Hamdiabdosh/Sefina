import { Eye, EyeOff } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import type { CreateTeacherFormValues } from '../schemas/teacher.schemas';

type StaffCredentialsFieldsProps = {
  register: UseFormRegister<CreateTeacherFormValues>;
  errors: FieldErrors<CreateTeacherFormValues>;
  watch: UseFormWatch<CreateTeacherFormValues>;
  showPassword: boolean;
  onToggleShowPassword: () => void;
};

export const StaffCredentialsFields = ({
  register,
  errors,
  watch,
  showPassword,
  onToggleShowPassword,
}: StaffCredentialsFieldsProps) => {
  const setTemporaryPassword = watch('setTemporaryPassword');

  return (
    <div className="space-y-3 rounded-xl border border-cream-dark bg-cream/50 p-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="rounded" {...register('setTemporaryPassword')} />
        <span className="text-sm text-teal-800">Set temporary password</span>
      </label>

      {setTemporaryPassword ? (
        <>
          <p className="text-xs text-muted-foreground">
            Share this password with the user securely. They can sign in immediately.
          </p>
          <div>
            <label className="field-label">Temporary password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="field-input pr-10"
                {...register('temporaryPassword')}
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.temporaryPassword && (
              <p className="text-xs text-danger-text mt-1">{errors.temporaryPassword.message}</p>
            )}
          </div>
          <div>
            <label className="field-label">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="field-input"
              {...register('confirmTemporaryPassword')}
            />
            {errors.confirmTemporaryPassword && (
              <p className="text-xs text-danger-text mt-1">
                {errors.confirmTemporaryPassword.message}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" {...register('sendInviteEmail')} />
            <span className="text-xs text-muted-foreground">
              Also send invite email to set their own password
            </span>
          </label>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          An invite email with a one-time password setup link will be sent automatically.
        </p>
      )}
    </div>
  );
};
