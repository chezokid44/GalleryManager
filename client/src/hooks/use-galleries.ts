import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Gallery, InsertGallery, UpdateGallery } from "@shared/schema";

export function useGalleries() {
  return useQuery<Gallery[]>({
    queryKey: ["/api/galleries"],
  });
}

export function useGallery(id: number) {
  return useQuery<Gallery>({
    queryKey: ["/api/galleries", id],
    enabled: !!id,
  });
}

export function useCreateGallery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gallery: InsertGallery) => {
      const response = await apiRequest("POST", "/api/galleries", gallery);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/galleries"] });
    },
  });
}

export function useUpdateGallery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateGallery }) => {
      const response = await apiRequest("PATCH", `/api/galleries/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/galleries"] });
    },
  });
}

export function useDeleteGallery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/galleries/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/galleries"] });
    },
  });
}
