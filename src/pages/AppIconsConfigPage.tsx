import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { icons } from "lucide-react";
import { toast } from "sonner";
import IconPickerDialog from "@/components/IconPickerDialog";
import type { AppIconKey } from "@/hooks/useAppIcons";

interface IconSlot {
  key: AppIconKey;
  label: string;
  defaultIcon: string;
}

const NAV_SLOTS: IconSlot[] = [
  { key: "nav_home", label: "Início", defaultIcon: "Home" },
  { key: "nav_offers", label: "Ofertas", defaultIcon: "Tag" },
  { key: "nav_redemptions", label: "Meus Resgates", defaultIcon: "Ticket" },
  { key: "nav_wallet", label: "Carteira", defaultIcon: "Wallet" },
  { key: "nav_profile", label: "Perfil", defaultIcon: "UserCircle" },
];

const QUICK_SLOTS: IconSlot[] = [
  { key: "quick_ofertas", label: "Ofertas", defaultIcon: "Tag" },
  { key: "quick_cupons", label: "Cupons", defaultIcon: "Percent" },
  { key: "quick_parceiros", label: "Parceiros", defaultIcon: "Store" },
  { key: "quick_pontos", label: "Pontos", defaultIcon: "Coins" },
  { key: "quick_presentes", label: "Presentes", defaultIcon: "Gift" },
  { key: "quick_achadinhos", label: "Achadinhos", defaultIcon: "Sparkles" },
];

const HEADER_SLOTS: IconSlot[] = [
  { key: "header_bell", label: "Notificações", defaultIcon: "Bell" },
  { key: "header_search", label: "Busca", defaultIcon: "Search" },
  { key: "header_wallet", label: "Carteira", defaultIcon: "Wallet" },
];

const SECTION_SLOTS: IconSlot[] = [
  { key: "section_stores", label: "Lojas / Parceiros", defaultIcon: "Store" },
  { key: "section_foryou", label: "Para Você", defaultIcon: "Sparkles" },
  { key: "section_deals", label: "Achadinhos / Deals", defaultIcon: "TrendingDown" },
];

const PROFILE_SLOTS: IconSlot[] = [
  { key: "profile_user", label: "Avatar / Usuário", defaultIcon: "User" },
  { key: "profile_branch", label: "Filial", defaultIcon: "MapPin" },
  { key: "profile_privacy", label: "Privacidade", defaultIcon: "Shield" },
  { key: "profile_help", label: "Ajuda", defaultIcon: "HelpCircle" },
  { key: "profile_logout", label: "Sair", defaultIcon: "LogOut" },
];

const WALLET_SLOTS: IconSlot[] = [
  { key: "wallet_points", label: "Pontos", defaultIcon: "Star" },
  { key: "wallet_credit", label: "Crédito", defaultIcon: "ArrowUpRight" },
  { key: "wallet_debit", label: "Débito", defaultIcon: "ArrowDownRight" },
];

export default function AppIconsConfigPage() {
  const { brand } = useBrand();
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AppIconKey | null>(null);

  const settings = (brand?.brand_settings_json as any) || {};
  const appIcons: Record<string, any> = settings.app_icons || {};

  const saveMutation = useMutation({
    mutationFn: async (newIcons: Record<string, any>) => {
      const updated = { ...settings, app_icons: newIcons };
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: updated })
        .eq("id", currentBrandId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand-detail"] });
      toast.success("Ícones atualizados!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSelect = (icon: { type: "lucide"; name: string } | { type: "custom"; url: string; name: string }) => {
    if (!editingKey) return;
    const newIcons = { ...appIcons };
    if (icon.type === "lucide") {
      newIcons[editingKey] = { type: "lucide", name: icon.name };
    } else {
      newIcons[editingKey] = { type: "custom", name: icon.name, url: icon.url };
    }
    saveMutation.mutate(newIcons);
  };

  const handleReset = (key: AppIconKey) => {
    const newIcons = { ...appIcons };
    delete newIcons[key];
    saveMutation.mutate(newIcons);
  };

  const renderSlot = (slot: IconSlot) => {
    const config = appIcons[slot.key];
    const isCustomized = !!config;

    let iconPreview: React.ReactNode = null;
    if (config?.type === "custom" && config.url) {
      iconPreview = <img src={config.url} alt={config.name} className="h-8 w-8 object-contain" />;
    } else {
      const iconName = config?.name || slot.defaultIcon;
      const Icon = icons[iconName as keyof typeof icons];
      iconPreview = Icon ? <Icon className="h-8 w-8 text-foreground" /> : null;
    }

    return (
      <div
        key={slot.key}
        className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
      >
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
          {iconPreview}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{slot.label}</p>
          <p className="text-xs text-muted-foreground truncate">
            {isCustomized ? (
              <Badge variant="secondary" className="text-[10px]">Personalizado</Badge>
            ) : (
              <span>Padrão: {slot.defaultIcon}</span>
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingKey(slot.key); setPickerOpen(true); }}
          >
            Trocar
          </Button>
          {isCustomized && (
            <Button variant="ghost" size="sm" onClick={() => handleReset(slot.key)}>
              Resetar
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ícones do Aplicativo"
        description="Personalize os ícones exibidos na barra de navegação, menu rápido e categorias do aplicativo do cliente."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🧭 Barra de Navegação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {NAV_SLOTS.map(renderSlot)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">⚡ Menu Rápido (Home)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {QUICK_SLOTS.map(renderSlot)}
        </CardContent>
      </Card>

      <IconPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        brandId={currentBrandId}
      />
    </div>
  );
}
