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
  /** Modo legado: linhas embutidas no body. */
  rows?: LinhaMapeada[];
  /** Modo novo (resiliente em iPhone PWA): caminho do JSON no Storage. */
  storage_path?: string;
  /** Total esperado, usado para criar o job antes de baixar o arquivo. */
  total_rows?: number;
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

  const temStorage = typeof payload.storage_path === "string" && payload.storage_path.length > 0;
  if (!payload.brand_id || (!Array.isArray(payload.rows) && !temStorage)) {
    return new Response(JSON.stringify({ error: "brand_id e (rows OU storage_path) são obrigatórios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. service role para operações internas
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 3.5. Se vier storage_path, baixar JSON do bucket privado e popular `rows`.
  if (temStorage && !Array.isArray(payload.rows)) {
    try {
      const { data: blob, error: dlErr } = await admin
        .storage
        .from("importacoes-motoristas")
        .download(payload.storage_path!);
      if (dlErr || !blob) throw dlErr || new Error("Arquivo não encontrado");
      const text = await blob.text();
      const parsed = JSON.parse(text) as { rows?: LinhaMapeada[] };
      if (!Array.isArray(parsed.rows)) throw new Error("Formato inválido");
      payload.rows = parsed.rows;
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "Falha ao ler planilha do Storage", details: e?.message || String(e) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhuma linha para importar" }), {
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

  // Targeted lookup: busca SÓ motoristas que possam matchar pelos
  // identifiers presentes no CSV. Substitui o "load all" antigo que
  // causava heap exhaustion em brand com 100k+ motoristas (50MB+ no
  // Deno só pra montar matchMap, frequentemente OOM).
  //
  // Trade-off: matching por nome agora é "best effort" via ILIKE em
  // chunks pequenos. CPF/external_id/phone (matches mais confiáveis)
  // são cobertos via IN()/in-clause. Nome é fallback e geralmente já
  // tem ext_id ou CPF no CSV moderno.
  const carregarMotoristasExistentes = async () => {
    const map = new Map<string, { id: string; cpf: string | null; phone: string | null; name: string | null; external_id: string | null }>();

    // Coleta identifiers do CSV
    const cpfs = new Set<string>();
    const phones = new Set<string>();
    const extIds = new Set<string>();
    const namesNorm = new Set<string>();
    for (const r of rows) {
      const cpf = limparCpf(r.cpf);
      if (cpf) cpfs.add(cpf);
      const tel = limparTel(r.phone);
      if (tel) phones.add(tel);
      if (r.external_id) extIds.add(r.external_id);
      const n = normNome(r.name);
      if (n) namesNorm.add(n);
    }

    // Função helper pra registrar no map
    const registrar = (rec: { id: string; cpf: string | null; phone: string | null; name: string | null; external_driver_id: string | null }) => {
      const cpfClean = limparCpf(rec.cpf || undefined);
      const telClean = limparTel(rec.phone || undefined);
      const nome = normNome(rec.name || undefined);
      const ext = rec.external_driver_id || null;
      const item = { id: rec.id, cpf: cpfClean, phone: telClean, name: nome, external_id: ext };
      if (cpfClean) map.set("cpf:" + cpfClean, item);
      if (telClean) map.set("tel:" + telClean, item);
      if (nome) map.set("nome:" + nome, item);
      if (ext) map.set("ext:" + ext, item);
    };

    // Postgres IN() aceita até ~32k items confortavelmente. CSV importa
    // até 5000 linhas, então max 5000 IDs por lookup. Safe.
    const CHUNK = 1000; // chunks pra IN() não explodir query plan

    // 1. CPF (match mais forte) — chunkado pra plan estável
    const cpfArr = [...cpfs];
    for (let i = 0; i < cpfArr.length; i += CHUNK) {
      const slice = cpfArr.slice(i, i + CHUNK);
      const { data } = await admin
        .from("customers")
        .select("id, cpf, phone, name, external_driver_id")
        .eq("brand_id", brandId)
        .in("cpf", slice);
      (data || []).forEach(registrar);
    }

    // 2. external_driver_id
    const extArr = [...extIds];
    for (let i = 0; i < extArr.length; i += CHUNK) {
      const slice = extArr.slice(i, i + CHUNK);
      const { data } = await admin
        .from("customers")
        .select("id, cpf, phone, name, external_driver_id")
        .eq("brand_id", brandId)
        .in("external_driver_id", slice);
      (data || []).forEach(registrar);
    }

    // 3. Phone (último identifier forte)
    const phoneArr = [...phones];
    for (let i = 0; i < phoneArr.length; i += CHUNK) {
      const slice = phoneArr.slice(i, i + CHUNK);
      const { data } = await admin
        .from("customers")
        .select("id, cpf, phone, name, external_driver_id")
        .eq("brand_id", brandId)
        .in("phone", slice);
      (data || []).forEach(registrar);
    }

    // 4. Names (fallback fuzzy) — apenas pras linhas que NÃO tem ext/cpf/phone
    // No matchMap. Evita re-query desnecessária. Usa OR via .or() chunked
    // só pra essas linhas restantes.
    const nameOnlyRows = rows.filter((r) => {
      const cpf = limparCpf(r.cpf);
      const tel = limparTel(r.phone);
      const ext = r.external_id;
      const n = normNome(r.name);
      if (!n) return false;
      // Se já matchou por outros identifiers, skip
      if (ext && map.has("ext:" + ext)) return false;
      if (cpf && map.has("cpf:" + cpf)) return false;
      if (tel && map.has("tel:" + tel)) return false;
      return true;
    });

    if (nameOnlyRows.length > 0) {
      // Pra name matching, faz query por brand+pattern e normaliza local.
      // Filtra por OR de ILIKE com até 50 nomes por query (Postgres OR
      // chains ficam pesados acima disso).
      const NAME_CHUNK = 50;
      const uniqueNames = [...new Set(nameOnlyRows.map(r => r.name!.trim()).filter(Boolean))];
      for (let i = 0; i < uniqueNames.length; i += NAME_CHUNK) {
        const slice = uniqueNames.slice(i, i + NAME_CHUNK);
        // Constrói OR pattern: name.ilike.%foo%,name.ilike.%bar%
        // Escapa wildcards básicos. Names em CSV não contêm % normalmente.
        const orFilter = slice
          .map(n => `name.ilike.%${n.replace(/[%_]/g, '')}%`)
          .join(",");
        const { data } = await admin
          .from("customers")
          .select("id, cpf, phone, name, external_driver_id")
          .eq("brand_id", brandId)
          .ilike("name", "%[MOTORISTA]%")
          .or(orFilter)
          .limit(500); // safety: nunca trazer mais de 500 por chunk
        (data || []).forEach(registrar);
      }
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
    let chunkFailures = 0;

    const CHUNK = 500;

    for (let off = 0; off < rows.length; off += CHUNK) {
      const chunk = rows.slice(off, off + CHUNK);

      // F5.4: cada chunk envelopado em try/catch — falha de 1 chunk não
      // mata o job. Antes, exceção não-tratada deixava status='running'
      // pra sempre e linhas pré-chunk em estado parcial.
      try {
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

        const match = (ext && matchMap.get("ext:" + ext))
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

      // UPDATEs em LOTE via RPC — F5.4: antes era 1 HTTP por motorista,
      // até 500 round-trips por chunk sem rollback. Agora vira 1 statement
      // SQL atômico (1 transação) com COALESCE preservando campos vazios.
      const toUpdate = planos.filter((p) => p.kind === "update");
      const updatePayload: Array<Record<string, unknown>> = [];
      for (const p of toUpdate) {
        const r = p.row;
        const item: Record<string, unknown> = { id: p.id };
        const cpf = limparCpf(r.cpf);
        if (cpf && cpf.length === 11) item.cpf = cpf;
        if (r.phone) item.phone = r.phone.trim();
        if (r.email) item.email = r.email.trim();
        if (r.name) item.name = `[MOTORISTA] ${r.name.trim()}`;
        // Reforço: sempre que CSV trouxer external_id, sobrescreve no customer.
        // Costura registros criados pela primeira corrida (que podem ter ext_id diferente/nulo)
        // com a fonte de verdade do CSV — evita duplicatas.
        if (r.external_id) item.external_driver_id = r.external_id;

        // id sempre presente; se nada mais, pula
        if (Object.keys(item).length === 1) {
          skipped++;
        } else {
          updatePayload.push(item);
        }
        profilesUpserts.push({ customer_id: p.id!, data: r });
      }

      if (updatePayload.length > 0) {
        const { data: updatedCount, error: updErr } = await admin.rpc(
          "import_drivers_update_batch" as any,
          { p_updates: updatePayload }
        );
        if (updErr) {
          // Falha do batch inteiro — registra erro por linha mas não
          // crasha o chunk (profiles ainda upsertam abaixo).
          toUpdate.forEach((p) => erros.push({
            linha: p.idx,
            nome: p.row.name,
            motivo: "Update batch: " + updErr.message,
          }));
        } else {
          updated += Number(updatedCount ?? updatePayload.length);
        }
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
      } catch (chunkErr: any) {
        // F5.4: chunk inteiro falhou — registra como erro e continua o job
        // pros próximos chunks. Antes, exception escapava e job ficava
        // travado em status='running' (cleanup_stuck_driver_import_jobs
        // pega esses jobs órfãos via cron, mas o ideal é não chegar lá).
        chunkFailures++;
        chunk.forEach((row, i) => {
          erros.push({
            linha: off + i + 2,
            nome: row.name,
            motivo: "Chunk failed: " + (chunkErr?.message ?? String(chunkErr)),
          });
        });
        processed += chunk.length;
      }

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

    // F5.4: status final reflete o que aconteceu. Se ALGUM chunk falhou
    // ou houve linhas com erro, status='partial' em vez de 'done' — UI
    // alerta que importação não foi 100% limpa.
    const finalStatus = (chunkFailures > 0 || erros.length > 0) ? "partial" : "done";
    await admin
      .from("driver_import_jobs")
      .update({
        status: finalStatus,
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
  // @ts-expect-error — EdgeRuntime existe no Deno deploy do Supabase, fora dos tipos
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-expect-error — idem
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
