import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, Loader2, Coins, Plus, Zap, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function ModalAdicionarResgatavel({ aberto, onFechar }: Props) {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId, isRootAdmin } = useBrandGuard();

  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [custoPontos, setCustoPontos] = useState("");
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [modoAutomatico, setModoAutomatico] = useState(true);
  const [publicoAlvo, setPublicoAlvo] = useState<"driver" | "customer" | "both">("driver");

  // Effective rates: city > brand > defaults
  const { data: regrasEfetivas } = useRegrasResgateCidade(currentBrandId, currentBranchId);

  const taxaAtiva = publicoAlvo === "driver"
    ? (regrasEfetivas?.points_per_real_driver ?? 40)
    : publicoAlvo === "customer"
      ? (regrasEfetivas?.points_per_real_customer ?? 40)
      : Math.max(
          regrasEfetivas?.points_per_real_driver ?? 40,
          regrasEfetivas?.points_per_real_customer ?? 40,
        );

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["deals-nao-resgataveis", currentBrandId, busca],
    queryFn: async () => {
      let query = supabase
        .from("affiliate_deals")
        .select("id, title, image_url, price, store_name")
        .eq("is_active", true)
        .or("is_redeemable.is.null,is_redeemable.eq.false")
        .order("title")
        .limit(50);

      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (busca) query = query.ilike("title", `%${busca}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: aberto && !!currentBrandId,
  });

  const calcularPontos = (price: number | null | undefined): number | null => {
    if (price == null || price <= 0) return null;
    return Math.ceil(price * taxaAtiva);
  };

  const marcarResgatavel = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selecionados);
      if (!ids.length) throw new Error("Selecione ao menos um produto");

      if (modoAutomatico) {
        // Individual updates based on price
        const produtosSelecionados = (produtos ?? []).filter((p) => ids.includes(p.id));
        const semPreco = produtosSelecionados.filter((p) => !p.price || p.price <= 0);
        if (semPreco.length > 0) {
          throw new Error(`${semPreco.length} produto(s) sem preço. Desative o modo automático e informe o custo manualmente.`);
        }

        const updates = produtosSelecionados.map((p) => {
          const cost = calcularPontos(p.price)!;
          return supabase
            .from("affiliate_deals")
            .update({ is_redeemable: true, redeem_points_cost: cost, redeemable_by: publicoAlvo } as any)
            .eq("id", p.id);
        });

        const results = await Promise.all(updates);
        const erros = results.filter((r) => r.error);
        if (erros.length > 0) throw new Error(`Erro ao atualizar ${erros.length} produto(s)`);
      } else {
        const num = parseInt(custoPontos, 10);
        if (isNaN(num) || num <= 0) throw new Error("Informe um custo em pontos válido");

        const { error } = await supabase
          .from("affiliate_deals")
          .update({ is_redeemable: true, redeem_points_cost: num, redeemable_by: publicoAlvo } as any)
          .in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos-resgate"] });
      qc.invalidateQueries({ queryKey: ["produtos-resgate-kpis"] });
      qc.invalidateQueries({ queryKey: ["deals-nao-resgataveis"] });
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      toast.success(`${selecionados.size} produto(s) marcado(s) como resgatável`);
      handleFechar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFechar = () => {
    setSelecionados(new Set());
    setCustoPontos("");
    setBusca("");
    setTentouSalvar(false);
    setPublicoAlvo("driver");
    onFechar();
  };

  const handleSalvar = () => {
    if (!selecionados.size) return;
    if (!modoAutomatico) {
      if (!custoPontos || isNaN(parseInt(custoPontos, 10)) || parseInt(custoPontos, 10) <= 0) {
        setTentouSalvar(true);
        toast.error("Informe o custo em pontos para continuar");
        return;
      }
    }
    marcarResgatavel.mutate();
  };

  const toggleItem = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (!produtos) return;
    if (selecionados.size === produtos.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(produtos.map((p) => p.id)));
    }
  };

  const formatarPreco = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
  };

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && handleFechar()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Produtos ao Resgate</DialogTitle>
        </DialogHeader>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Seletor de público-alvo */}
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Público-alvo</p>
            <Select value={publicoAlvo} onValueChange={(v) => setPublicoAlvo(v as "driver" | "customer" | "both")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Motorista</SelectItem>
                <SelectItem value="customer">Passageiro</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle automático / manual */}
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Calcular automaticamente</p>
              <p className="text-xs text-muted-foreground">
                Usa preço × {taxaAtiva} pt/R$
              </p>
            </div>
          </div>
          <Switch checked={modoAutomatico} onCheckedChange={setModoAutomatico} />
        </div>

        {/* Custo manual (só quando desligado) */}
        {!modoAutomatico && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500 shrink-0" />
              <Input
                type="number"
                min={1}
                placeholder="Custo em pontos (obrigatório)"
                value={custoPontos}
                onChange={(e) => {
                  setCustoPontos(e.target.value);
                  if (e.target.value) setTentouSalvar(false);
                }}
                className={tentouSalvar && !custoPontos ? "border-destructive" : ""}
              />
            </div>
            {tentouSalvar && !custoPontos && (
              <p className="text-xs text-destructive ml-8">Informe o custo em pontos</p>
            )}
          </div>
        )}

        {/* Lista */}
        <ScrollArea className="flex-1 min-h-0 max-h-[40vh] border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !produtos?.length ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhum produto disponível
            </p>
          ) : (
            <div className="divide-y">
              {/* Selecionar todos */}
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 sticky top-0">
                <Checkbox
                  checked={produtos.length > 0 && selecionados.size === produtos.length}
                  onCheckedChange={toggleTodos}
                />
                <span className="text-xs text-muted-foreground">
                  Selecionar todos ({produtos.length})
                </span>
              </div>

              {produtos.map((p) => {
                const pontosCalc = calcularPontos(p.price);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selecionados.has(p.id)}
                      onCheckedChange={() => toggleItem(p.id)}
                    />
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-9 w-9 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.store_name ? `${p.store_name} · ` : ""}
                        {formatarPreco(p.price)}
                        {modoAutomatico && pontosCalc != null && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {" · "}~{pontosCalc} pts
                          </span>
                        )}
                        {modoAutomatico && pontosCalc == null && (
                          <span className="text-destructive font-medium">
                            {" · "}sem preço
                          </span>
                        )}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleFechar}>
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={!selecionados.size || marcarResgatavel.isPending}
          >
            {marcarResgatavel.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Marcar {selecionados.size || ""} como Resgatável
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
