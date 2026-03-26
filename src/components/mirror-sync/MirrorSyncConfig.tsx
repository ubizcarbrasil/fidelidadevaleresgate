import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fetchSyncConfig, upsertSyncConfig } from "@/lib/api/mirrorSync";

interface Props {
  brandId: string;
  sourceType?: string;
}

const SOURCE_OPTIONS = [
  { value: "divulgador_inteligente", label: "Divulgador Inteligente" },
  { value: "dvlinks", label: "DVLinks" },
];

const DEFAULT_URLS: Record<string, string> = {
  divulgador_inteligente: "https://www.divulgadorinteligente.com/ubizresgata",
  dvlinks: "https://dvlinks.com.br/g/achadinhosresgata-69a302fc25d02",
};

export default function MirrorSyncConfig({ brandId, sourceType: initialSource }: Props) {
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = useState(initialSource || "divulgador_inteligente");

  const { data: config, isLoading } = useQuery({
    queryKey: ["mirror-sync-config", brandId, selectedSource],
    queryFn: () => fetchSyncConfig(brandId, selectedSource),
  });

  const defaultExtraPages = "/promocoes-do-dia\n/lojas/shopee\n/lojas/mercadolivre\n/lojas/amazon\n/lojas/magalu";

  const [form, setForm] = useState({
    origin_url: DEFAULT_URLS[selectedSource] || "",
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
      const pages = (config as any).extra_pages;
      setForm({
        origin_url: config.origin_url || DEFAULT_URLS[selectedSource] || "",
        auto_sync_enabled: config.auto_sync_enabled ?? false,
        sync_interval_minutes: config.sync_interval_minutes ?? 10,
        max_offers_per_read: config.max_offers_per_read ?? 100,
        max_pages: config.max_pages ?? 5,
        timeout_seconds: config.timeout_seconds ?? 30,
        debug_mode: config.debug_mode ?? false,
        auto_activate: config.auto_activate ?? true,
        auto_visible_driver: config.auto_visible_driver ?? true,
        extra_pages_text: Array.isArray(pages) && pages.length > 0 ? pages.join("\n") : defaultExtraPages,
      });
    } else {
      setForm(prev => ({
        ...prev,
        origin_url: DEFAULT_URLS[selectedSource] || "",
      }));
    }
  }, [config, selectedSource]);

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const extra_pages = form.extra_pages_text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      await upsertSyncConfig(brandId, selectedSource, { ...form, extra_pages });
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
          <Label>Tipo de Fonte</Label>
          <Select value={selectedSource} onValueChange={handleSourceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>URL da Origem</Label>
          <Input value={form.origin_url} onChange={(e) => setForm({ ...form, origin_url: e.target.value })} />
        </div>

        {selectedSource === "divulgador_inteligente" && (
          <div className="space-y-2">
            <Label>Sub-páginas para scrape</Label>
            <p className="text-xs text-muted-foreground">Uma URL ou path relativo por linha. Ex: /lojas/shopee</p>
            <Textarea
              rows={6}
              value={form.extra_pages_text}
              onChange={(e) => setForm({ ...form, extra_pages_text: e.target.value })}
              placeholder={"/promocoes-do-dia\n/lojas/shopee\n/lojas/mercadolivre"}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedSource === "dvlinks" && (
            <div className="space-y-2">
              <Label>Máx. páginas</Label>
              <Input
                type="number"
                value={form.max_pages}
                onChange={(e) => setForm({ ...form, max_pages: parseInt(e.target.value) || 5 })}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Intervalo (min)</Label>
            <Input
              type="number"
              value={form.sync_interval_minutes}
              onChange={(e) => setForm({ ...form, sync_interval_minutes: parseInt(e.target.value) || 10 })}
            />
          </div>
          {selectedSource === "divulgador_inteligente" && (
            <>
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
            </>
          )}
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

          {selectedSource === "divulgador_inteligente" && (
            <div className="flex items-center justify-between">
              <div>
                <Label>Modo debug</Label>
                <p className="text-xs text-muted-foreground">Salvar HTML bruto para inspeção</p>
              </div>
              <Switch checked={form.debug_mode} onCheckedChange={(v) => setForm({ ...form, debug_mode: v })} />
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
