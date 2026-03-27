

## Plano: Reorganizar painel de detalhes do motorista com abas

### Resumo
Refatorar o `DriverDetailSheet` para usar o componente `Tabs` do shadcn, distribuindo o conteúdo em 4 abas: **Dados**, **Pontuação**, **Regras** e **Extrato**. Cada aba será extraída para seu próprio componente, seguindo a regra de componentização do workspace.

### Distribuição das abas

| Aba | Conteúdo |
|-----|----------|
| **Dados** | Dados cadastrais (nome, CPF, telefone, email), tier, cidade/branch, ações rápidas (acessar conta, redefinir senha) |
| **Pontuação** | Saldo atual, toggle de pontuação ativa/desativada, botão adicionar pontos |
| **Regras** | Editor de regra individual de pontuação (`DriverRuleEditor`) |
| **Extrato** | Extrato/relatório de pontos (`DriverLedgerSection`) |

### Arquivos a criar
1. `src/components/driver-management/tabs/AbaDadosMotorista.tsx` — dados cadastrais, branch, senha, acesso à conta
2. `src/components/driver-management/tabs/AbaPontuacaoMotorista.tsx` — saldo, toggle, adicionar pontos
3. `src/components/driver-management/tabs/AbaRegrasMotorista.tsx` — wrapper do `DriverRuleEditor`
4. `src/components/driver-management/tabs/AbaExtratoMotorista.tsx` — wrapper do `DriverLedgerSection`

### Arquivo a editar
5. `src/components/driver-management/DriverDetailSheet.tsx` — substituir conteúdo monolítico por `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` com as 4 abas, mantendo header com nome e ícone acima das abas

### Detalhes técnicos
- Usar `Tabs` de `@/components/ui/tabs` com `defaultValue="dados"`
- `TabsList` com layout `grid grid-cols-4` para distribuir uniformemente
- Cada `TabsContent` renderiza o componente da aba correspondente
- `InfoRow` será movido para `AbaDadosMotorista` ou extraído como utilitário compartilhado
- `ManualDriverScoringDialog` permanece no `DriverDetailSheet` (controlado por estado local, disparado pela aba Pontuação)
- Props de cada aba recebem apenas o que precisam (`driver`, `brandId`, callbacks)

