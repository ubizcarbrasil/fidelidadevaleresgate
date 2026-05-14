import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gift } from "lucide-react";
import EditorPremiosTemporada from "./EditorPremiosTemporada";
import EditorPremiosArtilharia from "./EditorPremiosArtilharia";

interface TierResumo {
  tier_id: string;
  tier_name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  seasonId: string;
  seasonName: string;
  tiers: TierResumo[];
}

/**
 * Sheet com duas abas — prêmios por posição (tier) e prêmios extras
 * por janela de Artilharia. Reutiliza os editores existentes.
 */
export default function SheetConfigurarPremiosTemporada({
  open,
  onClose,
  seasonId,
  seasonName,
  tiers,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Prêmios — {seasonName}</SheetTitle>
          <SheetDescription>
            Configure premiação por posição e prêmios extras de artilharia.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="posicao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posicao" className="text-xs">
              <Trophy className="mr-1.5 h-3.5 w-3.5" />
              Por posição
            </TabsTrigger>
            <TabsTrigger value="artilharia" className="text-xs">
              <Gift className="mr-1.5 h-3.5 w-3.5" />
              Artilharia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posicao" className="mt-0">
            {tiers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Esta temporada ainda não possui séries — distribua os
                motoristas para configurar prêmios por posição.
              </p>
            ) : (
              <EditorPremiosTemporada
                seasonId={seasonId}
                tiers={tiers}
                incluirArtilharia={false}
              />
            )}
          </TabsContent>

          <TabsContent value="artilharia" className="mt-0">
            <EditorPremiosArtilharia seasonId={seasonId} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}