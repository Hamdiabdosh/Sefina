import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type {
  NetworkSalaryOverviewItem,
  SalaryPaymentListResponse,
  SalaryRankDTO,
  TeacherSalaryHistoryDTO,
} from '../types';

export const useSalaryRanks = (enabled = true) =>
  useQuery<{ items: SalaryRankDTO[] }>({
    queryKey: ['salaryRanks'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/salary-ranks');
      return res.data.data;
    },
    enabled,
  });

export const useSalaryRankHistory = (enabled = true) =>
  useQuery<{ items: SalaryRankDTO[] }>({
    queryKey: ['salaryRankHistory'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/salary-ranks/history');
      return res.data.data;
    },
    enabled,
  });

export const useCreateSalaryRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: Record<string, string>;
      monthlyAmountEtb: number;
      effectiveFrom: string;
    }) => {
      const res = await axiosInstance.post('/api/v1/salary-ranks', body);
      return res.data.data as SalaryRankDTO;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['salaryRanks'] });
      void qc.invalidateQueries({ queryKey: ['salaryRankHistory'] });
    },
  });
};

export const usePatchSalaryRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: Record<string, string>;
      monthlyAmountEtb?: number;
      effectiveFrom?: string;
    }) => {
      const res = await axiosInstance.patch(`/api/v1/salary-ranks/${id}`, body);
      return res.data.data as SalaryRankDTO;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['salaryRanks'] });
      void qc.invalidateQueries({ queryKey: ['salaryRankHistory'] });
    },
  });
};

export const useDeactivateSalaryRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.patch(`/api/v1/salary-ranks/${id}/deactivate`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['salaryRanks'] });
      void qc.invalidateQueries({ queryKey: ['salaryRankHistory'] });
    },
  });
};

export const useAssignTeacherRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherId,
      salaryRankId,
      effectiveFrom,
    }: {
      teacherId: string;
      salaryRankId: string;
      effectiveFrom: string;
    }) => {
      const res = await axiosInstance.post(`/api/v1/teachers/${teacherId}/rank`, {
        salaryRankId,
        effectiveFrom,
      });
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['salaryPayments'] });
      void qc.invalidateQueries({ queryKey: ['salaryRanks'] });
    },
  });
};

export const useSalaryPayments = (
  month: number,
  year: number,
  status: string,
  rankId?: string,
  enabled = true
) =>
  useQuery<SalaryPaymentListResponse>({
    queryKey: ['salaryPayments', month, year, status, rankId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/salary-payments', {
        params: { month, year, status, rankId },
      });
      return res.data.data;
    },
    enabled: enabled && month > 0 && year > 0,
  });

export const useRecordSalaryPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      teacherId: string;
      month: number;
      year: number;
      amountPaidEtb: number;
      bankReference: string;
      paymentDate: string;
      note?: string;
      adjustmentReason?: string;
    }) => {
      const res = await axiosInstance.post('/api/v1/salary-payments', body);
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['salaryPayments'] });
      void qc.invalidateQueries({
        queryKey: ['teacherSalaryHistory', vars.teacherId],
      });
    },
  });
};

export const useTeacherSalaryHistory = (teacherId: string, enabled: boolean) =>
  useQuery<TeacherSalaryHistoryDTO>({
    queryKey: ['teacherSalaryHistory', teacherId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/teachers/${teacherId}/salary-history`);
      return res.data.data;
    },
    enabled: enabled && Boolean(teacherId),
  });

export const useNetworkSalaryOverview = (
  range: { fromMonth: number; fromYear: number; toMonth: number; toYear: number },
  rankId?: string,
  enabled = true
) =>
  useQuery<{ items: NetworkSalaryOverviewItem[] }>({
    queryKey: ['networkSalaryOverview', range, rankId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/salaries/network-overview', {
        params: { ...range, rankId },
      });
      return res.data.data;
    },
    enabled,
  });
