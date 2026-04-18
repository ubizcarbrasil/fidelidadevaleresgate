import { useMemo, useState } from "react";
import { Settings2, MapPin, Info, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import {
  useBranchList,
  useCityModulesOverview,
  useClearAllOverrides,
  type OverviewLinhaCidade,
} from "@/features/central_modulos/hooks/hook_city_overrides";
import { CardModuloCidade } from "./components/card_modulo_cidade";
import { SeletorCidadeModulos } from "./components/seletor_cidade_modulos";

export default function PaginaConfiguracaoModulosCidade() {
  const { currentBrandId } = useBrandGuard();
  const brandId = currentBrandId;

  const [branchId, setBranchId] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [textConfirm, setTextConfirm] = useState("");

  const { data: branches = [], isLoading: loadingBranches } = useBranchList(brandId);
  const { data: lista = [], isLoading: loadingLista } = useCityModulesOverview(
    brandId, branchId || null
  );
  const clearMut = useClearAllOverrides();

  const branch = branches.find((b) => b.id === branchId);

  const overrideCount = useMemo(
    () => lista.filter((l) => l.state !== "inherit").length,
    [lista]
  );

  const grupos = useMemo(() => {
    const map = new Map<string, OverviewLinhaCidade[]>();
    lista.forEach((l) => {
      const cat = CATEGORY_META[l.module_category] ? l.module_category : "general";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(l);
    });
    return ORDEM_CATEGORIAS
      .filter((cat) => map.has(cat))
      .map((cat) => ({ cat, items: map.get(cat)! }));
  }, [lista]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Funcionalidades por Cidade</h1>
          <p className="text-sm text-muted-foreground">
            Habilite ou desabilite, em cada cidade, as funcionalidades liberadas para sua marca.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Selecione a cidade
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 md:items-center">
          <SeletorCidadeModulos
            branches={branches}
            branchId={branchId}
            onChange={setBranchId}
            loading={loadingBranches}
          />

          {branch && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline">{overrideCount} ajuste(s) ativo(s)</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setTextConfirm(""); setConfirmClear(true); }}
                disabled={overrideCount === 0}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Restaurar padrão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!branchId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Escolha uma cidade acima para gerenciar suas funcionalidades.
          </CardContent>
        </Card>
      )}

      {branchId && (
        <>
          <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Aqui aparecem apenas as funcionalidades que sua marca tem disponíveis.
              Cada cidade pode <strong>herdar</strong> a configuração da marca, <strong>forçar ligado</strong> ou
              <strong> forçar desligado</strong>. Funcionalidades essenciais não podem ser desligadas.
            </p>
          </div>

          {loadingLista ? (
            <div className="text-sm text-muted-foreground">Carregando funcionalidades…</div>
          ) : lista.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Sua marca ainda não tem funcionalidades habilitadas. Fale com o suporte para liberar módulos.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {grupos.map(({ cat, items }) => {
                const meta = CATEGORY_META[cat];
                return (
                  <Card key={cat}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span>{meta.emoji}</span>
                        {meta.label}
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {items.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((linha) => (
                        <CardModuloCidade
                          key={linha.module_definition_id}
                          linha={linha}
                          brandId={brandId!}
                          branchId={branchId}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar padrão da cidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove <strong>{overrideCount}</strong> ajuste(s) de{" "}
              <strong>{branch?.name}</strong>. Todas as funcionalidades voltarão a herdar a
              configuração da marca. Digite <strong>RESTAURAR</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={textConfirm}
            onChange={(e) => setTextConfirm(e.target.value)}
            placeholder="RESTAURAR"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={textConfirm !== "RESTAURAR"}
              onClick={() => {
                if (!brandId || !branchId) return;
                clearMut.mutate(
                  { brandId, branchId },
                  { onSuccess: () => setConfirmClear(false) }
                );
              }}
            >
              Restaurar padrão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
