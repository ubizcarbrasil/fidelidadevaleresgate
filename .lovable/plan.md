## Diagnóstico — NÃO É VAZAMENTO ENTRE MARCAS

Investiguei o banco de dados diretamente. Boa notícia: **não há vazamento de dados entre empreendedores**. A cidade "São João - SP" está corretamente associada ao `brand_id` da Ubiz Shop no banco (não pertence ao Ubiz Resgata nem ao Ubiz Car). As políticas de RLS e o filtro por `brand_id` na página `/brand-branches` estão funcionando.

**Causa real:** o motor de provisionamento (`provision-trial`) **cria automaticamente uma cidade obrigatória** no momento do cadastro, usando os campos `city_name` + `state` que o empreendedor preenche no wizard. No caso da Ubiz Shop, alguém digitou "São João" + "SP" durante o cadastro inicial, e essa cidade ficou registrada.

```text
Wizard de Cadastro (TrialSignupPage)
   ├─ Nome da empresa: "Ubiz Shop"
   ├─ Cidade: "São João"   ← obrigatório hoje
   └─ Estado: "SP"
            │
            ▼
provision-trial (Edge Function)
   ├─ Cria tenant
   ├─ Cria brand
   ├─ Cria branch (cidade) ← criação automática indesejada
   └─ Cria brand_admin role
```

Confirmação no banco: a marca foi criada às `14:04:40.400` e a branch às `14:04:40.947` (0,5s depois) — assinatura clara de criação pelo mesmo motor.

## Correção em duas frentes

### Frente 1 — Limpeza imediata (Ubiz Shop)
Remover a cidade "São João - SP" (`c88979ba-...`) do brand Ubiz Shop, deixando o painel realmente virgem para o empreendedor configurar do zero. Verificar antes se há dados vinculados (clientes, ofertas, resgates) — se houver, apenas inativar a cidade em vez de excluir.

### Frente 2 — Correção estrutural no provisionamento
Tornar a cidade **opcional** durante o cadastro. O empreendedor cadastra apenas a empresa; a primeira cidade é criada por ele depois, na tela "Minhas Cidades". Isso atende ao requisito: *"Quando é criado um empreendedor tem que vir um painel virgem de tudo pois ele ainda vai fazer suas configurações"*.

**Mudanças técnicas:**

1. **`supabase/functions/provision-trial/index.ts`**
   - Remover a obrigatoriedade de `city_name` e `state` na validação (linha 252).
   - Tornar o bloco "Create Branch" (linhas 345-375) condicional: só cria branch se `city_name` E `state` foram informados.
   - Manter retrocompatibilidade: quem informar cidade continua tendo a branch criada.

2. **`src/pages/TrialSignupPage.tsx`** e **`src/pages/ProvisionBrandWizard.tsx`**
   - Remover os campos "Cidade" e "Estado" do wizard (ou movê-los para um passo opcional "pular").
   - Ajustar o resumo final do wizard para não exibir a cidade quando não informada.
   - Após o cadastro, redirecionar o empreendedor para `/brand-branches` com um banner do tipo *"Sua marca foi criada! Cadastre sua primeira cidade para começar."*

3. **Estado vazio em `/brand-branches`** (já existe, linha 86-91 de `BrandBranchesPage.tsx`)
   - Reforçar visualmente o estado "Nenhuma cidade cadastrada ainda" com um CTA destacado para "Criar primeira cidade".

### O que NÃO vai mudar
- Políticas de RLS — estão corretas.
- Filtro `eq("brand_id", currentBrandId)` em `BrandBranchesPage` — está correto.
- O hook `useBrandGuard` — está correto.

## Resumo do que o empreendedor verá depois

- Ubiz Shop entra no painel e vê "Nenhuma cidade cadastrada ainda" com botão grande "Criar primeira cidade".
- Próximos cadastros de novos empreendedores também começam com painel 100% virgem.
- A obrigatoriedade de cidade no wizard de cadastro é eliminada.
