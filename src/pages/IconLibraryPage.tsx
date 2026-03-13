import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBrand } from "@/contexts/BrandContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { icons } from "lucide-react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageUploadField from "@/components/ImageUploadField";
import IconPickerDialog from "@/components/IconPickerDialog";
import type { AppIconKey } from "@/hooks/useAppIcons";

/* ─── Gallery tab constants ─── */
const CATEGORIES = ["geral", "ações", "categorias", "social", "navegação", "status"];

/* ─── App Icons tab slot definitions ─── */
interface IconSlot { key: AppIconKey; label: string; defaultIcon: string }

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

/* ═══════════════════════════════════════════════════════════════ */

export default function IconLibraryPage() {
  const { currentBrandId } = useBrandGuard();
  const { brand } = useBrand();
  const queryClient = useQueryClient();

  /* ─── Gallery state ─── */
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "geral", icon_type: "lucide" as "lucide" | "custom",
    lucide_name: "", image_url: "", color: "",
  });

  /* ─── App Icons state ─── */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AppIconKey | null>(null);

  /* ─── Gallery queries ─── */
  const { data: iconList } = useQuery({
    queryKey: ["icon-library", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("icon_library").select("*").eq("is_active", true);
      if (currentBrandId) q = q.or(`brand_id.eq.${currentBrandId},brand_id.is.null`);
      const { data } = await q.order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, category: form.category, icon_type: form.icon_type, color: form.color || null };
      if (currentBrandId) payload.brand_id = currentBrandId;
      if (form.icon_type === "lucide") payload.lucide_name = form.lucide_name;
      else payload.image_url = form.image_url;
      const { error } = await supabase.from("icon_library").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icon-library"] });
      setDialogOpen(false);
      setForm({ name: "", category: "geral", icon_type: "lucide", lucide_name: "", image_url: "", color: "" });
      toast.success("Ícone adicionado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("icon_library").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["icon-library"] }); toast.success("Ícone removido."); },
  });

  const filtered = iconList?.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const renderIcon = (item: any) => {
    if (item.icon_type === "lucide" && item.lucide_name) {
      const Icon = icons[item.lucide_name as keyof typeof icons];
      return Icon ? <Icon className="h-8 w-8" style={{ color: item.color || undefined }} /> : null;
    }
    if (item.image_url) return <img src={item.image_url} alt={item.name} className="h-8 w-8 object-contain" />;
    return null;
  };

  /* ─── App Icons logic ─── */
  const settings = (brand?.brand_settings_json as any) || {};
  const appIcons: Record<string, any> = settings.app_icons || {};

  const saveMutation = useMutation({
    mutationFn: async (newIcons: Record<string, any>) => {
      const updated = { ...settings, app_icons: newIcons };
      const { error } = await supabase.from("brands").update({ brand_settings_json: updated }).eq("id", currentBrandId!);
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
    if (icon.type === "lucide") newIcons[editingKey] = { type: "lucide", name: icon.name };
    else newIcons[editingKey] = { type: "custom", name: icon.name, url: icon.url };
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
      <div key={slot.key} className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">{iconPreview}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{slot.label}</p>
          <p className="text-xs text-muted-foreground truncate">
            {isCustomized ? <Badge variant="secondary" className="text-[10px]">Personalizado</Badge> : <span>Padrão: {slot.defaultIcon}</span>}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setEditingKey(slot.key); setPickerOpen(true); }}>Trocar</Button>
          {isCustomized && <Button variant="ghost" size="sm" onClick={() => handleReset(slot.key)}>Resetar</Button>}
        </div>
      </div>
    );
  };

  const slotGroups = [
    { emoji: "🧭", title: "Barra de Navegação", slots: NAV_SLOTS },
    { emoji: "⚡", title: "Menu Rápido (Home)", slots: QUICK_SLOTS },
    { emoji: "📱", title: "Cabeçalho", slots: HEADER_SLOTS },
    { emoji: "📦", title: "Seções", slots: SECTION_SLOTS },
    { emoji: "👤", title: "Perfil", slots: PROFILE_SLOTS },
    { emoji: "💰", title: "Carteira", slots: WALLET_SLOTS },
  ];

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Ícones"
        description="Gerencie a galeria de ícones e personalize os ícones exibidos no aplicativo."
      />

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="app-icons">Ícones do App</TabsTrigger>
        </TabsList>

        {/* ─── Galeria tab ─── */}
        <TabsContent value="gallery" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ícone..." className="pl-9" />
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Ícone
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered?.map((item) => (
              <Card key={item.id} className="group relative">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  {renderIcon(item)}
                  <span className="text-xs font-medium text-center truncate w-full">{item.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* New icon dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Ícone</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.icon_type} onValueChange={(v: any) => setForm({ ...form, icon_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lucide">Nativo (Lucide)</SelectItem>
                      <SelectItem value="custom">Personalizado (Upload)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.icon_type === "lucide" ? (
                  <div><Label>Nome do ícone Lucide</Label><Input value={form.lucide_name} onChange={(e) => setForm({ ...form, lucide_name: e.target.value })} placeholder="Ex: ShoppingBag" /></div>
                ) : (
                  <div><Label>Imagem</Label><ImageUploadField value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder={`icons/${currentBrandId || "global"}`} aspectRatio={1} /></div>
                )}
                <div><Label>Cor (opcional)</Label><Input type="color" value={form.color || "#000000"} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── App Icons tab ─── */}
        <TabsContent value="app-icons" className="space-y-6">
          {slotGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader><CardTitle className="text-base">{group.emoji} {group.title}</CardTitle></CardHeader>
              <CardContent className="space-y-2">{group.slots.map(renderSlot)}</CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <IconPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} brandId={currentBrandId!} />
    </div>
  );
}
