import { useTranslation } from 'react-i18next';
import { FilterTabs } from '../../../../components/ui/FilterTabs';
import type { CourseHubTab } from '../../types/courseHub';

type Props = {
  activeTab: CourseHubTab;
  onTabChange: (tab: CourseHubTab) => void;
  showTeacherTab: boolean;
};

export const CourseHubTabs = ({ activeTab, onTabChange, showTeacherTab }: Props) => {
  const { t } = useTranslation();

  const tabs: { value: CourseHubTab; label: string }[] = [
    { value: 'overview', label: t('courses.hub.overview') },
    { value: 'roster', label: t('courses.hub.roster') },
    { value: 'attendance', label: t('courses.hub.attendance') },
    { value: 'results', label: t('courses.hub.results') },
  ];

  if (showTeacherTab) {
    tabs.push({ value: 'teacher', label: t('courses.hub.teacher') });
  }

  return (
    <FilterTabs
      value={activeTab}
      onChange={onTabChange}
      tabs={tabs}
      className="mb-4 overflow-x-auto pb-1"
    />
  );
};
