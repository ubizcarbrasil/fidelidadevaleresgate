import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, TestTube } from "lucide-react";
import { toast } from "sonner";

export default function DemoAccessCard() {
  const { currentBrandId } = useBrandGuard();

  const { data: branches } = useQuery({
    queryKey: ["demo-branches", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("branches")
        .select("id, name, city, state")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true)
        .order("name")
        .limit(5);
      return data || [];
    },
    enabled: !!currentBrandId,
  });

  const { data: brand } = useQuery({
    queryKey: ["demo-brand-settings", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return null;
      const { data } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId)
        .single();
      return data;
    },
    enabled: !!currentBrandId,
  });

  const settings = brand?.brand_settings_json as Record<string, unknown> | null;
  const testAccounts = (settings?.test_accounts ?? []) as {
    email: string;
    role: string;
    is_active: boolean;
  }[];
  const branchTestAccount = testAccounts.find(
    (a) => a.role === "branch_admin" && a.is_active
  );

  const origin = window.location.origin;
  const copyText = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.info("Copiado!");
  };

  if (!branches || branches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TestTube className="h-4 w-4 text-primary" />
          Acesso ao Painel do Franqueado
          <Badge variant="outline" className="text-[10px] ml-auto">
            Demo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {branchTestAccount && (
          <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">
              Credenciais de Teste
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs truncate flex-1">
                {branchTestAccount.email}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyText(`${branchTestAccount.email} / 123456`)
                }
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Senha: 123456</p>
          </div>
        )}

        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-lg border border-border p-3 flex items-center justify-between gap-2 hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{branch.name}</p>
                <p className="text-xs text-muted-foreground">
                  {branch.city || branch.state || "—"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 shrink-0"
                onClick={() => navigate(`/index?branchId=${branch.id}`)}
              >
                <ExternalLink className="h-3 w-3" /> Abrir
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
