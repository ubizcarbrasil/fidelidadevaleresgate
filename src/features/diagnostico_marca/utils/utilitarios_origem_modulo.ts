/**
 * Função pura de classificação de origem de módulos.
 * Reaproveitada pela página de diagnóstico e pelos testes de integração
 * de promessa do produto.
 */

import type { OrigemModulo } from "../types/tipos_diagnostico";

export interface ContextoClassificacao {
  isCore: boolean;
  pertenceTemplateProduto: boolean;
  pertenceModeloNegocio: boolean;
  estaAtivoNaMarca: boolean;
}

/**
 * Classifica de onde veio um módulo dado o contexto.
 * Um módulo pode ter múltiplas origens (ex.: estar no núcleo E no template).
 * "manual" indica override manual: ativo na marca mas não derivado de
 * núcleo, produto ou modelo de negócio.
 */
export function classificarOrigem(ctx: ContextoClassificacao): OrigemModulo[] {
  const origens: OrigemModulo[] = [];
  if (ctx.isCore) origens.push("core");
  if (ctx.pertenceTemplateProduto) origens.push("produto");
  if (ctx.pertenceModeloNegocio) origens.push("modelo_negocio");

  // Ativo na marca mas sem nenhuma origem estrutural -> override manual
  if (ctx.estaAtivoNaMarca && origens.length === 0) {
    origens.push("manual");
  }
  return origens;
}

/**
 * Calcula o conjunto final esperado de módulos para uma marca dado seu
 * produto e modelos de negócio (núcleo + template). Função pura usada
 * tanto no diagnóstico quanto nos testes de provisionamento.
 */
export function calcularModulosEsperados(input: {
  coreKeys: string[];
  templateKeys: string[];
}): Set<string> {
  return new Set([...input.coreKeys, ...input.templateKeys]);
}

/**
 * Dado o conjunto de módulos atualmente ativos na marca e o conjunto
 * esperado pelo produto, calcula o diff (sobrando vs faltando).
 */
export function calcularDiffTemplate(input: {
  ativosNaMarca: Set<string>;
  esperadosPeloProduto: Set<string>;
}): { sobrando: string[]; faltando: string[] } {
  const sobrando: string[] = [];
  const faltando: string[] = [];
  for (const k of input.ativosNaMarca) {
    if (!input.esperadosPeloProduto.has(k)) sobrando.push(k);
  }
  for (const k of input.esperadosPeloProduto) {
    if (!input.ativosNaMarca.has(k)) faltando.push(k);
  }
  return { sobrando, faltando };
}

/**
 * Calcula o delta (módulos a adicionar / remover) ao trocar uma marca de plano.
 * Não inclui módulos core (eles permanecem em qualquer plano).
 */
export function calcularDeltaTrocaPlano(input: {
  modulosAtuaisDaMarca: Set<string>;
  templatePlanoDestino: Set<string>;
  coreKeys: Set<string>;
}): { adicionar: string[]; remover: string[] } {
  const adicionar: string[] = [];
  const remover: string[] = [];
  const novosFinal = new Set([...input.coreKeys, ...input.templatePlanoDestino]);

  for (const k of novosFinal) {
    if (!input.modulosAtuaisDaMarca.has(k)) adicionar.push(k);
  }
  for (const k of input.modulosAtuaisDaMarca) {
    if (!novosFinal.has(k) && !input.coreKeys.has(k)) remover.push(k);
  }
  return { adicionar, remover };
}