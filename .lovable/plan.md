

## Auditoria do Módulo Ganha-Ganha — O que pode estar faltando

Após revisar todo o código, **o plano original foi 100% implementado**. Porém, identifiquei lacunas funcionais que complementariam o módulo:

### 1. Fechamento Mensal ausente no Root Sidebar
O `RootSidebar` tem Dashboard, Config e Billing, mas **não tem o link para Fechamento Mensal** (`/ganha-ganha-closing`). Apenas o BrandSidebar tem.

### 2. Falta forçar `store_type = 'MISTA'` ao ativar o módulo
A `GanhaGanhaConfigPage` salva o config mas **não atualiza automaticamente** o `store_type` de todas as lojas da marca para `MISTA` ao ativar. O plano dizia: "Ao ativar o módulo: uma mutation atualiza todas as lojas da marca para `store_type = 'MISTA'`". Preciso verificar se isso foi implementado no save.

### 3. Exportação CSV no Painel Financeiro
O plano mencionava "Exportação CSV" no `GanhaGanhaBillingPage`. Preciso verificar se foi implementado.

### 4. Drill-down por loja no Painel Financeiro
O plano mencionava "drill-down mostrando cada evento" ao clicar numa loja. Verificar se existe.

---

### Mudanças propostas

| Ação | Arquivo |
|------|---------|
| Adicionar link "Fechamento Mensal" | `src/components/consoles/RootSidebar.tsx` |
| Verificar e implementar force `MISTA` | `src/pages/GanhaGanhaConfigPage.tsx` |
| Verificar/adicionar CSV export | `src/pages/GanhaGanhaBillingPage.tsx` |
| Verificar/adicionar drill-down | `src/pages/GanhaGanhaBillingPage.tsx` |

Vou verificar os arquivos completos e corrigir tudo que estiver faltando.

