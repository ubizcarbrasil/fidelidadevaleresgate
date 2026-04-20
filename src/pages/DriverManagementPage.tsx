import { useState } from "react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useDebounce } from "@/hooks/useDebounce";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Eye, Gift, Download, Users } from "lucide-react";
import DriverDetailSheet from "@/components/driver-management/DriverDetailSheet";
import ManualDriverScoringDialog from "@/components/machine-integration/ManualDriverScoringDialog";
import ModalImportarMotoristas from "@/features/importacao_motoristas/components/modal_importar_motoristas";
import DriverNotificationConfig from "@/components/driver-management/DriverNotificationConfig";
import { formatPoints } from "@/lib/formatPoints";
import {
  useListagemMotoristas,
  type StatusFiltro,
} from "@/features/gestao_motoristas/hooks/hook_listagem_motoristas";
import BarraBuscaMotoristas from "@/features/gestao_motoristas/components/barra_busca_motoristas";
import PaginacaoMotoristas from "@/features/gestao_motoristas/components/paginacao_motoristas";

import type { DriverRow } from "@/types/driver";
export type { DriverRow } from "@/types/driver";

const POR_PAGINA = 50;

export default function DriverManagementPage() {
  const { currentBrandId, currentBranchId, consoleScope } = useBrandGuard();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<StatusFiltro>("ALL");
  const [pagina, setPagina] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<DriverRow | null>(null);
  const [bonusDriver, setBonusDriver] = useState<DriverRow | null>(null);
  const buscaDebounced = useDebounce(busca, 300);

  const isBranchScope = consoleScope === "BRANCH" && !!currentBranchId;

  const { data: resultado, isLoading } = useListagemMotoristas({
    brandId: currentBrandId,
    branchId: currentBranchId,
    isBranchScope,
    busca: buscaDebounced,
    statusFiltro: status,
    pagina,
    porPagina: POR_PAGINA,
  });

  const motoristas = resultado?.motoristas ?? [];
  const total = resultado?.total ?? 0;
  const totalPaginas = resultado?.totalPaginas ?? 1;

  const handleBusca = (v: string) => {
    setBusca(v);
    setPagina(1);
  };
  const handleStatus = (v: StatusFiltro) => {
    setStatus(v);
    setPagina(1);
  };

  const cleanName = (name: string | null) =>
    name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    const digits = cpf.replace(/\D/g, "").padStart(11, "0");
    if (digits.length === 11)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    return cpf;
  };

  const handleExportCsv = () => {
    if (motoristas.length === 0) return;
    const header = "Nome,CPF,Telefone,Email,Saldo Pontos,Pontos Corridas,Tier,Pontuação Ativa";
    const rows = motoristas.map((c: DriverRow) =>
      [
        `"${cleanName(c.name).replace(/"/g, '""')}"`,
        c.cpf || "",
        c.phone || "",
        c.email || "",
        c.points_balance,
        c.total_ride_points,
        c.customer_tier || "",
        c.scoring_disabled ? "Não" : "Sim",
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motoristas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {currentBrandId && (
        <DriverNotificationConfig brandId={currentBrandId} branchId={currentBranchId} />
      )}

      <PageHeader
        title="Gestão de Motoristas"
        description={
          isBranchScope
            ? "Gerencie dados, pontuação e regras dos motoristas da sua cidade."
            : "Gerencie dados, pontuação e regras de todos os motoristas da marca."
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <BarraBuscaMotoristas
          busca={busca}
          onBuscaChange={handleBusca}
          status={status}
          onStatusChange={handleStatus}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-400/30 text-xs whitespace-nowrap">
            <Users className="h-3 w-3 mr-1" />
            {total.toLocaleString("pt-BR")} motoristas
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={motoristas.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline sm:inline">Exportar </span>CSV
          </Button>
          {currentBrandId && (
            <ModalImportarMotoristas
              brandId={currentBrandId}
              branchId={isBranchScope ? currentBranchId : null}
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : motoristas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Truck className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {buscaDebounced || status !== "ALL"
              ? "Nenhum motorista encontrado"
              : "Nenhum motorista cadastrado ainda"}
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[calc(100vh-380px)] sm:h-[calc(100vh-320px)]">
            <div className="space-y-2">
              {motoristas.map((driver: DriverRow) => (
                <div
                  key={driver.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{cleanName(driver.name)}</span>
                        {driver.scoring_disabled && (
                          <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                            Pontuação desativada
                          </Badge>
                        )}
                        {driver.customer_tier && driver.customer_tier !== "INICIANTE" && (
                          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-400/30 text-[10px]">
                            {driver.customer_tier}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {driver.branch_name && <span>📍 {driver.branch_name}</span>}
                        {driver.cpf && <span>CPF: {formatCpf(driver.cpf)}</span>}
                        {driver.phone && <span>Tel: {driver.phone}</span>}
                        {driver.email && <span className="hidden sm:inline">{driver.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-12 sm:pl-0">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-400/30 text-xs font-mono">
                        {formatPoints(driver.points_balance)} pts
                      </Badge>
                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-400/30 text-xs font-mono">
                        +{formatPoints(driver.total_ride_points)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        🚗 {driver.total_rides}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-primary"
                        title="Bonificar"
                        onClick={() => setBonusDriver(driver)}
                      >
                        <Gift className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        title="Abrir detalhes"
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <PaginacaoMotoristas
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            porPagina={POR_PAGINA}
            onMudarPagina={setPagina}
          />
        </>
      )}

      <DriverDetailSheet
        driver={selectedDriver}
        brandId={currentBrandId || ""}
        onClose={() => setSelectedDriver(null)}
      />

      <ManualDriverScoringDialog
        open={!!bonusDriver}
        onOpenChange={(open) => {
          if (!open) setBonusDriver(null);
        }}
        driver={
          bonusDriver
            ? { id: bonusDriver.id, name: bonusDriver.name, branch_id: bonusDriver.branch_id ?? undefined }
            : null
        }
        brandId={currentBrandId || ""}
      />
    </div>
  );
}
