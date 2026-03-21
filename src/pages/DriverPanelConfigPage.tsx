import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, Copy, Check, Car, Sparkles, Image, Minus, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryLayout {
  rows: number;
  order: number;
}

export default function DriverPanelConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const driverUrl = `${window.location.origin}/driver?brandId=${currentBrandId || ""}`;

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

      {/* Banner toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5 text-primary" />
            Banners
          </CardTitle>
          <CardDescription>Exiba banners promocionais no topo do marketplace do motorista.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <span className="font-medium text-sm">Exibir banners</span>
              <p className="text-xs text-muted-foreground">Mostra os mesmos banners configurados na plataforma</p>
            </div>
            <Switch
              checked={showBanners}
              onCheckedChange={(checked) => settingsMutation.mutate({ driver_show_banners: checked })}
            />
          </div>
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
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-lg border p-3 space-y-3">
                  {/* Row 1: Name + Toggle */}
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

                  {/* Row 2: Rows + Order controls */}
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
