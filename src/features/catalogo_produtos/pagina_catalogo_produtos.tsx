import { Link } from "react-router-dom";
import { useProdutosPublicos } from "@/features/produtos_comerciais/hooks/hook_produtos_comerciais";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Star, Package } from "lucide-react";
import PlatformLogo from "@/components/PlatformLogo";

export default function PaginaCatalogoProdutos() {
  const { data: produtos, isLoading } = useProdutosPublicos();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <PlatformLogo className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-bold">Vale Resgate</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
      </header>

      <section className="px-4 py-12 text-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Escolha o produto ideal para o seu negócio
          </h1>
          <p className="text-lg text-muted-foreground">
            Cada produto é um pacote completo com modelos, funcionalidades e preço fixo.
            Comece com {30} dias grátis.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (produtos ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <Package className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum produto disponível no catálogo público no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(produtos ?? []).map((p) => {
              const color = p.landing_config_json.primary_color || "hsl(var(--primary))";
              return (
                <Card
                  key={p.id}
                  className={p.is_popular ? "border-primary/40 shadow-lg" : ""}
                >
                  <CardContent className="pt-6 space-y-4">
                    {p.is_popular && (
                      <Badge style={{ backgroundColor: color, color: "#fff" }}>
                        <Star className="h-3 w-3 mr-1" />
                        Mais popular
                      </Badge>
                    )}
                    <h2 className="text-lg font-bold">{p.product_name}</h2>
                    {p.landing_config_json.subheadline && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {p.landing_config_json.subheadline}
                      </p>
                    )}
                    <div>
                      <p className="text-3xl font-extrabold" style={{ color }}>
                        R$ {(p.price_cents / 100).toFixed(2).replace(".", ",")}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full gap-2"
                      style={{ backgroundColor: color, color: "#fff" }}
                    >
                      <Link to={`/p/produto/${p.slug}`}>
                        Ver detalhes
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
