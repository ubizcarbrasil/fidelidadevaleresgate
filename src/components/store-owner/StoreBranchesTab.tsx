import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin } from "lucide-react";

interface Props {
  store: any;
}

export default function StoreBranchesTab({ store }: Props) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name, city, state, is_active")
        .eq("brand_id", store.brand_id)
        .eq("is_active", true)
        .order("name");
      setBranches(data || []);
      setLoading(false);
    };
    fetch();
  }, [store.brand_id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Filiais</h1>
        <p className="text-sm text-muted-foreground">
          Filiais da rede onde sua loja está vinculada
        </p>
      </div>

      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Sua filial atual</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sua loja está vinculada à filial onde foi cadastrada. Para alterar, entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhuma filial encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((branch) => {
            const isCurrent = branch.id === store.branch_id;
            return (
              <Card
                key={branch.id}
                className={`rounded-xl ${isCurrent ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{branch.name}</p>
                      {(branch.city || branch.state) && (
                        <p className="text-xs text-muted-foreground">
                          {[branch.city, branch.state].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge className="text-[10px]">Sua filial</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
