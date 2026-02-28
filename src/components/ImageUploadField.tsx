import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Crop } from "lucide-react";
import { toast } from "sonner";
import ImageCropDialog from "@/components/ImageCropDialog";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  accept?: string;
  previewClassName?: string;
  aspectRatio?: number;
}

export default function ImageUploadField({
  value,
  onChange,
  folder,
  label = "Imagem",
  accept = "image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon",
  previewClassName = "h-12 object-contain",
  aspectRatio,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadBlob = async (blob: Blob, ext: string) => {
    setUploading(true);
    const filePath = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(filePath, blob, { upsert: true });

    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(filePath);

    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    // For SVG/ICO, skip crop
    if (file.type === "image/svg+xml" || file.type === "image/x-icon") {
      uploadBlob(file, file.name.split(".").pop() || "png");
      return;
    }

    // Open crop dialog
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropped = (blob: Blob) => {
    setCropSrc(null);
    setPendingFile(null);
    uploadBlob(blob, "png");
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    // Upload original if user cancels crop
    if (pendingFile) {
      uploadBlob(pendingFile, pendingFile.name.split(".").pop() || "png");
      setPendingFile(null);
    }
  };

  const handleRemove = () => onChange("");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {value ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={value}
              alt={label}
              className={`${previewClassName} rounded border border-input p-1 shrink-0`}
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-xs font-mono flex-1"
              placeholder="URL da imagem"
            />
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-xs font-mono flex-1"
            placeholder="URL ou faça upload"
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      {cropSrc && (
        <ImageCropDialog
          open={!!cropSrc}
          imageSrc={cropSrc}
          aspectRatio={aspectRatio}
          onCropped={handleCropped}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
