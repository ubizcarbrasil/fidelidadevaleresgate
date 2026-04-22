import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { useHallDaFama } from "./hooks/hook_hall_fama";
import SecaoTitulosAcumulados from "./components/SecaoTitulosAcumulados";
import SecaoTemporadasFinalizadas from "./components/SecaoTemporadasFinalizadas";

/**
 * Página pública do Hall da Fama por marca.
 * Rota: /campeonato/:brandSlug/hall-da-fama
 * Acessível sem autenticação.
 */
export default function PaginaHallDaFama() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const { data, isLoading, error } = useHallDaFama(brandSlug);

  // SEO básico: title + meta description (padrão usado em outras rotas públicas)
  useEffect(() => {
    const brandName = data?.brand_name ?? "Campeonato";
    document.title = `Hall da Fama - ${brandName}`;
    const desc = `Veja os campeões e os títulos acumulados das temporadas do campeonato ${brandName}.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    // Open Graph
    const setOg = (prop: string, value: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    setOg("og:title", `Hall da Fama - ${brandName}`);
    setOg("og:description", desc);
    setOg("og:type", "website");
  }, [data?.brand_name]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center p-6 text-center">
        <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-bold">Hall da Fama indisponível</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Marca não encontrada ou sem campeonato configurado."}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Hall da Fama</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.brand_name}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-5">
        <SecaoTitulosAcumulados ranking={data.ranking_titles} />
        <SecaoTemporadasFinalizadas temporadas={data.seasons} />

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          Atualizado em tempo real conforme novas temporadas são finalizadas.
        </footer>
      </div>
    </main>
  );
}