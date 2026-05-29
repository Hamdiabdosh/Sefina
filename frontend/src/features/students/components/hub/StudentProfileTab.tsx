import { useTranslation } from 'react-i18next';
import { StudentAvatar } from '../StudentAvatar';
import type { StudentDetail } from '../../types';

type Props = {
  student: StudentDetail;
};

export const StudentProfileTab = ({ student }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <section className="flex flex-col items-center rounded-xl border border-cream-dark bg-surface p-6">
        <StudentAvatar
          studentId={student.id}
          name={student.fullName}
          photoUrl={student.photoUrl}
          size="lg"
        />
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
          <h2 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            {t('students.transferHistory')}
          </h2>
          <ul className="space-y-2 text-sm">
            {student.transferHistory.map((tr) => (
              <li key={tr.id} className="text-muted-foreground">
                {tr.fromMedresaName} → {tr.toMedresaName} (
                {new Date(tr.transferDate).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};
