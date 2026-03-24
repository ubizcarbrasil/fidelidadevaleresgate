import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchSyncConfig, upsertSyncConfig } from "@/lib/api/mirrorSync";

interface Props {
  brandId: string;
}

export default function MirrorSyncConfig({ brandId }: Props) {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["mirror-sync-config", brandId],
    queryFn: () => fetchSyncConfig(brandId),
  });

  const defaultExtraPages = "/promocoes-do-dia\n/lojas/shopee\n/lojas/mercadolivre\n/lojas/amazon\n/lojas/magalu";

  const [form, setForm] = useState({
    origin_url: "https://www.divulgadorinteligente.com/ubizresgata",
    auto_sync_enabled: false,
    sync_interval_minutes: 10,
    max_offers_per_read: 100,
    max_pages: 5,
    timeout_seconds: 30,
    debug_mode: false,
    auto_activate: true,
    auto_visible_driver: true,
    extra_pages_text: defaultExtraPages,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        origin_url: config.origin_url || form.origin_url,
        auto_sync_enabled: config.auto_sync_enabled ?? false,
        sync_interval_minutes: config.sync_interval_minutes ?? 10,
        max_offers_per_read: config.max_offers_per_read ?? 100,
        max_pages: config.max_pages ?? 5,
        timeout_seconds: config.timeout_seconds ?? 30,
        debug_mode: config.debug_mode ?? false,
        auto_activate: config.auto_activate ?? true,
        auto_visible_driver: config.auto_visible_driver ?? true,
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertSyncConfig(brandId, form);
      queryClient.invalidateQueries({ queryKey: ["mirror-sync-config"] });
      toast.success("Configurações salvas!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Integrador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>URL da Origem</Label>
          <Input value={form.origin_url} onChange={(e) => setForm({ ...form, origin_url: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Intervalo (min)</Label>
            <Input
              type="number"
              value={form.sync_interval_minutes}
              onChange={(e) => setForm({ ...form, sync_interval_minutes: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max ofertas/leitura</Label>
            <Input
              type="number"
              value={form.max_offers_per_read}
              onChange={(e) => setForm({ ...form, max_offers_per_read: parseInt(e.target.value) || 100 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Timeout (seg)</Label>
            <Input
              type="number"
              value={form.timeout_seconds}
              onChange={(e) => setForm({ ...form, timeout_seconds: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sincronização automática</Label>
              <p className="text-xs text-muted-foreground">Sincronizar periodicamente</p>
            </div>
            <Switch checked={form.auto_sync_enabled} onCheckedChange={(v) => setForm({ ...form, auto_sync_enabled: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-ativar ofertas importadas</Label>
              <p className="text-xs text-muted-foreground">Novas ofertas ficam ativas automaticamente</p>
            </div>
            <Switch checked={form.auto_activate} onCheckedChange={(v) => setForm({ ...form, auto_activate: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-visível para motoristas</Label>
              <p className="text-xs text-muted-foreground">Novas ofertas aparecem no Achadinhos do motorista</p>
            </div>
            <Switch checked={form.auto_visible_driver} onCheckedChange={(v) => setForm({ ...form, auto_visible_driver: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Modo debug</Label>
              <p className="text-xs text-muted-foreground">Salvar HTML bruto para inspeção</p>
            </div>
            <Switch checked={form.debug_mode} onCheckedChange={(v) => setForm({ ...form, debug_mode: v })} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
