import { useTranslation } from 'react-i18next';
import { FilterTabs } from '../../../../components/ui/FilterTabs';
import type { StudentHubTab } from '../../types/studentHub';

type Props = {
  activeTab: StudentHubTab;
  onTabChange: (tab: StudentHubTab) => void;
  showFeesTab: boolean;
};

export const StudentHubTabs = ({ activeTab, onTabChange, showFeesTab }: Props) => {
  const { t } = useTranslation();

  const tabs: { value: StudentHubTab; label: string }[] = [
    { value: 'profile', label: t('students.hub.profile') },
    { value: 'courses', label: t('students.hub.courses') },
    { value: 'attendance', label: t('students.hub.attendance') },
    { value: 'grades', label: t('students.hub.grades') },
  ];

  if (showFeesTab) {
    tabs.push({ value: 'fees', label: t('students.hub.fees') });
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
