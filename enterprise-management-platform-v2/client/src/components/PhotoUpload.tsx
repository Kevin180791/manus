import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PhotoUploadProps {
  onUploadComplete: (urls: string[]) => void;
  existingPhotos?: string[];
  maxPhotos?: number;
}

export function PhotoUpload({ onUploadComplete, existingPhotos = [], maxPhotos = 10 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: (data) => {
      const newPhotos = [...photos, data.url];
      setPhotos(newPhotos);
      onUploadComplete(newPhotos);
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
      alert("Fehler beim Hochladen");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Maximal ${maxPhotos} Fotos erlaubt`);
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await uploadMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          data: base64,
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onUploadComplete(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || photos.length >= maxPhotos}
          onClick={() => document.getElementById("photo-input")?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Wird hochgeladen..." : "Fotos hinzufügen"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {photos.length} / {maxPhotos} Fotos
        </span>
      </div>

      <input
        id="photo-input"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Fotos hochgeladen</p>
        </div>
      )}
    </div>
  );
}

