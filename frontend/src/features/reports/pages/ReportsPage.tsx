import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import { formatEthiopianMonthYear, getCurrentEthiopianMonthYear } from '../../../lib/ethiopian';
import { AttendanceDateLabel } from '../../attendance/components/AttendanceDateLabel';
import {
  useAttendanceReport,
  useEnrollmentReport,
  useFeesReport,
  useGradesReport,
  useSalaryReport,
} from '../hooks/useReports';
import { exportTablePdf } from '../utils/exportPdf';
import { exportTableXlsx } from '../utils/exportXlsx';
import type { ReportRangeParams } from '../types';

type ReportKind = 'enrollment' | 'attendance' | 'fees' | 'salary' | 'grades';

type ReportsPageProps = {
  variant: 'teacher' | 'medresa' | 'admin';
};

const REPORT_OPTIONS: Record<ReportsPageProps['variant'], ReportKind[]> = {
  teacher: ['attendance', 'grades'],
  medresa: ['enrollment', 'attendance', 'fees', 'grades'],
  admin: ['enrollment', 'attendance', 'fees', 'salary', 'grades'],
};

export const ReportsPage = ({ variant }: ReportsPageProps) => {
  const { t } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { medresaId } = useMedresaContext();
  const et = getCurrentEthiopianMonthYear();
  const [kind, setKind] = useState<ReportKind>(REPORT_OPTIONS[variant][0]!);
  const [fromMonth, setFromMonth] = useState(et.month);
  const [fromYear, setFromYear] = useState(et.year);
  const [toMonth, setToMonth] = useState(et.month);
  const [toYear, setToYear] = useState(et.year);
  const [run, setRun] = useState(false);

  const params: ReportRangeParams = useMemo(
    () => ({
      fromMonth,
      fromYear,
      toMonth,
      toYear,
      ...(variant !== 'teacher' && medresaId ? { medresaId } : {}),
    }),
    [fromMonth, fromYear, toMonth, toYear, medresaId, variant]
  );

  const enrollment = useEnrollmentReport(params, run && kind === 'enrollment');
  const attendance = useAttendanceReport(params, run && kind === 'attendance');
  const fees = useFeesReport(params, run && kind === 'fees');
  const salary = useSalaryReport(params, run && kind === 'salary');
  const grades = useGradesReport(params, run && kind === 'grades');

  const activeQuery =
    kind === 'enrollment'
      ? enrollment
      : kind === 'attendance'
        ? attendance
        : kind === 'fees'
          ? fees
          : kind === 'salary'
            ? salary
            : grades;

  const exportCurrent = () => {
    const title = t(`reports.kinds.${kind}`);
    const filename = `sefinet-${kind}-${fromYear}${fromMonth}`;
    if (kind === 'enrollment' && enrollment.data?.items) {
      const headers = ['Name', 'Medresa', 'Status', 'Courses'];
      const rows = enrollment.data.items.map(
        (r: {
          fullName: string;
          medresaName: string;
          status: string;
          courses: { courseName: string }[];
        }) => [
          r.fullName,
          r.medresaName,
          r.status,
          r.courses.map((c) => c.courseName).join(', '),
        ]
      );
      exportTablePdf(title, headers, rows, filename);
      exportTableXlsx('Enrollment', headers, rows, filename);
    } else if (kind === 'attendance' && attendance.data?.studentSummaries) {
      const headers = ['Student', 'Present', 'Absent', 'Late', 'Excused', '%'];
      const period = `${formatEthiopianMonthYear(fromMonth, fromYear, t)} – ${formatEthiopianMonthYear(toMonth, toYear, t)}`;
      const rows = attendance.data.studentSummaries.map(
        (r: {
          fullName: string;
          present: number;
          absent: number;
          late: number;
          excused: number;
          attendancePercent: number | null;
        }) => [
          r.fullName,
          String(r.present),
          String(r.absent),
          String(r.late),
          String(r.excused),
          r.attendancePercent != null ? String(r.attendancePercent) : '—',
        ]
      );
      exportTablePdf(`${title} (${period})`, headers, rows, filename);
      exportTableXlsx('Attendance', headers, rows, filename);
    } else if (kind === 'fees' && fees.data?.items) {
      const headers = ['Student', 'Month', 'Due', 'Paid', 'Balance', 'Status'];
      const rows = (fees.data.items as Array<{
        fullName: string;
        month: number;
        year: number;
        amountDueEtb: number;
        amountPaidEtb: number;
        balanceEtb: number;
        status: string;
      }>).map((r) => [
        r.fullName,
        formatEthiopianMonthYear(r.month, r.year),
        String(r.amountDueEtb),
        String(r.amountPaidEtb),
        String(r.balanceEtb),
        r.status,
      ]);
      exportTablePdf(title, headers, rows, filename);
      exportTableXlsx('Fees', headers, rows, filename);
    } else if (kind === 'salary' && salary.data?.items) {
      const headers = ['Teacher', 'Month', 'Paid', 'Status', 'Bank ref'];
      const rows = (salary.data.items as Array<{
        fullName: string;
        month: number;
        year: number;
        amountPaidEtb: number | null;
        status: string;
        bankReference: string | null;
      }>).map((r) => [
        r.fullName,
        formatEthiopianMonthYear(r.month, r.year),
        r.amountPaidEtb != null ? String(r.amountPaidEtb) : '—',
        r.status,
        r.bankReference ?? '—',
      ]);
      exportTablePdf(title, headers, rows, filename);
      exportTableXlsx('Salary', headers, rows, filename);
    } else if (kind === 'grades' && grades.data?.items) {
      const headers = ['Course', 'Medresa', 'Class avg %', 'Students'];
      const rows = (grades.data.items as Array<{
        courseName: string;
        medresaName: string;
        classAveragePercent: number | null;
        students: unknown[];
      }>).map((r) => [
        r.courseName,
        r.medresaName,
        r.classAveragePercent != null ? String(r.classAveragePercent) : '—',
        String(r.students.length),
      ]);
      exportTablePdf(title, headers, rows, filename);
      exportTableXlsx('Grades', headers, rows, filename);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <PageBody fullWidth className="max-w-none space-y-4">
        <div className="flex flex-wrap gap-2">
          {REPORT_OPTIONS[variant].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setRun(false);
              }}
              className={`rounded-full px-3 py-1 text-sm ${
                kind === k
                  ? 'bg-teal-600 text-white'
                  : 'border border-cream-dark bg-surface text-teal-800'
              }`}
            >
              {t(`reports.kinds.${k}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-cream-dark bg-surface p-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('reports.from')}
            <div className="flex gap-1">
              <input
                type="number"
                min={1}
                max={13}
                value={fromMonth}
                onChange={(e) => setFromMonth(Number(e.target.value))}
                className="w-14 rounded border border-cream-dark px-2 py-1"
              />
              <input
                type="number"
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className="w-20 rounded border border-cream-dark px-2 py-1"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('reports.to')}
            <div className="flex gap-1">
              <input
                type="number"
                min={1}
                max={13}
                value={toMonth}
                onChange={(e) => setToMonth(Number(e.target.value))}
                className="w-14 rounded border border-cream-dark px-2 py-1"
              />
              <input
                type="number"
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                className="w-20 rounded border border-cream-dark px-2 py-1"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={() => setRun(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            {t('reports.generate')}
          </button>
          {run && activeQuery.data ? (
            <button
              type="button"
              onClick={exportCurrent}
              className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-teal-800 hover:bg-cream"
            >
              {t('reports.export')}
            </button>
          ) : null}
        </div>

        {activeQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('reports.loading')}</p>
        ) : null}
        {activeQuery.isError ? (
          <p className="text-sm text-red-700">{t('reports.error')}</p>
        ) : null}

        {run && kind === 'enrollment' && enrollment.data?.items ? (
          <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/50">
                <tr>
                  <th className="p-2 text-left">{t('reports.name')}</th>
                  <th className="p-2 text-left">{t('nav.medresas')}</th>
                  <th className="p-2 text-left">{t('reports.status')}</th>
                  <th className="p-2 text-left">{t('reports.courses')}</th>
                </tr>
              </thead>
              <tbody>
                {enrollment.data.items.map(
                  (r: {
                    studentId: string;
                    fullName: string;
                    medresaName: string;
                    status: string;
                    courses: { courseName: string }[];
                  }) => (
                    <tr key={r.studentId} className="border-t border-cream-dark/60">
                      <td className="p-2">{r.fullName}</td>
                      <td className="p-2">{r.medresaName}</td>
                      <td className="p-2">{r.status}</td>
                      <td className="p-2">{r.courses.map((c) => c.courseName).join(', ')}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {run && kind === 'attendance' && attendance.data?.studentSummaries ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('reports.attendancePeriod', {
                from: formatEthiopianMonthYear(fromMonth, fromYear, t),
                to: formatEthiopianMonthYear(toMonth, toYear, t),
              })}
            </p>
            {attendance.data.dailyRows?.length ? (
              <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-cream-dark/50">
                    <tr>
                      <th className="p-2 text-left">{t('attendance.date')}</th>
                      <th className="p-2 text-left">{t('nav.medresas')}</th>
                      <th className="p-2 text-right">P</th>
                      <th className="p-2 text-right">A</th>
                      <th className="p-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(attendance.data.dailyRows as Array<{
                      date: string;
                      medresaName: string;
                      present: number;
                      absent: number;
                      ratePercent: number | null;
                    }>).map((row, i) => (
                      <tr key={`${row.date}-${row.medresaName}-${i}`} className="border-t border-cream-dark/60">
                        <td className="p-2">
                          <AttendanceDateLabel ymd={row.date} />
                        </td>
                        <td className="p-2">{row.medresaName}</td>
                        <td className="p-2 text-right">{row.present}</td>
                        <td className="p-2 text-right">{row.absent}</td>
                        <td className="p-2 text-right">
                          {row.ratePercent != null ? `${row.ratePercent}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
              <table className="w-full text-sm">
                <thead className="bg-cream-dark/50">
                  <tr>
                    <th className="p-2 text-left">{t('reports.name')}</th>
                    <th className="p-2 text-right">P</th>
                    <th className="p-2 text-right">A</th>
                    <th className="p-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.data.studentSummaries.map(
                    (r: {
                      studentId: string;
                      fullName: string;
                      present: number;
                      absent: number;
                      attendancePercent: number | null;
                    }) => (
                      <tr key={r.studentId} className="border-t border-cream-dark/60">
                        <td className="p-2">{r.fullName}</td>
                        <td className="p-2 text-right">{r.present}</td>
                        <td className="p-2 text-right">{r.absent}</td>
                        <td className="p-2 text-right">
                          {r.attendancePercent != null ? `${r.attendancePercent}%` : '—'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {run && kind === 'fees' && fees.data?.items ? (
          <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/50">
                <tr>
                  <th className="p-2 text-left">{t('reports.name')}</th>
                  <th className="p-2 text-left">{t('reports.period')}</th>
                  <th className="p-2 text-right">{t('reports.due')}</th>
                  <th className="p-2 text-right">{t('reports.paid')}</th>
                  <th className="p-2 text-left">{t('reports.status')}</th>
                </tr>
              </thead>
              <tbody>
                {(fees.data.items as Array<{
                  studentId: string;
                  fullName: string;
                  month: number;
                  year: number;
                  amountDueEtb: number;
                  amountPaidEtb: number;
                  status: string;
                }>).map((r) => (
                  <tr key={`${r.studentId}-${r.year}-${r.month}`} className="border-t border-cream-dark/60">
                    <td className="p-2">{r.fullName}</td>
                    <td className="p-2">{formatEthiopianMonthYear(r.month, r.year)}</td>
                    <td className="p-2 text-right">{r.amountDueEtb}</td>
                    <td className="p-2 text-right">{r.amountPaidEtb}</td>
                    <td className="p-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {run && kind === 'salary' && currentUser?.isSuperAdmin && salary.data?.items ? (
          <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/50">
                <tr>
                  <th className="p-2 text-left">{t('reports.teacher')}</th>
                  <th className="p-2 text-left">{t('reports.period')}</th>
                  <th className="p-2 text-right">{t('reports.paid')}</th>
                  <th className="p-2 text-left">{t('reports.status')}</th>
                </tr>
              </thead>
              <tbody>
                {(salary.data.items as Array<{
                  teacherId: string;
                  fullName: string;
                  month: number;
                  year: number;
                  amountPaidEtb: number | null;
                  status: string;
                }>).map((r) => (
                  <tr key={`${r.teacherId}-${r.year}-${r.month}`} className="border-t border-cream-dark/60">
                    <td className="p-2">{r.fullName}</td>
                    <td className="p-2">{formatEthiopianMonthYear(r.month, r.year)}</td>
                    <td className="p-2 text-right">{r.amountPaidEtb ?? '—'}</td>
                    <td className="p-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {run && kind === 'grades' && grades.data?.items ? (
          <div className="space-y-3">
            {(grades.data.items as Array<{
              medresaCourseId: string;
              courseName: string;
              medresaName: string;
              classAveragePercent: number | null;
              students: { studentId: string; fullName: string; weightedTotalPercent: number | null }[];
            }>).map((c) => (
              <div key={c.medresaCourseId} className="rounded-xl border border-cream-dark bg-white p-3">
                <p className="font-medium text-teal-900">
                  {c.courseName} · {c.medresaName}
                  {c.classAveragePercent != null ? ` · ${c.classAveragePercent}%` : ''}
                </p>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {c.students.slice(0, 8).map((s) => (
                    <li key={s.studentId}>
                      {s.fullName}: {s.weightedTotalPercent != null ? `${s.weightedTotalPercent}%` : '—'}
                    </li>
                  ))}
                  {c.students.length > 8 ? (
                    <li>{t('reports.moreStudents', { count: c.students.length - 8 })}</li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {run && !activeQuery.isLoading && !activeQuery.data ? (
          <p className="text-sm text-muted-foreground">{t('reports.empty')}</p>
        ) : null}
      </PageBody>
    </div>
  );
};
