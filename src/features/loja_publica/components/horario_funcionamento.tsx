import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface HorarioFuncionamentoProps {
  horarios: Record<string, string> | null;
}

const DIAS_SEMANA: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};

export default function HorarioFuncionamento({ horarios }: HorarioFuncionamentoProps) {
  if (!horarios || Object.keys(horarios).length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {Object.entries(horarios).map(([dia, horario]) => (
            <div key={dia} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{DIAS_SEMANA[dia.toLowerCase()] || dia}</span>
              <span className="font-medium text-foreground">{horario || "Fechado"}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
