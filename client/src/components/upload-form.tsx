import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { useUploadPhotos } from "@/hooks/use-photos";
import { useToast } from "@/hooks/use-toast";
import type { Gallery } from "@shared/schema";

interface UploadFormProps {
  galleries: Gallery[];
  selectedGalleryId?: number;
}

export function UploadForm({ galleries, selectedGalleryId }: UploadFormProps) {
  const [galleryId, setGalleryId] = useState<string>(selectedGalleryId?.toString() || "");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadPhotos = useUploadPhotos();
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles = Array.from(selectedFiles).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isImage) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a valid image file`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!galleryId) {
      toast({
        title: "Validation Error",
        description: "Please select a gallery",
        variant: "destructive",
      });
      return;
    }
    
    if (files.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one photo",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadPhotos.mutateAsync({
        galleryId: parseInt(galleryId),
        files,
      });

      toast({
        title: "Upload Successful",
        description: `${files.length} photo(s) uploaded successfully`,
      });

      // Reset form
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Gallery</Label>
            <Select value={galleryId} onValueChange={setGalleryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a gallery..." />
              </SelectTrigger>
              <SelectContent>
                {galleries.map((gallery) => (
                  <SelectItem key={gallery.id} value={gallery.id.toString()}>
                    {gallery.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileImage className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB each
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={uploadPhotos.isPending || !galleryId || files.length === 0}
          >
            {uploadPhotos.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length > 0 ? `${files.length} Photo${files.length > 1 ? 's' : ''}` : 'Photos'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
