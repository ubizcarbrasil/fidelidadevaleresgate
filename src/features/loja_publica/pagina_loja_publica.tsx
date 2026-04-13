import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { Loader2, Store } from "lucide-react";
import CabecalhoLoja from "./components/cabecalho_loja";
import InfoContatoLoja from "./components/info_contato_loja";
import HorarioFuncionamento from "./components/horario_funcionamento";
import GaleriaLoja from "./components/galeria_loja";
import FaqLoja from "./components/faq_loja";

export default function PaginaLojaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const { brand } = useBrand();

  const { data: loja, isLoading, error } = useQuery({
    queryKey: ["loja-publica", slug, brand?.id],
    queryFn: async () => {
      if (!slug || !brand?.id) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .eq("approval_status", "APPROVED")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug && !!brand?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6">
        <Store className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-xl font-semibold text-foreground">Loja não encontrada</h1>
        <p className="text-muted-foreground text-center max-w-md">
          A loja que você está procurando não existe ou não está disponível.
        </p>
        <a href="/" className="text-primary hover:underline text-sm">Voltar para o início</a>
      </div>
    );
  }

  const faqData = Array.isArray(loja.faq_json) ? loja.faq_json as { question: string; answer: string }[] : null;
  const horariosData = loja.operating_hours_json as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <CabecalhoLoja
          nome={loja.name}
          logoUrl={loja.logo_url}
          bannerUrl={loja.banner_url}
          segmento={loja.segment}
          categoria={loja.category}
          descricao={loja.description}
        />

        <InfoContatoLoja
          endereco={loja.address}
          telefone={loja.phone}
          whatsapp={loja.whatsapp}
          instagram={loja.instagram}
          siteUrl={loja.site_url}
        />

        <HorarioFuncionamento horarios={horariosData} />

        <GaleriaLoja fotos={loja.gallery_urls} />

        <FaqLoja faq={faqData} />
      </div>
    </div>
  );
}
