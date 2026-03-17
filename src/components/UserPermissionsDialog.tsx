import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  branches: "Cidades",
  brands: "Marcas",
  customers: "Clientes",
  domains: "Domínios",
  loyalty: "Fidelidade",
  offers: "Ofertas",
  redemptions: "Resgates",
  reports: "Relatórios",
  roles: "Papéis",
  settings: "Configurações",
  stores: "Parceiros",
  tenants: "Organizações",
  users: "Usuários",
  vouchers: "Vouchers",
};

const PERMISSION_ACTION_LABELS: Record<string, string> = {
  create: "Criar",
  read: "Visualizar",
  update: "Editar",
  delete: "Excluir",
  approve: "Aprovar",
  assign: "Atribuir",
  revoke: "Revogar",
  redeem: "Resgatar",
  cancel: "Cancelar",
  view: "Visualizar",
  invite: "Convidar",
  deactivate: "Desativar",
  earn_points: "Pontuar",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  brandId: string;
  userName?: string;
}

export default function UserPermissionsDialog({ open, onOpenChange, userId, brandId, userName }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: allPermissions, isLoading: loadingPerms } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("id, key, module, display_name, order_index")
        .eq("is_active", true)
        .order("module")
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: currentOverrides, isLoading: loadingOverrides } = useQuery({
    queryKey: ["user-overrides", userId, brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permission_overrides")
        .select("permission_key, is_allowed")
        .eq("user_id", userId)
        .eq("scope_type", "BRAND")
        .eq("scope_id", brandId);
      if (error) throw error;
      return data;
    },
    enabled: open && !!userId,
  });

  useEffect(() => {
    if (currentOverrides) {
      setSelected(new Set(currentOverrides.filter((o) => o.is_allowed).map((o) => o.permission_key)));
    }
  }, [currentOverrides]);

  const grouped = useMemo(() => {
    if (!allPermissions) return {};
    // Filter out root-level modules that brand admins shouldn't manage
    const excluded = ["tenants", "brands", "domains"];
    const filtered = allPermissions.filter((p) => !excluded.includes(p.module));
    const groups: Record<string, typeof filtered> = {};
    for (const p of filtered) {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    }
    return groups;
  }, [allPermissions]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (module: string, keys: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = keys.every((k) => next.has(k));
      if (allChecked) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing overrides for this user+brand scope
      await supabase
        .from("user_permission_overrides")
        .delete()
        .eq("user_id", userId)
        .eq("scope_type", "BRAND")
        .eq("scope_id", brandId);

      if (selected.size > 0) {
        const rows = Array.from(selected).map((key) => ({
          user_id: userId,
          permission_key: key,
          scope_type: "BRAND",
          scope_id: brandId,
          is_allowed: true,
        }));
        const { error } = await supabase.from("user_permission_overrides").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-overrides", userId] });
      toast.success("Permissões atualizadas!");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loading = loadingPerms || loadingOverrides;

  const getActionLabel = (key: string) => {
    const action = key.split(".").pop() || key;
    return PERMISSION_ACTION_LABELS[action] || action;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissões — {userName || "Usuário"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {Object.entries(grouped).map(([module, perms]) => {
              const keys = perms.map((p) => p.key);
              const allChecked = keys.every((k) => selected.has(k));
              const someChecked = keys.some((k) => selected.has(k));

              return (
                <div key={module}>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={allChecked}
                      // @ts-ignore
                      indeterminate={someChecked && !allChecked}
                      onCheckedChange={() => toggleModule(module, keys)}
                    />
                    <Label className="font-semibold text-sm cursor-pointer" onClick={() => toggleModule(module, keys)}>
                      {MODULE_LABELS[module] || module}
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pl-6">
                    {perms.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                        <Checkbox checked={selected.has(p.key)} onCheckedChange={() => toggle(p.key)} />
                        {p.display_name || getActionLabel(p.key)}
                      </label>
                    ))}
                  </div>
                  <Separator className="mt-3" />
                </div>
              );
            })}

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Permissões
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
