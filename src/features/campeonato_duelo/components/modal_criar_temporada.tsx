import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { NOMES_MESES } from "../constants/constantes_campeonato";
import {
  deInputDate, gerarDatasSugeridas, nomeAutomaticoTemporada, paraInputDate,
} from "../utils/utilitarios_campeonato";
import { useCriarTemporada } from "../hooks/hook_campeonato";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  branchId: string;
}

export default function ModalCriarTemporada({ open, onClose, brandId, branchId }: Props) {
  const hoje = new Date();
  const [year, setYear] = useState(hoje.getFullYear());
  const [month, setMonth] = useState(hoje.getMonth() + 1);
  const [name, setName] = useState(nomeAutomaticoTemporada(hoje.getFullYear(), hoje.getMonth() + 1));

  const sugestao = useMemo(() => gerarDatasSugeridas(year, month), [year, month]);
  const [classStart, setClassStart] = useState(paraInputDate(sugestao.classificationStartsAt));
  const [classEnd, setClassEnd] = useState(paraInputDate(sugestao.classificationEndsAt));
  const [knockStart, setKnockStart] = useState(paraInputDate(sugestao.knockoutStartsAt));
  const [knockEnd, setKnockEnd] = useState(paraInputDate(sugestao.knockoutEndsAt));

  const { mutate, isPending } = useCriarTemporada();

  function aoMudarMesAno(novoYear: number, novoMonth: number) {
    setYear(novoYear);
    setMonth(novoMonth);
    setName(nomeAutomaticoTemporada(novoYear, novoMonth));
    const s = gerarDatasSugeridas(novoYear, novoMonth);
    setClassStart(paraInputDate(s.classificationStartsAt));
    setClassEnd(paraInputDate(s.classificationEndsAt));
    setKnockStart(paraInputDate(s.knockoutStartsAt));
    setKnockEnd(paraInputDate(s.knockoutEndsAt));
  }

  function aoSalvar() {
    mutate(
      {
        brandId, branchId, name, year, month,
        classificationStartsAt: deInputDate(classStart),
        classificationEndsAt: deInputDate(classEnd, true),
        knockoutStartsAt: deInputDate(knockStart),
        knockoutEndsAt: deInputDate(knockEnd, true),
      },
      { onSuccess: () => onClose() },
    );
  }

  const anoAtual = hoje.getFullYear();
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Temporada do Campeonato</DialogTitle>
          <DialogDescription>
            Cada cidade pode ter apenas uma temporada por mês. Ajuste as datas conforme a estratégia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mes">Mês</Label>
              <Select value={String(month)} onValueChange={(v) => aoMudarMesAno(year, Number(v))}>
                <SelectTrigger id="mes"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOMES_MESES.map((nome, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>{nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ano">Ano</Label>
              <Select value={String(year)} onValueChange={(v) => aoMudarMesAno(Number(v), month)}>
                <SelectTrigger id="ano"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome da temporada</Label>
            <Input id="nome" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fase 1 — Classificação (pontos corridos)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cs" className="text-xs">Início</Label>
                <Input id="cs" type="date" value={classStart} onChange={(e) => setClassStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ce" className="text-xs">Fim</Label>
                <Input id="ce" type="date" value={classEnd} onChange={(e) => setClassEnd(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fase 2 — Mata-mata (Top 16)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ks" className="text-xs">Início</Label>
                <Input id="ks" type="date" value={knockStart} onChange={(e) => setKnockStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ke" className="text-xs">Fim</Label>
                <Input id="ke" type="date" value={knockEnd} onChange={(e) => setKnockEnd(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={aoSalvar} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Criar temporada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}