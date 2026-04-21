/**
 * Hook que constrói o inventário de itens dos 3 sidebars (Root, Brand, Branch)
 * a partir das definições reais usadas em cada console e devolve o conjunto
 * de chaves duplicadas + relatório completo.
 *
 * IMPORTANTE: as definições de grupo abaixo precisam ficar em sintonia com
 * as definições reais usadas em RootSidebar.tsx, BrandSidebar.tsx e
 * BranchSidebar.tsx. Mantemos uma cópia simplificada aqui (sem ícones e
 * sem props específicas de runtime) para evitar dependências cruzadas.
 */
import { useMemo } from "react";
import {
  aplanarConsole,
  detectarDuplicacoes,
  obterChavesDuplicadasIntraConsole,
  type DefinicaoGrupoSimples,
  type ConsoleSidebar,
} from "@/compartilhados/utils/utilitarios_duplicacao_menu";

// ─── ROOT ───────────────────────────────────────────────────────────────
const ROOT_GROUPS: DefinicaoGrupoSimples[] = [
  { label: "Guias Inteligentes", items: [
    { key: "sidebar.jornada_root" }, { key: "sidebar.jornada" }, { key: "sidebar.jornada_emissor" },
  ]},
  { label: "Organização", items: [
    { key: "sidebar.empresas" }, { key: "sidebar.marcas" }, { key: "sidebar.branches" },
    { key: "sidebar.clonar_cidade" }, { key: "sidebar.dominios" }, { key: "sidebar.painel_motorista" },
    { key: "sidebar.provisionar_marca" }, { key: "sidebar.central_acessos" },
  ]},
  { label: "Personalização & Vitrine", items: [
    { key: "sidebar.galeria_icones" }, { key: "sidebar.app_icons" }, { key: "sidebar.central_banners" },
    { key: "sidebar.nomes_rotulos" }, { key: "sidebar.page_builder" }, { key: "sidebar.tema_plataforma" },
    { key: "sidebar.welcome_tour" }, { key: "sidebar.profile_links" }, { key: "sidebar.partner_landing" },
  ]},
  { label: "Gestão Comercial", items: [
    { key: "sidebar.operador_pdv" }, { key: "sidebar.parceiros" }, { key: "sidebar.ofertas" },
    { key: "sidebar.clientes" }, { key: "sidebar.resgates" }, { key: "sidebar.cupons" },
    { key: "sidebar.achadinhos" }, { key: "sidebar.categorias_achadinhos" },
    { key: "sidebar.importar_csv" }, { key: "sidebar.patrocinados" },
  ]},
  { label: "Aprovações", items: [
    { key: "sidebar.aprovar_regras" }, { key: "sidebar.solicitacoes_emissor" },
    { key: "sidebar.catalogo" }, { key: "sidebar.espelhamento" }, { key: "sidebar.governanca_ofertas" },
  ]},
  { label: "Comunicação", items: [{ key: "sidebar.enviar_notificacao" }] },
  { label: "Programa de Fidelidade", items: [
    { key: "sidebar.pontuar" }, { key: "sidebar.regras_pontos" }, { key: "sidebar.extrato_pontos" },
  ]},
  { label: "Cashback Inteligente", items: [
    { key: "sidebar.gg_dashboard" }, { key: "sidebar.gg_config" }, { key: "sidebar.gg_billing" },
    { key: "sidebar.gg_closing" }, { key: "sidebar.gg_store_summary" },
  ]},
  { label: "Equipe & Acessos", items: [{ key: "sidebar.usuarios" }] },
  { label: "Inteligência & Dados", items: [
    { key: "sidebar.crm" }, { key: "sidebar.relatorios" }, { key: "sidebar.auditoria" },
    { key: "sidebar.taxonomia" },
  ]},
  { label: "Integrações & API", items: [
    { key: "sidebar.api_keys" }, { key: "sidebar.api_docs" },
    { key: "sidebar.machine" }, { key: "sidebar.teste_webhook" },
  ]},
  { label: "Configurações", items: [
    { key: "sidebar.central_modulos" }, { key: "sidebar.central_modulos_manual" },
    { key: "sidebar.funcionalidades" }, { key: "sidebar.modulos" },
    { key: "sidebar.permissoes_globais" }, { key: "sidebar.secoes_home" },
    { key: "sidebar.modelos_home" }, { key: "sidebar.controle_recursos" },
    { key: "sidebar.atualizacoes" }, { key: "sidebar.kit_inicial" },
    { key: "sidebar.configuracoes" }, { key: "sidebar.subscription" },
    { key: "sidebar.plan_templates" }, { key: "sidebar.produtos_comerciais" },
    { key: "sidebar.leads_comerciais" },
  ]},
];

// ─── BRAND (Empreendedor) ───────────────────────────────────────────────
const BRAND_GROUPS: DefinicaoGrupoSimples[] = [
  { label: "Guias Inteligentes", items: [
    { key: "sidebar.jornada" }, { key: "sidebar.jornada_emissor" }, { key: "sidebar.modulos" },
  ]},
  { label: "Manuais", items: [{ key: "sidebar.manuais" }] },
  { label: "Cidades", items: [
    { key: "sidebar.branches", overrides: { url: "/brand-branches" } },
    { key: "sidebar.pacotes_pontos" },
    { key: "sidebar.jornada_cidades" }, { key: "sidebar.onboarding_cidade" },
    { key: "sidebar.configuracao_cidade" }, { key: "sidebar.configuracao_modulos_cidade" },
  ]},
  { label: "Personalização & Vitrine", items: [
    { key: "sidebar.tema_marca" }, { key: "sidebar.galeria_icones" },
    { key: "sidebar.partner_landing" }, { key: "sidebar.welcome_tour" },
    { key: "sidebar.profile_links" }, { key: "sidebar.offer_card_config" },
    { key: "sidebar.page_builder" }, { key: "sidebar.central_banners" },
  ]},
  { label: "Achadinhos", items: [
    { key: "sidebar.achadinhos" }, { key: "sidebar.categorias_achadinhos" },
    { key: "sidebar.espelhamento" }, { key: "sidebar.governanca_ofertas" },
  ]},
  { label: "Resgate com Pontos", items: [
    { key: "sidebar.produtos_resgate" }, { key: "sidebar.pedidos_resgate" },
  ]},
  { label: "Aprovações", items: [
    { key: "sidebar.solicitacoes_emissor" }, { key: "sidebar.aprovar_regras" }, { key: "sidebar.catalogo" },
  ]},
  { label: "Comunicação", items: [{ key: "sidebar.enviar_notificacao" }] },
  { label: "Gestão Comercial", items: [
    { key: "sidebar.operador_pdv" }, { key: "sidebar.ofertas" }, { key: "sidebar.resgates" },
    { key: "sidebar.cupons" }, { key: "sidebar.parceiros" }, { key: "sidebar.clientes" },
    { key: "sidebar.motoristas" }, { key: "sidebar.compra_pontos_motorista" },
    { key: "sidebar.patrocinados" }, { key: "sidebar.painel_motorista_view" },
  ]},
  { label: "Programa de Fidelidade", items: [
    { key: "sidebar.pontuar" }, { key: "sidebar.regras_pontos" },
    { key: "sidebar.tier_pontos" }, { key: "sidebar.extrato_pontos" },
  ]},
  { label: "Gamificação", items: [{ key: "sidebar.gamificacao" }] },
  { label: "Cashback Inteligente", items: [
    { key: "sidebar.gg_config" }, { key: "sidebar.gg_billing" },
    { key: "sidebar.gg_closing" }, { key: "sidebar.gg_reports" },
  ]},
  { label: "Equipe & Acessos", items: [
    { key: "sidebar.usuarios" }, { key: "sidebar.central_acessos" },
  ]},
  { label: "Inteligência & Dados", items: [
    { key: "sidebar.crm" }, { key: "sidebar.relatorios" }, { key: "sidebar.auditoria" },
    { key: "sidebar.importar_csv" }, { key: "sidebar.taxonomia" },
  ]},
  { label: "Integrações & API", items: [
    { key: "sidebar.api_keys" }, { key: "sidebar.api_docs" },
    { key: "sidebar.machine" }, { key: "sidebar.teste_webhook" }, { key: "sidebar.api_journey" },
  ]},
  { label: "Configurações", items: [
    { key: "sidebar.dominios_marca" }, { key: "sidebar.configuracoes" },
    { key: "sidebar.painel_motorista" }, { key: "sidebar.subscription" },
  ]},
];

// ─── BRANCH (Cidade) ────────────────────────────────────────────────────
const BRANCH_GROUPS: DefinicaoGrupoSimples[] = [
  { label: "Gestão Comercial", items: [
    { key: "sidebar.operador_pdv" }, { key: "sidebar.parceiros" }, { key: "sidebar.ofertas" },
    { key: "sidebar.clientes" }, { key: "sidebar.resgates" }, { key: "sidebar.cupons" },
  ]},
  { label: "Aprovações", items: [
    { key: "sidebar.aprovar_regras" }, { key: "sidebar.catalogo" },
  ]},
  { label: "Achadinhos", items: [
    { key: "sidebar.achadinhos" }, { key: "sidebar.categorias_achadinhos" },
  ]},
  { label: "Comunicação", items: [{ key: "sidebar.enviar_notificacao" }] },
  { label: "Motoristas & Resgate", items: [
    { key: "sidebar.carteira_pontos" }, { key: "sidebar.comprar_pontos" },
    { key: "sidebar.produtos_resgate" }, { key: "sidebar.pedidos_resgate" },
    { key: "sidebar.motoristas" }, { key: "sidebar.relatorios_cidade" }, { key: "sidebar.manuais" },
  ]},
  { label: "Programa de Fidelidade", items: [
    { key: "sidebar.pontuar" }, { key: "sidebar.regras_pontos" }, { key: "sidebar.extrato_pontos" },
  ]},
  { label: "Gamificação", items: [{ key: "sidebar.gamificacao" }] },
  { label: "Inteligência & Dados", items: [
    { key: "sidebar.relatorios" }, { key: "sidebar.auditoria" }, { key: "sidebar.importar_csv" },
  ]},
];

export function useDuplicacoesMenu() {
  return useMemo(() => {
    const ocorrenciasRoot = aplanarConsole("ROOT", ROOT_GROUPS);
    const ocorrenciasBrand = aplanarConsole("BRAND", BRAND_GROUPS);
    const ocorrenciasBranch = aplanarConsole("BRANCH", BRANCH_GROUPS);
    const ocorrencias = [...ocorrenciasRoot, ...ocorrenciasBrand, ...ocorrenciasBranch];

    const chavesDuplicadasPorConsole: Record<ConsoleSidebar, Set<string>> = {
      ROOT: obterChavesDuplicadasIntraConsole(ocorrenciasRoot),
      BRAND: obterChavesDuplicadasIntraConsole(ocorrenciasBrand),
      BRANCH: obterChavesDuplicadasIntraConsole(ocorrenciasBranch),
    };

    // União das duplicações intra-console (compatibilidade retroativa)
    const chavesDuplicadas = new Set<string>([
      ...chavesDuplicadasPorConsole.ROOT,
      ...chavesDuplicadasPorConsole.BRAND,
      ...chavesDuplicadasPorConsole.BRANCH,
    ]);

    return {
      ocorrencias,
      relatorios: detectarDuplicacoes(ocorrencias),
      chavesDuplicadas,
      chavesDuplicadasPorConsole,
    };
  }, []);
}