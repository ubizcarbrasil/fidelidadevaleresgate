import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, X, Image as ImageIcon, Link2 } from "lucide-react";
import ImageAiActions from "@/components/ImageAiActions";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  folder?: string;
  accept?: string;
  aspectHint?: string;
  compact?: boolean;
}

export default function StorageImageUpload({
  value,
  onChange,
  label = "Imagem",
  bucket = "brand-assets",
  folder = "page-builder",
  accept = "image/*",
  aspectHint,
  compact = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && !value.startsWith("blob:") ? "url" : "upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máx. 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(publicData.publicUrl);
    setUploading(false);
    toast({ title: "Imagem enviada!" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${mode === "upload" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Upload className="h-3 w-3 inline mr-0.5" /> Enviar
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${mode === "url" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Link2 className="h-3 w-3 inline mr-0.5" /> URL
          </button>
        </div>
      </div>

      {/* Preview */}
      {value && (
        <div className="relative group">
          <img
            src={value}
            alt="Pré-visualização"
            className={`w-full object-cover rounded-lg border ${compact ? "h-20" : "h-32"}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {value && (
        <ImageAiActions imageUrl={value} onReplace={onChange} context="banner" />
      )}

      {mode === "upload" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1" />
            )}
            {uploading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
          </Button>
          {aspectHint && <p className="text-[10px] text-muted-foreground mt-1">{aspectHint}</p>}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="text-xs"
        />
      )}
    </div>
  );
}
