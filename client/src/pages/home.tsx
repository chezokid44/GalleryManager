import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Image, Calendar, Share2, Trash2, Download, Info, CheckSquare, Square } from "lucide-react";
import { GalleryGrid } from "@/components/gallery-grid";
import { Lightbox } from "@/components/lightbox";
import { EmailShareModal } from "@/components/email-share-modal";
import { useGalleries, useDeleteGallery } from "@/hooks/use-galleries";
import { usePhotos, useDeletePhoto } from "@/hooks/use-photos";
import { useToast } from "@/hooks/use-toast";
import type { Gallery, Photo } from "@shared/schema";

export default function Home() {
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showPhotoInfo, setShowPhotoInfo] = useState<Photo | null>(null);

  const { data: galleries = [], isLoading: galleriesLoading, error: galleriesError } = useGalleries();
  const { data: photos = [], isLoading: photosLoading } = usePhotos(selectedGallery?.id || 0);
  const deleteGallery = useDeleteGallery();
  const deletePhoto = useDeletePhoto();
  const { toast } = useToast();

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handleBackToGalleries = () => {
    setSelectedGallery(null);
    setLightboxIndex(-1);
    setSelectedPhotos(new Set());
    setIsSelectionMode(false);
    setShowPhotoInfo(null);
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

  const togglePhotoSelection = (photoId: number) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAllPhotos = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      for (const photoId of Array.from(selectedPhotos)) {
        await deletePhoto.mutateAsync(photoId);
      }
      
      toast({
        title: "Photos Deleted",
        description: `${selectedPhotos.size} photo(s) deleted successfully`,
      });
      
      setSelectedPhotos(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete photos",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className="flex items-center gap-2"
                >
                  {isSelectionMode ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                  {isSelectionMode ? "Cancel" : "Select"}
                </Button>
                <Button
                  onClick={() => handleShareGallery(selectedGallery)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Gallery
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Bulk actions toolbar */}
        {isSelectionMode && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPhotos}
                    className="flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    {selectedPhotos.size === photos.length ? "Deselect All" : "Select All"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedPhotos.size} of {photos.length} selected
                  </span>
                </div>
                {selectedPhotos.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                    className="relative group aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    {/* Selection checkbox */}
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedPhotos.has(photo.id)}
                          onCheckedChange={() => togglePhotoSelection(photo.id)}
                          className="bg-white/90 border-2"
                        />
                      </div>
                    )}
                    
                    {/* Photo info button */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPhotoInfo(photo);
                        }}
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>

                    <div
                      className="cursor-pointer w-full h-full"
                      onClick={() => {
                        if (isSelectionMode) {
                          togglePhotoSelection(photo.id);
                        } else {
                          openLightbox(index);
                        }
                      }}
                    >
                      <img
                        src={`/uploads${photo.path}`}
                        alt={photo.originalName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        {!isSelectionMode && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 rounded-full p-2">
                              <Image className="w-5 h-5 text-black" />
                            </div>
                          </div>
                        )}
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

        {/* Photo info modal */}
        {showPhotoInfo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Photo Details
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPhotoInfo(null)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={`/uploads${showPhotoInfo.path}`}
                    alt={showPhotoInfo.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">File Name</label>
                    <p className="text-sm font-mono break-all">{showPhotoInfo.originalName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File Size</label>
                      <p className="text-sm">{formatFileSize(showPhotoInfo.size)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm">{showPhotoInfo.mimeType}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                    <p className="text-sm">{formatDate(showPhotoInfo.createdAt!)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">File Path</label>
                    <p className="text-xs font-mono text-muted-foreground break-all">{showPhotoInfo.path}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/uploads${showPhotoInfo.path}`;
                      link.download = showPhotoInfo.originalName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete "${showPhotoInfo.originalName}"?`)) {
                        try {
                          await deletePhoto.mutateAsync(showPhotoInfo.id);
                          setShowPhotoInfo(null);
                          toast({
                            title: "Photo Deleted",
                            description: "Photo deleted successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Delete Failed",
                            description: error instanceof Error ? error.message : "Failed to delete photo",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
