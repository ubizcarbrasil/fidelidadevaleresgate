import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Users, Car, User, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ResetTarget = "all" | "drivers" | "clients" | "single";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
}

export default function DialogResetPontos({ open, onClose, branchId, branchName }: Props) {
  const [target, setTarget] = useState<ResetTarget>("all");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setTarget("all");
      setSearch("");
      setSelectedCustomer(null);
    }
  }, [open]);

  const { data: customers = [], isFetching } = useQuery({
    queryKey: ["reset-customer-search", branchId, search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, cpf, points_balance")
        .eq("branch_id", branchId)
        .gt("points_balance", 0)
        .or(`name.ilike.%${search}%,cpf.ilike.%${search}%`)
        .order("name")
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: target === "single" && search.length >= 2,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { action: "reset_branch_points", branch_id: branchId, target };
      if (target === "single" && selectedCustomer) {
        body.customer_id = selectedCustomer.id;
      }
      const { data, error } = await supabase.functions.invoke("admin-brand-actions", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.affected_count} registro(s) zerado(s) com sucesso`);
      queryClient.invalidateQueries({ queryKey: ["brand-branches"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao resetar pontos"),
  });

  const targetLabel = target === "all" ? "todos" : target === "drivers" ? "motoristas" : target === "clients" ? "clientes" : selectedCustomer?.name || "selecionado";
  const canSubmit = target !== "single" || selectedCustomer !== null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar Pontos</DialogTitle>
            <DialogDescription>
              Zerar pontos em <strong>{branchName}</strong>. Selecione o escopo.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={target} onValueChange={(v) => { setTarget(v as ResetTarget); setSelectedCustomer(null); }} className="space-y-3 mt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="all" id="target-all" />
              <Label htmlFor="target-all" className="flex items-center gap-2 cursor-pointer flex-1">
                <Users className="h-4 w-4 text-primary" /> Todos (motoristas + clientes)
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="drivers" id="target-drivers" />
              <Label htmlFor="target-drivers" className="flex items-center gap-2 cursor-pointer flex-1">
                <Car className="h-4 w-4 text-primary" /> Apenas motoristas
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="clients" id="target-clients" />
              <Label htmlFor="target-clients" className="flex items-center gap-2 cursor-pointer flex-1">
                <User className="h-4 w-4 text-primary" /> Apenas clientes
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="single" id="target-single" />
              <Label htmlFor="target-single" className="flex items-center gap-2 cursor-pointer flex-1">
                <Search className="h-4 w-4 text-primary" /> Específico
              </Label>
            </div>
          </RadioGroup>

          {target === "single" && (
            <div className="space-y-2 mt-2">
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedCustomer(null); }}
              />
              {isFetching && <p className="text-xs text-muted-foreground">Buscando...</p>}
              {customers.length > 0 && !selectedCustomer && (
                <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between"
                      onClick={() => { setSelectedCustomer({ id: c.id, name: c.name || "Sem nome" }); setSearch(c.name || ""); }}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{c.points_balance} pts</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <p className="text-sm text-green-600 font-medium">✓ {selectedCustomer.name}</p>
              )}
            </div>
          )}

          <Button
            variant="destructive"
            className="w-full mt-4"
            disabled={!canSubmit || resetMutation.isPending}
            onClick={() => setShowConfirm(true)}
          >
            {resetMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Resetar Pontos
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar reset de pontos"
        description={`Todos os pontos de ${targetLabel} em ${branchName} serão zerados. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, resetar tudo"
        variant="destructive"
        onConfirm={() => resetMutation.mutate()}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}
