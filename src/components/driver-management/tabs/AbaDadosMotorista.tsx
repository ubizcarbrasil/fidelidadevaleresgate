import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import type { DriverRow } from "@/pages/DriverManagementPage";
import DriverPasswordReset from "../DriverPasswordReset";
import DriverBranchEditor from "../DriverBranchEditor";

interface Props {
  driver: DriverRow;
  brandId: string;
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

const cleanName = (name: string | null) =>
  name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

const maskCpf = (cpf: string | null) => {
  if (!cpf) return "—";
  if (cpf.length >= 11) return `•••.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  return cpf;
};

export default function AbaDadosMotorista({ driver, brandId }: Props) {
  const handleOpenPwa = () => {
    const url = `/customer-preview?brand=${brandId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dados Cadastrais</h4>
        <InfoRow icon={User} label="Nome" value={cleanName(driver.name)} />
        <InfoRow icon={CreditCard} label="CPF" value={maskCpf(driver.cpf)} />
        <InfoRow icon={Phone} label="Telefone" value={driver.phone || "—"} />
        <InfoRow icon={Mail} label="E-mail" value={driver.email || "—"} />
        {driver.customer_tier && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tier</span>
              <Badge variant="outline" className="text-xs">{driver.customer_tier}</Badge>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleOpenPwa}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Acessar Conta
        </Button>
        <DriverPasswordReset driver={driver} />
      </div>

      <DriverBranchEditor driver={driver} brandId={brandId} />
    </div>
  );
}
