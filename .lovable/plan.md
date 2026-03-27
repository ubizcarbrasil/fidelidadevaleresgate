

# Auditoria Completa do Projeto — Plano de Execução

## Contexto

O projeto é uma plataforma SaaS white-label de fidelidade (Domo de Ferro / Vale Resgate) com ~100+ páginas, ~25 edge functions, hierarquia de 6 níveis de acesso (Root → Tenant → Brand → Branch → Operator → Store), sistema de pontuação via webhooks de mobilidade, CRM integrado, e motor de módulos governado por plano de assinatura.

Após explorar extensivamente o código-fonte (~120 arquivos analisados), apresento os achados organizados no formato solicitado.

---

## 1. RESUMO EXECUTIVO

**Estado geral:** O projeto está em nível avançado de maturidade com arquitetura sólida para multi-tenancy. O isolamento de dados por `brand_id` é consistente na grande maioria das queries. O motor de módulos, provisionamento e boot sequence são bem implementados.

**Nível de prontidão:** ~80% pronto para produção. Existem riscos moderados que devem ser endereçados antes do go-live.

**Nota geral:** 7.5/10

**Principais riscos:**
- Dashboard com arquivo monolítico de 896 linhas (fragilidade e performance)
- Console logs mostram INP de 624ms (classificado como "poor")
- DialogContent sem DialogTitle (acessibilidade, warnings persistentes)
- Gráficos com dimensões negativas (-1px) em containers modais
- Provisionamento usa `getClaims()` que pode não existir em todas as versões do SDK
- Algumas páginas grandes sem componentização adequada (StoresPage 405 linhas, CustomersPage 448 linhas)

---

## 2. PROBLEMAS ENCONTRADOS

### A. ROTAS E NAVEGAÇÃO
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| `/driver` interceptado no `AppContent` antes das Routes, renderiza sem Suspense wrapper de rotas | Pode causar inconsistência de navegação | Baixa |
| `publicPaths` não inclui `/p/` (custom pages) — pode mostrar loading desnecessário | UX degradada em páginas públicas | Média |
| `/driver-config` usa apenas `ErrorBoundary` sem ModuleGuard nem RootGuard | Qualquer usuário autenticado pode acessar | Alta |
| Rota `/clone-branch` sem guard de permissão | Risco de acesso indevido | Alta |
| Rota `/home-templates` sem guard | Deveria ter ModuleGuard ou RootGuard | Média |
| Rota `/page-builder` (v1) sem ModuleGuard | Inconsistente com v2 que tem guard | Média |
| Rota `/public-vouchers` dentro do layout protegido — deveria ser pública? | Possível conflito de acesso | Baixa |

### B. COMPONENTES E INTERFACE
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| `DialogContent` sem `DialogTitle` — erro de acessibilidade em console | Compliance a11y | Média |
| Gráficos Recharts com width/height -1px em modais/tabs | Charts não renderizam corretamente | Média |
| Dashboard.tsx com 896 linhas — monolítico, difícil manter | Manutenibilidade | Média |
| StoresPage.tsx (405 linhas), CustomersPage.tsx (448 linhas) — violam regra de componentização | Padrão do workspace | Média |
| `BrandThemeEditor` é um componente massivo | Manutenibilidade | Baixa |
| INP 624ms (poor) — interações lentas detectadas | UX degradada | Alta |

### C. PERFORMANCE
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| INP 624ms (Interaction to Next Paint) | Interações perceptivelmente lentas | Alta |
| Dashboard registra 4 canais realtime que invalidam múltiplas queries simultaneamente | Cascata de re-renders | Média |
| `useMetric` faz queries `count: "exact", head: true` — OK, mas são ~8+ queries paralelas no Dashboard | Carga inicial pesada | Média |
| `provision-brand` com 857 linhas e 35 demo stores inseridas uma a uma (sem batch) | Timeout potencial em provisioning | Média |
| `useBrandModules` faz 2 queries encadeadas quando user é branch_admin (resolve brand_id da branch, depois carrega módulos) | Latência extra no boot | Baixa |
| `BrandContext` faz até 3 queries sequenciais no boot (resolve brand, fetch branches, restore branch) | Boot mais lento | Baixa |

### D. ERROS E ESTABILIDADE
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| `provision-brand` usa `anonClient.auth.getClaims()` — método não disponível em todas versões do Supabase JS SDK | Pode falhar silenciosamente | Alta |
| `fromTable` casting no Dashboard (`supabase.from as (t: string) => ...`) — bypassa tipagem | Erros em runtime não detectáveis em build | Média |
| `Node.prototype.removeChild/insertBefore` monkey-patching no `main.tsx` | Pode mascarar bugs reais de DOM | Baixa |
| `window.location.search` usado em `useMemo` sem dependência de URL — não recomputa em navegação SPA | Impersonação pode não atualizar | Média |

### E. MODELO SAAS MULTIEMPRESA
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| `useMetric` no Dashboard aplica `brand_id` filter corretamente via parâmetro ✅ | — | OK |
| Todas as queries de CRUD (Stores, Offers, Customers, Redemptions) filtram por `brand_id` via `useBrandGuard` ✅ | — | OK |
| `provision-brand` cria tenant, brand, branch, users, modules, demo stores atomicamente ✅ | — | OK |
| Provisioning seed modules com base no plano (free/basic) ✅ | — | OK |
| Tier points rules são seeded por brand/branch ✅ | — | OK |
| `customer_facing` governança para módulos do empreendedor ✅ | — | OK |
| **RISCO:** Profiles table tem `brand_id` e `tenant_id` — update feito apenas para admin user no provisioning, customer e store users não recebem brand_id no profile | Pode causar inconsistência em queries que dependem de profile.brand_id | Média |
| **RISCO:** `home_templates` route sem guard — brand admin pode ver templates de todas as marcas se não houver filtro RLS | Vazamento de dados potencial | Alta |
| **RISCO:** `brand_domains` check por subdomain no BrandContext — se dois brands tiverem mesmo subdomain em domínios diferentes, pode resolver o errado | Conflito de resolução de marca | Baixa |

### F. PERMISSÕES E SEGURANÇA
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| `/driver-config` sem guard de permissão | Qualquer autenticado acessa | Alta |
| `/clone-branch` sem guard | Deveria ser RootGuard | Alta |
| `/home-templates` sem guard | Possível vazamento cross-brand | Alta |
| `/page-builder` (v1) sem guard | Inconsistente | Média |
| Provisioning usa senha padrão "123456" para contas de teste | Risco se não documentado | Baixa |
| `has_role` RPC é SECURITY DEFINER — correto ✅ | — | OK |
| `get_own_customer_ids` SECURITY DEFINER — correto ✅ | — | OK |

### G. ARQUITETURA
| Problema | Impacto | Prioridade |
|----------|---------|------------|
| Projeto NÃO segue estrutura feature-based definida no workspace rules — pages em pasta plana, não em features/ | Diverge do padrão definido | Média |
| Nomenclatura em inglês na maioria dos arquivos (contra regra de português do workspace) | Inconsistência com regras | Baixa |
| Arquivos de página muito grandes sem componentização (Dashboard, StoresPage, CustomersPage) | Manutenibilidade | Média |
| Hooks em pasta global única em vez de por feature | Diverge do padrão | Baixa |

---

## 3. CORREÇÕES A SEREM APLICADAS (na implementação)

1. **Adicionar guards nas rotas desprotegidas:** `/driver-config`, `/clone-branch`, `/home-templates`, `/page-builder`
2. **Corrigir DialogContent sem DialogTitle** nos componentes que geram o warning
3. **Adicionar `/p/` e `/driver` ao `publicPaths`** no AppContent
4. **Corrigir container de gráficos** para evitar dimensões negativas

---

## 4. CORREÇÕES RECOMENDADAS (não aplicadas neste ciclo)

1. **Refatorar Dashboard.tsx** em componentes menores (KPI section, Charts section, Quick Links, Activity Feed)
2. **Refatorar StoresPage e CustomersPage** em componentes por responsabilidade
3. **Investigar e resolver INP 624ms** — provável re-render pesado em interações
4. **Substituir `getClaims()` no provision-brand** por verificação via `getUser()` do service role
5. **Batch inserts no provision-brand** para demo stores (reduzir de ~35 inserts sequenciais para 1-2 batches)
6. **Migrar arquitetura para feature-based** conforme regras do workspace (longo prazo)

---

## 5. ANÁLISE DE PERFORMANCE

**Gargalos encontrados:**
- INP 624ms — interações no Dashboard/modais são lentas (possivelmente re-renders de gráficos)
- Dashboard carrega ~10 queries paralelas + 4 canais realtime no mount
- Gráficos Recharts renderizando com dimensões inválidas em containers não visíveis

**Otimizações aplicáveis:**
- Lazy load de seções do Dashboard (já parcialmente feito com `lazyWithRetry`)
- Memoização adequada dos componentes de chart
- Defer realtime subscriptions até após render inicial
- Usar `Suspense` boundaries por seção do Dashboard

---

## 6. ANÁLISE SAAS MULTIEMPRESA

### O sistema ESTÁ preparado para novas empresas?
**SIM, com ressalvas.** O fluxo de provisioning é robusto e cria toda a estrutura necessária (tenant, brand, branch, domain, users, modules, tiers, home template, demo stores, affiliate deals).

### Isolamento por tenant
**ADEQUADO.** Todas as queries críticas (stores, offers, customers, redemptions, points) filtram por `brand_id`. O `useBrandGuard` hook centraliza essa lógica. RLS policies existem nas tabelas principais.

### Riscos identificados
1. **3 rotas sem guard** permitem que um brand_admin acesse funcionalidades que deveriam ser restritas
2. **`home_templates` e `page-builder` (v1)** podem expor dados cross-brand se não houver filtro RLS
3. **Profile `brand_id`** não é populado para todos os tipos de user no provisioning

### O que falta para ficar seguro
- Adicionar guards nas 4 rotas identificadas
- Validar que queries em `home-templates` e `page-builder` filtram por brand_id
- Audit de RLS policies nas tabelas `home_template_library`, `brand_sections`

### Novas empresas podem usar todas as funções?
**SIM.** O provisioning cria ~24 módulos base, seed de tiers, seed de categorias de afiliados, demo stores com ofertas e catálogo. O fluxo é idempotente (verifica existência antes de criar).

---

## 7. CHECKLIST FINAL

| Item | Status |
|------|--------|
| Rotas protegidas | ⚠️ ATENÇÃO — 4 rotas sem guard |
| Login/Logout | ✅ OK |
| Recuperação de sessão | ✅ OK |
| Boot sequence | ✅ OK — com timeout de segurança |
| Criação de empresa | ✅ OK — provisioning robusto |
| Isolamento entre tenants | ✅ OK — queries filtradas |
| Performance inicial (INP) | 🔴 CRÍTICO — 624ms |
| Módulos por empresa | ✅ OK |
| Permissões por perfil | ⚠️ ATENÇÃO — rotas sem guard |
| Componentização | ⚠️ ATENÇÃO — arquivos grandes |
| Acessibilidade | ⚠️ ATENÇÃO — DialogTitle ausente |
| Realtime | ✅ OK |
| Exportações | ✅ OK |
| Edge Functions | ✅ OK — logs saudáveis |
| White-label | ✅ OK |
| Sidebar por escopo | ✅ OK |
| Error Boundary | ✅ OK |

---

## 8. PLANO FINAL DE MELHORIAS

### Corrigir PRIMEIRO (antes do go-live)
1. Adicionar guards nas 4 rotas desprotegidas (`/driver-config`, `/clone-branch`, `/home-templates`, `/page-builder`)
2. Validar filtro brand_id em `home-templates` queries
3. Substituir `getClaims()` por `getUser()` no provision-brand

### Corrigir DEPOIS (pós go-live imediato)
4. Resolver DialogContent/DialogTitle warnings
5. Corrigir gráficos com dimensões negativas
6. Adicionar `/p/` ao publicPaths

### Otimizar DEPOIS
7. Refatorar Dashboard.tsx (quebrar em componentes)
8. Investigar e resolver INP 624ms
9. Batch inserts no provision-brand
10. Refatorar StoresPage e CustomersPage

### Melhorias futuras
11. Migrar para arquitetura feature-based
12. Padronizar nomenclatura em português
13. Adicionar testes unitários nas funções críticas
14. Implementar monitoramento de performance em produção

---

## VALIDAÇÃO FINAL

**1. O projeto está pronto para produção?**
Sim, com as 3 correções prioritárias aplicadas. A base é sólida.

**2. O projeto está realmente preparado para operar como SaaS multiempresa?**
Sim. O isolamento de dados é consistente, o provisioning é completo e os módulos são governados por plano.

**3. Hoje, uma nova empresa conseguiria entrar e usar tudo sem erro?**
Sim. O provisioning cria toda a infraestrutura necessária de forma idempotente.

**4. Os 10 pontos mais críticos:**
1. INP 624ms (performance de interações)
2. `/driver-config` sem guard de permissão
3. `/clone-branch` sem guard
4. `/home-templates` sem guard — possível vazamento cross-brand
5. `/page-builder` v1 sem guard
6. `getClaims()` potencialmente incompatível no provision-brand
7. Dashboard monolítico (896 linhas)
8. DialogContent sem DialogTitle (a11y)
9. Gráficos com dimensões inválidas
10. CustomersPage/StoresPage sem componentização adequada

**5. O que corrigir imediatamente antes do go live?**
- Guards nas 4 rotas desprotegidas
- Validar `getClaims()` ou substituir por `getUser()`
- Validar filtro brand_id na rota home-templates

