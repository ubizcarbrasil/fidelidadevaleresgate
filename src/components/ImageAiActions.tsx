import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Maximize, Wand2, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

type AiMode = "redesign" | "resize" | "enhance";
type ImageContext =
  | "banner"
  | "logo"
  | "favicon"
  | "product"
  | "offer"
  | "background"
  | "gallery";

interface Props {
  imageUrl: string;
  onReplace: (newUrl: string) => void;
  context?: ImageContext;
}

const MODE_META: Record<AiMode, { label: string; icon: typeof Sparkles; description: string }> = {
  redesign: { label: "Redesenhar", icon: Sparkles, description: "Cria uma nova imagem profissional usando a atual como referência" },
  resize: { label: "Ajustar", icon: Maximize, description: "Redimensiona para o tamanho ideal do contexto" },
  enhance: { label: "Melhorar", icon: Wand2, description: "Melhora nitidez, cores e qualidade geral" },
};

export default function ImageAiActions({ imageUrl, onReplace, context = "product" }: Props) {
  const [processing, setProcessing] = useState(false);
  const [currentMode, setCurrentMode] = useState<AiMode | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  if (!imageUrl) return null;

  const handleAction = async (mode: AiMode) => {
    setCurrentMode(mode);
    setProcessing(true);
    setResultUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: { image_url: imageUrl, mode, context },
      });

      if (error) {
        throw new Error(error.message || "Erro na chamada");
      }

      if (!data?.ok) {
        throw new Error(data?.error || "Falha ao processar imagem");
      }

      setResultUrl(data.data.url);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar imagem com IA");
      setCurrentMode(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = () => {
    if (resultUrl) {
      onReplace(resultUrl);
      toast.success("Imagem atualizada!");
    }
    setCurrentMode(null);
    setResultUrl(null);
  };

  const handleDiscard = () => {
    setCurrentMode(null);
    setResultUrl(null);
  };

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(MODE_META) as AiMode[]).map((mode) => {
          const { label, icon: Icon } = MODE_META[mode];
          return (
            <Button
              key={mode}
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 gap-1"
              disabled={processing}
              onClick={() => handleAction(mode)}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          );
        })}
      </div>

      <Dialog open={!!currentMode} onOpenChange={(open) => { if (!open) handleDiscard(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {currentMode && (() => {
                const { icon: Icon, label } = MODE_META[currentMode];
                return <><Icon className="h-4 w-4" /> {label} com IA</>;
              })()}
            </DialogTitle>
            <DialogDescription>
              {currentMode ? MODE_META[currentMode].description : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {processing && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processando com IA...</p>
              </div>
            )}

            {resultUrl && !processing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 text-center">Original</p>
                    <img src={imageUrl} alt="Original" className="w-full h-32 object-cover rounded-lg border" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 text-center">Resultado IA</p>
                    <img src={resultUrl} alt="Resultado" className="w-full h-32 object-cover rounded-lg border border-primary/30" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {resultUrl && !processing && (
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={handleDiscard} className="gap-1">
                <X className="h-3.5 w-3.5" /> Descartar
              </Button>
              <Button size="sm" onClick={handleAccept} className="gap-1">
                <Check className="h-3.5 w-3.5" /> Usar esta
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
