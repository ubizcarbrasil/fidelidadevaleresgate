import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2, Download, ArrowRight, Link2, History, Clock } from "lucide-react";
import { toast } from "sonner";

// ── CSV Parsing ──
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return row;
  });
  return { headers, rows };
}

// ── Target field definitions ──
interface TargetField {
  key: string;
  label: string;
  required: boolean;
}

const STORE_FIELDS: TargetField[] = [
  { key: "name", label: "Nome", required: true },
  { key: "slug", label: "Slug", required: false },
  { key: "logo_url", label: "URL do Logo", required: false },
  { key: "category", label: "Categoria", required: false },
  { key: "address", label: "Endereço", required: false },
  { key: "whatsapp", label: "WhatsApp", required: false },
  { key: "is_active", label: "Ativo", required: false },
];

const OFFER_FIELDS: TargetField[] = [
  { key: "title", label: "Título", required: true },
  { key: "store_name", label: "Nome da Loja", required: true },
  { key: "store_slug", label: "Slug da Loja", required: false },
  { key: "image_url", label: "URL da Imagem", required: false },
  { key: "description", label: "Descrição", required: false },
  { key: "value_rescue", label: "Valor Resgate", required: false },
  { key: "min_purchase", label: "Compra Mínima", required: false },
  { key: "start_at", label: "Início", required: false },
  { key: "end_at", label: "Fim", required: false },
  { key: "allowed_weekdays", label: "Dias da Semana", required: false },
  { key: "allowed_hours", label: "Horários", required: false },
  { key: "max_daily_redemptions", label: "Máx. Resgates/Dia", required: false },
  { key: "category", label: "Categoria", required: false },
  { key: "status", label: "Status", required: false },
  { key: "is_active", label: "Ativo", required: false },
];

const CUSTOMER_FIELDS: TargetField[] = [
  { key: "name", label: "Nome", required: true },
  { key: "phone", label: "Telefone", required: false },
  { key: "cpf", label: "CPF", required: false },
  { key: "email", label: "E-mail", required: false },
  { key: "points_balance", label: "Saldo de Pontos", required: false },
  { key: "money_balance", label: "Saldo em R$", required: false },
  { key: "is_active", label: "Ativo", required: false },
];

const CRM_CONTACT_FIELDS: TargetField[] = [
  { key: "name", label: "Nome", required: true },
  { key: "phone", label: "Telefone", required: false },
  { key: "email", label: "E-mail", required: false },
  { key: "cpf", label: "CPF", required: false },
  { key: "gender", label: "Gênero", required: false },
  { key: "os_platform", label: "Sistema Operacional", required: false },
  { key: "ride_count", label: "Qtd. Corridas", required: false },
  { key: "first_ride_at", label: "Ativo Desde", required: false },
  { key: "last_ride_at", label: "Última Corrida", required: false },
  { key: "source", label: "Origem", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "is_active", label: "Ativo", required: false },
];

const COUPON_FIELDS: TargetField[] = [
  { key: "code", label: "Código", required: true },
  { key: "store_name", label: "Nome da Loja", required: true },
  { key: "store_slug", label: "Slug da Loja", required: false },
  { key: "type", label: "Tipo (PERCENT/FIXED)", required: true },
  { key: "value", label: "Valor", required: true },
  { key: "expires_at", label: "Data de Expiração", required: true },
  { key: "campaign", label: "Campanha (título da oferta)", required: false },
  { key: "status", label: "Status", required: false },
];

const EARNING_EVENT_FIELDS: TargetField[] = [
  { key: "name", label: "Nome", required: true },
  { key: "cpf", label: "CPF", required: false },
  { key: "email", label: "E-mail", required: false },
  { key: "phone", label: "Telefone", required: false },
  { key: "purchase_value", label: "Valor da Viagem", required: true },
  { key: "created_at", label: "Data", required: false },
];

// ── Validation ──
const WEEKDAY_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
interface ValidationError { row: number; field: string; message: string; }

/** Parse Brazilian date "DD/MM/YYYY HH:mm" → ISO 8601, or pass-through ISO strings */
function parseBrDate(val: string): string | null {
  if (!val?.trim()) return null;
  const match = val.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2})(?::(\d{2}))?)?$/);
  if (match) {
    const [, dd, mm, yyyy, time, sec] = match;
    return `${yyyy}-${mm}-${dd}T${time || "00:00"}:${sec || "00"}`;
  }
  if (!isNaN(Date.parse(val))) return new Date(val).toISOString();
  return null;
}

const BATCH_SIZE = 100;

function validateMappedRow(row: Record<string, string>, idx: number, importType: ImportType): ValidationError[] {
  const errors: ValidationError[] = [];
  const rowNum = idx + 2;

  if (importType === "STORES" || importType === "CUSTOMERS" || importType === "CRM_CONTACTS" || importType === "EARNING_EVENTS") {
    if (!row.name?.trim()) errors.push({ row: rowNum, field: "name", message: "Nome é obrigatório" });
  }
  if (importType === "OFFERS") {
    if (!row.title?.trim()) errors.push({ row: rowNum, field: "title", message: "Título é obrigatório" });
    if (!row.store_name?.trim() && !row.store_slug?.trim()) errors.push({ row: rowNum, field: "store_name", message: "store_name ou store_slug é obrigatório" });
    if (row.value_rescue && isNaN(Number(row.value_rescue))) errors.push({ row: rowNum, field: "value_rescue", message: "Deve ser numérico" });
    if (row.min_purchase && isNaN(Number(row.min_purchase))) errors.push({ row: rowNum, field: "min_purchase", message: "Deve ser numérico" });
    if (row.start_at && isNaN(Date.parse(row.start_at))) errors.push({ row: rowNum, field: "start_at", message: "Data inválida" });
    if (row.end_at && isNaN(Date.parse(row.end_at))) errors.push({ row: rowNum, field: "end_at", message: "Data inválida" });
  }
  if (importType === "COUPONS") {
    if (!row.code?.trim()) errors.push({ row: rowNum, field: "code", message: "Código é obrigatório" });
    else if (!/^[A-Z0-9]{4,16}$/.test(row.code.trim().toUpperCase())) errors.push({ row: rowNum, field: "code", message: "Código deve ter 4-16 caracteres (A-Z, 0-9)" });
    if (!row.store_name?.trim() && !row.store_slug?.trim()) errors.push({ row: rowNum, field: "store_name", message: "store_name ou store_slug é obrigatório" });
    const typeVal = row.type?.trim().toUpperCase();
    if (!typeVal || !["PERCENT", "FIXED"].includes(typeVal)) errors.push({ row: rowNum, field: "type", message: "Tipo deve ser PERCENT ou FIXED" });
    if (!row.value?.trim() || isNaN(Number(row.value)) || Number(row.value) < 0) errors.push({ row: rowNum, field: "value", message: "Valor deve ser numérico e positivo" });
    if (!row.expires_at?.trim()) errors.push({ row: rowNum, field: "expires_at", message: "Data de expiração é obrigatória" });
    else if (!parseBrDate(row.expires_at)) errors.push({ row: rowNum, field: "expires_at", message: "Data de expiração inválida" });
    if (row.status?.trim()) {
      const st = row.status.trim().toUpperCase();
      if (!["ACTIVE", "INACTIVE", "EXPIRED"].includes(st)) errors.push({ row: rowNum, field: "status", message: "Status deve ser ACTIVE, INACTIVE ou EXPIRED" });
    }
  }
  if (importType === "EARNING_EVENTS") {
    if (!row.purchase_value?.trim() || isNaN(Number(row.purchase_value)) || Number(row.purchase_value) <= 0) {
      errors.push({ row: rowNum, field: "purchase_value", message: "Valor da viagem deve ser numérico e positivo" });
    }
    if (row.created_at?.trim() && !parseBrDate(row.created_at)) {
      errors.push({ row: rowNum, field: "created_at", message: "Data inválida" });
    }
  }
  if (importType === "CUSTOMERS") {
    if (row.points_balance && isNaN(Number(row.points_balance))) errors.push({ row: rowNum, field: "points_balance", message: "Deve ser numérico" });
    if (row.money_balance && isNaN(Number(row.money_balance))) errors.push({ row: rowNum, field: "money_balance", message: "Deve ser numérico" });
  }
  if (row.is_active && !["true", "false", "1", "0", "sim", "não", "nao", "yes", "no", ""].includes(row.is_active.toLowerCase())) {
    errors.push({ row: rowNum, field: "is_active", message: "Valor inválido (use true/false)" });
  }
  return errors;
}

function parseBool(val: string): boolean {
  return ["true", "1", "sim", "yes"].includes(val.toLowerCase().trim());
}

function parseWeekdays(val: string): number[] {
  if (!val.trim()) return [0, 1, 2, 3, 4, 5, 6];
  return val.split(",").map(d => WEEKDAY_MAP[d.trim().toLowerCase()]).filter(n => n !== undefined);
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Auto-match CSV headers to target fields
function autoMatch(csvHeaders: string[], targetFields: TargetField[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of targetFields) {
    const normalizedKey = field.key.toLowerCase().replace(/_/g, "");
    const match = csvHeaders.find(h => {
      const nh = h.toLowerCase().replace(/[_\s-]/g, "");
      return nh === normalizedKey || nh === field.label.toLowerCase().replace(/[_\s-]/g, "");
    });
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

// Apply mapping to transform rows
function applyMapping(rows: Record<string, string>[], mapping: Record<string, string>): Record<string, string>[] {
  return rows.map(row => {
    const mapped: Record<string, string> = {};
    for (const [targetKey, csvHeader] of Object.entries(mapping)) {
      if (csvHeader) mapped[targetKey] = row[csvHeader] || "";
    }
    return mapped;
  });
}

type ImportType = "STORES" | "OFFERS" | "CUSTOMERS" | "CRM_CONTACTS" | "COUPONS" | "EARNING_EVENTS";
type Step = "config" | "mapping" | "preview" | "importing" | "done";

function getTargetFields(importType: ImportType): TargetField[] {
  switch (importType) {
    case "STORES": return STORE_FIELDS;
    case "OFFERS": return OFFER_FIELDS;
    case "CUSTOMERS": return CUSTOMER_FIELDS;
    case "CRM_CONTACTS": return CRM_CONTACT_FIELDS;
    case "COUPONS": return COUPON_FIELDS;
    case "EARNING_EVENTS": return EARNING_EVENT_FIELDS;
  }
}

export default function CsvImportPage() {
  const { user } = useAuth();
  const { isRootAdmin, currentBrandId, currentBranchId } = useBrandGuard();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("config");
  const [importType, setImportType] = useState<ImportType>("STORES");
  const [brandId, setBrandId] = useState(currentBrandId || "");
  const [branchId, setBranchId] = useState(currentBranchId || "");
  const [autoCreateStores, setAutoCreateStores] = useState(true);

  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [mappedRows, setMappedRows] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: brands } = useQuery({
    queryKey: ["brands-select"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
    enabled: isRootAdmin,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-select", brandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name").eq("is_active", true).order("name");
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!brandId,
  });

  const targetFields = getTargetFields(importType);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { toast.error("Selecione um arquivo .csv"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.rows.length === 0) { toast.error("Arquivo vazio"); return; }
      setCsvData(parsed);

      // Auto-match columns
      const autoMapping = autoMatch(parsed.headers, targetFields);
      setColumnMapping(autoMapping);
      setStep("mapping");
    };
    reader.readAsText(file, "UTF-8");
  }, [importType, targetFields]);

  const handleMappingConfirm = () => {
    if (!csvData) return;

    // Check required fields are mapped
    const missingRequired = targetFields.filter(f => f.required && !columnMapping[f.key]);
    if (missingRequired.length > 0) {
      toast.error(`Campos obrigatórios não mapeados: ${missingRequired.map(f => f.label).join(", ")}`);
      return;
    }

    // Apply mapping and validate
    const mapped = applyMapping(csvData.rows, columnMapping);
    setMappedRows(mapped);

    const errors: ValidationError[] = [];
    mapped.forEach((row, i) => errors.push(...validateMappedRow(row, i, importType)));
    setValidationErrors(errors);
    setStep("preview");
  };

  const updateMapping = (targetKey: string, csvHeader: string) => {
    setColumnMapping(prev => {
      const next = { ...prev };
      if (csvHeader === "__none__") {
        delete next[targetKey];
      } else {
        next[targetKey] = csvHeader;
      }
      return next;
    });
  };

  // ── Import mutation (same logic, uses mappedRows) ──
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvData || !user || !brandId) throw new Error("Dados insuficientes");
      if (importType !== "CRM_CONTACTS" && !branchId) throw new Error("Selecione uma filial");

      setStep("importing");
      const result = { success: 0, skipped: 0, errors: [] as { row: number; message: string }[] };
      const rows = mappedRows;

      const { data: job } = await supabase.from("import_jobs").insert({
        brand_id: brandId, branch_id: branchId, created_by: user.id, type: importType, status: "IMPORTING",
      }).select("id").single();

      setImportProgress({ current: 0, total: rows.length });

      if (importType === "STORES") {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const slug = row.slug?.trim() || slugify(row.name);
            const { error } = await supabase.from("stores").insert({
              name: row.name.trim(), slug, brand_id: brandId, branch_id: branchId,
              logo_url: row.logo_url?.trim() || null, category: row.category?.trim() || null,
              address: row.address?.trim() || null, whatsapp: row.whatsapp?.trim() || null,
              is_active: row.is_active ? parseBool(row.is_active) : true,
            });
            if (error) throw error;
            result.success++;
          } catch (err: any) { result.errors.push({ row: i + 2, message: err.message }); }
          setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }
      } else if (importType === "OFFERS") {
        const { data: existingStores } = await supabase.from("stores").select("id, name, slug").eq("brand_id", brandId).eq("branch_id", branchId);
        const storeByName = new Map((existingStores || []).map(s => [s.name.toLowerCase(), s.id]));
        const storeBySlug = new Map((existingStores || []).map(s => [s.slug.toLowerCase(), s.id]));
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const storeName = row.store_name?.trim() || "";
            const storeSlug = row.store_slug?.trim() || "";
            let storeId = storeByName.get(storeName.toLowerCase()) || storeBySlug.get(storeSlug.toLowerCase());
            if (!storeId && autoCreateStores && storeName) {
              const newSlug = storeSlug || slugify(storeName);
              const { data: newStore, error: stErr } = await supabase.from("stores").insert({
                name: storeName, slug: newSlug, brand_id: brandId, branch_id: branchId,
              }).select("id").single();
              if (stErr) throw new Error(`Erro ao criar loja "${storeName}": ${stErr.message}`);
              storeId = newStore.id;
              storeByName.set(storeName.toLowerCase(), storeId);
              storeBySlug.set(newSlug.toLowerCase(), storeId);
            }
            if (!storeId) { result.errors.push({ row: i + 2, message: `Loja "${storeName || storeSlug}" não encontrada` }); continue; }
            const { error } = await supabase.from("offers").insert({
              store_id: storeId, brand_id: brandId, branch_id: branchId, title: row.title.trim(),
              image_url: row.image_url?.trim() || null, description: row.description?.trim() || null,
              value_rescue: row.value_rescue ? Number(row.value_rescue) : 0,
              min_purchase: row.min_purchase ? Number(row.min_purchase) : 0,
              start_at: row.start_at ? new Date(row.start_at).toISOString() : null,
              end_at: row.end_at ? new Date(row.end_at).toISOString() : null,
              allowed_weekdays: row.allowed_weekdays ? parseWeekdays(row.allowed_weekdays) : [0, 1, 2, 3, 4, 5, 6],
              allowed_hours: row.allowed_hours?.trim() || null,
              max_daily_redemptions: row.max_daily_redemptions ? Number(row.max_daily_redemptions) : null,
              status: (row.status?.trim().toUpperCase() as any) || "DRAFT",
              is_active: row.is_active ? parseBool(row.is_active) : true,
            });
            if (error) throw error;
            result.success++;
          } catch (err: any) { result.errors.push({ row: i + 2, message: err.message }); }
          setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }
      } else if (importType === "COUPONS") {
        // Pre-load stores for resolution
        const { data: existingStores } = await supabase.from("stores").select("id, name, slug").eq("brand_id", brandId).eq("branch_id", branchId);
        const storeByName = new Map((existingStores || []).map(s => [s.name.toLowerCase(), s.id]));
        const storeBySlug = new Map((existingStores || []).map(s => [s.slug.toLowerCase(), s.id]));

        // Pre-load offers for campaign linking (case-insensitive title match)
        const { data: existingOffers } = await supabase.from("offers").select("id, title").eq("brand_id", brandId).eq("branch_id", branchId).eq("is_active", true);
        const offerByTitle = new Map((existingOffers || []).map(o => [o.title.toLowerCase(), o.id]));

        // Pre-load existing coupon codes for uniqueness validation
        const { data: existingCoupons } = await supabase.from("coupons").select("code").eq("brand_id", brandId).eq("branch_id", branchId);
        const existingCodes = new Set((existingCoupons || []).map(c => c.code.toUpperCase()));

        // Track intra-CSV duplicates
        const csvCodes = new Set<string>();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const code = row.code.trim().toUpperCase();

            // Uniqueness: check DB
            if (existingCodes.has(code)) {
              result.errors.push({ row: i + 2, message: `Código "${code}" já existe no banco` });
              result.skipped++;
              setImportProgress(prev => ({ ...prev, current: i + 1 }));
              continue;
            }
            // Uniqueness: check intra-CSV
            if (csvCodes.has(code)) {
              result.errors.push({ row: i + 2, message: `Código "${code}" duplicado no CSV` });
              result.skipped++;
              setImportProgress(prev => ({ ...prev, current: i + 1 }));
              continue;
            }
            csvCodes.add(code);

            // Resolve store
            const storeName = row.store_name?.trim() || "";
            const storeSlug = row.store_slug?.trim() || "";
            const storeId = storeByName.get(storeName.toLowerCase()) || storeBySlug.get(storeSlug.toLowerCase());
            if (!storeId) {
              result.errors.push({ row: i + 2, message: `Loja "${storeName || storeSlug}" não encontrada` });
              result.skipped++;
              setImportProgress(prev => ({ ...prev, current: i + 1 }));
              continue;
            }

            // Resolve campaign → offer_id
            const campaignTitle = row.campaign?.trim() || "";
            const offerId = campaignTitle ? (offerByTitle.get(campaignTitle.toLowerCase()) || null) : null;

            const expiresAt = parseBrDate(row.expires_at);
            if (!expiresAt) throw new Error("Data de expiração inválida");

            const { error } = await supabase.from("coupons").insert({
              code,
              brand_id: brandId,
              branch_id: branchId,
              store_id: storeId,
              type: row.type.trim().toUpperCase(),
              value: Number(row.value),
              expires_at: expiresAt,
              offer_id: offerId,
              status: row.status?.trim().toUpperCase() || "ACTIVE",
            });
            if (error) throw error;
            existingCodes.add(code);
            result.success++;
          } catch (err: any) { result.errors.push({ row: i + 2, message: err.message }); }
          setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }
      } else if (importType === "CUSTOMERS") {
        // Batch insert customers, then mirror to crm_contacts
        for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
          const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
          const customerPayloads = batch.map(row => ({
            name: row.name.trim(), phone: row.phone?.trim() || null, cpf: row.cpf?.trim() || null,
            brand_id: brandId, branch_id: branchId,
            points_balance: row.points_balance ? Number(row.points_balance) : 0,
            money_balance: row.money_balance ? Number(row.money_balance) : 0,
            is_active: row.is_active ? parseBool(row.is_active) : true,
          }));

          const { data: inserted, error } = await supabase
            .from("customers")
            .insert(customerPayloads)
            .select("id");

          if (error || !inserted) {
            batch.forEach((_, j) => {
              result.errors.push({ row: batchStart + j + 2, message: error?.message || "Falha ao inserir lote de clientes" });
            });
            result.skipped += batch.length;
            setImportProgress({ current: Math.min(batchStart + BATCH_SIZE, rows.length), total: rows.length });
            continue;
          }

          // Batch mirror to crm_contacts
          const contactPayloads = inserted.map((c, j) => ({
            brand_id: brandId, branch_id: branchId, customer_id: c.id,
            name: batch[j].name.trim(), phone: batch[j].phone?.trim() || null,
            email: batch[j].email?.trim() || null, cpf: batch[j].cpf?.trim() || null, source: "STORE_UPLOAD",
          }));

          const { error: contactError } = await supabase.from("crm_contacts").insert(contactPayloads);
          if (contactError) {
            // Batch failed — retry one-by-one to maximize sync
            let batchOk = 0;
            for (let k = 0; k < contactPayloads.length; k++) {
              const { error: singleErr } = await supabase.from("crm_contacts").insert(contactPayloads[k]);
              if (singleErr) {
                result.errors.push({ row: batchStart + k + 2, message: `CRM: ${singleErr.message}` });
              } else {
                batchOk++;
              }
            }
            result.success += batchOk;
            result.skipped += (contactPayloads.length - batchOk);
          } else {
            result.success += inserted.length;
          }

          setImportProgress({ current: Math.min(batchStart + BATCH_SIZE, rows.length), total: rows.length });
        }
      } else if (importType === "EARNING_EVENTS") {
        // ── Pontuação Manual via CSV ──
        // Fetch active points rule
        const { data: rulesData } = await supabase
          .from("points_rules")
          .select("*")
          .eq("brand_id", brandId)
          .eq("is_active", true)
          .order("branch_id", { ascending: false, nullsFirst: false })
          .limit(1);
        const rule = rulesData?.[0];
        if (!rule) throw new Error("Nenhuma regra de pontos ativa encontrada para esta marca");

        const pointsPerReal = rule.points_per_real || 1;
        const moneyPerPoint = rule.money_per_point || 0;
        const maxPointsPerPurchase = rule.max_points_per_purchase || 999999;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const name = row.name?.trim();
            const cpf = row.cpf?.trim() || null;
            const phone = row.phone?.trim() || null;
            const email = row.email?.trim() || null;
            const purchaseValue = Number(row.purchase_value);
            const eventDate = parseBrDate(row.created_at || "") || new Date().toISOString();

            if (!name || isNaN(purchaseValue) || purchaseValue <= 0) {
              result.errors.push({ row: i + 2, message: "Nome e valor da viagem são obrigatórios" });
              result.skipped++;
              setImportProgress(prev => ({ ...prev, current: i + 1 }));
              continue;
            }

            // Find or create customer
            let customerId: string | null = null;
            if (cpf) {
              const { data: found } = await supabase.from("customers").select("id, points_balance, money_balance").eq("brand_id", brandId).eq("cpf", cpf).limit(1);
              if (found?.[0]) customerId = found[0].id;
            }
            if (!customerId && phone) {
              const { data: found } = await supabase.from("customers").select("id, points_balance, money_balance").eq("brand_id", brandId).eq("phone", phone).limit(1);
              if (found?.[0]) customerId = found[0].id;
            }
            if (!customerId && email) {
              const { data: found } = await supabase.from("customers").select("id, points_balance, money_balance").eq("brand_id", brandId).eq("email", email).limit(1);
              if (found?.[0]) customerId = found[0].id;
            }

            let currentPointsBalance = 0;
            let currentMoneyBalance = 0;

            if (!customerId) {
              // Create customer
              const { data: newCust, error: custErr } = await supabase.from("customers").insert({
                name, cpf, phone, email: email || null,
                brand_id: brandId, branch_id: branchId,
                is_active: true, points_balance: 0, money_balance: 0,
              }).select("id").single();
              if (custErr) throw new Error(`Erro ao criar cliente "${name}": ${custErr.message}`);
              customerId = newCust.id;
            } else {
              // Fetch current balance
              const { data: custData } = await supabase.from("customers").select("points_balance, money_balance").eq("id", customerId).single();
              currentPointsBalance = custData?.points_balance || 0;
              currentMoneyBalance = custData?.money_balance || 0;
            }

            // Calculate points
            let points = Math.floor(purchaseValue * pointsPerReal);
            points = Math.min(points, maxPointsPerPurchase);
            const money = points * moneyPerPoint;

            // Insert earning_event
            const { data: earningData, error: earningErr } = await supabase.from("earning_events").insert({
              brand_id: brandId, branch_id: branchId, store_id: branchId,
              customer_id: customerId, purchase_value: purchaseValue,
              points_earned: points, money_earned: money,
              source: "IMPORT" as any, status: "APPROVED" as any,
              created_by_user_id: user.id, created_at: eventDate,
              rule_snapshot_json: { points_per_real: pointsPerReal, money_per_point: moneyPerPoint, max_points_per_purchase: maxPointsPerPurchase } as any,
            }).select("id").single();
            if (earningErr) throw new Error(`Erro ao criar evento: ${earningErr.message}`);

            // Insert ledger entry
            await supabase.from("points_ledger").insert({
              brand_id: brandId, branch_id: branchId, customer_id: customerId,
              entry_type: "CREDIT" as any, points_amount: points, money_amount: money,
              reason: `Importação CSV – R$ ${purchaseValue.toFixed(2)}`,
              reference_type: "EARNING" as any, reference_id: earningData.id,
              created_by_user_id: user.id,
            });

            // Update customer balance
            await supabase.from("customers").update({
              points_balance: currentPointsBalance + points,
              money_balance: currentMoneyBalance + money,
            }).eq("id", customerId);

            result.success++;
          } catch (err: any) { result.errors.push({ row: i + 2, message: err.message }); }
          setImportProgress(prev => ({ ...prev, current: i + 1 }));
        }
      } else {
        // CRM_CONTACTS — batch insert
        for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
          const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
          const effectiveBranchId = branchId || null;

          // If branch selected, batch-create customers first
          let customerIds: (string | null)[] = batch.map(() => null);
          if (effectiveBranchId) {
            const custPayloads = batch.map(row => {
              const rideCount = row.ride_count ? parseInt(row.ride_count, 10) || 0 : 0;
              const tier = rideCount >= 501 ? "GALATICO" : rideCount >= 101 ? "LENDARIO" : rideCount >= 51 ? "DIAMANTE" : rideCount >= 31 ? "OURO" : rideCount >= 11 ? "PRATA" : rideCount >= 1 ? "BRONZE" : "INICIANTE";
              return {
                name: row.name.trim(), phone: row.phone?.trim() || null, cpf: row.cpf?.trim() || null,
                brand_id: brandId, branch_id: effectiveBranchId,
                is_active: row.is_active ? parseBool(row.is_active) : true,
                ride_count: rideCount,
                customer_tier: tier,
                crm_sync_status: "SYNCED",
              };
            });
            const { data: custInserted } = await supabase.from("customers").insert(custPayloads as any).select("id");
            if (custInserted) customerIds = custInserted.map(c => c.id);
          }

          const contactPayloads = batch.map((row, j) => {
            const tags = row.tags?.trim() ? row.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
            return {
              brand_id: brandId, branch_id: effectiveBranchId, customer_id: customerIds[j],
              name: row.name.trim(), phone: row.phone?.trim() || null, email: row.email?.trim() || null,
              cpf: row.cpf?.trim() || null, gender: row.gender?.trim() || null,
              os_platform: row.os_platform?.trim() || null,
              ride_count: row.ride_count ? parseInt(row.ride_count, 10) || 0 : 0,
              first_ride_at: parseBrDate(row.first_ride_at || ""),
              last_ride_at: parseBrDate(row.last_ride_at || ""),
              source: row.source?.trim() || "CSV_IMPORT", tags_json: tags,
              is_active: row.is_active ? parseBool(row.is_active) : true,
            };
          });

          const { error } = await supabase.from("crm_contacts").insert(contactPayloads);
          if (error) {
            // Batch failed — retry one-by-one
            let batchOk = 0;
            for (let k = 0; k < contactPayloads.length; k++) {
              const { error: singleErr } = await supabase.from("crm_contacts").insert(contactPayloads[k]);
              if (singleErr) {
                result.errors.push({ row: batchStart + k + 2, message: singleErr.message });
              } else {
                batchOk++;
              }
            }
            result.success += batchOk;
            result.skipped += (contactPayloads.length - batchOk);
          } else {
            result.success += batch.length;
          }

          // Back-link: update customers with crm_contact_id
          const validCustomerIds = customerIds.filter(Boolean);
          if (validCustomerIds.length > 0) {
            const { data: insertedContacts } = await supabase
              .from("crm_contacts")
              .select("id, customer_id")
              .in("customer_id", validCustomerIds);
            if (insertedContacts) {
              for (const contact of insertedContacts) {
                if (contact.customer_id) {
                  await (supabase as any).from("customers").update({
                    crm_contact_id: contact.id,
                    crm_sync_status: "SYNCED",
                  }).eq("id", contact.customer_id);
                }
              }
            }
          }
          setImportProgress({ current: Math.min(batchStart + BATCH_SIZE, rows.length), total: rows.length });
        }
      }

      if (job) {
        await supabase.from("import_jobs").update({
          status: result.errors.length > 0 ? "FAILED" : "DONE",
          finished_at: new Date().toISOString(),
          summary_json: { total: rows.length, success: result.success, errors: result.errors.length },
          error_rows_json: result.errors,
        }).eq("id", job.id);
      }

      await supabase.from("audit_logs").insert({
        actor_user_id: user.id, action: "CSV_IMPORT",
        entity_type: importType === "STORES" ? "stores" : importType === "OFFERS" ? "offers" : importType === "CUSTOMERS" ? "customers" : importType === "COUPONS" ? "coupons" : importType === "EARNING_EVENTS" ? "earning_events" : "crm_contacts",
        details_json: { brand_id: brandId, branch_id: branchId, type: importType, success: result.success, errors: result.errors.length },
      });

      return result;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["stores"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["crm-contacts"] });
      qc.invalidateQueries({ queryKey: ["coupons"] });
      if (result.errors.length === 0) toast.success(`${result.success} registros importados com sucesso!`);
      else toast.warning(`${result.success} importados, ${result.errors.length} erros.`);
    },
    onError: (e: Error) => { toast.error(e.message); setStep("preview"); },
  });

  const reset = () => {
    setStep("config");
    setCsvData(null);
    setColumnMapping({});
    setMappedRows([]);
    setValidationErrors([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const mappedPreviewFields = targetFields.filter(f => columnMapping[f.key]);
  const previewRows = mappedRows.slice(0, 20);
  const errorRowNumbers = new Set(validationErrors.map(e => e.row));

  const TYPE_LABELS: Record<string, string> = {
    STORES: "Lojas", OFFERS: "Ofertas", CUSTOMERS: "Clientes", CRM_CONTACTS: "Contatos CRM", COUPONS: "Cupons", EARNING_EVENTS: "Pontuação Manual",
  };

  // ── Import history query ──
  const { data: importHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["import-jobs-history", brandId],
    queryFn: async () => {
      let q = supabase
        .from("import_jobs")
        .select("id, brand_id, branch_id, type, status, created_at, finished_at, summary_json, created_by")
        .order("created_at", { ascending: false })
        .limit(50);
      if (brandId && !isRootAdmin) q = q.eq("brand_id", brandId);
      const { data } = await q;
      return data || [];
    },
  });

  // Load brand names for history display (root admin sees all brands)
  const brandIdsInHistory = [...new Set((importHistory || []).map(j => j.brand_id))];
  const { data: brandNamesMap } = useQuery({
    queryKey: ["brand-names-for-history", brandIdsInHistory.join(",")],
    queryFn: async () => {
      if (brandIdsInHistory.length === 0) return {};
      const { data } = await supabase.from("brands").select("id, name").in("id", brandIdsInHistory);
      const map: Record<string, string> = {};
      (data || []).forEach(b => { map[b.id] = b.name; });
      return map;
    },
    enabled: brandIdsInHistory.length > 0,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Importar CSV
        </h2>
        <p className="text-muted-foreground">Onboarding rápido de lojas e ofertas via arquivo CSV.</p>
      </div>

      {/* Step: Config */}
      {step === "config" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>Defina o tipo de importação, marca e filial, depois envie o CSV.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={importType} onValueChange={v => setImportType(v as ImportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STORES">Lojas</SelectItem>
                    <SelectItem value="OFFERS">Ofertas</SelectItem>
                    <SelectItem value="CUSTOMERS">Clientes</SelectItem>
                    <SelectItem value="CRM_CONTACTS">Contatos CRM</SelectItem>
                    <SelectItem value="COUPONS">Cupons / Vouchers</SelectItem>
                    <SelectItem value="EARNING_EVENTS">Pontuação Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isRootAdmin && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={brandId} onValueChange={v => { setBrandId(v); setBranchId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Branch (Filial)</Label>
                <Select value={branchId} onValueChange={setBranchId} disabled={!brandId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {importType === "OFFERS" && (
              <div className="flex items-center gap-2">
                <Checkbox id="auto-create" checked={autoCreateStores} onCheckedChange={v => setAutoCreateStores(!!v)} />
                <Label htmlFor="auto-create">Criar lojas automaticamente se não existirem</Label>
              </div>
            )}
            {importType === "COUPONS" && (
              <Alert>
                <AlertDescription>Códigos duplicados (no CSV ou já existentes) serão rejeitados. O campo "Campanha" vincula automaticamente à oferta pelo título.</AlertDescription>
              </Alert>
            )}

            {(importType === "CUSTOMERS" || importType === "CRM_CONTACTS") && (
              <Alert>
                <AlertDescription>Os registros serão espelhados automaticamente: importar Clientes cria contatos CRM e vice-versa.</AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="space-y-2">
              <Label>Arquivo CSV</Label>
              <p className="text-xs text-muted-foreground">O sistema detectará automaticamente as colunas e permitirá que você atribua cada uma ao campo desejado.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={!brandId || !branchId}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => {
                const cols = targetFields.map(f => f.key);
                const blob = new Blob([cols.join(";") + "\n"], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `template-${importType.toLowerCase()}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-3 w-3 mr-1" />Baixar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Column Mapping */}
      {step === "mapping" && csvData && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{csvData.rows.length} linhas detectadas</Badge>
              <Badge variant="outline">{csvData.headers.length} colunas</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button onClick={handleMappingConfirm} className="gap-2">
                Confirmar Mapeamento <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-5 w-5" />
                Mapeamento de Colunas
              </CardTitle>
              <CardDescription>
                Atribua cada coluna do CSV ao campo correspondente. Campos com <span className="text-destructive font-medium">*</span> são obrigatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {targetFields.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-44 shrink-0">
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={columnMapping[field.key] || "__none__"}
                    onValueChange={v => updateMapping(field.key, v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Não mapeado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Não mapear —</SelectItem>
                      {csvData.headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {/* Sample data preview */}
              {csvData.rows.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Amostra dos dados (3 primeiras linhas)</p>
                  <ScrollArea className="max-h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvData.headers.map(h => <TableHead key={h} className="text-xs">{h}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.rows.slice(0, 3).map((row, i) => (
                          <TableRow key={i}>
                            {csvData.headers.map(h => (
                              <TableCell key={h} className="text-xs max-w-[150px] truncate">{row[h] || "—"}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Preview */}
      {step === "preview" && csvData && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{mappedRows.length} linhas</Badge>
              {validationErrors.length === 0 ? (
                <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Sem erros</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{validationErrors.length} erro(s)</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>Voltar</Button>
              <Button onClick={() => importMutation.mutate()} disabled={validationErrors.length > 0}>
                <Upload className="h-4 w-4 mr-2" />Importar ({mappedRows.length} linhas)
              </Button>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc ml-4 space-y-0.5 text-sm">
                  {validationErrors.slice(0, 10).map((e, i) => (
                    <li key={i}>Linha {e.row}, campo <strong>{e.field}</strong>: {e.message}</li>
                  ))}
                  {validationErrors.length > 10 && <li>...e mais {validationErrors.length - 10} erros</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Preview (primeiras {Math.min(20, mappedRows.length)} linhas)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {mappedPreviewFields.map(f => <TableHead key={f.key}>{f.label}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i} className={errorRowNumbers.has(i + 2) ? "bg-destructive/10" : ""}>
                        <TableCell className="text-xs text-muted-foreground">{i + 2}</TableCell>
                        {mappedPreviewFields.map(f => (
                          <TableCell key={f.key} className="text-sm max-w-[200px] truncate">{row[f.key] || "—"}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">
              Importando {importProgress.current} de {importProgress.total} registros...
            </p>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Não feche esta página.</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors.length === 0 ? (
                <><CheckCircle2 className="h-5 w-5 text-green-600" />Importação Concluída</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-yellow-600" />Importação com Erros</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-muted-foreground">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">Ignorados</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold text-destructive">{importResult.errors.length}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Erros por Linha</Label>
                <ScrollArea className="max-h-[200px] rounded border p-3">
                  <ul className="space-y-1 text-sm">
                    {importResult.errors.map((e, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <span><strong>Linha {e.row}:</strong> {e.message}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <Button onClick={reset} className="w-full">Nova Importação</Button>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Histórico de Importações
          </CardTitle>
          <CardDescription>Últimas 50 importações realizadas.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !importHistory || importHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma importação registrada.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    {isRootAdmin && <TableHead>Marca</TableHead>}
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map(job => {
                    const summary = job.summary_json as { total?: number; success?: number; errors?: number } | null;
                    const statusColor = job.status === "DONE" ? "default" : job.status === "FAILED" ? "destructive" : "secondary";
                    const statusLabel = job.status === "DONE" ? "Concluído" : job.status === "FAILED" ? "Com erros" : job.status === "IMPORTING" ? "Em andamento" : job.status;
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date(job.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </TableCell>
                        {isRootAdmin && (
                          <TableCell className="text-sm">{brandNamesMap?.[job.brand_id] || "—"}</TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{TYPE_LABELS[job.type] || job.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor} className="text-xs">{statusLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{summary?.total ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600">{summary?.success ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-destructive">{summary?.errors ?? 0}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
