import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { axiosInstance } from '../../../lib/axios';
import { setAccessToken, clearAccessToken } from '../../../lib/authToken';
import type { AuthLoginResponse } from '../types/auth.types';
import { enrichCurrentUser, getHomeRouteForUser } from '../utils/roleRedirect';

type LoginInput = {
  identifier: string;
  password: string;
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await axiosInstance.post<AuthLoginResponse>(
        '/api/v1/auth/login',
        credentials
      );
      return response.data;
    },
    onSuccess: (response) => {
      const { user, accessToken } = response.data;
      setAccessToken(accessToken);
      const currentUser = enrichCurrentUser(user);
      queryClient.setQueryData(['currentUser'], currentUser);
      navigate({ to: getHomeRouteForUser(currentUser) });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post('/api/v1/auth/logout', {});
    },
    onSettled: () => {
      clearAccessToken();
      queryClient.setQueryData(['currentUser'], null);
      navigate({ to: '/login' });
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
