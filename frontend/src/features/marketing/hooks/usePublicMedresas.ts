import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { PublicMedresa } from '../types';

export const usePublicMedresas = () =>
  useQuery({
    queryKey: ['publicMedresas'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; data: { items: PublicMedresa[] } }>(
        '/api/v1/public/medresas'
      );
      return data.data.items;
    },
    staleTime: 5 * 60 * 1000,
  });
