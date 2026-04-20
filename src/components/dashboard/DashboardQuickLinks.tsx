import { useState } from "react";
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
  Globe, Eye, Smartphone, Search, Link2, Swords, Blocks, Gift, Settings2, ArrowLeftRight, AlertCircle,
} from "lucide-react";
import DemoStoresToggle from "@/components/DemoStoresToggle";
import DemoAccessCard from "@/components/dashboard/DemoAccessCard";
import { CACHE } from "@/config/constants";

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
    staleTime: CACHE.STALE_TIME_MEDIUM,
  });

  // Check if affiliate_deals module is enabled at brand level
  const { data: brandModulesFlags } = useQuery({
    queryKey: ["brand-modules-quick-links", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return {};
      const { data } = await supabase
        .from("public_brand_modules_safe")
        .select("module_key, is_enabled")
        .eq("brand_id", currentBrandId)
        .in("module_key", ["affiliate_deals"]);
      const map: Record<string, boolean> = {};
      (data || []).forEach((r: any) => { map[r.module_key] = r.is_enabled; });
      return map;
    },
    enabled: !!currentBrandId,
    staleTime: CACHE.STALE_TIME_MEDIUM,
  });

  const achadinhosModuleEnabled = brandModulesFlags?.affiliate_deals ?? true;

  // Fetch brand's own domain (excluding the portal domain)
  const { data: brandDomains } = useQuery({
    queryKey: ["brand-domain-links", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("brand_domains")
        .select("domain")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });
      return data || [];
    },
    enabled: !!currentBrandId,
    staleTime: CACHE.STALE_TIME_MEDIUM,
  });

  const PORTAL_DOMAIN = "app.valeresgate.com.br";
  const nonPortal = brandDomains?.find(d => d.domain !== PORTAL_DOMAIN);
  const brandDomain = nonPortal?.domain ?? brandDomains?.[0]?.domain ?? null;
  const baseUrl = brandDomain ? `https://${brandDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}` : null;

  const settings = brand?.brand_settings_json as Record<string, unknown> | null;
  const testAccounts = (settings?.test_accounts ?? undefined) as { email: string; role: string; is_active: boolean }[] | undefined;

  const roleLabel: Record<string, string> = { brand_admin: "Admin", customer: "Cliente", store_admin: "Parceiro", driver: "Motorista", branch_admin: "Franqueado" };
  const roleIcon: Record<string, string> = { brand_admin: "🔑", customer: "👤", store_admin: "🏪", driver: "🚗", branch_admin: "🏙️" };
  const copyText = (t: string) => { navigator.clipboard.writeText(t); toast.info("Copiado!"); };

  if (!brand) return null;
  const hasTestAccounts = testAccounts && testAccounts.length > 0 && testAccounts.some((a) => a.is_active);

  // Preview URL (always visible)
  const previewUrl = `https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app?brandId=${currentBrandId}`;

  // External links — require brand domain
  const linksExternos = [
    { label: "App do Cliente", path: "/", icon: ExternalLink, description: "Visualizar o aplicativo", scoringFilter: "PASSENGER" as const },
    { label: "Cadastro Parceiro", path: "/register-store", icon: ShoppingBag, description: "Formulário de parceiros", scoringFilter: "PASSENGER" as const },
    { label: "Painel Parceiro", path: "/store-panel", icon: Store, description: "Gestão das lojas", scoringFilter: "PASSENGER" as const },
    { label: "Painel do Motorista", path: `/driver?brandId=${currentBrandId}`, icon: Car, description: "Hub do motorista", scoringFilter: "DRIVER" as const },
  ].filter((link) => {
    if (link.scoringFilter === "DRIVER") {
      if (!isDriverEnabled) return false;
    }
    if (link.scoringFilter === "PASSENGER") return isPassengerEnabled;
    return true;
  });

  // Internal links — admin panel routes (SPA navigation)
  const linksInternos = [
    { label: "Painel Franqueado", path: "/branch-wallet", icon: Building2, description: "Painel do gestor da cidade" },
    { label: "Gamificação", path: "/gamificacao-admin", icon: Swords, description: "Duelos & Ranking", scoringFilter: "DRIVER" as const },
    { label: "Módulos", path: "/brand-modules", icon: Blocks, description: "Ativar/desativar módulos" },
    { label: "Regras de Resgate", path: "/regras-resgate", icon: Settings2, description: "Conversão pontos/R$ e limites" },
    { label: "Produtos de Resgate", path: "/produtos-resgate", icon: Gift, description: "Catálogo de produtos resgatáveis" },
    { label: "Conversão por Público", path: "/conversao-resgate", icon: ArrowLeftRight, description: "Taxa pts/R$ por motorista e passageiro" },
  ].filter((link) => {
    if ("scoringFilter" in link && link.scoringFilter === "DRIVER") return isDriverEnabled;
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
            {baseUrl ? (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Globe className="h-3 w-3" /> {brandDomain}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-1 text-amber-500 border-amber-500/30">
                <AlertCircle className="h-3 w-3" /> Sem domínio
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Preview (Dev) */}
            <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-2 hover:border-primary/60 transition-colors">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Preview (Dev)</span>
                <Badge variant="outline" className="text-[10px] ml-auto">Teste</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Versão de teste antes de publicar</p>
              <div className="flex gap-1">
                <Button variant="default" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => window.open(previewUrl, "_blank")}>
                  <Eye className="h-3 w-3" /> Abrir
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyText(previewUrl)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* External links */}
            {linksExternos.map((link) => {
              const fullUrl = baseUrl ? `${baseUrl}${link.path}` : null;
              return (
                <div key={link.label} className="rounded-lg border border-border p-3 space-y-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <link.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                  {fullUrl ? (
                    <>
                      <div className="flex gap-1">
                        <Button variant="default" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => window.open(fullUrl, "_blank")}>
                          <ExternalLink className="h-3 w-3" /> Abrir
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyText(fullUrl)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                        <code className="text-[10px] text-muted-foreground truncate flex-1">{fullUrl}</code>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-amber-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      Configure um domínio em Meus Domínios para ativar
                    </p>
                  )}
                </div>
              );
            })}

            {/* Internal links */}
            {linksInternos.map((link) => (
              <div key={link.label} className="rounded-lg border border-border p-3 space-y-2 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2">
                  <link.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{link.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{link.description}</p>
                <div className="flex gap-1">
                  <Button variant="default" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => navigate(link.path)}>
                    <ExternalLink className="h-3 w-3" /> Abrir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test accounts */}
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
