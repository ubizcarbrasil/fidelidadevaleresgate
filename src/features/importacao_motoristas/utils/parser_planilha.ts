import type { LinhaPlanilha } from "../types/tipos_importacao";

/**
 * Parser unificado para CSV e XLSX.
 * `xlsx` é carregado dinamicamente para não inflar o bundle inicial (~400KB).
 */
export async function parsearArquivo(file: File): Promise<LinhaPlanilha[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: false, cellNF: false, cellText: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });

  return json.map((row) => {
    const out: LinhaPlanilha = {};
    Object.entries(row).forEach(([k, v]) => {
      if (v === null || v === undefined) {
        out[k] = "";
      } else {
        out[k] = String(v).trim();
      }
    });
    return out;
  });
}

/**
 * Parser para CSV colado como texto (fallback iPhone PWA quando o file picker falha).
 * Aceita separador `,` ou `;` (autodetectado pela primeira linha).
 */
export async function parsearTextoCsv(texto: string): Promise<LinhaPlanilha[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(texto, { type: "string" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });

  return json.map((row) => {
    const out: LinhaPlanilha = {};
    Object.entries(row).forEach(([k, v]) => {
      out[k] = v === null || v === undefined ? "" : String(v).trim();
    });
    return out;
  });
}
