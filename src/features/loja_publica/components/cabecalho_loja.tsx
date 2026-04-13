import PlatformLogo from "@/components/PlatformLogo";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CabecalhoLojaProps {
  nome: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  segmento: string | null;
  categoria: string | null;
  descricao: string | null;
}

export default function CabecalhoLoja({ nome, logoUrl, bannerUrl, segmento, categoria, descricao }: CabecalhoLojaProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Banner */}
      {bannerUrl && (
        <div className="w-full h-40 sm:h-56 rounded-xl overflow-hidden">
          <img src={bannerUrl} alt={`Banner ${nome}`} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Logo + Name */}
      <div className="flex items-center gap-4">
        <PlatformLogo
          src={logoUrl}
          alt={nome}
          className="h-16 w-16 rounded-xl shadow-md"
          fallbackLabel={nome?.substring(0, 2).toUpperCase()}
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">{nome}</h1>
          <div className="flex gap-2 flex-wrap">
            {segmento && <Badge variant="secondary">{segmento}</Badge>}
            {categoria && <Badge variant="outline">{categoria}</Badge>}
          </div>
        </div>
      </div>

      {/* Description */}
      {descricao && (
        <p className="text-muted-foreground leading-relaxed">{descricao}</p>
      )}
    </div>
  );
}
