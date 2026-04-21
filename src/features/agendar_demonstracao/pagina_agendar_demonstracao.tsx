import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProdutoPorSlug } from "@/features/produtos_comerciais/hooks/hook_produtos_comerciais";
import BlocoTopbarDemo from "./components/bloco_topbar_demo";
import BlocoHeaderDemo from "./components/bloco_header_demo";
import FormularioAgendarDemo from "./components/formulario_agendar_demo";
import BlocoResumoProduto from "./components/bloco_resumo_produto";
import BlocoSucessoDemo from "./components/bloco_sucesso_demo";
import { useSubmeterLead } from "./hooks/hook_submeter_lead";
import type { FormularioAgendarDemo as FormData } from "./schemas/schema_agendar_demo";

export default function PaginaAgendarDemonstracao() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [enviado, setEnviado] = useState(false);
  const [canalEscolhido, setCanalEscolhido] = useState("whatsapp");

  const { data: produto, isLoading } = useProdutoPorSlug(slug);
  const submeter = useSubmeterLead();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!produto || !produto.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center space-y-3">
            <h1 className="text-xl font-bold">Produto não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O link que você acessou não está disponível ou foi desativado.
            </p>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lc = produto.landing_config_json;
  const color = lc.primary_color || "#6366f1";
  const voltarUrl = `/p/produto/${produto.slug}`;
  const source = searchParams.get("source") || "landing_produto";

  const handleSubmit = async (data: FormData) => {
    setCanalEscolhido(data.preferred_contact);
    try {
      await submeter.mutateAsync({
        ...data,
        product_id: produto.id,
        product_slug: produto.slug,
        product_name: produto.product_name,
        source,
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
        utm_term: searchParams.get("utm_term"),
        utm_content: searchParams.get("utm_content"),
      });
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar solicitação. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BlocoTopbarDemo voltarUrl={voltarUrl} />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-14">
        {enviado ? (
          <div className="max-w-2xl mx-auto">
            <BlocoSucessoDemo
              productName={produto.product_name}
              voltarUrl={voltarUrl}
              canalEscolhido={canalEscolhido}
              primaryColor={color}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
            <div className="lg:col-span-3 space-y-8">
              <BlocoHeaderDemo productName={produto.product_name} primaryColor={color} />
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <FormularioAgendarDemo
                    primaryColor={color}
                    enviando={submeter.isPending}
                    onSubmit={handleSubmit}
                  />
                </CardContent>
              </Card>
            </div>

            <aside className="lg:col-span-2">
              <div className="lg:sticky lg:top-20">
                <BlocoResumoProduto
                  productName={produto.product_name}
                  eyebrow={lc.eyebrow}
                  primaryColor={color}
                  isPopular={produto.is_popular}
                />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}