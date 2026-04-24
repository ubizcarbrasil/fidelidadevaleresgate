import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle, CheckCircle2, ArrowLeft, Sparkles, ListChecks } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { ProdutoComercialDraft, LandingBenefit } from "../types/tipos_produto";
import { MENU_REGISTRY } from "@/compartilhados/constants/constantes_menu_sidebar";

interface Props {
  draft: ProdutoComercialDraft;
  onVoltarPasso: (idx: number) => void;
}

const CORE_KEYS = ["brand_settings", "subscription", "users_management"];

export default function PassoPreview({ draft, onVoltarPasso }: Props) {
  // Carrega definições dos módulos selecionados + cores
  const { data: modulos, isLoading } = useQuery({
    queryKey: ["pc-preview-modulos", draft.module_definition_ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_definitions")
        .select("id, key, label, category, is_core")
        .order("category", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const selecionadosSet = useMemo(
    () => new Set(draft.module_definition_ids),
    [draft.module_definition_ids]
  );

  const { forcados, escolhidos, keysAtivas } = useMemo(() => {
    const forcados: typeof modulos = [];
    const escolhidos: typeof modulos = [];
    const keysAtivas = new Set<string>(CORE_KEYS);
    (modulos ?? []).forEach((m: any) => {
      if (m.is_core) {
        forcados!.push(m);
        keysAtivas.add(m.key);
      } else if (selecionadosSet.has(m.id)) {
        escolhidos!.push(m);
        keysAtivas.add(m.key);
      }
    });
    return { forcados, escolhidos, keysAtivas };
  }, [modulos, selecionadosSet]);

  // Filtra MENU_REGISTRY por moduleKey
  const { rotasAcessiveis, rotasBloqueadas } = useMemo(() => {
    const ac: Array<{ key: string; title: string; url: string }> = [];
    const bl: Array<{ key: string; title: string; url: string; moduleKey: string }> = [];
    Object.values(MENU_REGISTRY).forEach((item) => {
      if (!item.moduleKey) {
        ac.push({ key: item.key, title: item.defaultTitle, url: item.url });
        return;
      }
      // moduleKey pode ser combinado: "a|b"
      const keys = item.moduleKey.split("|");
      const liberado = keys.some((k) => keysAtivas.has(k.trim()));
      if (liberado) {
        ac.push({ key: item.key, title: item.defaultTitle, url: item.url });
      } else {
        bl.push({
          key: item.key,
          title: item.defaultTitle,
          url: item.url,
          moduleKey: item.moduleKey,
        });
      }
    });
    return { rotasAcessiveis: ac, rotasBloqueadas: bl };
  }, [keysAtivas]);

  // Promessa: benefícios da landing que apontam módulo (icon ou description com module_key)
  // Como o tipo LandingBenefit não tem module_key formal, fazemos uma checagem leve por nome.
  const beneficiosNaoEntregues = useMemo(() => {
    const benefits = draft.landing_config_json?.benefits ?? [];
    if (!modulos) return [];
    const labelsAtivos = new Set(
      (modulos ?? [])
        .filter((m: any) => keysAtivas.has(m.key))
        .map((m: any) => (m.label ?? "").toLowerCase())
    );
    const naoEntregues: string[] = [];
    benefits.forEach((b: LandingBenefit) => {
      const titulo = typeof b === "string" ? b : b.title;
      if (!titulo) return;
      // heurística simples: se o benefício menciona um termo de um módulo conhecido
      // mas nenhum módulo ativo bate com ele, sinaliza
      const lower = titulo.toLowerCase();
      const baseTermos = ["motorista", "duelo", "achadinho", "csv", "campeonato", "ranking"];
      const mencionaTermo = baseTermos.find((t) => lower.includes(t));
      if (!mencionaTermo) return;
      const algumModuloRelacionado = Array.from(labelsAtivos).some((l) =>
        l.includes(mencionaTermo)
      );
      if (!algumModuloRelacionado) naoEntregues.push(titulo);
    });
    return naoEntregues;
  }, [draft.landing_config_json, modulos, keysAtivas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho explicativo */}
      <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Pré-visualização do Produto
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Esta é a experiência que uma marca contratante deste produto receberá.
          Confira o sidebar simulado, os módulos forçados pelo núcleo e o que
          a sua seleção entrega antes de salvar.
        </p>
      </div>

      {beneficiosNaoEntregues.length > 0 && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <p className="text-sm font-semibold text-destructive">
                Promessas não entregues pela seleção atual
              </p>
              <p className="text-xs text-muted-foreground">
                Estes benefícios estão na landing mas nenhum módulo selecionado
                parece entregá-los. Volte ao passo de funcionalidades e revise.
              </p>
              <ul className="text-xs space-y-0.5 mt-1.5 list-disc list-inside">
                {beneficiosNaoEntregues.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Sidebar simulado */}
        <Card className="p-3 space-y-2 bg-muted/40 max-h-[420px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
            Sidebar do console
          </p>
          <ul className="space-y-0.5">
            {rotasAcessiveis.slice(0, 30).map((r) => (
              <li
                key={r.key}
                className="text-xs px-2 py-1.5 rounded hover:bg-background/50 text-foreground/80"
              >
                {r.title}
              </li>
            ))}
            {rotasAcessiveis.length > 30 && (
              <li className="text-[10px] px-2 text-muted-foreground italic">
                + {rotasAcessiveis.length - 30} itens
              </li>
            )}
          </ul>
        </Card>

        {/* Listas de módulos */}
        <div className="space-y-3">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" />
                Forçados pelo núcleo
                <Badge variant="secondary" className="text-[10px]">
                  {forcados?.length ?? 0}
                </Badge>
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Estão sempre ativos para qualquer produto. Não podem ser removidos.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(forcados ?? []).map((m: any) => (
                <Badge
                  key={m.id}
                  variant="outline"
                  className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                >
                  {m.label}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Vindos da sua seleção
                <Badge variant="secondary" className="text-[10px]">
                  {escolhidos?.length ?? 0}
                </Badge>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onVoltarPasso(2)}
              >
                <ArrowLeft className="h-3 w-3 mr-1" /> Editar seleção
              </Button>
            </div>
            {(escolhidos?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhum módulo opcional selecionado. O produto entregará apenas o núcleo.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(escolhidos ?? []).map((m: any) => (
                  <Badge
                    key={m.id}
                    variant="outline"
                    className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  >
                    {m.label}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              Rotas bloqueadas
              <Badge variant="secondary" className="text-[10px]">
                {rotasBloqueadas.length}
              </Badge>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Itens de menu que <strong>não aparecerão</strong> para a marca por
              não terem o módulo correspondente ativo.
            </p>
            <div className="max-h-32 overflow-y-auto pt-1">
              <ul className="text-[11px] grid grid-cols-2 gap-x-3 gap-y-0.5">
                {rotasBloqueadas.slice(0, 30).map((r) => (
                  <li key={r.key} className="text-muted-foreground truncate">
                    {r.title}
                  </li>
                ))}
              </ul>
              {rotasBloqueadas.length > 30 && (
                <p className="text-[10px] text-muted-foreground italic pt-1">
                  + {rotasBloqueadas.length - 30} rotas
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}