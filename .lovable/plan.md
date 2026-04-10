

# Limpeza de Organizações + Botão de Excluir

## Diagnóstico

1. **Organizações extras**: Existem 13 tenants sem nenhuma marca vinculada que precisam ser removidos. Apenas **Ubiz Resgata** e **Ubiz Car** devem permanecer.

2. **Por que não some ao excluir cidade**: A página de Organizações (`/tenants`) não tem botão de exclusão — só tem toggle ativo/inativo e edição. Não existe funcionalidade de deletar tenant na interface.

## Plano

### 1. Remover 13 tenants órfãos via migração SQL

Executar DELETE para os 13 tenants sem brands vinculadas:
- Empresa Teste, Abs, Pizzaria do Teste, Meu motorista, Me leva resgata, Matheus MKT, Gina Car, Soureino, Gina haline car, Urbano Norte, Vini fideliza, Leo fideliza, DomStore

### 2. Adicionar botão de Excluir na página Tenants

Em `src/pages/Tenants.tsx`:
- Adicionar ícone `Trash2` e botão de exclusão ao lado dos botões existentes (editar/toggle)
- Criar mutation `deleteTenant` que executa `supabase.from("tenants").delete().eq("id", id)`
- Adicionar confirmação antes de excluir (dialog ou `window.confirm`)
- Bloquear exclusão se o tenant tiver marcas vinculadas (`brand_count > 0`)
- Invalidar queries após sucesso para a lista atualizar automaticamente

### 3. Corrigir slug do Ubiz Resgata

O slug ainda está como "123456" — atualizar para "ubiz-resgata" para consistência.

### Resultado esperado

- Página de Organizações mostrará apenas **Ubiz Resgata** e **Ubiz Car**
- Botão de lixeira permitirá excluir organizações sem marcas diretamente pela interface
- Lista atualiza automaticamente após exclusão

