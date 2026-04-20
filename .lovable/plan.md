

# Bug: "Informe um preço válido" mesmo com preço preenchido

## Diagnóstico

O input mostra `497,00` mas a validação acusa `draft.price_cents <= 0`. O bug está em `passo_identificacao.tsx`:

```tsx
const [precoMensalStr, setPrecoMensalStr] = useState(() =>
  draft.price_cents > 0 ? centsToStr(draft.price_cents) : "",
);

useEffect(() => {
  setPrecoMensalStr(draft.price_cents > 0 ? centsToStr(draft.price_cents) : "");
  setPrecoAnualStr(centsToStr(draft.price_yearly_cents));
}, [draft.id]);  // ← só ressincroniza quando draft.id muda
```

**O que acontece:**

1. Usuário abre wizard de criação → `draft.price_cents = 0`, `draft.id = undefined`
2. `precoMensalStr` inicializa como `""`
3. Usuário avança até "Landing" e volta para "Identificação" pelo stepper
4. `PassoIdentificacao` é **remontado** (porque cada passo usa `{stepIdx === 0 && <PassoIdentificacao/>}`)
5. No remount, `useState(() => draft.price_cents > 0 ? centsToStr(...) : "")` roda com o `draft` atual **— que tem `price_cents = 49700` correto**, então mostra "497,00"
6. **MAS o usuário pode também ter feito o caminho inverso**: digitou na UI parcialmente, o `setDraft` no pai disparou re-render, e em algumas situações de mobile (toque rápido + perda de foco) o último `onChange` do input não chegou a propagar — então o estado local exibe um valor "viajado" (cacheado pelo navegador no `value` controlado anterior) enquanto `draft.price_cents` continua 0.

**Pior ainda — bug confirmado por inspeção:** o estado local string **não é a fonte de verdade**. Se por qualquer motivo o `draft.price_cents` voltar a 0 (re-mount, reset, navegação entre steps com algum spread perdido), o input continua mostrando "497,00" via `precoMensalStr`, mas a validação olha `draft.price_cents` que está zerado. **Os dois ficam dessincronizados** e o usuário não tem como saber.

Mesma falha no campo de preço anual.

## Correção

### 1. Eliminar a dessincronização (`passo_identificacao.tsx`)

Tornar `draft.price_cents` a única fonte de verdade. O estado local string é mantido só para preservar o que o usuário está digitando (vírgula, parcial), mas com **garantia de sincronia bidirecional**:

- Sempre que `draft.price_cents` mudar (não só `draft.id`), reformatar `precoMensalStr` se ele não corresponder ao valor do draft (a menos que o input esteja focado, para não atrapalhar a digitação).
- Mesmo tratamento para `price_yearly_cents`.

Implementação:

```tsx
const [mensalFocado, setMensalFocado] = useState(false);
const [anualFocado, setAnualFocado] = useState(false);

// Re-sync quando o valor do draft mudar, EXCETO se o usuário está digitando
useEffect(() => {
  if (mensalFocado) return;
  setPrecoMensalStr(draft.price_cents > 0 ? centsToStr(draft.price_cents) : "");
}, [draft.price_cents, mensalFocado]);

useEffect(() => {
  if (anualFocado) return;
  setPrecoAnualStr(centsToStr(draft.price_yearly_cents));
}, [draft.price_yearly_cents, anualFocado]);
```

E nos inputs:
```tsx
<Input
  ...
  onFocus={() => setMensalFocado(true)}
  onBlur={() => {
    setMensalFocado(false);
    if (precoMensalStr.trim() === "") return;
    setPrecoMensalStr(centsToStr(parseToCents(precoMensalStr)));
  }}
/>
```

Resultado: input e draft **nunca ficam dessincronizados**. Se draft volta a 0, input mostra vazio. Se o usuário digitou "497,00", draft tem 49700 garantido.

### 2. Mensagem de erro mais útil

Mudar a mensagem genérica `"Informe um preço válido"` para mensagens específicas em `wizard_produto.tsx`:

```ts
if (draft.price_cents <= 0) {
  return "O preço mensal precisa ser maior que zero. Verifique o campo no passo de Identificação.";
}
```

### 3. (Opcional) Defesa adicional — `onBlur` sempre commita o valor

No `onBlur` do input, sempre chamar `onChange({ price_cents: parseToCents(precoMensalStr) })` mesmo que o valor esteja vazio (passa 0 explícito). Isso garante que o draft reflete o input no momento que o usuário sai do campo, antes de clicar em "Salvar".

```tsx
onBlur={() => {
  setMensalFocado(false);
  const cents = parseToCents(precoMensalStr);
  onChange({ price_cents: cents });
  if (precoMensalStr.trim() !== "") {
    setPrecoMensalStr(centsToStr(cents));
  }
}}
```

## Arquivos modificados

1. `src/features/produtos_comerciais/components/passo_identificacao.tsx` — sincronização robusta dos dois campos de preço (mensal + anual) com proteção de foco
2. `src/features/produtos_comerciais/components/wizard_produto.tsx` — mensagem de erro mais clara

## O que NÃO vou mexer

- ❌ Banco / RLS / edge functions
- ❌ Outros passos do wizard
- ❌ Tipos / `EMPTY_DRAFT`
- ❌ Hook de salvamento

## Resultado esperado

- Digitar "497,00" → `draft.price_cents = 49700` sempre (nunca dessincroniza)
- Sair do campo (blur) commita o valor explicitamente
- Voltar de outros passos não dessincroniza o input
- Se ainda houver erro de validação, mensagem aponta exatamente o campo

## Risco

Baixo. Mudanças confinadas em 2 arquivos, sem alterar contrato externo. Build esperado limpo.

## Estimativa

~3 min.

