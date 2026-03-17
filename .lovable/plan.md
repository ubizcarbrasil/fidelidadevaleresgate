

## Diagnóstico e Plano

### O que é a página "Regras de Fidelidade"

Esta página permite ao **Administrador da Marca** configurar as regras base de acúmulo de pontos do programa de fidelidade. Ela define:

- **Pontos por R$1** — quantos pontos o cliente ganha a cada real gasto
- **R$ por ponto** — quanto vale cada ponto em reais (para resgates)
- **Compra mínima** — valor mínimo de compra para acumular pontos
- **Limites anti-fraude** — máximo de pontos por compra, por cliente/dia e por loja/dia
- **Exigir comprovante** — se o operador precisa informar código do recibo
- **Regra customizada por loja** — se parceiros podem definir taxas próprias (dentro de limites)

Em resumo, é a **configuração central do motor de pontuação** da marca.

### Causa do Erro

O crash `A <Select.Item /> must have a value prop that is not an empty string` ocorre na **linha 179** de `PointsRulesPage.tsx`:

```tsx
<SelectItem value="">Todas</SelectItem>
```

O componente Radix `Select.Item` não aceita string vazia como `value`. Quando a página renderiza o seletor de Branch, este item causa o crash imediato.

### Correção

Na linha 179 de `src/pages/PointsRulesPage.tsx`:
- Trocar `value=""` por `value="__all__"` (sentinela)
- No `onValueChange`, converter `"__all__"` de volta para `""` no estado do form

**Arquivo:** `src/pages/PointsRulesPage.tsx`
- Linha 176: Ajustar o `value` do Select para usar `form.branch_id || "__all__"`
- Linha 176: No `onValueChange`, converter: `v => updateField("branch_id", v === "__all__" ? "" : v)`
- Linha 179: Trocar `value=""` para `value="__all__"`

Alteração mínima, apenas 3 linhas no mesmo bloco.

