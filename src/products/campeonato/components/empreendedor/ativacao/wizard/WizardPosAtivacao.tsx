import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StepperWizard from "./StepperWizard";
import PassoFormato from "./PassoFormato";
import PassoCriarTemporada from "./PassoCriarTemporada";
import PassoDistribuir from "./PassoDistribuir";
import ResumoTemporadaAtivaWizard from "./ResumoTemporadaAtivaWizard";
import { useDashboardCampeonato } from "../../../../hooks/hook_campeonato_empreendedor";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  branchId: string;
}

const PASSOS = ["Formato", "Temporada", "Distribuir"];

export default function WizardPosAtivacao({
  open,
  onClose,
  brandId,
  branchId,
}: Props) {
  const [passo, setPasso] = useState(0);
  const { data: dashboard } = useDashboardCampeonato(open ? brandId : undefined);

  // Se ao abrir já existe temporada e séries, fecha (nada a fazer no wizard).
  // Se existe temporada mas sem séries, pula para o passo de distribuir.
  useEffect(() => {
    if (!open || !dashboard) return;
    const ativa = dashboard.active_season;
    const temTiers = (dashboard.tiers ?? []).length > 0;
    if (ativa && temTiers) {
      onClose();
      setTimeout(() => setPasso(0), 250);
    } else if (ativa && !temTiers && passo < 2) {
      setPasso(2);
    }
  }, [open, dashboard, onClose, passo]);

  function fechar() {
    onClose();
    // Reset com pequeno delay pra evitar piscar durante a animação
    setTimeout(() => setPasso(0), 250);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-h-[92vh] gap-4 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-3 border-b border-border px-5 pb-4 pt-5">
          <div>
            <DialogTitle className="text-base">
              Vamos configurar seu Campeonato
            </DialogTitle>
            <DialogDescription className="text-xs">
              3 passos rápidos para deixar tudo pronto.
            </DialogDescription>
          </div>
          <StepperWizard passos={PASSOS} passoAtual={passo} />
        </DialogHeader>

        <div className="space-y-3 px-5 pb-5">
          <ResumoTemporadaAtivaWizard brandId={brandId} branchId={branchId} />

          {passo === 0 && (
            <PassoFormato
              brandId={brandId}
              onContinuar={() => setPasso(1)}
            />
          )}
          {passo === 1 && (
            <PassoCriarTemporada
              brandId={brandId}
              branchId={branchId}
              onCriado={() => setPasso(2)}
              onPular={fechar}
            />
          )}
          {passo === 2 && (
            <PassoDistribuir brandId={brandId} onConcluir={fechar} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}