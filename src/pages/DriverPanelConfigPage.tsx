import { useState, useEffect } from "react";
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
import { ExternalLink, Copy, Check, Car, Sparkles, Image, Minus, Plus, Trash2, GripVertical } from "lucide-react";
import { getPublicOrigin, buildDriverUrl } from "@/lib/publicShareUrl";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadField from "@/components/ImageUploadField";

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

export default function DriverPanelConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ image_url: "", title: "", link_url: "", after_category_id: "__top__" });

  const configuredBaseUrl = (brandSettings as any)?.driver_public_base_url as string | undefined;
  const effectiveOrigin = configuredBaseUrl || window.location.origin;
  const driverUrl = buildDriverUrl(effectiveOrigin, currentBrandId || "");

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

  const showBanners = brandSettings?.driver_show_banners !== false;
  const categoryLayout: Record<string, CategoryLayout> = brandSettings?.driver_category_layout || {};
  const interstitialBanners: DriverBannerItem[] = brandSettings?.driver_interstitial_banners || [];

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
  const getOrder = (catId: string, fallback: number) => categoryLayout[catId]?.order ?? fallback;

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
    <div className="space-y-6">
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
            <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm truncate">{driverUrl}</code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={() => window.open(driverUrl, "_blank")}
            disabled={!currentBrandId}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Painel do Motorista
          </Button>
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
              <div className="flex items-start gap-3">
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="h-16 w-28 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">{banner.title || "Sem título"}</p>
                  <p className="text-xs text-muted-foreground">
                    Após: {getCategoryName(banner.after_category_id)}
                  </p>
                  <Select
                    value={banner.after_category_id}
                    onValueChange={(v) => updateBannerPosition(banner.id, v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-48">
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
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px]">
                        {cat.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Switch
                        checked={cat.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: cat.id, is_active: checked })}
                      />
                    </div>
                  </div>

                  {cat.is_active && (
                    <div className="flex items-center gap-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Linhas:</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={getRows(cat.id) <= 1}
                            onClick={() => updateCategoryLayout(cat.id, "rows", Math.max(1, getRows(cat.id) - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{getRows(cat.id)}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={getRows(cat.id) >= 5}
                            onClick={() => updateCategoryLayout(cat.id, "rows", Math.min(5, getRows(cat.id) + 1))}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Ordem:</span>
                        <Input
                          type="number"
                          min={0}
                          max={99}
                          className="h-7 w-14 text-center text-sm"
                          value={getOrder(cat.id, cat.order_index)}
                          onChange={(e) => updateCategoryLayout(cat.id, "order", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
