import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DriverRow } from "@/types/driver";

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

const apenasDigitos = (s: string) => s.replace(/\D/g, "");

/**
 * Listagem paginada de motoristas com busca server-side em:
 * - customers: nome, cpf, telefone, e-mail
 * - driver_profiles: placa do veículo (vehicle1_plate / vehicle2_plate)
 *
 * Retorna até `porPagina` registros + total exato (count: 'exact').
 */
export function useListagemMotoristas(params: ParametrosListagem) {
  const { brandId, branchId, isBranchScope, busca, statusFiltro, pagina, porPagina } = params;

  return useQuery({
    queryKey: ["motoristas-listagem", brandId, branchId, busca, statusFiltro, pagina, porPagina],
    enabled: !!brandId,
    queryFn: async (): Promise<ResultadoListagem> => {
      const termo = busca.trim();
      const digitos = apenasDigitos(termo);

      // ---------- 1. PRÉ-FILTROS por driver_profiles (placa + status) ----------
      // Quando há busca por placa OU filtro de status, precisamos primeiro
      // descobrir os customer_ids elegíveis em driver_profiles.
      let customerIdsFiltrados: string[] | null = null;
      const buscaPareceComPlaca = /[a-zA-Z]/.test(termo) && termo.length >= 3;

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

        // Limite alto para suportar bases grandes; aplicado apenas como pré-filtro
        const { data: profilesIds, error: profErr } = await qProfiles.limit(10000);
        if (profErr) throw profErr;
        customerIdsFiltrados = (profilesIds || []).map((p: any) => p.customer_id);

        // Se filtro retornou vazio, já podemos encerrar
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
      const from = (pagina - 1) * porPagina;
      const to = from + porPagina - 1;

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

      // Busca textual em customers (nome, cpf, telefone, e-mail)
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

      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          motoristas: [],
          total: count || 0,
          pagina,
          porPagina,
          totalPaginas: Math.max(1, Math.ceil((count || 0) / porPagina)),
        };
      }

      const custIds = data.map((c: any) => c.id);

      // ---------- 3. ENRIQUECIMENTO (stats, branches, profiles emails) ----------
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

      const total = count || motoristas.length;
      return {
        motoristas,
        total,
        pagina,
        porPagina,
        totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
      };
    },
  });
}
