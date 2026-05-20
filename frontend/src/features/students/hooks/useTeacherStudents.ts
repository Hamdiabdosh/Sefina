import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { TeacherStudentListItem } from '../types';

export const useTeacherStudents = () =>
  useQuery<{ items: TeacherStudentListItem[] }>({
    queryKey: ['teacherStudents'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/teacher/students');
      return response.data.data;
    },
  });
