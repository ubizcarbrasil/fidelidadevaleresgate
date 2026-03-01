import { useParams } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import CustomerLayout from "@/components/customer/CustomerLayout";
import PageRenderer from "@/components/page-builder-v2/PageRenderer";
import { Loader2 } from "lucide-react";

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const { brand, loading } = useBrand();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
