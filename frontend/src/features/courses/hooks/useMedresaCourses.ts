import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type {
  AvailableMasterCourse,
  MedresaCourseDetail,
  MedresaCourseListItem,
  MedresaTeacherOption,
} from '../types';

const medresaCoursesKey = (medresaId: string, filters?: Record<string, string>) =>
  ['medresaCourses', medresaId, filters] as const;

const medresaCourseDetailKey = (medresaId: string, medresaCourseId: string) =>
  ['medresaCourse', medresaId, medresaCourseId] as const;

export type UseMedresaCoursesOptions = {
  /** When false, skips GET .../courses/available (admin catalog). Default true. */
  withAvailable?: boolean;
  /** When false, skips GET .../courses/teachers. Default true. */
  withTeachers?: boolean;
};

export const useMedresaCourses = (
  medresaId: string,
  filters?: { level?: string; status?: string; teacherId?: string },
  options?: UseMedresaCoursesOptions
) => {
  const queryClient = useQueryClient();
  const withAvailable = options?.withAvailable !== false;
  const withTeachers = options?.withTeachers !== false;

  const listQuery = useQuery<{ items: MedresaCourseListItem[] }>({
    queryKey: medresaCoursesKey(medresaId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/v1/medresas/${medresaId}/courses`, {
        params: filters,
      });
      return response.data.data;
    },
    enabled: Boolean(medresaId),
  });

  const availableQuery = useQuery<{ items: AvailableMasterCourse[] }>({
    queryKey: ['medresaCoursesAvailable', medresaId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/v1/medresas/${medresaId}/courses/available`
      );
      return response.data.data;
    },
    enabled: Boolean(medresaId) && withAvailable,
  });

  const teachersQuery = useQuery<{ items: MedresaTeacherOption[] }>({
    queryKey: ['medresaCourseTeachers', medresaId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/v1/medresas/${medresaId}/courses/teachers`
      );
      return response.data.data;
    },
    enabled: Boolean(medresaId) && withTeachers,
  });

  const activateCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await axiosInstance.post(`/api/v1/medresas/${medresaId}/courses`, {
        courseId,
      });
      return response.data.data as MedresaCourseListItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medresaCourses', medresaId] });
      void queryClient.invalidateQueries({ queryKey: ['medresaCoursesAvailable', medresaId] });
    },
  });

  const deactivateMedresaCourse = useMutation({
    mutationFn: async (medresaCourseId: string) => {
      const response = await axiosInstance.patch(
        `/api/v1/medresas/${medresaId}/courses/${medresaCourseId}/deactivate`
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medresaCourses', medresaId] });
    },
  });

  const assignTeacher = useMutation({
    mutationFn: async ({
      medresaCourseId,
      teacherId,
    }: {
      medresaCourseId: string;
      teacherId: string;
    }) => {
      const response = await axiosInstance.post(
        `/api/v1/medresas/${medresaId}/courses/${medresaCourseId}/teacher`,
        { teacherId }
      );
      return response.data.data;
    },
    onSuccess: (_data, { medresaCourseId }) => {
      void queryClient.invalidateQueries({ queryKey: ['medresaCourses', medresaId] });
      void queryClient.invalidateQueries({
        queryKey: medresaCourseDetailKey(medresaId, medresaCourseId),
      });
    },
  });

  return {
    courses: listQuery.data?.items ?? [],
    availableCourses: availableQuery.data?.items ?? [],
    teachers: teachersQuery.data?.items ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    activateCourse,
    deactivateMedresaCourse,
    assignTeacher,
    refetchAvailable: availableQuery.refetch,
  };
};

export const useMedresaCourseDetail = (medresaId: string, medresaCourseId: string) =>
  useQuery<MedresaCourseDetail>({
    queryKey: medresaCourseDetailKey(medresaId, medresaCourseId),
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/v1/medresas/${medresaId}/courses/${medresaCourseId}`
      );
      return response.data.data;
    },
    enabled: Boolean(medresaId) && Boolean(medresaCourseId),
  });
