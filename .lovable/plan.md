

# Verificação + Manual da Sub-fase 6.1

## ✅ O que foi feito com sucesso

| Item | Status |
|---|---|
| Coluna `is_sellable_addon` em `business_models` | ✅ todos os 13 modelos marcados como `true` |
| Colunas `addon_price_monthly_cents` / `yearly_cents` | ✅ existem (vazias — preencher na UI) |
| Tabela `brand_business_model_addons` | ✅ criada com índices, RLS, FKs e check constraints |
| RPC `resolve_active_business_models` | ✅ atualizada — já considera add-ons (`source='addon'`) |
| RPC `list_business_model_addons` | ✅ criada |
| Aba "Add-ons Vendidos" na Central de Módulos | ✅ presente como 4ª sub-aba |
| Modal "Conceder Add-on" | ✅ funcional com sugestão de preço |
| Inputs de preço mensal/anual no editor de modelo | ✅ presentes |
| Badge "Add-on" no painel do empreendedor | ✅ aparece quando `source === "addon"` |

Hoje há **0 add-ons concedidos** no banco — sistema pronto para uso.

## ⚠️ 1 ajuste pequeno pendente

O hook `useResolvedBusinessModels` faz subscribe Realtime em 3 tabelas, mas **não escuta `brand_business_model_addons`**. Resultado: ao conceder/cancelar um add-on, o painel do empreendedor só atualiza após 30s (staleTime) ou refresh. Adicionar 1 listener no canal Realtime para essa tabela, com filtro `brand_id=eq.${brandId}`.

## 📘 Manual a ser criado

Adicionar **1 entrada nova** ao manual existente "Central de Módulos (Root)" em `src/components/manuais/dados_manuais.ts` (categoria já existe, linha 1198):

```text
id: "central-modulos-addons-vendidos"
título: "Add-ons Vendidos — Vender Modelos Avulsos"
rota: /admin/central-modulos
```

Conteúdo do manual:
- **Descrição:** explicar que add-ons permitem vender qualquer modelo de negócio individualmente, fora do pacote do plano
- **Como ativar:** acessar Central de Módulos → aba "Modelos de Negócio" → sub-aba "Add-ons Vendidos"
- **Passos:** (1) marcar modelo como vendável e definir preço no editor; (2) abrir "Conceder Add-on"; (3) escolher marca; (4) escolher modelo; (5) ciclo (mensal/anual); (6) preço (sugerido vem do editor); (7) data de expiração opcional; (8) notas internas; (9) confirmar
- **Dicas:** a marca não distingue plano vs add-on no painel dela (só vê badge "Add-on"); preço anual é editável por concessão; data vazia = vigência manual; cancelar suspende, remover apaga histórico

## Arquivos a editar (2)

| Arquivo | Mudança |
|---|---|
| `src/compartilhados/hooks/hook_modelos_negocio_resolvidos.ts` | adicionar 4º `.on(...)` para `brand_business_model_addons` no Realtime |
| `src/components/manuais/dados_manuais.ts` | inserir o novo manual no array de manuais da categoria "Central de Módulos (Root)" (após o último item da seção, linha ~1408) |

## Estimativa
~5 min. Commit atômico único.

