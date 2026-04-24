import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createConnector, updateConnector } from "@/lib/api/mirrorSync";
import type { SourceCatalogEntry } from "@/lib/api/mirrorSync";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  catalog: SourceCatalogEntry[];
  /** Quando preenchido, modo edição. */
  config?: any | null;
  /** Origem pré-selecionada no modo criação. */
  defaultSourceType?: string;
}

export default function ModalConector({ open, onClose, brandId, catalog, config, defaultSourceType }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!config;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    label: "",
    source_type: defaultSourceType || catalog[0]?.source_key || "divulgador_inteligente",
    origin_url: "",
    is_enabled: true,
    auto_sync_enabled: false,
    sync_interval_minutes: 60,
    max_pages: 5,
    max_offers_per_read: 100,
    timeout_seconds: 30,
    auto_activate: true,
    auto_visible_driver: true,
    extra_pages_text: "",
  });

  useEffect(() => {
    if (open) {
      if (config) {
        setForm({
          label: config.label || "",
          source_type: config.source_type,
          origin_url: config.origin_url || "",
          is_enabled: config.is_enabled ?? true,
          auto_sync_enabled: config.auto_sync_enabled ?? false,
          sync_interval_minutes: config.sync_interval_minutes ?? 60,
          max_pages: config.max_pages ?? 5,
          max_offers_per_read: config.max_offers_per_read ?? 100,
          timeout_seconds: config.timeout_seconds ?? 30,
          auto_activate: config.auto_activate ?? true,
          auto_visible_driver: config.auto_visible_driver ?? true,
          extra_pages_text: Array.isArray(config.extra_pages) ? config.extra_pages.join("\n") : "",
        });
      } else {
        setForm((p) => ({
          ...p,
          label: "",
          origin_url: "",
          source_type: defaultSourceType || catalog[0]?.source_key || "divulgador_inteligente",
        }));
      }
    }
  }, [open, config?.id]);

  const handleSave = async () => {
    if (!form.label.trim()) return toast.error("Informe um apelido para o conector.");
    if (!form.origin_url.trim()) return toast.error("Informe a URL da origem.");
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        label: form.label.trim(),
        origin_url: form.origin_url.trim(),
        is_enabled: form.is_enabled,
        auto_sync_enabled: form.auto_sync_enabled,
        sync_interval_minutes: form.sync_interval_minutes,
        max_pages: form.max_pages,
        max_offers_per_read: form.max_offers_per_read,
        timeout_seconds: form.timeout_seconds,
        auto_activate: form.auto_activate,
        auto_visible_driver: form.auto_visible_driver,
        extra_pages: form.extra_pages_text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      };
      if (isEdit) {
        await updateConnector(config.id, payload);
        toast.success("Conector atualizado");
      } else {
        await createConnector(brandId, form.source_type, payload);
        toast.success("Conector criado");
      }
      queryClient.invalidateQueries({ queryKey: ["all-mirror-configs", brandId] });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conector" : "Adicionar conector"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Apelido</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex: Grupo Promoções"
              />
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={form.source_type}
                onValueChange={(v) => setForm({ ...form, source_type: v })}
                disabled={isEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {catalog.map((c) => (
                    <SelectItem key={c.source_key} value={c.source_key}>{c.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL da origem</Label>
            <Input
              value={form.origin_url}
              onChange={(e) => setForm({ ...form, origin_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {form.source_type === "divulgador_inteligente" && (
            <div className="space-y-2">
              <Label>Sub-páginas para scrape (opcional)</Label>
              <Textarea
                rows={4}
                value={form.extra_pages_text}
                onChange={(e) => setForm({ ...form, extra_pages_text: e.target.value })}
                placeholder={"/promocoes-do-dia\n/lojas/shopee"}
              />
              <p className="text-xs text-muted-foreground">Uma URL ou path por linha.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Intervalo (min)</Label>
              <Input type="number" value={form.sync_interval_minutes}
                onChange={(e) => setForm({ ...form, sync_interval_minutes: parseInt(e.target.value) || 60 })} />
            </div>
            {form.source_type === "dvlinks" && (
              <div className="space-y-2">
                <Label>Máx. páginas</Label>
                <Input type="number" value={form.max_pages}
                  onChange={(e) => setForm({ ...form, max_pages: parseInt(e.target.value) || 5 })} />
              </div>
            )}
            {form.source_type === "divulgador_inteligente" && (
              <>
                <div className="space-y-2">
                  <Label>Max ofertas/leitura</Label>
                  <Input type="number" value={form.max_offers_per_read}
                    onChange={(e) => setForm({ ...form, max_offers_per_read: parseInt(e.target.value) || 100 })} />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (seg)</Label>
                  <Input type="number" value={form.timeout_seconds}
                    onChange={(e) => setForm({ ...form, timeout_seconds: parseInt(e.target.value) || 30 })} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Conector ativo</Label>
              <Switch checked={form.is_enabled} onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Sincronização automática</Label>
              <Switch checked={form.auto_sync_enabled} onCheckedChange={(v) => setForm({ ...form, auto_sync_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-ativar ofertas importadas</Label>
              <Switch checked={form.auto_activate} onCheckedChange={(v) => setForm({ ...form, auto_activate: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-visível para motoristas</Label>
              <Switch checked={form.auto_visible_driver} onCheckedChange={(v) => setForm({ ...form, auto_visible_driver: v })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar conector"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}