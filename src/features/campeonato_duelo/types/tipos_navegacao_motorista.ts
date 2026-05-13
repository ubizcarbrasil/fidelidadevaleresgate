/**
 * Identificadores das abas do painel do motorista no Campeonato.
 * Extraído da página principal para permitir reuso em componentes
 * filhos (ex.: AbaConfiguracoes precisa navegar para 'chaveamento').
 */
export type AbaId =
  | "duelos"
  | "noticias"
  | "classificacao"
  | "artilharia"
  | "chaveamento"
  | "proximos"
  | "configuracoes";