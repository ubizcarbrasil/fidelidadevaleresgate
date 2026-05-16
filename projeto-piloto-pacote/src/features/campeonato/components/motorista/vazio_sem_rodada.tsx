import { Construction } from "lucide-react";

interface Props {
  titulo?: string;
  descricao?: string;
}

export default function VazioSemRodada({
  titulo = "Nenhuma rodada disponível",
  descricao = "Os confrontos desta série ainda não foram gerados.",
}: Props) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
      <Construction className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm font-semibold mb-1">{titulo}</p>
      <p className="text-xs text-muted-foreground">{descricao}</p>
    </div>
  );
}