import { supabase } from "@/integrations/supabase/client";
import type { DriverRow } from "@/types/driver";
import type { StatusFiltro } from "../hooks/hook_listagem_motoristas";

const TAMANHO_LOTE = 1000;
const LIMITE_MAXIMO = 20000;

const apenasDigitos = (s: string) => s.replace(/\D/g, "");

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

/**
 * Busca TODOS os motoristas em lotes, respeitando os mesmos filtros
 * aplicados na listagem (busca, status, escopo de cidade).
 *
 * Retorna o array completo + total. Aplica limite defensivo de 20.000 registros.
 */
export async function exportarTodosMotoristas(
  params: ParametrosExportacao,
): Promise<ResultadoExportacao> {
  const { brandId, branchId, isBranchScope, busca, statusFiltro, onProgresso } = params;
  const termo = busca.trim();
  const digitos = apenasDigitos(termo);
  const buscaPareceComPlaca = /[a-zA-Z]/.test(termo) && termo.length >= 3;

  // ---------- 1. Pré-filtros via driver_profiles (placa + status) ----------
  let customerIdsFiltrados: string[] | null = null;

  if (statusFiltro !== "ALL" || buscaPareceComPlaca) {
    let qProfiles = (supabase as any)
      .from("driver_profiles")
      .select("customer_id")
      .eq("brand_id", brandId);

    if (isBranchScope && branchId) {
      qProfiles = qProfiles.eq("branch_id", branchId);
    }

    if (statusFiltro !== "ALL") {
      const mapa: Record<Exclude<StatusFiltro, "ALL">, string> = {
        ATIVO: "Ativo",
        INATIVO: "Inativo",
        BLOQUEADO: "Bloqueado",
      };
      qProfiles = qProfiles.ilike("registration_status", mapa[statusFiltro]);
    }

    if (buscaPareceComPlaca) {
      const placa = termo.toUpperCase().replace(/[^A-Z0-9]/g, "");
      qProfiles = qProfiles.or(
        `vehicle1_plate.ilike.%${placa}%,vehicle2_plate.ilike.%${placa}%`,
      );
    }

    const { data: profilesIds, error: profErr } = await qProfiles.limit(LIMITE_MAXIMO);
    if (profErr) throw profErr;
    customerIdsFiltrados = (profilesIds || []).map((p: any) => p.customer_id as string);

    if (customerIdsFiltrados!.length === 0) {
      return { motoristas: [], total: 0, excedeuLimite: false };
    }
  }

  // ---------- 2. Construtor da query base de customers ----------
  const construirQueryCustomers = () => {
    let q = (supabase as any)
      .from("customers")
      .select(
        "id, name, cpf, phone, email, points_balance, user_id, branch_id, customer_tier, scoring_disabled, driver_monthly_ride_count",
        { count: "exact" },
      )
      .eq("brand_id", brandId)
      .ilike("name", "%[MOTORISTA]%")
      .order("updated_at", { ascending: false });

    if (isBranchScope && branchId) {
      q = q.eq("branch_id", branchId);
    }

    if (customerIdsFiltrados) {
      q = q.in("id", customerIdsFiltrados);
    }

    if (termo && !buscaPareceComPlaca) {
      const cond: string[] = [`name.ilike.%${termo}%`];
      if (digitos) {
        cond.push(`cpf.ilike.%${digitos}%`);
        cond.push(`phone.ilike.%${digitos}%`);
      }
      if (termo.includes("@")) {
        cond.push(`email.ilike.%${termo}%`);
      }
      q = q.or(cond.join(","));
    }

    return q;
  };

  // ---------- 3. Loop de lotes ----------
  const todos: DriverRow[] = [];
  let totalGeral = 0;
  let excedeuLimite = false;
  let from = 0;

  while (true) {
    const to = from + TAMANHO_LOTE - 1;
    const { data, error, count } = await construirQueryCustomers().range(from, to);
    if (error) throw error;

    if (from === 0) {
      totalGeral = count || 0;
      if (totalGeral > LIMITE_MAXIMO) {
        excedeuLimite = true;
      }
    }

    if (!data || data.length === 0) break;

    const custIds = data.map((c: any) => c.id);

    // Enriquecimento por lote
    const [statsRes, branchesRes, emailsRes] = await Promise.all([
      supabase.rpc("get_driver_ride_stats", {
        p_brand_id: brandId,
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

    const lote: DriverRow[] = data.map((c: any) => ({
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

    todos.push(...lote);
    onProgresso?.(todos.length, totalGeral);

    // Critérios de parada
    if (data.length < TAMANHO_LOTE) break;
    if (todos.length >= totalGeral) break;
    if (todos.length >= LIMITE_MAXIMO) {
      excedeuLimite = true;
      break;
    }

    from += TAMANHO_LOTE;
  }

  return { motoristas: todos, total: totalGeral, excedeuLimite };
}