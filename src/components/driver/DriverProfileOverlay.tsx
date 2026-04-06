import React, { useEffect, useState } from "react";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPoints } from "@/lib/formatPoints";
import { ArrowLeft, LogOut, Coins, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ConquistasMotoristaSheet from "./duels/ConquistasMotoristaSheet";

interface LedgerEntry {
  id: string;
  entry_type: string;
  points_amount: number;
  reason: string | null;
  reference_type: string | null;
  created_at: string;
  branch_name: string | null;
}

function displayName(name: string) {
  return name.replace(/\[MOTORISTA\]\s*/gi, "").trim();
}

function formatCpfDisplay(cpf: string | null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

interface Props {
  fontHeading?: string;
  onBack: () => void;
}

export default function DriverProfileOverlay({ fontHeading, onBack }: Props) {
  const { driver, logout } = useDriverSession();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [conquistasOpen, setConquistasOpen] = useState(false);

  useEffect(() => {
    if (!driver) return;
    supabase
      .rpc("get_driver_ledger", { p_customer_id: driver.id })
      .then(({ data }) => {
        setLedger((data as LedgerEntry[]) || []);
        setLoadingLedger(false);
      });
  }, [driver]);

  if (!driver) return null;

  const handleLogout = () => {
    logout();
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted">
          <ArrowLeft className="h-4.5 w-4.5 text-foreground" />
        </button>
        <h1 className="text-base font-bold" style={{ fontFamily: fontHeading || "inherit" }}>
          Minha Conta
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Points card */}
        <div className="mx-4 mt-4 rounded-2xl p-5" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
          <p className="text-xs opacity-80 mb-1">Seu saldo</p>
          <div className="flex items-baseline gap-2">
            <Coins className="h-6 w-6" />
            <span className="text-3xl font-extrabold" style={{ fontFamily: fontHeading || "inherit" }}>
              {formatPoints(driver.points_balance)}
            </span>
            <span className="text-sm font-semibold opacity-80">pontos</span>
          </div>
        </div>

        {/* Personal info */}
        <div className="mx-4 mt-5 rounded-2xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading || "inherit" }}>
            Dados pessoais
          </h2>
          <InfoRow label="Nome" value={displayName(driver.name)} />
          <InfoRow label="CPF" value={formatCpfDisplay(driver.cpf)} />
          <InfoRow label="E-mail" value={driver.email || "—"} />
          <InfoRow label="Telefone" value={driver.phone || "—"} />
          <InfoRow label="Cidade" value={(driver.branches as any)?.name || "—"} />
        </div>

        {/* Points statement */}
        <div className="mx-4 mt-5">
          <h2 className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: fontHeading || "inherit" }}>
            Extrato de pontos
          </h2>
          {loadingLedger ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma movimentação ainda</p>
          ) : (
            <div className="space-y-2">
              {ledger.map((entry) => {
                const isPositive = entry.entry_type === "CREDIT";
                return (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {entry.reason || (isPositive ? "Pontos recebidos" : "Pontos utilizados")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ml-3 ${isPositive ? "text-emerald-500" : "text-red-400"}`}>
                      {isPositive ? "+" : "-"}{formatPoints(Math.abs(entry.points_amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="mx-4 mt-8">
          <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
