import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import {
  createUserSchema,
  toCreateUserPayload,
  type CreateUserFormValues,
} from '../schemas/auth.schemas';
import type { useUsers } from '../hooks/useUsers';

type CreateUserModalProps = {
  open: boolean;
  onClose: () => void;
  createUser: ReturnType<typeof useUsers>['createUser'];
};

const defaultValues: CreateUserFormValues = {
  fullName: '',
  phone: '',
  email: '',
  setTemporaryPassword: false,
  temporaryPassword: '',
  confirmTemporaryPassword: '',
  sendInviteEmail: false,
};

export const CreateUserModal = ({ open, onClose, createUser }: CreateUserModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
  });

  const setTemporaryPassword = watch('setTemporaryPassword');

  if (!open) return null;

  const onSubmit = (data: CreateUserFormValues) => {
    createUser.mutate(toCreateUserPayload(data), {
      onSuccess: () => {
        reset(defaultValues);
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Create user</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="field-label">Full name</label>
            <input className="field-input" {...register('fullName')} />
            {errors.fullName && (
              <p className="text-xs text-danger-text mt-1">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="field-input" {...register('phone')} />
            {errors.phone && (
              <p className="text-xs text-danger-text mt-1">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="field-input" {...register('email')} />
            {errors.email && (
              <p className="text-xs text-danger-text mt-1">{errors.email.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" {...register('setTemporaryPassword')} />
            <span className="text-sm text-teal-800">Set temporary password</span>
          </label>

          {setTemporaryPassword ? (
            <div className="space-y-3 rounded-xl border border-cream-dark bg-cream/50 p-3">
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
                    onClick={() => setShowPassword(!showPassword)}
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
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Leave unchecked to auto-send an invite email with a one-time password setup link.
            </p>
          )}

          {createUser.isError && (
            <p className="text-xs text-danger-text">
              Could not create user. Email or phone may already exist.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={createUser.isPending} className="btn-primary flex-1">
              {createUser.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
