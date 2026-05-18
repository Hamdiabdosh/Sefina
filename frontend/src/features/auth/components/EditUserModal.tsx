import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { editUserSchema, toUpdateUserPayload, type EditUserFormValues } from '../schemas/auth.schemas';
import type { UserListItem } from '../types/auth.types';
import type { useUsers } from '../hooks/useUsers';

type EditUserModalProps = {
  user: UserListItem | null;
  onClose: () => void;
  updateUser: ReturnType<typeof useUsers>['updateUser'];
};

export const EditUserModal = ({ user, onClose, updateUser }: EditUserModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      setTemporaryPassword: false,
      temporaryPassword: '',
      confirmTemporaryPassword: '',
    },
  });

  const setTemporaryPassword = watch('setTemporaryPassword');

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        setTemporaryPassword: false,
        temporaryPassword: '',
        confirmTemporaryPassword: '',
      });
    }
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = (data: EditUserFormValues) => {
    updateUser.mutate(
      { id: user.id, data: toUpdateUserPayload(data) },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-teal-800 mb-4">Edit user</h3>
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

          <div className="border-t border-cream-dark pt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" className="rounded" {...register('setTemporaryPassword')} />
              <span className="text-sm text-teal-800">Set new temporary password</span>
            </label>

            {setTemporaryPassword && (
              <div className="space-y-3 rounded-xl border border-cream-dark bg-cream/50 p-3">
                <p className="text-xs text-muted-foreground">
                  This will replace their current password and sign them out of all devices.
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
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={updateUser.isPending} className="btn-primary flex-1">
              {updateUser.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
