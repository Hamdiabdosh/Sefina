import { useState } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '../../../components/layout/PageBody';
import { PageTopBar } from '../../../components/layout/PageTopBar';
import { ErrorState } from '../../../components/ui/ErrorState';
import { AssignTeacherModal } from '../components/AssignTeacherModal';
import { CourseAttendanceTab } from '../components/hub/CourseAttendanceTab';
import { CourseHubTabs } from '../components/hub/CourseHubTabs';
import { CourseOverviewTab } from '../components/hub/CourseOverviewTab';
import { CourseResultsTab } from '../components/hub/CourseResultsTab';
import { CourseRosterTab } from '../components/hub/CourseRosterTab';
import { CourseTeacherTab } from '../components/hub/CourseTeacherTab';
import { useMedresaContext } from '../hooks/useMedresaContext';
import { useMedresaCourseDetail, useMedresaCourses } from '../hooks/useMedresaCourses';
import { getLocalizedValue } from '../../teachers/utils/localizedJson';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser';
import { parseCourseHubTab, type CourseHubTab } from '../types/courseHub';

export const MedresaCourseDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { medresaCourseId } = useParams({ strict: false }) as { medresaCourseId: string };
  const search = useSearch({ strict: false }) as { medresaId?: string; tab?: string };
  const { currentUser } = useCurrentUser();
  const { medresaId: contextMedresaId, adminMedresas } = useMedresaContext();
  const teacherMedresaId = currentUser?.medresaRoles.find((r) => r.role === 'TEACHER')?.medresaId;
  const medresaId = search.medresaId ?? contextMedresaId ?? teacherMedresaId ?? '';
  const [showAssign, setShowAssign] = useState(false);

  const isMedresaAdmin =
    currentUser?.isSuperAdmin ||
    adminMedresas.some((m) => m.medresaId === medresaId);

  const { data: course, isLoading, error, refetch } = useMedresaCourseDetail(medresaId, medresaCourseId);
  const { teachers, assignTeacher } = useMedresaCourses(medresaId, undefined, {
    withAvailable: isMedresaAdmin,
    withTeachers: isMedresaAdmin,
  });

  const setTab = (tab: CourseHubTab) => {
    void navigate({
      to: '/medresa/courses/$medresaCourseId',
      params: { medresaCourseId },
      search: { medresaId: medresaId || undefined, tab },
      replace: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('courses.detailTitle')} subtitle={t('courses.loading')} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTopBar title={t('courses.detailTitle')} subtitle="" />
        <PageBody>
          <ErrorState
            message={t('courses.loadError')}
            onRetry={() => void refetch()}
            onBack={() =>
              void navigate({ to: '/medresa/courses', search: { medresaId } })
            }
          />
        </PageBody>
      </div>
    );
  }

  const teacherAtMedresa =
    Boolean(currentUser?.isTeacher) &&
    (currentUser?.medresaRoles.some(
      (r) => r.role === 'TEACHER' && r.medresaId === medresaId
    ) ?? false);

  const canTakeAttendance = teacherAtMedresa && course.status === 'ACTIVE';
  const activeTab = parseCourseHubTab(search.tab, 'overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'roster':
        return <CourseRosterTab medresaId={medresaId} medresaCourseId={course.medresaCourseId} />;
      case 'attendance':
        return (
          <CourseAttendanceTab
            course={course}
            medresaId={medresaId}
            isMedresaAdmin={isMedresaAdmin}
            canTakeAttendance={canTakeAttendance}
          />
        );
      case 'results':
        return <CourseResultsTab medresaCourseId={course.medresaCourseId} />;
      case 'teacher':
        return isMedresaAdmin ? (
          <CourseTeacherTab course={course} onAssign={() => setShowAssign(true)} />
        ) : (
          <CourseOverviewTab course={course} />
        );
      case 'overview':
      default:
        return <CourseOverviewTab course={course} />;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-12">
      <PageTopBar
        title={getLocalizedValue(course.name)}
        subtitle={course.medresaName}
        onBack={() =>
          void navigate({ to: '/medresa/courses', search: { medresaId } })
        }
      />
      <PageBody>
        <CourseHubTabs
          activeTab={activeTab}
          onTabChange={setTab}
          showTeacherTab={isMedresaAdmin}
        />
        {renderTab()}
      </PageBody>

      {isMedresaAdmin && (
        <AssignTeacherModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          course={course}
          teachers={teachers}
          assignTeacher={assignTeacher}
        />
      )}
    </div>
  );
};
