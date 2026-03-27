import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, User, CreditCard, Phone, Mail, Coins, MapPin, ExternalLink, Gift } from "lucide-react";
import type { DriverRow } from "@/pages/DriverManagementPage";
import DriverScoringToggle from "./DriverScoringToggle";
import DriverRuleEditor from "./DriverRuleEditor";
import DriverLedgerSection from "./DriverLedgerSection";
import DriverPasswordReset from "./DriverPasswordReset";
import DriverBranchEditor from "./DriverBranchEditor";
import ManualDriverScoringDialog from "@/components/machine-integration/ManualDriverScoringDialog";

interface Props {
  driver: DriverRow | null;
  brandId: string;
  onClose: () => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

export default function DriverDetailSheet({ driver, brandId, onClose }: Props) {
  const [bonusOpen, setBonusOpen] = useState(false);

  const cleanName = (name: string | null) =>
    name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

  const maskCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    if (cpf.length >= 11) return `•••.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    return cpf;
  };

  const handleOpenPwa = () => {
    if (!driver) return;
    const url = `/customer-preview?brand=${brandId}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Sheet open={!!driver} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {driver ? cleanName(driver.name) : "Motorista"}
            </SheetTitle>
          </SheetHeader>

          {driver && (
            <div className="mt-4 space-y-5">
              {/* Dados cadastrais */}
              <div className="space-y-2 rounded-lg border border-border p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dados Cadastrais</h4>
                <InfoRow icon={User} label="Nome" value={cleanName(driver.name)} />
                <InfoRow icon={CreditCard} label="CPF" value={maskCpf(driver.cpf)} />
                <InfoRow icon={Phone} label="Telefone" value={driver.phone || "—"} />
                <InfoRow icon={Mail} label="E-mail" value={driver.email || "—"} />
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Saldo atual</span>
                  <Badge variant="secondary" className="text-sm font-mono">
                    <Coins className="h-3.5 w-3.5 mr-1" />
                    {driver.points_balance} pts
                  </Badge>
                </div>
                {driver.customer_tier && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tier</span>
                    <Badge variant="outline" className="text-xs">{driver.customer_tier}</Badge>
                  </div>
                )}
              </div>

              {/* Ações rápidas */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setBonusOpen(true)}>
                  <Gift className="h-3.5 w-3.5 mr-1" />
                  Adicionar Pontos
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenPwa}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Acessar Conta
                </Button>
                <DriverPasswordReset driver={driver} />
              </div>

              {/* Cidade / Branch */}
              <DriverBranchEditor driver={driver} brandId={brandId} />

              {/* Toggle pontuação */}
              <DriverScoringToggle driver={driver} />

              {/* Regra individual */}
              <DriverRuleEditor driverId={driver.id} brandId={brandId} />

              {/* Extrato de pontos */}
              <DriverLedgerSection driverId={driver.id} driverName={cleanName(driver.name)} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {driver && (
        <ManualDriverScoringDialog
          open={bonusOpen}
          onOpenChange={setBonusOpen}
          driver={{ id: driver.id, name: driver.name, branch_id: driver.branch_id || undefined }}
          brandId={brandId}
        />
      )}
    </>
  );
}
