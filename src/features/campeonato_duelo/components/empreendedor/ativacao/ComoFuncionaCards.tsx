import { Layers, Swords, Crown } from "lucide-react";

const ITENS = [
  {
    icone: Layers,
    titulo: "Séries hierárquicas",
    descricao:
      "Motoristas competem em séries A, B, C… com pares do mesmo nível.",
  },
  {
    icone: Swords,
    titulo: "Classificação + Mata-mata",
    descricao:
      "Fase de pontos seguida de duelos eliminatórios até a grande final.",
  },
  {
    icone: Crown,
    titulo: "Hall da Fama público",
    descricao:
      "Vencedores aparecem na vitrine da marca, gerando reconhecimento.",
  },
] as const;

export default function ComoFuncionaCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ITENS.map(({ icone: Icone, titulo, descricao }) => (
        <div
          key={titulo}
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <Icone className="h-4.5 w-4.5 text-primary" />
          </div>
          <p className="mt-3 text-sm font-semibold">{titulo}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        </div>
      ))}
    </div>
  );
}