import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import {
  TEMPLATES_CAMPEONATO,
} from "../../constants/constantes_templates";
import type { TemplateKey } from "../../types/tipos_empreendedor";

interface Props {
  valor: TemplateKey;
  aoMudar: (k: TemplateKey) => void;
}

export default function SeletorTemplate({ valor, aoMudar }: Props) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {TEMPLATES_CAMPEONATO.map((t) => {
        const ativo = t.key === valor;
        return (
          <Card
            key={t.key}
            role="button"
            tabIndex={0}
            onClick={() => aoMudar(t.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") aoMudar(t.key);
            }}
            className={`cursor-pointer p-3 transition-all ${
              ativo
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t.label}</span>
              {ativo && (
                <Badge variant="secondary" className="ml-auto h-5">
                  Selecionado
                </Badge>
              )}
            </div>
            <p className="text-xs leading-snug text-muted-foreground">
              {t.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {t.series.map((s) => (
                <Badge key={s.name} variant="outline" className="text-[10px]">
                  {s.name}
                </Badge>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
