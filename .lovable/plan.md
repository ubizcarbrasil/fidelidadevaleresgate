

# Corrigir Seed dos Templates de Mensagem

## Problema
O auto-seed dos 15 templates padrão (3 por categoria) nunca rodou porque já existia 1 template criado manualmente ("Desafio de Duelo"). A condição `query.data.length === 0` impede o seed quando há qualquer template existente.

## Solução

### Passo 1 — Inserir os 14 templates faltantes via migração SQL
Inserir diretamente no banco os 14 templates padrão que faltam para a brand existente, preservando o template "Desafio de Duelo" já criado.

**Arquivo**: Migração SQL  
-