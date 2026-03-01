import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, XCircle, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface CloneOptions {
  stores: boolean;
  offers: boolean;
  adjustOfferDates: boolean;
  brandSections: boolean;
}

interface CloneLog {
  type: "success" | "error" | "info";
  message: string;
}

export default function CloneBranchPage() {
  const { user } = useAuth();
  const { isRootAdmin, currentBrandId } = useBrandGuard();

  const [brandId, setBrandId] = useState(currentBrandId || "");
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [options, setOptions] = useState<CloneOptions>({
    stores: true,
    offers: true,
    adjustOfferDates: true,
    brandSections: false,
  });
  const [logs, setLogs] = useState<CloneLog[]>([]);

  const { data: brands } = useQuery({
    queryKey: ["brands-clone"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
    enabled: isRootAdmin,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-clone", brandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name, city, state").eq("is_active", true).order("name");
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!brandId,
  });

  const sourceBranch = branches?.find(b => b.id === sourceBranchId);
  const targetBranch = branches?.find(b => b.id === targetBranchId);

  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!user || !brandId || !sourceBranchId || !targetBranchId) throw new Error("Dados insuficientes");
      if (sourceBranchId === targetBranchId) throw new Error("Origem e destino devem ser diferentes");

      const cloneLogs: CloneLog[] = [];
      const addLog = (log: CloneLog) => {
        cloneLogs.push(log);
        setLogs([...cloneLogs]);
      };

      addLog({ type: "info", message: `Iniciando clonagem de "${sourceBranch?.name}" → "${targetBranch?.name}"` });

      // ── Clone Stores ──
      if (options.stores) {
        addLog({ type: "info", message: "Clonando lojas..." });
        const { data: sourceStores, error: stErr } = await supabase
          .from("stores")
          .select("name, slug, logo_url, category, address, whatsapp, is_active")
          .eq("branch_id", sourceBranchId)
          .eq("brand_id", brandId);

        if (stErr) {
          addLog({ type: "error", message: `Erro ao ler lojas: ${stErr.message}` });
        } else if (sourceStores && sourceStores.length > 0) {
          // Check existing slugs in target
          const { data: existingStores } = await supabase
            .from("stores")
            .select("slug")
            .eq("branch_id", targetBranchId)
            .eq("brand_id", brandId);
          const existingSlugs = new Set((existingStores || []).map(s => s.slug));

          let created = 0;
          let skipped = 0;
          for (const store of sourceStores) {
            if (existingSlugs.has(store.slug)) {
              skipped++;
              continue;
            }
            const { error } = await supabase.from("stores").insert({
              ...store,
              brand_id: brandId,
              branch_id: targetBranchId,
            });
            if (error) {
              addLog({ type: "error", message: `Erro ao criar loja "${store.name}": ${error.message}` });
            } else {
              created++;
            }
          }
          addLog({ type: "success", message: `Lojas: ${created} criadas, ${skipped} já existentes (ignoradas)` });
        } else {
          addLog({ type: "info", message: "Nenhuma loja na origem." });
        }
      }

      // ── Clone Offers ──
      if (options.offers) {
        addLog({ type: "info", message: "Clonando ofertas..." });

        // Build store mapping (source slug → target store id)
        const { data: srcStores } = await supabase
          .from("stores").select("id, slug").eq("branch_id", sourceBranchId).eq("brand_id", brandId);
        const { data: tgtStores } = await supabase
          .from("stores").select("id, slug").eq("branch_id", targetBranchId).eq("brand_id", brandId);

        const srcSlugToId = new Map((srcStores || []).map(s => [s.id, s.slug]));
        const tgtSlugToId = new Map((tgtStores || []).map(s => [s.slug, s.id]));

        const { data: sourceOffers, error: ofErr } = await supabase
          .from("offers")
          .select("title, description, image_url, value_rescue, min_purchase, start_at, end_at, allowed_weekdays, allowed_hours, max_daily_redemptions, status, is_active, store_id")
          .eq("branch_id", sourceBranchId)
          .eq("brand_id", brandId);

        if (ofErr) {
          addLog({ type: "error", message: `Erro ao ler ofertas: ${ofErr.message}` });
        } else if (sourceOffers && sourceOffers.length > 0) {
          let created = 0;
          let skipped = 0;

          for (const offer of sourceOffers) {
            const srcSlug = srcSlugToId.get(offer.store_id);
            const tgtStoreId = srcSlug ? tgtSlugToId.get(srcSlug) : null;

            if (!tgtStoreId) {
              skipped++;
              addLog({ type: "error", message: `Oferta "${offer.title}": loja correspondente não encontrada no destino` });
              continue;
            }

            let startAt = offer.start_at;
            let endAt = offer.end_at;
            if (options.adjustOfferDates && startAt) {
              const now = new Date();
              const originalStart = new Date(startAt);
              const originalEnd = endAt ? new Date(endAt) : null;
              const duration = originalEnd ? originalEnd.getTime() - originalStart.getTime() : 0;
              startAt = now.toISOString();
              endAt = duration > 0 ? new Date(now.getTime() + duration).toISOString() : endAt;
            }

            const { error } = await supabase.from("offers").insert({
              title: offer.title,
              description: offer.description,
              image_url: offer.image_url,
              value_rescue: offer.value_rescue,
              min_purchase: offer.min_purchase,
              start_at: startAt,
              end_at: endAt,
              allowed_weekdays: offer.allowed_weekdays,
              allowed_hours: offer.allowed_hours,
              max_daily_redemptions: offer.max_daily_redemptions,
              status: offer.status,
              is_active: offer.is_active,
              store_id: tgtStoreId,
              brand_id: brandId,
              branch_id: targetBranchId,
            });
            if (error) {
              addLog({ type: "error", message: `Erro ao criar oferta "${offer.title}": ${error.message}` });
            } else {
              created++;
            }
          }
          addLog({ type: "success", message: `Ofertas: ${created} criadas, ${skipped} ignoradas` });
        } else {
          addLog({ type: "info", message: "Nenhuma oferta na origem." });
        }
      }

      // ── Clone Brand Sections ──
      if (options.brandSections) {
        addLog({ type: "info", message: "Brand sections são por brand (não por branch). Ignorado." });
      }

      // ── Audit Log ──
      await supabase.from("audit_logs").insert([{
        actor_user_id: user.id,
        action: "CLONE_BRANCH",
        entity_type: "branches",
        entity_id: targetBranchId,
        details_json: {
          source_branch_id: sourceBranchId,
          target_branch_id: targetBranchId,
          brand_id: brandId,
          clone_stores: options.stores,
          clone_offers: options.offers,
          adjust_dates: options.adjustOfferDates,
        } as any,
      }]);

      addLog({ type: "success", message: "Clonagem concluída!" });
      return cloneLogs;
    },
    onSuccess: () => {
      toast.success("Branch clonada com sucesso!");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setLogs(prev => [...prev, { type: "error", message: e.message }]);
    },
  });

  const canClone = brandId && sourceBranchId && targetBranchId && sourceBranchId !== targetBranchId && (options.stores || options.offers);
  const isDone = cloneMutation.isSuccess;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Copy className="h-6 w-6" />
          Clonar Branch
        </h2>
        <p className="text-muted-foreground">Copie configurações de uma filial para outra (sem dados sensíveis como clientes ou resgates).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Origem e Destino</CardTitle>
          <CardDescription>Selecione a brand, a filial de origem e a de destino.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRootAdmin && (
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={brandId} onValueChange={v => { setBrandId(v); setSourceBranchId(""); setTargetBranchId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label>Filial Origem</Label>
              <Select value={sourceBranchId} onValueChange={setSourceBranchId} disabled={!brandId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {branches?.filter(b => b.id !== targetBranchId).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}{b.city ? ` (${b.city})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block mb-2" />

            <div className="space-y-2">
              <Label>Filial Destino</Label>
              <Select value={targetBranchId} onValueChange={setTargetBranchId} disabled={!brandId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {branches?.filter(b => b.id !== sourceBranchId).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}{b.city ? ` (${b.city})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sourceBranchId === targetBranchId && sourceBranchId && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Origem e destino devem ser diferentes.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que clonar?</CardTitle>
          <CardDescription>Selecione os dados que serão copiados para a filial destino.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox id="clone-stores" checked={options.stores} onCheckedChange={v => setOptions(o => ({ ...o, stores: !!v }))} />
            <div>
              <Label htmlFor="clone-stores" className="font-medium">Clonar Lojas</Label>
              <p className="text-xs text-muted-foreground">Copia todas as lojas da origem. Lojas com mesmo slug no destino serão ignoradas.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox id="clone-offers" checked={options.offers} onCheckedChange={v => setOptions(o => ({ ...o, offers: !!v }))} />
            <div>
              <Label htmlFor="clone-offers" className="font-medium">Clonar Ofertas</Label>
              <p className="text-xs text-muted-foreground">Copia ofertas vinculadas às lojas. Requer que as lojas correspondentes existam no destino.</p>
            </div>
          </div>

          {options.offers && (
            <div className="ml-7 flex items-start gap-3">
              <Checkbox id="adjust-dates" checked={options.adjustOfferDates} onCheckedChange={v => setOptions(o => ({ ...o, adjustOfferDates: !!v }))} />
              <div>
                <Label htmlFor="adjust-dates" className="font-medium">Ajustar datas para hoje</Label>
                <p className="text-xs text-muted-foreground">As datas de início são reajustadas para agora, mantendo a duração original.</p>
              </div>
            </div>
          )}

          <Separator />

          <Button
            onClick={() => { setLogs([]); cloneMutation.mutate(); }}
            disabled={!canClone || cloneMutation.isPending}
            className="w-full"
          >
            {cloneMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Clonando...</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" />Clonar Branch</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDone ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              Log de Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <ul className="space-y-1.5">
                {logs.map((log, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {log.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
                    {log.type === "error" && <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                    {log.type === "info" && <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">INFO</Badge>}
                    <span>{log.message}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
