/**
 * Lint estático de migrations Supabase pra RLS.
 *
 * O QUE FAZ:
 *   Varre supabase/migrations/*.sql e detecta tabelas `public.*` que:
 *     1. Foram criadas mas nunca tiveram `ENABLE ROW LEVEL SECURITY` aplicado
 *     2. Tiveram RLS ativado mas NENHUMA migration cria CREATE POLICY pra ela
 *
 * LIMITAÇÕES (deliberadas):
 *   - Não detecta DROP POLICY sem CREATE substituta (precisa do pg_policies live)
 *   - Não valida que policies filtram por tenant_id (precisa parser SQL real)
 *   - É um SCREENING, não substitui o audit SQL contra a base live
 *     (ver supabase/audit/rls-audit.sql)
 *
 * USO:
 *   tsx scripts/lint-rls-migrations.ts
 *   Sai com código 1 se encontrar tabelas RLS-only-on sem policies.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";

// Tabelas conhecidas que NÃO precisam de policy (legítimo deny-all).
// Justificativa: contém dados que SOMENTE edge functions com service_role
// devem ler/escrever. Client (anon/authenticated) nunca toca direto.
// Documentar AQUI o motivo é obrigatório pra cada entrada.
const ALLOWLIST = new Set<string>([
  // Backup pré-normalização. Histórico imutável.
  "module_definitions_backup_pre_norm",
  // OTP server-side. Edge functions send-otp-code/verify-otp-code só.
  // Ler do client permitiria atacante validar OTP sem passar pela função.
  "otp_codes",
  // Rate limit de login motorista. Edge function driver-cpf-login só.
  // Expor cpf_hash ao client vazaria CPFs cadastrados por brand.
  "driver_login_attempts",
  "driver_login_ip_attempts",
]);

function loadMigrations(): { file: string; sql: string }[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((file) => ({
    file,
    sql: readFileSync(join(MIGRATIONS_DIR, file), "utf-8"),
  }));
}

function extractCreatedTables(sql: string): Set<string> {
  // Captura: CREATE TABLE [IF NOT EXISTS] [public.]<name>
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["]?([a-z_][a-z0-9_]*)["]?/gi;
  const out = new Set<string>();
  for (const m of sql.matchAll(re)) {
    out.add(m[1].toLowerCase());
  }
  return out;
}

function extractRlsEnabled(sql: string): Set<string> {
  // ALTER TABLE [public.]<name> ENABLE ROW LEVEL SECURITY
  const re = /alter\s+table\s+(?:public\.)?["]?([a-z_][a-z0-9_]*)["]?[^;]*enable\s+row\s+level\s+security/gi;
  const out = new Set<string>();
  for (const m of sql.matchAll(re)) {
    out.add(m[1].toLowerCase());
  }
  return out;
}

function extractPolicyTables(sql: string): Set<string> {
  // CREATE POLICY "..." ON [public.]<name>
  const re = /create\s+policy\s+[^\n]*\s+on\s+(?:public\.)?["]?([a-z_][a-z0-9_]*)["]?/gi;
  const out = new Set<string>();
  for (const m of sql.matchAll(re)) {
    out.add(m[1].toLowerCase());
  }
  return out;
}

function extractDroppedTables(sql: string): Set<string> {
  // DROP TABLE [IF EXISTS] [public.]<name>
  const re = /drop\s+table\s+(?:if\s+exists\s+)?(?:public\.)?["]?([a-z_][a-z0-9_]*)["]?/gi;
  const out = new Set<string>();
  for (const m of sql.matchAll(re)) {
    out.add(m[1].toLowerCase());
  }
  return out;
}

function main(): void {
  const migrations = loadMigrations();

  const allCreated = new Set<string>();
  const allDropped = new Set<string>();
  const allRlsEnabled = new Set<string>();
  const allWithPolicies = new Set<string>();

  for (const { sql } of migrations) {
    for (const t of extractCreatedTables(sql)) allCreated.add(t);
    for (const t of extractDroppedTables(sql)) allDropped.add(t);
    for (const t of extractRlsEnabled(sql)) allRlsEnabled.add(t);
    for (const t of extractPolicyTables(sql)) allWithPolicies.add(t);
  }

  // Tabelas atualmente existentes = criadas - dropadas
  const liveTables = new Set([...allCreated].filter((t) => !allDropped.has(t)));

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const table of liveTables) {
    if (ALLOWLIST.has(table)) continue;

    if (!allRlsEnabled.has(table)) {
      warnings.push(`[WARN] Tabela 'public.${table}' criada SEM 'ENABLE ROW LEVEL SECURITY'`);
      continue;
    }

    if (!allWithPolicies.has(table)) {
      errors.push(`[ERR ] Tabela 'public.${table}' tem RLS ativado mas NENHUMA policy registrada nas migrations`);
    }
  }

  console.log("─".repeat(70));
  console.log(`RLS Migration Lint — ${migrations.length} migrations escaneadas`);
  console.log(`  Tabelas vivas: ${liveTables.size}`);
  console.log(`  Com RLS:       ${[...allRlsEnabled].filter((t) => liveTables.has(t)).length}`);
  console.log(`  Com policies:  ${[...allWithPolicies].filter((t) => liveTables.has(t)).length}`);
  console.log("─".repeat(70));

  if (warnings.length > 0) {
    console.log("\nWARNINGS (tabelas sem RLS ativado — revisar se intencional):");
    for (const w of warnings) console.log("  " + w);
  }

  if (errors.length > 0) {
    console.log("\nERRORS (tabelas RLS-only-on sem policies — deny-all efetivo):");
    for (const e of errors) console.log("  " + e);
    console.log(
      "\nFix: adicione CREATE POLICY na migration que ENABLE-a o RLS, ou rode\n" +
      "supabase/audit/rls-audit.sql contra a base live pra ver o estado real.",
    );
    process.exit(1);
  }

  console.log("\nOK — nenhuma tabela RLS-only-on sem policies detectada.");
}

main();
