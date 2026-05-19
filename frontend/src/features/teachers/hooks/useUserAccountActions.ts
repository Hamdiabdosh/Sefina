import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../../../lib/axios';

export const useUserAccountActions = (userId: string | undefined) => {
  const resendInvite = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(`/api/v1/users/${userId}/resend-invite`);
      return response.data.data as { id: string; email: string };
    },
  });

  const setPassword = useMutation({
    mutationFn: async (temporaryPassword: string) => {
      const response = await axiosInstance.patch(`/api/v1/users/${userId}/set-password`, {
        temporaryPassword,
      });
      return response.data.data;
    },
  });

  return { resendInvite, setPassword };
};
