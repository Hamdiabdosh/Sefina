import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import {
  setStaffPasswordSchema,
  type SetStaffPasswordFormValues,
} from '../../auth/schemas/auth.schemas';
import type { useUserAccountActions } from '../hooks/useUserAccountActions';

type SetStaffPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  setPassword: ReturnType<typeof useUserAccountActions>['setPassword'];
};

export const SetStaffPasswordModal = ({ open, onClose, setPassword }: SetStaffPasswordModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetStaffPasswordFormValues>({
    resolver: zodResolver(setStaffPasswordSchema),
    defaultValues: { temporaryPassword: '', confirmTemporaryPassword: '' },
  });

  if (!open) return null;

  const onSubmit = (data: SetStaffPasswordFormValues) => {
    setPassword.mutate(data.temporaryPassword, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Set temporary password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                onClick={() => setShowPassword((v) => !v)}
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
          {setPassword.isError && (
            <p className="text-xs text-danger-text">Could not set password.</p>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={setPassword.isPending} className="btn-primary flex-1">
              {setPassword.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
