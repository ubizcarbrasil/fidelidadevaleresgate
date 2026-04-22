import { supabase } from "@/integrations/supabase/client";
import type { DriverRow } from "@/types/driver";
import type { StatusFiltro } from "../hooks/hook_listagem_motoristas";
import {
  apenasDigitos,
  aplicarFiltroStatus,
  ehBuscaPorPlaca,
  precisaPreFiltrarPorProfiles,
} from "../utils/utilitarios_filtros_motoristas";

const TAMANHO_LOTE = 1000;
const LIMITE_MAXIMO = 20000;
const CHUNK_PROFILES = 5000;
const CHUNK_IN = 800;

export interface ParametrosExportacao {
  brandId: string;
  branchId: string | null;
  isBranchScope: boolean;
  busca: string;
  statusFiltro: StatusFiltro;
  onProgresso?: (carregados: number, total: number) => void;
}

export interface ResultadoExportacao {
  motoristas: DriverRow[];
  total: number;
  excedeuLimite: boolean;
}

async function buscarIdsFiltrados(params: {
  brandId: string;
  branchId: string | null;
  isBranchScope: boolean;
  status: StatusFiltro;
  buscaPorPlaca: boolean;
  termoPlaca: string;
}): Promise<string[]> {
  const { brandId, branchId, isBranchScope, status, buscaPorPlaca, termoPlaca } = params;
  const ids: string[] = [];
  let offset = 0;

  while (true) {
    let q = (supabase as any)
      .from("driver_profiles")
      .select("customer_id")
      .eq("brand_id", brandId);

    if (isBranchScope && branchId) q = q.eq("branch_id", branchId);
    q = aplicarFiltroStatus(q, status);

    if (buscaPorPlaca) {
      q = q.or(`vehicle1_plate.ilike.%${termoPlaca}%,vehicle2_plate.ilike.%${termoPlaca}%`);
    }

    const { data, error } = await q.range(offset, offset + CHUNK_PROFILES - 1);
    if (error) throw error;

    const lote = (data || []).map((p: any) => p.customer_id as string);
    ids.push(...lote);

    if (lote.length < CHUNK_PROFILES) break;
    offset += CHUNK_PROFILES;
    if (ids.length >= LIMITE_MAXIMO) break;
  }

  return ids;
}

/**
 * Busca TODOS os motoristas em lotes, respeitando os mesmos filtros
 * aplicados na listagem.
 */
export async function exportarTodosMotoristas(
  params: ParametrosExportacao,
): Promise<ResultadoExportacao> {
  const { brandId, branchId, isBranchScope, busca, statusFiltro, onProgresso } = params;
  const termo = busca.trim();
  const digitos = apenasDigitos(termo);
  const buscaPorPlaca = !!termo && ehBuscaPorPlaca(termo);
  const termoPlaca = buscaPorPlaca ? termo.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";

  // ---------- 1. Pré-filtros via driver_profiles ----------
  let customerIdsFiltrados: string[] | null = null;

  if (precisaPreFiltrarPorProfiles(statusFiltro, buscaPorPlaca)) {
    customerIdsFiltrados = await buscarIdsFiltrados({
      brandId,
      branchId,
      isBranchScope,
      status: statusFiltro,
      buscaPorPlaca,
      termoPlaca,
    });

    if (customerIdsFiltrados.length === 0) {
      return { motoristas: [], total: 0, excedeuLimite: false };
    }
  }

  // ---------- 2. Construtor da query base de customers ----------
  const construirQuery = (idsChunk?: string[]) => {
    let q = (supabase as any)
      .from("customers")
      .select(
        "id, name, cpf, phone, email, points_balance, user_id, branch_id, customer_tier, scoring_disabled, driver_monthly_ride_count, updated_at",
        { count: "exact" },
      )
      .eq("brand_id", brandId)
      .ilike("name", "%[MOTORISTA]%")
      .order("updated_at", { ascending: false });

    if (isBranchScope && branchId) q = q.eq("branch_id", branchId);
    if (idsChunk) q = q.in("id", idsChunk);

    if (termo && !buscaPorPlaca) {
      const cond: string[] = [`name.ilike.%${termo}%`];
      if (digitos) {
        cond.push(`cpf.ilike.%${digitos}%`);
        cond.push(`phone.ilike.%${digitos}%`);
      }
      if (termo.includes("@")) cond.push(`email.ilike.%${termo}%`);
      q = q.or(cond.join(","));
    }
    return q;
  };

  // ---------- 3. Buscar registros base ----------
  let registrosBase: any[] = [];
  let totalGeral = 0;
  let excedeuLimite = false;

  if (customerIdsFiltrados && customerIdsFiltrados.length > CHUNK_IN) {
    // Múltiplos chunks .in() em paralelo
    const chunks: string[][] = [];
    for (let i = 0; i < customerIdsFiltrados.length; i += CHUNK_IN) {
      chunks.push(customerIdsFiltrados.slice(i, i + CHUNK_IN));
    }

    const resultados = await Promise.all(
      chunks.map((chunk) => construirQuery(chunk).range(0, LIMITE_MAXIMO - 1)),
    );

    const map = new Map<string, any>();
    for (const res of resultados) {
      if (res.error) throw res.error;
      for (const row of res.data || []) {
        map.set(row.id, row);
      }
    }
    registrosBase = Array.from(map.values()).sort((a, b) =>
      a.updated_at && b.updated_at ? (a.updated_at < b.updated_at ? 1 : -1) : 0,
    );
    totalGeral = registrosBase.length;
    if (registrosBase.length > LIMITE_MAXIMO) {
      excedeuLimite = true;
      registrosBase = registrosBase.slice(0, LIMITE_MAXIMO);
    }
    onProgresso?.(0, totalGeral);
  } else {
    // Lotes paginados normais
    let from = 0;
    while (true) {
      const to = from + TAMANHO_LOTE - 1;
      const { data, error, count } = await construirQuery(
        customerIdsFiltrados ?? undefined,
      ).range(from, to);
      if (error) throw error;

      if (from === 0) {
        totalGeral = count || 0;
        if (totalGeral > LIMITE_MAXIMO) excedeuLimite = true;
      }

      if (!data || data.length === 0) break;
      registrosBase.push(...data);
      onProgresso?.(registrosBase.length, totalGeral);

      if (data.length < TAMANHO_LOTE) break;
      if (registrosBase.length >= totalGeral) break;
      if (registrosBase.length >= LIMITE_MAXIMO) {
        excedeuLimite = true;
        break;
      }
      from += TAMANHO_LOTE;
    }
  }

  if (registrosBase.length === 0) {
    return { motoristas: [], total: totalGeral, excedeuLimite };
  }

  // ---------- 4. Enriquecimento em lotes ----------
  const todos: DriverRow[] = [];
  for (let i = 0; i < registrosBase.length; i += TAMANHO_LOTE) {
    const lote = registrosBase.slice(i, i + TAMANHO_LOTE);
    const custIds = lote.map((c: any) => c.id);

    const [statsRes, branchesRes, emailsRes] = await Promise.all([
      supabase.rpc("get_driver_ride_stats", {
        p_brand_id: brandId,
        p_customer_ids: custIds,
      }),
      (async () => {
        const branchIds = [
          ...new Set(lote.filter((c: any) => c.branch_id).map((c: any) => c.branch_id)),
        ];
        if (branchIds.length === 0) return { data: [] as any[] };
        return await (supabase as any)
          .from("branches")
          .select("id, name, city")
          .in("id", branchIds);
      })(),
      (async () => {
        const userIds = lote.filter((c: any) => c.user_id).map((c: any) => c.user_id);
        if (userIds.length === 0) return { data: [] as any[] };
        return await (supabase as any).from("profiles").select("id, email").in("id", userIds);
      })(),
    ]);

    const ridePointsById: Record<string, number> = {};
    const rideCountById: Record<string, number> = {};
    ((statsRes.data || []) as any[]).forEach((r: any) => {
      if (r.customer_id) {
        ridePointsById[r.customer_id] = Number(r.total_ride_points || 0);
        rideCountById[r.customer_id] = Number(r.total_rides || 0);
      }
    });

    const branchMap: Record<string, string> = {};
    ((branchesRes.data || []) as any[]).forEach((b: any) => {
      branchMap[b.id] = b.city || b.name || "";
    });

    const emailMap: Record<string, string> = {};
    ((emailsRes.data || []) as any[]).forEach((p: any) => {
      if (p.email) emailMap[p.id] = p.email;
    });

    const enriquecido: DriverRow[] = lote.map((c: any) => ({
      id: c.id,
      name: c.name,
      cpf: c.cpf,
      phone: c.phone,
      email: c.email || (c.user_id ? emailMap[c.user_id] || null : null),
      points_balance: Number(c.points_balance || 0),
      user_id: c.user_id,
      branch_id: c.branch_id,
      customer_tier: c.customer_tier,
      scoring_disabled: c.scoring_disabled ?? false,
      total_ride_points: ridePointsById[c.id] || 0,
      total_rides: rideCountById[c.id] || 0,
      branch_name: c.branch_id ? branchMap[c.branch_id] || null : null,
    }));

    todos.push(...enriquecido);
    onProgresso?.(todos.length, totalGeral);
  }

  return { motoristas: todos, total: totalGeral, excedeuLimite };
}
