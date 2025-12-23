import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/use-upload";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageSelect: (file: File | null, objectPath?: string) => void;
  previewUrl?: string | null;
}

export function ImageUpload({ currentImage, onImageSelect, previewUrl }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      onImageSelect(null, response.objectPath);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setLocalPreview(null);
    },
  });

  const displayImage = localPreview || previewUrl || currentImage;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    await uploadFile(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleRemove() {
    onImageSelect(null);
    setLocalPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        data-testid="input-image-file"
        disabled={isUploading}
      />
      
      {displayImage ? (
        <div className="relative aspect-square max-w-xs rounded-lg overflow-hidden border bg-muted">
          <img
            src={displayImage}
            alt="Recipe preview"
            className="w-full h-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
          {!isUploading && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              data-testid="button-remove-image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`
            aspect-square max-w-xs border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center gap-4 cursor-pointer
            transition-colors
            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${isUploading ? "pointer-events-none opacity-50" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          data-testid="dropzone-image"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium">
              <Upload className="h-4 w-4 inline mr-1" />
              {isUploading ? "Uploading..." : "Drop image here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Square format recommended
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
