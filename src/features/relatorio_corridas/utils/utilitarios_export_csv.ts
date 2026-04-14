import type { RelatorioCidadeRow } from "../types/tipos_relatorio_corridas";

export function exportarRelatorioCsv(rows: RelatorioCidadeRow[]) {
  const headers = [
    "Cidade",
    "Estado",
    "Total Corridas",
    "Valor Total (R$)",
    "Pontos Motorista",
    "Pontos Cliente",
    "Motoristas Únicos",
    "Corridas Mês Atual",
    "Corridas Mês Anterior",
  ];

  const csvRows = rows.map((r) => [
    r.branch_city,
    r.branch_state,
    String(r.total_rides),
    r.total_ride_value.toFixed(2),
    String(r.total_driver_points),
    String(r.total_client_points),
    String(r.total_drivers),
    String(r.rides_current_month),
    String(r.rides_prev_month),
  ]);

  const csvContent = [
    headers.join(","),
    ...csvRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_corridas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
