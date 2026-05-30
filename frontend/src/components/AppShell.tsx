import { Outlet, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCurrentUser } from '../features/auth/hooks/useCurrentUser';
import { ProfileCard } from '../features/auth/components/ProfileCard';
import { useMedresas } from '../features/medresas/hooks/useMedresas';
import { useNotifications } from '../features/notifications/useNotifications';
import { useTeachers } from '../features/teachers/hooks/useTeachers';
import { buildNavSections } from './layout/navConfig';
import { ShellMainSkeleton, ShellSidebarSkeleton } from './layout/ShellSidebarSkeleton';
import { MobileShellBar, SidebarNavContent, useActivePath } from './layout/SidebarNav';

export const AppShell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const { pendingGradeEdits } = useNotifications(Boolean(currentUser));
  const { logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useActivePath();

  useKeyboardShortcuts(currentUser, {
    onNavigate: (to) => void navigate({ to }),
    onOpenProfile: () => setShowProfile(true),
    onShowHelp: () => setShowShortcutsHelp(true),
    onCloseOverlays: () => {
      setShowProfile(false);
      setShowShortcutsHelp(false);
      setMobileOpen(false);
    },
  });

  const showAdminData = Boolean(currentUser?.isSuperAdmin);

  const { medresas } = useMedresas({ enabled: showAdminData });
  const { pagination: teacherPagination } = useTeachers(
    {},
    { enabled: showAdminData }
  );

  const badges = useMemo(
    () => ({
      medresas: medresas.length,
      teachers: teacherPagination?.total ?? 0,
    }),
    [medresas.length, teacherPagination?.total]
  );

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-canvas">
        <aside
          className="fixed inset-y-0 left-0 z-20 hidden h-dvh w-[220px] shrink-0 border-r border-sidebar-border md:flex md:flex-col"
          aria-hidden
        >
          <ShellSidebarSkeleton />
        </aside>
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:pl-[220px]">
          <MobileShellBar onOpenMenu={() => {}} />
          <ShellMainSkeleton />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const sections = buildNavSections(currentUser);

  const brandSubtitle = currentUser.isSuperAdmin
    ? t('nav.brandSuperAdmin')
    : undefined;

  const handleNotificationClick = () => {
    if (currentUser.isSuperAdmin) {
      void navigate({ to: '/admin/grade-edits' });
      return;
    }
    if (currentUser.isMedresaAdmin) {
      void navigate({ to: '/medresa/grade-edits' });
      return;
    }
    if (currentUser.isTeacher) {
      void navigate({ to: '/teacher/grades' });
    }
  };

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Fixed to viewport on md+ so it does not scroll with the main column */}
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden h-dvh w-[220px] shrink-0 flex-col border-r border-sidebar-border md:flex md:flex-col"
        aria-label="Main navigation"
      >
        <SidebarNavContent
          user={currentUser}
          sections={sections}
          badges={badges}
          pathname={pathname}
          notifCount={pendingGradeEdits}
          onNotificationClick={handleNotificationClick}
          onOpenProfile={() => setShowProfile(true)}
          onLogout={logout}
          brandSubtitle={brandSubtitle}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(280px,85vw)] shadow-xl">
            <SidebarNavContent
              user={currentUser}
              sections={sections}
              badges={badges}
              pathname={pathname}
              notifCount={pendingGradeEdits}
              onNotificationClick={() => {
                handleNotificationClick();
                setMobileOpen(false);
              }}
              onNavigate={() => setMobileOpen(false)}
              onOpenProfile={() => {
                setMobileOpen(false);
                setShowProfile(true);
              }}
              onLogout={logout}
              brandSubtitle={brandSubtitle}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:pl-[220px]">
        <MobileShellBar onOpenMenu={() => setMobileOpen(true)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>

      {showProfile ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-16"
          role="dialog"
          aria-modal="true"
          aria-label={t('shortcuts.openProfile')}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label={t('shortcuts.close')}
            onClick={() => setShowProfile(false)}
          />
          <div className="relative z-10 w-full max-w-lg">
            <ProfileCard user={currentUser} onClose={() => setShowProfile(false)} />
          </div>
        </div>
      ) : null}

      {showShortcutsHelp ? (
        <KeyboardShortcutsHelp user={currentUser} onClose={() => setShowShortcutsHelp(false)} />
      ) : null}
    </div>
  );
};
