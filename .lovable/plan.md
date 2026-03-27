
## Plano revisado: corrigir o que ainda ficou pendente

Revisei os arquivos e encontrei por que os problemas continuam.

### O que de fato está acontecendo

1. **Banner do Achadinho ainda “cortando”**
   - O ajuste de `mt-2` em `AchadinhoDealDetail.tsx` foi insuficiente.
   - O detalhe do Achadinho está sendo renderizado dentro de containers animados (`motion.div`) em páginas como `AchadinhoCategoryPage` e `DriverCategoryPage`.
   - Isso pode fazer elementos `fixed` se comportarem como se estivessem presos ao container pai, não à viewport inteira.
   - Resultado: o topo continua aparecendo errado no mobile e o overlay não ocupa a tela de forma confiável.

2. **Erro ao enviar denúncia do Achadinho**
   - A policy do backend **já está correta** agora: `offer_reports` aceita `INSERT` público.
   - O erro restante está no frontend: `ReportarOfertaDialog` envia `customerId` para a coluna `user_id`.
   - Só que `user_id` referencia o usuário de autenticação, e **`customer.id` não é `auth.user.id`**.
   - Isso pode gerar erro de integridade/foreign key mesmo com a policy liberada.

3. **Tela de Resgates ainda cortando a área dos pontos**
   - O cabeçalho de `CustomerRedemptionsPage.tsx` ainda está muito “colado” ao topo e usa um bloco full-width com raio só embaixo.
   - Em viewport mobile pequena, isso fica visualmente apertado e parece recortado.

4. **Menu lateral não está “recuando” como esperado**
   - Em `BrandSidebar.tsx`, a correção feita fecha o menu no mobile ao clicar no link.
   - Mas os grupos do menu continuam com `defaultOpen`, ou seja, cada grupo controla seu próprio estado e vários podem permanecer abertos.
   - Se o esperado é “abrir só o grupo clicado e recolher os outros”, isso ainda não foi implementado.

5. **Etiquetas amarelas ainda existem**
   - Em `DriverManagementPage.tsx` a lista principal ficou azul.
   - Mas no painel lateral do motorista ainda existe badge amarela em `AbaPontuacaoMotorista.tsx`:
     - `Badge variant="secondary"` no “Saldo atual”.
   - Então a mudança ficou parcial.

---

## Implementação proposta

### 1) Corrigir o overlay do detalhe do Achadinho
**Arquivos:**
- `src/components/customer/AchadinhoDealDetail.tsx`
- `src/components/customer/AchadinhoCategoryPage.tsx`
- `src/components/customer/AchadinhoSection.tsx`
- `src/components/driver/DriverCategoryPage.tsx`

**Ajuste:**
- Renderizar `AchadinhoDealDetail` fora dos containers animados, preferencialmente via portal para `document.body` ou subindo o estado para um nível mais alto.
- Manter o overlay realmente full-screen no mobile.
- Depois ajustar o espaçamento superior fino do banner, se ainda necessário.

### 2) Corrigir o envio da denúncia
**Arquivo:**
- `src/components/customer/ReportarOfertaDialog.tsx`

**Ajuste:**
- Parar de enviar `customerId` na coluna `user_id`.
- Opção segura:
  - buscar `auth.user.id` antes de inserir; ou
  - simplesmente não enviar `user_id` quando não houver usuário auth válido.
- Renomear a prop para algo sem ambiguidade, como `authUserId`, para evitar regressão futura.
- Aproveitar para adicionar `DialogDescription`, já que há warning de acessibilidade no console.

### 3) Reestruturar o topo da tela de Resgates
**Arquivo:**
- `src/pages/customer/CustomerRedemptionsPage.tsx`

**Ajuste:**
- Trocar o header atual por um bloco mais estável no mobile:
  - adicionar respiro superior real;
  - evitar cabeçalho “colado” na borda;
  - transformar a área de pontos em card separado logo abaixo do título, em vez de depender do container gradiente com recorte.
- Assim a área de pontos deixa de parecer cortada em telas menores.

### 4) Fazer o menu abrir só a seção clicada
**Arquivo:**
- `src/components/consoles/BrandSidebar.tsx`

**Ajuste:**
- Trocar `defaultOpen` dos grupos por estado controlado.
- Criar um `openGroupKey`.
- Ao abrir um grupo, fechar os outros.
- Manter também `setOpenMobile(false)` no clique dos links.

### 5) Finalizar a troca do amarelo para azul
**Arquivos:**
- `src/components/driver-management/tabs/AbaPontuacaoMotorista.tsx`
- revisar `src/components/driver-management/**/*.tsx`

**Ajuste:**
- Trocar o `Badge variant="secondary"` restante por classes azuis:
  - `bg-blue-500/10 text-blue-400 border border-blue-400/30`
- Fazer uma revisão rápida nas tabs do painel lateral para garantir que nenhuma badge de pontuação/tier ficou amarela.

---

## Resumo do que muda

| Problema | Correção real |
|---|---|
| Banner cortado | Tirar o detalhe do Achadinho de dentro de containers animados / usar portal |
| Erro ao denunciar | Corrigir payload: não enviar `customer.id` em `user_id` |
| Pontos cortados nos resgates | Reestruturar o header mobile da página |
| Menu não recua direito | Controlar um único grupo aberto no sidebar |
| Etiquetas amarelas | Completar troca para azul no painel lateral do motorista |

## Detalhe técnico importante
A correção do backend para `offer_reports` já está aplicada. O erro atual não parece mais ser RLS; o problema principal agora é o **frontend enviando o ID errado para `user_id`**.
