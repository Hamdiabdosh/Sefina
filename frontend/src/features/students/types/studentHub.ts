export const STUDENT_HUB_TABS = ['profile', 'courses', 'attendance', 'grades', 'fees'] as const;

export type StudentHubTab = (typeof STUDENT_HUB_TABS)[number];

export const isStudentHubTab = (value: string | undefined): value is StudentHubTab =>
  STUDENT_HUB_TABS.includes(value as StudentHubTab);

export const parseStudentHubTab = (
  value: string | undefined,
  fallback: StudentHubTab = 'profile'
): StudentHubTab => (isStudentHubTab(value) ? value : fallback);
