import { describe, it, expect } from "vitest";
import {
  classificarOrigem,
  calcularModulosEsperados,
  calcularDiffTemplate,
  calcularDeltaTrocaPlano,
} from "@/features/diagnostico_marca/utils/utilitarios_origem_modulo";

/**
 * Testes de integração de "promessa do produto".
 *
 * Garantem que a lógica pura de cálculo de módulos:
 *  - respeita o contrato núcleo + template do produto
 *  - não introduz regressões como o leak histórico do `csv_import`
 *  - calcula corretamente o delta ao trocar planos
 *  - classifica corretamente a origem de cada módulo (núcleo, produto,
 *    modelo de negócio, override manual)
 */

const CORE = ["brand_settings", "subscription", "users_management"];

// Templates fictícios baseados na realidade do banco (Free / Starter / Achadinhos).
const TEMPLATES: Record<string, string[]> = {
  free: ["dashboard"],
  starter: ["dashboard", "branches", "offers"],
  achadinhos_motorista: [
    "dashboard", "branches", "offers", "csv_import",
    "machine_integration", "achadinhos_motorista",
  ],
  ubiz_shop: ["dashboard", "branches", "offers", "stores"],
};

describe("calcularModulosEsperados — provisionamento por produto", () => {
  it.each(Object.entries(TEMPLATES))(
    "produto %s entrega exatamente core ∪ template",
    (planKey, templateKeys) => {
      const esperados = calcularModulosEsperados({
        coreKeys: CORE,
        templateKeys,
      });
      const uniao = new Set([...CORE, ...templateKeys]);
      expect(esperados.size).toBe(uniao.size);
      uniao.forEach((k) => expect(esperados.has(k)).toBe(true));
    }
  );

  it("não inclui csv_import automaticamente em produtos que não o pedem (regressão Ubiz Shop)", () => {
    const esperados = calcularModulosEsperados({
      coreKeys: CORE,
      templateKeys: TEMPLATES.ubiz_shop,
    });
    expect(esperados.has("csv_import")).toBe(false);
    // Mas inclui em produtos que pedem
    const comCsv = calcularModulosEsperados({
      coreKeys: CORE,
      templateKeys: TEMPLATES.achadinhos_motorista,
    });
    expect(comCsv.has("csv_import")).toBe(true);
  });

  it("inclui sempre os 3 módulos core em qualquer produto", () => {
    Object.values(TEMPLATES).forEach((templateKeys) => {
      const esperados = calcularModulosEsperados({
        coreKeys: CORE,
        templateKeys,
      });
      CORE.forEach((c) => expect(esperados.has(c)).toBe(true));
    });
  });
});

describe("calcularDiffTemplate — auditoria de marca", () => {
  it("identifica módulos sobrando (na marca, fora do template)", () => {
    const ativosNaMarca = new Set([...CORE, "dashboard", "csv_import", "extra_legado"]);
    const esperadosPeloProduto = new Set([...CORE, "dashboard"]);
    const diff = calcularDiffTemplate({ ativosNaMarca, esperadosPeloProduto });
    expect(diff.sobrando.sort()).toEqual(["csv_import", "extra_legado"]);
    expect(diff.faltando).toEqual([]);
  });

  it("identifica módulos faltando (no template, fora da marca)", () => {
    const ativosNaMarca = new Set([...CORE, "dashboard"]);
    const esperadosPeloProduto = new Set([...CORE, "dashboard", "offers", "branches"]);
    const diff = calcularDiffTemplate({ ativosNaMarca, esperadosPeloProduto });
    expect(diff.faltando.sort()).toEqual(["branches", "offers"]);
    expect(diff.sobrando).toEqual([]);
  });

  it("retorna vazio quando marca está perfeitamente alinhada", () => {
    const set = new Set([...CORE, "dashboard"]);
    const diff = calcularDiffTemplate({
      ativosNaMarca: set,
      esperadosPeloProduto: set,
    });
    expect(diff.sobrando).toEqual([]);
    expect(diff.faltando).toEqual([]);
  });
});

describe("calcularDeltaTrocaPlano — change_plan da edge function", () => {
  it("calcula adicionar/remover ao migrar Starter -> Achadinhos Motorista", () => {
    const modulosAtuaisDaMarca = new Set([...CORE, ...TEMPLATES.starter]);
    const templatePlanoDestino = new Set(TEMPLATES.achadinhos_motorista);
    const delta = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca,
      templatePlanoDestino,
      coreKeys: new Set(CORE),
    });
    // Achadinhos adiciona csv_import, machine_integration, achadinhos_motorista
    expect(delta.adicionar.sort()).toEqual([
      "achadinhos_motorista", "csv_import", "machine_integration",
    ]);
    expect(delta.remover).toEqual([]);
  });

  it("remove módulos quando troca para um plano mais enxuto (Achadinhos -> Free)", () => {
    const modulosAtuaisDaMarca = new Set([
      ...CORE,
      ...TEMPLATES.achadinhos_motorista,
    ]);
    const templatePlanoDestino = new Set(TEMPLATES.free);
    const delta = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca,
      templatePlanoDestino,
      coreKeys: new Set(CORE),
    });
    expect(delta.adicionar).toEqual([]);
    expect(delta.remover.sort()).toEqual([
      "achadinhos_motorista", "branches", "csv_import",
      "machine_integration", "offers",
    ]);
  });

  it("nunca remove módulos core ao trocar de plano", () => {
    const modulosAtuaisDaMarca = new Set([...CORE, "dashboard"]);
    const templatePlanoDestino = new Set<string>(); // plano sem nada
    const delta = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca,
      templatePlanoDestino,
      coreKeys: new Set(CORE),
    });
    CORE.forEach((c) => expect(delta.remover).not.toContain(c));
  });
});

describe("classificarOrigem — diagnóstico por marca", () => {
  it("marca origem 'core' para módulos do núcleo", () => {
    const origens = classificarOrigem({
      isCore: true,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: true,
    });
    expect(origens).toContain("core");
  });

  it("marca múltiplas origens quando módulo é core E está no template", () => {
    const origens = classificarOrigem({
      isCore: true,
      pertenceTemplateProduto: true,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: true,
    });
    expect(origens).toEqual(expect.arrayContaining(["core", "produto"]));
    expect(origens).not.toContain("manual");
  });

  it("marca como 'manual' apenas quando ativo sem nenhuma origem estrutural", () => {
    const origens = classificarOrigem({
      isCore: false,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: true,
    });
    expect(origens).toEqual(["manual"]);
  });

  it("não marca como 'manual' quando módulo não está ativo na marca", () => {
    const origens = classificarOrigem({
      isCore: false,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: false,
    });
    expect(origens).toEqual([]);
  });

  it("identifica origem de modelo de negócio independentemente do produto", () => {
    const origens = classificarOrigem({
      isCore: false,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: true,
      estaAtivoNaMarca: true,
    });
    expect(origens).toEqual(["modelo_negocio"]);
  });
});