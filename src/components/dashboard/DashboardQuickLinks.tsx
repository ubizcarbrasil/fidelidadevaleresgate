import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Building2, Store, ShoppingBag, Car, ExternalLink, Copy, LogIn,
  Globe, Eye, Smartphone, Search, Link2, Swords, Blocks,
} from "lucide-react";
import DemoStoresToggle from "@/components/DemoStoresToggle";
import DemoAccessCard from "@/components/dashboard/DemoAccessCard";
import { getPublicOrigin } from "@/lib/publicShareUrl";

/* ── Brand Quick Links ── */
function BrandQuickLinks({ isDriverEnabled = true, isPassengerEnabled = true }: { isDriverEnabled?: boolean; isPassengerEnabled?: boolean }) {
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const { data: brand } = useQuery({
    queryKey: ["brand-quick-links", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase.from("brands").select("brand_settings_json, slug").eq("id", currentBrandId).single();
      return data;
    },
    enabled: !!currentBrandId,
  });
  const settings = brand?.brand_settings_json as Record<string, unknown> | null;
  const testAccounts = (settings?.test_accounts ?? undefined) as { email: string; role: string; is_active: boolean }[] | undefined;
  const origin = window.location.origin;
  const PUBLISHED_ORIGIN = "https://fidelidadevaleresgate.lovable.app";

  // Resolve canonical origin asynchronously
  const [resolvedPublicBase, setResolvedPublicBase] = useState<string | null>(null);
  useEffect(() => {
    if (!currentBrandId) return;
    getPublicOrigin(currentBrandId).then(setResolvedPublicBase);
  }, [currentBrandId]);
  const publicBase = resolvedPublicBase || PUBLISHED_ORIGIN;

  const roleLabel: Record<string, string> = { brand_admin: "Admin", customer: "Cliente", store_admin: "Parceiro", driver: "Motorista", branch_admin: "Franqueado" };
  const roleIcon: Record<string, string> = { brand_admin: "🔑", customer: "👤", store_admin: "🏪", driver: "🚗", branch_admin: "🏙️" };
  const copyText = (t: string) => { navigator.clipboard.writeText(t); toast.info("Copiado!"); };
  // Links that should use SPA navigation (internal admin routes)
  const internalLabels = new Set(["Cadastro Parceiro", "Painel Parceiro", "Painel Franqueado", "Gamificação"]);
  const handleOpen = (label: string, path: string) => {
    if (internalLabels.has(label)) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  if (!brand) return null;
  const hasTestAccounts = testAccounts && testAccounts.length > 0 && testAccounts.some((a) => a.is_active);

  const allQuickLinks = [
    { label: "App do Cliente", path: currentBrandId ? `/customer-preview?brandId=${currentBrandId}` : "/customer-preview", prodPath: "/", icon: ExternalLink, description: "Visualizar o app", scoringFilter: "PASSENGER" as const },
    { label: "Cadastro Parceiro", path: "/register-store", prodPath: "/register-store", icon: ShoppingBag, description: "Formulário de parceiros", scoringFilter: "PASSENGER" as const },
    { label: "Painel Parceiro", path: "/store-panel", prodPath: "/store-panel", icon: Store, description: "Gestão das lojas", scoringFilter: "PASSENGER" as const },
    { label: "Achadinho Motorista", path: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", prodPath: currentBrandId ? `/driver?brandId=${currentBrandId}` : "/driver", icon: Car, description: "Marketplace do motorista", scoringFilter: "DRIVER" as const },
    { label: "Painel Franqueado", path: "/branch-wallet", prodPath: "/branch-wallet", icon: Building2, description: "Painel do gestor da cidade" },
    { label: "Gamificação", path: "/gamificacao-admin", prodPath: "/gamificacao-admin", icon: Swords, description: "Duelos & Ranking", scoringFilter: "DRIVER" as const },
    { label: "Módulos", path: "/brand-modules", prodPath: "/brand-modules", icon: Blocks, description: "Ativar/desativar módulos" },
  ];

  const quickLinks = allQuickLinks.filter((link) => {
    if (!("scoringFilter" in link) || !link.scoringFilter) return true;
    if (link.scoringFilter === "DRIVER") return isDriverEnabled;
    if (link.scoringFilter === "PASSENGER") return isPassengerEnabled;
    return true;
  });

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" /> Links Úteis
            </CardTitle>
          {resolvedPublicBase ? (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Globe className="h-3 w-3" /> URL configurada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Usando domínio atual</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => {
              const internalUrl = `${origin}${link.path}`;
              const isInternal = internalLabels.has(link.label);
               const prodUrl = link.label === "Achadinho Motorista" ? `${publicBase}${link.prodPath}` : null;
              return (
                <div key={link.label} className="rounded-lg border border-border p-3 space-y-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <link.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                  <div className="flex gap-1">
                    <Button variant="default" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => handleOpen(link.label, isInternal ? link.path : internalUrl)}>
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyText(internalUrl)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {prodUrl && (
                    <div className="flex gap-1 items-center">
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                      <code className="text-[10px] text-muted-foreground truncate flex-1">{prodUrl}</code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyText(prodUrl)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {hasTestAccounts && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" /> Acessos de Teste
              <Badge variant="outline" className="text-[10px] ml-auto">Senha: 123456</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {testAccounts!.filter((a) => a.is_active).map((acc) => (
                <div key={acc.email} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{roleIcon[acc.role] || "👤"}</span>
                    <span className="text-sm font-semibold">{roleLabel[acc.role] || acc.role}</span>
                  </div>
                  <code className="block text-xs truncate text-muted-foreground">{acc.email}</code>
                  <Button variant="outline" size="sm" className="h-7 text-xs w-full gap-1" onClick={() => copyText(`${acc.email} / 123456`)}>
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                  {acc.role === "driver" && currentBrandId && (
                    <Button variant="outline" size="sm" className="h-7 text-xs w-full gap-1" onClick={() => { window.location.href = `/customer-preview?brandId=${currentBrandId}`; }}>
                      <ExternalLink className="h-3 w-3" /> Abrir como Motorista
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Access Hub Section ── */
function AccessHubSection({ consoleScope }: { consoleScope: string }) {
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";
  const isBrand = ["BRAND", "TENANT"].includes(consoleScope);
  const [search, setSearch] = useState("");

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["access-hub-brands"],
    queryFn: async () => { const { data } = await supabase.from("brands").select("id, name, slug, is_active").order("name"); return data || []; },
    enabled: isRoot,
  });
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["access-hub-stores", currentBrandId],
    queryFn: async () => { const { data } = await supabase.from("stores").select("id, name, address, approval_status").eq("brand_id", currentBrandId!).order("name"); return data || []; },
    enabled: isBrand && !!currentBrandId,
  });

  if (!isRoot && !isBrand) return null;

  if (isRoot) {
    const filtered = (brands || []).filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Painéis dos Empreendedores</CardTitle>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar marca..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {brandsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma marca encontrada.</p>
          ) : (
            <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
              {filtered.map((brand) => (
                <div key={brand.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-2">
                   <div className="min-w-0 flex items-center gap-2">
                     <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Store className="h-4 w-4 text-primary" /></div>
                     <div><p className="text-sm font-medium truncate">{brand.name}</p><p className="text-xs text-muted-foreground">{brand.slug}</p></div>
                   </div>
                   <div className="flex gap-1.5 shrink-0">
                     <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1 sm:flex-none" onClick={() => navigate(`/?brandId=${brand.id}`)}><Building2 className="h-3 w-3" />Admin</Button>
                     <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1 sm:flex-none" onClick={() => navigate(`/customer-preview?brandId=${brand.id}`)}><Smartphone className="h-3 w-3" />App</Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const filteredStores = (stores || []).filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Painéis dos Parceiros</CardTitle>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            {currentBrandId && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 hidden sm:inline-flex" onClick={() => navigate(`/customer-preview?brandId=${currentBrandId}`)}>
                <Smartphone className="h-3.5 w-3.5" />App do Cliente
              </Button>
            )}
            <div className="relative flex-1 sm:w-40 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar loja..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {storesLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
        ) : filteredStores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum parceiro encontrado.</p>
        ) : (
          <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
            {filteredStores.map((store) => (
              <div key={store.id} className="flex items-center justify-between py-2.5 gap-2">
                <div className="min-w-0"><p className="text-sm font-medium truncate">{store.name}</p><p className="text-xs text-muted-foreground">{store.address || "—"}</p></div>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" onClick={() => navigate(`/store-panel?storeId=${store.id}`)}><Eye className="h-3 w-3" />Ver</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Demo Stores Section ── */
function DemoStoresSection() {
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const { data: firstBranch } = useQuery({
    queryKey: ["first-branch-for-demo", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase.from("branches").select("id").eq("brand_id", currentBrandId).eq("is_active", true).limit(1).maybeSingle();
      return data;
    },
    enabled: !!currentBrandId && !currentBranchId,
  });
  const branchId = currentBranchId || firstBranch?.id;
  if (!currentBrandId || !branchId) return null;
  return <DemoStoresToggle brandId={currentBrandId} branchId={branchId} />;
}

/* ── Exported Composite Component ── */
interface DashboardQuickLinksProps {
  consoleScope: string;
  showBrand: boolean;
  isRoot: boolean;
  isDriverEnabled?: boolean;
  isPassengerEnabled?: boolean;
}

export default function DashboardQuickLinksSection({ consoleScope, showBrand, isRoot, isDriverEnabled = true, isPassengerEnabled = true }: DashboardQuickLinksProps) {
  return (
    <>
      <AccessHubSection consoleScope={consoleScope} />
      {showBrand && !isRoot && <BrandQuickLinks isDriverEnabled={isDriverEnabled} isPassengerEnabled={isPassengerEnabled} />}
      {showBrand && !isRoot && <DemoAccessCard />}
      {showBrand && !isRoot && <DemoStoresSection />}
    </>
  );
}
