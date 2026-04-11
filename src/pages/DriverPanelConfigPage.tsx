import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExternalLink, Copy, Check, Car, Sparkles, Image, Minus, Plus, Trash2, GripVertical, Video, Gift } from "lucide-react";
import { buildDriverUrl } from "@/lib/publicShareUrl";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadField from "@/components/ImageUploadField";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryLayout {
  rows: number;
  order: number;
}

interface DriverBannerItem {
  id: string;
  image_url: string;
  title: string;
  link_url: string;
  after_category_id: string; // "__top__" or category id
  is_active: boolean;
}
interface SortableCategoryItemProps {
  cat: { id: string; name: string; color: string; is_active: boolean };
  rows: number;
  onToggle: (checked: boolean) => void;
  onRowsChange: (rows: number) => void;
}

function SortableCategoryItem({ cat, rows, onToggle, onRowsChange }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border p-3 space-y-3 bg-background">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground flex-shrink-0">
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="font-medium text-sm truncate">{cat.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px] hidden sm:inline-flex">
            {cat.is_active ? "Ativa" : "Inativa"}
          </Badge>
          <Switch checked={cat.is_active} onCheckedChange={onToggle} />
        </div>
      </div>

      {cat.is_active && (
        <div className="flex items-center gap-2 pl-6 sm:pl-8">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Linhas:</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={rows <= 1} onClick={() => onRowsChange(Math.max(1, rows - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-6 text-center">{rows}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={rows >= 5} onClick={() => onRowsChange(Math.min(5, rows + 1))}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriverPanelConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ image_url: "", title: "", link_url: "", after_category_id: "__top__" });
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: "", description: "", video_url: "" });

  const { data: brandSettings } = useQuery({
    queryKey: ["brand-settings-driver", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId!)
        .single();
      if (error) throw error;
      return (data?.brand_settings_json as any) || {};
    },
    enabled: !!currentBrandId,
  });

  const configuredBaseUrl = brandSettings?.driver_public_base_url as string | undefined;
  const effectiveOrigin = configuredBaseUrl || window.location.origin;
  const driverUrl = buildDriverUrl(effectiveOrigin, currentBrandId || "");

  const showBanners = brandSettings?.driver_show_banners !== false;
  const categoryLayout: Record<string, CategoryLayout> = brandSettings?.driver_category_layout || {};
  const interstitialBanners: DriverBannerItem[] = brandSettings?.driver_interstitial_banners || [];
  const driverRedeemRows = brandSettings?.driver_redeem_rows ?? 1;
  const driverInfoVideos: Array<{ id: string; title: string; description: string; video_url: string }> = brandSettings?.driver_info_videos || [];
  const settingsMutation = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const updated = { ...brandSettings, ...patch };
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: updated })
        .eq("id", currentBrandId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-settings-driver", currentBrandId] });
      toast({ title: "Configuração atualizada" });
    },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["affiliate-categories-driver", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color, is_active, order_index")
        .eq("brand_id", currentBrandId!)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("affiliate_deal_categories")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-categories-driver", currentBrandId] });
      toast({ title: "Categoria atualizada" });
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(driverUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const updateCategoryLayout = (catId: string, field: "rows" | "order", value: number) => {
    const current = categoryLayout[catId] || { rows: 1, order: 0 };
    const updated = {
      ...categoryLayout,
      [catId]: { ...current, [field]: value },
    };
    settingsMutation.mutate({ driver_category_layout: updated });
  };

  const getRows = (catId: string) => categoryLayout[catId]?.rows ?? 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => {
      const oa = categoryLayout[a.id]?.order ?? a.order_index;
      const ob = categoryLayout[b.id]?.order ?? b.order_index;
      return oa - ob;
    });
  }, [categories, categoryLayout]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedCategories.findIndex(c => c.id === active.id);
    const newIndex = sortedCategories.findIndex(c => c.id === over.id);
    const reordered = arrayMove(sortedCategories, oldIndex, newIndex);
    const updatedLayout = { ...categoryLayout };
    reordered.forEach((cat, index) => {
      updatedLayout[cat.id] = { ...(updatedLayout[cat.id] || { rows: 1 }), order: index };
    });
    settingsMutation.mutate({ driver_category_layout: updatedLayout });
  };

  // Banner management
  const addBanner = () => {
    if (!newBanner.image_url) {
      toast({ title: "Adicione uma imagem", variant: "destructive" });
      return;
    }
    const banner: DriverBannerItem = {
      id: crypto.randomUUID(),
      image_url: newBanner.image_url,
      title: newBanner.title,
      link_url: newBanner.link_url,
      after_category_id: newBanner.after_category_id,
      is_active: true,
    };
    settingsMutation.mutate({ driver_interstitial_banners: [...interstitialBanners, banner] });
    setNewBanner({ image_url: "", title: "", link_url: "", after_category_id: "__top__" });
    setBannerDialogOpen(false);
  };

  const removeBanner = (id: string) => {
    settingsMutation.mutate({ driver_interstitial_banners: interstitialBanners.filter(b => b.id !== id) });
  };

  const toggleBanner = (id: string, is_active: boolean) => {
    settingsMutation.mutate({
      driver_interstitial_banners: interstitialBanners.map(b => b.id === id ? { ...b, is_active } : b),
    });
  };

  const updateBannerPosition = (id: string, after_category_id: string) => {
    settingsMutation.mutate({
      driver_interstitial_banners: interstitialBanners.map(b => b.id === id ? { ...b, after_category_id } : b),
    });
  };

  const getCategoryName = (id: string) => {
    if (id === "__top__") return "Topo (antes das categorias)";
    return categories?.find(c => c.id === id)?.name || "Desconhecida";
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      <PageHeader title="Painel do Motorista" description="Configure o marketplace de achadinhos que os motoristas visualizam" />

      {/* Link de acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Link de Acesso
          </CardTitle>
          <CardDescription>Compartilhe este link com os motoristas. Não exige login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-muted px-2 sm:px-3 py-2 text-xs sm:text-sm truncate min-w-0">{driverUrl}</code>
            <Button variant="outline" size="icon" className="flex-shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={() => { window.location.href = driverUrl; }}
            disabled={!currentBrandId}
            className="gap-2 w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Painel do Motorista
          </Button>
        </CardContent>
      </Card>

      {/* URL pública oficial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ExternalLink className="h-5 w-5 text-primary" />
            URL Pública Oficial
          </CardTitle>
          <CardDescription>
            Defina a URL base usada nos links compartilhados. Se vazio, usa o domínio atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">URL base</label>
            <Input
              key={brandSettings?.driver_public_base_url ?? "__empty__"}
              defaultValue={brandSettings?.driver_public_base_url || ""}
              placeholder={window.location.origin}
              onBlur={(e) => {
                let val = e.target.value.trim().replace(/\/+$/, "");
                if (val !== (brandSettings?.driver_public_base_url || "")) {
                  settingsMutation.mutate({ driver_public_base_url: val || null });
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: https://fidelidadevaleresgate.lovable.app
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Título e subtítulo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Título do Marketplace</CardTitle>
          <CardDescription>Personalize o título e subtítulo exibidos no topo da tela do motorista.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              defaultValue={brandSettings?.driver_marketplace_title || ""}
              placeholder="Marketplace"
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val !== (brandSettings?.driver_marketplace_title || "")) {
                  settingsMutation.mutate({ driver_marketplace_title: val || null });
                }
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Subtítulo</label>
            <Input
              defaultValue={brandSettings?.driver_marketplace_subtitle || ""}
              placeholder="Ofertas exclusivas para motoristas parceiros"
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val !== (brandSettings?.driver_marketplace_subtitle || "")) {
                  settingsMutation.mutate({ driver_marketplace_subtitle: val || null });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Banner toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5 text-primary" />
            Banners do Topo
          </CardTitle>
          <CardDescription>Exiba banners promocionais no topo do marketplace do motorista.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <span className="font-medium text-sm">Exibir banners do topo</span>
              <p className="text-xs text-muted-foreground">Mostra os mesmos banners configurados na plataforma</p>
            </div>
            <Switch
              checked={showBanners}
              onCheckedChange={(checked) => settingsMutation.mutate({ driver_show_banners: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interstitial banners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GripVertical className="h-5 w-5 text-primary" />
            Banners entre Seções
          </CardTitle>
          <CardDescription>Insira banners promocionais entre as categorias de produtos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {interstitialBanners.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum banner entre seções configurado.</p>
          )}

          {interstitialBanners.map((banner) => (
            <div key={banner.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="h-24 w-full sm:h-16 sm:w-28 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{banner.title || "Sem título"}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) => toggleBanner(banner.id, checked)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBanner(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Após: {getCategoryName(banner.after_category_id)}
                  </p>
                  <Select
                    value={banner.after_category_id}
                    onValueChange={(v) => updateBannerPosition(banner.id, v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__top__">Topo</SelectItem>
                      {categories?.filter(c => c.is_active).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={() => setBannerDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Banner
          </Button>
        </CardContent>
      </Card>

      {/* Add banner dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Banner entre Seções</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUploadField
              value={newBanner.image_url}
              onChange={(url) => setNewBanner(prev => ({ ...prev, image_url: url }))}
              folder="driver-banners"
              label="Imagem do Banner"
              aspectRatio={21 / 9}
              aiContext="banner"
              previewClassName="h-32 w-full object-cover rounded-xl"
            />
            <div>
              <label className="text-sm font-medium">Título (opcional)</label>
              <Input
                value={newBanner.title}
                onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Promoção especial"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Link (opcional)</label>
              <Input
                value={newBanner.link_url}
                onChange={(e) => setNewBanner(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Posição</label>
              <Select
                value={newBanner.after_category_id}
                onValueChange={(v) => setNewBanner(prev => ({ ...prev, after_category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__top__">Topo (antes das categorias)</SelectItem>
                  {categories?.filter(c => c.is_active).map(c => (
                    <SelectItem key={c.id} value={c.id}>Após: {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>Cancelar</Button>
            <Button onClick={addBanner} disabled={!newBanner.image_url}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PWA Icon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Identidade do App Instalável (PWA)
          </CardTitle>
          <CardDescription>
            Defina o ícone que aparecerá na tela inicial quando o motorista instalar o app. Recomendado: PNG quadrado 512×512.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadField
            value={(brandSettings?.theme as any)?.pwa_icon_url || ""}
            onChange={(url) => {
              const currentTheme = (brandSettings?.theme as any) || {};
              settingsMutation.mutate({ theme: { ...currentTheme, pwa_icon_url: url } });
            }}
            folder="pwa-icons"
            label="Ícone do App (PWA)"
            aspectRatio={1}
            previewClassName="h-24 w-24 rounded-2xl object-cover"
          />
          {(brandSettings?.theme as any)?.pwa_icon_url && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <img
                src={(brandSettings.theme as any).pwa_icon_url}
                alt="PWA Icon preview"
                className="h-12 w-12 rounded-xl object-cover"
              />
              <p className="text-xs text-muted-foreground">
                Este ícone será usado na tela inicial do dispositivo quando o motorista instalar o Achadinhos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Categorias Visíveis
          </CardTitle>
          <CardDescription>Configure ativação, linhas exibidas e ordem de cada categoria.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !categories?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada. Crie categorias em Achadinhos primeiro.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedCategories.map((cat) => (
                    <SortableCategoryItem
                      key={cat.id}
                      cat={cat}
                      rows={getRows(cat.id)}
                      onToggle={(checked) => toggleMutation.mutate({ id: cat.id, is_active: checked })}
                      onRowsChange={(rows) => updateCategoryLayout(cat.id, "rows", rows)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Linhas "Resgatar com Pontos" */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Linhas — Resgatar com Pontos
          </CardTitle>
          <CardDescription>Quantas linhas de produtos a seção "Resgatar com Pontos" exibe no marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Linhas:</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={driverRedeemRows <= 1} onClick={() => settingsMutation.mutate({ driver_redeem_rows: Math.max(1, driverRedeemRows - 1) })}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-bold w-8 text-center">{driverRedeemRows}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={driverRedeemRows >= 5} onClick={() => settingsMutation.mutate({ driver_redeem_rows: Math.min(5, driverRedeemRows + 1) })}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vídeos do Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            Vídeos — Como Funciona
          </CardTitle>
          <CardDescription>Adicione vídeos explicativos na tela "Como Funciona" do motorista.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {driverInfoVideos.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum vídeo configurado.</p>
          )}

          {driverInfoVideos.map((video) => (
            <div key={video.id} className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{video.title || "Sem título"}</p>
                  <p className="text-xs text-muted-foreground truncate">{video.video_url}</p>
                  {video.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{video.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive flex-shrink-0"
                  onClick={() => {
                    settingsMutation.mutate({
                      driver_info_videos: driverInfoVideos.filter(v => v.id !== video.id),
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={() => setVideoDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Vídeo
          </Button>
        </CardContent>
      </Card>

      {/* Add video dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newVideo.title}
                onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Como acumular pontos"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL do Vídeo</label>
              <Input
                value={newVideo.video_url}
                onChange={(e) => setNewVideo(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... ou link direto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={newVideo.description}
                onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição do vídeo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Cancelar</Button>
            <Button
              disabled={!newVideo.title || !newVideo.video_url}
              onClick={() => {
                const video = { id: crypto.randomUUID(), ...newVideo };
                settingsMutation.mutate({ driver_info_videos: [...driverInfoVideos, video] });
                setNewVideo({ title: "", description: "", video_url: "" });
                setVideoDialogOpen(false);
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
