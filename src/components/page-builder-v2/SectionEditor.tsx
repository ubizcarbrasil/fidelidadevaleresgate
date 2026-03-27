import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface SectionRow {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  display_mode: string;
  filter_mode: string;
  columns_count: number;
  rows_count: number;
  min_stores_visible: number;
  max_stores_visible: number | null;
  icon_size: string;
  banner_height: string;
  coupon_type_filter: string | null;
  visual_json: any;
  section_templates?: { key: string; name: string; type: string };
}

interface Props {
  section: SectionRow;
  onBack: () => void;
}

export default function SectionEditor({ section, onBack }: Props) {
  const [form, setForm] = useState({
    title: section.title || "",
    subtitle: section.subtitle || "",
    cta_text: section.cta_text || "",
    display_mode: section.display_mode || "carousel",
    filter_mode: section.filter_mode || "recent",
    columns_count: section.columns_count || 2,
    rows_count: section.rows_count || 1,
    min_stores_visible: section.min_stores_visible || 1,
    max_stores_visible: section.max_stores_visible || 20,
    icon_size: section.icon_size || "medium",
    banner_height: section.banner_height || "medium",
    coupon_type_filter: section.coupon_type_filter || "all",
    card_radius: section.visual_json?.card_radius ?? 16,
    card_shadow: section.visual_json?.card_shadow ?? true,
    audience: (section as any).audience || "all",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("brand_sections").update({
      title: form.title || null,
      subtitle: form.subtitle || null,
      cta_text: form.cta_text || null,
      display_mode: form.display_mode,
      filter_mode: form.filter_mode,
      columns_count: form.columns_count,
      rows_count: form.rows_count,
      min_stores_visible: form.min_stores_visible,
      max_stores_visible: form.max_stores_visible || null,
      icon_size: form.icon_size,
      banner_height: form.banner_height,
      coupon_type_filter: form.coupon_type_filter === "all" ? null : form.coupon_type_filter,
      audience: form.audience,
      visual_json: {
        card_radius: form.card_radius,
        card_shadow: form.card_shadow,
      },
    }).eq("id", section.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessão salva!" });
    }
    setSaving(false);
  };

  const templateKey = section.section_templates?.key || "";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Configurar Sessão</h1>
          <p className="text-xs text-muted-foreground font-mono">{templateKey}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Audience */}
        <div className="rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm">👥 Audiência</h3>
          <div>
            <Label>Quem pode ver esta seção?</Label>
            <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="driver_only">🚗 Apenas Motoristas</SelectItem>
                <SelectItem value="customer_only">👤 Apenas Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Identity */}
        <div className="rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm">📝 Identidade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Ofertas Imperdíveis" />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <div>
            <Label>Texto do CTA (botão "ver mais")</Label>
            <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="Ex: Abrir todas" />
          </div>
        </div>

        {/* Layout */}
        <div className="rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm">📐 Layout e Exposição</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Modo de exibição</Label>
              <Select value={form.display_mode} onValueChange={v => setForm(f => ({ ...f, display_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                  <SelectItem value="grid">Grade</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamanho do ícone</Label>
              <Select value={form.icon_size} onValueChange={v => setForm(f => ({ ...f, icon_size: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Colunas</Label>
              <Input type="number" min={1} max={6} value={form.columns_count} onChange={e => setForm(f => ({ ...f, columns_count: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Linhas</Label>
              <Input type="number" min={1} max={5} value={form.rows_count} onChange={e => setForm(f => ({ ...f, rows_count: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Mín. itens visíveis</Label>
              <Input type="number" min={0} max={20} value={form.min_stores_visible} onChange={e => setForm(f => ({ ...f, min_stores_visible: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label>Máx. itens exibidos</Label>
            <Input type="number" min={1} max={100} value={form.max_stores_visible ?? ""} onChange={e => setForm(f => ({ ...f, max_stores_visible: Number(e.target.value) || 20 }))} />
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm">🔍 Filtros</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Modo do filtro</Label>
              <Select value={form.filter_mode} onValueChange={v => setForm(f => ({ ...f, filter_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="most_redeemed">Mais resgatados</SelectItem>
                  <SelectItem value="newest">Novos (últimos 14 dias)</SelectItem>
                  <SelectItem value="random">Aleatório (semente diária)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de cupom</Label>
              <Select value={form.coupon_type_filter} onValueChange={v => setForm(f => ({ ...f, coupon_type_filter: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="STORE">Loja</SelectItem>
                  <SelectItem value="PRODUCT">Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm">🎨 Estilo dos Cards</h3>
          <div>
            <Label>Raio da borda: {form.card_radius}px</Label>
            <Slider value={[form.card_radius]} onValueChange={([v]) => setForm(f => ({ ...f, card_radius: v }))} min={0} max={32} step={2} className="mt-2" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Sombra</Label>
            <Switch checked={form.card_shadow} onCheckedChange={v => setForm(f => ({ ...f, card_shadow: v }))} />
          </div>
          <div>
            <Label>Altura do banner</Label>
            <Select value={form.banner_height} onValueChange={v => setForm(f => ({ ...f, banner_height: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
