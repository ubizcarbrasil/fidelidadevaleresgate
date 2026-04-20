import * as XLSX from "xlsx";
import type { LinhaPlanilha } from "../types/tipos_importacao";

/**
 * Parser unificado para CSV e XLSX.
 * Sempre retorna lista de objetos { coluna: valor } em string.
 */
export async function parsearArquivo(file: File): Promise<LinhaPlanilha[]> {
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
