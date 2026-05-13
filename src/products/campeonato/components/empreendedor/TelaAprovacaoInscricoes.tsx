import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Users } from "lucide-react";
import { AvatarMotorista } from "../shared/AvatarMotorista";

type StatusInscricao = "pending" | "approved" | "rejected";

interface Inscricao {
  id: string;
  status: StatusInscricao;
  tier_id: string | null;
  notes: string | null;
  created_at: string;
  driver_name: string | null;
  photo_url: string | null;
  tier_name: string | null;
}

interface TierResumo {
  tier_id: string;
  tier_name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  seasonId: string;
  brandId: string;
  branchId: string;
  tiers: TierResumo[];
}

function formatarDataPtBr(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function TelaAprovacaoInscricoes({
  open,
  onClose,
  seasonId,
  brandId,
  branchId,
  tiers,
}: Props) {
  const qc = useQueryClient();
  const [selecaoTier, setSelecaoTier] = useState<Record<string, string>>({});
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [acaoPendente, setAcaoPendente] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["duelo-season-enrollments", seasonId, brandId, branchId],
    enabled: open && !!seasonId && !!brandId && !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duelo_season_enrollments")
        .select(
          `id, status, tier_id, notes, created_at,
           customers:driver_id ( name, photo_url ),
           driver_profiles:driver_id ( photo_url ),
           duelo_season_tiers:tier_id ( name )`,
        )
        .eq("season_id", seasonId)
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any): Inscricao => ({
        id: row.id,
        status: row.status,
        tier_id: row.tier_id,
        notes: row.notes,
        created_at: row.created_at,
        driver_name: row.customers?.name ?? null,
        photo_url:
          row.customers?.photo_url ?? row.driver_profiles?.photo_url ?? null,
        tier_name: row.duelo_season_tiers?.name ?? null,
      }));
    },
  });

  const pendentes = useMemo(
    () => (data ?? []).filter((i) => i.status === "pending"),
    [data],
  );
  const aprovados = useMemo(
    () => (data ?? []).filter((i) => i.status === "approved"),
    [data],
  );
  const rejeitados = useMemo(
    () => (data ?? []).filter((i) => i.status === "rejected"),
    [data],
  );

  function invalidar() {
    qc.invalidateQueries({
      queryKey: ["duelo-season-enrollments", seasonId, brandId, branchId],
    });
    qc.invalidateQueries({
      queryKey: ["duelo-pending-enrollments-count", seasonId],
    });
  }

  async function aprovar(inscricao: Inscricao) {
    setAcaoPendente(inscricao.id);
    try {
      const tierAlvo = selecaoTier[inscricao.id] ?? inscricao.tier_id;
      if (tierAlvo && tierAlvo !== inscricao.tier_id) {
        const { data: tierUpd, error: tErr } = await supabase
          .from("duelo_season_enrollments")
          .update({ tier_id: tierAlvo })
          .eq("id", inscricao.id)
          .eq("brand_id", brandId)
          .eq("branch_id", branchId)
          .select();
        if (tErr) throw tErr;
        if (!tierUpd || tierUpd.length === 0) {
          toast.error("Não foi possível atualizar a série (verifique permissões).");
          return;
        }
      }
      const { data: upd, error } = await supabase
        .from("duelo_season_enrollments")
        .update({ status: "approved" })
        .eq("id", inscricao.id)
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .select();
      if (error) throw error;
      if (!upd || upd.length === 0) {
        toast.error("Aprovação não aplicada — verifique permissões.");
        return;
      }
      toast.success("Inscrição aprovada");
      invalidar();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aprovar inscrição");
    } finally {
      setAcaoPendente(null);
    }
  }

  async function rejeitar(inscricaoId: string, motivo: string) {
    setAcaoPendente(inscricaoId);
    try {
      const { data: upd, error } = await supabase
        .from("duelo_season_enrollments")
        .update({ status: "rejected", notes: motivo?.trim() || null })
        .eq("id", inscricaoId)
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .select();
      if (error) throw error;
      if (!upd || upd.length === 0) {
        toast.error("Rejeição não aplicada — verifique permissões.");
        return;
      }
      toast.success("Inscrição rejeitada");
      invalidar();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao rejeitar inscrição");
    } finally {
      setAcaoPendente(null);
    }
  }

  async function aprovarSelecionados() {
    const ids = Object.entries(selecionados)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) {
      toast.info("Selecione pelo menos uma inscrição.");
      return;
    }
    setAcaoPendente("__lote__");
    try {
      const { data: upd, error } = await supabase
        .from("duelo_season_enrollments")
        .update({ status: "approved" })
        .in("id", ids)
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .select();
      if (error) throw error;
      if (!upd || upd.length === 0) {
        toast.error("Nenhuma inscrição foi aprovada — verifique permissões.");
        return;
      }
      toast.success(`${upd.length} inscrição(ões) aprovada(s)`);
      setSelecionados({});
      invalidar();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aprovar em lote");
    } finally {
      setAcaoPendente(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Gerenciar inscrições
          </SheetTitle>
          <SheetDescription>
            Aprove ou rejeite as solicitações de motoristas para esta temporada.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="pending" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="text-xs">
              Pendentes
              {pendentes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendentes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">
              Aprovados
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">
              Rejeitados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-3">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : pendentes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma inscrição pendente.
              </p>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={aprovarSelecionados}
                    disabled={
                      acaoPendente === "__lote__" ||
                      Object.values(selecionados).every((v) => !v)
                    }
                  >
                    {acaoPendente === "__lote__" && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Aprovar selecionados
                  </Button>
                </div>
                {pendentes.map((i) => (
                  <CardInscricaoPendente
                    key={i.id}
                    inscricao={i}
                    tiers={tiers}
                    selecionado={!!selecionados[i.id]}
                    onToggleSelecionado={(v) =>
                      setSelecionados((s) => ({ ...s, [i.id]: v }))
                    }
                    tierEscolhido={selecaoTier[i.id] ?? i.tier_id ?? ""}
                    onMudarTier={(v) =>
                      setSelecaoTier((s) => ({ ...s, [i.id]: v }))
                    }
                    onAprovar={() => aprovar(i)}
                    onRejeitar={(motivo) => rejeitar(i.id, motivo)}
                    pending={acaoPendente === i.id}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-2 mt-3">
            {aprovados.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma inscrição aprovada.
              </p>
            ) : (
              aprovados.map((i) => <CardInscricaoSimples key={i.id} inscricao={i} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-2 mt-3">
            {rejeitados.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma inscrição rejeitada.
              </p>
            ) : (
              rejeitados.map((i) => <CardInscricaoSimples key={i.id} inscricao={i} />)
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function CardInscricaoSimples({ inscricao }: { inscricao: Inscricao }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/20 p-3">
      <AvatarMotorista nome={inscricao.driver_name} url={inscricao.photo_url} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {inscricao.driver_name ?? "(sem nome)"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatarDataPtBr(inscricao.created_at)}
          {inscricao.tier_name && <> · Série {inscricao.tier_name}</>}
        </p>
        {inscricao.notes && (
          <p className="mt-0.5 text-[11px] italic text-muted-foreground">
            "{inscricao.notes}"
          </p>
        )}
      </div>
    </div>
  );
}

interface PendenteProps {
  inscricao: Inscricao;
  tiers: TierResumo[];
  selecionado: boolean;
  onToggleSelecionado: (v: boolean) => void;
  tierEscolhido: string;
  onMudarTier: (v: string) => void;
  onAprovar: () => void;
  onRejeitar: (motivo: string) => void;
  pending: boolean;
}

function CardInscricaoPendente({
  inscricao,
  tiers,
  selecionado,
  onToggleSelecionado,
  tierEscolhido,
  onMudarTier,
  onAprovar,
  onRejeitar,
  pending,
}: PendenteProps) {
  const [motivo, setMotivo] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3">
      <Checkbox
        checked={selecionado}
        onCheckedChange={(v) => onToggleSelecionado(!!v)}
        className="mt-1"
      />
      <AvatarMotorista nome={inscricao.driver_name} url={inscricao.photo_url} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="truncate text-sm font-medium">
            {inscricao.driver_name ?? "(sem nome)"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Solicitado em {formatarDataPtBr(inscricao.created_at)}
            {inscricao.tier_name && <> · atual: Série {inscricao.tier_name}</>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-40">
            <Select value={tierEscolhido} onValueChange={onMudarTier}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar série" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.tier_id} value={t.tier_id}>
                    Série {t.tier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={onAprovar}
            disabled={pending}
            className="h-8"
          >
            {pending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1 h-3.5 w-3.5" />
            )}
            Aprovar
          </Button>

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                className="h-8"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Rejeitar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-2">
              <p className="text-xs font-medium">Motivo (opcional)</p>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: Foto fora dos padrões"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onRejeitar(motivo);
                  setMotivo("");
                  setPopoverOpen(false);
                }}
              >
                Confirmar rejeição
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}