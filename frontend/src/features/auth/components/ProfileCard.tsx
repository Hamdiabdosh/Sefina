import { X } from 'lucide-react';
import type { CurrentUser } from '../types/auth.types';
import { UserRoleBadge } from './UserRoleBadge';

type ProfileCardProps = {
  user: CurrentUser;
  onClose: () => void;
};

export const ProfileCard = ({ user, onClose }: ProfileCardProps) => (
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
      <p className="mt-4 text-sm text-teal-600 font-medium">Super Admin</p>
    ) : (
      <div className="mt-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Medresa assignments</p>
        {user.medresaRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No medresa assignments yet.</p>
        ) : (
          user.medresaRoles.map((role) => (
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
