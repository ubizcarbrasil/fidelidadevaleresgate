import ConfiguracaoModulo from "@/components/admin/gamificacao/ConfiguracaoModulo";

/**
 * Sub-aba "Geral" — preserva 100% do comportamento atual da configuração legacy.
 * (Os toggles de módulos, métricas, frases de recusa, etc.)
 */
export default function AbaGeral({ branchId, settings }: { branchId: string; settings: Record<string, any> }) {
  return <ConfiguracaoModulo branchId={branchId} settings={settings} />;
}