import { supabase } from "@/integrations/supabase/client";
import { classificarOrigem, calcularDiffTemplate } from "../utils/utilitarios_origem_modulo";
import type {
  DiagnosticoCompleto,
  ModuloDefinicao,
  ModuloDiagnostico,
  ResumoMarca,
} from "../types/tipos_diagnostico";

/**
 * Carrega todos os dados necessários para o diagnóstico de uma marca:
 * - dados da marca + plano comercial
 * - todos os módulos definidos no sistema
 * - quais estão ativos para a marca (brand_modules)
 * - quais estão no template do plano (plan_module_templates)
 * - quais derivam dos modelos de negócio da marca (business_model_modules)
 */
export async function buscarDiagnosticoMarca(brandId: string): Promise<DiagnosticoCompleto> {
  // 1. Marca
  const { data: marca, error: marcaError } = await supabase
    .from("brands")
    .select("id, name, slug, subscription_plan, subscription_status, updated_at")
    .eq("id", brandId)
    .maybeSingle();
  if (marcaError) throw marcaError;
  if (!marca) throw new Error("Marca não encontrada");

  // 2. Produto comercial vinculado
  const { data: produto } = await supabase
    .from("subscription_plans")
    .select("plan_key, product_name, label")
    .eq("plan_key", marca.subscription_plan)
    .maybeSingle();

  // 3. Todos os módulos definidos
  const { data: definicoes, error: defError } = await supabase
    .from("module_definitions")
    .select("id, key, label, category, is_core")
    .order("category", { ascending: true })
    .order("label", { ascending: true });
  if (defError) throw defError;

  // 4. Módulos ativos para a marca
  const { data: modulosMarca, error: bmError } = await supabase
    .from("brand_modules")
    .select("module_definition_id, is_enabled")
    .eq("brand_id", brandId);
  if (bmError) throw bmError;

  // 5. Módulos do template do produto
  const { data: templatePlano } = await supabase
    .from("plan_module_templates")
    .select("module_definition_id, is_enabled")
    .eq("plan_key", marca.subscription_plan);

  // 6. Modelos de negócio da marca + módulos vinculados
  const { data: modelosMarca } = await supabase
    .from("brand_business_models")
    .select("business_model_id")
    .eq("brand_id", brandId);
  const businessModelIds = (modelosMarca ?? []).map((m: any) => m.business_model_id);

  let modulosPorModelo: Array<{ module_definition_id: string }> = [];
  if (businessModelIds.length > 0) {
    const { data } = await supabase
      .from("business_model_modules")
      .select("module_definition_id")
      .in("business_model_id", businessModelIds);
    modulosPorModelo = data ?? [];
  }

  // ── Indexação para classificação ──
  const ativosMarcaSet = new Set(
    (modulosMarca ?? [])
      .filter((m: any) => m.is_enabled !== false)
      .map((m: any) => m.module_definition_id as string)
  );
  const templateSet = new Set(
    (templatePlano ?? [])
      .filter((t: any) => t.is_enabled !== false)
      .map((t: any) => t.module_definition_id as string)
  );
  const modeloSet = new Set(
    modulosPorModelo.map((m) => m.module_definition_id)
  );

  const definicoesPorId = new Map<string, ModuloDefinicao>(
    (definicoes ?? []).map((d: any) => [
      d.id as string,
      {
        id: d.id,
        key: d.key,
        label: d.label ?? d.key,
        category: d.category,
        isCore: !!d.is_core,
      },
    ])
  );
  const definicoesPorKey = new Map<string, ModuloDefinicao>(
    Array.from(definicoesPorId.values()).map((d) => [d.key, d])
  );

  // ── Construção da lista final de módulos ativos para a marca ──
  // Inclui: cores (mesmo sem brand_modules) + qualquer módulo com brand_modules
  const idsParaListar = new Set<string>(ativosMarcaSet);
  for (const def of definicoesPorId.values()) {
    if (def.isCore) idsParaListar.add(def.id);
  }

  const modulos: ModuloDiagnostico[] = Array.from(idsParaListar)
    .map((id) => {
      const def = definicoesPorId.get(id);
      if (!def) return null;
      const origens = classificarOrigem({
        isCore: def.isCore,
        pertenceTemplateProduto: templateSet.has(id),
        pertenceModeloNegocio: modeloSet.has(id),
        estaAtivoNaMarca: ativosMarcaSet.has(id) || def.isCore,
      });
      return {
        id: def.id,
        key: def.key,
        label: def.label,
        category: def.category,
        isEnabled: ativosMarcaSet.has(id) || def.isCore,
        origens,
      } satisfies ModuloDiagnostico;
    })
    .filter((m): m is ModuloDiagnostico => m !== null)
    .sort((a, b) => {
      const cat = (a.category ?? "").localeCompare(b.category ?? "");
      if (cat !== 0) return cat;
      return a.label.localeCompare(b.label);
    });

  // ── Diff: marca vs template do produto ──
  const ativosKeys = new Set(
    Array.from(ativosMarcaSet)
      .map((id) => definicoesPorId.get(id)?.key)
      .filter((k): k is string => !!k)
  );
  const esperadosKeys = new Set(
    Array.from(templateSet)
      .map((id) => definicoesPorId.get(id)?.key)
      .filter((k): k is string => !!k)
  );
  const diff = calcularDiffTemplate({
    ativosNaMarca: ativosKeys,
    esperadosPeloProduto: esperadosKeys,
  });

  const resumo: ResumoMarca = {
    id: marca.id,
    nome: marca.name,
    slug: marca.slug,
    planKey: marca.subscription_plan,
    produtoNome: produto?.product_name ?? produto?.label ?? null,
    subscriptionStatus: marca.subscription_status ?? "—",
    ultimaAplicacaoTemplate: marca.updated_at ?? null,
  };

  return {
    marca: resumo,
    modulos,
    diffTemplate: {
      sobrando: diff.sobrando
        .map((k) => definicoesPorKey.get(k))
        .filter((d): d is ModuloDefinicao => !!d),
      faltando: diff.faltando
        .map((k) => definicoesPorKey.get(k))
        .filter((d): d is ModuloDefinicao => !!d),
    },
    totalNucleo: modulos.filter((m) => m.origens.includes("core")).length,
    totalProduto: modulos.filter((m) => m.origens.includes("produto")).length,
    totalModeloNegocio: modulos.filter((m) => m.origens.includes("modelo_negocio")).length,
    totalManual: modulos.filter((m) => m.origens.includes("manual")).length,
  };
}

/**
 * Reaplica o template do produto, sobrescrevendo brand_modules da marca.
 * Delega à edge function `apply-plan-template` corrigida na Parte A4.
 */
export async function reaplicarTemplateMarca(brandId: string, planKey: string): Promise<void> {
  const { error } = await supabase.functions.invoke("apply-plan-template", {
    body: { brand_id: brandId, plan_key: planKey },
  });
  if (error) throw error;
}