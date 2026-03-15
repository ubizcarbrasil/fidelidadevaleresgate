

## Diagnóstico

O código da edge function `seed-demo-stores` foi atualizado corretamente, **mas a função não foi re-executada** para as marcas existentes. Resultado no banco de dados agora:

| Marca | Lojas | Com taxonomy_segment_id | Seções CMS | Achadinhos |
|---|---|---|---|---|
| Ubiz Resgata | 41 | **0** | ? | 3 |
| Urbano Norte | 41 | 20 | ? | ? |

As lojas da "Ubiz Resgata" têm `taxonomy_segment_id = null` → o `SegmentNavSection` filtra tudo → **nenhuma categoria aparece**.

A edge function **já tem a lógica** para corrigir lojas existentes (linhas 506-511: atualiza `taxonomy_segment_id` se for null), criar seções CMS temáticas e os 20 achadinhos. Porém, precisa ser **invocada novamente**.

## Plano

### 1. Execução imediata: Re-invocar o seed para a marca do usuário

Usar a ferramenta `curl_edge_functions` para chamar `seed-demo-stores` com o `brand_id` e `branch_id` da marca "Ubiz Resgata", o que irá:
- Vincular `taxonomy_segment_id` nas 41 lojas existentes → categorias aparecem
- Criar as 4 seções CMS temáticas ("Deu fome?", "Saúde e Beleza", etc.)
- Criar os 20 achadinhos com links Mercado Livre
- Adicionar as ~12 lojas novas que faltam (total → ~60)

### 2. Automação futura: Auto-seed no primeiro acesso do app cliente

Para garantir que novas marcas nunca fiquem sem dados, adicionar lógica no `CustomerHomePage` que detecta quando a marca não tem seções/categorias e dispara o seed automaticamente na primeira visita.

| Arquivo | Ação |
|---|---|
| Edge function `seed-demo-stores` | **Invocar** para brand `db15bd21-9137-4965-a0fb-540d8e8b26f1` |
| `src/pages/customer/CustomerHomePage.tsx` | Adicionar auto-seed: se brand tem 0 categorias com taxonomy e tem lojas demo, chamar seed automaticamente (uma vez, com flag em `brand_settings_json`) |
| `src/components/DemoStoresToggle.tsx` | Melhorar o feedback — mostrar que re-executar atualiza taxonomia e seções CMS |

