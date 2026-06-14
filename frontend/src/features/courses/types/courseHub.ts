export const COURSE_HUB_TABS = ['overview', 'roster', 'attendance', 'results', 'teacher'] as const;

export type CourseHubTab = (typeof COURSE_HUB_TABS)[number];

export const isCourseHubTab = (value: string | undefined): value is CourseHubTab =>
  COURSE_HUB_TABS.includes(value as CourseHubTab);

export const parseCourseHubTab = (
  value: string | undefined,
  fallback: CourseHubTab = 'overview'
): CourseHubTab => (isCourseHubTab(value) ? value : fallback);
