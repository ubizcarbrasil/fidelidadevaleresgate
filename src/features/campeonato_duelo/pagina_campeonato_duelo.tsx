import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, ListOrdered, Swords as SwordsIcon, ShieldAlert } from "lucide-react";
import { useTemporadasCidade } from "./hooks/hook_campeonato";
import ModalCriarTemporada from "./components/modal_criar_temporada";
import SeletorTemporada from "./components/seletor_temporada";
import CabecalhoTemporada from "./components/cabecalho_temporada";
import TabelaClassificacao from "./components/tabela_classificacao";
import QuadroChaveamento from "./components/quadro_chaveamento";
import PaginaAuditoriaCampeonato from "./pagina_auditoria_campeonato";

interface Props {
  brandId: string;
  branchId: string;
}

export default function PaginaCampeonatoDuelo({ brandId, branchId }: Props) {
  const { data: temporadas, isLoading } = useTemporadasCidade(branchId);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (!seasonId && temporadas && temporadas.length > 0) {
      setSeasonId(temporadas[0].id);
    }
    if (seasonId && temporadas && !temporadas.find((t) => t.id === seasonId)) {
      setSeasonId(temporadas[0]?.id ?? null);
    }
  }, [temporadas, seasonId]);

  const temporadaSelecionada = temporadas?.find((t) => t.id === seasonId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (!temporadas || temporadas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-base font-semibold">Nenhum campeonato criado</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Crie a primeira temporada para começar a gerar classificação e mata-mata.
          </p>
          <Button onClick={() => setModalAberto(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar temporada
          </Button>
        </div>
        <ModalCriarTemporada
          open={modalAberto}
          onClose={() => setModalAberto(false)}
          brandId={brandId}
          branchId={branchId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SeletorTemporada
          temporadas={temporadas}
          valor={seasonId}
          aoMudar={setSeasonId}
        />
        <Button onClick={() => setModalAberto(true)} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nova temporada
        </Button>
      </div>

      {temporadaSelecionada && (
        <>
          <CabecalhoTemporada temporada={temporadaSelecionada} />

          <Tabs defaultValue="classificacao" className="w-full">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="classificacao" className="flex items-center gap-1.5">
                <ListOrdered className="h-3.5 w-3.5" /> Classificação
              </TabsTrigger>
              <TabsTrigger value="chaveamento" className="flex items-center gap-1.5">
                <SwordsIcon className="h-3.5 w-3.5" /> Mata-mata
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> Auditoria
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classificacao" className="mt-4">
              <TabelaClassificacao seasonId={temporadaSelecionada.id} />
            </TabsContent>
            <TabsContent value="chaveamento" className="mt-4">
              <QuadroChaveamento
                seasonId={temporadaSelecionada.id}
                temporada={temporadaSelecionada}
              />
            </TabsContent>
            <TabsContent value="auditoria" className="mt-4">
              <PaginaAuditoriaCampeonato branchId={branchId} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <ModalCriarTemporada
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        brandId={brandId}
        branchId={branchId}
      />
    </div>
  );
}