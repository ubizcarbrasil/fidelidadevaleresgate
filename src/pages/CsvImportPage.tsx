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
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

// ── CSV Parsing ──
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(";").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(";").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return row;
  });
  return { headers, rows };
}

// ── Validation ──
const STORE_REQUIRED = ["name"];
const STORE_COLUMNS = ["name", "slug", "logo_url", "category", "address", "whatsapp", "is_active"];

const OFFER_REQUIRED = ["title", "store_name"];
const OFFER_COLUMNS = ["store_name", "store_slug", "title", "image_url", "description", "value_rescue", "min_purchase", "start_at", "end_at", "allowed_weekdays", "allowed_hours", "max_daily_redemptions", "category", "status", "is_active"];

const CUSTOMER_REQUIRED = ["name"];
const CUSTOMER_COLUMNS = ["name", "phone", "cpf", "email", "points_balance", "money_balance", "is_active"];

const CRM_CONTACT_REQUIRED = ["name"];
const CRM_CONTACT_COLUMNS = ["name", "phone", "email", "cpf", "gender", "os_platform", "source", "tags", "is_active"];

const WEEKDAY_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

interface ValidationError { row: number; field: string; message: string; }

function validateStoreRow(row: Record<string, string>, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!row.name?.trim()) errors.push({ row: idx + 2, field: "name", message: "Nome é obrigatório" });
  if (row.is_active && !["true", "false", "1", "0", "sim", "não", "nao", "yes", "no", ""].includes(row.is_active.toLowerCase())) {
    errors.push({ row: idx + 2, field: "is_active", message: "Valor inválido (use true/false)" });
  }
  return errors;
}

function validateOfferRow(row: Record<string, string>, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!row.title?.trim()) errors.push({ row: idx + 2, field: "title", message: "Título é obrigatório" });
  if (!row.store_name?.trim() && !row.store_slug?.trim()) errors.push({ row: idx + 2, field: "store_name", message: "store_name ou store_slug é obrigatório" });
  if (row.value_rescue && isNaN(Number(row.value_rescue))) errors.push({ row: idx + 2, field: "value_rescue", message: "Deve ser numérico" });
  if (row.min_purchase && isNaN(Number(row.min_purchase))) errors.push({ row: idx + 2, field: "min_purchase", message: "Deve ser numérico" });
  if (row.max_daily_redemptions && isNaN(Number(row.max_daily_redemptions))) errors.push({ row: idx + 2, field: "max_daily_redemptions", message: "Deve ser numérico" });
  if (row.start_at && isNaN(Date.parse(row.start_at))) errors.push({ row: idx + 2, field: "start_at", message: "Data inválida" });
  if (row.end_at && isNaN(Date.parse(row.end_at))) errors.push({ row: idx + 2, field: "end_at", message: "Data inválida" });
  return errors;
}

function validateCustomerRow(row: Record<string, string>, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!row.name?.trim()) errors.push({ row: idx + 2, field: "name", message: "Nome é obrigatório" });
  if (row.points_balance && isNaN(Number(row.points_balance))) errors.push({ row: idx + 2, field: "points_balance", message: "Deve ser numérico" });
  if (row.money_balance && isNaN(Number(row.money_balance))) errors.push({ row: idx + 2, field: "money_balance", message: "Deve ser numérico" });
  if (row.is_active && !["true", "false", "1", "0", "sim", "não", "nao", "yes", "no", ""].includes(row.is_active.toLowerCase())) {
    errors.push({ row: idx + 2, field: "is_active", message: "Valor inválido (use true/false)" });
  }
  return errors;
}

function validateCrmContactRow(row: Record<string, string>, idx: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!row.name?.trim()) errors.push({ row: idx + 2, field: "name", message: "Nome é obrigatório" });
  if (row.is_active && !["true", "false", "1", "0", "sim", "não", "nao", "yes", "no", ""].includes(row.is_active.toLowerCase())) {
    errors.push({ row: idx + 2, field: "is_active", message: "Valor inválido (use true/false)" });
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

type ImportType = "STORES" | "OFFERS" | "CUSTOMERS" | "CRM_CONTACTS";
type Step = "config" | "preview" | "importing" | "done";

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
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
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

  const expectedColumns = importType === "STORES" ? STORE_COLUMNS : importType === "OFFERS" ? OFFER_COLUMNS : importType === "CUSTOMERS" ? CUSTOMER_COLUMNS : CRM_CONTACT_COLUMNS;

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

      // Validate
      const errors: ValidationError[] = [];
      const validator = importType === "STORES" ? validateStoreRow : importType === "OFFERS" ? validateOfferRow : importType === "CUSTOMERS" ? validateCustomerRow : validateCrmContactRow;
      parsed.rows.forEach((row, i) => errors.push(...validator(row, i)));
      setValidationErrors(errors);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  }, [importType]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvData || !user || !brandId) throw new Error("Dados insuficientes");
      if (importType !== "CRM_CONTACTS" && !branchId) throw new Error("Selecione uma filial");

      setStep("importing");
      const result = { success: 0, skipped: 0, errors: [] as { row: number; message: string }[] };

      // Create job
      const { data: job } = await supabase.from("import_jobs").insert({
        brand_id: brandId,
        branch_id: branchId,
        created_by: user.id,
        type: importType,
        status: "IMPORTING",
      }).select("id").single();

      if (importType === "STORES") {
        for (let i = 0; i < csvData.rows.length; i++) {
          const row = csvData.rows[i];
          try {
            const slug = row.slug?.trim() || slugify(row.name);
            const { error } = await supabase.from("stores").insert({
              name: row.name.trim(),
              slug,
              brand_id: brandId,
              branch_id: branchId,
              logo_url: row.logo_url?.trim() || null,
              category: row.category?.trim() || null,
              address: row.address?.trim() || null,
              whatsapp: row.whatsapp?.trim() || null,
              is_active: row.is_active ? parseBool(row.is_active) : true,
            });
            if (error) throw error;
            result.success++;
          } catch (err: any) {
            result.errors.push({ row: i + 2, message: err.message });
          }
        }
      } else if (importType === "OFFERS") {
        // OFFERS: need store lookup
        const { data: existingStores } = await supabase.from("stores").select("id, name, slug").eq("brand_id", brandId).eq("branch_id", branchId);
        const storeByName = new Map((existingStores || []).map(s => [s.name.toLowerCase(), s.id]));
        const storeBySlug = new Map((existingStores || []).map(s => [s.slug.toLowerCase(), s.id]));

        for (let i = 0; i < csvData.rows.length; i++) {
          const row = csvData.rows[i];
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

            if (!storeId) {
              result.errors.push({ row: i + 2, message: `Loja "${storeName || storeSlug}" não encontrada` });
              continue;
            }

            const { error } = await supabase.from("offers").insert({
              store_id: storeId,
              brand_id: brandId,
              branch_id: branchId,
              title: row.title.trim(),
              image_url: row.image_url?.trim() || null,
              description: row.description?.trim() || null,
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
          } catch (err: any) {
            result.errors.push({ row: i + 2, message: err.message });
          }
        }
      } else if (importType === "CUSTOMERS") {
        // CUSTOMERS → always mirror to crm_contacts
        for (let i = 0; i < csvData.rows.length; i++) {
          const row = csvData.rows[i];
          try {
            const { data: newCustomer, error } = await supabase.from("customers").insert({
              name: row.name.trim(),
              phone: row.phone?.trim() || null,
              cpf: row.cpf?.trim() || null,
              brand_id: brandId,
              branch_id: branchId,
              points_balance: row.points_balance ? Number(row.points_balance) : 0,
              money_balance: row.money_balance ? Number(row.money_balance) : 0,
              is_active: row.is_active ? parseBool(row.is_active) : true,
            }).select("id").single();
            if (error) throw error;

            // Always create CRM contact mirror
            if (newCustomer) {
              await supabase.from("crm_contacts").insert({
                brand_id: brandId,
                branch_id: branchId,
                customer_id: newCustomer.id,
                name: row.name.trim(),
                phone: row.phone?.trim() || null,
                email: row.email?.trim() || null,
                cpf: row.cpf?.trim() || null,
                source: "STORE_UPLOAD",
              });
            }
            result.success++;
          } catch (err: any) {
            result.errors.push({ row: i + 2, message: err.message });
          }
        }
      } else {
        // CRM_CONTACTS → always mirror to customers
        for (let i = 0; i < csvData.rows.length; i++) {
          const row = csvData.rows[i];
          try {
            const tags = row.tags?.trim() ? row.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
            const effectiveBranchId = branchId || null;

            // Create customer mirror first (branch_id required for customers)
            let customerId: string | null = null;
            if (effectiveBranchId) {
              const { data: newCustomer } = await supabase.from("customers").insert({
                name: row.name.trim(),
                phone: row.phone?.trim() || null,
                cpf: row.cpf?.trim() || null,
                brand_id: brandId,
                branch_id: effectiveBranchId,
                is_active: row.is_active ? parseBool(row.is_active) : true,
              }).select("id").single();
              customerId = newCustomer?.id || null;
            }

            const { error } = await supabase.from("crm_contacts").insert({
              brand_id: brandId,
              branch_id: effectiveBranchId,
              customer_id: customerId,
              name: row.name.trim(),
              phone: row.phone?.trim() || null,
              email: row.email?.trim() || null,
              cpf: row.cpf?.trim() || null,
              gender: row.gender?.trim() || null,
              os_platform: row.os_platform?.trim() || null,
              source: row.source?.trim() || "CSV_IMPORT",
              tags_json: tags,
              is_active: row.is_active ? parseBool(row.is_active) : true,
            });
            if (error) throw error;
            result.success++;
          } catch (err: any) {
            result.errors.push({ row: i + 2, message: err.message });
          }
        }
      }

      // Update job
      if (job) {
        await supabase.from("import_jobs").update({
          status: result.errors.length > 0 ? "FAILED" : "DONE",
          finished_at: new Date().toISOString(),
          summary_json: { total: csvData.rows.length, success: result.success, errors: result.errors.length },
          error_rows_json: result.errors,
        }).eq("id", job.id);
      }

      // Audit
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "CSV_IMPORT",
        entity_type: importType === "STORES" ? "stores" : importType === "OFFERS" ? "offers" : importType === "CUSTOMERS" ? "customers" : "crm_contacts",
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
      if (result.errors.length === 0) {
        toast.success(`${result.success} registros importados com sucesso!`);
      } else {
        toast.warning(`${result.success} importados, ${result.errors.length} erros.`);
      }
    },
    onError: (e: Error) => { toast.error(e.message); setStep("preview"); },
  });

  const reset = () => {
    setStep("config");
    setCsvData(null);
    setValidationErrors([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const previewRows = csvData?.rows.slice(0, 20) || [];
  const errorRowNumbers = new Set(validationErrors.map(e => e.row));

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
            <CardDescription>Defina o tipo de importação, brand e branch.</CardDescription>
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

            {(importType === "CUSTOMERS" || importType === "CRM_CONTACTS") && (
              <Alert>
                <AlertDescription>Os registros serão espelhados automaticamente: importar Clientes cria contatos CRM e vice-versa.</AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="space-y-2">
              <Label>Colunas esperadas</Label>
              <div className="flex flex-wrap gap-1.5">
                {expectedColumns.map(c => (
                  <Badge key={c} variant={(importType === "STORES" ? STORE_REQUIRED : importType === "OFFERS" ? OFFER_REQUIRED : importType === "CUSTOMERS" ? CUSTOMER_REQUIRED : CRM_CONTACT_REQUIRED).includes(c) ? "default" : "outline"}>
                    {c}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">Badges destacadas são obrigatórias. Separador: ponto e vírgula (;)</p>
                <Button variant="outline" size="sm" onClick={() => {
                  const cols = importType === "STORES" ? STORE_COLUMNS : importType === "OFFERS" ? OFFER_COLUMNS : CUSTOMER_COLUMNS;
                  const blob = new Blob([cols.join(";") + "\n"], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `template-${importType.toLowerCase()}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-3 w-3 mr-1" />Template
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Arquivo CSV</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={!brandId || !branchId}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === "preview" && csvData && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{csvData.rows.length} linhas</Badge>
              {validationErrors.length === 0 ? (
                <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Sem erros</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{validationErrors.length} erro(s)</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button onClick={() => importMutation.mutate()} disabled={validationErrors.length > 0}>
                <Upload className="h-4 w-4 mr-2" />Importar ({csvData.rows.length} linhas)
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
              <CardTitle>Preview (primeiras {Math.min(20, csvData.rows.length)} linhas)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {csvData.headers.map(h => <TableHead key={h}>{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i} className={errorRowNumbers.has(i + 2) ? "bg-destructive/10" : ""}>
                        <TableCell className="text-xs text-muted-foreground">{i + 2}</TableCell>
                        {csvData.headers.map(h => (
                          <TableCell key={h} className="text-sm max-w-[200px] truncate">{row[h] || "—"}</TableCell>
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
            <p className="text-lg font-medium">Importando registros...</p>
            <p className="text-sm text-muted-foreground">Não feche esta página.</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <>
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
        </>
      )}
    </div>
  );
}
