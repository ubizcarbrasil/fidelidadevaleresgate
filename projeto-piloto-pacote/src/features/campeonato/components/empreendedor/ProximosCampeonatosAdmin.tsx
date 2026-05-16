import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CalendarClock,
  Eye,
  EyeOff,
  Gift,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProximosCampeonatosAdmin,
  type TemporadaFuturaAdmin,
} from "../../hooks/hook_proximos_campeonatos_admin";
import FormCriarTemporada from "./FormCriarTemporada";
import ModalCancelarTemporada from "./ModalCancelarTemporada";
import SheetConfigurarPremiosTemporada from "./SheetConfigurarPremiosTemporada";

interface Props {
  brandId: string;
  branchId: string;
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatarMoeda(cents: number | null, currency: string | null): string {
  const valor = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(valor);
  } catch {
    return `R$ ${valor.toFixed(2)}`;
  }
}

export default function ProximosCampeonatosAdmin({ brandId, branchId }: Props) {
  const [modalCriar, setModalCriar] = useState(false);
  const { data, isLoading, isError, refetch } = useProximosCampeonatosAdmin(
    brandId,
    branchId,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Próximos campeonatos
          </CardTitle>
          <Button size="sm" onClick={() => setModalCriar(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Programar novo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Temporadas futuras desta cidade — programe, publique ou cancele
          antes do início da fase de classificação.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : isError ? (
          <div className="text-sm text-center py-4 space-y-2">
            <p className="text-destructive">
              Erro ao carregar próximos campeonatos.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma temporada programada. Use o botão acima para criar uma.
          </p>
        ) : (
          data.map((t) => (
            <CardTemporadaFutura
              key={t.id}
              temporada={t}
              brandId={brandId}
              branchId={branchId}
            />
          ))
        )}
      </CardContent>

      <FormCriarTemporada
        open={modalCriar}
        onClose={() => setModalCriar(false)}
        brandId={brandId}
        branchId={branchId}
      />
    </Card>
  );
}

function CardTemporadaFutura({
  temporada,
  brandId,
  branchId,
}: {
  temporada: TemporadaFuturaAdmin;
  brandId: string;
  branchId: string;
}) {
  const qc = useQueryClient();
  const [premiosAberto, setPremiosAberto] = useState(false);
  const [cancelarAberto, setCancelarAberto] = useState(false);

  function invalidar() {
    qc.invalidateQueries({
      queryKey: ["empreendedor-proximos-campeonatos", brandId, branchId],
    });
  }

  const publicar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("campeonato_seasons")
        .update({ published_at: new Date().toISOString() })
        .eq("id", temporada.id)
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .select("id, published_at");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Sem permissão para publicar esta temporada.");
      }
      return data[0];
    },
    onSuccess: () => {
      toast.success("Temporada publicada para os motoristas.");
      invalidar();
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Não foi possível publicar."),
  });

  const despublicar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("campeonato_seasons")
        .update({ published_at: null })
        .eq("id", temporada.id)
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .select("id, published_at");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Sem permissão para despublicar esta temporada.");
      }
      return data[0];
    },
    onSuccess: () => {
      toast.success("Temporada removida da vitrine dos motoristas.");
      invalidar();
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Não foi possível despublicar."),
  });

  const publicada = !!temporada.published_at;
  const ehPaga = (temporada.entry_fee_cents ?? 0) > 0;

  return (
    <article className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold truncate">{temporada.name}</h3>
          <p className="text-[11px] text-muted-foreground">
            Classificação: {formatarData(temporada.classification_starts_at)} →{" "}
            {formatarData(temporada.classification_ends_at)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Mata-mata: {formatarData(temporada.knockout_starts_at)} →{" "}
            {formatarData(temporada.knockout_ends_at)}
          </p>
          {(temporada.enrollment_opens_at || temporada.enrollment_closes_at) && (
            <p className="text-[11px] text-muted-foreground">
              Inscrições: {formatarData(temporada.enrollment_opens_at)} →{" "}
              {formatarData(temporada.enrollment_closes_at)}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={
            publicada
              ? "text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
              : "text-[10px] bg-muted text-muted-foreground"
          }
        >
          {publicada ? "Publicada" : "Rascunho"}
        </Badge>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        {ehPaga ? (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30 text-[10px]">
            {formatarMoeda(temporada.entry_fee_cents, temporada.entry_fee_currency)}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/30 text-[10px]">
            GRÁTIS
          </Badge>
        )}
        {!!temporada.tiers_count && (
          <Badge variant="outline" className="text-[10px]">
            {temporada.tiers_count} séries
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPremiosAberto(true)}
        >
          <Gift className="mr-1.5 h-3.5 w-3.5" />
          Configurar prêmios
        </Button>
        {publicada ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => despublicar.mutate()}
            disabled={despublicar.isPending}
          >
            {despublicar.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            )}
            Despublicar
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => publicar.mutate()}
            disabled={publicar.isPending}
          >
            {publicar.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="mr-1.5 h-3.5 w-3.5" />
            )}
            Publicar
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setCancelarAberto(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Cancelar
        </Button>
      </div>

      <SheetConfigurarPremiosTemporada
        open={premiosAberto}
        onClose={() => setPremiosAberto(false)}
        seasonId={temporada.id}
        seasonName={temporada.name}
        tiers={[]}
      />

      <ModalCancelarTemporada
        open={cancelarAberto}
        onClose={() => {
          setCancelarAberto(false);
          invalidar();
        }}
        seasonId={temporada.id}
        brandId={brandId}
        seasonName={temporada.name}
      />
    </article>
  );
}