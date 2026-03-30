import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, Loader2, Coins, Plus } from "lucide-react";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function ModalAdicionarResgatavel({ aberto, onFechar }: Props) {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();

  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [custoPontos, setCustoPontos] = useState("");
  const [tentouSalvar, setTentouSalvar] = useState(false);

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

  const marcarResgatavel = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selecionados);
      const num = parseInt(custoPontos, 10);
      if (!ids.length) throw new Error("Selecione ao menos um produto");
      if (isNaN(num) || num <= 0) throw new Error("Informe um custo em pontos válido");

      const { error } = await supabase
        .from("affiliate_deals")
        .update({ is_redeemable: true, redeem_points_cost: num } as any)
        .in("id", ids);
      if (error) throw error;
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
    onFechar();
  };

  const handleSalvar = () => {
    if (!selecionados.size) return;
    if (!custoPontos || isNaN(parseInt(custoPontos, 10)) || parseInt(custoPontos, 10) <= 0) {
      setTentouSalvar(true);
      toast.error("Informe o custo em pontos para continuar");
      return;
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

        {/* Custo em pontos */}
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

              {produtos.map((p) => (
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
                    </p>
                  </div>
                </label>
              ))}
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
