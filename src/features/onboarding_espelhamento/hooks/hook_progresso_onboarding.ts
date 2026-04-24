import { useQuery } from "@tanstack/react-query";
import {
  fetchSourceCatalog,
  fetchAllSyncConfigs,
  fetchSyncLogs,
} from "@/lib/api/mirrorSync";

export interface PassoOnboarding {
  id: string;
  titulo: string;
  descricao: string;
  concluido: boolean;
  acao?: { rotulo: string; href?: string; tab?: string };
}

/**
 * Detecta o progresso do onboarding do Root Admin.
 * Verifica se existe ao menos uma origem habilitada no catálogo global.
 */
export function useProgressoOnboardingAdmin() {
  const { data: catalogo = [], isLoading } = useQuery({
    queryKey: ["onboarding-admin-catalog"],
    queryFn: () => fetchSourceCatalog(),
    staleTime: 30_000,
  });

  const totalOrigens = catalogo.length;
  const totalAtivas = catalogo.filter((c) => c.is_enabled).length;

  const passos: PassoOnboarding[] = [
    {
      id: "revisar-catalogo",
      titulo: "Revisar o catálogo de origens",
      descricao: `O catálogo possui ${totalOrigens} origem(ns) disponível(eis) na plataforma.`,
      concluido: totalOrigens > 0,
    },
    {
      id: "ativar-pelo-menos-uma",
      titulo: "Ativar pelo menos uma origem",
      descricao:
        totalAtivas > 0
          ? `${totalAtivas} origem(ns) ativa(s) — disponíveis para todas as marcas.`
          : "Nenhuma origem ativa. As marcas só veem origens habilitadas aqui.",
      concluido: totalAtivas > 0,
    },
    {
      id: "personalizar-exibicao",
      titulo: "Personalizar nome e ícone (opcional)",
      descricao:
        "Edite o nome de exibição e o ícone Lucide para que cada origem fique reconhecível para os empreendedores.",
      concluido: catalogo.some(
        (c) => c.is_enabled && c.icon && c.display_name?.trim().length > 0
      ),
    },
  ];

  const concluidos = passos.filter((p) => p.concluido).length;

  return {
    isLoading,
    passos,
    concluidos,
    total: passos.length,
    completo: concluidos === passos.length,
  };
}

/**
 * Detecta o progresso do onboarding do Empreendedor (Brand Admin).
 * Verifica catálogo disponível, conectores criados/ativos e existência de
 * pelo menos um sync executado.
 */
export function useProgressoOnboardingEmpreendedor(brandId: string | null) {
  const enabled = !!brandId;

  const { data: catalogo = [] } = useQuery({
    queryKey: ["onboarding-brand-catalog"],
    queryFn: () => fetchSourceCatalog({ onlyEnabled: true }),
    enabled,
    staleTime: 30_000,
  });

  const { data: conectores = [], isLoading: loadingConn } = useQuery({
    queryKey: ["onboarding-brand-connectors", brandId],
    queryFn: () => fetchAllSyncConfigs(brandId!),
    enabled,
    staleTime: 15_000,
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["onboarding-brand-logs", brandId],
    queryFn: () => fetchSyncLogs(brandId!, 5),
    enabled,
    staleTime: 15_000,
  });

  const totalConectores = conectores.length;
  const conectoresAtivos = conectores.filter((c: any) => c.is_enabled !== false).length;
  const teveSyncSucesso = (logs || []).some((l: any) => l.status === "success" || l.status === "completed");

  const passos: PassoOnboarding[] = [
    {
      id: "origens-disponiveis",
      titulo: "Verificar origens disponíveis",
      descricao:
        catalogo.length > 0
          ? `${catalogo.length} origem(ns) liberada(s) pela plataforma para sua marca.`
          : "Nenhuma origem disponível. Solicite ao administrador da plataforma para habilitar uma origem.",
      concluido: catalogo.length > 0,
    },
    {
      id: "criar-conector",
      titulo: "Criar seu primeiro conector",
      descricao:
        totalConectores > 0
          ? `${totalConectores} conector(es) cadastrado(s).`
          : "Cadastre uma URL de origem (vitrine ou grupo) na aba Conectores.",
      concluido: totalConectores > 0,
      acao: { rotulo: "Ir para Conectores", tab: "conectores" },
    },
    {
      id: "ativar-conector",
      titulo: "Ativar o conector",
      descricao:
        conectoresAtivos > 0
          ? `${conectoresAtivos} conector(es) ativo(s) — prontos para sincronizar.`
          : "Habilite o conector para incluí-lo nos próximos sincronismos.",
      concluido: conectoresAtivos > 0,
    },
    {
      id: "primeiro-sync",
      titulo: "Executar o primeiro sincronismo",
      descricao: teveSyncSucesso
        ? "Sincronismo concluído com sucesso. Confira as ofertas importadas na aba Ofertas."
        : "Clique em 'Sincronizar agora' no card do conector para importar as ofertas.",
      concluido: teveSyncSucesso,
      acao: { rotulo: "Abrir Histórico", tab: "logs" },
    },
  ];

  const concluidos = passos.filter((p) => p.concluido).length;

  return {
    isLoading: loadingConn || loadingLogs,
    passos,
    concluidos,
    total: passos.length,
    completo: concluidos === passos.length,
  };
}
