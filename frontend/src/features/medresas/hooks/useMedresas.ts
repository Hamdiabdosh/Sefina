import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { MedresaListItem } from "../types";

export const useMedresas = () => {
  const queryClient = useQueryClient();

  const { data: medresas = [], isLoading, error } = useQuery<MedresaListItem[]>({
    queryKey: ["medresas"],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/v1/medresas");
      return response.data.data;
    },
  });

  const createMedresa = useMutation({
    mutationFn: (data: FormData) => 
      axiosInstance.post("/api/v1/medresas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medresas"] });
    },
  });

  const updateMedresa = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => 
      axiosInstance.put(`/api/v1/medresas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medresas"] });
    },
  });

  const deleteMedresa = useMutation({
    mutationFn: (id: string) => 
      axiosInstance.delete(`/api/v1/medresas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medresas"] });
    },
  });

  return {
    medresas,
    isLoading,
    error,
    createMedresa,
    updateMedresa,
    deleteMedresa,
  };
};