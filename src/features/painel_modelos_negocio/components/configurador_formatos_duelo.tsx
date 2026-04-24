/**
 * ConfiguradorFormatosDuelo — Camada 2
 * Bloco visível apenas para Root Admin dentro do CardModeloBrand
 * quando o modelo é o `duelo_motorista`.
 * Permite habilitar/desabilitar Duelo 1v1, Desafio na cidade e Campeonato
 * por marca.
 */
import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import {
  useDefinirFormatosPermitidos,
  useFormatosPermitidos,
  type FormatoEngajamentoChave,
} from "@/compartilhados/hooks/hook_formatos_permitidos";
import { useFormatoEngajamento } from "@/features/campeonato_duelo/hooks/hook_formato_engajamento";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ROTULOS_FORMATO } from "@/features/campeonato_duelo/constants/constantes_templates";

interface Props {
  brandId: string;
}

const ORDEM: FormatoEngajamentoChave[] = ["duelo", "mass_duel", "campeonato"];

export default function ConfiguradorFormatosDuelo({ brandId }: Props) {
  const { formatos, isLoading } = useFormatosPermitidos(brandId);
  const { formato: ativo } = useFormatoEngajamento(brandId);
  const definir = useDefinirFormatosPermitidos();

  const [local, setLocal] = useState<FormatoEngajamentoChave[]>([]);
  const [confirmarRemoverAtivo, setConfirmarRemoverAtivo] = useState(false);

  useEffect(() => {
    if (!isLoading) setLocal(formatos);
  }, [formatos, isLoading]);

  const dirty = useMemo(() => {
    if (local.length !== formatos.length) return true;
    const a = [...local].sort().join(",");
    const b = [...formatos].sort().join(",");
    return a !== b;
  }, [local, formatos]);

  function alternar(f: FormatoEngajamentoChave, ligar: boolean) {
    setLocal((prev) => {
      const novo = ligar ? [...prev, f] : prev.filter((x) => x !== f);
      // Mantém a ordem canônica (estável)
      return ORDEM.filter((o) => novo.includes(o));
    });
  }

  function tentarSalvar() {
    if (local.length < 1) return;
    if (ativo && !local.includes(ativo as FormatoEngajamentoChave)) {
      setConfirmarRemoverAtivo(true);
      return;
    }
    salvar();
  }

  function salvar() {
    definir.mutate({ brandId, formatos: local });
    setConfirmarRemoverAtivo(false);
  }

  return (
    <>
      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold">
            Formatos disponíveis (Root Admin)
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Defina quais modalidades a marca pode usar. O empreendedor escolhe entre
          as liberadas (1 ativa por vez).
        </p>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-2">
            {ORDEM.map((f) => {
              const ligado = local.includes(f);
              const isUnico = ligado && local.length === 1;
              return (
                <div
                  key={f}
                  className="flex items-center justify-between gap-2 rounded border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium truncate">
                      {ROTULOS_FORMATO[f]}
                    </span>
                    {ativo === f && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        Ativo
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={ligado}
                    onCheckedChange={(v) => !isUnico && alternar(f, v)}
                    disabled={isUnico || definir.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground">
            {local.length} de 3 liberados
          </span>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!dirty || definir.isPending || local.length < 1}
            onClick={tentarSalvar}
          >
            {definir.isPending && (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirmarRemoverAtivo}
        onOpenChange={(v) => !v && setConfirmarRemoverAtivo(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar o formato atual?</AlertDialogTitle>
            <AlertDialogDescription>
              O formato ativo desta marca é{" "}
              <strong>{ativo && ROTULOS_FORMATO[ativo]}</strong> e não está mais
              entre os liberados. Ao confirmar, o formato ativo será trocado
              automaticamente para{" "}
              <strong>{local[0] && ROTULOS_FORMATO[local[0]]}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={definir.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={salvar} disabled={definir.isPending}>
              {definir.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}