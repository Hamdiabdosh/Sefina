import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type {
  MedresaDashboardDTO,
  SuperAdminDashboardDTO,
  TeacherDashboardDTO,
} from '../types';

export const useTeacherDashboard = (enabled = true) =>
  useQuery<TeacherDashboardDTO>({
    queryKey: ['dashboard', 'teacher'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/dashboard/teacher');
      return res.data.data;
    },
    enabled,
    staleTime: 60_000,
  });

export const useMedresaDashboard = (medresaId: string | undefined, enabled = true) =>
  useQuery<MedresaDashboardDTO>({
    queryKey: ['dashboard', 'medresa', medresaId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/dashboard/medresa', {
        params: medresaId ? { medresaId } : undefined,
      });
      return res.data.data;
    },
    enabled: enabled && Boolean(medresaId),
    staleTime: 60_000,
  });

export const useSuperAdminDashboard = (enabled = true) =>
  useQuery<SuperAdminDashboardDTO>({
    queryKey: ['dashboard', 'super-admin'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/dashboard/super-admin');
      return res.data.data;
    },
    enabled,
    staleTime: 60_000,
  });
