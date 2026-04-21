import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Swords, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { formatPoints } from "@/lib/formatPoints";
import { useCriarDuelosLote } from "../hooks/hook_criar_duelos_lote";
import { useSaldoCarteiraCidade } from "../hooks/hook_sugestoes_duelo";
import BadgePatrocinado from "./badge_patrocinado";
import type { ParSugerido } from "../types/tipos_duelos_matching";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  brandId: string;
  pares: ParSugerido[];
  onSuccess: () => void;
}

export default function ModalCriarDuelosLote({
  open,
  onClose,
  branchId,
  brandId,
  pares,
  onSuccess,
}: Props) {
  const [startAt, setStartAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endAt, setEndAt] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [prizePerPair, setPrizePerPair] = useState("100");
  const [patrocinado, setPatrocinado] = useState(true);

  const { data: saldo = 0, isLoading: carregandoSaldo } = useSaldoCarteiraCidade(branchId);
  const criar = useCriarDuelosLote(() => {
    onSuccess();
    onClose();
  });

  const prizeNum = useMemo(() => Math.max(0, parseInt(prizePerPair, 10) || 0), [prizePerPair]);
  const totalCusto = pares.length * prizeNum;
  const saldoSuficiente = totalCusto <= saldo;

  const handleConfirmar = () => {
    if (pares.length === 0) return;
    criar.mutate({
      branchId,
      brandId,
      pares: pares.map(p => ({
        challenger_customer_id: p.a_customer_id,
        challenged_customer_id: p.b_customer_id,
      })),
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      prizePointsPerPair: prizeNum,
      patrocinado,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !criar.isPending && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Criar duelos em massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-semibold text-foreground">{pares.length} par(es) selecionado(s)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cada par vira um duelo já aceito, válido no período abaixo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prêmio por par (pontos)</Label>
            <Input
              type="number"
              min={0}
              value={prizePerPair}
              onChange={(e) => setPrizePerPair(e.target.value)}
            />
            <p className="text-xs text-muted-foreground italic">
              Pago pela carteira da cidade. Motoristas não apostam pontos — o vencedor de cada duelo leva o prêmio integral.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Patrocinado pelo empreendedor
              </Label>
              <p className="text-xs text-muted-foreground">
                Exibe selo nos cards e marca a transação como patrocinada.
              </p>
            </div>
            <Switch checked={patrocinado} onCheckedChange={setPatrocinado} />
          </div>

          {patrocinado && (
            <div>
              <BadgePatrocinado />
            </div>
          )}

          <div className="rounded-lg border bg-card p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo da carteira</span>
              <span className="font-medium">
                {carregandoSaldo ? "..." : `${formatPoints(saldo)} pts`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Custo: {pares.length} × {formatPoints(prizeNum)} pts
              </span>
              <span className="font-bold">{formatPoints(totalCusto)} pts</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-muted-foreground">Saldo após débito</span>
              <span className={saldoSuficiente ? "font-medium" : "font-bold text-destructive"}>
                {formatPoints(saldo - totalCusto)} pts
              </span>
            </div>
          </div>

          {!saldoSuficiente && totalCusto > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Saldo insuficiente para gerar este lote. Reduza o prêmio ou recarregue a carteira.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={criar.isPending || pares.length === 0 || !saldoSuficiente}
            className="gap-1"
          >
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            Gerar lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}