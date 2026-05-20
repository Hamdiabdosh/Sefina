import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/PageHeader';
import type { AttendanceStatus } from '../types';
import { getTodayCalendarEt } from '../utils/ethiopiaDate';
import { useTeacherStudents } from '../../students/hooks/useTeacherStudents';
import {
  useCreateAttendanceSession,
  usePatchAttendanceSession,
  useTodayAttendanceSession,
} from '../hooks/useAttendance';

type RowState = { studentId: string; fullName: string; status: AttendanceStatus; note: string };

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export const TeacherCourseAttendancePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { medresaCourseId } = useParams({ strict: false }) as { medresaCourseId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const today = getTodayCalendarEt();

  const { data: studentsData, isLoading: studentsLoading } = useTeacherStudents();
  const { data: sessionData, isLoading: sessionLoading, refetch } = useTodayAttendanceSession(
    medresaCourseId,
    Boolean(medresaCourseId)
  );
  const createSession = useCreateAttendanceSession();
  const patchSession = usePatchAttendanceSession();

  const roster = useMemo(() => {
    const items = studentsData?.items ?? [];
    return items.filter((s) =>
      s.enrolledCourses.some((c) => c.medresaCourseId === medresaCourseId)
    );
  }, [studentsData?.items, medresaCourseId]);

  const [rows, setRows] = useState<RowState[]>([]);

  useEffect(() => {
    const session = sessionData?.session ?? null;
    const byStudent = new Map(
      session?.records.map((r) => [r.studentId, r]) ?? []
    );
    setRows(
      roster.map((s) => {
        const prev = byStudent.get(s.id);
        return {
          studentId: s.id,
          fullName: s.fullName,
          status: (prev?.status ?? 'ABSENT') as AttendanceStatus,
          note: prev?.note ?? '',
        };
      })
    );
  }, [roster, sessionData?.session]);

  const locked = Boolean(sessionData?.session?.isLocked);
  const existingId = sessionData?.session?.id;

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
          medresaCourseId,
          records: rows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            note: r.note.trim() || null,
          })),
        });
      } else if (!existingId) {
        await createSession.mutateAsync({
          medresaCourseId,
          date: today,
          records,
        });
      }
      await refetch();
      void navigate({ to: '/teacher/attendance', search: { medresaId: search.medresaId } });
    } catch {
      // axios interceptor surfaces errors; toast could be added later
    }
  };

  const busy = createSession.isPending || patchSession.isPending;

  if (studentsLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-cream p-4">
        <PageHeader title={t('attendance.takeTitle')} subtitle={t('attendance.loading')} />
      </div>
    );
  }

  if (roster.length === 0) {
    return (
      <div className="min-h-screen bg-cream p-4">
        <PageHeader
          title={t('attendance.takeTitle')}
          onBack={() =>
            void navigate({ to: '/teacher/attendance', search: { medresaId: search.medresaId } })
          }
        />
        <p className="text-sm text-muted-foreground mt-4">{t('attendance.emptyRoster')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <PageHeader
        title={t('attendance.takeTitle')}
        subtitle={`${today} · ${roster.length} ${t('attendance.students')}`}
        onBack={() =>
          void navigate({ to: '/teacher/attendance', search: { medresaId: search.medresaId } })
        }
      />
      <div className="p-4 space-y-3">
        {locked ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {t('attendance.readOnlyLocked')}
          </p>
        ) : null}

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.studentId} className="bg-white rounded-xl border border-cream-dark p-3">
              <p className="font-medium text-teal-900">{row.fullName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.studentId === row.studentId ? { ...r, status: st } : r
                        )
                      )
                    }
                    className={`px-2 py-1 text-xs rounded-md border ${
                      row.status === st
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-cream-dark text-muted-foreground'
                    } disabled:opacity-50`}
                  >
                    {t(`attendance.status.${st.toLowerCase()}`)}
                  </button>
                ))}
              </div>
              <input
                type="text"
                disabled={locked}
                placeholder={t('attendance.notePlaceholder')}
                className="mt-2 w-full text-sm border border-cream-dark rounded-md px-2 py-1"
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
          ))}
        </div>
      </div>

      {!locked ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-dark p-4">
          <button
            type="button"
            disabled={busy || rows.length === 0}
            onClick={() => void onSubmit()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {existingId ? t('attendance.saveEdits') : t('attendance.submitAttendance')}
          </button>
        </div>
      ) : null}
    </div>
  );
};
