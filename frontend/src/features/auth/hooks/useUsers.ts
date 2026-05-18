import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';
import type { CreateUserApiPayload, UpdateUserApiPayload } from '../schemas/auth.schemas';
import type { UserListItem, UsersListResponse } from '../types/auth.types';

type UserFilters = {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
};

export const useUsers = (filters: UserFilters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await axiosInstance.get<UsersListResponse>('/api/v1/users', {
        params: filters,
      });
      return response.data.data;
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: CreateUserApiPayload) => {
      const response = await axiosInstance.post('/api/v1/users', data);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserApiPayload }) => {
      const response = await axiosInstance.patch(`/api/v1/users/${id}`, data);
      return response.data.data as UserListItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deactivateUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/users/${id}/deactivate`);
      return response.data.data as UserListItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const reactivateUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/api/v1/users/${id}/reactivate`);
      return response.data.data as UserListItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.post(`/api/v1/users/${id}/resend-invite`);
      return response.data.data as { message: string; email: string };
    },
  });

  return {
    users: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    resendInvite,
  };
};
