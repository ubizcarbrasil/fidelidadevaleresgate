import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { DiffTemplate } from "../types/tipos_diagnostico";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: DiffTemplate;
  produtoNome: string;
}

export default function DialogDiffTemplate({ open, onOpenChange, diff, produtoNome }: Props) {
  const tudoOk = diff.sobrando.length === 0 && diff.faltando.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diferenças entre marca e template</DialogTitle>
          <DialogDescription>
            Comparação dos módulos ativos da marca contra o template do produto{" "}
            <strong>{produtoNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        {tudoOk ? (
          <div className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Marca está exatamente alinhada com o template do produto.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <Section
              title="Sobrando na marca"
              hint="Estão ativos para a marca, mas não fazem parte do produto contratado."
              tone="warning"
              items={diff.sobrando.map((m) => ({ label: m.label, key: m.key }))}
            />
            <Section
              title="Faltando na marca"
              hint="Fazem parte do produto contratado, mas não estão ativos para esta marca."
              tone="info"
              items={diff.faltando.map((m) => ({ label: m.label, key: m.key }))}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SectionProps {
  title: string;
  hint: string;
  tone: "warning" | "info";
  items: Array<{ label: string; key: string }>;
}

function Section({ title, hint, tone, items }: SectionProps) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-blue-500/30 bg-blue-500/5";
  const iconClasses =
    tone === "warning" ? "text-amber-500" : "text-blue-500";

  return (
    <div className={`rounded-md border ${toneClasses} p-4 space-y-3`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={`h-4 w-4 mt-0.5 ${iconClasses}`} />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            {title}{" "}
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {items.length}
            </Badge>
          </p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic pl-6">Nenhum item.</p>
      ) : (
        <ul className="space-y-1 pl-6">
          {items.map((m) => (
            <li
              key={m.key}
              className="flex items-center justify-between text-sm border-l-2 border-border/60 pl-3 py-1"
            >
              <span>{m.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {m.key}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}