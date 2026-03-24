import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Deal {
  id: string;
  image_url: string | null;
  title: string;
  price: number | null;
  origin_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  brandId: string;
}

export default function AiBannerDialog({ open, onOpenChange, deal, brandId }: Props) {
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formatPrice = (val: number | null) =>
    val != null ? Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";

  const handleGenerate = async () => {
    if (!deal?.image_url) {
      toast.error("Deal sem imagem para gerar banner");
      return;
    }

    setGenerating(true);
    setGeneratedUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: {
          image_url: deal.image_url,
          mode: "redesign",
          context: "banner",
        },
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || "Erro ao gerar banner");
      }

      setGeneratedUrl(data.data.url);
      toast.success("Banner gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar banner com IA");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedUrl || !deal) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("banner_schedules").insert({
        brand_id: brandId,
        image_url: generatedUrl,
        link_url: deal.origin_url || null,
        link_type: "external",
        title: deal.title,
        is_active: true,
        start_at: new Date().toISOString(),
        order_index: 0,
      });

      if (error) throw error;

      toast.success("Banner salvo com sucesso!");
      onOpenChange(false);
      setGeneratedUrl(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar banner");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setGeneratedUrl(null);
      setGenerating(false);
    }
    onOpenChange(val);
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Banner com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{deal.title}</p>
          {deal.price != null && (
            <p className="text-sm font-semibold">{formatPrice(deal.price)}</p>
          )}

          {/* Original */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Imagem original</span>
            {deal.image_url ? (
              <img
                src={deal.image_url}
                alt="Original"
                className="w-full rounded-md border object-cover"
                style={{ aspectRatio: "1200/514" }}
              />
            ) : (
              <div className="w-full rounded-md border bg-muted flex items-center justify-center" style={{ aspectRatio: "1200/514" }}>
                <span className="text-xs text-muted-foreground">Sem imagem</span>
              </div>
            )}
          </div>

          {/* Generated */}
          {generatedUrl && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Banner gerado pela IA</span>
              <img
                src={generatedUrl}
                alt="Gerado"
                className="w-full rounded-md border object-cover"
                style={{ aspectRatio: "1200/514" }}
              />
            </div>
          )}

          {generating && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Gerando banner...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!generatedUrl && !generating && (
            <Button onClick={handleGenerate} disabled={!deal.image_url} className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4 mr-1" />
              Gerar Banner
            </Button>
          )}

          {generatedUrl && (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-1" />
                Gerar novamente
              </Button>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar como Banner
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
