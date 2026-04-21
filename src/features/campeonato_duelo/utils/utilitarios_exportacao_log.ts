import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EventoLogConfronto } from "../types/tipos_log_eventos";
import { ROTULOS_RODADA } from "../constants/constantes_campeonato";
import { formatarDataHoraEvento, rotuloEventType, rotuloOponente } from "./utilitarios_log_eventos";

export interface ResumoFiltrosExport {
  rodadaLabel: string;
  motoristaLabel: string;
  dataInicio: string | null;
  dataFim: string | null;
  total: number;
  totalGeral: number;
}

function nomeArquivo(extensao: string) {
  const agora = new Date();
  const yyyy = agora.getFullYear();
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const dd = String(agora.getDate()).padStart(2, "0");
  const hh = String(agora.getHours()).padStart(2, "0");
  const mi = String(agora.getMinutes()).padStart(2, "0");
  return `log-eventos-campeonato_${yyyy}${mm}${dd}_${hh}${mi}.${extensao}`;
}

function escaparCsv(valor: string | number | null | undefined): string {
  const s = valor == null ? "" : String(valor);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatarIntervalo(inicio: string | null, fim: string | null) {
  if (!inicio && !fim) return "Todo o período";
  const fmt = (iso: string) => formatarDataHoraEvento(new Date(iso).toISOString());
  if (inicio && fim) return `${fmt(inicio)} até ${fmt(fim)}`;
  if (inicio) return `A partir de ${fmt(inicio)}`;
  return `Até ${fmt(fim as string)}`;
}

function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportarLogCsv(eventos: EventoLogConfronto[], resumo: ResumoFiltrosExport) {
  const linhas: string[] = [];
  // Cabeçalho com filtros aplicados
  linhas.push(escaparCsv("Log de eventos - Campeonato Duelo"));
  linhas.push(escaparCsv(`Gerado em: ${formatarDataHoraEvento(new Date().toISOString())}`));
  linhas.push(escaparCsv(`Rodada: ${resumo.rodadaLabel}`));
  linhas.push(escaparCsv(`Motorista: ${resumo.motoristaLabel}`));
  linhas.push(escaparCsv(`Período: ${formatarIntervalo(resumo.dataInicio, resumo.dataFim)}`));
  linhas.push(escaparCsv(`Total exportado: ${resumo.total} de ${resumo.totalGeral}`));
  linhas.push("");

  const cabecalhos = [
    "Data/Hora",
    "Rodada",
    "Slot",
    "Motorista",
    "Lado",
    "Oponente",
    "Evento",
    "Bracket ID",
    "Event Ref ID",
  ];
  linhas.push(cabecalhos.map(escaparCsv).join(","));

  for (const ev of eventos) {
    linhas.push(
      [
        formatarDataHoraEvento(ev.occurred_at),
        ROTULOS_RODADA[ev.bracket_round],
        ev.bracket_slot,
        ev.driver_name ?? "—",
        ev.lado === "desconhecido" ? "—" : ev.lado,
        rotuloOponente(ev),
        rotuloEventType(ev.event_type),
        ev.bracket_id,
        ev.event_ref_id ?? "",
      ]
        .map(escaparCsv)
        .join(","),
    );
  }

  // BOM para abrir no Excel com acentuação correta
  const csv = "\uFEFF" + linhas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  baixarBlob(blob, nomeArquivo("csv"));
}

export function exportarLogPdf(eventos: EventoLogConfronto[], resumo: ResumoFiltrosExport) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const margemX = 40;
  let y = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Log de eventos - Campeonato Duelo", margemX, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);

  const linhasMeta = [
    `Gerado em: ${formatarDataHoraEvento(new Date().toISOString())}`,
    `Rodada: ${resumo.rodadaLabel}    |    Motorista: ${resumo.motoristaLabel}`,
    `Período: ${formatarIntervalo(resumo.dataInicio, resumo.dataFim)}`,
    `Total exportado: ${resumo.total} de ${resumo.totalGeral}`,
  ];
  for (const linha of linhasMeta) {
    doc.text(linha, margemX, y);
    y += 12;
  }

  doc.setTextColor(0);

  autoTable(doc, {
    startY: y + 8,
    head: [["Data/Hora", "Rodada", "Slot", "Motorista", "Lado", "Oponente", "Evento"]],
    body: eventos.map((ev) => [
      formatarDataHoraEvento(ev.occurred_at),
      ROTULOS_RODADA[ev.bracket_round],
      String(ev.bracket_slot),
      ev.driver_name ?? "—",
      ev.lado === "desconhecido" ? "—" : ev.lado,
      rotuloOponente(ev),
      rotuloEventType(ev.event_type),
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: margemX, right: margemX },
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Página ${pageNumber}`, pageSize.getWidth() - margemX, pageHeight - 16, {
        align: "right",
      });
      doc.setTextColor(0);
      void data;
    },
  });

  doc.save(nomeArquivo("pdf"));
}