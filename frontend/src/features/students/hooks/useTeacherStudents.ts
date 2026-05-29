import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { TeacherStudentListItem } from '../types';

export const useTeacherStudents = (medresaId: string, enabled = true) =>
  useQuery<{ items: TeacherStudentListItem[] }>({
    queryKey: ['teacherStudents', medresaId || 'all'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/teacher/students', {
        params: medresaId ? { medresaId } : undefined,
      });
      return response.data.data;
    },
    enabled: enabled && Boolean(medresaId),
  });
