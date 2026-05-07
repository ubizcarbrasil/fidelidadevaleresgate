import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ShoppingCart, ArrowRight } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";
import { useConfiguracaoUbizOfertas } from "./hooks/hook_configuracao_ubiz_ofertas";
import SecaoConfiguracaoOfertas from "./components/secao_configuracao_ofertas";

export default function PaginaAdminUbizOfertas() {
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const { config, brandName, carregando, salvar } =
    useConfiguracaoUbizOfertas(currentBrandId);

  if (!currentBrandId) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <p className="text-sm text-muted-foreground">
          Selecione uma marca para configurar a vitrine Ubiz Ofertas.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight">
            Ubiz Ofertas — Vitrine Pública
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Compartilhe um link público com todas as ofertas dos Achadinhos, sem login,
            pontos ou WhatsApp.
          </p>
        </div>
      </div>

      {carregando ? (
        <TelaCarregamentoInline />
      ) : (
        <SecaoConfiguracaoOfertas
          brandId={currentBrandId}
          brandName={brandName}
          habilitado={config.enable_ubiz_ofertas_mode}
          titulo={config.ubiz_ofertas_title}
          modoAcesso={config.ubiz_ofertas_access_mode}
          whitelist={config.ubiz_ofertas_whitelist}
          onChange={(parcial) => salvar(parcial)}
        />
      )}

      <Card className="border-primary/20">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-0.5">
                Onde cadastro as ofertas?
              </h3>
              <p className="text-xs text-muted-foreground">
                A vitrine reaproveita as ofertas cadastradas em <strong>Achadinhos →
                Ofertas Afiliadas</strong>. Marque <em>Ativa</em> e <em>Visível para
                motoristas</em> para que apareçam na vitrine pública.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 w-full sm:w-auto"
            onClick={() => navigate("/affiliate-deals")}
          >
            Cadastrar ofertas <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}