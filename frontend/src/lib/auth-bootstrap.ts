import type { QueryClient } from '@tanstack/react-query';
import { axiosInstance } from './axios';
import { clearAccessToken, setAccessToken } from './authToken';
import type { CurrentUser, User } from '../features/auth/types/auth.types';
import { enrichCurrentUser } from '../features/auth/utils/roleRedirect';

export const bootstrapAuth = async (queryClient: QueryClient): Promise<CurrentUser | null> => {
  try {
    const refreshResponse = await axiosInstance.post('/api/v1/auth/refresh');
    const accessToken = refreshResponse.data?.data?.accessToken as string | undefined;
    if (accessToken) {
      setAccessToken(accessToken);
    }

    const meResponse = await axiosInstance.get('/api/v1/auth/me');
    const user = enrichCurrentUser(meResponse.data?.data as User);
    queryClient.setQueryData(['currentUser'], user);
    return user;
  } catch {
    clearAccessToken();
    queryClient.setQueryData(['currentUser'], null);
    return null;
  }
};
