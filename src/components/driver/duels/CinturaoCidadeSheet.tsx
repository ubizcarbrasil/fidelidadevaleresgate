/**
 * Tela fullscreen premium do Cinturão da Cidade.
 */
import React from "react";
import { ArrowLeft, Crown, Award, Flame } from "lucide-react";
import { useCinturaoCidade } from "./hook_cinturao_cidade";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import CardCampeao from "./CardCampeao";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onBack: () => void;
}

export default function CinturaoCidadeSheet({ onBack }: Props) {
  const { driver } = useDriverSession();
  const branchId = driver?.branch_id || null;
  const { data: campeoes, isLoading } = useCinturaoCidade(branchId);

  const campeaoMensal = campeoes?.find((c) => c.record_type === "monthly") || null;
  const campeaoHistorico = campeoes?.find((c) => c.record_type === "all_time") || null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "hsl(var(--muted))" }}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Crown className="h-5 w-5" style={{ color: "hsl(45, 100%, 50%)" }} />
          Cinturão da Cidade
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-6 max-w-lg mx-auto w-full">
        {/* Banner motivacional */}
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: "linear-gradient(135deg, hsl(45 100% 50% / 0.1), hsl(35 100% 45% / 0.05))",
            border: "1px solid hsl(45 100% 50% / 0.2)",
          }}
        >
          <Award className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(45, 100%, 50%)" }} />
          <p className="text-sm font-bold text-foreground">O maior troféu da cidade</p>
          <p className="text-xs text-muted-foreground mt-1">
            Supere o recorde e conquiste o cinturão! 🥊
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {/* Campeão Mensal */}
        {!isLoading && campeaoMensal && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" style={{ color: "hsl(45, 100%, 50%)" }} />
              Campeão do Mês
            </h2>
            <CardCampeao campeao={campeaoMensal} />
          </section>
        )}

        {/* Campeão Histórico */}
        {!isLoading && campeaoHistorico && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Crown className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              Recorde Histórico
            </h2>
            <CardCampeao campeao={campeaoHistorico} />
          </section>
        )}

        {/* Empty state */}
        {!isLoading && !campeaoMensal && !campeaoHistorico && (
          <div className="text-center py-12">
            <Crown className="h-16 w-16 mx-auto mb-4" style={{ color: "hsl(var(--muted-foreground) / 0.2)" }} />
            <p className="text-sm font-bold text-foreground">Nenhum campeão ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              O cinturão está vago! Seja o primeiro a conquistá-lo. 🏆
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
