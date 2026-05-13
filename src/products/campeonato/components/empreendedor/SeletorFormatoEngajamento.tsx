import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Swords, Zap, Check } from "lucide-react";
import { useFormatoEngajamento } from "../../hooks/hook_formato_engajamento";
import { useTrocarFormato } from "../../hooks/hook_mutations_campeonato";
import {
  DESCRICOES_FORMATO,
  ROTULOS_FORMATO,
} from "../../constants/constantes_templates";
import type { FormatoEngajamento } from "../../types/tipos_motorista";
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
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormatosPermitidos } from "@/compartilhados/hooks/hook_formatos_permitidos";

interface Props {
  brandId: string;
}

const ICONES: Record<FormatoEngajamento, typeof Trophy> = {
  duelo: Swords,
  mass_duel: Zap,
  campeonato: Trophy,
};

export default function SeletorFormatoEngajamento({ brandId }: Props) {
  const { formato, isLoading } = useFormatoEngajamento(brandId);
  const { formatos: permitidos, isLoading: carregandoPermitidos } =
    useFormatosPermitidos(brandId);
  const { mutate, isPending } = useTrocarFormato();
  const [pendente, setPendente] = useState<FormatoEngajamento | null>(null);

  function aoConfirmar() {
    if (!pendente) return;
    mutate(
      { brandId, newFormat: pendente },
      { onSettled: () => setPendente(null) },
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formato de engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || carregandoPermitidos ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid gap-2 md:grid-cols-3">
              {(["duelo", "mass_duel", "campeonato"] as FormatoEngajamento[]).map((f) => {
                const ativo = f === formato;
                const Icone = ICONES[f];
                const liberado = permitidos.includes(f);
                const bloqueado = !liberado;

                const cardEl = (
                  <button
                    key={f}
                    type="button"
                    onClick={() => !ativo && !bloqueado && setPendente(f)}
                    disabled={isPending || bloqueado}
                    className={`group relative rounded-lg border p-3 text-left transition-all w-full ${
                      ativo
                        ? "border-primary bg-primary/5"
                        : bloqueado
                        ? "border-border opacity-60 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icone
                        className={`h-4 w-4 ${
                          bloqueado ? "text-muted-foreground" : "text-primary"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {ROTULOS_FORMATO[f]}
                      </span>
                      {ativo && !bloqueado && (
                        <Badge variant="secondary" className="ml-auto h-5 gap-1">
                          <Check className="h-3 w-3" /> Ativo
                        </Badge>
                      )}
                      {bloqueado && (
                        <Badge
                          variant="outline"
                          className="ml-auto h-5 gap-1 text-[10px]"
                        >
                          <Lock className="h-3 w-3" /> Bloqueado
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                      {DESCRICOES_FORMATO[f]}
                    </p>
                    {bloqueado && (
                      <p className="mt-1 text-[10px] text-muted-foreground italic">
                        Não disponível no seu plano
                      </p>
                    )}
                  </button>
                );

                if (!bloqueado) return <div key={f}>{cardEl}</div>;

                return (
                  <TooltipProvider key={f} delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>{cardEl}</div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Fale com o suporte para liberar este formato.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendente} onOpenChange={(v) => !v && setPendente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar formato de engajamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O formato atual é{" "}
              <strong>{ROTULOS_FORMATO[formato]}</strong> e será alterado para{" "}
              <strong>{pendente && ROTULOS_FORMATO[pendente]}</strong>. Essa ação só
              é permitida se não houver temporada ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={aoConfirmar} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Confirmar troca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
