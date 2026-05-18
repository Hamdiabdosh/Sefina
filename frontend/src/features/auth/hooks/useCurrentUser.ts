import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { CurrentUser, User } from '../types/auth.types';
import { enrichCurrentUser } from '../utils/roleRedirect';

export const useCurrentUser = () => {
  const query = useQuery<CurrentUser | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/api/v1/auth/me');
        const user = response.data.data as User;
        return enrichCurrentUser(user);
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    currentUser: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
    refetch: query.refetch,
  };
};
