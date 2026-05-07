import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Settings, ArrowRight } from "lucide-react";
import LinkPublicoOfertas from "@/features/ubiz_ofertas/components/link_publico_ofertas";
import { useConfiguracaoUbizOfertas } from "../hooks/hook_configuracao_ubiz_ofertas";

interface Props {
  brandId: string;
}

export default function CardUbizOfertasDashboard({ brandId }: Props) {
  const navigate = useNavigate();
  const { config, brandName, carregando } = useConfiguracaoUbizOfertas(brandId);

  if (carregando) return null;

  if (!config.enable_ubiz_ofertas_mode) {
    return (
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm">Vitrine Pública Ubiz Ofertas</h3>
                <Badge variant="secondary" className="text-[10px] px-2 py-0">Inativa</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ative um link público com todas as ofertas dos Achadinhos para divulgar
                sem necessidade de login.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 w-full sm:w-auto"
            onClick={() => navigate("/ubiz-ofertas-admin")}
          >
            Ativar agora <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm">Vitrine Pública Ubiz Ofertas</h3>
              <Badge className="text-[10px] px-2 py-0">Ativa</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Compartilhe este link com seus clientes para acessarem a vitrine sem login.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => navigate("/ubiz-ofertas-admin")}
          >
            <Settings className="h-3.5 w-3.5" /> Configurar
          </Button>
        </div>
        <LinkPublicoOfertas
          brandId={brandId}
          titulo={config.ubiz_ofertas_title || brandName}
        />
      </CardContent>
    </Card>
  );
}