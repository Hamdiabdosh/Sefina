import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { CourseListItem, CoursesListResponse } from '../types';

export type CourseListFilters = {
  page?: number;
  limit?: number;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status?: 'ACTIVE' | 'INACTIVE';
};

const coursesKey = (filters: CourseListFilters) => ['courses', filters] as const;
const courseDetailKey = (id: string) => ['course', id] as const;

export const useCourses = (filters: CourseListFilters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery<CoursesListResponse>({
    queryKey: coursesKey(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/courses', { params: filters });
      return response.data.data;
    },
  });

  const createCourse = useMutation({
    mutationFn: async (data: unknown) => {
      const response = await axiosInstance.post('/api/v1/courses', data);
      return response.data.data as CourseListItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await axiosInstance.patch(`/api/v1/courses/${id}`, data);
      return response.data.data as CourseListItem;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: courseDetailKey(id) });
    },
  });

  const deactivateCourse = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/courses/${id}/deactivate`);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const reactivateCourse = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/courses/${id}/reactivate`);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return {
    courses: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    createCourse,
    updateCourse,
    deactivateCourse,
    reactivateCourse,
  };
};

export const useCourseDetail = (id: string) =>
  useQuery<CourseListItem>({
    queryKey: courseDetailKey(id),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/v1/courses/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
