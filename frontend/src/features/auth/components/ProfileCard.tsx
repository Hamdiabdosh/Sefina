import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TeacherAvatar } from '../../teachers/components/TeacherAvatar';
import { useTeacherMe } from '../../teachers/hooks/useTeachers';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import type { CurrentUser } from '../types/auth.types';
import { UserRoleBadge } from './UserRoleBadge';

type ProfileCardProps = {
  user: CurrentUser;
  onClose: () => void;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const ProfileCard = ({ user, onClose }: ProfileCardProps) => {
  const { t } = useTranslation();
  const { data: teacherProfile } = useTeacherMe(user.isTeacher && !user.isSuperAdmin);

  return (
  <div className="bg-white rounded-xl border border-cream-dark p-6 shadow-sm relative">
    <button
      type="button"
      onClick={onClose}
      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      aria-label="Close profile"
    >
      <X size={18} />
    </button>
    <h2 className="text-lg font-medium text-teal-800 mb-4">My profile</h2>

      {teacherProfile && (
        <div className="flex flex-col items-center mb-4">
          <TeacherAvatar
            teacherId={teacherProfile.id}
            name={teacherProfile.fullName}
            photoUrl={teacherProfile.photoUrl}
            size="lg"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {getLocalizedValue(teacherProfile.specialization)} · Joined {formatDate(teacherProfile.dateJoined)}
          </p>
        </div>
      )}

    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Full name</dt>
        <dd className="font-medium">{user.fullName}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Email</dt>
        <dd>{user.email}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Phone</dt>
        <dd>{user.phone}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs ${
              user.status === 'ACTIVE'
                ? 'bg-success-bg text-success-text'
                : 'bg-danger-bg text-danger-text'
            }`}
          >
            {user.status}
          </span>
        </dd>
      </div>
    </dl>
    {user.isSuperAdmin ? (
      <p className="mt-4 text-sm text-teal-600 font-medium">{t('roles.superAdmin')}</p>
    ) : (
      <div className="mt-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Medresa assignments</p>
        {(teacherProfile?.medresaAssignments ?? user.medresaRoles).length === 0 ? (
          <p className="text-sm text-muted-foreground">No medresa assignments yet.</p>
        ) : (
          (teacherProfile ? teacherProfile.medresaAssignments : user.medresaRoles).map((role) => (
            <UserRoleBadge
              key={`${role.medresaId}-${role.role}`}
              role={role.role}
              medresaName={role.medresaName}
            />
          ))
        )}
      </div>
    )}
  </div>
  );
};
