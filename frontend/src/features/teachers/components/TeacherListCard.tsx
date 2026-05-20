import { useNavigate } from '@tanstack/react-router';
import { Building2, Eye, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';
import { TeacherAvatar } from './TeacherAvatar';
import type { TeacherListItem } from '../types';
import { getLocalizedValue } from '../utils/localizedJson';

const AVATAR_INITIAL = [
  'bg-teal-50 text-teal-800',
  'bg-info-bg text-info-text',
  'bg-gold-50 text-warning-text',
  'bg-teal-50 text-teal-600',
  'bg-[#EEEDFE] text-[#3C3489]',
] as const;

const SUBJECT_BADGE = [
  'bg-teal-50 text-teal-800 border border-teal-100',
  'bg-info-bg text-info-text border border-teal-100',
  'bg-gold-50 text-warning-text border border-amber-200',
  'bg-[#EEEDFE] text-[#3C3489] border border-teal-100',
  'bg-orange-50 text-orange-900 border border-orange-200',
  'bg-pink-50 text-pink-900 border border-pink-200',
] as const;

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
}

type TeacherListCardProps = {
  teacher: TeacherListItem;
  index: number;
};

export const TeacherListCard = ({ teacher, index }: TeacherListCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const specLabel = getLocalizedValue(teacher.specialization);
  const badgeIdx = hashStr(specLabel.toLowerCase()) % SUBJECT_BADGE.length;
  const avatarIdx = index % AVATAR_INITIAL.length;
  const nMedresa = teacher.medresaAssignments.length;
  const isAdmin = teacher.medresaAssignments.some((a) => a.role === 'ADMIN');

  const open = () =>
    void navigate({
      to: '/admin/teachers/$teacherId',
      params: { teacherId: teacher.id },
    });

  return (
    <div
      className="group flex cursor-pointer items-start gap-3.5 rounded-lg border border-cream-dark bg-surface p-3.5 transition-colors hover:border-teal-200 md:gap-4 md:p-4"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      {teacher.photoUrl ? (
        <TeacherAvatar
          teacherId={teacher.id}
          name={teacher.fullName}
          photoUrl={teacher.photoUrl}
          size="sm"
          square
        />
      ) : (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-medium',
            AVATAR_INITIAL[avatarIdx]
          )}
          aria-hidden
        >
          {initials(teacher.fullName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{teacher.fullName}</span>
          {specLabel ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                SUBJECT_BADGE[badgeIdx]
              )}
            >
              {specLabel}
            </span>
          ) : null}
          {isAdmin ? (
            <span className="rounded-full border border-cream-dark bg-cream px-2 py-0.5 text-[10px] text-muted-foreground">
              {t('teacherDirectory.roleAdmin')}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {teacher.medresaAssignments.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">—</span>
          ) : (
            teacher.medresaAssignments.map((a) => (
              <span
                key={a.id}
                className="rounded border border-cream-dark bg-cream px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {a.medresaName}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-800">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              teacher.status === 'ACTIVE' ? 'bg-teal-400' : 'bg-danger-text'
            )}
          />
          {teacher.status === 'ACTIVE'
            ? t('teacherDirectory.active')
            : t('teacherDirectory.inactive')}
        </div>

        <div className="hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-cream-dark bg-cream text-muted-foreground hover:bg-cream-dark"
            aria-label={t('teacherDirectory.editTeacher')}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-cream-dark bg-cream text-muted-foreground hover:bg-cream-dark"
            aria-label={t('teacherDirectory.viewTeacher')}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <Eye size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Building2 size={12} className="shrink-0 opacity-80" aria-hidden />
          <span>
            {nMedresa === 1
              ? t('teacherDirectory.oneMedresa', { count: nMedresa })
              : t('teacherDirectory.nMedresas', { count: nMedresa })}
          </span>
        </div>
      </div>
    </div>
  );
};
