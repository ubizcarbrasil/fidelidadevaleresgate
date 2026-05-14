/**
 * Roda os SQL de seed/teardown contra o Supabase de teste.
 * Usa SERVICE_ROLE para bypassar RLS — exige variáveis de ambiente.
 *
 * Uso:
 *   npx tsx tests/e2e/helpers/seed-runner.ts seed
 *   npx tsx tests/e2e/helpers/seed-runner.ts teardown
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ACTION = process.argv[2] as "seed" | "teardown";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ACTION || !["seed", "teardown"].includes(ACTION)) {
  console.error("Uso: tsx seed-runner.ts <seed|teardown>");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
  process.exit(1);
}

const sqlPath = resolve(
  __dirname,
  "..",
  "fixtures",
  ACTION === "seed" ? "seed.sql" : "teardown.sql",
);
const sql = readFileSync(sqlPath, "utf-8");

async function run() {
  // Usa endpoint pg-meta via PostgREST RPC custom — alternativa: psql direto.
  // Para simplicidade e portabilidade em CI, exige psql disponível no PATH.
  const { spawnSync } = await import("node:child_process");
  const url = new URL(SUPABASE_URL!);
  const projectRef = url.hostname.split(".")[0];
  const dbHost = `db.${projectRef}.supabase.co`;
  const dbUrl = `postgresql://postgres.${projectRef}:${SERVICE_ROLE}@${dbHost}:5432/postgres`;

  // Preferência: usar PG* env vars se disponíveis (sandbox local)
  const useEnv = !!process.env.PGHOST;
  const args = useEnv
    ? ["-v", "ON_ERROR_STOP=1", "-f", sqlPath]
    : ["-v", "ON_ERROR_STOP=1", "-f", sqlPath, dbUrl];

  const result = spawnSync("psql", args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`psql falhou (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✅ ${ACTION} concluído.`);
}

run();