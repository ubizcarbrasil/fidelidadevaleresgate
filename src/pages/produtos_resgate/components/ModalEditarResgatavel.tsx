import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useRegrasResgateCidade } from "@/compartilhados/hooks/hook_regras_resgate_cidade";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Coins, Users, Zap, Info } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface Produto {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  store_name: string | null;
  redeem_points_cost: number | null;
  redeemable_by: string;
  custom_points_per_real: number | null;
}

interface Props {
  produto: Produto | null;
  aberto: boolean;
  onFechar: () => void;
}

export default function ModalEditarResgatavel({ produto, aberto, onFechar }: Props) {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId } = useBrandGuard();

  const [publicoAlvo, setPublicoAlvo] = useState<"driver" | "customer" | "both">("driver");
  const [custoPontos, setCustoPontos] = useState("");
  const [taxaPersonalizada, setTaxaPersonalizada] = useState("");
  const [usarTaxaPersonalizada, setUsarTaxaPersonalizada] = useState(false);

  // Effective rates: city > brand > defaults
  const { data: regrasEfetivas } = useRegrasResgateCidade(currentBrandId, currentBranchId);

  const taxaGlobalAtiva = useMemo(() => {
    if (!regrasEfetivas) return 40;
    if (publicoAlvo === "driver") return regrasEfetivas.points_per_real_driver;
    if (publicoAlvo === "customer") return regrasEfetivas.points_per_real_customer;
    return Math.max(regrasEfetivas.points_per_real_driver, regrasEfetivas.points_per_real_customer);
  }, [regrasEfetivas, publicoAlvo]);

  // Populate form when product changes
  useEffect(() => {
    if (produto && aberto) {
      setPublicoAlvo((produto.redeemable_by as "driver" | "customer" | "both") || "driver");
      setCustoPontos(String(produto.redeem_points_cost ?? 0));
      const hasCustom = produto.custom_points_per_real != null && produto.custom_points_per_real > 0;
      setUsarTaxaPersonalizada(hasCustom);
      setTaxaPersonalizada(hasCustom ? String(produto.custom_points_per_real) : "");
    }
  }, [produto, aberto]);

  // Auto-calculate cost when custom rate or audience changes
  useEffect(() => {
    if (!usarTaxaPersonalizada || !produto?.price) return;
    const taxa = parseFloat(taxaPersonalizada);
    if (isNaN(taxa) || taxa <= 0) return;
    setCustoPontos(String(Math.ceil(produto.price * taxa)));
  }, [taxaPersonalizada, usarTaxaPersonalizada, produto?.price]);

  const precoFormatado = produto?.price != null
    ? `R$ ${Number(produto.price).toFixed(2).replace(".", ",")}`
    : "—";

  const salvar = useMutation({
    mutationFn: async () => {
      if (!produto) throw new Error("Produto não encontrado");
      const num = parseInt(custoPontos, 10);
      if (isNaN(num) || num <= 0) throw new Error("Informe um custo em pontos válido");

      const customRate = usarTaxaPersonalizada ? parseFloat(taxaPersonalizada) : null;
      if (usarTaxaPersonalizada && (customRate == null || isNaN(customRate) || customRate <= 0)) {
        throw new Error("Informe uma taxa personalizada válida");
      }

      const { error } = await supabase
        .from("affiliate_deals")
        .update({
          redeem_points_cost: num,
          redeemable_by: publicoAlvo,
          custom_points_per_real: customRate,
        } as any)
        .eq("id", produto.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso");
      qc.invalidateQueries({ queryKey: ["produtos-resgate"] });
      qc.invalidateQueries({ queryKey: ["produtos-resgate-kpis"] });
      onFechar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleRecalcularComGlobal = () => {
    if (!produto?.price) return;
    setUsarTaxaPersonalizada(false);
    setTaxaPersonalizada("");
    setCustoPontos(String(Math.ceil(produto.price * taxaGlobalAtiva)));
  };

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Produto Resgatável</DialogTitle>
        </DialogHeader>

        {produto && (
          <div className="space-y-4">
            {/* Product info */}
            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
              {produto.image_url && (
                <img src={produto.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-2">{produto.title}</p>
                <p className="text-xs text-muted-foreground">
                  {produto.store_name ? `${produto.store_name} · ` : ""}{precoFormatado}
                </p>
              </div>
            </div>

            {/* Público-alvo */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Público-alvo
              </Label>
              <Select value={publicoAlvo} onValueChange={(v) => setPublicoAlvo(v as "driver" | "customer" | "both")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Motorista</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Taxa personalizada toggle */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Taxa personalizada</p>
                  <p className="text-xs text-muted-foreground">
                    Global: {taxaGlobalAtiva} pts/R$
                  </p>
                </div>
              </div>
              <Switch checked={usarTaxaPersonalizada} onCheckedChange={setUsarTaxaPersonalizada} />
            </div>

            {/* Custom rate input */}
            {usarTaxaPersonalizada && (
              <div className="space-y-1.5">
                <Label>Taxa (pts/R$)</Label>
                <Input
                  type="number"
                  min={1}
                  step="any"
                  placeholder={`Ex: ${taxaGlobalAtiva}`}
                  value={taxaPersonalizada}
                  onChange={(e) => setTaxaPersonalizada(e.target.value)}
                />
                {produto.price != null && taxaPersonalizada && !isNaN(parseFloat(taxaPersonalizada)) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Info className="h-3 w-3" />
                    {precoFormatado} × {taxaPersonalizada} pts/R$ = {formatPoints(Math.ceil(produto.price * parseFloat(taxaPersonalizada)))} pts
                  </div>
                )}
              </div>
            )}

            {/* Cost input */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-500" />
                Custo em pontos
              </Label>
              <Input
                type="number"
                min={1}
                value={custoPontos}
                onChange={(e) => setCustoPontos(e.target.value)}
                disabled={usarTaxaPersonalizada}
              />
              {!usarTaxaPersonalizada && produto.price != null && produto.price > 0 && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={handleRecalcularComGlobal}
                >
                  Recalcular com taxa global ({taxaGlobalAtiva} pts/R$)
                </button>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
