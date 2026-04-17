import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { toast } from "sonner";
import {
  Blocks, Shield, Store, MapPin, Users, Tag, Ticket, PackageSearch,
  Sparkles, Coins, Settings2, Image, Layers, Bell, BarChart3, Palette,
  Type, FileSpreadsheet, Globe, TrendingUp, ClipboardList, Plug, Home,
} from "lucide-react";
import HomeSectionOrderEditor from "@/components/brand-modules/HomeSectionOrderEditor";
import SidebarOrderEditor from "@/components/brand-modules/SidebarOrderEditor";

const CATEGORY_META: Record<string, { label: string; emoji: string; description: string }> = {
  core:         { label: "Essencial",            emoji: "🔧", description: "Base da plataforma" },
  comercial:    { label: "Comercial",            emoji: "🏪", description: "Parceiros, ofertas e catálogo" },
  fidelidade:   { label: "Fidelidade & Pontos",  emoji: "⭐", description: "Programa de pontos e cashback" },
  visual:       { label: "Personalização",       emoji: "🎨", description: "Menus de aparência do painel" },
  visual_theme: { label: "Customização do Tema", emoji: "🖌️", description: "Seções do Editor de Tema" },
  governance:   { label: "Governança",           emoji: "🛡️", description: "Auditoria, permissões e acessos" },
  engajamento:  { label: "Engajamento",          emoji: "📣", description: "CRM, guias e comunicação" },
  dados:        { label: "Inteligência & Dados", emoji: "📊", description: "Relatórios e análise" },
  integracoes:  { label: "Integrações & API",    emoji: "🔌", description: "APIs e sistemas externos" },
  general:      { label: "Geral",                emoji: "📦", description: "Outros módulos" },
};

const MODULE_ICONS: Record<string, any> = {
  stores: Store,
  branches: MapPin,
  customers: Users,
  offers: Tag,
  vouchers: Ticket,
  catalog: PackageSearch,
  affiliate_deals: Sparkles,
  points: Coins,
  points_rules: Settings2,
  earn_points_store: Coins,
  banners: Image,
  custom_pages: Layers,
  notifications: Bell,
  home_sections: Layers,
  wallet: Coins,
  redemption_qr: BarChart3,
  brand_theme: Palette,
  page_builder: Layers,
  icon_library: Image,
  partner_landing: FileSpreadsheet,
  profile_links: FileSpreadsheet,
  offer_card_config: Tag,
  app_icons: Image,
  welcome_tour: Sparkles,
  theme_colors: Palette,
  theme_typography: Type,
  theme_images: Image,
  theme_texts: Type,
  theme_layout: Layers,
  theme_offer_cards: Tag,
  theme_integrations: Plug,
  users_management: Users,
  approvals: Shield,
  audit: ClipboardList,
  access_hub: Shield,
  store_permissions: Shield,
  crm: TrendingUp,
  guide_brand: Sparkles,
  guide_emitter: Sparkles,
  csv_import: FileSpreadsheet,
  ganha_ganha: Coins,
  domains: Globe,
  sponsored: Sparkles,
  machine_integration: Settings2,
  api_keys: Settings2,
  taxonomy: Settings2,
  driver_hub: Home,
};

export default function BrandModulesPage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const brandId = isRootAdmin ? (selectedBrandId || currentBrandId) : currentBrandId;

  const { data: allBrands } = useQuery({
    queryKey: ["brands-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: isRootAdmin,
  });

  const { data: definitions, isLoading: loadingDefs } = useQuery({
    queryKey: ["module-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("module_definitions").select("*").eq("is_active", true).order("category, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: brandModules, isLoading: loadingBM } = useQuery({
    queryKey: ["brand-modules", brandId],
    queryFn: async () => {
      const { data, error } = await supabase.from("brand_modules").select("*").eq("brand_id", brandId!);
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  const toggle = useMutation({
    mutationFn: async ({ defId, enabled }: { defId: string; enabled: boolean }) => {
      const existing = brandModules?.find(bm => bm.module_definition_id === defId);
      if (existing) {
        const { error } = await supabase.from("brand_modules").update({ is_enabled: enabled }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_modules").insert({
          brand_id: brandId!,
          module_definition_id: defId,
          is_enabled: enabled,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-modules", brandId] });
      qc.invalidateQueries({ queryKey: ["brand-modules-active", brandId] });
      // Fase 1: invalida o hook unificado (sem brandId = todas as combinações)
      qc.invalidateQueries({ queryKey: ["resolved-modules"] });
      toast.success("Módulo atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isLoading = loadingDefs || loadingBM;

  const isEnabled = (defId: string) => {
    const bm = brandModules?.find(m => m.module_definition_id === defId);
    return bm ? bm.is_enabled : false;
  };

  // Filter definitions: non-ROOT users only see modules allocated to their brand
  const visibleDefinitions = definitions?.filter(d => {
    if (isRootAdmin) return true;
    // Non-ROOT: show all customer-facing, non-core modules (even without brand_modules row)
    if (!(d as any).customer_facing) return false;
    if (d.is_core) return false;
    return true;
  });

  const grouped = visibleDefinitions?.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, typeof visibleDefinitions>) || {};

  // Sort categories: core first, then alphabetical
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "core") return -1;
    if (b === "core") return 1;
    return a.localeCompare(b);
  });

  const enabledCount = visibleDefinitions?.filter(d => isEnabled(d.id)).length || 0;
  const totalCount = visibleDefinitions?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl sm:text-2xl font-bold tracking-tight">Funcionalidades da Marca</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          {isRootAdmin ? "Funcionalidades da Marca" : "Funcionalidades do App"}
        </h2>
        <p className="text-muted-foreground">
          {isRootAdmin
            ? "Ative ou desative os módulos disponíveis para esta marca"
            : "Escolha quais funcionalidades seus clientes terão acesso no aplicativo"}
        </p>
      </div>

      {isRootAdmin && (
        <div className="max-w-xs">
          <Select value={selectedBrandId || ""} onValueChange={setSelectedBrandId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              {allBrands?.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!brandId && (
        <p className="text-muted-foreground text-sm">Selecione uma marca para gerenciar seus módulos.</p>
      )}

      {brandId && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <Blocks className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              <strong className="text-primary">{enabledCount}</strong> de {totalCount} módulos ativos
            </span>
          </div>

          <HomeSectionOrderEditor brandId={brandId} isModuleEnabled={(key) => {
            const def = definitions?.find(d => d.key === key);
            if (!def) return true;
            return isEnabled(def.id);
          }} />

          <SidebarOrderEditor brandId={brandId} />

          {sortedCategories.map((category) => {
            const mods = grouped[category]!;
            const meta = CATEGORY_META[category] || CATEGORY_META.general;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold">{meta.label}</h3>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {mods.map(def => {
                    const IconComp = MODULE_ICONS[def.key] || Blocks;
                    const enabled = isEnabled(def.id);
                    return (
                      <Card key={def.id} className={`transition-all ${enabled ? "border-primary/30 shadow-sm" : "opacity-60"}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${enabled ? "bg-primary/10" : "bg-muted"}`}>
                                <IconComp className={`h-4.5 w-4.5 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <CardTitle className="text-sm">{def.name}</CardTitle>
                            </div>
                            <Switch
                              checked={enabled}
                              onCheckedChange={v => toggle.mutate({ defId: def.id, enabled: v })}
                              disabled={def.is_core}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-xs">{def.description || "Sem descrição"}</CardDescription>
                          <div className="mt-2 flex gap-2">
                            {def.is_core && <Badge variant="secondary" className="text-[10px]">Essencial</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
