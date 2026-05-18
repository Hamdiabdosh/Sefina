type UserRoleBadgeProps = {
  role: 'TEACHER' | 'ADMIN';
  medresaName: string;
};

export const UserRoleBadge = ({ role, medresaName }: UserRoleBadgeProps) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
      role === 'ADMIN'
        ? 'bg-info-bg text-info-text'
        : 'bg-cream-dark text-muted-foreground'
    }`}
  >
    {role === 'ADMIN' ? 'Admin' : 'Teacher'} · {medresaName}
  </span>
);
