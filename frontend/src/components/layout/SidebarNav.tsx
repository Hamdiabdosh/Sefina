import { Link, useRouterState } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '../AppLogo';
import type { CurrentUser } from '../../features/auth/types/auth.types';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { cn } from '../../lib/utils';
import type { NavBadgeKey, NavSectionConfig } from './navConfig';

type SidebarContentProps = {
  user: CurrentUser;
  sections: NavSectionConfig[];
  badges: Partial<Record<NavBadgeKey, number>>;
  pathname: string;
  onNavigate?: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  brandSubtitle?: string;
  notifCount?: number;
  onNotificationClick?: () => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
}

function roleLabel(user: CurrentUser, t: (k: string) => string) {
  if (user.isSuperAdmin) return t('roles.superAdmin');
  if (user.isMedresaAdmin) return t('roles.amir');
  if (user.isTeacher) return t('roles.teacher');
  return '';
}

export const SidebarNavContent = ({
  user,
  sections,
  badges,
  pathname,
  onNavigate,
  onOpenProfile,
  onLogout,
  brandSubtitle,
  notifCount = 0,
  onNotificationClick,
}: SidebarContentProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <AppLogo size="sm" tone="light" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium leading-tight">{t('auth.appName')}</p>
            <p className="mt-0.5 truncate text-[11px] text-sidebar-muted">
              {brandSubtitle ?? roleLabel(user, t) ?? ''}
            </p>
          </div>
          {notifCount > 0 && onNotificationClick ? (
            <NotificationBell count={notifCount} onClick={onNotificationClick} />
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section) => (
          <div key={section.sectionLabelKey} className="mb-3">
            <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-sidebar-muted">
              {t(`nav.section.${section.sectionLabelKey}`)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                const count = item.badgeKey ? badges[item.badgeKey] : undefined;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                        active
                          ? 'bg-sidebar-active text-sidebar-foreground'
                          : 'text-white/60 hover:bg-sidebar-hover hover:text-white/90'
                      )}
                    >
                      <Icon size={17} strokeWidth={1.75} className="shrink-0 opacity-90" />
                      <span className="flex-1 truncate">{t(`nav.${item.labelKey}`)}</span>
                      {count !== undefined ? (
                        <span
                          className={cn(
                            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
                            item.badgeKey === 'medresas'
                              ? 'bg-teal-400 text-white'
                              : 'bg-white/15 text-white/85'
                          )}
                        >
                          {count > 99 ? '99+' : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <p className="px-4 pb-2 text-[10px] text-sidebar-muted">{t('shortcuts.sidebarHint')}</p>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-sidebar-hover"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-400 text-xs font-medium text-white"
              aria-hidden
            >
              {initials(user.fullName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{user.fullName}</span>
              <span className="block truncate text-[10px] text-sidebar-muted">{roleLabel(user, t)}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onLogout();
              onNavigate?.();
            }}
            className="btn-ghost-inline text-sidebar-muted hover:text-sidebar-foreground"
            aria-label={t('nav.logout')}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const MobileShellBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
  const { t } = useTranslation();
  return (
    <header className="relative flex h-14 shrink-0 items-center gap-3 border-b border-topbar-border bg-surface px-3 shadow-[0_1px_0_0_rgba(15,110,86,0.08)] md:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-10 w-10 items-center justify-center rounded-md text-teal-800 hover:bg-cream-dark"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <AppLogo size="sm" tone="dark" className="h-8 w-8" />
      <span className="text-sm font-medium text-teal-800">{t('auth.appName')}</span>
    </header>
  );
};

export const useActivePath = () =>
  useRouterState({ select: (s) => s.location.pathname });
