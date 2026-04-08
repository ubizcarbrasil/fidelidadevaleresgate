import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History, CheckCircle, XCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPoints } from "@/lib/formatPoints";
import { useHistoricoNotificacoesMotorista, type NotificacaoMotorista } from "../hooks/hook_historico_notificacoes_motorista";

interface Props {
  brandId: string;
  getBranchName: (id: string | null) => string;
}

function LinhaNotificacao({ item, getBranchName }: { item: NotificacaoMotorista; getBranchName: (id: string | null) => string }) {
  const [aberto, setAberto] = useState(false);
  const isError = item.status === "error";

  return (
    <>
      <TableRow className={isError ? "bg-destructive/5" : ""}>
        <TableCell className="py-2">
          {isError ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          )}
        </TableCell>
        <TableCell className="py-2 text-xs font-medium max-w-[120px] truncate">
          {item.driver_name || "—"}
        </TableCell>
        <TableCell className="py-2 text-xs tabular-nums">
          {isError ? "—" : formatPoints(item.points_credited)}
        </TableCell>
        <TableCell className="py-2 text-xs tabular-nums hidden sm:table-cell">
          {isError ? "—" : `R$ ${Number(item.ride_value).toFixed(2)}`}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground hidden md:table-cell">
          {getBranchName(item.branch_id)}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(item.created_at), "dd/MM HH:mm", { locale: ptBR })}
        </TableCell>
        <TableCell className="py-2">
          {isError && (
            <Collapsible open={aberto} onOpenChange={setAberto}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  {aberto ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </TableCell>
      </TableRow>
      {isError && aberto && (
        <TableRow>
          <TableCell colSpan={7} className="py-2 px-4 bg-destructive/5">
            <p className="text-xs text-destructive">{item.error_message}</p>
            {item.error_details && (
              <pre className="text-[10px] text-muted-foreground mt-1 overflow-x-auto max-w-full">
                {JSON.stringify(item.error_details, null, 2)}
              </pre>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function HistoricoNotificacoesMotorista({ brandId, getBranchName }: Props) {
  const { data: items, isLoading, refetch, isFetching } = useHistoricoNotificacoesMotorista(brandId);

  const totalSucesso = items?.filter((i) => i.status === "success").length || 0;
  const totalErro = items?.filter((i) => i.status === "error").length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-primary" />
              Histórico de notificações
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Últimas notificações enviadas aos motoristas via chat do app
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
              {totalSucesso} enviadas
            </Badge>
            {totalErro > 0 && (
              <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                {totalErro} falhas
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !items?.length ? (
          <p className="text-center text-xs text-muted-foreground py-8">Nenhuma notificação registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs">Motorista</TableHead>
                  <TableHead className="text-xs">Pontos</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Valor</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Cidade</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <LinhaNotificacao key={item.id} item={item} getBranchName={getBranchName} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
