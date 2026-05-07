import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Tag } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import DriverBannerCarousel from "@/components/driver/DriverBannerCarousel";
import DriverCategoryPage from "@/components/driver/DriverCategoryPage";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";
import { shareDriverUrl } from "@/lib/publicShareUrl";
import CabecalhoOfertas from "./components/cabecalho_ofertas";
import GradeCategoriasOfertas from "./components/grade_categorias_ofertas";
import VitrineOfertas from "./components/vitrine_ofertas";
import { useMarcaOfertas } from "./hooks/hook_marca_ofertas";
import { useOfertasPublicas } from "./hooks/hook_ofertas_publicas";
import type { CategoriaOferta, OfertaPublica } from "./types/tipos_ofertas";

const JANELA_NOVAS_OFERTAS_MS = 48 * 60 * 60 * 1000;

export default function PaginaUbizOfertas() {
  const { brandId, marca, carregando: carregandoMarca, erro } = useMarcaOfertas();
  const settings = (marca?.brand_settings_json || {}) as Record<string, any>;
  const theme = settings.theme || null;
  useBrandTheme(theme);

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const logoUrl = settings.logo_url as string | undefined;
  const titulo = (settings.ubiz_ofertas_title as string) || marca?.name || "Ubiz Ofertas";
  const habilitado = settings.enable_ubiz_ofertas_mode === true;

  const { ofertas, categorias, carregando: carregandoOfertas } = useOfertasPublicas(habilitado ? brandId : null);

  const [categoriaAberta, setCategoriaAberta] = useState<CategoriaOferta | null>(null);
  const [ofertaAberta, setOfertaAberta] = useState<OfertaPublica | null>(null);

  // Title da aba
  useEffect(() => {
    if (marca?.name) document.title = `${titulo}`;
  }, [marca, titulo]);

  const novasOfertas = useMemo(() => {
    const limite = Date.now() - JANELA_NOVAS_OFERTAS_MS;
    return ofertas
      .filter((d) => d.created_at && new Date(d.created_at).getTime() > limite)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }, [ofertas]);

  const ofertasDestaque = useMemo(() => ofertas.filter((d) => d.is_featured), [ofertas]);

  const categoriasComOfertas = useMemo(() => {
    const ids = new Set(ofertas.map((d) => d.category_id).filter(Boolean));
    return categorias.filter((c) => ids.has(c.id));
  }, [categorias, ofertas]);

  if (carregandoMarca) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (erro || !marca) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground text-center">{erro || "Não foi possível carregar"}</p>
      </div>
    );
  }

  if (!habilitado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: fontHeading }}>
            Vitrine indisponível
          </h1>
          <p className="text-sm text-muted-foreground">
            O modo Ubiz Ofertas não está ativo para esta marca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto pb-8 space-y-4">
        <CabecalhoOfertas
          logoUrl={logoUrl}
          titulo={titulo}
          fontHeading={fontHeading}
          onCompartilhar={() => shareDriverUrl(marca.id, titulo)}
        />

        <DriverBannerCarousel brandId={marca.id} />

        <GradeCategoriasOfertas
          categorias={categoriasComOfertas}
          fontHeading={fontHeading}
          onSelecionar={(cat) => setCategoriaAberta(cat)}
        />

        {carregandoOfertas && ofertas.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {ofertasDestaque.length > 0 && (
              <VitrineOfertas
                titulo="Em Destaque"
                subtitulo={`${ofertasDestaque.length} oferta${ofertasDestaque.length !== 1 ? "s" : ""}`}
                icone={
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
                  >
                    <Tag className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                }
                ofertas={ofertasDestaque}
                fontHeading={fontHeading}
                onClickOferta={(o) => setOfertaAberta(o)}
              />
            )}

            {novasOfertas.length > 0 && (
              <VitrineOfertas
                titulo="Novas Ofertas"
                subtitulo={`${novasOfertas.length} nova${novasOfertas.length !== 1 ? "s" : ""}`}
                icone={
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#f59e0b20" }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: "#f59e0b" }} />
                  </div>
                }
                ofertas={novasOfertas}
                fontHeading={fontHeading}
                onClickOferta={(o) => setOfertaAberta(o)}
              />
            )}

            {ofertas.length > 0 && (
              <VitrineOfertas
                titulo="Todas as ofertas"
                ofertas={ofertas}
                fontHeading={fontHeading}
                onClickOferta={(o) => setOfertaAberta(o)}
              />
            )}
          </>
        )}

        {theme?.footer_text && (
          <div className="text-center py-8 text-xs text-foreground/30 px-4">{theme.footer_text}</div>
        )}
      </div>

      {categoriaAberta && (
        <DriverCategoryPage
          category={categoriaAberta as any}
          brandId={marca.id}
          branchId={null}
          customerId={null}
          fontHeading={fontHeading}
          brandSettings={settings}
          theme={theme}
          onBack={() => setCategoriaAberta(null)}
        />
      )}

      {ofertaAberta && (
        <AchadinhoDealDetail
          deal={{ ...ofertaAberta, is_redeemable: false, redeem_points_cost: null } as any}
          brandId={marca.id}
          branchId={null}
          customerId={null}
          theme={theme}
          brandSettings={settings}
          onBack={() => setOfertaAberta(null)}
          onSelectDeal={(d) => setOfertaAberta(d as any)}
        />
      )}
    </div>
  );
}