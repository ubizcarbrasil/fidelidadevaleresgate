import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function OfferCardConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const navigate = useNavigate();

  const goToThemeEditor = () => {
    if (currentBrandId) {
      navigate(`/brands/${currentBrandId}?tab=theme`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cards de Oferta"
        description="A configuração de cards e etiquetas agora está unificada no Editor de Tema da Marca."
      />
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <p className="text-sm text-muted-foreground max-w-md">
          Para manter tudo organizado, movemos a personalização de etiquetas, textos e badges dos cards de oferta para dentro do <strong>Editor de Tema</strong>.
          Lá você pode configurar tudo de uma vez e visualizar o resultado ao vivo.
        </p>
        <Button onClick={goToThemeEditor} className="gap-2">
          Ir para o Editor de Tema
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
