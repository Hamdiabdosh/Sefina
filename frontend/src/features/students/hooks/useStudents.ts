import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { StudentDetail, StudentsListResponse } from '../types';
import { toStudentFormData, type StudentFormValues } from '../schemas/student.schemas';

export type StudentListFilters = {
  search?: string;
  gender?: 'MALE' | 'FEMALE';
  status?: 'ACTIVE' | 'TRANSFERRED';
  medresaCourseId?: string;
  page?: number;
  limit?: number;
};

const studentsKey = (medresaId: string, filters: StudentListFilters) =>
  ['students', medresaId, filters] as const;

export const studentPhotoUrl = (studentId: string) => `/api/v1/students/${studentId}/photo`;

export const useStudents = (medresaId: string, filters: StudentListFilters = {}) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery<StudentsListResponse>({
    queryKey: studentsKey(medresaId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/v1/medresas/${medresaId}/students`, {
        params: filters,
      });
      return response.data.data;
    },
    enabled: Boolean(medresaId),
  });

  const createStudent = useMutation({
    mutationFn: async ({ values, photo }: { values: StudentFormValues; photo?: File | null }) => {
      const form = toStudentFormData(values, photo);
      const response = await axiosInstance.post(
        `/api/v1/medresas/${medresaId}/students`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data as StudentDetail;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', medresaId] });
    },
  });

  return {
    students: listQuery.data?.items ?? [],
    pagination: listQuery.data?.pagination,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createStudent,
  };
};
