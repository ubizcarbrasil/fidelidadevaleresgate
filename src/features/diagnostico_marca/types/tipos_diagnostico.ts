/**
 * Tipos para a feature de Diagnóstico por Marca.
 * Esta tela permite ao Root Admin auditar a origem de cada módulo ativo
 * em uma marca específica (Núcleo, Produto, Modelo de Negócio, Manual).
 */

export type OrigemModulo = "core" | "produto" | "modelo_negocio" | "manual";

export interface ResumoMarca {
  id: string;
  nome: string;
  slug: string;
  planKey: string;
  produtoNome: string | null;
  subscriptionStatus: string;
  ultimaAplicacaoTemplate: string | null;
}

export interface ModuloDefinicao {
  id: string;
  key: string;
  label: string;
  category: string | null;
  isCore: boolean;
}

export interface ModuloDiagnostico {
  id: string;
  key: string;
  label: string;
  category: string | null;
  isEnabled: boolean;
  origens: OrigemModulo[];
}

export interface DiffTemplate {
  sobrando: ModuloDefinicao[];   // ativos na marca, mas fora do template do produto
  faltando: ModuloDefinicao[];   // no template do produto, mas não ativos na marca
}

export interface DiagnosticoCompleto {
  marca: ResumoMarca;
  modulos: ModuloDiagnostico[];
  diffTemplate: DiffTemplate;
  totalNucleo: number;
  totalProduto: number;
  totalModeloNegocio: number;
  totalManual: number;
}