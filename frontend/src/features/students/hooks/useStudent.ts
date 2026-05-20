import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { StudentDetail, TransferDestination } from '../types';
import {
  toStudentFormData,
  type StudentFormValues,
  type TransferFormValues,
} from '../schemas/student.schemas';

const studentDetailKey = (id: string) => ['student', id] as const;

export const useStudent = (studentId: string) => {
  const queryClient = useQueryClient();

  const detailQuery = useQuery<StudentDetail>({
    queryKey: studentDetailKey(studentId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/v1/students/${studentId}`);
      return response.data.data;
    },
    enabled: Boolean(studentId),
  });

  const transferDestinationsQuery = useQuery<{ items: TransferDestination[] }>({
    queryKey: ['transferDestinations', detailQuery.data?.currentMedresaId],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/students/transfer-destinations', {
        params: { excludeMedresaId: detailQuery.data?.currentMedresaId },
      });
      return response.data.data;
    },
    enabled: Boolean(detailQuery.data?.currentMedresaId),
  });

  const updateStudent = useMutation({
    mutationFn: async ({ values, photo }: { values: Partial<StudentFormValues>; photo?: File | null }) => {
      const form = toStudentFormData(values as StudentFormValues, photo);
      const response = await axiosInstance.patch(`/api/v1/students/${studentId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data as StudentDetail;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentDetailKey(studentId) });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const assignCourse = useMutation({
    mutationFn: async (medresaCourseId: string) => {
      const response = await axiosInstance.post(`/api/v1/students/${studentId}/courses`, {
        medresaCourseId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentDetailKey(studentId) });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      void queryClient.invalidateQueries({ queryKey: ['medresaCourses'] });
    },
  });

  const removeCourse = useMutation({
    mutationFn: async (studentCourseId: string) => {
      await axiosInstance.delete(
        `/api/v1/students/${studentId}/courses/${studentCourseId}`
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentDetailKey(studentId) });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      void queryClient.invalidateQueries({ queryKey: ['medresaCourses'] });
    },
  });

  const transferStudent = useMutation({
    mutationFn: async (values: TransferFormValues) => {
      const response = await axiosInstance.post(`/api/v1/students/${studentId}/transfer`, {
        toMedresaId: values.toMedresaId,
        transferDate: values.transferDate,
        reason: values.reason || null,
      });
      return response.data.data as StudentDetail;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentDetailKey(studentId) });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    student: detailQuery.data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
    transferDestinations: transferDestinationsQuery.data?.items ?? [],
    updateStudent,
    assignCourse,
    removeCourse,
    transferStudent,
  };
};
