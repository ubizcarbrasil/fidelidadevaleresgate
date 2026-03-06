

## Problema

A página de Fechamento Mensal GG (`/ganha-ganha-closing`) não exibe nenhuma mensagem informativa quando o módulo Ganha-Ganha ainda não foi configurado para a marca. A tabela `ganha_ganha_config` não possui registro para a Ubiz Resgata, então a página aparece vazia sem orientação.

O mesmo ocorre nas páginas `/ganha-ganha-config` e `/ganha-ganha-billing` — não há dados porque o módulo nunca foi ativado.

## Solução

### 1. Adicionar estado vazio informativo nas 3 páginas GG

Nas páginas `GanhaGanhaClosingReportsPage`, `GanhaGanhaBillingPage` e `GanhaGanhaStoreSummaryPage`, quando `config` for null, exibir um card informativo com:
- Ícone e título "Módulo Ganha-Ganha não configurado"
- Texto explicando que é necessário ativar primeiro
- Botão "Configurar Ganha-Ganha" que navega para `/ganha-ganha-config`

### 2. Garantir que a página de configuração permite criar o registro inicial

A `GanhaGanhaConfigPage` já permite criar/atualizar a config via upsert. Verificar que funciona corretamente para criação inicial (sem registro existente).

### Arquivos alterados
- `src/pages/GanhaGanhaClosingReportsPage.tsx` — adicionar empty state quando config é null
- `src/pages/GanhaGanhaBillingPage.tsx` — adicionar empty state quando config é null  
- `src/pages/GanhaGanhaStoreSummaryPage.tsx` — adicionar empty state quando config é null (se existir)

