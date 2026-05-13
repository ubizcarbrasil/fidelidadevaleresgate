import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Info } from "lucide-react";
import { useMotoristasDisponiveis } from "../../hooks/hook_campeonato_empreendedor";
import { useIncluirMotorista } from "../../hooks/hook_mutations_campeonato";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  seasonId: string;
  tiers: Array<{ tier_id: string; tier_name: string }>;
}

export default function ModalIncluirMotorista({
  open,
  onClose,
  brandId,
  seasonId,
  tiers,
}: Props) {
  const { data: motoristas, isLoading } = useMotoristasDisponiveis(
    brandId,
    open ? seasonId : null,
  );
  const [driverId, setDriverId] = useState("");
  const [tierId, setTierId] = useState("");
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const { mutate, isPending } = useIncluirMotorista(brandId);

  const valido =
    !!driverId && !!tierId && points >= 0 && reason.trim().length >= 5;

  function aoSalvar() {
    if (!valido) return;
    mutate(
      {
        seasonId,
        driverId,
        tierId,
        initialPoints: points,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setDriverId("");
          setTierId("");
          setPoints(0);
          setReason("");
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Incluir motorista na temporada</DialogTitle>
          <DialogDescription>
            Adiciona um motorista da marca a uma série específica. Pontos
            iniciais não podem exceder a mediana da série.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Motorista</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Carregando…" : "Escolha o motorista"}
                />
              </SelectTrigger>
              <SelectContent>
                {(motoristas ?? []).length === 0 && !isLoading ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    Nenhum motorista disponível.
                  </div>
                ) : (
                  (motoristas ?? []).map((m) => (
                    <SelectItem key={m.driver_id} value={m.driver_id}>
                      {m.driver_name ?? "Sem nome"}{" "}
                      {m.driver_phone && (
                        <span className="text-xs text-muted-foreground">
                          · {m.driver_phone}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Série</Label>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a série" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.tier_id} value={t.tier_id}>
                    Série {t.tier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Pontos iniciais</Label>
            <Input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
            <p className="flex items-start gap-1 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Limitado pela mediana atual da série (validado no servidor).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Mínimo 5 caracteres."
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={aoSalvar} disabled={isPending || !valido}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Incluir motorista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
