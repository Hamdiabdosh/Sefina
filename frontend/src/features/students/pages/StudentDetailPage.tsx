import { useState } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { useMedresaContext } from '../../courses/hooks/useMedresaContext';
import { useMedresaCourses } from '../../courses/hooks/useMedresaCourses';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import { AssignCourseModal } from '../components/AssignCourseModal';
import { EditStudentModal } from '../components/EditStudentModal';
import { RemoveFromCourseDialog } from '../components/RemoveFromCourseDialog';
import { TransferStudentModal } from '../components/TransferStudentModal';
import { StudentAttendanceTab } from '../components/hub/StudentAttendanceTab';
import { StudentCoursesTab } from '../components/hub/StudentCoursesTab';
import { StudentFeesTab } from '../components/hub/StudentFeesTab';
import { StudentGradesTab } from '../components/hub/StudentGradesTab';
import { StudentHubTabs } from '../components/hub/StudentHubTabs';
import { StudentProfileTab } from '../components/hub/StudentProfileTab';
import { useStudent } from '../hooks/useStudent';
import type { StudentCourseDetail } from '../types';
import { parseStudentHubTab, type StudentHubTab } from '../types/studentHub';

export const StudentDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { studentId } = useParams({ strict: false }) as { studentId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string; tab?: string };
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

  const showFeesTab = Boolean(isMedresaAdmin || currentUser?.isSuperAdmin);

  const setTab = (tab: StudentHubTab) => {
    void navigate({
      to: '/medresa/students/$studentId',
      params: { studentId },
      search: {
        medresaId: (student?.currentMedresaId ?? medresaId) || undefined,
        tab,
      },
      replace: true,
    });
  };

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
  const effectiveMedresaId = student.currentMedresaId || medresaId;

  let resolvedTab = parseStudentHubTab(search.tab, 'profile');
  if (resolvedTab === 'fees' && !showFeesTab) {
    resolvedTab = 'profile';
  }

  const renderTab = () => {
    switch (resolvedTab) {
      case 'courses':
        return (
          <StudentCoursesTab
            student={student}
            isMedresaAdmin={isMedresaAdmin}
            onAssign={() => setShowAssign(true)}
            onRemove={setRemoveEnrollment}
          />
        );
      case 'attendance':
        return <StudentAttendanceTab studentId={student.id} />;
      case 'grades':
        return <StudentGradesTab studentId={student.id} />;
      case 'fees':
        return (
          <StudentFeesTab
            studentId={student.id}
            medresaId={effectiveMedresaId}
            studentName={student.fullName}
          />
        );
      case 'profile':
      default:
        return <StudentProfileTab student={student} />;
    }
  };

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
        <StudentHubTabs
          activeTab={resolvedTab}
          onTabChange={setTab}
          showFeesTab={showFeesTab}
        />
        {renderTab()}

        {isMedresaAdmin && resolvedTab === 'profile' ? (
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => setShowEdit(true)} className="btn-secondary flex-1">
              {t('students.edit')}
            </button>
            <button type="button" onClick={() => setShowTransfer(true)} className="btn-secondary flex-1">
              {t('students.transfer')}
            </button>
          </div>
        ) : null}
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
