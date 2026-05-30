import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StudentAvatar } from '../StudentAvatar';
import type { StudentDetail } from '../../types';

type Props = {
  student: StudentDetail;
};

const computeProfileScore = (student: StudentDetail): number => {
  let score = 0;
  if (student.fullName) score += 1;
  if (student.dateOfBirth) score += 1;
  if (student.address) score += 1;
  if (student.guardianPhone) score += 1;
  if (student.guardianName) score += 1;
  if (student.secondaryGuardianName) score += 1;
  if (student.nationalId) score += 1;
  if (student.bloodGroup) score += 1;
  if (student.photoUrl) score += 1;
  return score;
};

export const StudentProfileTab = ({ student }: Props) => {
  const { t } = useTranslation();
  const score = computeProfileScore(student);
  const pct = Math.round((score / 9) * 100);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cream-dark bg-surface p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-teal-800">
            {t('students.profileComplete', { pct })}
          </p>
          <span className="text-xs text-muted-foreground">{score}/9</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-cream-dark">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 ? (
          <p className="mt-2 text-xs text-muted-foreground">{t('students.profileCompleteHint')}</p>
        ) : null}
      </section>

      <section className="flex flex-col items-center rounded-xl border border-cream-dark bg-surface p-6">
        <StudentAvatar
          studentId={student.id}
          name={student.fullName}
          photoUrl={student.photoUrl}
          size="lg"
        />
        {student.fullNameAr ? (
          <p dir="rtl" className="mt-2 text-base text-teal-700">
            {student.fullNameAr}
          </p>
        ) : null}
        {student.fullNameAm ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{student.fullNameAm}</p>
        ) : null}
        {student.enrollmentNumber ? (
          <p className="mt-2 text-sm font-medium text-teal-800">
            {t('students.enrollmentNumber')}: {student.enrollmentNumber}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-muted-foreground">
          {t('students.born')}: {new Date(student.dateOfBirth).toLocaleDateString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(`students.gender.${student.gender.toLowerCase()}`)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{student.address}</p>
      </section>

      <section className="rounded-xl border border-cream-dark bg-surface p-4">
        <h2 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          {t('students.guardian')}
        </h2>
        <p className="font-medium text-teal-800">{student.guardianName}</p>
        <p className="text-sm text-muted-foreground">{student.guardianPhone}</p>
      </section>

      {student.transferHistory.length > 0 ? (
        <section className="rounded-xl border border-cream-dark bg-surface p-4">
          <h2 className="mb-3 text-xs font-medium uppercase text-muted-foreground">
            {t('students.transferHistory')}
          </h2>
          <div className="space-y-4">
            {student.transferHistory.map((tr, index) => (
              <div key={tr.id} className="relative flex gap-3 pl-4">
                <div className="absolute bottom-0 left-[3px] top-0 w-px border-l-2 border-cream-dark" />
                {index === student.transferHistory.length - 1 ? (
                  <div className="absolute bottom-0 left-[3px] top-3 w-px bg-surface" />
                ) : null}
                <div className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                <div className="min-w-0 flex-1 pb-1 text-sm">
                  <div className="flex flex-wrap items-center gap-1 text-teal-800">
                    <span>
                      {t('students.transferFrom')}: {tr.fromMedresaName}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                    <span>
                      {t('students.transferTo')}: {tr.toMedresaName}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(tr.transferDate).toLocaleDateString()}
                  </p>
                  {tr.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{tr.reason}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
