import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Photo } from "@shared/schema";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function Lightbox({ photos, currentIndex, isOpen, onClose, onNext, onPrevious }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!isOpen || !photos.length || currentIndex < 0 || currentIndex >= photos.length) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Previous button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={photos.length <= 1}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      {/* Next button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={photos.length <= 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={`/uploads${currentPhoto.path}`}
          alt={currentPhoto.originalName}
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Image info */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
          {currentIndex + 1} of {photos.length}
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close lightbox"
      />
    </div>
  );
}
