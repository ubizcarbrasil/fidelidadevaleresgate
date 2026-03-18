import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandModules } from "@/hooks/useBrandModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Tag, QrCode, User, FileText, Users, BookOpen, Building2,
  HelpCircle, BarChart3, Clock, Check, X, TrendingUp, Store, Plus,
  ClipboardList, ArrowRight, LogOut, RefreshCw, AlertCircle, CheckCircle2, Loader2,
  Menu, ChevronLeft, Settings, Bell, Lock
} from "lucide-react";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import StoreVoucherWizard from "@/components/store-voucher-wizard/StoreVoucherWizard";
import StoreProfileWizard from "@/components/store-owner/StoreProfileWizard";
import { useStoreProfileCompleteness } from "@/hooks/useStoreProfileCompleteness";
import StoreRedeemTab from "@/components/store-owner/StoreRedeemTab";
import StoreProfileTab from "@/components/store-owner/StoreProfileTab";
import StoreExtratoTab from "@/components/store-owner/StoreExtratoTab";
import StoreEmployeesTab from "@/components/store-owner/StoreEmployeesTab";
import { StoreTermosTab, StoreTutorialTab, StoreSuporteTab } from "@/components/store-owner/StoreInfoTabs";
import StoreBranchesTab from "@/components/store-owner/StoreBranchesTab";
import { ContextualHelpDrawer } from "@/components/ContextualHelpDrawer";
import EmitterUpgradeCard from "@/components/store-owner/EmitterUpgradeCard";
import StoreCatalogTab from "@/components/store-owner/StoreCatalogTab";
import StoreOrdersTab from "@/components/store-owner/StoreOrdersTab";
import GanhaGanhaStoreSummaryPage from "@/pages/GanhaGanhaStoreSummaryPage";
import StoreCampaignTab from "@/components/store-owner/StoreCampaignTab";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet";

type StoreOwnerTab = "dashboard" | "cupons" | "resgate" | "perfil" | "extrato" | "funcionarios" | "termos" | "filiais" | "tutorial" | "suporte" | "catalogo" | "pedidos" | "ganha-ganha" | "campanhas";

const BOTTOM_TABS: { key: StoreOwnerTab; label: string; icon: typeof LayoutDashboard; moduleKey?: string }[] = [
  { key: "dashboard", label: "Início", icon: LayoutDashboard },
  { key: "cupons", label: "Cupons", icon: Tag, moduleKey: "offers" },
  { key: "resgate", label: "Resgate", icon: QrCode, moduleKey: "redemption_qr" },
  { key: "extrato", label: "Extrato", icon: FileText, moduleKey: "earn_points_store" },
];

const MORE_MENU_ITEMS: { key: StoreOwnerTab; label: string; icon: typeof LayoutDashboard; moduleKey?: string }[] = [
  { key: "perfil", label: "Meu Perfil", icon: User },
  { key: "pedidos", label: "Pedidos", icon: ClipboardList, moduleKey: "catalog" },
  { key: "catalogo", label: "Catálogo", icon: ClipboardList, moduleKey: "catalog" },
  { key: "ganha-ganha", label: "Consumo GG", icon: BarChart3, moduleKey: "ganha_ganha" },
  { key: "campanhas", label: "Campanhas", icon: Bell, moduleKey: "notifications" },
  { key: "funcionarios", label: "Funcionários", icon: Users },
  { key: "filiais", label: "Cidades", icon: Building2, moduleKey: "branches" },
  { key: "termos", label: "Termos e Uso", icon: BookOpen },
  { key: "tutorial", label: "Tutorial", icon: HelpCircle },
  { key: "suporte", label: "Suporte", icon: HelpCircle },
];

export default function StoreOwnerPanel() {
  const { user, signOut, isRootAdmin, roles } = useAuth();
  const { isModuleEnabled } = useBrandModules();
  const { brand, theme } = useBrand();
  const brandLogoUrl = (theme as any)?.logo_url || ((brand?.brand_settings_json as any)?.logo_url) || null;
  const brandName = brand?.name || null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const overrideStoreId = searchParams.get("storeId");
  const qc = useQueryClient();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StoreOwnerTab>("dashboard");
  const [showWizard, setShowWizard] = useState(false);
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const notifPermissionRef = useRef<NotificationPermission>("default");

  const filteredBottomTabs = useMemo(() =>
    BOTTOM_TABS.filter(t => !t.moduleKey || isModuleEnabled(t.moduleKey)),
    [isModuleEnabled]
  );
  const filteredMoreMenu = useMemo(() =>
    MORE_MENU_ITEMS.filter(t => !t.moduleKey || isModuleEnabled(t.moduleKey)),
    [isModuleEnabled]
  );

  useEffect(() => {
    if (!user) return;
    const fetchStore = async () => {
      if (overrideStoreId && (isRootAdmin || roles.some(r => r.brand_id))) {
        const { data } = await supabase
          .from("stores")
          .select("*")
          .eq("id", overrideStoreId)
          .maybeSingle();
        setStore(data);
      } else {
        const { data } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_user_id", user.id)
          .eq("approval_status", "APPROVED")
          .maybeSingle();
        setStore(data);
      }
      setLoading(false);
    };
    fetchStore();
  }, [user, overrideStoreId, isRootAdmin, roles]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(perm => {
        notifPermissionRef.current = perm;
      });
    } else if ("Notification" in window) {
      notifPermissionRef.current = Notification.permission;
    }
  }, []);

  useEffect(() => {
    if (!store) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from("catalog_cart_orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("status", "PENDING");
      setPendingOrdersCount(count || 0);
    };
    fetchCount();

    const channel = supabase
      .channel("store-new-orders-notif")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "catalog_cart_orders",
        filter: `store_id=eq.${store.id}`,
      }, (payload) => {
        setPendingOrdersCount(prev => prev + 1);
        const order = payload.new as any;
        const customerName = order.customer_name || "Novo cliente";
        const total = Number(order.total_amount || 0).toFixed(2);

        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("🛒 Novo Pedido!", {
              body: `${customerName} fez um pedido de R$ ${total}`,
              icon: store.logo_url || "/pwa-192x192.png",
              tag: `order-${order.id}`,
            });
          } catch { /* iOS PWA */ }
        }

        toast({
          title: "🛒 Novo Pedido!",
          description: `${customerName} — R$ ${total}`,
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "catalog_cart_orders",
        filter: `store_id=eq.${store.id}`,
      }, (payload) => {
        const newStatus = (payload.new as any).status;
        const oldStatus = (payload.old as any).status;
        if (oldStatus === "PENDING" && newStatus === "CONFIRMED") {
          setPendingOrdersCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-6 pwa-safe-top space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!store) {
    return <StoreEmptyState userId={user?.id} />;
  }

  const isAdminOverride = !!overrideStoreId && (isRootAdmin || roles.some(r => r.brand_id));
  const isEmitter = store.store_type === "EMISSORA" || store.store_type === "MISTA";
  const filteredMoreItems = filteredMoreMenu.filter(item => {
    if (item.key === "catalogo" && !isEmitter) return false;
    if (item.key === "pedidos" && !isEmitter) return false;
    return true;
  });

  const isInBottomTabs = filteredBottomTabs.some(t => t.key === activeTab);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Premium Glass Header ── */}
      <header className="sticky top-0 z-40 glass-header border-b border-border/40 pwa-safe-top">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3 min-w-0">
            {isAdminOverride && (
              <button
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/80 transition-all shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-3 min-w-0">
              {/* Brand logo (small) */}
              {brandLogoUrl ? (
                <img src={brandLogoUrl} alt={brandName || "Marca"} className="h-7 w-7 rounded-lg object-contain shrink-0 ring-1 ring-border/40" />
              ) : brandName ? (
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center shrink-0 ring-1 ring-border/40">
                  {brandName.substring(0, 2).toUpperCase()}
                </div>
              ) : null}
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
                {store.logo_url ? (
                  <img src={store.logo_url} className="h-full w-full object-cover" alt={store.name} />
                ) : (
                  <Store className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{store.name}</p>
                <Badge variant="outline" className="text-[9px] h-4 bg-background/50 border-border/50">
                  {store.store_type === "RECEPTORA" ? "Receptora" : store.store_type === "EMISSORA" ? "Emissora" : "Mista"}
                </Badge>
              </div>
            </div>
            {isAdminOverride && (
              <Badge className="text-[9px] h-4 shrink-0 bg-primary/10 text-primary border-0">Admin</Badge>
            )}
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-muted/80 transition-all active:scale-95">
                <Menu className="h-5 w-5 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="p-5 border-b border-border/50">
                <SheetTitle className="text-left text-sm">Menu</SheetTitle>
              </SheetHeader>
              <div className="p-3 space-y-1">
                {filteredMoreItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActiveTab(item.key); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/15" : "bg-muted/60"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.key === "pedidos" && pendingOrdersCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-destructive text-destructive-foreground rounded-full">
                          {pendingOrdersCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border/50 p-3 space-y-1">
                <ChangePasswordDialog
                  trigger={
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted/60 transition-all">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/60">
                        <Lock className="h-4 w-4" />
                      </div>
                      Alterar Senha
                    </button>
                  }
                />
                <button
                  onClick={async () => { await signOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </div>
                  Sair da conta
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-auto px-4 pt-4 pb-24">
        {activeTab === "dashboard" && (
          showProfileWizard ? (
            <StoreProfileWizard
              store={store}
              onClose={() => setShowProfileWizard(false)}
              onComplete={() => { setShowProfileWizard(false); window.location.reload(); }}
            />
          ) : (
            <StoreOwnerDashboard store={store} onOpenWizard={() => setShowProfileWizard(true)} />
          )
        )}
        {activeTab === "cupons" && (
          showWizard ? (
            <StoreVoucherWizard
              storeId={store.id}
              branchId={store.branch_id}
              brandId={store.brand_id}
              editOffer={editingOffer}
              onClose={() => { setShowWizard(false); setEditingOffer(null); qc.invalidateQueries({ queryKey: ["store-offers", store.id] }); qc.invalidateQueries({ queryKey: ["store-dashboard-stats", store.id] }); }}
            />
          ) : (
            <StoreCouponsTab
              store={store}
              onCreateNew={() => { setEditingOffer(null); setShowWizard(true); }}
              onEdit={(offer: any) => { setEditingOffer(offer); setShowWizard(true); }}
            />
          )
        )}
        {activeTab === "resgate" && <StoreRedeemTab store={store} />}
        {activeTab === "perfil" && <StoreProfileTab store={store} />}
        {activeTab === "extrato" && <StoreExtratoTab store={store} />}
        {activeTab === "funcionarios" && <StoreEmployeesTab store={store} />}
        {activeTab === "catalogo" && isEmitter && <StoreCatalogTab store={store} />}
        {activeTab === "pedidos" && isEmitter && <StoreOrdersTab store={store} />}
        {activeTab === "termos" && <StoreTermosTab />}
        {activeTab === "filiais" && <StoreBranchesTab store={store} />}
        {activeTab === "tutorial" && <StoreTutorialTab />}
        {activeTab === "suporte" && <StoreSuporteTab />}
        {activeTab === "ganha-ganha" && <GanhaGanhaStoreSummaryPage store={store} />}
        {activeTab === "campanhas" && <StoreCampaignTab store={store} />}
      </main>

      {/* ── Premium Glass Bottom Nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 glass-nav border-t border-border/30 pwa-safe-bottom">
        <div className="flex items-stretch h-16 max-w-lg mx-auto">
          {filteredBottomTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full nav-pill-active" />
                )}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? "bg-primary/10 scale-110" : ""
                }`}>
                  <Icon className={`h-[18px] w-[18px] ${isActive ? "stroke-[2.5]" : ""}`} />
                </div>
                <span className={`text-[10px] leading-none ${isActive ? "font-bold" : "font-medium"}`}>{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
              !isInBottomTabs ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {!isInBottomTabs && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full nav-pill-active" />
            )}
            <div className={`relative h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              !isInBottomTabs ? "bg-primary/10 scale-110" : ""
            }`}>
              <Menu className={`h-[18px] w-[18px] ${!isInBottomTabs ? "stroke-[2.5]" : ""}`} />
              {pendingOrdersCount > 0 && activeTab !== "pedidos" && (
                <span className="absolute -top-1 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] leading-none ${!isInBottomTabs ? "font-bold" : "font-medium"}`}>Mais</span>
          </button>
        </div>
      </nav>

      <ContextualHelpDrawer />
    </div>
  );
}

/* ─── Dashboard ─── */
function StoreOwnerDashboard({ store, onOpenWizard }: { store: any; onOpenWizard: () => void }) {
  const { percent, isComplete, missingSteps } = useStoreProfileCompleteness(store);
  const [stats, setStats] = useState({
    cuponsEmitidos: 0,
    cuponsResgatados: 0,
    cuponsAtivos: 0,
    cuponsInativos: 0,
    cuponsEstourados: 0,
    ganhos: 0,
    proximosVencer: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("30d");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: offers } = await supabase
        .from("offers")
        .select("id, title, status, is_active, end_at, max_daily_redemptions")
        .eq("store_id", store.id);

      const offerIds = (offers || []).map(o => o.id);

      let redemptionQuery = supabase
        .from("redemptions")
        .select("id, status, purchase_value, created_at")
        .in("offer_id", offerIds.length ? offerIds : ["00000000-0000-0000-0000-000000000000"]);

      if (period !== "all") {
        const now = new Date();
        const from = new Date();
        if (period === "today") from.setHours(0, 0, 0, 0);
        else if (period === "7d") from.setDate(now.getDate() - 7);
        else if (period === "30d") from.setDate(now.getDate() - 30);
        redemptionQuery = redemptionQuery.gte("created_at", from.toISOString());
      }

      const { data: redemptions } = await redemptionQuery;

      const used = (redemptions || []).filter(r => r.status === "USED");
      const active = (offers || []).filter(o => o.status === "ACTIVE" && o.is_active);
      const inactive = (offers || []).filter(o => !o.is_active || o.status === "EXPIRED");

      const now = new Date();
      const in7d = new Date();
      in7d.setDate(now.getDate() + 7);
      const expiring = (offers || []).filter(o =>
        o.end_at && o.status === "ACTIVE" && o.is_active &&
        new Date(o.end_at) <= in7d && new Date(o.end_at) >= now
      );

      const estourados = active.filter(o => o.max_daily_redemptions != null);

      setStats({
        cuponsEmitidos: (offers || []).length,
        cuponsResgatados: used.length,
        cuponsAtivos: active.length,
        cuponsInativos: inactive.length,
        cuponsEstourados: estourados.length,
        ganhos: used.reduce((sum, r) => sum + (Number(r.purchase_value) || 0), 0),
        proximosVencer: expiring,
      });
      setLoading(false);
    };
    fetch();
  }, [store.id, period]);

  const kpis = [
    { label: "Emitidos", value: stats.cuponsEmitidos, icon: Tag, iconClass: "kpi-icon-blue" },
    { label: "Resgatados", value: stats.cuponsResgatados, icon: Check, iconClass: "kpi-icon-green" },
    { label: "Ativos", value: stats.cuponsAtivos, icon: Clock, iconClass: "kpi-icon-amber" },
    { label: "Ganhos", value: `R$ ${stats.ganhos.toFixed(2)}`, icon: TrendingUp, iconClass: "kpi-icon-emerald" },
  ];

  const periods = [
    { key: "today" as const, label: "Hoje" },
    { key: "7d" as const, label: "7d" },
    { key: "30d" as const, label: "30d" },
    { key: "all" as const, label: "Tudo" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Profile Completeness Card ── */}
      {!isComplete && (
        <Card className="rounded-2xl border-0 overflow-hidden glow-primary bg-gradient-to-br from-primary/8 to-primary/3">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Complete seu perfil</p>
                <p className="text-xs text-muted-foreground mt-0.5">Para aparecer no app dos clientes</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-base font-bold text-primary">{percent}%</span>
              </div>
            </div>
            <Progress value={percent} className="h-2" />
            <div className="flex flex-wrap gap-1.5">
              {missingSteps.slice(0, 3).map(s => (
                <Badge key={s.key} variant="outline" className="text-[10px] bg-background/60">{s.label}</Badge>
              ))}
              {missingSteps.length > 3 && <Badge variant="outline" className="text-[10px] bg-background/60">+{missingSteps.length - 3}</Badge>}
            </div>
            <Button onClick={onOpenWizard} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" size="sm">
              <ArrowRight className="h-4 w-4" /> Continuar configuração
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-xl object-contain shrink-0 border border-border/30" />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="h-6 w-6 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{store.name || "Painel Principal"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visão geral do seu estabelecimento</p>
        </div>
      </div>

      {/* ── Period Selector ── */}
      <div className="flex gap-1 bg-muted/40 rounded-2xl p-1 border border-border/30">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              period === p.key
                ? "bg-background text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 gap-3">
            {kpis.map(kpi => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="rounded-2xl border-0 shadow-sm kpi-card-gradient hover-scale">
                  <CardContent className="p-4">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${kpi.iconClass} text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">{kpi.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Secondary Stats ── */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted/80">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Inativos</span>
                </div>
                <p className="text-xl font-bold">{stats.cuponsInativos}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted/80">
                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Com limite</span>
                </div>
                <p className="text-xl font-bold">{stats.cuponsEstourados}</p>
              </CardContent>
            </Card>
          </div>

          <EmitterUpgradeCard store={store} />

          {/* ── Expiring Soon Card ── */}
          {stats.proximosVencer.length > 0 && (
            <Card className="rounded-2xl border-0 shadow-sm glow-amber bg-gradient-to-br from-warning/8 to-warning/3">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg kpi-icon-amber flex items-center justify-center text-white">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-foreground font-semibold">Vencendo em 7 dias</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {stats.proximosVencer.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-background/80 rounded-xl px-3 py-2.5 border border-border/30">
                    <span className="text-xs font-medium truncate mr-2">{o.title}</span>
                    <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5 text-[9px] shrink-0">
                      {new Date(o.end_at).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Coupons Tab ─── */
function StoreCouponsTab({ store, onCreateNew, onEdit }: { store: any; onCreateNew: () => void; onEdit: (offer: any) => void }) {
  const { data: offers = [], isLoading: loading } = useQuery({
    queryKey: ["store-offers", store.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title, status, is_active, coupon_type, coupon_category, discount_percent, value_rescue, min_purchase, end_at, created_at, start_at, max_total_uses, max_uses_per_customer, interval_between_uses_days, redemption_branch_id, product_id, description, terms_version, terms_params_json, specific_days_json, scaled_values_json, requires_scheduling, scheduling_advance_hours, is_cumulative, redemption_type, allowed_weekdays")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      DRAFT: { label: "Rascunho", variant: "secondary" },
      PENDING: { label: "Pendente", variant: "outline" },
      APPROVED: { label: "Aprovado", variant: "default" },
      ACTIVE: { label: "Ativo", variant: "default" },
      EXPIRED: { label: "Expirado", variant: "destructive" },
    };
    return map[s] || { label: s, variant: "secondary" as const };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Cupons</h1>
          <p className="text-xs text-muted-foreground">Gerencie seus cupons</p>
        </div>
        <Button onClick={onCreateNew} size="sm" className="gap-1.5 rounded-xl h-9 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Criar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Tag className="h-8 w-8 opacity-30" />
          </div>
          <p className="font-semibold text-sm">Nenhum cupom criado</p>
          <p className="text-xs mt-1">Toque em "Criar" para começar</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {offers.map((offer) => {
            const st = statusLabel(offer.status);
            const canEdit = ["DRAFT", "ACTIVE"].includes(offer.status) && (!offer.end_at || new Date(offer.end_at) > new Date());
            return (
              <Card key={offer.id} className="rounded-2xl border-0 shadow-sm kpi-card-gradient active:scale-[0.98] transition-all duration-150">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{offer.title}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant={st.variant} className="text-[9px] h-5 rounded-full">{st.label}</Badge>
                        {offer.coupon_category && <Badge variant="outline" className="text-[9px] h-5 rounded-full">{offer.coupon_category}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        R$ {offer.value_rescue?.toFixed(2)} · mín. R$ {offer.min_purchase?.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => onEdit(offer)} className="h-7 text-xs rounded-lg">
                          Editar
                        </Button>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(offer.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <ContextualHelpDrawer />
    </div>
  );
}

/* ─── Empty State ─── */
function StoreEmptyState({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("stores")
      .select("id, name, approval_status, created_at, store_type")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPendingStores(data || []);
        setLoading(false);
      });
  }, [userId]);

  const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    PENDING_APPROVAL: { label: "Em análise", icon: Clock, color: "text-warning" },
    APPROVED: { label: "Aprovada", icon: CheckCircle2, color: "text-success" },
    REJECTED: { label: "Rejeitada", icon: AlertCircle, color: "text-destructive" },
    DRAFT: { label: "Rascunho", icon: ClipboardList, color: "text-muted-foreground" },
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 pwa-safe-top pwa-safe-bottom">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Parceiro</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Gerencie suas ofertas, cupons e resgates como parceiro da marca.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : pendingStores.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Seus cadastros
            </p>
            {pendingStores.map((store) => {
              const cfg = statusConfig[store.approval_status] || statusConfig.DRAFT;
              const Icon = cfg.icon;
              return (
                <Card key={store.id} className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-muted/60 ${cfg.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{store.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4 rounded-full">
                          {store.store_type === "RECEPTORA" ? "Receptora" : store.store_type === "EMISSORA" ? "Emissora" : "Mista"}
                        </Badge>
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>
                    {store.approval_status === "PENDING_APPROVAL" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {pendingStores.some(s => s.approval_status === "PENDING_APPROVAL") && (
              <Card className="rounded-2xl border-0 shadow-sm glow-amber bg-gradient-to-br from-warning/8 to-warning/3">
                <CardContent className="p-4 flex gap-3">
                  <div className="h-9 w-9 rounded-lg kpi-icon-amber flex items-center justify-center text-white shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Aguardando aprovação</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Seu cadastro está sendo analisado. Você receberá acesso ao painel assim que for aprovado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                <ClipboardList className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-sm">Nenhum cadastro encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cadastre seu estabelecimento para se tornar um parceiro.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button
            className="w-full gap-2 rounded-2xl h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
            size="lg"
            onClick={() => navigate("/register-store")}
          >
            <Plus className="h-4 w-4" />
            Cadastrar novo estabelecimento
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl"
              onClick={() => {
                setLoading(true);
                window.location.reload();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2 text-muted-foreground rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
