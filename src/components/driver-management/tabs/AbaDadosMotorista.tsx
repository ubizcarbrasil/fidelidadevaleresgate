import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CreditCard, Phone, Mail, ExternalLink, Pencil, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DriverRow } from "@/pages/DriverManagementPage";
import DriverPasswordReset from "../DriverPasswordReset";
import DriverBranchEditor from "../DriverBranchEditor";

interface Props {
  driver: DriverRow;
  brandId: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

const cleanName = (name: string | null) =>
  name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

const maskCpf = (cpf: string | null) => {
  if (!cpf) return "—";
  if (cpf.length >= 11) return `•••.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  return cpf;
};

export default function AbaDadosMotorista({ driver, brandId }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const startEditing = () => {
    setFormName(cleanName(driver.name));
    setFormPhone(driver.phone || "");
    setFormEmail(driver.email || "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      toast.error("E-mail inválido.");
      return;
    }

    setSaving(true);
    try {
      const updatedName = `[MOTORISTA] ${trimmedName}`;
      const { error } = await (supabase as any)
        .from("customers")
        .update({
          name: updatedName,
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
        })
        .eq("id", driver.id);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["driver-management"] });
      setEditing(false);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPwa = () => {
    const url = `/customer-preview?brandId=${brandId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados Cadastrais</h4>
          {!editing && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEditing} title="Editar dados">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do motorista"
                className="h-8 text-sm"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-8 text-sm"
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="h-8 text-sm"
                type="email"
                maxLength={255}
              />
            </div>
            <InfoRow icon={CreditCard} label="CPF" value={maskCpf(driver.cpf)} />
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <InfoRow icon={User} label="Nome" value={cleanName(driver.name)} />
            <InfoRow icon={CreditCard} label="CPF" value={maskCpf(driver.cpf)} />
            <InfoRow icon={Phone} label="Telefone" value={driver.phone || "—"} />
            <InfoRow icon={Mail} label="E-mail" value={driver.email || "—"} />
          </>
        )}

        {driver.customer_tier && !editing && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tier</span>
              <Badge variant="outline" className="text-xs">{driver.customer_tier}</Badge>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleOpenPwa}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Acessar Conta
        </Button>
        <DriverPasswordReset driver={driver} />
      </div>

      <DriverBranchEditor driver={driver} brandId={brandId} />
    </div>
  );
}
