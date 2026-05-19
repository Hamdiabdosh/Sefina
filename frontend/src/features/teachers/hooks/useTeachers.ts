import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { TeacherApiPayload } from '../schemas/teacher.schemas';
import type { TeacherDetail, TeachersListResponse } from '../types';

export type TeacherListFilters = {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  medresaId?: string;
  specialization?: string;
  page?: number;
  limit?: number;
};

const teachersKey = (filters: TeacherListFilters) => ['teachers', filters] as const;
const teacherDetailKey = (id: string) => ['teacher', id] as const;

export const useTeachers = (filters: TeacherListFilters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery<TeachersListResponse>({
    queryKey: teachersKey(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/teachers', { params: filters });
      return response.data.data;
    },
  });

  const createTeacher = useMutation({
    mutationFn: async (data: TeacherApiPayload) => {
      const response = await axiosInstance.post('/api/v1/teachers', data);
      return response.data.data as TeacherDetail;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeacherApiPayload> }) => {
      const response = await axiosInstance.patch(`/api/v1/teachers/${id}`, data);
      return response.data.data as TeacherDetail;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(id) });
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await axiosInstance.post(`/api/v1/teachers/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data as TeacherDetail;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(id) });
    },
  });

  const deactivateTeacher = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/teachers/${id}/deactivate`);
      return response.data.data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(id) });
    },
  });

  const reactivateTeacher = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/teachers/${id}/reactivate`);
      return response.data.data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(id) });
    },
  });

  const assignMedresa = useMutation({
    mutationFn: async ({
      teacherId,
      medresaId,
      role,
      assignedSince,
    }: {
      teacherId: string;
      medresaId: string;
      role: 'TEACHER' | 'ADMIN';
      assignedSince?: string;
    }) => {
      const response = await axiosInstance.post(`/api/v1/teachers/${teacherId}/medresas`, {
        medresaId,
        role,
        assignedSince,
      });
      return response.data.data as TeacherDetail;
    },
    onSuccess: (_data, { teacherId }) => {
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(teacherId) });
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const bulkAssignMedresa = useMutation({
    mutationFn: async ({
      teacherId,
      assignments,
    }: {
      teacherId: string;
      assignments: Array<{
        medresaId: string;
        role: 'TEACHER' | 'ADMIN';
        assignedSince?: string;
      }>;
    }) => {
      const response = await axiosInstance.post(
        `/api/v1/teachers/${teacherId}/medresas/bulk`,
        { assignments }
      );
      return response.data.data as TeacherDetail;
    },
    onSuccess: (_data, { teacherId }) => {
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(teacherId) });
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateAssignmentRole = useMutation({
    mutationFn: async ({
      teacherId,
      medresaId,
      role,
    }: {
      teacherId: string;
      medresaId: string;
      role: 'TEACHER' | 'ADMIN';
    }) => {
      const response = await axiosInstance.patch(
        `/api/v1/teachers/${teacherId}/medresas/${medresaId}`,
        { role }
      );
      return response.data.data as TeacherDetail;
    },
    onSuccess: (_data, { teacherId }) => {
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(teacherId) });
    },
  });

  const removeFromMedresa = useMutation({
    mutationFn: async ({ teacherId, medresaId }: { teacherId: string; medresaId: string }) => {
      const response = await axiosInstance.delete(
        `/api/v1/teachers/${teacherId}/medresas/${medresaId}`
      );
      return response.data.data as TeacherDetail;
    },
    onSuccess: (_data, { teacherId }) => {
      void queryClient.invalidateQueries({ queryKey: teacherDetailKey(teacherId) });
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  return {
    teachers: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    createTeacher,
    updateTeacher,
    uploadPhoto,
    deactivateTeacher,
    reactivateTeacher,
    assignMedresa,
    bulkAssignMedresa,
    updateAssignmentRole,
    removeFromMedresa,
  };
};

export const useTeacherDetail = (id: string) =>
  useQuery<TeacherDetail>({
    queryKey: teacherDetailKey(id),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/v1/teachers/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });

export const useTeacherMe = (enabled: boolean) =>
  useQuery<TeacherDetail>({
    queryKey: ['teacher', 'me'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/teachers/me');
      return response.data.data;
    },
    enabled,
  });

export const teacherPhotoUrl = (teacherId: string) => `/api/v1/teachers/${teacherId}/photo`;
