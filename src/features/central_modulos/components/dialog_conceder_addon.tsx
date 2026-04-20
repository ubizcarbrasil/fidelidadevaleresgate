/**
 * DialogConcederAddon — Sub-fase 6.1
 * Modal de concessão manual de add-on (Root Admin).
 * Seleciona Marca + Modelo + Ciclo + Preço + Validade + Notas.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessModelsCatalog } from "@/compartilhados/hooks/hook_modelos_negocio_crud";
import {
  useGrantBusinessModelAddon,
  type GrantAddonInput,
} from "@/compartilhados/hooks/hook_business_model_addons";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pré-seleção opcional */
  prefill?: { brand_id?: string; business_model_id?: string };
}

interface BrandOption {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
}

interface BranchOption {
  id: string;
  name: string;
  city: string | null;
}

function useBrandsList() {
  return useQuery({
    queryKey: ["brands-options-addon"] as const,
    staleTime: 60_000,
    queryFn: async (): Promise<BrandOption[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, slug, subscription_plan")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BrandOption[];
    },
  });
}

function useBranchesOfBrand(brandId: string | null) {
  return useQuery({
    queryKey: ["branches-options-addon", brandId] as const,
    enabled: !!brandId,
    staleTime: 60_000,
    queryFn: async (): Promise<BranchOption[]> => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city")
        .eq("brand_id", brandId!)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BranchOption[];
    },
  });
}

export function DialogConcederAddon({ open, onOpenChange, prefill }: Props) {
  const { data: brands, isLoading: loadBrands } = useBrandsList();
  const { data: modelos, isLoading: loadModelos } = useBusinessModelsCatalog();
  const grant = useGrantBusinessModelAddon();

  const [brandId, setBrandId] = useState<string>("");
  const [scope, setScope] = useState<"brand" | "branch">("brand");
  const [branchId, setBranchId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [priceReais, setPriceReais] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: branches, isLoading: loadBranches } = useBranchesOfBrand(brandId || null);

  const sellableModels = useMemo(
    () => (modelos ?? []).filter((m) => m.is_sellable_addon && m.is_active),
    [modelos]
  );

  const selectedModel = useMemo(
    () => sellableModels.find((m) => m.id === modelId) ?? null,
    [sellableModels, modelId]
  );

  // Reset / prefill ao abrir
  useEffect(() => {
    if (!open) return;
    setBrandId(prefill?.brand_id ?? "");
    setModelId(prefill?.business_model_id ?? "");
    setScope("brand");
    setBranchId("");
    setCycle("monthly");
    setExpiresAt("");
    setNotes("");
  }, [open, prefill]);

  // Ao trocar de marca, reseta cidade selecionada
  useEffect(() => {
    setBranchId("");
  }, [brandId]);

  // Sugere preço quando modelo ou ciclo mudam
  useEffect(() => {
    if (!selectedModel) {
      setPriceReais("");
      return;
    }
    const cents =
      cycle === "yearly"
        ? selectedModel.addon_price_yearly_cents
        : selectedModel.addon_price_monthly_cents;
    if (cents != null) setPriceReais((cents / 100).toFixed(2).replace(".", ","));
    else setPriceReais("");
  }, [selectedModel, cycle]);

  const canSubmit =
    !!brandId &&
    !!modelId &&
    !!priceReais &&
    !grant.isPending &&
    (scope === "brand" || !!branchId);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const cents = Math.round(
      parseFloat(priceReais.replace(/\./g, "").replace(",", ".")) * 100
    );
    if (Number.isNaN(cents) || cents < 0) return;
    const input: GrantAddonInput = {
      brand_id: brandId,
      branch_id: scope === "branch" ? branchId : null,
      business_model_id: modelId,
      billing_cycle: cycle,
      price_cents: cents,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      notes: notes || null,
    };
    await grant.mutateAsync(input);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Conceder Add-on</DialogTitle>
          <DialogDescription>
            Libera um modelo de negócio avulso para uma marca específica, fora do
            pacote do plano dela.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select value={brandId} onValueChange={setBrandId} disabled={loadBrands}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {(brands ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex items-center gap-2">
                      <span>{b.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {b.subscription_plan}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Modelo de Negócio</Label>
            <Select value={modelId} onValueChange={setModelId} disabled={loadModelos}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {sellableModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {m.audience}
                      </Badge>
                      <span>{m.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {sellableModels.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Nenhum modelo marcado como vendável.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ciclo</Label>
              <Select
                value={cycle}
                onValueChange={(v) => setCycle(v as "monthly" | "yearly")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={priceReais}
                onChange={(e) => setPriceReais(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Expira em (opcional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Vazio = vigência manual (não expira sozinho).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea
              rows={2}
              placeholder="Cortesia, trial, vendido na chamada X…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {grant.isPending ? "Concedendo…" : "Conceder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogConcederAddon;
