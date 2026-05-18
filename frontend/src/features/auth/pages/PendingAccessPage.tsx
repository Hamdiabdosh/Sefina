import { Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCurrentUser } from '../hooks/useCurrentUser';

export const PendingAccessPage = () => {
  const { currentUser } = useCurrentUser();
  const { logout } = useAuth();

  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="bg-white rounded-xl border border-cream-dark p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 text-teal-500">
          <Clock size={28} />
        </div>
        <h2 className="text-lg font-medium text-teal-800 mb-2">Account pending setup</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Hi {currentUser?.fullName}, your account is active but not linked to a medresa yet.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Ask your Super Admin to assign you to a medresa as a teacher or admin. Then sign in
          again.
        </p>
        <button type="button" onClick={() => logout()} className="btn-secondary">
          Sign out
        </button>
      </div>
    </div>
  );
};
