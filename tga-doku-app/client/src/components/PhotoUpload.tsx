import { useState, useCallback } from "react";
import { Camera, X, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Photo {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

interface PhotoUploadProps {
  projectId: string;
  onPhotosChange?: (photos: Photo[]) => void;
  onUploadComplete?: () => void;
}

export default function PhotoUpload({ projectId, onPhotosChange, onUploadComplete }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFilesSelect(files);
  }, []);

  const handleFilesSelect = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      toast.error("Bitte nur Bilddateien hochladen");
      return;
    }

    const newPhotos: Photo[] = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    
    if (onPhotosChange) {
      onPhotosChange(updatedPhotos);
    }

    toast.success(`${imageFiles.length} Foto(s) hinzugefügt`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    const updatedPhotos = photos.filter((photo) => photo.id !== id);
    setPhotos(updatedPhotos);
    
    if (onPhotosChange) {
      onPhotosChange(updatedPhotos);
    }
  };

  const handleCaptionChange = (id: string, caption: string) => {
    const updatedPhotos = photos.map((photo) =>
      photo.id === id ? { ...photo, caption } : photo
    );
    setPhotos(updatedPhotos);
    
    if (onPhotosChange) {
      onPhotosChange(updatedPhotos);
    }
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      toast.error("Bitte wählen Sie mindestens ein Foto aus");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Implement actual file upload to S3
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`${photos.length} Foto(s) erfolgreich hochgeladen`);
      
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Reset
      setPhotos([]);
    } catch (error) {
      toast.error("Fehler beim Hochladen");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-green-500 bg-green-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Camera className="w-10 h-10 text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Fotos hinzufügen
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Ziehen Sie Bilder hierher oder klicken Sie zum Auswählen
            </p>
            <label htmlFor="photo-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span className="gap-2">
                  <Plus className="w-4 h-4" />
                  Fotos auswählen
                </span>
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 mt-3">
              Mehrfachauswahl möglich
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Hochgeladene Fotos ({photos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Photo Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={photo.preview}
                        alt={photo.caption || "Foto"}
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => handleRemovePhoto(photo.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Caption Input */}
                    <div className="space-y-1">
                      <Label htmlFor={`caption-${photo.id}`} className="text-sm">
                        Beschreibung
                      </Label>
                      <Input
                        id={`caption-${photo.id}`}
                        placeholder="z.B. Lüftungsanschluss an Bestand"
                        value={photo.caption}
                        onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* File Info */}
                    <div className="text-xs text-slate-600">
                      {photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Upload Button */}
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleUpload}
              disabled={isUploading || photos.length === 0}
              className="w-full gap-2"
              size="lg"
            >
              <Upload className="w-5 h-5" />
              {isUploading ? "Wird hochgeladen..." : `${photos.length} Foto(s) hochladen`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

