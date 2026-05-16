# Pacote do Campeonato — pra aplicar no `projeto-piloto`

Este zip contém **todo o código fonte do módulo Campeonato + dependências** extraídas do projeto `fidelidadevaleresgate`, prontos pra colar no novo projeto `ubizcarbrasil/projeto-piloto`.

> Para o plano completo de arquitetura (Supabase, RLS, RPCs, edge functions, fluxo end-to-end), veja `PLANO-EXTRACAO-CAMPEONATO.md` (arquivo separado já enviado).

---

## Estrutura do pacote

```
projeto-piloto-pacote/
├── LEIA-PRIMEIRO.md                # Este arquivo
├── index.html                      # Bootstrap loader + preconnect (PR #15)
├── vite.config.ts                  # manualChunks granular + PWA
│
├── src/
│   ├── tema-campeonato.css         # Visual Brasileirão (colar dentro de src/index.css)
│   │
│   ├── features/campeonato/        # ⭐ MÓDULO COMPLETO (183 arquivos)
│   │   ├── pages/                  # Páginas empreendedor + motorista
│   │   ├── components/             # Componentes UI
│   │   ├── hooks/                  # React Query hooks
│   │   ├── services/               # Wrappers de RPCs Supabase
│   │   ├── types/                  # Tipos TS
│   │   ├── utils/                  # Helpers
│   │   ├── constants/              # Cores/rótulos/fases
│   │   ├── schemas/                # Zod schemas
│   │   └── __tests__/              # Testes Vitest
│   │
│   ├── contexts/
│   │   └── DriverSessionContext.tsx    # CPF session via localStorage
│   │
│   ├── components/driver/
│   │   └── DriverCpfLogin.tsx          # Tela de login do motorista
│   │
│   ├── compartilhados/
│   │   ├── components/                 # tela_carregamento + input_numero
│   │   ├── constants/                  # constantes_features
│   │   └── hooks/                      # hook_duelo_campeonato_habilitado + formatos
│   │
│   ├── hooks/
│   │   └── use-mobile.tsx              # Detecção mobile
│   │
│   ├── lib/
│   │   ├── lazyWithRetry.ts            # Retry de chunks lazy (PR #15)
│   │   ├── pwaRecovery.ts              # Recovery loop com cooldown (PR #8/9)
│   │   ├── errorTracker.ts             # Sentry wrapper
│   │   ├── auditLogger.ts              # Audit logger
│   │   ├── queryClient.ts              # React Query defaults
│   │   ├── routeDiagnostics.ts         # Diagnóstico rotas
│   │   └── utils.ts                    # cn() helper
│   │
│   └── integrations/supabase/
│       └── client.ts                   # ⚠️ AJUSTAR pra ler env vars (ver seção 4)
│
└── supabase/
    ├── functions/
    │   ├── _shared/                    # Helpers compartilhados (auth, cors)
    │   ├── machine-webhook/            # ⭐ Recebe corridas externas (1200 LOC)
    │   ├── driver-upload-photo/        # Upload de foto do motorista
    │   ├── duelo-cron-advance/         # Cron pra avançar fases
    │   └── duelo-cron-reconcile/       # Cron de auditoria de standings
    │
    └── migrations-referencia/          # ⚠️ 110 migrations históricas (NÃO aplicar em sequência)
        └── ...                         # Use como REFERÊNCIA pra criar schema consolidado
```

---

## Sequência de aplicação (passos práticos)

### 1️⃣ Subir o pacote no `projeto-piloto`

Descompacta o zip e cola TUDO na raiz do repo `projeto-piloto`. Vai sobrescrever `vite.config.ts` e `index.html` (intencional — eles têm fixes críticos).

```bash
cd projeto-piloto/
unzip ~/Downloads/projeto-piloto-pacote.zip
# Confirma estrutura
ls src/features/campeonato/  # deve ter pages, components, hooks, etc.
```

### 2️⃣ Instalar dependências NPM

Adicionar ao `package.json` do `projeto-piloto`:

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@sentry/react": "^10.47.0",
    "@supabase/supabase-js": "^2.98.0",
    "@tanstack/react-query": "^5.62.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "framer-motion": "^12.34.3",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-router-dom": "^6.30.1",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vite-plugin-pwa": "^1.2.0",
    "web-vitals": "^5.2.0",
    "zod": "^3.25.76"
  }
}
```

Depois: `npm install`

### 3️⃣ Adicionar shadcn/ui components

Os componentes Radix estão instalados, mas você precisa dos wrappers shadcn em `src/components/ui/`. O `projeto-piloto` (template Lovable) já vem com a maioria. Se faltar algum, rode:

```bash
npx shadcn@latest add accordion alert-dialog badge button card checkbox collapsible dialog dropdown-menu input label popover progress radio-group scroll-area select sheet skeleton slider switch table tabs textarea tooltip
```

### 4️⃣ Configurar Supabase client

Edite `src/integrations/supabase/client.ts` pra ler env vars (em vez de URL hardcoded):

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Faltam VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY no .env");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
```

E no Lovable, configure as env vars do seu Supabase próprio.

### 5️⃣ Aplicar o tema CSS

Cole o conteúdo de `src/tema-campeonato.css` no final de `src/index.css` (depois dos imports do Tailwind).

### 6️⃣ Criar o schema do banco (Supabase)

**NÃO** rode as migrations da pasta `migrations-referencia/` em sequência — elas têm 110 arquivos com renomeações e fixes históricos do projeto antigo, e dependem de tabelas que não existem aqui (CRM, loyalty, etc.).

Em vez disso:

1. Abra o **Plano** (`PLANO-EXTRACAO-CAMPEONATO.md`), seção **Passo 2** — lá tem o schema consolidado pronto.
2. Aplique passo a passo: tabelas base → motoristas → integração → campeonato → RLS → triggers → RPCs → bucket.
3. Use `migrations-referencia/` apenas pra consultar:
   - Como uma RPC específica foi escrita
   - Qual a definição final de uma coluna
   - Como uma policy RLS está estruturada

**Dica:** abra os arquivos mais recentes primeiro (eles refletem o estado atual):
```bash
ls -t supabase/migrations-referencia/ | head -10
```

### 7️⃣ Adaptar imports

Faça um find/replace global no `src/features/campeonato/`:

```bash
# Atualizar paths internos do módulo
find src/features/campeonato -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's|@/products/campeonato|@/features/campeonato|g' {} +
```

Confirma que ficou OK:
```bash
grep -r "@/products/campeonato" src/  # NÃO deve retornar nada
```

### 8️⃣ Deployar edge functions

```bash
supabase login
supabase link --project-ref <seu-project-ref>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<sua-service-role>
supabase functions deploy machine-webhook
supabase functions deploy driver-upload-photo
supabase functions deploy duelo-cron-advance
supabase functions deploy duelo-cron-reconcile
```

⚠️ A pasta `_shared/` é importada por essas functions — não esqueça de subir junto.

### 9️⃣ Adaptações finais nas edge functions

A `machine-webhook` (1200 LOC) tem lógica de cliente/passageiro do projeto antigo. **Remover** as seções:
- Bloco de `credit_customer_points` (não tem cliente neste projeto)
- Qualquer referência a `customer_id` que não seja `driver_customer_id`

Procure por comentários `// CLIENTE:` ou `// LOYALTY:` no código pra identificar trechos a remover.

### 🔟 Gerar types do Supabase

Depois de aplicar o schema:

```bash
supabase gen types typescript --project-id <seu-project-ref> > src/integrations/supabase/types.ts
```

Roda esse comando sempre que mudar schema.

---

## Checklist final

- [ ] Pacote descompactado em `projeto-piloto/`
- [ ] `npm install` executado sem erros
- [ ] shadcn components adicionados
- [ ] `client.ts` lê env vars
- [ ] CSS `tema-campeonato` colado no `index.css`
- [ ] Schema aplicado no Supabase (via Plano, não as migrations-referencia)
- [ ] Imports `@/products/` → `@/features/` substituídos
- [ ] Edge functions deployadas
- [ ] `machine-webhook` limpa de lógica cliente/loyalty
- [ ] `types.ts` gerado
- [ ] `npm run build` passa sem erros
- [ ] `npx tsc --noEmit` zero erros
- [ ] App abre, login admin funciona
- [ ] Login motorista (CPF) funciona
- [ ] cURL no webhook → corrida aparece no placar

---

## Bug fixes já incluídos no código

Estas correções do projeto pai já vêm aplicadas — você herda elas grátis:

| PR | Arquivo | O que corrige |
|---|---|---|
| #12 | `services/servico_campeonato_empreendedor.ts` | Retry em RPCs do campeonato |
| #14 | `pagina_campeonato_empreendedor.tsx` | Pre-check exclui `finished` + mensagem informativa |
| #15 | `index.html`, `lib/lazyWithRetry.ts`, `lib/pwaRecovery.ts` | Retry import + sem reload pós-mount + audit/error deferred |
| #16 | `components/empreendedor/ListaTemporadasAnteriores.tsx` | Histórico filtra por branch + botão cancelar em zumbis |

---

## Suporte

Se travar em algum passo, copie o erro completo + qual passo você está e pergunte ao Claude no `projeto-piloto`. Ele tem o módulo todo na mão pra navegar e fixar.

Bom build! 🚀
