import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../../../components/ui/DataTable';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { StudentAvatar } from '../../../students/components/StudentAvatar';
import { useStudents } from '../../../students/hooks/useStudents';

type Props = {
  medresaId: string;
  medresaCourseId: string;
};

export const CourseRosterTab = ({ medresaId, medresaCourseId }: Props) => {
  const { t } = useTranslation();
  const { students, isLoading } = useStudents(medresaId, {
    medresaCourseId,
    status: 'ACTIVE',
    limit: 100,
  });

  if (isLoading) return <SkeletonTable rows={5} />;

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('students.empty')}</p>;
  }

  return (
    <DataTable>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/50">
            <tr>
              <th className="p-2 text-left">{t('students.colName')}</th>
              <th className="p-2 text-left">{t('students.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-cream-dark/60">
                <td className="p-2">
                  <Link
                    to="/medresa/students/$studentId"
                    params={{ studentId: s.id }}
                    search={{ medresaId, tab: 'profile' }}
                    className="inline-flex items-center gap-2 text-teal-700 hover:underline"
                  >
                    <StudentAvatar
                      studentId={s.id}
                      name={s.fullName}
                      photoUrl={s.photoUrl}
                      size="sm"
                    />
                    {s.fullName}
                  </Link>
                </td>
                <td className="p-2 text-muted-foreground">{t(`students.status.${s.status.toLowerCase()}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataTable>
  );
};
