export type PublicMedresa = {
  id: string;
  name: string;
  location: string;
  phone: string | null;
  _count: {
    students: number;
    teacher_medresas: number;
    medresa_courses: number;
  };
};
