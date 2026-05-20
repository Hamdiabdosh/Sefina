import { useState } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useMedresaCourses } from '../../courses/hooks/useMedresaCourses';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { AssignCourseModal } from '../components/AssignCourseModal';
import { EditStudentModal } from '../components/EditStudentModal';
import { RemoveFromCourseDialog } from '../components/RemoveFromCourseDialog';
import { StudentAvatar } from '../components/StudentAvatar';
import { TransferStudentModal } from '../components/TransferStudentModal';
import { StudentGradesSummary } from '../../grades/components/StudentGradesSummary';
import { StudentFeesSummary } from '../../fees/components/StudentFeesSummary';
import { useStudent } from '../hooks/useStudent';
import type { StudentCourseDetail } from '../types';

export const StudentDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { studentId } = useParams({ strict: false }) as { studentId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string };
  const { currentUser } = useCurrentUser();
  const { medresaId: contextMedresaId, adminMedresas } = useMedresaContext();
  const medresaId = search.medresaId ?? contextMedresaId ?? '';

  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [removeEnrollment, setRemoveEnrollment] = useState<StudentCourseDetail | null>(null);

  const {
    student,
    isLoading,
    error,
    transferDestinations,
    updateStudent,
    assignCourse,
    removeCourse,
    transferStudent,
  } = useStudent(studentId);

  const { courses } = useMedresaCourses(
    student?.currentMedresaId ?? medresaId,
    { status: 'ACTIVE' },
    { withAvailable: false, withTeachers: false }
  );

  const isMedresaAdmin =
    currentUser?.isSuperAdmin ||
    (student
      ? adminMedresas.some((m) => m.medresaId === student.currentMedresaId)
      : adminMedresas.some((m) => m.medresaId === medresaId));

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.detailTitle')} subtitle={t('students.loading')} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('students.detailTitle')} subtitle="" />
        <PageBody>
          <p className="text-center text-danger-text">{t('students.loadError')}</p>
        </PageBody>
      </div>
    );
  }

  const enrolledIds = student.courses.map((c) => c.medresaCourseId);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={student.fullName}
        subtitle={student.currentMedresaName}
        onBack={() =>
          void navigate({
            to: '/medresa/students',
            search: { medresaId: student.currentMedresaId, medresaCourseId: undefined },
          })
        }
      />
      <PageBody>
        <section className="bg-white rounded-xl border border-cream-dark p-6 flex flex-col items-center">
          <StudentAvatar
            studentId={student.id}
            name={student.fullName}
            photoUrl={student.photoUrl}
            size="lg"
          />
          <p className="text-sm text-muted-foreground mt-3">
            {t('students.born')}: {new Date(student.dateOfBirth).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`students.gender.${student.gender.toLowerCase()}`)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{student.address}</p>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-2">
            {t('students.guardian')}
          </h2>
          <p className="font-medium text-teal-800">{student.guardianName}</p>
          <p className="text-sm text-muted-foreground">{student.guardianPhone}</p>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium uppercase text-muted-foreground">
              {t('students.courses')} ({student.courses.length})
            </h2>
            {isMedresaAdmin && (
              <button
                type="button"
                onClick={() => setShowAssign(true)}
                className="text-sm text-teal-600"
              >
                {t('students.assignCourse')}
              </button>
            )}
          </div>
          {student.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('students.noCourses')}</p>
          ) : (
            <ul className="space-y-2">
              {student.courses.map((c) => (
                <li
                  key={c.studentCourseId}
                  className="flex items-center justify-between text-sm border-b border-cream-dark pb-2 last:border-0"
                >
                  <span>{getLocalizedValue(c.courseName)}</span>
                  {isMedresaAdmin && (
                    <button
                      type="button"
                      onClick={() => setRemoveEnrollment(c)}
                      className="text-danger-text text-xs"
                    >
                      {t('students.remove')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {student.transferHistory.length > 0 && (
          <section className="bg-white rounded-xl border border-cream-dark p-4">
            <h2 className="text-xs font-medium uppercase text-muted-foreground mb-2">
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
        )}

        {isMedresaAdmin || currentUser?.isSuperAdmin ? (
          <section className="bg-white rounded-xl border border-cream-dark p-4">
            <h2 className="text-xs font-medium uppercase text-muted-foreground mb-2">
              {t('students.feesPlaceholder')}
            </h2>
            <StudentFeesSummary
              studentId={student.id}
              medresaId={student.currentMedresaId}
              feeStatus={student.feeStatus ?? null}
            />
          </section>
        ) : null}

        <section className="bg-white rounded-xl border border-cream-dark p-4 opacity-60">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-1">
            {t('students.attendancePlaceholder')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('students.comingM06')}</p>
        </section>

        <section className="bg-white rounded-xl border border-cream-dark p-4">
          <h2 className="text-xs font-medium uppercase text-muted-foreground mb-2">
            {t('students.gradesPlaceholder')}
          </h2>
          {student ? (
            <StudentGradesSummary
              studentId={student.id}
              resultsLinkTo={
                currentUser?.isTeacher && !isMedresaAdmin
                  ? '/teacher/students/$studentId/results'
                  : '/medresa/students/$studentId/results'
              }
              resultsParams={{ studentId: student.id }}
              resultsSearch={
                currentUser?.isTeacher && !isMedresaAdmin
                  ? undefined
                  : { medresaId: student.currentMedresaId }
              }
            />
          ) : null}
        </section>

        {isMedresaAdmin && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowEdit(true)} className="btn-secondary flex-1">
              {t('students.edit')}
            </button>
            <button type="button" onClick={() => setShowTransfer(true)} className="btn-secondary flex-1">
              {t('students.transfer')}
            </button>
          </div>
        )}
      </PageBody>

      {isMedresaAdmin && (
        <>
          <EditStudentModal
            open={showEdit}
            onClose={() => setShowEdit(false)}
            student={student}
            updateStudent={updateStudent}
          />
          <AssignCourseModal
            open={showAssign}
            onClose={() => setShowAssign(false)}
            courses={courses}
            enrolledCourseIds={enrolledIds}
            assignCourse={assignCourse}
          />
          <TransferStudentModal
            open={showTransfer}
            onClose={() => setShowTransfer(false)}
            student={student}
            destinations={transferDestinations}
            transferStudent={transferStudent}
          />
          <RemoveFromCourseDialog
            open={Boolean(removeEnrollment)}
            onClose={() => setRemoveEnrollment(null)}
            enrollment={removeEnrollment}
            removeCourse={removeCourse}
          />
        </>
      )}
    </div>
  );
};
