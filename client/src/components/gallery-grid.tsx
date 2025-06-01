import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Trash2, Calendar, Image } from "lucide-react";
import type { Gallery } from "@shared/schema";

interface GalleryGridProps {
  galleries: Gallery[];
  onSelectGallery: (gallery: Gallery) => void;
  onShareGallery: (gallery: Gallery) => void;
  onDeleteGallery: (id: number) => void;
}

export function GalleryGrid({ galleries, onSelectGallery, onShareGallery, onDeleteGallery }: GalleryGridProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this gallery? This action cannot be undone.")) {
      setDeletingId(id);
      try {
        await onDeleteGallery(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (galleries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Image className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No galleries yet</h3>
        <p className="text-muted-foreground">Create your first gallery to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {galleries.map((gallery) => (
        <Card key={gallery.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
          <div onClick={() => onSelectGallery(gallery)}>
            <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
              <Image className="w-12 h-12 text-muted-foreground" />
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                    {gallery.name}
                  </h3>
                  <Badge variant={gallery.isPublic ? "default" : "secondary"}>
                    {gallery.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                
                {gallery.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {gallery.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created {formatDate(gallery.createdAt!)}
                </div>
              </div>
            </CardContent>
          </div>
          
          <div className="flex items-center justify-end gap-2 p-4 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShareGallery(gallery);
              }}
              className="h-8 w-8 p-0"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(gallery.id);
              }}
              disabled={deletingId === gallery.id}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
