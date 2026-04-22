import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DriverRow } from "@/types/driver";
import {
  apenasDigitos,
  aplicarFiltroStatus,
  ehBuscaPorPlaca,
  precisaPreFiltrarPorProfiles,
} from "../utils/utilitarios_filtros_motoristas";

export type StatusFiltro = "ALL" | "ATIVO" | "INATIVO" | "BLOQUEADO";

export interface ParametrosListagem {
  brandId: string | null;
  branchId: string | null;
  isBranchScope: boolean;
  busca: string;
  statusFiltro: StatusFiltro;
  pagina: number;
  porPagina: number;
}

export interface ResultadoListagem {
  motoristas: DriverRow[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

const CHUNK_PROFILES = 5000;
const CHUNK_IN = 800; // limite seguro para .in() em PostgREST

/**
 * Busca todos os customer_ids elegíveis em driver_profiles, em chunks de 5000,
 * para suportar bases grandes sem truncamento silencioso.
 */
async function buscarIdsFiltradosPorProfiles(params: {
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
  }

  return ids;
}

/**
 * Listagem paginada de motoristas com busca server-side em:
 * - customers: nome, cpf, telefone, e-mail
 * - driver_profiles: placa (somente quando busca tem formato de placa)
 *
 * Status NULL é tratado como ATIVO (regra de negócio real).
 */
export function useListagemMotoristas(params: ParametrosListagem) {
  const { brandId, branchId, isBranchScope, busca, statusFiltro, pagina, porPagina } = params;

  return useQuery({
    queryKey: ["motoristas-listagem", brandId, branchId, busca, statusFiltro, pagina, porPagina],
    enabled: !!brandId,
    queryFn: async (): Promise<ResultadoListagem> => {
      const termo = busca.trim();
      const digitos = apenasDigitos(termo);
      const buscaPorPlaca = !!termo && ehBuscaPorPlaca(termo);
      const termoPlaca = buscaPorPlaca
        ? termo.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : "";

      // ---------- 1. PRÉ-FILTROS por driver_profiles ----------
      let customerIdsFiltrados: string[] | null = null;

      if (precisaPreFiltrarPorProfiles(statusFiltro, buscaPorPlaca)) {
        customerIdsFiltrados = await buscarIdsFiltradosPorProfiles({
          brandId: brandId!,
          branchId,
          isBranchScope,
          status: statusFiltro,
          buscaPorPlaca,
          termoPlaca,
        });

        if (customerIdsFiltrados.length === 0) {
          return {
            motoristas: [],
            total: 0,
            pagina,
            porPagina,
            totalPaginas: 0,
          };
        }
      }

      // ---------- 2. QUERY PRINCIPAL (customers) ----------
      const construirQuery = (idsChunk?: string[]) => {
        let q = (supabase as any)
          .from("customers")
          .select(
            "id, name, cpf, phone, email, points_balance, user_id, branch_id, customer_tier, scoring_disabled, driver_monthly_ride_count",
            { count: "exact" },
          )
          .eq("brand_id", brandId)
          .ilike("name", "%[MOTORISTA]%")
          .order("updated_at", { ascending: false });

        if (isBranchScope && branchId) q = q.eq("branch_id", branchId);
        if (idsChunk) q = q.in("id", idsChunk);

        // Busca textual (nome/cpf/tel/email) — só quando NÃO é busca por placa
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

      const from = (pagina - 1) * porPagina;
      const to = from + porPagina - 1;

      let data: any[] = [];
      let count = 0;

      if (
        customerIdsFiltrados &&
        customerIdsFiltrados.length > CHUNK_IN
      ) {
        // Estratégia: buscar todos os IDs em chunks SEM range, depois ordenar e paginar em memória.
        // Isso garante consistência quando o filtro excede o limite seguro do .in().
        const chunks: string[][] = [];
        for (let i = 0; i < customerIdsFiltrados.length; i += CHUNK_IN) {
          chunks.push(customerIdsFiltrados.slice(i, i + CHUNK_IN));
        }

        const resultados = await Promise.all(
          chunks.map((chunk) => construirQuery(chunk).range(0, 9999)),
        );

        const todosIds = new Map<string, any>();
        for (const res of resultados) {
          if (res.error) throw res.error;
          for (const row of res.data || []) {
            todosIds.set(row.id, row);
          }
        }

        const todos = Array.from(todosIds.values()).sort((a, b) => {
          // Postgres já ordenou cada chunk; ordenamos novamente por updated_at desc para consistência.
          // Usamos id como tiebreaker estável.
          if (a.updated_at && b.updated_at) {
            return a.updated_at < b.updated_at ? 1 : -1;
          }
          return 0;
        });

        count = todos.length;
        data = todos.slice(from, from + porPagina);
      } else {
        const q = construirQuery(customerIdsFiltrados ?? undefined).range(from, to);
        const res = await q;
        if (res.error) throw res.error;
        data = res.data || [];
        count = res.count || 0;
      }

      if (!data || data.length === 0) {
        return {
          motoristas: [],
          total: count,
          pagina,
          porPagina,
          totalPaginas: Math.max(1, Math.ceil(count / porPagina)),
        };
      }

      const custIds = data.map((c: any) => c.id);

      // ---------- 3. ENRIQUECIMENTO ----------
      const [statsRes, branchesRes, emailsRes] = await Promise.all([
        supabase.rpc("get_driver_ride_stats", {
          p_brand_id: brandId!,
          p_customer_ids: custIds,
        }),
        (async () => {
          const branchIds = [
            ...new Set(data.filter((c: any) => c.branch_id).map((c: any) => c.branch_id)),
          ];
          if (branchIds.length === 0) return { data: [] as any[] };
          return await (supabase as any)
            .from("branches")
            .select("id, name, city")
            .in("id", branchIds);
        })(),
        (async () => {
          const userIds = data.filter((c: any) => c.user_id).map((c: any) => c.user_id);
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

      const motoristas: DriverRow[] = data.map((c: any) => ({
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

      return {
        motoristas,
        total: count,
        pagina,
        porPagina,
        totalPaginas: Math.max(1, Math.ceil(count / porPagina)),
      };
    },
  });
}
