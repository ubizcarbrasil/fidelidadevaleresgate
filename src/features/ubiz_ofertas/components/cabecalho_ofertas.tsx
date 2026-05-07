import { Share2 } from "lucide-react";

interface Props {
  logoUrl?: string;
  titulo: string;
  fontHeading?: string;
  onCompartilhar: () => void;
}

export default function CabecalhoOfertas({ logoUrl, titulo, fontHeading, onCompartilhar }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <div className="flex items-center gap-2.5 min-w-0">
        {logoUrl && <img src={logoUrl} alt={titulo} className="h-9 w-9 object-contain rounded-lg" />}
        <span
          className="font-extrabold text-[16px] tracking-tight text-foreground uppercase truncate"
          style={{ fontFamily: fontHeading }}
        >
          {titulo}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onCompartilhar}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted transition-transform active:scale-95"
          aria-label="Compartilhar"
        >
          <Share2 className="h-[18px] w-[18px] text-foreground" />
        </button>
      </div>
    </div>
  );
}