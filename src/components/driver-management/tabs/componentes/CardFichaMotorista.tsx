import { ReactNode } from "react";

interface Props {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
}

/**
 * Card padronizado usado dentro das abas da ficha do motorista.
 * Mantém o mesmo visual de "Dados Cadastrais" (borda + título uppercase + conteúdo).
 */
export default function CardFichaMotorista({ titulo, acao, children }: Props) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {titulo}
        </h4>
        {acao}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
