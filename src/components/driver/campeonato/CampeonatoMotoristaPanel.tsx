import { useState } from "react";
import { ArrowLeft, Trophy, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useTemporadaAtivaDoMotorista } from "@/features/campeonato_duelo/hooks/hook_campeonato_motorista";
import CardTemporadaAtual from "@/features/campeonato_duelo/components/motorista/CardTemporadaAtual";
import RankingCentrado from "@/features/campeonato_duelo/components/motorista/RankingCentrado";
import CardConfrontoAtual from "@/features/campeonato_duelo/components/motorista/CardConfrontoAtual";
import ListaHistorico from "@/features/campeonato_duelo/components/motorista/ListaHistorico";
import TabelaCompletaSerie from "@/features/campeonato_duelo/components/motorista/TabelaCompletaSerie";
import BracketCompleto from "@/features/campeonato_duelo/components/motorista/BracketCompleto";

interface Props {
  brandId: string;
  fontHeading?: string;
  onBack: () => void;
}

type SubOverlay = "tabela" | "bracket" | "historico" | null;

export default function CampeonatoMotoristaPanel({
  brandId,
  fontHeading,
  onBack,
}: Props) {
  const { driver } = useDriverSession();
  const driverId = driver?.id ?? null;
  const { data: temporada, isLoading } = useTemporadaAtivaDoMotorista(
    brandId,
    driverId,
  );

  const [overlay, setOverlay] = useState<SubOverlay>(null);
  const isPendingSeeding = !!temporada?.is_pending_seeding;
  const hasTier = !!temporada && !!temporada.tier_id && !!temporada.tier_name;
  const isClassification = temporada?.phase === "classification";
  const isFirstSeason = temporada !== null && temporada !== undefined;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Trophy className="h-5 w-5 text-primary" />
            <p
              className="font-bold text-base"
              style={{ fontFamily: fontHeading }}
            >
              Campeonato
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : !temporada ? (
          <div className="text-center py-12 space-y-2">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p
              className="font-bold text-base"
              style={{ fontFamily: fontHeading }}
            >
              Nenhum campeonato ativo
            </p>
            <p className="text-sm text-muted-foreground">
              Aguarde o próximo período. Quando uma temporada começar, você
              será adicionado automaticamente.
            </p>
          </div>
        ) : isPendingSeeding ? (
          <div className="text-center py-12 space-y-2">
            <Clock className="h-12 w-12 mx-auto text-primary/60" />
            <p
              className="font-bold text-base"
              style={{ fontFamily: fontHeading }}
            >
              {temporada.season_name} começa em breve
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              A temporada foi criada e você será adicionado automaticamente
              assim que o empreendedor concluir a distribuição das séries.
              Esta tela atualiza sozinha quando isso acontecer.
            </p>
          </div>
        ) : (
          <>
            <CardTemporadaAtual
              temporada={temporada}
              fontHeading={fontHeading}
            />

            {hasTier && (
              <RankingCentrado
                seasonId={temporada.season_id}
                driverId={driverId!}
                fontHeading={fontHeading}
                onVerTabelaCompleta={() => setOverlay("tabela")}
              />
            )}

            {hasTier && !isClassification && (
              <CardConfrontoAtual
                seasonId={temporada.season_id}
                driverId={driverId!}
                fontHeading={fontHeading}
                onVerChaveamento={() => setOverlay("bracket")}
              />
            )}

            {isFirstSeason && driverId && (
              <ListaHistorico
                brandId={brandId}
                driverId={driverId}
                fontHeading={fontHeading}
                limite={3}
                onVerTudo={() => setOverlay("historico")}
              />
            )}
          </>
        )}
      </div>

      {/* Sub-overlay: Tabela completa */}
      <Sheet
        open={overlay === "tabela"}
        onOpenChange={(open) => !open && setOverlay(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 overflow-y-auto"
        >
          <div className="sticky top-0 bg-background border-b border-border px-4 py-3 z-10">
            <p
              className="font-bold text-base"
              style={{ fontFamily: fontHeading }}
            >
              Tabela · {temporada?.tier_name}
            </p>
          </div>
          {temporada && driverId && temporada.tier_name && (
            <TabelaCompletaSerie
              seasonId={temporada.season_id}
              driverId={driverId}
              tierName={temporada.tier_name}
              fontHeading={fontHeading}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Sub-overlay: Chaveamento */}
      <Sheet
        open={overlay === "bracket"}
        onOpenChange={(open) => !open && setOverlay(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 overflow-y-auto"
        >
          <div className="sticky top-0 bg-background border-b border-border px-4 py-3 z-10">
            <p
              className="font-bold text-base"
              style={{ fontFamily: fontHeading }}
            >
              Chaveamento · {temporada?.tier_name}
            </p>
          </div>
          {temporada && driverId && (
            <BracketCompleto
              seasonId={temporada.season_id}
              driverId={driverId}
              fontHeading={fontHeading}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Sub-overlay: Histórico expandido */}
      <Sheet
        open={overlay === "historico"}
        onOpenChange={(open) => !open && setOverlay(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 overflow-y-auto"
        >
          <div className="sticky top-0 bg-background border-b border-border px-4 py-3 z-10">
            <p
              className="font-bold text-base"
              style={{ fontFamily: fontHeading }}
            >
              Histórico Completo
            </p>
          </div>
          <div className="p-4">
            {driverId && (
              <ListaHistorico
                brandId={brandId}
                driverId={driverId}
                fontHeading={fontHeading}
                limite={50}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}