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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Calendar, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ImageUploadField from "@/components/ImageUploadField";

function getBannerStatus(banner: any): { label: string; variant: "default" | "secondary" | "destructive" } {
  const now = new Date();
  const start = new Date(banner.start_at);
  const end = banner.end_at ? new Date(banner.end_at) : null;
  if (!banner.is_active) return { label: "INATIVO", variant: "secondary" };
  if (start > now) return { label: "AGENDADO", variant: "default" };
  if (end && end < now) return { label: "EXPIRADO", variant: "destructive" };
  return { label: "ATIVO", variant: "default" };
}

export default function BannerManagerPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    image_url: "",
    title: "",
    link_url: "",
    link_type: "external",
    start_at: "",
    end_at: "",
    is_active: true,
  });

  const { data: banners } = useQuery({
    queryKey: ["banner-schedules", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("banner_schedules")
        .select("*")
        .eq("brand_id", currentBrandId)
        .order("order_index");
      return data || [];
    },
    enabled: !!currentBrandId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("banner_schedules").insert({
        brand_id: currentBrandId!,
        image_url: form.image_url,
        title: form.title || null,
        link_url: form.link_url || null,
        link_type: form.link_type,
        start_at: form.start_at || new Date().toISOString(),
        end_at: form.end_at || null,
        is_active: form.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-schedules"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Banner criado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banner_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-schedules"] });
      toast.success("Banner removido.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("banner_schedules").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banner-schedules"] }),
  });

  const resetForm = () =>
    setForm({ image_url: "", title: "", link_url: "", link_type: "external", start_at: "", end_at: "", is_active: true });

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Central de Banners"
        description="Gerencie banners com agendamento de exibição. Defina datas de início e fim, vincule a seções ou ofertas, e acompanhe o status (Agendado, Ativo, Expirado)."
      />

      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners?.map((banner) => {
          const status = getBannerStatus(banner);
          return (
            <Card key={banner.id} className="overflow-hidden group">
              <div className="relative aspect-[21/9] bg-muted">
                {banner.image_url && (
                  <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{banner.title || "Sem título"}</span>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: banner.id, active: v })}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(banner.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(banner.start_at), "dd/MM/yyyy")}
                    {banner.end_at && ` → ${format(new Date(banner.end_at), "dd/MM/yyyy")}`}
                  </span>
                </div>
                {banner.link_url && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{banner.link_url}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Imagem do Banner</Label>
              <ImageUploadField
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder={`banners/${currentBrandId}`}
                aspectRatio={21 / 9}
              />
            </div>
            <div>
              <Label>Título (opcional)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Tipo de Link</Label>
              <Select value={form.link_type} onValueChange={(v) => setForm({ ...form, link_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">Link Externo</SelectItem>
                  <SelectItem value="internal">Rota Interna</SelectItem>
                  <SelectItem value="offer">Oferta</SelectItem>
                  <SelectItem value="store">Loja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL / Rota</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://... ou /rota" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <Label>Fim (opcional)</Label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.image_url || createMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
