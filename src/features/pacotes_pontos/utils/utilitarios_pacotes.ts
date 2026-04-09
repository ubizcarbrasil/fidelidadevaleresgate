export function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

export function formatarPontos(pontos: number): string {
  return new Intl.NumberFormat("pt-BR").format(pontos) + " pts";
}

export function statusLabel(status: string): string {
  switch (status) {
    case "PENDING": return "Pendente";
    case "CONFIRMED": return "Confirmado";
    case "CANCELLED": return "Cancelado";
    default: return status;
  }
}

export function statusVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "PENDING": return "secondary";
    case "CONFIRMED": return "default";
    case "CANCELLED": return "destructive";
    default: return "outline";
  }
}
