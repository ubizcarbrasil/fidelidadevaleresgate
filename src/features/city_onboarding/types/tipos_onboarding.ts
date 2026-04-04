export type StatusEtapa = "concluida" | "pendente" | "erro" | "nao_aplicavel";

export interface ResultadoValidacao {
  status: StatusEtapa;
  mensagem: string;
  detalhe?: string;
}

export interface ValidacaoCidade {
  cidadeCriada: ResultadoValidacao;
  modeloNegocio: ResultadoValidacao;
  parceiros: ResultadoValidacao;
  regrasPontos: ResultadoValidacao;
  integracaoMobilidade: ResultadoValidacao;
  carteiraPontos: ResultadoValidacao;
  ofertasAtivas: ResultadoValidacao;
}

export interface EtapaOnboarding {
  id: string;
  fase: string;
  icone: React.ElementType;
  cor: string;
  titulo: string;
  descricao: string;
  rota?: string;
  passos: string[];
  dicas?: string[];
  chaveValidacao: keyof ValidacaoCidade;
  condicional?: "DRIVER" | "PASSENGER";
}
