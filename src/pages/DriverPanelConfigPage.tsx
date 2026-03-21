import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Check, Car, Sparkles, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function DriverPanelConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const driverUrl = `${window.location.origin}/driver?brandId=${currentBrandId || ""}`;

  // Fetch brand settings for banner toggle
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

  const bannerToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const updated = { ...brandSettings, driver_show_banners: enabled };
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
              onCheckedChange={(checked) => bannerToggleMutation.mutate(checked)}
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
          <CardDescription>Ative ou desative categorias de achadinhos que aparecem no marketplace do motorista.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !categories?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada. Crie categorias em Achadinhos primeiro.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-lg border p-3">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
