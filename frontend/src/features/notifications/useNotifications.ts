import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';

type NotificationsSummary = {
  pendingGradeEdits: number;
};

type NotificationsSummaryResponse = {
  success: boolean;
  data: NotificationsSummary;
};

export const useNotifications = (enabled = true) => {
  const query = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: async (): Promise<NotificationsSummary> => {
      const res = await axiosInstance.get<NotificationsSummaryResponse>(
        '/api/v1/notifications/summary'
      );
      return res.data.data;
    },
    enabled,
    refetchInterval: 60_000,
  });

  return {
    pendingGradeEdits: query.data?.pendingGradeEdits ?? 0,
    isLoading: query.isLoading,
  };
};
