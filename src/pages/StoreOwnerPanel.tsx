import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Tag, QrCode, User, FileText, Users, BookOpen, Building2,
  HelpCircle, BarChart3, Clock, Check, X, TrendingUp, Store, Plus,
  ClipboardList, ArrowRight, LogOut, RefreshCw, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import StoreVoucherWizard from "@/components/store-voucher-wizard/StoreVoucherWizard";
import StoreRedeemTab from "@/components/store-owner/StoreRedeemTab";
import StoreProfileTab from "@/components/store-owner/StoreProfileTab";
import StoreExtratoTab from "@/components/store-owner/StoreExtratoTab";
import StoreEmployeesTab from "@/components/store-owner/StoreEmployeesTab";
import { StoreTermosTab, StoreTutorialTab, StoreSuporteTab } from "@/components/store-owner/StoreInfoTabs";
import StoreBranchesTab from "@/components/store-owner/StoreBranchesTab";
import { ContextualHelpDrawer } from "@/components/ContextualHelpDrawer";

type StoreOwnerTab = "dashboard" | "cupons" | "resgate" | "perfil" | "extrato" | "funcionarios" | "termos" | "filiais" | "tutorial" | "suporte";

const MENU_ITEMS: { key: StoreOwnerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Painel Principal", icon: LayoutDashboard },
  { key: "cupons", label: "Cupom", icon: Tag },
  { key: "resgate", label: "Resgate de PIN", icon: QrCode },
  { key: "perfil", label: "Meu Perfil", icon: User },
  { key: "extrato", label: "Extrato", icon: FileText },
  { key: "funcionarios", label: "Funcionários", icon: Users },
  { key: "termos", label: "Termos e Uso", icon: BookOpen },
  { key: "filiais", label: "Cidades", icon: Building2 },
  { key: "tutorial", label: "Tutorial", icon: HelpCircle },
  { key: "suporte", label: "Suporte", icon: HelpCircle },
];

export default function StoreOwnerPanel() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StoreOwnerTab>("dashboard");
  const [showWizard, setShowWizard] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_user_id", user.id)
        .eq("approval_status", "APPROVED")
        .maybeSingle();
      setStore(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!store) {
    return <StoreEmptyState userId={user?.id} />;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r shrink-0 p-4 space-y-1">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
            {store.logo_url ? (
              <img src={store.logo_url} className="h-full w-full object-cover" />
            ) : (
              <Store className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{store.name}</p>
            <Badge variant="outline" className="text-[10px]">
              {store.store_type === "RECEPTORA" ? "Receptora" : store.store_type === "EMISSORA" ? "Emissora" : "Mista"}
            </Badge>
          </div>
        </div>

        {MENU_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        {activeTab === "dashboard" && <StoreOwnerDashboard store={store} />}
        {activeTab === "cupons" && (
          showWizard ? (
            <StoreVoucherWizard
              storeId={store.id}
              branchId={store.branch_id}
              brandId={store.brand_id}
              editOffer={editingOffer}
              onClose={() => { setShowWizard(false); setEditingOffer(null); }}
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
        {activeTab === "termos" && <StoreTermosTab />}
        {activeTab === "filiais" && <StoreBranchesTab store={store} />}
        {activeTab === "tutorial" && <StoreTutorialTab />}
        {activeTab === "suporte" && <StoreSuporteTab />}
        {!["dashboard", "cupons", "resgate", "perfil", "extrato", "funcionarios", "termos", "filiais", "tutorial", "suporte"].includes(activeTab) && (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Módulo "{MENU_ITEMS.find(m => m.key === activeTab)?.label}"</p>
            <p className="text-sm mt-1">Em breve disponível</p>
          </div>
        )}
      </main>
    </div>
  );
}

function StoreOwnerDashboard({ store }: { store: any }) {
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
      // Fetch all offers for this store
      const { data: offers } = await supabase
        .from("offers")
        .select("id, title, status, is_active, end_at, max_daily_redemptions")
        .eq("store_id", store.id);

      const offerIds = (offers || []).map(o => o.id);

      // Fetch redemptions filtered by period
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

      // Offers expiring within 7 days
      const now = new Date();
      const in7d = new Date();
      in7d.setDate(now.getDate() + 7);
      const expiring = (offers || []).filter(o =>
        o.end_at && o.status === "ACTIVE" && o.is_active &&
        new Date(o.end_at) <= in7d && new Date(o.end_at) >= now
      );

      // "Estourados": offers that reached max_daily_redemptions today
      // Simplified: offers with max_daily_redemptions set
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
    { label: "Cupons Emitidos", value: stats.cuponsEmitidos, icon: Tag, color: "text-blue-600 bg-blue-50" },
    { label: "Resgatados", value: stats.cuponsResgatados, icon: Check, color: "text-green-600 bg-green-50" },
    { label: "Ativos", value: stats.cuponsAtivos, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { label: "Ganhos", value: `R$ ${stats.ganhos.toFixed(2)}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
  ];

  const periods = [
    { key: "today" as const, label: "Hoje" },
    { key: "7d" as const, label: "7 dias" },
    { key: "30d" as const, label: "30 dias" },
    { key: "all" as const, label: "Tudo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Painel Principal</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu estabelecimento parceiro</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map(kpi => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="rounded-2xl">
                  <CardContent className="p-5">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Inativos / Expirados</span>
                </div>
                <p className="text-xl font-bold">{stats.cuponsInativos}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Com limite diário</span>
                </div>
                <p className="text-xl font-bold">{stats.cuponsEstourados}</p>
              </CardContent>
            </Card>
          </div>

          {/* Expiring soon */}
          {stats.proximosVencer.length > 0 && (
            <Card className="rounded-2xl border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                  <Clock className="h-4 w-4" />
                  Cupons próximos de vencer (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.proximosVencer.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                    <span className="text-sm font-medium">{o.title}</span>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300 text-[10px]">
                      Expira {new Date(o.end_at).toLocaleDateString("pt-BR")}
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

function StoreCouponsTab({ store, onCreateNew, onEdit }: { store: any; onCreateNew: () => void; onEdit: (offer: any) => void }) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title, status, is_active, coupon_type, coupon_category, discount_percent, value_rescue, min_purchase, end_at, created_at, start_at, max_total_uses, max_uses_per_customer, interval_between_uses_days, redemption_branch_id, product_id, description, terms_version, terms_params_json, specific_days_json, scaled_values_json, requires_scheduling, scheduling_advance_hours, is_cumulative, redemption_type, allowed_weekdays")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      setOffers(data || []);
      setLoading(false);
    };
    fetch();
  }, [store.id]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus cupons e ofertas</p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" /> Criar Cupom
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum cupom criado</p>
          <p className="text-sm mt-1">Clique em "Criar Cupom" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const st = statusLabel(offer.status);
            const canEdit = ["DRAFT", "ACTIVE"].includes(offer.status) && (!offer.end_at || new Date(offer.end_at) > new Date());
            return (
              <Card key={offer.id} className="rounded-xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{offer.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                      {offer.coupon_category && <Badge variant="outline" className="text-[10px]">{offer.coupon_category}</Badge>}
                      <span className="text-xs text-muted-foreground">
                        R$ {offer.value_rescue?.toFixed(2)} | mín. R$ {offer.min_purchase?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => onEdit(offer)}>
                        Editar
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(offer.created_at).toLocaleDateString("pt-BR")}
                    </span>
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
    PENDING_APPROVAL: { label: "Em análise", icon: Clock, color: "text-amber-600" },
    APPROVED: { label: "Aprovada", icon: CheckCircle2, color: "text-green-600" },
    REJECTED: { label: "Rejeitada", icon: AlertCircle, color: "text-destructive" },
    DRAFT: { label: "Rascunho", icon: ClipboardList, color: "text-muted-foreground" },
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Parceiro</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Gerencie suas ofertas, cupons e resgates como parceiro da marca.
          </p>
        </div>

        {/* Pending stores list */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
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
                <Card key={store.id} className="rounded-xl border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-muted ${cfg.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{store.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
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
              <Card className="rounded-xl border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 flex gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Aguardando aprovação</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Seu cadastro está sendo analisado. Você receberá acesso ao painel assim que for aprovado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center space-y-3">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <div>
                <p className="font-semibold text-sm">Nenhum cadastro encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cadastre seu estabelecimento para se tornar um parceiro.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => navigate("/register-store")}
          >
            <Plus className="h-4 w-4" />
            Cadastrar novo estabelecimento
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
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
              className="flex-1 gap-2 text-muted-foreground"
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