/**
 * utilitarios_export_gg — Sub-fase 5.8
 * ------------------------------------
 * Geração client-side de CSV e PDF dos Relatórios Cashback +
 * registro de audit_logs (action='csv_exported' | 'pdf_exported').
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import type {
  GgSummary,
  GgByStoreRow,
  GgByBranchRow,
  GgByMonthRow,
} from "@/compartilhados/hooks/hook_relatorios_ganha_ganha";

const fmtBR = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v: number) => v.toLocaleString("pt-BR");

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function logExport(
  action: "csv_exported" | "pdf_exported",
  brandId: string | null,
  details: Record<string, unknown>,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      actor_user_id: user?.id ?? null,
      entity_type: "report_export",
      entity_id: brandId,
      action,
      scope_type: brandId ? "BRAND" : "PLATFORM",
      scope_id: brandId,
      details_json: details,
    });
  } catch {
    // best-effort
  }
}

export type ExportContext = {
  brandId: string | null;
  brandName: string;
  periodStart: string;
  periodEnd: string;
  summary: GgSummary;
  byStore: GgByStoreRow[];
  byBranch: GgByBranchRow[];
  byMonth: GgByMonthRow[];
};

export async function exportGgReportCsv(ctx: ExportContext) {
  const sep = ";";
  const header = [
    "secao",
    "chave",
    "loja_ou_cidade",
    "uf",
    "pts_gerados",
    "pts_resgatados",
    "fat_geracao",
    "fat_resgate",
    "fat_total",
  ].join(sep);

  const lines: string[] = [header];

  // resumo
  lines.push(
    [
      "RESUMO",
      `${ctx.periodStart} a ${ctx.periodEnd}`,
      ctx.brandName,
      "",
      ctx.summary.total_earn_pts,
      ctx.summary.total_redeem_pts,
      ctx.summary.total_earn_fee.toFixed(2).replace(".", ","),
      ctx.summary.total_redeem_fee.toFixed(2).replace(".", ","),
      ctx.summary.total_fee.toFixed(2).replace(".", ","),
    ].join(sep),
  );

  ctx.byStore.forEach((s) => {
    lines.push(
      [
        "LOJA",
        s.store_id,
        s.store_name,
        "",
        s.earn_pts,
        s.redeem_pts,
        s.earn_fee.toFixed(2).replace(".", ","),
        s.redeem_fee.toFixed(2).replace(".", ","),
        s.total_fee.toFixed(2).replace(".", ","),
      ].join(sep),
    );
  });

  ctx.byBranch.forEach((b) => {
    lines.push(
      [
        "CIDADE",
        b.branch_id ?? "",
        `${b.branch_city || b.branch_name}`,
        b.branch_state,
        b.total_pts,
        "",
        "",
        "",
        b.total_fee.toFixed(2).replace(".", ","),
      ].join(sep),
    );
  });

  ctx.byMonth.forEach((m) => {
    lines.push(
      [
        "MES",
        m.month,
        m.month,
        "",
        m.earn_pts,
        m.redeem_pts,
        m.earn_fee.toFixed(2).replace(".", ","),
        m.redeem_fee.toFixed(2).replace(".", ","),
        m.total_fee.toFixed(2).replace(".", ","),
      ].join(sep),
    );
  });

  const csv = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const slug = ctx.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  downloadBlob(blob, `cashback-${slug}-${ctx.periodStart}-${ctx.periodEnd}.csv`);

  await logExport("csv_exported", ctx.brandId, {
    period_start: ctx.periodStart,
    period_end: ctx.periodEnd,
    rows_store: ctx.byStore.length,
    rows_branch: ctx.byBranch.length,
    rows_month: ctx.byMonth.length,
  });
}

export async function exportGgReportPdf(ctx: ExportContext) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFontSize(16);
  doc.text(`${ctx.brandName} — Relatório Cashback`, 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Período: ${ctx.periodStart} a ${ctx.periodEnd}`, 40, 68);
  doc.text(
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    40,
    82,
  );
  doc.setTextColor(0);

  // Resumo
  doc.setFontSize(12);
  doc.text("Resumo", 40, 110);
  autoTable(doc, {
    startY: 118,
    head: [["Métrica", "Valor"]],
    body: [
      ["Pontos Gerados", fmtInt(ctx.summary.total_earn_pts)],
      ["Pontos Resgatados", fmtInt(ctx.summary.total_redeem_pts)],
      ["Faturamento Geração (R$)", fmtBR(ctx.summary.total_earn_fee)],
      ["Faturamento Resgate (R$)", fmtBR(ctx.summary.total_redeem_fee)],
      ["TOTAL (R$)", fmtBR(ctx.summary.total_fee)],
      ["Eventos", fmtInt(ctx.summary.n_events)],
      ["Lojas Ativas", fmtInt(ctx.summary.n_stores)],
    ],
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  // Por Loja
  doc.setFontSize(12);
  doc.text("Por Loja", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Loja", "Pts G", "Pts R", "Fat. G", "Fat. R", "Total"]],
    body: ctx.byStore.slice(0, 30).map((s) => [
      s.store_name,
      fmtInt(s.earn_pts),
      fmtInt(s.redeem_pts),
      fmtBR(s.earn_fee),
      fmtBR(s.redeem_fee),
      fmtBR(s.total_fee),
    ]),
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  if (y > 700) {
    doc.addPage();
    y = 50;
  }

  doc.setFontSize(12);
  doc.text("Por Cidade", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Cidade", "UF", "Pontos", "Lojas", "Total (R$)"]],
    body: ctx.byBranch.map((b) => [
      b.branch_city || b.branch_name,
      b.branch_state,
      fmtInt(b.total_pts),
      fmtInt(b.n_stores),
      fmtBR(b.total_fee),
    ]),
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  if (y > 700) {
    doc.addPage();
    y = 50;
  }

  doc.setFontSize(12);
  doc.text("Por Mês (12 meses)", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Mês", "Pts G", "Pts R", "Fat. G", "Fat. R", "Total", "Eventos"]],
    body: ctx.byMonth.map((m) => [
      m.month,
      fmtInt(m.earn_pts),
      fmtInt(m.redeem_pts),
      fmtBR(m.earn_fee),
      fmtBR(m.redeem_fee),
      fmtBR(m.total_fee),
      fmtInt(m.n_events),
    ]),
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  // Rodapé com paginação
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `${ctx.brandName} — Cashback Inteligente — Página ${i}/${total}`,
      pageW / 2,
      820,
      { align: "center" },
    );
  }

  const slug = ctx.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`cashback-${slug}-${ctx.periodStart}-${ctx.periodEnd}.pdf`);

  await logExport("pdf_exported", ctx.brandId, {
    period_start: ctx.periodStart,
    period_end: ctx.periodEnd,
    rows_store: ctx.byStore.length,
    rows_branch: ctx.byBranch.length,
    rows_month: ctx.byMonth.length,
  });
}
