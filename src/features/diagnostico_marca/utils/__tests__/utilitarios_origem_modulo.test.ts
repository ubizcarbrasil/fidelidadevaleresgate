/**
 * utilitarios_origem_modulo — classifica origem de cada módulo
 * (core/produto/modelo/manual), calcula esperados pelo plano, diff vs
 * marca atual, delta na troca de plano.
 *
 * Bug aqui = módulo ativo sem origem estrutural não vira "manual" (vira
 * fantasma), troca de plano remove módulos core (quebra marca), diff
 * conta módulos esperados como sobrando.
 */
import { describe, it, expect } from "vitest";
import {
  classificarOrigem,
  calcularModulosEsperados,
  calcularDiffTemplate,
  calcularDeltaTrocaPlano,
} from "../utilitarios_origem_modulo";

describe("classificarOrigem", () => {
  it("isCore + ativa: ['core']", () => {
    expect(classificarOrigem({
      isCore: true,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: true,
    })).toEqual(["core"]);
  });

  it("template + modelo: ['produto', 'modelo_negocio']", () => {
    expect(classificarOrigem({
      isCore: false,
      pertenceTemplateProduto: true,
      pertenceModeloNegocio: true,
      estaAtivoNaMarca: true,
    })).toEqual(["produto", "modelo_negocio"]);
  });

  it("nenhuma origem estrutural + ativa: ['manual']", () => {
    expect(classificarOrigem({
      isCore: false,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: true,
    })).toEqual(["manual"]);
  });

  it("nenhuma origem + inativa: []", () => {
    expect(classificarOrigem({
      isCore: false,
      pertenceTemplateProduto: false,
      pertenceModeloNegocio: false,
      estaAtivoNaMarca: false,
    })).toEqual([]);
  });

  it("core + produto + modelo: 3 origens (não inclui manual)", () => {
    expect(classificarOrigem({
      isCore: true,
      pertenceTemplateProduto: true,
      pertenceModeloNegocio: true,
      estaAtivoNaMarca: true,
    })).toEqual(["core", "produto", "modelo_negocio"]);
  });
});

describe("calcularModulosEsperados", () => {
  it("merge core + template em Set único", () => {
    const result = calcularModulosEsperados({
      coreKeys: ["auth", "brand"],
      templateKeys: ["loyalty", "rewards"],
    });
    expect([...result].sort()).toEqual(["auth", "brand", "loyalty", "rewards"]);
  });

  it("overlap (mesmo key em core E template): dedupe", () => {
    const result = calcularModulosEsperados({
      coreKeys: ["x", "y"],
      templateKeys: ["y", "z"],
    });
    expect([...result].sort()).toEqual(["x", "y", "z"]);
  });

  it("ambos vazios: Set vazio", () => {
    expect(calcularModulosEsperados({ coreKeys: [], templateKeys: [] }).size).toBe(0);
  });
});

describe("calcularDiffTemplate", () => {
  it("perfeito match: sobrando=[], faltando=[]", () => {
    const result = calcularDiffTemplate({
      ativosNaMarca: new Set(["a", "b"]),
      esperadosPeloProduto: new Set(["a", "b"]),
    });
    expect(result).toEqual({ sobrando: [], faltando: [] });
  });

  it("ativo extra: sobrando=['extra']", () => {
    const result = calcularDiffTemplate({
      ativosNaMarca: new Set(["a", "b", "extra"]),
      esperadosPeloProduto: new Set(["a", "b"]),
    });
    expect(result).toEqual({ sobrando: ["extra"], faltando: [] });
  });

  it("faltando: esperado mas não ativo", () => {
    const result = calcularDiffTemplate({
      ativosNaMarca: new Set(["a"]),
      esperadosPeloProduto: new Set(["a", "b"]),
    });
    expect(result).toEqual({ sobrando: [], faltando: ["b"] });
  });

  it("mix sobrando+faltando", () => {
    const result = calcularDiffTemplate({
      ativosNaMarca: new Set(["a", "x"]),
      esperadosPeloProduto: new Set(["a", "b"]),
    });
    expect(result.sobrando.sort()).toEqual(["x"]);
    expect(result.faltando.sort()).toEqual(["b"]);
  });
});

describe("calcularDeltaTrocaPlano", () => {
  it("plano destino adiciona módulos: adicionar=[new], remover=[]", () => {
    const result = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca: new Set(["auth", "brand"]),
      templatePlanoDestino: new Set(["loyalty"]),
      coreKeys: new Set(["auth", "brand"]),
    });
    expect(result.adicionar).toEqual(["loyalty"]);
    expect(result.remover).toEqual([]);
  });

  it("plano destino remove módulos NÃO-core: remover=[old]", () => {
    const result = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca: new Set(["auth", "old_feature"]),
      templatePlanoDestino: new Set(["new_feature"]),
      coreKeys: new Set(["auth"]),
    });
    expect(result.adicionar.sort()).toEqual(["new_feature"]);
    expect(result.remover.sort()).toEqual(["old_feature"]);
  });

  it("core NUNCA removido (mesmo se ausente do plano destino)", () => {
    const result = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca: new Set(["auth", "brand", "extra"]),
      templatePlanoDestino: new Set([]),
      coreKeys: new Set(["auth", "brand"]),
    });
    expect(result.remover).toEqual(["extra"]);
    expect(result.remover).not.toContain("auth");
    expect(result.remover).not.toContain("brand");
  });

  it("plano destino idêntico ao atual: adicionar=[], remover=[]", () => {
    const result = calcularDeltaTrocaPlano({
      modulosAtuaisDaMarca: new Set(["a", "b"]),
      templatePlanoDestino: new Set(["a"]),
      coreKeys: new Set(["b"]),
    });
    expect(result.adicionar).toEqual([]);
    expect(result.remover).toEqual([]);
  });
});
