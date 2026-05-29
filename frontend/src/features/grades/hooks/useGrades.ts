import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type {
  ExamTypeDTO,
  GradeEditRequestDTO,
  GradeRosterItem,
  StudentResultsDTO,
  TeacherCourseOption,
} from '../types';

export const useExamTypes = (enabled = true) =>
  useQuery<{ items: ExamTypeDTO[] }>({
    queryKey: ['examTypes'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/exam-types');
      return res.data.data;
    },
    enabled,
  });

export const useCreateExamType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: { en: string; am?: string; ar?: string };
      maxScore: number;
      weight: number;
      status?: 'ACTIVE' | 'INACTIVE';
    }) => {
      const res = await axiosInstance.post('/api/v1/exam-types', body);
      return res.data.data as ExamTypeDTO;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['examTypes'] }),
  });
};

export const useUpdateExamType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: { en: string; am?: string; ar?: string };
      maxScore?: number;
      weight?: number;
      status?: 'ACTIVE' | 'INACTIVE';
    }) => {
      const res = await axiosInstance.patch(`/api/v1/exam-types/${id}`, body);
      return res.data.data as ExamTypeDTO;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['examTypes'] }),
  });
};

export const useTeacherGradeCourses = (enabled: boolean) =>
  useQuery<{ items: TeacherCourseOption[] }>({
    queryKey: ['teacherGradeCourses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/grades/my-courses');
      return res.data.data;
    },
    enabled,
  });

export const useGradeRoster = (
  medresaCourseId: string,
  examTypeId: string,
  enabled: boolean
) =>
  useQuery<{ items: GradeRosterItem[] }>({
    queryKey: ['gradeRoster', medresaCourseId, examTypeId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/grades/roster', {
        params: { medresaCourseId, examTypeId },
      });
      return res.data.data;
    },
    enabled: enabled && Boolean(medresaCourseId && examTypeId),
  });

export const useBatchSubmitGrades = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      medresaCourseId: string;
      examTypeId: string;
      grades: Array<{ studentId: string; numericScore: number }>;
    }) => {
      const res = await axiosInstance.post('/api/v1/grades/batch', body);
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({
        queryKey: ['gradeRoster', vars.medresaCourseId, vars.examTypeId],
      });
    },
  });
};

export const useMyGradeEditRequests = () =>
  useQuery<{ items: GradeEditRequestDTO[] }>({
    queryKey: ['myGradeEditRequests'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/grades/edit-requests');
      return res.data.data;
    },
  });

export const useGradeEditRequests = (params?: {
  status?: string;
  medresaId?: string;
}) =>
  useQuery<{ items: GradeEditRequestDTO[] }>({
    queryKey: ['gradeEditRequests', params],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/grade-edit-requests', { params });
      return res.data.data;
    },
  });

export const useApproveGradeEdit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.patch(`/api/v1/grade-edit-requests/${id}/approve`);
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['gradeEditRequests'] }),
  });
};

export const useRejectGradeEdit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      const res = await axiosInstance.patch(`/api/v1/grade-edit-requests/${id}/reject`, {
        rejectionReason,
      });
      return res.data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['gradeEditRequests'] }),
  });
};

export const useCreateGradeEditRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gradeId,
      requestedScore,
      reason,
    }: {
      gradeId: string;
      requestedScore: number;
      reason: string;
    }) => {
      const res = await axiosInstance.post(`/api/v1/grades/${gradeId}/edit-requests`, {
        requestedScore,
        reason,
      });
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['gradeEditRequests'] });
      void qc.invalidateQueries({ queryKey: ['myGradeEditRequests'] });
    },
  });
};

export const useStudentResults = (studentId: string, enabled: boolean) =>
  useQuery<StudentResultsDTO>({
    queryKey: ['studentResults', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/students/${studentId}/results`);
      return res.data.data;
    },
    enabled: enabled && Boolean(studentId),
  });

export const useMedresaCourseResults = (medresaCourseId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['medresaCourseResults', medresaCourseId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/v1/medresa-courses/${medresaCourseId}/results`
      );
      return res.data.data;
    },
    enabled: enabled && Boolean(medresaCourseId),
  });

export const useMedresaResultsOverview = (medresaId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['medresaResultsOverview', medresaId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/medresas/${medresaId}/results/overview`);
      return res.data.data;
    },
    enabled: enabled && Boolean(medresaId),
  });

export const useNetworkResultsOverview = (enabled: boolean) =>
  useQuery({
    queryKey: ['networkResultsOverview'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/results/network-overview');
      return res.data.data;
    },
    enabled,
  });
