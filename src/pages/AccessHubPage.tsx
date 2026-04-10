import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Globe, Users, Car, Store, MapPin, Search, LogIn, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SafeImage from "@/components/customer/SafeImage";
import EmptyState from "@/components/customer/EmptyState";

/* ═══════════════════════════════════════════
   Tipos internos
   ═══════════════════════════════════════════ */

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  subscription_status: string;
  brand_settings_json: Record<string, any> | null;
}

interface DomainRow {
  brand_id: string;
  domain: string;
  is_active: boolean;
}

interface BranchRow {
  id: string;
  name: string;
  is_active: boolean;
}

interface BranchCounts {
  clients: number;
  drivers: number;
  stores: number;
}

/* ═══════════════════════════════════════════
   Componentes auxiliares
   ═══════════════════════════════════════════ */

function DomainStatusBadge({ domain }: { domain?: string }) {
  if (domain) {
    return (
      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1 text-[11px]">
        <Globe className="h-3 w-3" />
        {domain}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive gap-1 text-[11px]">
      <Globe className="h-3 w-3" />
      Sem domínio
    </Badge>
  );
}

function SubscriptionBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]">Ativo</Badge>;
  }
  if (status === "trial") {
    return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[11px]">Trial</Badge>;
  }
  return <Badge variant="secondary" className="text-[11px]">Inativo</Badge>;
}

function StatCard({ icon: Icon, label, value, loading }: { icon: React.ElementType; label: string; value: number; loading?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loading ? <Skeleton className="h-6 w-12 mt-0.5" /> : <p className="text-lg font-bold">{value}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Hook: contadores por branch
   ═══════════════════════════════════════════ */

function useBranchCounts(branchId: string | undefined) {
  return useQuery({
    queryKey: ["branch-entity-counts", branchId],
    enabled: !!branchId,
    staleTime: 60_000,
    queryFn: async (): Promise<BranchCounts> => {
      const [clientsRes, driversRes, storesRes] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("branch_id", branchId!).not("name", "ilike", "%[MOTORISTA]%"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("branch_id", branchId!).ilike("name", "%[MOTORISTA]%"),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("branch_id", branchId!),
      ]);
      return {
        clients: clientsRes.count ?? 0,
        drivers: driversRes.count ?? 0,
        stores: storesRes.count ?? 0,
      };
    },
  });
}

/* ═══════════════════════════════════════════
   BranchEntityRow
   ═══════════════════════════════════════════ */

function BranchEntityRow({ branch }: { branch: BranchRow }) {
  const navigate = useNavigate();
  const { data: counts, isLoading } = useBranchCounts(branch.id);

  const counters = [
    { icon: Users, label: "clientes", value: counts?.clients ?? 0, path: `/customers?branchId=${branch.id}` },
    { icon: Car, label: "motoristas", value: counts?.drivers ?? 0, path: `/motoristas?branchId=${branch.id}` },
    { icon: Store, label: "parceiros", value: counts?.stores ?? 0, path: `/stores?branchId=${branch.id}` },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-2 rounded-lg hover:bg-accent/30 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm truncate">{branch.name}</span>
        {!branch.is_active && <Badge variant="secondary" className="text-[10px] shrink-0">Inativa</Badge>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {counters.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate(c.path)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <c.icon className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
            {isLoading ? <Skeleton className="h-4 w-6" /> : <span className="font-semibold">{c.value}</span>}
            <span className="hidden sm:inline">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BrandAccordionItem
   ═══════════════════════════════════════════ */

function BrandAccordionItem({ brand, domain, isRoot }: { brand: BrandRow; domain?: string; isRoot: boolean }) {
  const navigate = useNavigate();
  const logoUrl = (brand.brand_settings_json as any)?.logo_url as string | undefined;

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: queryKeys.branches.list(brand.id),
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name, is_active").eq("brand_id", brand.id).order("name");
      return (data ?? []) as BranchRow[];
    },
  });

  return (
    <AccordionItem value={brand.id} className="border rounded-xl mb-3 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/20 [&[data-state=open]]:bg-accent/10">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-2 flex-wrap">
          <SafeImage
            src={logoUrl}
            alt={brand.name}
            preset="thumbnail"
            className="h-8 w-8 rounded-lg object-cover shrink-0"
            fallback={<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div>}
          />
          <span className="font-semibold text-sm truncate">{brand.name}</span>
          <DomainStatusBadge domain={domain} />
          <SubscriptionBadge status={brand.subscription_status} />
          <span className="text-[11px] text-muted-foreground hidden lg:inline">
            {branches.length} cidades
          </span>
          {isRoot && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/?brandId=${brand.id}`); }}
              className="ml-auto flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" /> Entrar
            </button>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {branchesLoading ? (
          <div className="space-y-2 pt-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : branches.length === 0 ? (
          <EmptyState type="generic" title="Nenhuma cidade cadastrada" description="Crie a primeira cidade para esta marca." ctaLabel="Criar cidade" onCta={() => navigate("/branches")} />
        ) : (
          <div className="divide-y divide-border/40">
            {branches.map((b) => <BranchEntityRow key={b.id} branch={b} />)}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

/* ═══════════════════════════════════════════
   RootAccessHub
   ═══════════════════════════════════════════ */

function RootAccessHub() {
  const [search, setSearch] = useState("");

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name, slug, is_active, subscription_status, brand_settings_json").order("name");
      return (data ?? []) as BrandRow[];
    },
  });

  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: queryKeys.brandDomains.all,
    queryFn: async () => {
      const { data } = await supabase.from("brand_domains").select("brand_id, domain, is_active");
      return (data ?? []) as DomainRow[];
    },
  });

  const domainMap = useMemo(() => {
    const map: Record<string, string> = {};
    domains.filter((d) => d.is_active).forEach((d) => { map[d.brand_id] = d.domain; });
    return map;
  }, [domains]);

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  const loading = brandsLoading || domainsLoading;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Marcas" value={brands.length} loading={loading} />
        <StatCard icon={MapPin} label="Domínios ativos" value={domains.filter((d) => d.is_active).length} loading={loading} />
        <StatCard icon={Globe} label="Com domínio" value={Object.keys(domainMap).length} loading={loading} />
        <StatCard icon={Building2} label="Sem domínio" value={brands.length - Object.keys(domainMap).length} loading={loading} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState type="search" title="Nenhuma marca encontrada" description={`Sem resultados para "${search}".`} />
        ) : (
          <EmptyState type="generic" title="Nenhuma marca cadastrada" ctaLabel="Criar primeira marca" onCta={() => {}} />
        )
      ) : (
        <Accordion type="multiple" className="space-y-0">
          {filtered.map((b) => (
            <BrandAccordionItem key={b.id} brand={b} domain={domainMap[b.id]} isRoot />
          ))}
        </Accordion>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BrandAccessHub
   ═══════════════════════════════════════════ */

function BrandAccessHub() {
  const navigate = useNavigate();
  const { brand } = useBrand();
  const { currentBrandId } = useBrandGuard();
  const brandId = currentBrandId ?? brand?.id;

  const { data: domains = [] } = useQuery({
    queryKey: queryKeys.brandDomains.list(brandId ?? ""),
    enabled: !!brandId,
    queryFn: async () => {
      const { data } = await supabase.from("brand_domains").select("brand_id, domain, is_active").eq("brand_id", brandId!);
      return (data ?? []) as DomainRow[];
    },
  });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: queryKeys.branches.list(brandId ?? ""),
    enabled: !!brandId,
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name, is_active").eq("brand_id", brandId!).order("name");
      return (data ?? []) as BranchRow[];
    },
  });

  const activeDomain = domains.find((d) => d.is_active)?.domain;

  return (
    <div className="space-y-6">
      {!activeDomain && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Configure seu domínio white-label</p>
            <p className="text-xs text-muted-foreground mt-0.5">Seus clientes acessarão pelo seu próprio endereço personalizado.</p>
          </div>
          <button onClick={() => navigate("/brand-domains")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
            Configurar agora
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold">{brand?.name ?? "Minha Marca"}</span>
        <DomainStatusBadge domain={activeDomain} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      ) : branches.length === 0 ? (
        <EmptyState type="generic" title="Nenhuma cidade cadastrada" description="Crie sua primeira cidade para começar a operar." ctaLabel="Criar primeira cidade" onCta={() => navigate("/branches")} />
      ) : (
        <div className="divide-y divide-border/40 rounded-xl border bg-card p-2">
          {branches.map((b) => <BranchEntityRow key={b.id} branch={b} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Página principal
   ═══════════════════════════════════════════ */

export default function AccessHubPage() {
  const { consoleScope } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Central de Acessos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isRoot ? "Visão global de todas as marcas e cidades" : "Gerencie suas cidades e acessos"}
        </p>
      </div>
      {isRoot ? <RootAccessHub /> : <BrandAccessHub />}
    </div>
  );
}
