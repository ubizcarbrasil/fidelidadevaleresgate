// supabase/functions/import-drivers-bulk/index.ts
// Importa motoristas em massa a partir de planilhas (já parseadas pelo front).
// Processa em chunks de 500 linhas. Match: external_id > cpf > phone > nome.
// Atualiza driver_import_jobs para progresso em tempo real.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LinhaMapeada {
  external_id?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  mother_name?: string;
  cnh_number?: string;
  cnh_expiration?: string;
  has_ear?: boolean;
  rating?: number;
  acceptance_rate?: number;
  registration_status?: string;
  registered_at?: string;
  blocked_until?: string;
  block_reason?: string;
  last_os_at?: string;
  last_activity_at?: string;
  accepted_payments?: Record<string, boolean>;
  services_offered?: Record<string, boolean>;
  link_type?: string;
  relationship?: string;
  vehicle1_model?: string;
  vehicle1_year?: number;
  vehicle1_color?: string;
  vehicle1_plate?: string;
  vehicle1_state?: string;
  vehicle1_city?: string;
  vehicle1_renavam?: string;
  vehicle1_own?: boolean;
  vehicle1_exercise_year?: number;
  vehicle2_model?: string;
  vehicle2_year?: number;
  vehicle2_color?: string;
  vehicle2_plate?: string;
  vehicle2_state?: string;
  vehicle2_city?: string;
  vehicle2_renavam?: string;
  vehicle2_own?: boolean;
  vehicle2_exercise_year?: number;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;
  bank_holder_cpf?: string;
  bank_holder_name?: string;
  bank_code?: string;
  bank_agency?: string;
  bank_account?: string;
  pix_key?: string;
  extra_data?: string;
  internal_note_1?: string;
  internal_note_2?: string;
  internal_note_3?: string;
  imei_1?: string;
  imei_2?: string;
  vtr?: string;
  app_version?: string;
  referred_by?: string;
  fees_json?: Record<string, unknown>;
  raw?: Record<string, string>;
}

interface Payload {
  brand_id: string;
  branch_id?: string | null;
  rows: LinhaMapeada[];
}

interface ErroLinha {
  linha: number;
  nome?: string;
  motivo: string;
}

const limparCpf = (s?: string) => (s ? s.replace(/\D/g, "").padStart(11, "0").slice(0, 11) : null);
const limparTel = (s?: string) => (s ? s.replace(/\D/g, "") : null);
const normNome = (s?: string) =>
  s
    ? s
        .replace(/\[MOTORISTA\]\s*/i, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1. autentica chamador
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Sem autenticação" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;

  // 2. parse payload
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.brand_id || !Array.isArray(payload.rows)) {
    return new Response(JSON.stringify({ error: "brand_id e rows são obrigatórios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payload.rows.length > 5000) {
    return new Response(JSON.stringify({ error: "Máximo de 5000 linhas por importação" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. service role para operações internas
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 4. valida permissão
  const { data: roles } = await admin
    .from("user_roles")
    .select("role, brand_id, branch_id")
    .eq("user_id", userId)
    .eq("brand_id", payload.brand_id);

  const isBrandAdmin = roles?.some((r) => r.role === "brand_admin" || r.role === "root_admin");
  const isBranchAdmin = roles?.some(
    (r) => r.role === "branch_admin" && r.branch_id === payload.branch_id
  );

  if (!isBrandAdmin && !isBranchAdmin) {
    return new Response(JSON.stringify({ error: "Sem permissão para esta marca/cidade" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Branch admin: força branch_id
  let effectiveBranchId = payload.branch_id || null;
  if (isBranchAdmin && !isBrandAdmin) {
    const ba = roles!.find((r) => r.role === "branch_admin");
    effectiveBranchId = ba?.branch_id || null;
  }

  if (!effectiveBranchId) {
    // Pega primeira cidade ativa da marca
    const { data: br } = await admin
      .from("branches")
      .select("id")
      .eq("brand_id", payload.brand_id)
      .eq("is_active", true)
      .limit(1);
    effectiveBranchId = br?.[0]?.id || null;
  }

  if (!effectiveBranchId) {
    return new Response(JSON.stringify({ error: "Nenhuma cidade ativa encontrada" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 5. cria job
  const { data: job, error: jobErr } = await admin
    .from("driver_import_jobs")
    .insert({
      brand_id: payload.brand_id,
      branch_id: effectiveBranchId,
      created_by: userId,
      status: "running",
      total_rows: payload.rows.length,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    return new Response(JSON.stringify({ error: "Falha ao criar job", details: jobErr?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 6. processamento em background
  const jobId = job.id as string;
  const brandId = payload.brand_id;
  const branchId = effectiveBranchId;
  const rows = payload.rows;

  // Carrega TODOS os motoristas da marca em uma única query (paginado)
  const carregarMotoristasExistentes = async () => {
    const map = new Map<string, { id: string; cpf: string | null; phone: string | null; name: string | null; external_id: string | null }>();
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await admin
        .from("customers")
        .select("id, cpf, phone, name, external_driver_id")
        .eq("brand_id", brandId)
        .ilike("name", "%[MOTORISTA]%")
        .range(offset, offset + pageSize - 1);
      if (!data || data.length === 0) break;
      data.forEach((d) => {
        const cpfClean = limparCpf(d.cpf || undefined);
        const telClean = limparTel(d.phone || undefined);
        const nome = normNome(d.name || undefined);
        const ext = d.external_driver_id || null;
        const rec = { id: d.id, cpf: cpfClean, phone: telClean, name: nome, external_id: ext };
        if (cpfClean) map.set("cpf:" + cpfClean, rec);
        if (telClean) map.set("tel:" + telClean, rec);
        if (nome) map.set("nome:" + nome, rec);
        if (ext) map.set("ext:" + ext, rec);
      });
      if (data.length < pageSize) break;
      offset += pageSize;
    }
    return map;
  };

  const processar = async () => {
    const matchMap = await carregarMotoristasExistentes();
    const erros: ErroLinha[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let processed = 0;

    const CHUNK = 500;

    for (let off = 0; off < rows.length; off += CHUNK) {
      const chunk = rows.slice(off, off + CHUNK);

      // Para cada linha do chunk, decide insert ou update
      const insertsCustomers: any[] = [];
      const updatesCustomers: { id: string; patch: Record<string, unknown> }[] = [];
      const profilesUpserts: { customer_id: string; data: LinhaMapeada }[] = [];

      // Para inserts, precisamos depois pegar o id retornado
      // Vamos resolver matches primeiro
      type Plan = { kind: "insert" | "update" | "skip" | "error"; id?: string; row: LinhaMapeada; idx: number; reason?: string };
      const planos: Plan[] = chunk.map((row, i) => {
        const idx = off + i + 2; // linha humana (1=header)
        const cpf = limparCpf(row.cpf);
        const tel = limparTel(row.phone);
        const nome = normNome(row.name);
        const ext = row.external_id;

        let match = (ext && matchMap.get("ext:" + ext))
          || (cpf && matchMap.get("cpf:" + cpf))
          || (tel && matchMap.get("tel:" + tel))
          || (nome && matchMap.get("nome:" + nome))
          || null;

        if (match) return { kind: "update", id: match.id, row, idx };
        if (!row.name || !row.name.trim()) {
          return { kind: "error", row, idx, reason: "Nome obrigatório para criar novo motorista" };
        }
        return { kind: "insert", row, idx };
      });

      // INSERTs (lote)
      const toInsert = planos.filter((p) => p.kind === "insert");
      if (toInsert.length > 0) {
        const payloads = toInsert.map((p) => {
          const r = p.row;
          const obj: Record<string, unknown> = {
            brand_id: brandId,
            branch_id: branchId,
            name: `[MOTORISTA] ${r.name!.trim()}`,
            points_balance: 0,
            money_balance: 0,
          };
          const cpf = limparCpf(r.cpf);
          if (cpf && cpf.length === 11) obj.cpf = cpf;
          if (r.phone) obj.phone = r.phone.trim();
          if (r.email) obj.email = r.email.trim();
          if (r.external_id) obj.external_driver_id = r.external_id;
          return obj;
        });

        const { data: inserted, error: insErr } = await admin
          .from("customers")
          .insert(payloads)
          .select("id");

        if (insErr) {
          toInsert.forEach((p) => erros.push({ linha: p.idx, nome: p.row.name, motivo: "Insert: " + insErr.message }));
        } else if (inserted) {
          inserted.forEach((row, i) => {
            profilesUpserts.push({ customer_id: row.id, data: toInsert[i].row });
            created++;
          });
        }
      }

      // UPDATEs (um a um — necessário pois cada linha tem patch diferente)
      const toUpdate = planos.filter((p) => p.kind === "update");
      for (const p of toUpdate) {
        const r = p.row;
        const patch: Record<string, unknown> = {};
        const cpf = limparCpf(r.cpf);
        if (cpf && cpf.length === 11) patch.cpf = cpf;
        if (r.phone) patch.phone = r.phone.trim();
        if (r.email) patch.email = r.email.trim();
        if (r.name) patch.name = `[MOTORISTA] ${r.name.trim()}`;
        // Reforço: sempre que CSV trouxer external_id, sobrescreve no customer.
        // Costura registros criados pela primeira corrida (que podem ter ext_id diferente/nulo)
        // com a fonte de verdade do CSV — evita duplicatas.
        if (r.external_id) patch.external_driver_id = r.external_id;

        if (Object.keys(patch).length === 0) {
          skipped++;
        } else {
          const { error: upErr } = await admin.from("customers").update(patch).eq("id", p.id!);
          if (upErr) {
            erros.push({ linha: p.idx, nome: r.name, motivo: "Update: " + upErr.message });
          } else {
            updated++;
          }
        }
        profilesUpserts.push({ customer_id: p.id!, data: r });
      }

      // Erros do plano
      planos.filter((p) => p.kind === "error").forEach((p) => erros.push({ linha: p.idx, nome: p.row.name, motivo: p.reason! }));

      // UPSERT em driver_profiles (lote)
      if (profilesUpserts.length > 0) {
        const profilePayload = profilesUpserts.map(({ customer_id, data }) => ({
          customer_id,
          brand_id: brandId,
          branch_id: branchId,
          external_id: data.external_id ?? null,
          gender: data.gender ?? null,
          birth_date: data.birth_date ?? null,
          mother_name: data.mother_name ?? null,
          cnh_number: data.cnh_number ?? null,
          cnh_expiration: data.cnh_expiration ?? null,
          has_ear: data.has_ear ?? null,
          rating: data.rating ?? null,
          acceptance_rate: data.acceptance_rate ?? null,
          registration_status: data.registration_status ?? null,
          registered_at: data.registered_at ?? null,
          blocked_until: data.blocked_until ?? null,
          block_reason: data.block_reason ?? null,
          last_os_at: data.last_os_at ?? null,
          last_activity_at: data.last_activity_at ?? null,
          accepted_payments: data.accepted_payments ?? {},
          services_offered: data.services_offered ?? {},
          link_type: data.link_type ?? null,
          relationship: data.relationship ?? null,
          vehicle1_model: data.vehicle1_model ?? null,
          vehicle1_year: data.vehicle1_year ?? null,
          vehicle1_color: data.vehicle1_color ?? null,
          vehicle1_plate: data.vehicle1_plate ?? null,
          vehicle1_state: data.vehicle1_state ?? null,
          vehicle1_city: data.vehicle1_city ?? null,
          vehicle1_renavam: data.vehicle1_renavam ?? null,
          vehicle1_own: data.vehicle1_own ?? null,
          vehicle1_exercise_year: data.vehicle1_exercise_year ?? null,
          vehicle2_model: data.vehicle2_model ?? null,
          vehicle2_year: data.vehicle2_year ?? null,
          vehicle2_color: data.vehicle2_color ?? null,
          vehicle2_plate: data.vehicle2_plate ?? null,
          vehicle2_state: data.vehicle2_state ?? null,
          vehicle2_city: data.vehicle2_city ?? null,
          vehicle2_renavam: data.vehicle2_renavam ?? null,
          vehicle2_own: data.vehicle2_own ?? null,
          vehicle2_exercise_year: data.vehicle2_exercise_year ?? null,
          address_street: data.address_street ?? null,
          address_number: data.address_number ?? null,
          address_complement: data.address_complement ?? null,
          address_neighborhood: data.address_neighborhood ?? null,
          address_city: data.address_city ?? null,
          address_state: data.address_state ?? null,
          address_zipcode: data.address_zipcode ?? null,
          bank_holder_cpf: data.bank_holder_cpf ?? null,
          bank_holder_name: data.bank_holder_name ?? null,
          bank_code: data.bank_code ?? null,
          bank_agency: data.bank_agency ?? null,
          bank_account: data.bank_account ?? null,
          pix_key: data.pix_key ?? null,
          extra_data: data.extra_data ?? null,
          internal_note_1: data.internal_note_1 ?? null,
          internal_note_2: data.internal_note_2 ?? null,
          internal_note_3: data.internal_note_3 ?? null,
          imei_1: data.imei_1 ?? null,
          imei_2: data.imei_2 ?? null,
          vtr: data.vtr ?? null,
          app_version: data.app_version ?? null,
          referred_by: data.referred_by ?? null,
          fees_json: data.fees_json ?? {},
          raw_import_json: data.raw ?? null,
          imported_at: new Date().toISOString(),
        }));

        // Remove campos null (para não sobrescrever existentes em update)
        const cleaned = profilePayload.map((p) => {
          const obj: Record<string, unknown> = {};
          Object.entries(p).forEach(([k, v]) => {
            if (v !== null && v !== undefined) obj[k] = v;
            // mantém customer_id, brand_id, branch_id sempre
          });
          obj.customer_id = p.customer_id;
          obj.brand_id = p.brand_id;
          obj.branch_id = p.branch_id;
          obj.imported_at = p.imported_at;
          return obj;
        });

        const { error: profErr } = await admin
          .from("driver_profiles")
          .upsert(cleaned, { onConflict: "customer_id" });

        if (profErr) {
          console.error("Erro upsert driver_profiles:", profErr);
        }
      }

      processed += chunk.length;

      // Atualiza progresso
      await admin
        .from("driver_import_jobs")
        .update({
          processed_rows: processed,
          created_count: created,
          updated_count: updated,
          skipped_count: skipped,
          error_count: erros.length,
          errors_json: erros.slice(0, 200),
        })
        .eq("id", jobId);
    }

    await admin
      .from("driver_import_jobs")
      .update({
        status: "done",
        finished_at: new Date().toISOString(),
        processed_rows: processed,
        created_count: created,
        updated_count: updated,
        skipped_count: skipped,
        error_count: erros.length,
        errors_json: erros.slice(0, 500),
      })
      .eq("id", jobId);
  };

  // Dispara em background
  // @ts-ignore - EdgeRuntime existe no Deno deploy do Supabase
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(processar().catch(async (e) => {
      console.error("Erro processamento:", e);
      await admin
        .from("driver_import_jobs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          errors_json: [{ linha: 0, motivo: e?.message || String(e) }],
        })
        .eq("id", jobId);
    }));
  } else {
    await processar();
  }

  return new Response(JSON.stringify({ job_id: jobId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
