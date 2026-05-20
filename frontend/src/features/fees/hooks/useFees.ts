import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type {
  FeeCollectionResponse,
  FeeStructureDTO,
  StudentFeeHistoryDTO,
} from '../types';

export const useFeeStructures = (enabled = true) =>
  useQuery<{ items: FeeStructureDTO[] }>({
    queryKey: ['feeStructures'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/fee-structures');
      return res.data.data;
    },
    enabled,
  });

export const useActiveFeeStructure = (enabled = true) =>
  useQuery<FeeStructureDTO>({
    queryKey: ['feeStructureActive'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/fee-structures/active');
      return res.data.data;
    },
    enabled,
    retry: false,
  });

export const useCreateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { monthlyAmountEtb: number; effectiveFrom: string }) => {
      const res = await axiosInstance.post('/api/v1/fee-structures', body);
      return res.data.data as FeeStructureDTO;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feeStructures'] });
      void qc.invalidateQueries({ queryKey: ['feeStructureActive'] });
    },
  });
};

export const useFeeCollection = (
  medresaId: string,
  month: number,
  year: number,
  status: string,
  enabled: boolean
) =>
  useQuery<FeeCollectionResponse>({
    queryKey: ['feeCollection', medresaId, month, year, status],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/medresas/${medresaId}/fees/collection`, {
        params: { month, year, status },
      });
      return res.data.data;
    },
    enabled: enabled && Boolean(medresaId && month && year),
  });

export const useRecordFeePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      studentId: string;
      medresaId: string;
      month: number;
      year: number;
      amountPaidEtb: number;
      paymentMethod: 'CASH' | 'BANK_TRANSFER';
      bankReference?: string;
      paymentDate: string;
      note?: string;
    }) => {
      const res = await axiosInstance.post('/api/v1/fee-payments', body);
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['feeCollection', vars.medresaId] });
      void qc.invalidateQueries({
        queryKey: ['studentFeeHistory', vars.medresaId, vars.studentId],
      });
      void qc.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

export const useStudentFeeHistory = (
  medresaId: string,
  studentId: string,
  enabled: boolean
) =>
  useQuery<StudentFeeHistoryDTO>({
    queryKey: ['studentFeeHistory', medresaId, studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/v1/medresas/${medresaId}/students/${studentId}/fees/history`
      );
      return res.data.data;
    },
    enabled: enabled && Boolean(medresaId && studentId),
  });

export const useMedresaFeeOverview = (
  medresaId: string,
  range: { fromMonth: number; fromYear: number; toMonth: number; toYear: number },
  enabled: boolean
) =>
  useQuery({
    queryKey: ['medresaFeeOverview', medresaId, range],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/v1/medresas/${medresaId}/fees/overview`, {
        params: range,
      });
      return res.data.data as {
        medresaId: string;
        items: Array<{
          month: number;
          year: number;
          studentCount: number;
          totalDueEtb: number;
          totalCollectedEtb: number;
          totalOutstandingEtb: number;
          collectionRatePercent: number | null;
        }>;
      };
    },
    enabled: enabled && Boolean(medresaId),
  });

export const useNetworkFeeOverview = (
  range: { fromMonth: number; fromYear: number; toMonth: number; toYear: number },
  medresaId?: string,
  enabled = true
) =>
  useQuery({
    queryKey: ['networkFeeOverview', range, medresaId],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/fees/network-overview', {
        params: { ...range, medresaId },
      });
      return res.data.data as {
        items: Array<{
          medresaId: string;
          medresaName: string;
          month: number;
          year: number;
          totalDueEtb: number;
          totalCollectedEtb: number;
          totalOutstandingEtb: number;
          collectionRatePercent: number | null;
        }>;
      };
    },
    enabled,
  });
