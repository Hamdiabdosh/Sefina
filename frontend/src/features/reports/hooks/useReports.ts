import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { ReportRangeParams } from '../types';

export const useEnrollmentReport = (params: ReportRangeParams, enabled: boolean) =>
  useQuery({
    queryKey: ['reports', 'enrollment', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/reports/enrollment', { params });
      return res.data.data;
    },
    enabled,
  });

export const useAttendanceReport = (params: ReportRangeParams, enabled: boolean) =>
  useQuery({
    queryKey: ['reports', 'attendance', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/reports/attendance', { params });
      return res.data.data;
    },
    enabled,
  });

export const useFeesReport = (params: ReportRangeParams, enabled: boolean) =>
  useQuery({
    queryKey: ['reports', 'fees', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/reports/fees', { params });
      return res.data.data;
    },
    enabled,
  });

export const useSalaryReport = (params: ReportRangeParams, enabled: boolean) =>
  useQuery({
    queryKey: ['reports', 'salary', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/reports/salary', { params });
      return res.data.data;
    },
    enabled,
  });

export const useGradesReport = (params: ReportRangeParams, enabled: boolean) =>
  useQuery({
    queryKey: ['reports', 'grades', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/reports/grades', { params });
      return res.data.data;
    },
    enabled,
  });
