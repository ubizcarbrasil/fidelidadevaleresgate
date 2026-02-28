import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Tag, QrCode, User, FileText, Users, BookOpen, Building2,
  HelpCircle, BarChart3, Clock, Check, X, TrendingUp, Store
} from "lucide-react";

type StoreOwnerTab = "dashboard" | "cupons" | "resgate" | "perfil" | "extrato" | "funcionarios" | "termos" | "filiais" | "tutorial" | "suporte";

const MENU_ITEMS: { key: StoreOwnerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "cupons", label: "Cupom", icon: Tag },
  { key: "resgate", label: "Resgate de PIN", icon: QrCode },
  { key: "perfil", label: "Meu Perfil", icon: User },
  { key: "extrato", label: "Extrato", icon: FileText },
  { key: "funcionarios", label: "Funcionários", icon: Users },
  { key: "termos", label: "Termos e Uso", icon: BookOpen },
  { key: "filiais", label: "Filiais", icon: Building2 },
  { key: "tutorial", label: "Tutorial", icon: HelpCircle },
  { key: "suporte", label: "Suporte", icon: HelpCircle },
];

export default function StoreOwnerPanel() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StoreOwnerTab>("dashboard");

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
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-bold mb-2">Nenhuma loja aprovada</h2>
        <p className="text-sm text-muted-foreground">Seu cadastro pode estar em análise ou ainda não foi enviado.</p>
      </div>
    );
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
        {activeTab !== "dashboard" && (
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
  const [stats, setStats] = useState({ cuponsEmitidos: 0, cuponsResgatados: 0, cuponsAtivos: 0, ganhos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Fetch offers stats
      const { data: offers } = await supabase
        .from("offers")
        .select("id, status, is_active")
        .eq("store_id", store.id);

      const { data: redemptions } = await supabase
        .from("redemptions")
        .select("id, status, purchase_value")
        .in("offer_id", (offers || []).map(o => o.id));

      const used = (redemptions || []).filter(r => r.status === "USED");

      setStats({
        cuponsEmitidos: (offers || []).length,
        cuponsResgatados: used.length,
        cuponsAtivos: (offers || []).filter(o => o.status === "ACTIVE" && o.is_active).length,
        ganhos: used.reduce((sum, r) => sum + (Number(r.purchase_value) || 0), 0),
      });
      setLoading(false);
    };
    fetch();
  }, [store.id]);

  const kpis = [
    { label: "Cupons Emitidos", value: stats.cuponsEmitidos, icon: Tag, color: "text-blue-600 bg-blue-50" },
    { label: "Cupons Resgatados", value: stats.cuponsResgatados, icon: Check, color: "text-green-600 bg-green-50" },
    { label: "Cupons Ativos", value: stats.cuponsAtivos, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { label: "Ganhos (R$)", value: `R$ ${stats.ganhos.toFixed(2)}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Visão geral do seu estabelecimento</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
