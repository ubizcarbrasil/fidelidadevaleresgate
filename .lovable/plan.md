

## Diagnóstico

O banco de dados local tem apenas **21 contatos CRM** e **27 clientes**. Os 3.600+ clientes do CRM externo ainda não foram importados para o sistema.

Além disso, encontrei dois problemas críticos no código atual:

### Problema 1: Limite de 500 no Pull Sync
O `syncToCrmMutation` em `CustomersPage.tsx` (linha 156) faz `.limit(500)` ao buscar contatos órfãos. Mesmo que todos os 3.600 fossem importados, apenas 500 seriam sincronizados como clientes por vez.

### Problema 2: Faixas de tier erradas no Pull Sync
A função `tierFromRides` dentro do sync (linhas 159-167) usa faixas **diferentes** das canônicas:

| Tier | No Pull Sync (errado) | Canônico (correto) |
|---|---|---|
| Galáctico | 200+ | 501+ |
| Lendário | 150+ | 101+ |
| Diamante | 100+ | 51+ |
| Ouro | 50+ | 31+ |
| Prata | 20+ | 11+ |
| Bronze | 5+ | 1+ |

Isso significa que clientes importados do CRM recebem tiers incorretos.

## Plano

### 1. Corrigir faixas de tier no Pull Sync
Substituir a função `tierFromRides` local (linhas 159-167) por um import de `getTierFromRideCount` de `@/lib/tierUtils.ts`, que contém as faixas canônicas.

### 2. Remover limite de 500 — processar em lotes
Substituir o `.limit(500)` por um loop que busca e processa em lotes de 500 até não haver mais órfãos, suportando