

# Diagnóstico: por que "Painel do Motorista" abre uma tela de Carteira sem cidade

## O que está acontecendo

Você está logado como **Brand Admin** da Ubiz Resgata (sem `branch_id` próprio, porque admin de marca atende várias cidades). Ao clicar em algo chamado "Painel do Motorista" / "Painel Franqueado", caiu em **`/branch-wallet`** (Carteira de Pontos da Cidade) sem `?branchId=...` na URL → a página não sabe qual cidade carregar e mostra **"Nenhuma cidade vinculada ao seu perfil"**.

A tela em si não está bugada. O problema é de **navegação confusa** causado por três pontos:

### 1. Dois itens no sidebar com nomes idênticos
| Chave | Rótulo exibido | Vai para | O que é de fato |
|---|---|---|---|
| `sidebar.painel_motorista_view` (Gestão Comercial) | **"Painel do Motorista"** | `/driver?brandId=...` | App real do motorista (correto) |
| `sidebar.painel_motorista` (Configurações) | **"Painel do Motorista"** *(forçado em `useMenuLabels.ts:151`)* | `/driver-config` | Configuração do painel |

O `defaultTitle` no registro é "Configurar Painel Motorista", mas o `useMenuLabels` sobrescreve para "Painel do Motorista" — ficando idêntico ao item de visualização. Confunde quem clica.

### 2. Atalho "Painel Franqueado" no Dashboard sem cidade
`DashboardQuickLinks.tsx` (linha 106) cria um card chamado **"Painel Franqueado"** apontando para `/branch-wallet` — sem `?branchId=...`. Para o Brand Admin (que não tem `branch_id` no perfil), a página resolve `effectiveBranchId = null` e mostra "Nenhuma cidade vinculada".

### 3. Item "Carteira de Pontos" no sidebar também sem cidade
O item `sidebar.carteira_pontos` aponta para `/branch-wallet` direto, sem `branchId`. Mesma armadilha para Brand Admin.

## O que vou ajustar

### A. Renomear o item de configuração para acabar com a duplicidade
Em `useMenuLabels.ts`, trocar o `defaultLabel` de `sidebar.painel_motorista` de **"Painel do Motorista"** para **"Configurar Painel do Motorista"**. Em `dados_manuais.ts` e demais lugares, alinhar a mesma terminologia. Resultado: dois itens com nomes claros e diferentes.

### B. Remover/corrigir o atalho "Painel Franqueado" para Brand Admin
Em `DashboardQuickLinks.tsx`:
- Para **Brand Admin**, trocar o link "Painel Franqueado → /branch-wallet" por **"Minhas Cidades → /brand-branches"**, que é o ponto de entrada correto para escolher uma cidade e então abrir suas ferramentas.
- Manter "Painel Franqueado → /branch-wallet" apenas para usuários com `consoleScope === "BRANCH"` (Branch Admin), que têm `branch_id` próprio.

### C. Bloquear "Carteira de Pontos" sem cidade selecionada para Brand Admin
Duas opções (vou aplicar a 1 que é mais simples e segura):

1. **Esconder o item `sidebar.carteira_pontos`** quando o usuário é Brand/Tenant/Root sem cidade impersonada (sem `?branchId=` ativo). Brand Admin acessa a Carteira pela rota natural: **Minhas Cidades → escolher cidade → Carteira**, e nesse fluxo o `?branchId=` é injetado.
2. *(Alternativa, não vai entrar agora)*: Mostrar um seletor de cidade dentro de `BranchWalletPage` quando faltar `branchId`.

Vou aplicar a opção **1** (esconder), porque mantém a coerência com o restante do produto onde "operações de cidade" são feitas dentro do contexto de uma cidade selecionada.

### D. Melhorar a mensagem da própria `BranchWalletPage` (failsafe)
Para o caso raro de alguém aterrissar lá sem `branchId`, trocar o texto seco "Nenhuma cidade vinculada ao seu perfil" por um **estado vazio com ação clara**:

> 📍 Selecione uma cidade primeiro
> A Carteira de Pontos é gerenciada por cidade. Vá em **"Minhas Cidades"**, escolha uma cidade e abra a Carteira pelo painel dela.
> [Botão: Ir para Minhas Cidades]

## Arquivos que serão ajustados

- `src/hooks/useMenuLabels.ts` — renomear `sidebar.painel_motorista` para "Configurar Painel do Motorista"
- `src/compartilhados/constants/constantes_menu_sidebar.ts` — alinhar `defaultTitle` de `sidebar.painel_motorista`
- `src/components/dashboard/DashboardQuickLinks.tsx` — substituir "Painel Franqueado" por "Minhas Cidades" para Brand Admin
- `src/components/consoles/BrandSidebar.tsx` — esconder `sidebar.carteira_pontos` quando `consoleScope` for BRAND/TENANT/ROOT sem `?branchId=` na URL
- `src/pages/BranchWalletPage.tsx` — estado vazio com botão "Ir para Minhas Cidades"

## Resultado esperado

- O item **"Painel do Motorista"** no sidebar passa a abrir só o app real do motorista (`/driver?brandId=...`). A configuração vira **"Configurar Painel do Motorista"**, sem confusão.
- O **Dashboard** do Brand Admin não oferece mais o atalho "Painel Franqueado" sem cidade — em vez disso, mostra **"Minhas Cidades"**, que é o caminho real.
- A **Carteira de Pontos** só aparece no menu quando faz sentido (dentro de uma cidade).
- Se ainda assim alguém cair na URL `/branch-wallet` sem cidade, vê uma orientação clara em vez de uma mensagem seca.

## Risco e rollback

- **Risco baixo**: mudanças concentradas em rótulos de menu, filtros visuais e um link do Dashboard. Nenhuma rota é removida; nenhuma RLS/banco é alterada.
- **Rollback**: restaurar o `defaultLabel` original em `useMenuLabels.ts`, devolver "Painel Franqueado" no `DashboardQuickLinks` e remover o filtro do `sidebar.carteira_pontos`.

