import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, ArrowRight, Info } from "lucide-react";

/**
 * Página depreciada — Caminho B aprovado pelo usuário em 2026-04-18.
 *
 * Motivo: a tela de "Permissão de Parceiros" gravava em `brand_permission_config`
 * mas nenhum hook do projeto consumia essa tabela em runtime, então as alterações
 * feitas aqui nunca refletiam no painel do empreendedor (bug invisível).
 *
 * Decisão: o controle real de visibilidade do painel do empreendedor é feito
 * pela **Central de Módulos** (`/admin/central-modulos` para o raiz e
 * `/brand-modules` para o empreendedor), via tabela `brand_modules`.
 *
 * Esta rota fica preservada (entradas em `brand_permission_config` permanecem
 * intactas) para futura ativação caso o sistema de permissões granulares seja
 * conectado ao runtime (Caminho A do diagnóstico).
 */
export default function BrandPermissionOverflowPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Permissão de Parceiros</h1>
          <p className="text-sm text-muted-foreground">Tela depreciada</p>
        </div>
      </div>

      <Alert className="mb-6 border-amber-500/50 bg-amber-500/5">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Esta tela foi descontinuada</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          O controle de funcionalidades visíveis para o empreendedor agora é feito
          exclusivamente pela <strong>Central de Módulos</strong>. As alterações
          feitas nesta tela não tinham efeito no painel do empreendedor.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold">Para onde fui?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use a <strong>Central de Módulos</strong> para ativar ou desativar
              funcionalidades de cada marca. É a fonte oficial e única do que
              aparece no menu do empreendedor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={() => navigate("/admin/central-modulos")}
              className="gap-2"
            >
              Ir para a Central de Módulos
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Voltar
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Dados preservados:</strong> nenhuma configuração foi apagada.
              As entradas anteriores permanecem armazenadas e poderão ser
              reaproveitadas se o sistema de permissões granulares for ativado
              no futuro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
