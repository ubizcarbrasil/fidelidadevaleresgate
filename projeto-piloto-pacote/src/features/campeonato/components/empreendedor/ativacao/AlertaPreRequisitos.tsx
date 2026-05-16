import { Info } from "lucide-react";

const ITENS = [
  "Não cancela sua operação atual — convive com a Pontuação Padrão.",
  "Motoristas precisam ter foto de perfil para se inscrever.",
  "Recomendado configurar prêmios antes de iniciar a 1ª temporada.",
] as const;

export default function AlertaPreRequisitos() {
  return (
    <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Antes de ativar
          </p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-amber-900/90 dark:text-amber-100/90">
            {ITENS.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}