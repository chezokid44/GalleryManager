import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Photo, EmailShare } from "@shared/schema";

export function usePhotos(galleryId: number) {
  return useQuery<Photo[]>({
    queryKey: ["/api/galleries", galleryId, "photos"],
    enabled: !!galleryId,
  });
}

export function useUploadPhotos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ galleryId, files }: { galleryId: number; files: File[] }) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("photos", file);
      });
      
      const response = await fetch(`/api/galleries/${galleryId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/galleries", variables.galleryId, "photos"] 
      });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/photos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/galleries"] });
    },
  });
}

export function useShareGallery() {
  return useMutation({
    mutationFn: async (shareData: EmailShare) => {
      const response = await apiRequest("POST", "/api/share", shareData);
      return response.json();
    },
  });
}
