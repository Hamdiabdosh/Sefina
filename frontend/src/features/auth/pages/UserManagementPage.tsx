import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { useUsers } from '../hooks/useUsers';
import { UserRoleBadge } from '../components/UserRoleBadge';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { DeactivateUserDialog } from '../components/DeactivateUserDialog';
import type { UserListItem } from '../types/auth.types';

export const UserManagementPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [toggleUser, setToggleUser] = useState<UserListItem | null>(null);

  const filters = {
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  };

  const [inviteSentId, setInviteSentId] = useState<string | null>(null);

  const { users, isLoading, error, createUser, updateUser, deactivateUser, reactivateUser, resendInvite } =
    useUsers(filters);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader title="Users" subtitle="Network teacher accounts" />

      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-200" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="field-input sm:w-40"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="button" onClick={() => setShowCreate(true)} className="btn-primary sm:w-auto px-6">
            <Plus size={18} />
            Create user
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-cream-dark" />
            ))}
          </div>
        )}

        {error && <p className="text-danger-text text-center py-8">Failed to load users.</p>}

        {!isLoading && !error && users.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No users found.</p>
        )}

        {!isLoading &&
          users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-cream-dark p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-teal-800">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.medresaRoles.slice(0, 3).map((role) => (
                      <UserRoleBadge
                        key={`${role.medresaId}-${role.role}`}
                        role={role.role}
                        medresaName={role.medresaName}
                      />
                    ))}
                    {user.medresaRoles.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{user.medresaRoles.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      user.status === 'ACTIVE'
                        ? 'bg-success-bg text-success-text'
                        : 'bg-danger-bg text-danger-text'
                    }`}
                  >
                    {user.status}
                  </span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {user.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={resendInvite.isPending && resendInvite.variables === user.id}
                        onClick={() => {
                          resendInvite.mutate(user.id, {
                            onSuccess: () => {
                              setInviteSentId(user.id);
                              setTimeout(() => setInviteSentId(null), 3000);
                            },
                          });
                        }}
                        className="text-xs text-teal-600 hover:underline disabled:opacity-50"
                      >
                        {inviteSentId === user.id ? 'Invite sent' : 'Resend invite'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditUser(user)}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setToggleUser(user)}
                      className="text-xs text-danger-text hover:underline"
                    >
                      {user.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} createUser={createUser} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} updateUser={updateUser} />
      <DeactivateUserDialog
        user={toggleUser}
        onClose={() => setToggleUser(null)}
        deactivateUser={deactivateUser}
        reactivateUser={reactivateUser}
      />
    </div>
  );
};
