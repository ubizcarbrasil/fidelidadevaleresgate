import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useProductScope } from "@/features/city_onboarding/hooks/hook_escopo_produto";
import { useRegrasResgateCidade } from "@/compartilhados/hooks/hook_regras_resgate_cidade";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import StorageImageUpload from "@/components/page-builder/StorageImageUpload";
import { toast } from "sonner";
import { Loader2, Plus, Coins, Zap } from "lucide-react";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

type PublicoAlvo = "driver" | "customer" | "both";

export default function ModalCriarProdutoManual({ aberto, onFechar }: Props) {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const escopo = useProductScope();
  const { data: regras } = useRegrasResgateCidade(currentBrandId, currentBranchId);

  const audienciaMotorista = escopo.hasAudience("motorista");
  const audienciaCliente = escopo.hasAudience("cliente");

  // Público padrão segundo o escopo do plano
  const publicoPadrao: PublicoAlvo =
    audienciaMotorista && audienciaCliente
      ? "both"
      : audienciaCliente
        ? "customer"
        : "driver";

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [precoStr, setPrecoStr] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState<PublicoAlvo>(publicoPadrao);
  const [autoCalc, setAutoCalc] = useState(true);
  const [pontosStr, setPontosStr] = useState("");

  // Reset on open
  useEffect(() => {
    if (aberto) {
      setTitulo("");
      setDescricao("");
      setImagemUrl("");
      setPrecoStr("");
      setPublicoAlvo(publicoPadrao);
      setAutoCalc(true);
      setPontosStr("");
    }
  }, [aberto, publicoPadrao]);

  const taxa =
    publicoAlvo === "driver"
      ? regras?.points_per_real_driver ?? 40
      : publicoAlvo === "customer"
        ? regras?.points_per_real_customer ?? 40
        : Math.max(
            regras?.points_per_real_driver ?? 40,
            regras?.points_per_real_customer ?? 40,
          );

  const precoNum = parseFloat(precoStr.replace(",", "."));
  const precoValido = !isNaN(precoNum) && precoNum > 0;
  const pontosCalculados = precoValido ? Math.ceil(precoNum * taxa) : null;

  // Auto-preencher pontos quando o cálculo automático está ligado
  useEffect(() => {
    if (autoCalc && pontosCalculados != null) {
      setPontosStr(String(pontosCalculados));
    }
  }, [autoCalc, pontosCalculados]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Marca não identificada");
      if (!titulo.trim()) throw new Error("Informe o título do produto");

      const pontosNum = parseInt(pontosStr, 10);
      if (isNaN(pontosNum) || pontosNum <= 0) {
        throw new Error("Informe um custo em pontos válido");
      }

      const payload: any = {
        brand_id: currentBrandId,
        branch_id: currentBranchId ?? null,
        title: titulo.trim(),
        description: descricao.trim() || null,
        image_url: imagemUrl || null,
        price: precoValido ? precoNum : null,
        affiliate_url: "",
        is_active: true,
        is_redeemable: true,
        redeem_points_cost: pontosNum,
        redeemable_by: publicoAlvo,
        origin: "manual",
      };

      const { error } = await supabase.from("affiliate_deals").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos-resgate"] });
      qc.invalidateQueries({ queryKey: ["produtos-resgate-kpis"] });
      toast.success("Produto criado com sucesso");
      onFechar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const podeSalvar =
    !!titulo.trim() &&
    !!pontosStr &&
    !isNaN(parseInt(pontosStr, 10)) &&
    parseInt(pontosStr, 10) > 0;

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Criar Produto de Resgate</DialogTitle>
          <DialogDescription>
            Cadastre manualmente um produto para a vitrine de resgate.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pr-1">
            {/* Imagem */}
            <StorageImageUpload
              label="Imagem do produto"
              value={imagemUrl}
              onChange={setImagemUrl}
              folder="produtos-resgate"
              aspectHint="Recomendado: imagem quadrada (1:1)"
            />

            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="titulo">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Camiseta personalizada"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes do produto, condições, observações..."
                rows={3}
              />
            </div>

            {/* Preço */}
            <div className="space-y-1.5">
              <Label htmlFor="preco">Preço em R$ (opcional)</Label>
              <Input
                id="preco"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={precoStr}
                onChange={(e) => setPrecoStr(e.target.value)}
                placeholder="0,00"
              />
              <p className="text-[11px] text-muted-foreground">
                Se informado, habilita o cálculo automático de pontos.
              </p>
            </div>

            {/* Público */}
            <div className="space-y-1.5">
              <Label>Público-alvo</Label>
              <Select
                value={publicoAlvo}
                onValueChange={(v) => setPublicoAlvo(v as PublicoAlvo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audienciaMotorista && (
                    <SelectItem value="driver">Motorista</SelectItem>
                  )}
                  {audienciaCliente && (
                    <SelectItem value="customer">Passageiro</SelectItem>
                  )}
                  {audienciaMotorista && audienciaCliente && (
                    <SelectItem value="both">Ambos</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Toggle cálculo automático */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Calcular pontos automaticamente</p>
                  <p className="text-xs text-muted-foreground">
                    Usa preço × {taxa} pt/R$ (taxa da cidade)
                  </p>
                </div>
              </div>
              <Switch
                checked={autoCalc}
                onCheckedChange={setAutoCalc}
                disabled={!precoValido}
              />
            </div>

            {/* Pontos */}
            <div className="space-y-1.5">
              <Label htmlFor="pontos">
                Custo em pontos <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                <Input
                  id="pontos"
                  type="number"
                  min={1}
                  value={pontosStr}
                  onChange={(e) => setPontosStr(e.target.value)}
                  placeholder="Ex: 1000"
                  disabled={autoCalc && precoValido}
                />
              </div>
              {autoCalc && precoValido && (
                <p className="text-[11px] text-muted-foreground">
                  Calculado automaticamente. Desligue o toggle acima para editar.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => criar.mutate()}
            disabled={!podeSalvar || criar.isPending}
          >
            {criar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Criar Produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
