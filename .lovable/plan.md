## Objetivo

Adicionar testes E2E **Playwright** cobrindo as 7 abas do `/motorista/campeonato`, com seed real no Supabase de teste e execução local + GitHub Actions.

---

## Decisões aprovadas

- **Mock**: Seed real (motorista + temporada/duelos/séries) via SQL fixture
- **Escopo**: `/motorista/campeonato` — 7 abas (Drawer, Classificação, Duelos, Mata-mata, Artilharia, Próximos, Notícias, Configurações)
- **CI**: Local (`npm run e2e`) + workflow `.github/workflows/e2e.yml` (não-bloqueante na primeira leva)

---

## Arquivos a criar

```text
playwright.config.ts                          # config base + projeto mobile (430x761)
tests/e2e/
├── fixtures/
│   ├── seed.sql                              # cria brand/branch/season/series/duelos/customer
│   ├── teardown.sql                          # remove fixtures por prefixo "e2e_"
│   ├── auth.ts                               # helper que escreve driver_session_cpf_<brandId>
│   └── constants.ts                          # CPF, brandId, branchId fake (UUIDs determinísticos)
├── helpers/
│   ├── seed-runner.ts                        # roda SQL via psql ou supabase-js service role
│   └── driver-login.ts                       # context.addInitScript injetando localStorage
├── campeonato/
│   ├── 01-drawer-navigation.spec.ts          # ☰ abre, 7 itens, item ativo
│   ├── 02-classificacao.spec.ts              # zonas vermelha/azul, troca de série
│   ├── 03-duelos.spec.ts                     # cards Time A x Time B
│   ├── 04-mata-mata.spec.ts                  # bracket espelhado, 🏆
│   ├── 05-artilharia.spec.ts                 # 4 abas internas
│   ├── 06-proximos.spec.ts                   # BloqueioInscricaoSemFoto
│   ├── 07-noticias.spec.ts                   # feed renderiza
│   ├── 08-configuracoes.spec.ts              # toggles + T&C
│   └── 09-guardas.spec.ts                    # sem session → redireciona /auth
└── README.md                                 # como rodar local + secrets de CI

.github/workflows/e2e.yml                     # job ubuntu, npx playwright install, seed, run, teardown
```

## Arquivos a editar

- `package.json` — scripts `e2e`, `e2e:ui`, `e2e:seed`, `e2e:teardown` + devDeps `@playwright/test`
- `.gitignore` — `playwright-report/`, `test-results/`, `tests/e2e/.auth/`
- `tsconfig.json` — excluir `tests/e2e/**` do build do app

## Estratégia de seed (real Supabase)

Usa SUPABASE_SERVICE_ROLE_KEY (somente em CI/local, nunca commitada):

```text
e2e_brand          → 1 brand "E2E Brand" com brand_settings_json.campeonato_standalone_enabled=true
e2e_branch         → 1 branch vinculado
e2e_customer       → 1 customer com nome "[MOTORISTA] E2E Test" + CPF "00000000000"
e2e_season         → 1 campeonato_seasons ativo, fase=classification
e2e_series A/B     → 2 séries com 4 motoristas cada (3 dummies + e2e_customer)
e2e_duelos         → 2 duelos do dia: 1 vencido, 1 em andamento
e2e_artilharia     → 3 entradas top scorers
```

Todo registro com prefixo `e2e_` no name/slug → teardown remove pelo padrão.

## Estratégia de login do motorista

Não temos email/senha — DriverSessionContext lê CPF de `localStorage.driver_session_cpf_<brandId>`. O helper:

```ts
await context.addInitScript(({ brandId, cpf }) => {
  localStorage.setItem(`driver_session_cpf_${brandId}`, cpf);
}, { brandId: E2E_BRAND_ID, cpf: "00000000000" });
```

Antes de navegar, isso garante que o `loginByCpf` na re-hidratação encontre o driver.

## CI workflow

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
      PREVIEW_URL: ${{ secrets.E2E_PREVIEW_URL }}
    steps:
      - checkout, setup-node, bun install
      - npx playwright install --with-deps chromium
      - npm run e2e:seed
      - npm run e2e        # roda contra PREVIEW_URL
      - npm run e2e:teardown   # always()
      - upload playwright-report
```

> Secrets necessárias (você adiciona depois manualmente): `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_PREVIEW_URL`.

## O que NÃO está incluso nesta leva

- Login admin (Supabase Auth real) — fica para Etapa 2 do plano de E2E
- `/campeonato` standalone, `/dashboard/gamificacao-admin` — não selecionados
- Visual regression (screenshots diff)
- CI bloqueante — workflow será criado com `continue-on-error: true` até estabilizar

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Seed colide com dados reais | Prefixo `e2e_` + UUIDs determinísticos + teardown por prefixo |
| Service role exposta no repo | Apenas via env vars + GitHub Secrets, nunca commit |
| RLS bloqueia leitura do motorista seedado | Seed usa service role (bypassa RLS), leituras via UI passam pela RPC `lookup_driver_by_cpf` que é SECURITY DEFINER |
| Preview URL muda a cada deploy | `PREVIEW_URL` lido de secret; localmente usa `http://localhost:8080` via `webServer` do Playwright |

## Validação final

- `npm run e2e` local → 9 spec files passam em viewport 430×761
- `tsc --noEmit` continua verde
- Workflow do GitHub Actions executa sem erro de instalação
- Teardown limpa 100% das linhas com prefixo `e2e_`

## Commits sequenciais

1. `chore(e2e): instalar Playwright e scaffold de configuração`
2. `feat(e2e): seed/teardown de fixtures do Campeonato no Supabase`
3. `test(e2e): 9 specs cobrindo as 7 abas e guardas do /motorista/campeonato`
4. `ci(e2e): workflow GitHub Actions não-bloqueante`
