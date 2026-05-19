import type { LocalizedString } from '../../teachers/utils/localizedJson';

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export type CourseListItem = {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  level: CourseLevel;
  status: EntityStatus;
  usedByCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CoursesListResponse = {
  items: CourseListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MedresaCourseListItem = {
  medresaCourseId: string;
  courseId: string;
  name: LocalizedString;
  description: LocalizedString;
  level: CourseLevel;
  masterStatus: EntityStatus;
  status: EntityStatus;
  activatedAt: string;
  assignedTeacher: {
    id: string;
    fullName: string;
    assignedSince: string;
  } | null;
  studentCount: number;
};

export type MedresaCourseDetail = MedresaCourseListItem & {
  medresaId: string;
  medresaName: string;
  enrolledStudents: Array<{ id: string; fullName: string }>;
};

export type AvailableMasterCourse = {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  level: CourseLevel;
};

export type MedresaTeacherOption = {
  id: string;
  fullName: string;
  email: string;
};
