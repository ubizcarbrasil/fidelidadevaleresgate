import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ExternalLink, FileText, ChevronUp, ChevronDown } from "lucide-react";

export interface ProfileMenuItem {
  id: string;
  label: string;
  type: "link" | "text" | "link_text";
  url: string;
  text_content: string;
  icon_name: string;
  is_visible: boolean;
}

const DEFAULT_ITEMS: ProfileMenuItem[] = [
  {
    id: "privacy",
    label: "Privacidade e Segurança",
    type: "link" as const,
    url: "",
    text_content: "",
    icon_name: "Shield",
    is_visible: true,
  },
  {
    id: "help",
    label: "Ajuda e Suporte",
    type: "link" as const,
    url: "",
    text_content: "",
    icon_name: "CircleHelp",
    is_visible: true,
  },
];

function generateId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProfileLinksConfigPage() {
  const { brand } = useBrand();
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  const settings = (brand?.brand_settings_json as any) || {};
  const savedItems: ProfileMenuItem[] = settings.profile_menu_links || DEFAULT_ITEMS;

  const [items, setItems] = useState<ProfileMenuItem[]>(savedItems);

  const saveMutation = useMutation({
    mutationFn: async (newItems: ProfileMenuItem[]) => {
      const updated = { ...settings, profile_menu_links: newItems };
      const { error } = await supabase
        .from("brands")
        .update({ brand_settings_json: updated })
        .eq("id", currentBrandId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand-detail"] });
      toast.success("Links do perfil salvos!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateItem = (idx: number, patch: Partial<ProfileMenuItem>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        label: "Novo item",
        type: "link",
        url: "",
        text_content: "",
        icon_name: "Link",
        is_visible: true,
      },
    ]);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader
        title="Links do Perfil"
        description="Configure os itens de menu exibidos na tela de perfil do app do cliente (ex: Privacidade, Ajuda, links externos)."
      />

      <div className="space-y-4">
        {items.map((item, idx) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardTitle className="text-sm flex-1">{item.label || "Sem título"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Visível</Label>
                  <Switch checked={item.is_visible} onCheckedChange={(v) => updateItem(idx, { is_visible: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Título do menu</Label>
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                    placeholder="Ex: Política de Privacidade"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Tipo</Label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(idx, { type: e.target.value as any })}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="link">Apenas Link</option>
                    <option value="text">Apenas Texto</option>
                    <option value="link_text">Link + Texto</option>
                  </select>
                </div>
              </div>

              {(item.type === "link" || item.type === "link_text") && (
                <div>
                  <Label className="text-xs mb-1 block flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> URL de destino
                  </Label>
                  <Input
                    value={item.url}
                    onChange={(e) => updateItem(idx, { url: e.target.value })}
                    placeholder="https://exemplo.com/privacidade"
                    className="h-9"
                  />
                </div>
              )}

              {(item.type === "text" || item.type === "link_text") && (
                <div>
                  <Label className="text-xs mb-1 block flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Conteúdo do texto
                  </Label>
                  <Textarea
                    value={item.text_content}
                    onChange={(e) => updateItem(idx, { text_content: e.target.value })}
                    placeholder="Texto exibido ao clicar no item..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label className="text-xs mb-1 block">Nome do ícone (Lucide)</Label>
                <Input
                  value={item.icon_name}
                  onChange={(e) => updateItem(idx, { icon_name: e.target.value })}
                  placeholder="Shield, HelpCircle, Link..."
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use nomes Lucide em PascalCase. Ex: Shield, CircleHelp, ExternalLink, FileText
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={addItem} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar item
        </Button>
        <Button onClick={() => saveMutation.mutate(items)} disabled={saveMutation.isPending} className="gap-2">
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
