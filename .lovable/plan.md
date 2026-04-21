

# Rota `/p/produto/:slug/demo` — já implementada ✅

Este escopo já foi entregue na implementação anterior ("Página dedicada de agendamento de demonstração + captação de leads B2B"). Não há nada para construir.

## O que já está no ar

**Rota pública** em `src/App.tsx` (linha 182), declarada **antes** de `/p/produto/:slug` para ter prioridade no matcher:

```
<Route path="/p/produto/:slug/demo" element={<PaginaAgendarDemonstracao />} />
<Route path="/p/produto/:slug" element={<PaginaLandingProduto />} />
```

**Layout em duas colunas** (`pagina_agendar_demonstracao.tsx`):
- Esquerda (`lg:col-span-3`): header + card com formulário
- Direita (`lg:col-span-2`): resumo do produto em `sticky top-20`
- Mobile: empilhado (`grid-cols-1`)

**Formulário B2B validado por Zod** (`schemas/schema_agendar_demo.ts`):
- `full_name` (3-120 chars, trim)
- `work_email` (email, lowercase, máx 180)
- `phone` (regex `[\d\s()+\-]+`, 10-20 chars)
- `company_name` (2-120 chars)
- `company_role` (opcional, máx 80)
- `company_size` (enum: 1-50 / 50-200 / 200-500 / 500-1000 / 1000+)
- `city` (opcional, máx 80)
- `current_solution` (enum: nenhuma / app_proprio / terceiro / planilha / outro)
- `interest_message` (opcional, máx 800)
- `preferred_contact` (enum: whatsapp / email / ligacao, default whatsapp)
- `preferred_window` (enum: manha / tarde / noite)

**Pipeline completo já funcionando:**
- `formulario_agendar_demo.tsx` → react-hook-form + zodResolver
- `hook_submeter_lead.ts` → useMutation + tratamento de erro
- `servico_leads.ts` → invoca edge function `submit-commercial-lead`
- Edge function valida no servidor (defesa em profundidade) e grava em `commercial_leads`
- `bloco_sucesso_demo.tsx` → tela de confirmação com próximos passos
- UTMs e `source` capturados via `useSearchParams` e gravados no lead

## URL ao vivo para testar

```
/p/produto/motorista-premium/demo
/p/produto/motorista-premium/demo?source=hero&utm_source=teste
```

## Único ponto pendente do plano original

Não foi construído ainda o **painel `/leads-comerciais`** para o time comercial gerenciar o pipeline (lista com filtros, KPIs, drawer de detalhes, mudança de status, botão WhatsApp, export CSV).

Se quiser, peça **"construir o painel /leads-comerciais"** que eu sigo com esse próximo passo.

