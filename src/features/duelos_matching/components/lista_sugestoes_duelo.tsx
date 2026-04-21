import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Swords, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSugestoesDuelo } from "../hooks/hook_sugestoes_duelo";
import {
  classificarScore,
  formatarFaixa,
  formatarTier,
} from "../utils/formatadores_matching";
import type {
  ParSugerido,
  ToleranciaMatching,
} from "../types/tipos_duelos_matching";

interface Props {
  branchId: string;
  selecionados: Set<string>;
  onToggleSelecao: (parKey: string, par: ParSugerido) => void;
  onSelecionarTodos: (pares: ParSugerido[]) => void;
  onLimparSelecao: () => void;
  onCriarUnico: (par: ParSugerido) => void;
  onAbrirCriarLote: () => void;
  toleranciaSelecionada: ToleranciaMatching;
  onMudarTolerancia: (t: ToleranciaMatching) => void;
}

export function chaveDoPar(par: ParSugerido): string {
  return `${par.a_customer_id}-${par.b_customer_id}`;
}

/**
 * Painel de sugestões de duelo: cada linha mostra dois motoristas similares
 * com score, métricas e ações rápidas (criar único / selecionar para lote).
 */
export default function ListaSugestoesDuelo({
  branchId,
  selecionados,
  onToggleSelecao,
  onSelecionarTodos,
  onLimparSelecao,
  onCriarUnico,
  onAbrirCriarLote,
  toleranciaSelecionada,
  onMudarTolerancia,
}: Props) {
  const { data, isLoading, isError, refetch } = useSugestoesDuelo(branchId, toleranciaSelecionada);

  const pares = useMemo(() => data?.pairs ?? [], [data]);
  const semDados = useMemo(() => data?.no_data_drivers ?? [], [data]);

  const todosSelecionados = pares.length > 0 && pares.every(p => selecionados.has(chaveDoPar(p)));

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Sugestões de duelo (matching automático)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pares calculados por volume de corridas, faixa horária e tier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={toleranciaSelecionada} onValueChange={(v) => onMudarTolerancia(v as ToleranciaMatching)}>
              <SelectTrigger className="h-9 w-full md:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estrita">Tolerância estrita</SelectItem>
                <SelectItem value="media">Tolerância média</SelectItem>
                <SelectItem value="folgada">Tolerância folgada</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={onAbrirCriarLote}
              disabled={selecionados.size === 0 && pares.length === 0}
              className="gap-1"
            >
              <Swords className="h-4 w-4" />
              Criar duelos em massa
            </Button>
          </div>
        </div>

        {pares.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Checkbox
              checked={todosSelecionados}
              onCheckedChange={(checked) => {
                if (checked) onSelecionarTodos(pares);
                else onLimparSelecao();
              }}
            />
            <span>Selecionar todos ({pares.length} pares)</span>
            {selecionados.size > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selecionados.size} selecionado(s)
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-sm text-destructive">
            Falha ao carregar sugestões.
            <Button variant="link" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        )}

        {!isLoading && !isError && pares.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Users className="h-8 w-8 opacity-50" />
            <p>Nenhum par compatível encontrado com a tolerância atual.</p>
            <p className="text-xs">Tente uma tolerância mais folgada ou habilite mais motoristas.</p>
          </div>
        )}

        {pares.length > 0 && (
          <div className="space-y-2">
            {pares.map((par) => {
              const key = chaveDoPar(par);
              const selecionado = selecionados.has(key);
              const cls = classificarScore(par.score);
              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors md:flex-row md:items-center",
                    selecionado && "border-primary bg-primary/5",
                  )}
                >
                  <Checkbox
                    checked={selecionado}
                    onCheckedChange={() => onToggleSelecao(key, par)}
                  />

                  <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr]">
                    <MotoristaInfo
                      nome={par.a_nome}
                      rides={par.a_rides_30d}
                      bucket={par.a_hour_bucket}
                      tier={par.a_tier}
                    />
                    <div className="flex items-center justify-center text-xs font-bold text-muted-foreground">
                      VS
                    </div>
                    <MotoristaInfo
                      nome={par.b_nome}
                      rides={par.b_rides_30d}
                      bucket={par.b_hour_bucket}
                      tier={par.b_tier}
                    />
                  </div>

                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Badge
                      variant={cls.tone === "alto" ? "default" : cls.tone === "medio" ? "secondary" : "outline"}
                    >
                      {Math.round(par.score)}% · {cls.label}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onCriarUnico(par)} className="gap-1">
                      <Swords className="h-3.5 w-3.5" /> Criar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {semDados.length > 0 && (
          <div className="mt-6 rounded-md border border-dashed bg-muted/30 p-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  {semDados.length} motorista(s) elegível(is) sem corridas nos últimos 30 dias
                </p>
                <p className="mt-0.5">
                  Não foram pareados automaticamente. Você pode criá-los manualmente pelo botão "Criar".
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MotoristaInfo({
  nome,
  rides,
  bucket,
  tier,
}: {
  nome: string;
  rides: number;
  bucket: ParSugerido["a_hour_bucket"];
  tier: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold leading-tight">{nome}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        <span>{rides} corrida{rides !== 1 ? "s" : ""}/30d</span>
        <span>·</span>
        <span>{formatarFaixa(bucket)}</span>
        {tier && (
          <>
            <span>·</span>
            <span>{formatarTier(tier)}</span>
          </>
        )}
      </div>
    </div>
  );
}