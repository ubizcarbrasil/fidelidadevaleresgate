import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function normalizeSlug(city: string, uf: string): string {
  const raw = `${city}-${uf}`.toLowerCase();
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function geocode(city: string, uf: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, ${uf}, Brasil`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

export default function BrandBranchForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["brand-branch", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  // Load existing telegram_chat_id from machine_integrations
  const { data: existingIntegration } = useQuery({
    queryKey: ["branch-integration", id, currentBrandId],
    queryFn: async () => {
      if (!id || !currentBrandId) return null;
      const { data } = await supabase
        .from("machine_integrations")
        .select("telegram_chat_id")
        .eq("brand_id", currentBrandId)
        .eq("branch_id", id)
        .maybeSingle();
      return data;
    },
    enabled: isEdit && !!currentBrandId,
  });

  useEffect(() => {
    if (existing) {
      setCidade(existing.city || existing.name || "");
      setUf(existing.state || "");
      setAtivo(existing.is_active);
    }
  }, [existing]);

  useEffect(() => {
    if (existingIntegration?.telegram_chat_id) {
      setTelegramChatId(existingIntegration.telegram_chat_id);
    }
  }, [existingIntegration]);

  const handleSave = async () => {
    if (!cidade.trim() || !uf) {
      toast.error("Preencha a cidade e o estado.");
      return;
    }
    if (!currentBrandId) {
      toast.error("Marca não identificada.");
      return;
    }

    setSaving(true);
    try {
      const name = `${cidade.trim()} - ${uf}`;
      const slug = normalizeSlug(cidade.trim(), uf);
      const geo = await geocode(cidade.trim(), uf);

      const payload = {
        name,
        slug,
        city: cidade.trim(),
        state: uf,
        is_active: ativo,
        timezone: "America/Sao_Paulo",
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
        brand_id: currentBrandId,
      };

      if (isEdit && id) {
        const { error } = await supabase.from("branches").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Cidade atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("branches").insert(payload);
        if (error) throw error;
        toast.success("Cidade criada com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["brand-branches"] });
      navigate("/brand-branches");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar cidade.");
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/brand-branches")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={isEdit ? "Editar Cidade" : "Nova Cidade"}
          description="Preencha apenas o essencial — os dados técnicos são gerados automaticamente."
        />
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Ex: Campinas"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativa</Label>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Nome gerado:</strong> {cidade.trim() && uf ? `${cidade.trim()} - ${uf}` : "—"}</p>
            <p><strong>Slug:</strong> {cidade.trim() && uf ? normalizeSlug(cidade.trim(), uf) : "—"}</p>
            <p><strong>Timezone:</strong> America/Sao_Paulo</p>
            <p><strong>Coordenadas:</strong> preenchidas automaticamente ao salvar</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate("/brand-branches")}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? "Salvar" : "Criar Cidade"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
