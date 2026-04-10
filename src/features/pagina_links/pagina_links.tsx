import { useState, useEffect, useCallback, useMemo } from "react";
import { Shield, Building2, MapPin, Store, Car, Smartphone, LogIn, ExternalLink, Info, Loader2, Copy, Check, Filter } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

import { getPublicOriginSync } from "@/lib/publicShareUrl";

const getBaseUrl = () => window.location.origin;

interface LinkCard {
  titulo: string;
  descricao: string;
  rota: string;
  icone: React.ElementType;
  cor: string;
  nota?: string;
  brandId?: string;
}

interface CategoriaLinks {
  titulo: string;
  cards: LinkCard[];
}

interface Brand { id: string; name: string }
interface Branch { id: string; name: string; brand_id: string }
interface StoreRow { id: string; name: string; branch_id: string; brand_id: string }

function construirCategorias(brands: Brand[], branches: Branch[], stores: StoreRow[]): CategoriaLinks[] {
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]));

  return [
    {
      titulo: "Painéis Administrativos",
      cards: [
        {
          titulo: "Painel Raiz",
          descricao: "Acesso administrativo root — gerencia tenants, brands e configurações globais.",
          rota: "/",
          icone: Shield,
          cor: "from-red-500/20 to-red-600/10 border-red-500/30",
        },
        {
          titulo: "Painel Empreendedor",
          descricao: "Dashboard do brand_admin — gerencia lojas, ofertas, clientes e campanhas.",
          rota: "/",
          icone: Building2,
          cor: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
          nota: "O painel exibido depende do nível de acesso do usuário logado.",
        },
      ],
    },
    {
      titulo: "Painéis Operacionais — Cidade",
      cards: branches.map((branch) => ({
        titulo: `Cidade — ${branch.name}`,
        descricao: `Dashboard da cidade ${branch.name} (${brandMap[branch.brand_id] || "Brand"}).`,
        rota: `/?branchId=${branch.id}`,
        icone: MapPin,
        cor: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
        brandId: branch.brand_id,
      })),
    },
    {
      titulo: "Painéis Operacionais — Parceiro",
      cards: stores.slice(0, 12).map((store) => ({
        titulo: `Parceiro — ${store.name}`,
        descricao: `Painel da loja ${store.name}.`,
        rota: `/store-panel?storeId=${store.id}`,
        icone: Store,
        cor: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
        brandId: store.brand_id,
      })),
    },
    {
      titulo: "Painéis Operacionais — Motorista",
      cards: brands.map((brand) => ({
        titulo: `Motorista — ${brand.name}`,
        descricao: `Painel do motorista na brand ${brand.name}.`,
        rota: `/driver?brandId=${brand.id}`,
        icone: Car,
        cor: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
        brandId: brand.id,
      })),
    },
    {
      titulo: "Aplicativos",
      cards: brands.map((brand) => ({
        titulo: `App Cliente — ${brand.name}`,
        descricao: `Visualização do app do consumidor na brand ${brand.name}.`,
        rota: `/customer-preview?brandId=${brand.id}`,
        icone: Smartphone,
        cor: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
        brandId: brand.id,
      })),
    },
    {
      titulo: "Autenticação",
      cards: [
        {
          titulo: "Login",
          descricao: "Tela de autenticação — acesso para administradores, empreendedores e lojistas.",
          rota: "/auth",
          icone: LogIn,
          cor: "from-gray-500/20 to-gray-600/10 border-gray-500/30",
        },
      ],
    },
  ];
}

function BotaoCopiar({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiado(false), 2000);
    });
  }, [url]);

  return (
    <button
      onClick={copiar}
      className="shrink-0 rounded-md bg-muted/80 p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title="Copiar link"
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function PaginaLinks() {
  const [categorias, setCategorias] = useState<CategoriaLinks[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroMarca, setFiltroMarca] = useState<string>("all");

  useEffect(() => {
    async function buscarDados() {
      const [brandsRes, branchesRes, storesRes] = await Promise.all([
        supabase.from("brands").select("id, name").eq("is_active", true).order("name"),
        supabase.from("branches").select("id, name, brand_id").eq("is_active", true).order("name"),
        supabase.from("stores").select("id, name, branch_id, brand_id").eq("is_active", true).eq("approval_status", "APPROVED").order("name").limit(50),
      ]);

      const brandsData = (brandsRes.data || []) as Brand[];
      const branches = (branchesRes.data || []) as Branch[];
      const stores = (storesRes.data || []) as StoreRow[];

      setBrands(brandsData);
      setCategorias(construirCategorias(brandsData, branches, stores));
      setCarregando(false);
    }
    buscarDados();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    if (filtroMarca === "all") return categorias;
    return categorias
      .map((cat) => ({
        ...cat,
        cards: cat.cards.filter((card) => !card.brandId || card.brandId === filtroMarca),
      }))
      .filter((cat) => cat.cards.length > 0);
  }, [categorias, filtroMarca]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Central de Acessos
          </h1>
          <p className="mt-2 text-muted-foreground">
            Fidelidade Vale Resgate — Links diretos para todos os painéis
          </p>
        </div>

        {/* Filtro por marca */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroMarca} onValueChange={setFiltroMarca}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filtrar por marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtroMarca !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setFiltroMarca("all")}>
              Limpar filtro ✕
            </Badge>
          )}
        </div>

        <div className="space-y-10">
          {categoriasFiltradas.map((cat) => (
            <section key={cat.titulo}>
              <h2 className="mb-4 text-lg font-semibold text-muted-foreground tracking-wide uppercase text-center">
                {cat.titulo}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.cards.map((card) => {
                  const Icone = card.icone;
                  const urlCompleta = `${getBaseUrl()}${card.rota}`;
                  return (
                    <a
                      key={card.titulo + card.rota}
                      href={urlCompleta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <Card className={`h-full border bg-gradient-to-br ${card.cor} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}>
                        <CardContent className="flex flex-col gap-3 p-5">
                          <div className="flex items-center gap-3">
                            <Icone className="h-6 w-6 shrink-0 text-foreground/80" />
                            <span className="text-base font-semibold leading-tight">{card.titulo}</span>
                            <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {card.descricao}
                          </p>
                          {card.nota && (
                            <div className="flex items-start gap-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{card.nota}</span>
                            </div>
                          )}
                          <div className="mt-auto flex items-center gap-2">
                            <code className="block flex-1 truncate rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                              {card.rota}
                            </code>
                            <BotaoCopiar url={urlCompleta} />
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
