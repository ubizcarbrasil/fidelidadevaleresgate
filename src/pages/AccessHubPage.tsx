import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Search,
  Building2,
  Smartphone,
  ChevronRight,
  Globe,
  AlertCircle,
  MapPin,
  Users,
  Car,
  Store,
  ExternalLink,
} from "lucide-react";

/* ─── Types ─── */
interface BrandRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  subscription_status: string;
}

interface DomainRow {
  brand_id: string;
  domain: string;
  is_active: boolean;
  is_primary: boolean;
}

interface BranchRow {
  id: string;
  name: string;
  city: string | null;
  brand_id: string;
  is_active: boolean;
}

interface BranchCounts {
  customers: number;
  stores: number;
}

/* ─── Helpers ─── */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function DomainBadge({ domain, isActive }: { domain: string; isActive: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Globe className="h-3 w-3 text-muted-foreground" />
      <span className={isActive ? "text-foreground" : "text-muted-foreground line-through"}>
        {domain}
      </span>
    </span>
  );
}

/* ─── Branch counts loader ─── */
async function loadBranchCounts(branchId: string): Promise<BranchCounts> {
  const [customersRes, storesRes] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
  ]);
  return {
    customers: customersRes.count ?? 0,
    stores: storesRes.count ?? 0,
  };
}

/* ─── Branch Expandable Row ─── */
function BranchExpandableRow({ branch }: { branch: BranchRow }) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<BranchCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const handleToggle = async () => {
    if (!open && !counts) {
      setLoadingCounts(true);
      const c = await loadBranchCounts(branch.id);
      setCounts(c);
      setLoadingCounts(false);
    }
    setOpen(!open);
  };

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{branch.name}</p>
              {branch.city && (
                <p className="text-xs text-muted-foreground">{branch.city}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge active={branch.is_active} />
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-7 mt-2 space-y-2">
          {loadingCounts ? (
            <div className="flex gap-3">
              <Skeleton className="h-16 w-32 rounded-lg" />
              <Skeleton className="h-16 w-32 rounded-lg" />
              <Skeleton className="h-16 w-32 rounded-lg" />
            </div>
          ) : counts ? (
            <div className="flex flex-wrap gap-3">
              <CountCard icon={Users} label="Clientes" count={counts.customers} />
              <CountCard icon={Store} label="Parceiros" count={counts.stores} />
            </div>
          ) : null}
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                window.location.href = `/?branchId=${branch.id}`;
              }}
            >
              <Building2 className="h-3.5 w-3.5" />
              Painel da Cidade
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CountCard({ icon: Icon, label, count }: { icon: typeof Users; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 min-w-[120px]">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-lg font-bold leading-none">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ─── Brand Card with expandable branches ─── */
function BrandCard({
  brand,
  domains,
}: {
  brand: BrandRow;
  domains: DomainRow[];
}) {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const brandDomains = domains.filter((d) => d.brand_id === brand.id);
  const primaryDomain = brandDomains.find((d) => d.is_primary);

  const handleToggle = async () => {
    if (!open && branches.length === 0) {
      setLoadingBranches(true);
      const { data } = await supabase
        .from("branches")
        .select("id, name, city, brand_id, is_active")
        .eq("brand_id", brand.id)
        .order("name");
      setBranches(data || []);
      setLoadingBranches(false);
    }
    setOpen(!open);
  };

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 cursor-pointer transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{brand.name}</h3>
              <StatusBadge active={brand.is_active} />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">{brand.slug}</span>
              {primaryDomain ? (
                <DomainBadge domain={primaryDomain.domain} isActive={primaryDomain.is_active} />
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                  <AlertCircle className="h-3 w-3" />
                  Sem domínio
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 hidden sm:inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard?brandId=${brand.id}`;
              }}
            >
              <Building2 className="h-3.5 w-3.5" />
              Admin
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 hidden sm:inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/customer-preview?brandId=${brand.id}`;
              }}
            >
              <Smartphone className="h-3.5 w-3.5" />
              App
            </Button>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mt-2 space-y-2 pb-2">
          {/* Mobile action buttons */}
          <div className="flex gap-2 sm:hidden">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                window.location.href = `/dashboard?brandId=${brand.id}`;
              }}
            >
              <Building2 className="h-3.5 w-3.5" />
              Painel Admin
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                window.location.href = `/customer-preview?brandId=${brand.id}`;
              }}
            >
              <Smartphone className="h-3.5 w-3.5" />
              App
            </Button>
          </div>

          {/* Domain info */}
          {brandDomains.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {brandDomains.map((d) => (
                <DomainBadge key={d.domain} domain={d.domain} isActive={d.is_active} />
              ))}
            </div>
          )}

          {/* Branches */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground px-1 pt-1">Cidades</p>
            {loadingBranches ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : branches.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">Nenhuma cidade cadastrada.</p>
            ) : (
              branches.map((branch) => (
                <BranchExpandableRow key={branch.id} branch={branch} />
              ))
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ─── ROOT VIEW ─── */
function RootAccessHub() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      supabase
        .from("brands")
        .select("id, name, slug, is_active, subscription_status")
        .order("name"),
      supabase
        .from("brand_domains")
        .select("brand_id, domain, is_active, is_primary"),
    ]).then(([brandsRes, domainsRes]) => {
      setBrands(brandsRes.data || []);
      setDomains(domainsRes.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const semDominio = brands.filter(
    (b) => !domains.some((d) => d.brand_id === b.id && d.is_active)
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Marcas" value={brands.length} />
        <StatCard label="Ativas" value={brands.filter((b) => b.is_active).length} />
        <StatCard label="Com Domínio" value={brands.length - semDominio.length} />
        <StatCard label="Sem Domínio" value={semDominio.length} variant="warning" />
      </div>

      {/* Alert for brands without domain */}
      {semDominio.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">
              {semDominio.length} marca(s) sem domínio próprio
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {semDominio.map((b) => b.name).join(", ")}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Brand list */}
      <div className="space-y-2">
        {filtered.map((brand) => (
          <BrandCard key={brand.id} brand={brand} domains={domains} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma marca encontrada.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── BRAND ADMIN VIEW ─── */
function BrandAccessHub({ brandId }: { brandId: string }) {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("branches")
        .select("id, name, city, brand_id, is_active")
        .eq("brand_id", brandId)
        .order("name"),
      supabase
        .from("brand_domains")
        .select("brand_id, domain, is_active, is_primary")
        .eq("brand_id", brandId),
    ]).then(([branchesRes, domainsRes]) => {
      setBranches(branchesRes.data || []);
      setDomains(domainsRes.data || []);
      setLoading(false);
    });
  }, [brandId]);

  const primaryDomain = domains.find((d) => d.is_primary && d.is_active);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Domain status */}
      <div className="rounded-lg border p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Domínio</p>
              {primaryDomain ? (
                <p className="text-xs text-muted-foreground">{primaryDomain.domain}</p>
              ) : (
                <p className="text-xs text-amber-500">Nenhum domínio configurado</p>
              )}
            </div>
          </div>
          {primaryDomain && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                window.open(`https://${primaryDomain.domain}`, "_blank")
              }
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Cidades" value={branches.length} />
        <StatCard label="Ativas" value={branches.filter((b) => b.is_active).length} />
        <StatCard label="Domínios" value={domains.length} />
      </div>

      {/* Branches */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Suas Cidades</p>
        {branches.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma cidade cadastrada.
          </p>
        ) : (
          branches.map((branch) => (
            <BranchExpandableRow key={branch.id} branch={branch} />
          ))
        )}
      </div>

      {/* Customer app */}
      <div className="rounded-lg border p-4 bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">App do Cliente</p>
            <p className="text-xs text-muted-foreground">
              Visualize como seus consumidores veem
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            window.open(`/customer-preview?brandId=${brandId}`, "_blank")
          }
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir
        </Button>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p
        className={`text-2xl font-bold ${
          variant === "warning" && value > 0 ? "text-amber-500" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ─── Main page ─── */
export default function AccessHubPage() {
  const { isRootAdmin } = useAuth();
  const { currentBrandId } = useBrandGuard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Acessos"
        description={
          isRootAdmin
            ? "Visão completa: Marcas → Cidades → Entidades"
            : "Suas cidades e acessos rápidos"
        }
      />

      {isRootAdmin ? (
        <RootAccessHub />
      ) : currentBrandId ? (
        <BrandAccessHub brandId={currentBrandId} />
      ) : (
        <p className="text-muted-foreground">
          Nenhuma marca vinculada encontrada.
        </p>
      )}
    </div>
  );
}
