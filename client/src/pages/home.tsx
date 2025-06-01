import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Image, Calendar, Share2 } from "lucide-react";
import { GalleryGrid } from "@/components/gallery-grid";
import { Lightbox } from "@/components/lightbox";
import { EmailShareModal } from "@/components/email-share-modal";
import { useGalleries, useDeleteGallery } from "@/hooks/use-galleries";
import { usePhotos } from "@/hooks/use-photos";
import { useToast } from "@/hooks/use-toast";
import type { Gallery } from "@shared/schema";

export default function Home() {
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null);

  const { data: galleries = [], isLoading: galleriesLoading, error: galleriesError } = useGalleries();
  const { data: photos = [], isLoading: photosLoading } = usePhotos(selectedGallery?.id || 0);
  const deleteGallery = useDeleteGallery();
  const { toast } = useToast();

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handleBackToGalleries = () => {
    setSelectedGallery(null);
    setLightboxIndex(-1);
  };

  const handleShareGallery = (gallery: Gallery) => {
    setShareGallery(gallery);
  };

  const handleDeleteGallery = async (id: number) => {
    try {
      await deleteGallery.mutateAsync(id);
      toast({
        title: "Gallery Deleted",
        description: "Gallery has been successfully deleted.",
      });
      
      // If we're viewing the deleted gallery, go back to gallery list
      if (selectedGallery?.id === id) {
        setSelectedGallery(null);
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete gallery",
        variant: "destructive",
      });
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(-1);
  };

  const nextImage = () => {
    if (photos.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const previousImage = () => {
    if (photos.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (galleriesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Galleries</h2>
            <p className="text-muted-foreground">
              Failed to load galleries. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gallery detail view
  if (selectedGallery) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb and header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToGalleries}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Galleries
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{selectedGallery.name}</CardTitle>
                {selectedGallery.description && (
                  <p className="text-muted-foreground mt-1">{selectedGallery.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {photos.length} photos
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {formatDate(selectedGallery.createdAt!)}
                  </div>
                  <Badge variant={selectedGallery.isPublic ? "default" : "secondary"}>
                    {selectedGallery.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => handleShareGallery(selectedGallery)}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Gallery
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Photos grid */}
        <Card>
          <CardContent className="pt-6">
            {photosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Image className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No photos yet</h3>
                <p className="text-muted-foreground">Upload some photos to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg bg-muted"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={`/uploads${photo.path}`}
                      alt={photo.originalName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 rounded-full p-2">
                          <Image className="w-5 h-5 text-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lightbox */}
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrevious={previousImage}
        />

        {/* Email share modal */}
        <EmailShareModal
          gallery={shareGallery}
          isOpen={!!shareGallery}
          onClose={() => setShareGallery(null)}
        />
      </div>
    );
  }

  // Gallery list view
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Galleries</h1>
          <p className="text-muted-foreground">Organize and share your photo collections</p>
        </div>
      </div>

      {galleriesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <GalleryGrid
          galleries={galleries}
          onSelectGallery={handleSelectGallery}
          onShareGallery={handleShareGallery}
          onDeleteGallery={handleDeleteGallery}
        />
      )}

      {/* Email share modal */}
      <EmailShareModal
        gallery={shareGallery}
        isOpen={!!shareGallery}
        onClose={() => setShareGallery(null)}
      />
    </div>
  );
}
