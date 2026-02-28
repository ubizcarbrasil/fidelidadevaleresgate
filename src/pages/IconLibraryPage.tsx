import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { icons } from "lucide-react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageUploadField from "@/components/ImageUploadField";

const CATEGORIES = ["geral", "ações", "categorias", "social", "navegação", "status"];

export default function IconLibraryPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "geral",
    icon_type: "lucide" as "lucide" | "custom",
    lucide_name: "",
    image_url: "",
    color: "",
  });

  const { data: iconList, isLoading } = useQuery({
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
      const payload: any = {
        name: form.name,
        category: form.category,
        icon_type: form.icon_type,
        color: form.color || null,
      };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icon-library"] });
      toast.success("Ícone removido.");
    },
  });

  const filtered = iconList?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderIcon = (item: any) => {
    if (item.icon_type === "lucide" && item.lucide_name) {
      const Icon = icons[item.lucide_name as keyof typeof icons];
      return Icon ? <Icon className="h-8 w-8" style={{ color: item.color || undefined }} /> : null;
    }
    if (item.image_url) {
      return <img src={item.image_url} alt={item.name} className="h-8 w-8 object-contain" />;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Galeria de Ícones"
        description="Gerencie os ícones disponíveis para uso nas seções, menus e páginas. Você pode usar ícones nativos (Lucide) ou enviar ícones personalizados."
      />

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
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Ícone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
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
              <div>
                <Label>Nome do ícone Lucide</Label>
                <Input value={form.lucide_name} onChange={(e) => setForm({ ...form, lucide_name: e.target.value })} placeholder="Ex: ShoppingBag" />
              </div>
            ) : (
              <div>
                <Label>Imagem</Label>
                <ImageUploadField
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder={`icons/${currentBrandId || "global"}`}
                  aspectRatio={1}
                />
              </div>
            )}
            <div>
              <Label>Cor (opcional)</Label>
              <Input type="color" value={form.color || "#000000"} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
