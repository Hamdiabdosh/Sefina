import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useStudentResults } from '../hooks/useGrades';

type Props = {
  studentId: string;
  resultsLinkTo?: string;
  resultsParams?: { studentId: string };
  resultsSearch?: Record<string, string | undefined>;
};

export const StudentGradesSummary = ({
  studentId,
  resultsLinkTo,
  resultsParams,
  resultsSearch,
}: Props) => {
  const { t } = useTranslation();
  const { data, isLoading } = useStudentResults(studentId, Boolean(studentId));

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">{t('grades.loading')}</p>;
  }

  if (!data || data.courses.length === 0) {
    return <p className="text-xs text-muted-foreground">{t('grades.noGradesYet')}</p>;
  }

  return (
    <div className="space-y-2">
      {data.overallGpaPercent !== null ? (
        <p className="text-sm font-medium text-teal-800">
          {t('grades.overallGpa', { gpa: data.overallGpaPercent })}
        </p>
      ) : null}
      <ul className="text-xs text-muted-foreground space-y-1">
        {data.courses.slice(0, 3).map((c) => (
          <li key={c.medresaCourseId}>
            {c.courseName}
            {c.weightedTotalPercent !== null
              ? ` — ${c.weightedTotalPercent}%`
              : ''}
          </li>
        ))}
      </ul>
      {resultsLinkTo ? (
        <Link
          to={resultsLinkTo}
          params={resultsParams}
          search={resultsSearch}
          className="text-xs text-teal-700 underline"
        >
          {t('grades.viewFullResults')}
        </Link>
      ) : null}
    </div>
  );
};
