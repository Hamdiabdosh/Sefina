import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type {
  AttendanceSessionDTO,
  AttendanceStatus,
  SessionListItemDTO,
  StudentAttendanceSummaryDTO,
} from '../types';

export const attendanceRosterKey = (medresaId: string) => ['attendanceRoster', medresaId] as const;

export const useAttendanceRoster = (medresaId: string, enabled: boolean) =>
  useQuery<{ items: { id: string; fullName: string }[] }>({
    queryKey: attendanceRosterKey(medresaId),
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/attendance/roster', {
        params: { medresaId },
      });
      return res.data.data;
    },
    enabled,
  });

export const useTodayAttendanceSession = (medresaId: string, enabled: boolean) =>
  useQuery<{ session: AttendanceSessionDTO | null }>({
    queryKey: ['attendanceTodaySession', medresaId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/attendance/sessions/today-session', {
        params: { medresaId },
      });
      return res.data.data;
    },
    enabled,
  });

export type CreateSessionBody = {
  medresaId: string;
  date: string;
  records: Array<{ studentId: string; status?: AttendanceStatus; note?: string }>;
};

export const useCreateAttendanceSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateSessionBody) => {
      const res = await axiosInstance.post('/api/v1/attendance/sessions', body);
      return res.data.data.session as AttendanceSessionDTO;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['attendanceTodaySession', vars.medresaId] });
      void qc.invalidateQueries({ queryKey: attendanceRosterKey(vars.medresaId) });
      void qc.invalidateQueries({ queryKey: ['teacherAttendanceSessions'] });
    },
  });
};

export type PatchSessionBody = {
  sessionId: string;
  medresaId: string;
  records: Array<{ studentId: string; status?: AttendanceStatus; note?: string | null }>;
};

export const usePatchAttendanceSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PatchSessionBody) => {
      const res = await axiosInstance.patch(`/api/v1/attendance/sessions/${body.sessionId}`, {
        records: body.records,
      });
      return res.data.data.session as AttendanceSessionDTO;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['attendanceTodaySession', vars.medresaId] });
      void qc.invalidateQueries({ queryKey: attendanceRosterKey(vars.medresaId) });
      void qc.invalidateQueries({ queryKey: ['teacherAttendanceSessions'] });
    },
  });
};

export const useWriterAttendanceSessions = (params: {
  medresaId?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}) =>
  useQuery<{ items: SessionListItemDTO[] }>({
    queryKey: ['teacherAttendanceSessions', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/attendance/sessions', { params });
      return res.data.data;
    },
    enabled: params.enabled !== false,
  });

export const useMedresaAttendanceOverview = (
  medresaId: string,
  date: string,
  enabled: boolean
) =>
  useQuery({
    queryKey: ['medresaAttendanceOverview', medresaId, date],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/medresas/${medresaId}/attendance/overview`, {
        params: { date },
      });
      return res.data.data as {
        items: Array<{
          sessionId: string;
          medresaId: string;
          teacherMarkedAt: string | null;
          adminMarkedAt: string | null;
          present: number;
          absent: number;
          late: number;
          excused: number;
          totalStudents: number;
        }>;
      };
    },
    enabled: enabled && Boolean(medresaId) && Boolean(date),
  });

export const useStudentAttendance = (studentId: string, enabled: boolean) =>
  useQuery<StudentAttendanceSummaryDTO>({
    queryKey: ['studentAttendance', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/attendance/students/${studentId}`);
      return res.data.data;
    },
    enabled: enabled && Boolean(studentId),
  });

export const useNetworkAttendanceOverview = (from: string, to: string, medresaId?: string) =>
  useQuery({
    queryKey: ['networkAttendanceOverview', from, to, medresaId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/attendance/network-overview', {
        params: { from, to, ...(medresaId ? { medresaId } : {}) },
      });
      return res.data.data as {
        items: Array<{
          date: string;
          medresaId: string;
          medresaName: string;
          present: number;
          absent: number;
          late: number;
          excused: number;
          totalStudents: number;
        }>;
      };
    },
    enabled: Boolean(from && to),
  });
