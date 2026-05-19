import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { BookOpen, Building2, Clock, GraduationCap, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCurrentUser } from '../features/auth/hooks/useCurrentUser';
import { ProfileCard } from '../features/auth/components/ProfileCard';

export const AppShell = () => {
  const { t } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!currentUser) return null;

  const navLinks = currentUser.isSuperAdmin
    ? [
        { to: '/admin/medresas', label: t('nav.medresas'), icon: Building2 },
        { to: '/admin/teachers', label: t('nav.teachers'), icon: GraduationCap },
        { to: '/admin/courses', label: t('nav.courses'), icon: BookOpen },
      ]
    : currentUser.isMedresaAdmin
      ? [
          { to: '/medresa/dashboard', label: t('nav.dashboard'), icon: Building2 },
          { to: '/medresa/courses', label: t('nav.courses'), icon: BookOpen },
        ]
      : currentUser.isTeacher
        ? [{ to: '/teacher/dashboard', label: t('nav.dashboard'), icon: Building2 }]
        : [{ to: '/account/pending', label: t('nav.pending'), icon: Clock }];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <span className="font-medium text-teal-800">Sefinet Al Neja</span>
          <nav className="flex gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    active ? 'bg-teal-50 text-teal-600' : 'text-muted-foreground hover:bg-cream-dark'
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProfile((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-cream-dark"
          >
            <User size={16} />
            {currentUser.fullName}
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-danger-text hover:bg-danger-bg"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {showProfile && (
        <div className="max-w-lg mx-auto p-4">
          <ProfileCard user={currentUser} onClose={() => setShowProfile(false)} />
        </div>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  );
};
