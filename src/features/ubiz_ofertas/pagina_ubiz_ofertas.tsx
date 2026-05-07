import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles, Tag } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import DriverBannerCarousel from "@/components/driver/DriverBannerCarousel";
import AchadinhoDealDetail from "@/components/customer/AchadinhoDealDetail";
import { shareDriverUrl } from "@/lib/publicShareUrl";
import CabecalhoOfertas from "./components/cabecalho_ofertas";
import GradeCategoriasOfertas from "./components/grade_categorias_ofertas";
import VitrineOfertas from "./components/vitrine_ofertas";
import GradeTodasOfertas from "./components/grade_todas_ofertas";
import SecoesPorCategoria from "./components/secoes_por_categoria";
import PortaoAcessoOfertas from "./components/portao_acesso_ofertas";
import type { ModoAcessoOfertas } from "./components/controle_acesso_ofertas";
import { useMarcaOfertas } from "./hooks/hook_marca_ofertas";
import { useOfertasPublicas } from "./hooks/hook_ofertas_publicas";
import type { OfertaPublica } from "./types/tipos_ofertas";

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
  const modoAcesso = (settings.ubiz_ofertas_access_mode as ModoAcessoOfertas) || "public";
  const whitelist = (settings.ubiz_ofertas_whitelist as string[]) || [];

  const { ofertas, categorias, carregando: carregandoOfertas } = useOfertasPublicas(habilitado ? brandId : null);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaSelecionadaId = searchParams.get("categoria");
  const setCategoriaSelecionadaId = (id: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("categoria", id);
        else next.delete("categoria");
        return next;
      },
      { replace: true }
    );
  };
  const [ofertaAberta, setOfertaAberta] = useState<OfertaPublica | null>(null);

  // Title da aba
  useEffect(() => {
    if (marca?.name) document.title = `${titulo}`;
  }, [marca, titulo]);

  const ofertasFiltradas = useMemo(() => {
    if (!categoriaSelecionadaId) return ofertas;
    return ofertas.filter((d) => d.category_id === categoriaSelecionadaId);
  }, [ofertas, categoriaSelecionadaId]);

  const novasOfertas = useMemo(() => {
    const limite = Date.now() - JANELA_NOVAS_OFERTAS_MS;
    return ofertasFiltradas
      .filter((d) => d.created_at && new Date(d.created_at).getTime() > limite)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }, [ofertasFiltradas]);

  const ofertasDestaque = useMemo(() => ofertasFiltradas.filter((d) => d.is_featured), [ofertasFiltradas]);

  const categoriasComOfertas = useMemo(() => {
    const ids = new Set(ofertas.map((d) => d.category_id).filter(Boolean));
    return categorias.filter((c) => ids.has(c.id));
  }, [categorias, ofertas]);

  const categoriaAtiva = useMemo(
    () => (categoriaSelecionadaId ? categorias.find((c) => c.id === categoriaSelecionadaId) ?? null : null),
    [categorias, categoriaSelecionadaId],
  );

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
    <PortaoAcessoOfertas modo={modoAcesso} whitelist={whitelist} fontHeading={fontHeading}>
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
          selecionadaId={categoriaSelecionadaId}
          onSelecionar={(id) => setCategoriaSelecionadaId(id)}
        />

        {carregandoOfertas && ofertas.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : categoriaAtiva ? (
          <>
            <div className="px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${categoriaAtiva.color}20` }}
                >
                  <Tag className="h-4 w-4" style={{ color: categoriaAtiva.color }} />
                </div>
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                  {categoriaAtiva.name}
                </h2>
              </div>
              <button
                onClick={() => setCategoriaSelecionadaId(null)}
                className="text-xs font-semibold flex items-center gap-1 text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Mostrar todas
              </button>
            </div>
            {ofertasFiltradas.length > 0 ? (
              <GradeTodasOfertas
                titulo="Ofertas da categoria"
                ofertas={ofertasFiltradas}
                fontHeading={fontHeading}
                onClickOferta={(o) => setOfertaAberta(o)}
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12 px-4">
                Nenhuma oferta nesta categoria.
              </p>
            )}
          </>
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

            <SecoesPorCategoria
              categorias={categoriasComOfertas}
              ofertas={ofertas}
              fontHeading={fontHeading}
              onClickOferta={(o) => setOfertaAberta(o)}
              onSelecionarCategoria={(id) => setCategoriaSelecionadaId(id)}
            />

            {ofertas.length > 0 && (
              <GradeTodasOfertas
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
    </PortaoAcessoOfertas>
  );
}