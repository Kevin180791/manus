import { useState, useCallback } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FloorPlanUploadProps {
  projectId: string;
  onUploadComplete?: (fileUrl: string, fileName: string) => void;
}

export default function FloorPlanUpload({ projectId, onUploadComplete }: FloorPlanUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [floor, setFloor] = useState("");
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
    const file = files[0];

    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      handleFileSelect(file);
    } else {
      toast.error("Bitte nur PDF oder Bilddateien hochladen");
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Bitte wählen Sie eine Datei aus");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Implement actual file upload to S3
      // For now, simulate upload with local URL
      const fakeUrl = URL.createObjectURL(selectedFile);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Grundriss erfolgreich hochgeladen");
      
      if (onUploadComplete) {
        onUploadComplete(fakeUrl, selectedFile.name);
      }

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setFloor("");
    } catch (error) {
      toast.error("Fehler beim Hochladen");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-slate-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Grundriss hochladen
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Ziehen Sie eine PDF- oder Bilddatei hierher oder klicken Sie zum Auswählen
              </p>
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" asChild>
                  <span>Datei auswählen</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-4">
                Unterstützte Formate: PDF, JPG, PNG
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              {/* File Preview */}
              <div className="relative">
                {preview ? (
                  <div className="relative rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={preview}
                      alt="Grundriss Vorschau"
                      className="w-full h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-slate-100 rounded-lg">
                    <FileImage className="w-16 h-16 text-slate-400" />
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* File Info */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">Dateiname:</span> {selectedFile.name}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Größe:</span>{" "}
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>

              {/* Floor Input */}
              <div className="space-y-2">
                <Label htmlFor="floor">Etage (optional)</Label>
                <Input
                  id="floor"
                  placeholder="z.B. 3.OG, EG, UG"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full gap-2"
                size="lg"
              >
                <Upload className="w-5 h-5" />
                {isUploading ? "Wird hochgeladen..." : "Hochladen"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

