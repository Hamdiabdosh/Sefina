import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { cn } from '../../../lib/utils';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import {
  useBatchSubmitGrades,
  useExamTypes,
  useGradeRoster,
  useTeacherGradeCourses,
} from '../hooks/useGrades';
import type { LetterGrade } from '../types';

type RowState = {
  studentId: string;
  fullName: string;
  score: string;
  existingGradeId?: string;
  existingScore?: number;
};

/** S34 letter grade colors */
const letterClass = (letter: LetterGrade | null) => {
  if (!letter) return 'text-muted-foreground bg-cream';
  switch (letter) {
    case 'A':
      return 'text-teal-800 bg-teal-50';
    case 'B':
      return 'text-[#8a6914] bg-gold-50';
    case 'C':
      return 'text-[#1a4d7a] bg-[#E6F1FB]';
    case 'D':
      return 'text-[#8a6914] bg-[#FAEEDA]';
    case 'F':
      return 'text-danger-text bg-[#FCEBEB]';
    default:
      return '';
  }
};

const scoreToLetter = (n: number): LetterGrade => {
  if (n >= 90) return 'A';
  if (n >= 80) return 'B';
  if (n >= 70) return 'C';
  if (n >= 60) return 'D';
  return 'F';
};

export const GradeEntryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    medresaCourseId?: string;
    examTypeId?: string;
  };
  const medresaCourseId = search.medresaCourseId ?? '';
  const examTypeId = search.examTypeId ?? '';

  const coursesQuery = useTeacherGradeCourses(Boolean(medresaCourseId && !examTypeId));
  const examTypesQuery = useExamTypes(true);
  const activeExamTypes = (examTypesQuery.data?.items ?? []).filter((e) => e.status === 'ACTIVE');
  const examType = activeExamTypes.find((e) => e.id === examTypeId);
  const rosterQuery = useGradeRoster(
    medresaCourseId,
    examTypeId,
    Boolean(medresaCourseId && examTypeId)
  );
  const batchSubmit = useBatchSubmitGrades();

  const [rows, setRows] = useState<RowState[]>([]);

  const courseLabel = useMemo(() => {
    const c = coursesQuery.data?.items.find((x) => x.medresaCourseId === medresaCourseId);
    return c?.courseName ?? '';
  }, [coursesQuery.data?.items, medresaCourseId]);

  useEffect(() => {
    const items = rosterQuery.data?.items ?? [];
    setRows(
      items.map((item) => ({
        studentId: item.studentId,
        fullName: item.fullName,
        score: item.grade ? String(item.grade.numericScore) : '',
        existingGradeId: item.grade?.id,
        existingScore: item.grade?.numericScore,
      }))
    );
  }, [rosterQuery.data?.items]);

  const maxScore = examType?.maxScore ?? 100;

  const enteredCount = useMemo(
    () => rows.filter((r) => r.score.trim() !== '' && !r.existingGradeId).length,
    [rows]
  );

  const onSubmit = useCallback(async () => {
    const grades = rows
      .filter((r) => !r.existingGradeId && r.score.trim() !== '')
      .map((r) => ({
        studentId: r.studentId,
        numericScore: Math.min(maxScore, Math.max(0, Number.parseInt(r.score, 10))),
      }))
      .filter((g) => !Number.isNaN(g.numericScore));

    if (grades.length === 0) return;

    await batchSubmit.mutateAsync({ medresaCourseId, examTypeId, grades });
    void navigate({ to: '/teacher/grades' });
  }, [rows, medresaCourseId, examTypeId, batchSubmit, navigate, maxScore]);

  if (!medresaCourseId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('grades.entryTitle')} />
        <PageBody>
          <Link to="/teacher/grades" className="text-sm text-teal-700 underline">
            {t('grades.backToHub')}
          </Link>
        </PageBody>
      </div>
    );
  }

  if (!examTypeId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col pb-12">
        <PageTopBar
          title={t('grades.selectExamType')}
          subtitle={courseLabel}
          onBack={() => void navigate({ to: '/teacher/grades' })}
        />
        <PageBody>
          <ul className="space-y-2">
            {activeExamTypes.map((et) => (
              <li key={et.id}>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: '/teacher/grades/entry',
                      search: { medresaCourseId, examTypeId: et.id },
                    })
                  }
                  className="w-full rounded-lg border border-cream-dark bg-surface p-4 text-left hover:border-teal-300 hover:bg-teal-50"
                >
                  <p className="font-medium">{getLocalizedValue(et.name)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('grades.maxScore', { max: et.maxScore })} ·{' '}
                    {t('grades.weight', { w: et.weight })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </PageBody>
      </div>
    );
  }

  const examName = examType ? getLocalizedValue(examType.name) : t('grades.entryTitle');

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <PageTopBar
        title={t('grades.entryTitle')}
        subtitle={`${examName} · ${t('grades.maxScore', { max: maxScore })} · ${t('grades.weight', { w: examType?.weight ?? 0 })}`}
        onBack={() =>
          void navigate({
            to: '/teacher/grades/entry',
            search: { medresaCourseId, examTypeId: undefined },
          })
        }
        actions={
          <button
            type="button"
            disabled={batchSubmit.isPending || enteredCount === 0}
            onClick={() => void onSubmit()}
            className="btn-primary-inline hidden gap-2 md:inline-flex"
          >
            <Send size={16} />
            {t('grades.saveGrades', { count: enteredCount, total: rows.length })}
          </button>
        }
      />
      <PageBody>
        {rosterQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('grades.loading')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-cream-dark bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/80 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-1.5 sm:px-3">{t('grades.colStudent')}</th>
                  <th className="w-14 px-2 py-1.5 text-center sm:px-3">{t('grades.colScore')}</th>
                  <th className="w-12 px-2 py-1.5 text-center sm:px-3">{t('grades.colLetter')}</th>
                  <th className="hidden w-24 px-2 py-1.5 sm:table-cell sm:px-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const num = row.score.trim() === '' ? null : Number.parseInt(row.score, 10);
                  const letter =
                    num !== null && !Number.isNaN(num)
                      ? scoreToLetter(Math.min(maxScore, num))
                      : null;
                  const examTypeLabel = examName;
                  const submittedLetter =
                    row.existingScore !== undefined ? scoreToLetter(row.existingScore) : null;

                  return (
                    <tr
                      key={row.studentId}
                      className="border-b border-cream-dark/60 last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-2 py-1.5 sm:px-3">
                        <p className="font-medium leading-tight text-foreground">{row.fullName}</p>
                        {row.existingGradeId ? (
                          <p className="text-[10px] text-muted-foreground">
                            {t('grades.alreadySubmitted')}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5 text-center sm:px-3">
                        {row.existingGradeId ? (
                          <span className="tabular-nums font-medium">{row.existingScore}</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={maxScore}
                            className="field-input mx-auto h-8 w-11 px-1 text-center text-[13px]"
                            value={row.score}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const n = Number.parseInt(raw, 10);
                              const clamped =
                                raw === ''
                                  ? ''
                                  : String(
                                      Number.isNaN(n)
                                        ? raw
                                        : Math.min(maxScore, Math.max(0, n))
                                    );
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.studentId === row.studentId ? { ...r, score: clamped } : r
                                )
                              );
                            }}
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center sm:px-3">
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium',
                            letterClass(row.existingGradeId ? submittedLetter : letter)
                          )}
                        >
                          {row.existingGradeId
                            ? (submittedLetter ?? '?')
                            : (letter ?? '?')}
                        </span>
                      </td>
                      <td className="hidden px-2 py-1.5 text-right sm:table-cell sm:px-3">
                        {row.existingGradeId ? (
                          <Link
                            to="/teacher/grades/edit-request"
                            search={{
                              gradeId: row.existingGradeId,
                              currentScore: String(row.existingScore ?? ''),
                              studentName: row.fullName,
                              examTypeName: examTypeLabel,
                              medresaCourseId,
                              examTypeId,
                            }}
                            className="text-[11px] text-teal-700 underline"
                          >
                            {t('grades.requestEdit')}
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cream-dark bg-surface px-4 py-3 md:hidden">
        <button
          type="button"
          disabled={batchSubmit.isPending || enteredCount === 0}
          onClick={() => void onSubmit()}
          className="btn-primary-inline ml-auto flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <Send size={16} />
          {t('grades.saveGrades', { count: enteredCount, total: rows.length })}
        </button>
      </div>
    </div>
  );
};
