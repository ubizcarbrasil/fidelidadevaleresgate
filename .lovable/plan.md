

# Status da Sub-fase 6.6 + Próximos Passos

## ✅ O que está pronto e funcional

| Item | Status |
|---|---|
| Tabela `driver_profiles` (1:1 com customers, ~70 campos) | ✅ migrado |
| Tabela `driver_import_jobs` (rastreio de jobs) | ✅ migrado |
| Edge Function `import-drivers-bulk` (chunks de 500, até 5 mil linhas) | ✅ deployada |
| Auto-cadastro `driver_profiles` na 1ª corrida (idempotente, falha-silente) | ✅ webhook |
| Match anti-duplicação (`external_id → CPF → telefone → nome`) | ✅ reforçado |
| Modal multi-etapa (Upload → Preview → Progresso → Resultado) | ✅ |
| Suporte CSV + XLSX via SheetJS | ✅ |
| Mapeamento heurístico de 117 colunas TaxiMachine | ✅ |
| Listagem `/motoristas` com paginação real (50/página + count exato) | ✅ |
| Busca server-side por nome/CPF/telefone/placa | ✅ |
| Filtro por status (Ativo / Inativo / Bloqueado) | ✅ |
| Ficha em 6 abas (Dados, Veículos, Docs, Pontos, Regras, Extrato) | ✅ |
| Badge de origem dos dados (CSV / 1ª corrida / vazio) | ✅ |
| Manual atualizado | ✅ |
| Compat 100% com motoristas existentes | ✅ |

## 🧪 Antes de publicar — testes recomendados (5 min)

1. **Importar uma planilha pequena** (10-20 linhas) primeiro pra validar mapeamento real do seu arquivo
2. **Importar a planilha completa** de 4 mil linhas e confirmar tempo (~30-60s) + contadores
3. **Abrir uma ficha** importada e checar Veículos / Documentação preenchidos
4. **Buscar por placa** na listagem
5. **Re-importar a mesma planilha** → resultado deve mostrar "atualizados" sem duplicar

## 🚀 Próximos passos sugeridos (em ordem de valor)

### Curto prazo (1-2 sub-fases)
- **6.7 — Edição manual da ficha**: hoje só importação grava; adicionar formulários para corrigir CNH, banco, veículo direto na ficha
- **6.8 — Export reverso**: exportar lista filtrada de motoristas em CSV/XLSX (útil pra relatórios da prefeitura, sindicato, etc.)
- **6.9 — Alertas de CNH vencendo**: notificação 30/15/7 dias antes do vencimento + badge na listagem

### Médio prazo
- **6.10 — Sync automático com TaxiMachine API**: cron diário que atualiza status / avaliação / aceitação de todos os motoristas ativos
- **6.11 — Histórico de mudanças por motorista**: timeline mostrando importações, transferências de cidade, bloqueios

### Voltando à fase 6.4 (Stripe)
- Retomar a integração de pagamentos da landing rica (que ficou pausada na 6.5)

## 📤 Posso publicar?

**Sim, pode publicar.** Tudo é retrocompatível, sem migrações destrutivas. Os motoristas atuais continuam funcionando exatamente como antes; os novos campos são opcionais e aparecem com `—` quando vazios.

**Como publicar:**
- **Desktop**: botão **Publish** no canto superior direito → **Update**
- **Mobile**: botão **…** no canto inferior direito (modo Preview) → **Publish** → **Update**

Lembrando: mudanças de **frontend** (listagem, modal, ficha) só vão pro ar depois do **Update**. Mudanças de **backend** (Edge Functions, migração) já estão ativas em produção desde que foram aplicadas.

