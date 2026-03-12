import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, RotateCcw, Eye } from "lucide-react";
import { icons } from "lucide-react";
import { toast } from "sonner";
import IconPickerDialog from "@/components/IconPickerDialog";
import WelcomeTour from "@/components/customer/WelcomeTour";

interface SlideConfig {
  icon: string;
  color: string;
  bg: string;
  title: string;
  description: string;
}

const DEFAULT_SLIDES: SlideConfig[] = [
  {
    icon: "Coins",
    color: "#059669",
    bg: "#A7F3D0",
    title: "Acumule pontos",
    description: "Compre nos parceiros emissores e acumule pontos automaticamente a cada compra.",
  },
  {
    icon: "Tag",
    color: "#7C3AED",
    bg: "#DDD6FE",
    title: "Descubra ofertas",
    description: "Encontre cupons exclusivos, descontos e promoções dos melhores parceiros da região.",
  },
  {
    icon: "Ticket",
    color: "#E91E63",
    bg: "#F8C8D8",
    title: "Resgate recompensas",
    description: "Use seus pontos e saldo para resgatar ofertas incríveis. É fácil e rápido!",
  },
];

export default function WelcomeTourConfigPage() {
  const { brand } = useBrand();
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [slides, setSlides] = useState<SlideConfig[]>(DEFAULT_SLIDES);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const settings = (brand?.brand_settings_json as any) || {};

  useEffect(() => {
    if (settings.welcome_tour_slides?.length) {
      setSlides(settings.welcome_tour_slides);
    }
  }, [brand]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updated = { ...settings, welcome_tour_slides: slides };
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: updated })
        .eq("id", currentBrandId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand-detail"] });
      toast.success("Tour de boas-vindas atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetToDefaults = () => {
    setSlides(DEFAULT_SLIDES);
    toast.info("Slides restaurados ao padrão.");
  };

  const updateSlide = (index: number, field: keyof SlideConfig, value: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  const handleIconSelect = (icon: { type: "lucide"; name: string } | { type: "custom"; url: string; name: string }) => {
    if (editingSlide === null) return;
    if (icon.type === "lucide") {
      updateSlide(editingSlide, "icon", icon.name);
    }
    setPickerOpen(false);
    setEditingSlide(null);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tour de Boas-Vindas"
        description="Personalize os textos e ícones exibidos no carrossel de boas-vindas para novos clientes do app."
      />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={resetToDefaults} className="gap-1.5">
          <RotateCcw className="h-4 w-4" /> Restaurar Padrão
        </Button>
        <Button variant="outline" onClick={() => setPreviewOpen(true)} className="gap-1.5">
          <Eye className="h-4 w-4" /> Pré-visualizar
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {slides.map((slide, i) => {
          const Icon = icons[slide.icon as keyof typeof icons];
          return (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Slide {i + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Icon preview + picker */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditingSlide(i); setPickerOpen(true); }}
                    className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-dashed border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: slide.bg }}
                  >
                    {Icon ? <Icon className="h-8 w-8" style={{ color: slide.color }} /> : <span className="text-xs text-muted-foreground">{slide.icon}</span>}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    Clique para trocar o ícone
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Cor do ícone</Label>
                    <div className="flex gap-1 items-center">
                      <input type="color" value={slide.color} onChange={(e) => updateSlide(i, "color", e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                      <Input value={slide.color} onChange={(e) => updateSlide(i, "color", e.target.value)} className="h-8 text-xs font-mono" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Fundo do ícone</Label>
                    <div className="flex gap-1 items-center">
                      <input type="color" value={slide.bg} onChange={(e) => updateSlide(i, "bg", e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                      <Input value={slide.bg} onChange={(e) => updateSlide(i, "bg", e.target.value)} className="h-8 text-xs font-mono" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input value={slide.title} onChange={(e) => updateSlide(i, "title", e.target.value)} className="h-9" />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Textarea value={slide.description} onChange={(e) => updateSlide(i, "description", e.target.value)} rows={3} className="text-sm" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <IconPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={handleIconSelect} />

      {/* Live preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <WelcomeTour
              onComplete={() => setPreviewOpen(false)}
              brandName={brand?.name}
              customSlides={slides}
            />
          </div>
        </div>
      )}
    </div>
  );
}
