import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; onGenerate: () => void; }

export default function StepCode({ data, update, onGenerate }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Código do cupom</Label>
      <p className="text-sm text-muted-foreground">O cliente usará este código para resgatar o desconto.</p>
      <div className="flex gap-2">
        <Input
          value={data.code}
          onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16) })}
          className="font-mono text-lg tracking-wider"
          maxLength={16}
        />
        <Button type="button" variant="outline" size="icon" onClick={onGenerate} title="Gerar novo código">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Mínimo 4 caracteres, máximo 16. Apenas letras e números.</p>
    </div>
  );
}
