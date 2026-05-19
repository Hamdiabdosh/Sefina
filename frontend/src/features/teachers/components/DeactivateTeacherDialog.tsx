import type { TeacherListItem } from '../types';
import type { useTeachers } from '../hooks/useTeachers';

type DeactivateTeacherDialogProps = {
  teacher: TeacherListItem | null;
  onClose: () => void;
  deactivateTeacher: ReturnType<typeof useTeachers>['deactivateTeacher'];
  reactivateTeacher: ReturnType<typeof useTeachers>['reactivateTeacher'];
};

export const DeactivateTeacherDialog = ({
  teacher,
  onClose,
  deactivateTeacher,
  reactivateTeacher,
}: DeactivateTeacherDialogProps) => {
  if (!teacher) return null;
  const isActive = teacher.status === 'ACTIVE';

  const handleConfirm = () => {
    if (isActive) {
      deactivateTeacher.mutate(teacher.id, { onSuccess: () => onClose() });
    } else {
      reactivateTeacher.mutate(teacher.id, { onSuccess: () => onClose() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-medium text-teal-800 mb-2">
          {isActive ? 'Deactivate teacher' : 'Reactivate teacher'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {isActive
            ? `Deactivate ${teacher.fullName}? They will lose access to all medresas immediately. Historical data will be preserved.`
            : `Reactivate ${teacher.fullName}? They will be able to sign in again.`}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deactivateTeacher.isPending || reactivateTeacher.isPending}
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
