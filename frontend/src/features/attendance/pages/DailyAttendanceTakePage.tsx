import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeft, Check, ClipboardList, MessageSquare, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { cn } from '../../../lib/utils';
import type { AttendanceStatus } from '../types';
import { AttendanceMarkerStrip } from '../components/AttendanceMarkerStrip';
import { formatEthiopianFromYmd } from '../utils/ethiopian';
import { getTodayCalendarEt } from '../utils/ethiopiaDate';
import {
  useAttendanceRoster,
  useCreateAttendanceSession,
  usePatchAttendanceSession,
  useTodayAttendanceSession,
} from '../hooks/useAttendance';

type RowState = {
  studentId: string;
  fullName: string;
  status: AttendanceStatus;
  note: string;
  /** User confirmed this row (required before submit when creating a new roll) */
  touched: boolean;
};

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
}

function statusButtonClasses(status: AttendanceStatus, selected: boolean) {
  if (!selected) {
    return 'border-cream-dark bg-cream text-muted-foreground hover:bg-cream-dark/80';
  }
  switch (status) {
    case 'PRESENT':
      return 'border-teal-400 bg-teal-50 font-medium text-teal-800';
    case 'ABSENT':
      return 'border-[#E24B4A] bg-danger-bg font-medium text-danger-text';
    case 'LATE':
      return 'border-gold-400 bg-warning-bg font-medium text-warning-text';
    case 'EXCUSED':
      return 'border-[#378ADD] bg-info-bg font-medium text-info-text';
    default:
      return '';
  }
}

type DailyAttendanceTakePageProps = {
  variant: 'teacher' | 'medresa_admin';
};

export const DailyAttendanceTakePage = ({ variant }: DailyAttendanceTakePageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const medresaId = search.medresaId ?? '';
  const today = getTodayCalendarEt();

  const rosterQuery = useAttendanceRoster(medresaId, Boolean(medresaId));
  const {
    data: sessionData,
    isLoading: sessionLoading,
    refetch,
  } = useTodayAttendanceSession(medresaId, Boolean(medresaId));

  const createSession = useCreateAttendanceSession();
  const patchSession = usePatchAttendanceSession();

  const rosterItems = rosterQuery.data?.items ?? [];

  const [rows, setRows] = useState<RowState[]>([]);
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const session = sessionData?.session ?? null;
    const byStudent = new Map(session?.records.map((r) => [r.studentId, r]) ?? []);

    setRows(
      rosterItems.map((s) => {
        const prev = byStudent.get(s.id);
        const hasRecord = Boolean(prev);
        return {
          studentId: s.id,
          fullName: s.fullName,
          status: (prev?.status ?? 'ABSENT') as AttendanceStatus,
          note: prev?.note ?? '',
          touched: hasRecord,
        };
      })
    );
  }, [rosterItems, sessionData?.session]);

  const locked = Boolean(sessionData?.session?.isLocked);
  const existingId = sessionData?.session?.id;

  const loading = rosterQuery.isLoading || sessionLoading;

  const backHref = useMemo(() => {
    if (variant === 'teacher') {
      return '/teacher/attendance';
    }
    return '/medresa/attendance';
  }, [variant]);

  const markedCount = useMemo(() => rows.filter((r) => r.touched).length, [rows]);
  const totalStudents = rows.length;
  const progressPct = totalStudents ? Math.round((markedCount / totalStudents) * 100) : 0;
  const unmarkedCount = totalStudents - markedCount;

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const r of rows) {
      c[r.status]++;
    }
    return c;
  }, [rows]);

  const allTouched = totalStudents > 0 && markedCount === totalStudents;
  const canSubmit = allTouched && !locked && !loading;

  const markAll = useCallback((status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => ({ ...r, status, touched: true }))
    );
  }, []);

  const toggleNote = useCallback((studentId: string) => {
    setNoteOpen((m) => ({ ...m, [studentId]: !m[studentId] }));
  }, []);

  const onSubmit = async () => {
    const records = rows.map((r) => ({
      studentId: r.studentId,
      status: r.status,
      ...(r.note.trim() ? { note: r.note.trim() } : {}),
    }));
    try {
      if (existingId && !locked) {
        await patchSession.mutateAsync({
          sessionId: existingId,
          medresaId,
          records: rows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            note: r.note.trim() || null,
          })),
        });
      } else if (!existingId) {
        await createSession.mutateAsync({
          medresaId,
          date: today,
          records,
        });
      }
      await refetch();
      void navigate({
        to: backHref,
        search: { medresaId },
      });
    } catch {
      // surfaced by axios
    }
  };

  const busy = createSession.isPending || patchSession.isPending;

  if (!medresaId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('attendance.takeTitle')} subtitle={t('attendance.noMedresa')} />
        <PageBody>
          <p className="text-sm text-muted-foreground">
            <Link
              to={backHref}
              search={
                backHref === '/medresa/attendance'
                  ? { medresaId: medresaId || undefined, date: undefined }
                  : { medresaId: medresaId || undefined }
              }
              className="text-teal-700 underline"
            >
              {t('attendance.goBack')}
            </Link>
          </p>
        </PageBody>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('attendance.takeTitle')} subtitle={t('attendance.loading')} />
      </div>
    );
  }

  if (rosterItems.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar
          title={t('attendance.takeTitle')}
          onBack={() => void navigate({ to: backHref, search: { medresaId } })}
        />
        <PageBody>
          <EmptyState icon={ClipboardList} title={t('attendance.emptyRoster')} />
        </PageBody>
      </div>
    );
  }

  const sessionInfo = sessionData?.session;
  const showAmirOverrideWarning =
    variant === 'medresa_admin' &&
    Boolean(sessionInfo?.teacherMarkedAt) &&
    !locked;
  const metaParts = [
    formatEthiopianFromYmd(today, t),
    t('attendance.studentCountHeader', { count: rosterItems.length }),
    t('attendance.dailyRollSubtitle'),
  ];

  const goBack = () => void navigate({ to: backHref, search: { medresaId } });

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[7.5rem] md:pb-28">
      {/* Redesigned header: title row + progress (see docs/attendance_redesign.html) */}
      <header className="shrink-0 border-b border-topbar-border bg-surface px-4 pt-3 pb-3 md:px-6">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={goBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cream-dark bg-cream text-muted-foreground hover:bg-cream-dark"
            aria-label={t('attendance.goBack')}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-medium text-foreground">{t('attendance.takeTitle')}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              {metaParts.map((part, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 ? <span className="h-1 w-1 rounded-full bg-cream-dark" aria-hidden /> : null}
                  <span>{part}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full rounded-full bg-teal-400 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{markedCount}</span>
            {' / '}
            {totalStudents} {t('attendance.progressMarkedSuffix')}
          </span>
          {!locked ? (
            <button
              type="button"
              disabled={busy || !canSubmit}
              onClick={() => void onSubmit()}
              className="btn-primary-inline hidden shrink-0 gap-2 px-4 py-2 md:inline-flex"
              title={!allTouched ? t('attendance.completeAllRowsHint') : undefined}
            >
              <Send size={16} />
              {existingId ? t('attendance.saveEdits') : t('attendance.submitAttendance')}
            </button>
          ) : null}
        </div>
      </header>

      {sessionInfo ? (
        <AttendanceMarkerStrip
          teacherMarkedAt={sessionInfo.teacherMarkedAt}
          adminMarkedAt={sessionInfo.adminMarkedAt}
          className="border-b border-cream-dark bg-canvas px-4 py-2 md:px-6"
        />
      ) : null}

      {showAmirOverrideWarning ? (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 md:px-6">
          {t('attendance.amirOverrideWarning')}
        </p>
      ) : null}

      {!locked ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-cream-dark bg-cream px-4 py-2 text-[11px] md:px-6">
          <span className="text-muted-foreground">{t('attendance.bulkMarkAs')}</span>
          <button
            type="button"
            onClick={() => markAll('PRESENT')}
            className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-teal-50 px-2.5 py-1 font-medium text-teal-800 hover:bg-teal-100"
          >
            <Check size={11} strokeWidth={3} />
            {t('attendance.status.present')}
          </button>
          <button
            type="button"
            onClick={() => markAll('ABSENT')}
            className="rounded-md border border-[#E24B4A] bg-surface px-2.5 py-1 text-danger-text hover:bg-danger-bg/60"
          >
            {t('attendance.status.absent')}
          </button>
          <button
            type="button"
            onClick={() => markAll('LATE')}
            className="rounded-md border border-gold-400 bg-surface px-2.5 py-1 text-warning-text hover:bg-warning-bg/60"
          >
            {t('attendance.status.late')}
          </button>
          <span className="ml-auto text-muted-foreground">
            {unmarkedCount > 0
              ? t('attendance.unmarkedCount', { count: unmarkedCount })
              : t('attendance.allMarkedShort')}
          </span>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto bg-canvas px-4 py-3 md:px-6">
        {locked ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            {t('attendance.readOnlyLocked')}
          </p>
        ) : null}

        <div className="space-y-1.5">
          {rows.map((row, idx) => (
            <div
              key={row.studentId}
              className="flex flex-col gap-2 rounded-lg border border-cream-dark bg-surface p-2.5 transition-colors hover:border-teal-200 sm:flex-row sm:items-center sm:gap-3 sm:p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-5 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                  {idx + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[11px] font-medium text-teal-800">
                  {initials(row.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{row.fullName}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{row.studentId}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:justify-end">
                <div className="flex flex-wrap gap-1">
                  {STATUS_OPTIONS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={locked}
                      onClick={() =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.studentId === row.studentId ? { ...r, status: st, touched: true } : r
                          )
                        )
                      }
                      className={cn(
                        'border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 rounded-md',
                        statusButtonClasses(st, row.status === st)
                      )}
                    >
                      {t(`attendance.status.${st.toLowerCase()}` as const)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => toggleNote(row.studentId)}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cream-dark text-muted-foreground hover:bg-cream',
                    row.note.trim() && 'border-teal-400 bg-teal-50 text-teal-700'
                  )}
                  aria-label={t('attendance.notePlaceholder')}
                  title={t('attendance.notePlaceholder')}
                >
                  <MessageSquare size={14} />
                </button>
              </div>

              {noteOpen[row.studentId] ? (
                <div className="sm:col-span-full w-full sm:w-auto sm:min-w-[12rem]">
                  <input
                    type="text"
                    disabled={locked}
                    placeholder={t('attendance.notePlaceholder')}
                    className="field-input w-full py-1.5 text-sm"
                    value={row.note}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.studentId === row.studentId ? { ...r, note: e.target.value } : r
                        )
                      )
                    }
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {!locked ? (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-cream-dark bg-surface px-4 py-3 md:hidden">
          <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              {counts.PRESENT} {t('attendance.summaryPresent')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E24B4A]" />
              {counts.ABSENT} {t('attendance.summaryAbsent')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold-400" />
              {counts.LATE} {t('attendance.summaryLate')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#378ADD]" />
              {counts.EXCUSED} {t('attendance.summaryExcused')}
            </span>
          </div>
          <button
            type="button"
            disabled={busy || !canSubmit}
            onClick={() => void onSubmit()}
            className="btn-primary-inline ml-auto px-5 py-2.5 disabled:opacity-50 w-full sm:w-auto"
            title={!allTouched ? t('attendance.completeAllRowsHint') : undefined}
          >
            <Send size={16} />
            {existingId ? t('attendance.saveEdits') : t('attendance.submitAttendance')}
          </button>
        </div>
      ) : null}
    </div>
  );
};
