import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock,
  Coins,
  Wallet,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Library,
  Users,
} from 'lucide-react';
import type { CurrentUser } from '../../features/auth/types/auth.types';

export type NavBadgeKey = 'medresas' | 'teachers';

export type NavItemConfig = {
  to: string;
  /** i18n key under nav.* */
  labelKey: string;
  icon: LucideIcon;
  badgeKey?: NavBadgeKey;
};

export type NavSectionConfig = {
  /** i18n key under nav.section.* */
  sectionLabelKey: string;
  items: NavItemConfig[];
};

const superAdminNav: NavSectionConfig[] = [
  {
    sectionLabelKey: 'network',
    items: [
      { to: '/admin/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
      { to: '/admin/reports', labelKey: 'reports', icon: FileBarChart },
      { to: '/admin/medresas', labelKey: 'medresas', icon: Building2, badgeKey: 'medresas' },
      { to: '/admin/teachers', labelKey: 'teachers', icon: GraduationCap, badgeKey: 'teachers' },
    ],
  },
  {
    sectionLabelKey: 'academics',
    items: [
      { to: '/admin/courses', labelKey: 'courseCatalog', icon: Library },
      { to: '/medresa/courses', labelKey: 'medresaCourses', icon: BookOpen },
      { to: '/admin/attendance', labelKey: 'attendance', icon: CalendarDays },
      { to: '/admin/exam-types', labelKey: 'examTypes', icon: ClipboardList },
      { to: '/admin/grade-edits', labelKey: 'gradeEdits', icon: FileBarChart },
      { to: '/admin/results', labelKey: 'results', icon: FileBarChart },
      { to: '/admin/fee-structure', labelKey: 'feeStructure', icon: Coins },
      { to: '/admin/fees', labelKey: 'networkFees', icon: Coins },
      { to: '/admin/salaries', labelKey: 'salaries', icon: Wallet },
      { to: '/medresa/students', labelKey: 'students', icon: Users },
    ],
  },
];

const medresaAdminNav: NavSectionConfig[] = [
  {
    sectionLabelKey: 'school',
    items: [
      { to: '/medresa/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
      { to: '/medresa/courses', labelKey: 'courses', icon: BookOpen },
      { to: '/medresa/students', labelKey: 'students', icon: Users },
      { to: '/medresa/attendance', labelKey: 'attendance', icon: CalendarDays },
      { to: '/medresa/grade-edits', labelKey: 'gradeEdits', icon: FileBarChart },
      { to: '/medresa/results', labelKey: 'results', icon: FileBarChart },
      { to: '/medresa/fees', labelKey: 'fees', icon: Coins },
      { to: '/medresa/reports', labelKey: 'reports', icon: FileBarChart },
    ],
  },
];

const teacherNav: NavSectionConfig[] = [
  {
    sectionLabelKey: 'teaching',
    items: [
      { to: '/teacher/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
      { to: '/teacher/attendance', labelKey: 'attendance', icon: CalendarDays },
      { to: '/teacher/grades', labelKey: 'grades', icon: FileBarChart },
      { to: '/teacher/students', labelKey: 'students', icon: Users },
      { to: '/teacher/reports', labelKey: 'reports', icon: FileBarChart },
    ],
  },
];

const pendingNav: NavSectionConfig[] = [
  {
    sectionLabelKey: 'account',
    items: [{ to: '/account/pending', labelKey: 'pending', icon: Clock }],
  },
];

/**
 * Role-based navigation grouped for the app sidebar. Route access is still enforced in router `beforeLoad`.
 */
export function buildNavSections(user: CurrentUser): NavSectionConfig[] {
  if (user.isSuperAdmin) return superAdminNav;
  if (user.isMedresaAdmin) return medresaAdminNav;
  if (user.isTeacher) return teacherNav;
  return pendingNav;
}
