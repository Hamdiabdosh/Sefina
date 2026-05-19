import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { MedresaApiPayload } from '../schemas/medresa.schemas';
import type { MedresaDetail, MedresaListItem } from '../types';

const medresasKey = ['medresas'] as const;
const medresaDetailKey = (id: string) => ['medresa', id] as const;

export const useMedresas = () => {
  const queryClient = useQueryClient();

  const { data: medresas = [], isLoading, error } = useQuery<MedresaListItem[]>({
    queryKey: medresasKey,
    queryFn: async () => {
      const response = await axiosInstance.get('/api/v1/medresas');
      return response.data.data;
    },
  });

  const createMedresa = useMutation({
    mutationFn: async (data: MedresaApiPayload) => {
      const response = await axiosInstance.post('/api/v1/medresas', data);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: medresasKey });
    },
  });

  const updateMedresa = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MedresaApiPayload }) => {
      const response = await axiosInstance.put(`/api/v1/medresas/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: medresasKey });
      void queryClient.invalidateQueries({ queryKey: medresaDetailKey(id) });
    },
  });

  const deactivateMedresa = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/medresas/${id}/deactivate`);
      return response.data.data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: medresasKey });
      void queryClient.invalidateQueries({ queryKey: medresaDetailKey(id) });
    },
  });

  const reactivateMedresa = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/medresas/${id}/reactivate`);
      return response.data.data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: medresasKey });
      void queryClient.invalidateQueries({ queryKey: medresaDetailKey(id) });
    },
  });

  return {
    medresas,
    isLoading,
    error,
    createMedresa,
    updateMedresa,
    deactivateMedresa,
    reactivateMedresa,
  };
};

export const useMedresaDetail = (id: string) => {
  return useQuery<MedresaDetail>({
    queryKey: medresaDetailKey(id),
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/v1/medresas/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
};

