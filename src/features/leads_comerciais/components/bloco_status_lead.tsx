import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { STATUS_LABELS } from "@/features/agendar_demonstracao/constants/constantes_demo";
import { useAtualizarStatusLead } from "../hooks/hook_detalhes_lead";
import type { StatusLead } from "@/features/agendar_demonstracao/types/tipos_lead";

interface BlocoStatusLeadProps {
  leadId: string;
  statusAtual: StatusLead;
}

const OPCOES_STATUS: StatusLead[] = ["novo", "contatado", "qualificado", "convertido", "descartado"];

export default function BlocoStatusLead({ leadId, statusAtual }: BlocoStatusLeadProps) {
  const mutation = useAtualizarStatusLead(leadId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Status do pipeline</span>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={statusAtual}
          onValueChange={(valor) => mutation.mutate(valor as StatusLead)}
          disabled={mutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCOES_STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]?.label ?? status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          Mudanças de status são registradas automaticamente no histórico.
        </p>
      </CardContent>
    </Card>
  );
}