

## Endurecer `sanitizeLanding()` em `hook_produtos_comerciais.ts`

Vou aplicar uma única mudança cirúrgica no arquivo `src/features/produtos_comerciais/hooks/hook_produtos_comerciais.ts`, sem tocar em UI, types ou outros consumidores.

### O que muda

1. **Type guards explícitos por campo rico** — uma função `isXxx()` para cada um:
   - `isStringNaoVazia(v)`
   - `isBenefitObject(v)` → exige `title: string`; aceita `description?: string` e `icon?: string`
   - `isFaqItem(v)` → exige `question: string` e `answer: string`
   - `isMetric(v)` → exige `value: string` e `label: string`
   - `isTestimonial(v)` → exige `name: string` e `quote: string`; aceita `role?`, `avatar_url?`
   - `isScreenshot(v)` → exige `url: string`; aceita `caption?`
   
   Cada guard valida tipos de cada propriedade individualmente. Qualquer chave extra é ignorada (não derruba o item).

2. **Filtragem com descarte silencioso + warn**:
   - Helper `filtrarComWarn(campo, arr, guard)` que mapeia o array, descarta itens inválidos e emite `console.warn("[produtos_comerciais] item inválido em <campo>", item)` apenas para os descartados.
   - Em ambiente sem `console.warn` o helper não quebra.

3. **Fallback obrigatório para `[]`** em todos os campos ricos:
   - `benefits`, `faq`, `metrics`, `testimonials`, `screenshots`, `problems`, `solutions` e `comparison_highlights` sempre saem como array (vazio se ausente/ inválido), nunca `undefined`.
   - Isso elimina qualquer `(lc.benefits ?? [])` defensivo nos consumidores.

4. **`benefits` mistos (string OU objeto)**:
   - Strings vazias são descartadas.
   - Objetos sem `title` válido são descartados com warn.
   - Objetos válidos são re-emitidos no shape canônico `{ title, description?, icon? }` (sem propriedades extras vazando).

5. **`parseLanding()` mais defensivo**:
   - Continua aceitando objeto, mas agora também rejeita arrays e valores não-objeto explicitamente, retornando `{}`.

### Fora de escopo (intencional)

- Não altero `tipos_produto.ts` — o contrato público continua igual; campos opcionais agora simplesmente são sempre arrays na prática, o que é compatível.
- Não altero `sanitizeFeatures` (já está correto).
- Não altero consumidores (`pagina_landing_produto.tsx`, `TrialSignupPage.tsx`) — eles já vão se beneficiar automaticamente.
- Sem mudanças de banco.

### Critério de aceite

- Nenhum item rico fora de shape vaza para a UI.
- `landing_config_json.benefits/faq/metrics/...` sempre são arrays no objeto retornado.
- Itens descartados aparecem como `console.warn` com nome do campo, facilitando debug futuro.
- `/trial?plan=motorista-premium` deixa de quebrar com React error #31 mesmo que o JSON do plano contenha lixo legado.
- Nenhum outro arquivo é tocado.

### Commit

`fix(produtos): endurece sanitização de landing_config_json`

