import type { UserListItem } from '../types/auth.types';
import type { useUsers } from '../hooks/useUsers';

type DeactivateUserDialogProps = {
  user: UserListItem | null;
  onClose: () => void;
  deactivateUser: ReturnType<typeof useUsers>['deactivateUser'];
  reactivateUser: ReturnType<typeof useUsers>['reactivateUser'];
};

export const DeactivateUserDialog = ({
  user,
  onClose,
  deactivateUser,
  reactivateUser,
}: DeactivateUserDialogProps) => {
  if (!user) return null;

  const isActive = user.status === 'ACTIVE';

  const handleConfirm = () => {
    if (isActive) {
      deactivateUser.mutate(user.id, { onSuccess: () => onClose() });
    } else {
      reactivateUser.mutate(user.id, { onSuccess: () => onClose() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-2">
          {isActive ? 'Deactivate user' : 'Reactivate user'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {isActive
            ? `Deactivate ${user.fullName}? They will lose all system access immediately. Historical data will be preserved.`
            : `Reactivate ${user.fullName}? They will be able to sign in again.`}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deactivateUser.isPending || reactivateUser.isPending}
            className={`flex-1 rounded-md py-3 px-5 text-sm font-medium text-white ${
              isActive ? 'bg-danger-text hover:opacity-90' : 'bg-teal-400 hover:bg-teal-600'
            }`}
          >
            {isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  );
};
