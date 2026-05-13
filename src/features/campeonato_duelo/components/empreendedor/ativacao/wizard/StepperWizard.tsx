import { Check } from "lucide-react";

interface Props {
  passos: string[];
  passoAtual: number;
}

export default function StepperWizard({ passos, passoAtual }: Props) {
  return (
    <div className="flex items-center gap-2">
      {passos.map((label, idx) => {
        const concluido = idx < passoAtual;
        const ativo = idx === passoAtual;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                concluido
                  ? "border-primary bg-primary text-primary-foreground"
                  : ativo
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {concluido ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            <span
              className={`hidden text-xs sm:inline ${
                ativo ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {idx < passos.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  concluido ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}