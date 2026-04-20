import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Pencil,
  X,
  Check,
  Loader2,
  Star,
  Activity,
  Banknote,
  Calendar,
  Heart,
  Briefcase,
  Wallet,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import type { DriverRow } from "@/types/driver";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import DriverPasswordReset from "../DriverPasswordReset";
import DriverBranchEditor from "../DriverBranchEditor";
import { useDriverProfile } from "../hooks/hook_perfil_motorista";
import {
  formatarCpf,
  formatarTexto,
  formatarData,
  formatarBooleano,
  limparNomeMotorista,
  listarFlagsAtivas,
  rotuloPagamento,
  rotuloServico,
} from "../utils/formatadores_motorista";
import CardFichaMotorista from "./componentes/CardFichaMotorista";
import LinhaInfo from "./componentes/LinhaInfo";

interface Props {
  driver: DriverRow;
  brandId: string;
}

export default function AbaDadosMotorista({ driver, brandId }: Props) {
  const queryClient = useQueryClient();
  const { consoleScope } = useBrandGuard();
  const { data: perfil, isLoading: carregandoPerfil } = useDriverProfile(driver.id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const startEditing = () => {
    setFormName(limparNomeMotorista(driver.name));
    setFormPhone(driver.phone || "");
    setFormEmail(driver.email || "");
    setEditing(true);
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
    localStorage.removeItem(`driver_session_cpf_${brandId}`);
    const cpfLimpo = driver.cpf ? driver.cpf.replace(/\D/g, "") : null;
    if (cpfLimpo) localStorage.setItem(`driver_session_cpf_${brandId}`, cpfLimpo);

    const sessionRequestKey = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const requestData = JSON.stringify({ customerId: driver.id, cpf: cpfLimpo });
    localStorage.setItem(`driver_session_request_${brandId}_${sessionRequestKey}`, requestData);

    const url = `/driver?brandId=${brandId}&sessionKey=${sessionRequestKey}&t=${Date.now()}`;
    window.location.assign(url);
  };

  const enderecoLinha1 = perfil
    ? [perfil.address_street, perfil.address_number].filter(Boolean).join(", ")
    : "";
  const enderecoLinha2 = perfil
    ? [perfil.address_neighborhood, perfil.address_city, perfil.address_state]
        .filter(Boolean)
        .join(" • ")
    : "";
  const enderecoCompleto =
    [enderecoLinha1, enderecoLinha2, perfil?.address_zipcode].filter(Boolean).join(" — ") ||
    "—";

  const pagamentos = listarFlagsAtivas(perfil?.accepted_payments ?? null, rotuloPagamento);
  const servicos = listarFlagsAtivas(perfil?.services_offered ?? null, rotuloServico);

  // Badge de origem dos dados (heurística baseada em imported_at vs registered_at)
  const renderBadgeOrigem = () => {
    if (!perfil) return null;
    const importedAt = perfil.imported_at ? new Date(perfil.imported_at) : null;
    const registeredAt = perfil.registered_at ? new Date(perfil.registered_at) : null;
    const isAutoCadastro =
      importedAt && registeredAt
        ? Math.abs(importedAt.getTime() - registeredAt.getTime()) < 60_000
        : false;
    const fichaVazia = !perfil.cnh_number && !driver.cpf && !perfil.vehicle1_plate;

    if (fichaVazia) {
      return (
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
          ⚪ Aguardando dados
        </Badge>
      );
    }
    if (isAutoCadastro) {
      return (
        <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">
          🔵 1ª corrida
        </Badge>
      );
    }
    if (importedAt) {
      const dia = String(importedAt.getDate()).padStart(2, "0");
      const mes = String(importedAt.getMonth() + 1).padStart(2, "0");
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30">
          🟢 CSV {dia}/{mes}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* CARD: PESSOAL */}
      <CardFichaMotorista
        titulo="Pessoal"
        acao={
          <div className="flex items-center gap-2">
            {!editing && renderBadgeOrigem()}
            {!editing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={startEditing}
                title="Editar dados básicos"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        }
      >
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
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <LinhaInfo icon={User} label="Nome" value={limparNomeMotorista(driver.name)} />
            <LinhaInfo icon={CreditCard} label="CPF" value={formatarCpf(driver.cpf)} />
            <LinhaInfo icon={Heart} label="Sexo" value={formatarTexto(perfil?.gender)} />
            <LinhaInfo icon={Calendar} label="Nascimento" value={formatarData(perfil?.birth_date)} />
            <LinhaInfo icon={User} label="Mãe" value={formatarTexto(perfil?.mother_name)} />
            {perfil?.external_id && (
              <LinhaInfo icon={Hash} label="ID Externo" value={formatarTexto(perfil.external_id)} />
            )}
          </>
        )}

        {driver.customer_tier && !editing && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tier</span>
              <Badge variant="outline" className="text-xs">
                {driver.customer_tier}
              </Badge>
            </div>
          </>
        )}
      </CardFichaMotorista>

      {/* CARD: CONTATO + ENDEREÇO */}
      <CardFichaMotorista titulo="Contato">
        <LinhaInfo icon={Phone} label="Telefone" value={formatarTexto(driver.phone)} />
        <LinhaInfo icon={Mail} label="E-mail" value={formatarTexto(driver.email)} />
        <LinhaInfo icon={MapPin} label="Endereço" value={enderecoCompleto} />
      </CardFichaMotorista>

      {/* CARD: OPERACIONAL */}
      <CardFichaMotorista titulo="Operacional">
        <LinhaInfo
          icon={Activity}
          label="Status"
          value={formatarTexto(perfil?.registration_status)}
          destaque={
            perfil?.registration_status?.toLowerCase() === "ativo"
              ? "sucesso"
              : perfil?.registration_status
                ? "alerta"
                : "default"
          }
        />
        <LinhaInfo icon={Briefcase} label="Vínculo" value={formatarTexto(perfil?.link_type)} />
        <LinhaInfo icon={Briefcase} label="Função" value={formatarTexto(perfil?.relationship)} />
        <LinhaInfo
          icon={Star}
          label="Avaliação"
          value={perfil?.rating != null ? `${perfil.rating} ★` : "—"}
        />
        <LinhaInfo
          icon={Activity}
          label="Aceitação"
          value={perfil?.acceptance_rate != null ? `${perfil.acceptance_rate}%` : "—"}
        />
        <LinhaInfo
          icon={Calendar}
          label="Cadastrado"
          value={formatarData(perfil?.registered_at)}
        />
        <LinhaInfo
          icon={Calendar}
          label="Última OS"
          value={formatarData(perfil?.last_os_at)}
        />

        {pagamentos.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Pagamentos aceitos</p>
              <div className="flex flex-wrap gap-1">
                {pagamentos.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {servicos.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Serviços oferecidos</p>
            <div className="flex flex-wrap gap-1">
              {servicos.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardFichaMotorista>

      {/* CARD: BANCÁRIO */}
      <CardFichaMotorista titulo="Bancário">
        <LinhaInfo
          icon={User}
          label="Titular"
          value={formatarTexto(perfil?.bank_holder_name)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={CreditCard}
          label="CPF Titular"
          value={formatarCpf(perfil?.bank_holder_cpf ?? null)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={Banknote}
          label="Banco"
          value={formatarTexto(perfil?.bank_code)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={Hash}
          label="Agência"
          value={formatarTexto(perfil?.bank_agency)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={Hash}
          label="Conta"
          value={formatarTexto(perfil?.bank_account)}
          labelWidth="w-28"
        />
        <LinhaInfo
          icon={Wallet}
          label="Chave PIX"
          value={formatarTexto(perfil?.pix_key)}
          labelWidth="w-28"
        />
      </CardFichaMotorista>

      {/* AÇÕES */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleOpenPwa}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Acessar Conta
        </Button>
        <DriverPasswordReset driver={driver} />
      </div>

      {consoleScope !== "BRANCH" && <DriverBranchEditor driver={driver} brandId={brandId} />}

      {carregandoPerfil && (
        <p className="text-xs text-muted-foreground text-center py-2">
          <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
          Carregando dados estendidos...
        </p>
      )}
    </div>
  );
}
