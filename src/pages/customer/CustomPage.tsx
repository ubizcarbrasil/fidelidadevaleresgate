import { useParams } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import CustomerLayout from "@/components/customer/CustomerLayout";
import PageRenderer from "@/components/page-builder-v2/PageRenderer";
import TelaCarregamento from "@/compartilhados/components/tela_carregamento";

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const { brand, loading } = useBrand();

  if (loading) {
    return <TelaCarregamento />;
  }

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <p>Página não encontrada</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background">
      <PageRenderer slug={slug} />
    </div>
  );
}
