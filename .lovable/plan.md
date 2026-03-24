

## Adicionar keywords à categoria "Mercado"

### O que será feito
Atualizar os keywords da categoria "Mercado" no banco de dados para todas as brands existentes, adicionando termos alimentícios comuns que melhoram o matching automático do motor de categorização.

### Keywords atuais (seed)
`mercado, alimento, bebida, supermercado, comida, snack, chocolate, cafe`

### Keywords a adicionar
Termos de produtos alimentícios comuns em promoções brasileiras:
- **Bebidas**: cerveja, refrigerante, suco, leite, agua, vinho, whisky, energetico
- **Alimentos básicos**: arroz, feijao, macarrao, farinha, oleo, acucar, sal, molho
- **Laticínios/proteínas**: queijo, iogurte, manteiga, ovo, carne, frango, peixe
- **Industrializados**: biscoito, bolacha, cereal, granola, geleia, achocolatado, nescau, nutella
- **Limpeza/higiene (presentes em supermercados)**: sabao, detergente, amaciante, papel higienico, desinfetante
- **Outros**: cesta basica, kit, feira, hortifruti, congelado, sorvete, picole

### Alterações

#### 1. Banco de dados (via insert tool — UPDATE)
Atualizar `affiliate_deal_categories.keywords` para todas as linhas onde `name = 'Mercado'`, substituindo o array atual pelo array expandido.

#### 2. `src/lib/categorizadorAchadinhos.ts` (linha 30-31)
Sem alteração — o `API_CATEGORY_MAP` apenas mapeia `grocery`/`food` → `"mercado"`. O matching por keywords usa os dados do banco.

#### 3. `supabase/functions/mirror-sync/index.ts`
Sem alteração — a edge function lê keywords do banco em runtime.

#### 4. Seed function `seed_affiliate_categories` (SQL)
Atualizar o array de keywords do INSERT de "Mercado" para incluir os novos termos, garantindo que brands futuras já recebam a lista completa.

### Detalhes técnicos

**UPDATE no banco:**
```sql
UPDATE affiliate_deal_categories
SET keywords = ARRAY[
  'mercado','alimento','bebida','supermercado','comida','snack','chocolate','cafe',
  'cerveja','refrigerante','suco','leite','agua','vinho','whisky','energetico',
  'arroz','feijao','macarrao','farinha','oleo','acucar','sal','molho',
  'queijo','iogurte','manteiga','ovo','carne','frango','peixe',
  'biscoito','bolacha','cereal','granola','geleia','achocolatado','nescau','nutella',
  'sabao','detergente','amaciante','papel higienico','desinfetante',
  'cesta basica','feira','hortifruti','congelado','sorvete','picole'
]
WHERE name = 'Mercado';
```

**Migration para atualizar seed function** — apenas alterar o array de keywords de "Mercado" na função `seed_affiliate_categories`.

