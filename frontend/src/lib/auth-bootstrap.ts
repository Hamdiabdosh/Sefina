import type { QueryClient } from '@tanstack/react-query';
import { axiosInstance } from './axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './authToken';
import type { CurrentUser, User } from '../features/auth/types/auth.types';
import { enrichCurrentUser } from '../features/auth/utils/roleRedirect';

const loadCurrentUser = async (): Promise<User> => {
  const meResponse = await axiosInstance.get('/api/v1/auth/me');
  return meResponse.data?.data as User;
};

export const bootstrapAuth = async (queryClient: QueryClient): Promise<CurrentUser | null> => {
  try {
    if (getAccessToken()) {
      try {
        const user = enrichCurrentUser(await loadCurrentUser());
        queryClient.setQueryData(['currentUser'], user);
        return user;
      } catch {
        clearAccessToken();
      }
    }

    const refreshResponse = await axiosInstance.post('/api/v1/auth/refresh');
    const accessToken = refreshResponse.data?.data?.accessToken as string | undefined;
    if (accessToken) {
      setAccessToken(accessToken);
    }

    const user = enrichCurrentUser(await loadCurrentUser());
    queryClient.setQueryData(['currentUser'], user);
    return user;
  } catch (_error) {
    clearAccessToken();
    queryClient.setQueryData(['currentUser'], null);
    return null;
  }
};
