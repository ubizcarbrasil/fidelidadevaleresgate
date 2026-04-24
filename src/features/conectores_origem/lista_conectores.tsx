import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAllSyncConfigs, fetchSourceCatalog } from "@/lib/api/mirrorSync";
import CardConector from "./componentes/card_conector";
import ModalConector from "./componentes/modal_conector";

interface Props {
  brandId: string;
  /** Filtra os conectores listados pela origem ativa no seletor superior. */
  sourceType?: string;
}

export default function ListaConectores({ brandId, sourceType }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);

  const { data: catalog = [] } = useQuery({
    queryKey: ["source-catalog-enabled"],
    queryFn: () => fetchSourceCatalog({ onlyEnabled: true }),
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ["all-mirror-configs", brandId],
    queryFn: () => fetchAllSyncConfigs(brandId),
  });

  const filtered = (configs || []).filter((c: any) =>
    !sourceType ? true : c.source_type === sourceType
  );

  const sourceLabelOf = (key: string) =>
    catalog.find((c) => c.source_key === key)?.display_name || key;
  const sourceIconOf = (key: string) =>
    catalog.find((c) => c.source_key === key)?.icon || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Conectores</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre uma ou mais URLs por origem. Cada conector roda de forma independente.
          </p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar conector
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum conector cadastrado{sourceType ? ` para "${sourceLabelOf(sourceType)}"` : ""}.
            <br />
            Clique em <strong>Adicionar conector</strong> para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((cfg: any) => (
            <CardConector
              key={cfg.id}
              config={cfg}
              brandId={brandId}
              sourceLabel={sourceLabelOf(cfg.source_type)}
              sourceIcon={sourceIconOf(cfg.source_type)}
              onEditar={() => { setEditando(cfg); setModalOpen(true); }}
            />
          ))}
        </div>
      )}

      <ModalConector
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        brandId={brandId}
        catalog={catalog}
        config={editando}
        defaultSourceType={sourceType}
      />
    </div>
  );
}