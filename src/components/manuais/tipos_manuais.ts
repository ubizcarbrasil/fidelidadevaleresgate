export interface ManualEntry {
  id: string;
  titulo: string;
  descricao: string;
  comoAtivar: string;
  passos: string[];
  dicas: string[];
  rota: string;
}

export interface GrupoManual {
  categoria: string;
  icone: string;
  manuais: ManualEntry[];
  scoringFilter?: "DRIVER" | "PASSENGER";
}
