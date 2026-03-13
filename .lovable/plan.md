

## Diagnóstico confirmado via browser

Testei o app no preview (`/customer-preview`) e confirmei: **o layout aparece em modo claro** (fundo branco, cards claros, header branco). O código atual usa `hsl(var(--background))`, `hsl(var(--card))` etc. que resolvem para cores claras porque o dark mode só ativa se `localStorage` tiver `customer_dark_mode = "dark"`.

### Problema raiz

O `CustomerLayout.tsx` tem este trecho (linha 128-135):
```typescript
const saved = localStorage.getItem("customer_dark_mode");
if (saved === "dark") {
  document.documentElement.classList.add("dark");
}
```
Como ninguém setou isso, o app permanece em light mode.

### Plano de correção

**Forçar dark mode automaticamente** no customer app e aplicar cores escuras fixas (Vale Bonus palette) diretamente nos componentes, sem depender de `localStorage`.

| Arquivo | Mudança |
|---------|---------|
| `src/components/customer/CustomerLayout.tsx` | Forçar `document.documentElement.classList.add("dark")` no mount do CustomerLayout (sem condição). Restaurar ao desmontar. Aplicar `bg-[#0F0F13]` no container principal. |
| `src/pages/customer/CustomerHomePage.tsx` | Aplicar fundo escuro fixo `bg-[#0F0F13]` e cores de texto brancas |
| `src/components/HomeSectionsRenderer.tsx` | Usar `bg-[#1A1A24]` nos cards em vez de `hsl(var(--card))`, texto branco fixo |
| `src/components/customer/SegmentNavSection.tsx` | Cards de categoria com fundo `#1A1A24`, texto claro |
| `src/components/customer/CategoryGridOverlay.tsx` | Fundo escuro fixo, cards escuros |
| `src/components/customer/CategoryStoresOverlay.tsx` | Fundo escuro fixo, cards escuros |
| `src/components/customer/SectionDetailOverlay.tsx` | Fundo escuro fixo |

### Abordagem técnica

Em vez de depender das CSS variables do dark mode (que podem conflitar com o painel admin), vou:

1. **Forçar `dark` class** no `useEffect` do CustomerLayout para que todas as variáveis CSS mudem automaticamente
2. **Restaurar** a classe ao desmontar o componente (para não afetar o admin)
3. O fundo principal e cards já usam `hsl(var(--background))` e `hsl(var(--card))` que no dark mode são escuros por design

Essa é a abordagem **mais limpa** — usa o sistema de temas que já existe no CSS (`src/index.css` já tem todas as variáveis `.dark` definidas) sem hardcodar cores em cada componente.

### Nenhuma lógica alterada

- Mesmos dados, mesmos hooks, mesmos endpoints
- Apenas forçar a ativação do dark mode no contexto do customer app

