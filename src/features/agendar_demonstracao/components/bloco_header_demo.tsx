import { Calendar, Clock } from "lucide-react";

interface Props {
  productName: string;
  primaryColor: string;
}

export default function BlocoHeaderDemo({ productName, primaryColor }: Props) {
  return (
    <div className="space-y-4">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide"
        style={{
          borderColor: `${primaryColor}66`,
          color: primaryColor,
          backgroundColor: `${primaryColor}14`,
        }}
      >
        <Calendar className="h-3 w-3" />
        Demonstração comercial · 30 minutos
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
        Agende uma demonstração do{" "}
        <span style={{ color: primaryColor }}>{productName}</span>
      </h1>
      <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
        Em 30 minutos você vê o produto rodando com dados reais do setor de mobilidade urbana e recebe uma proposta personalizada para sua operação.
      </p>
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Resposta do nosso time em até <strong className="text-foreground">1 dia útil</strong>
      </div>
    </div>
  );
}