/**
 * Auditoria de duplicações nos menus dos 3 consoles (Root, Brand, Branch).
 *
 * Estratégia (Opção A + B do plano aprovado):
 *  - A) Mesma rota base aparecendo em mais de um console/grupo  →  "rota_exata"
 *  - B) Mesma `moduleKey` reutilizada em itens diferentes        →  "funcao_similar"
 *
 * Saída: índice por console (chaves de item duplicadas) + relatório consolidado
 * para a página /admin/auditoria-duplicacoes.
 *
 * IMPORTANTE: este utilitário é READ-ONLY. Não remove, esconde ou renomeia nada —
 * apenas sinaliza. A decisão de remover é manual, item por item.
 */
import { MENU_REGISTRY, type RegistroItemMenu } from "@/compartilhados/constants/constantes_menu_sidebar";

export type ConsoleSidebar = "ROOT" | "BRAND" | "BRANCH";

export type SeveridadeDuplicacao = "rota_exata" | "funcao_similar";

export interface OcorrenciaItemMenu {
  console: ConsoleSidebar;
  grupo: string;
  itemKey: string;
  /** Url efetiva considerando overrides do grupo */
  url: string;
  /** moduleKey efetivo considerando overrides */
  moduleKey?: string;
  defaultTitle: string;
}

export interface RelatorioDuplicacao {
  /** Identificador único do agrupamento (rota base ou moduleKey) */
  id: string;
  severidade: SeveridadeDuplicacao;
  /** Critério humano: "Mesma rota /xyz" ou "Mesmo módulo abc" */
  criterio: string;
  ocorrencias: OcorrenciaItemMenu[];
}

/** Normaliza url removendo querystring e trailing slash para comparação. */
function normalizarUrl(url: string): string {
  if (!url) return "";
  return url.split("?")[0].replace(/\/+$/, "") || "/";
}

/** Aplana grupos do registro central para lista de ocorrências. */
export interface DefinicaoGrupoSimples {
  label: string;
  items: { key: string; overrides?: Partial<RegistroItemMenu> }[];
}

export function aplanarConsole(
  consoleId: ConsoleSidebar,
  grupos: DefinicaoGrupoSimples[],
): OcorrenciaItemMenu[] {
  const lista: OcorrenciaItemMenu[] = [];
  for (const grupo of grupos) {
    for (const entry of grupo.items) {
      const base = MENU_REGISTRY[entry.key];
      if (!base) continue;
      const merged = { ...base, ...entry.overrides };
      lista.push({
        console: consoleId,
        grupo: grupo.label,
        itemKey: entry.key,
        url: normalizarUrl(merged.url),
        moduleKey: merged.moduleKey,
        defaultTitle: merged.defaultTitle,
      });
    }
  }
  return lista;
}

/**
 * Recebe ocorrências de todos os consoles e gera o relatório de duplicações.
 * Uma ocorrência só conta como duplicada se aparece em 2+ pontos diferentes
 * (consoles distintos OU grupos distintos no mesmo console).
 */
export function detectarDuplicacoes(
  ocorrencias: OcorrenciaItemMenu[],
): RelatorioDuplicacao[] {
  const relatorios: RelatorioDuplicacao[] = [];

  // ─── A) Mesma URL base em pontos diferentes ───
  const porUrl = new Map<string, OcorrenciaItemMenu[]>();
  for (const o of ocorrencias) {
    if (!o.url || o.url === "/") continue; // dashboard é legitimamente compartilhado
    const lista = porUrl.get(o.url) ?? [];
    lista.push(o);
    porUrl.set(o.url, lista);
  }
  for (const [url, lista] of porUrl.entries()) {
    const pontosUnicos = new Set(lista.map((l) => `${l.console}::${l.grupo}`));
    if (pontosUnicos.size >= 2) {
      relatorios.push({
        id: `url:${url}`,
        severidade: "rota_exata",
        criterio: `Mesma rota ${url}`,
        ocorrencias: lista,
      });
    }
  }

  // ─── B) Mesma moduleKey em itens com URLs diferentes ───
  const porModulo = new Map<string, OcorrenciaItemMenu[]>();
  for (const o of ocorrencias) {
    if (!o.moduleKey) continue;
    const lista = porModulo.get(o.moduleKey) ?? [];
    lista.push(o);
    porModulo.set(o.moduleKey, lista);
  }
  for (const [mod, lista] of porModulo.entries()) {
    const urlsUnicas = new Set(lista.map((l) => l.url));
    // Só sinalizamos se o mesmo módulo aparece em URLs diferentes
    // (mesma URL repetida já foi capturada no caso A).
    if (urlsUnicas.size >= 2) {
      relatorios.push({
        id: `mod:${mod}`,
        severidade: "funcao_similar",
        criterio: `Mesmo módulo "${mod}"`,
        ocorrencias: lista,
      });
    }
  }

  return relatorios.sort((a, b) => {
    // rota_exata primeiro, depois função similar
    if (a.severidade !== b.severidade) {
      return a.severidade === "rota_exata" ? -1 : 1;
    }
    return a.criterio.localeCompare(b.criterio);
  });
}

/**
 * Devolve um Set de itemKey que estão duplicados em algum lugar do ecossistema,
 * para uso rápido pelos sidebars (badge visual).
 */
export function obterChavesDuplicadas(
  ocorrencias: OcorrenciaItemMenu[],
): Set<string> {
  const relatorios = detectarDuplicacoes(ocorrencias);
  const chaves = new Set<string>();
  for (const r of relatorios) {
    for (const o of r.ocorrencias) chaves.add(o.itemKey);
  }
  return chaves;
}