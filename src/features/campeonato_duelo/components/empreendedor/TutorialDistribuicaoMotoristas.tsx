import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MousePointerClick,
  CheckSquare,
  ArrowRightLeft,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tutorial_distribuir_motoristas_dispensado";

interface PassoTutorial {
  numero: number;
  titulo: string;
  descricao: string;
  icone: typeof MousePointerClick;
}

const PASSOS: PassoTutorial[] = [
  {
    numero: 1,
    titulo: "Localize os motoristas disponíveis",
    descricao:
      "A primeira coluna (azul) lista todos os motoristas elegíveis que ainda não estão em nenhuma série da temporada.",
    icone: MousePointerClick,
  },
  {
    numero: 2,
    titulo: "Selecione um ou vários motoristas",
    descricao:
      "Toque no checkbox de cada motorista na coluna 'Disponíveis' para escolher quem será movido. Use a busca para filtrar por nome.",
    icone: CheckSquare,
  },
  {
    numero: 3,
    titulo: "Mova para a Série A, B, C, D ou E",
    descricao:
      "Com motoristas selecionados, aparece uma barra no topo com botões 'Mover para Série A', 'B', 'C'… Toque na série de destino para enviar todos de uma vez.",
    icone: ArrowRightLeft,
  },
  {
    numero: 4,
    titulo: "Mover apenas 1 motorista (alternativa)",
    descricao:
      "Em qualquer cartão de motorista, use o botão 'Mover para…' para enviar individualmente. No desktop, você também pode arrastar e soltar entre as colunas.",
    icone: ArrowRightLeft,
  },
  {
    numero: 5,
    titulo: "Remover de uma série",
    descricao:
      "Para tirar um motorista da temporada, abra o cartão dele dentro da série e toque em 'Remover'. Ele volta para 'Disponíveis'.",
    icone: Trash2,
  },
];

export default function TutorialDistribuicaoMotoristas() {
  const [dispensado, setDispensado] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [aberto, setAberto] = useState<boolean>(true);

  function dispensarPermanente() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setDispensado(true);
  }

  if (dispensado) {
    return (
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
          }
          setDispensado(false);
          setAberto(true);
        }}
        className="flex items-center gap-1.5 self-start rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <GraduationCap className="h-3.5 w-3.5" />
        Ver tutorial novamente
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
        >
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">
            Como distribuir motoristas nas séries
          </p>
          <p className="text-[11px] text-muted-foreground">
            Tutorial em 5 passos rápidos.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? "Recolher tutorial" : "Expandir tutorial"}
        >
          {aberto ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={dispensarPermanente}
          aria-label="Dispensar tutorial"
          title="Não mostrar novamente"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {aberto && (
        <ol className="space-y-1.5 border-t border-primary/20 px-3 py-2.5">
          {PASSOS.map((passo) => {
            const Icone = passo.icone;
            return (
              <li key={passo.numero} className="flex gap-2.5">
                <div className="relative flex shrink-0 flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {passo.numero}
                  </div>
                </div>
                <div className="flex-1 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icone className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-medium text-foreground">
                      {passo.titulo}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {passo.descricao}
                  </p>
                </div>
              </li>
            );
          })}
          <li className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={dispensarPermanente}
            >
              Entendi, não mostrar novamente
            </Button>
          </li>
        </ol>
      )}
    </div>
  );
}