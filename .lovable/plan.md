

## Plano: Responsividade do BranchForm para mobile 430px

### Problemas identificados

1. **Container `max-w-2xl`** — OK para desktop mas pode ser melhorado com padding lateral em mobile
2. **Grids `md:grid-cols-2`** — Em 430px ficam em 1 coluna (correto), mas o breakpoint `md` (768px) é adequado
3. **Botões Salvar/Cancelar** — `flex gap-2` sem largura total em mobile, ficam pequenos e difíceis de clicar
4. **Switch "Ativo"** — Layout funcional mas pode ter melhor alinhamento inline
5. **CardContent sem padding mobile** — Padding padrão pode comprimir campos em telas estreitas

### Mudanças em `src/pages/BranchForm.tsx`

1. **Container principal**: trocar `max-w-2xl` para `max-w-2xl px-1 sm:px-0` para micro-ajuste de margem mobile
2. **Botões de ação (Salvar/Cancelar)**: trocar `flex gap-2` para `flex flex-col gap-2 sm:flex-row` com `w-full sm:w-auto` em cada botão — empilha verticalmente em mobile, botões ocupam largura total
3. **Switch "Ativo"**: trocar layout para `flex items-center justify-between` com Label e Switch na mesma linha, mais ergonômico
4. **Timezone grid**: remover grid wrapper desnecessário (campo único não precisa de grid)
5. **Botão Voltar**: adicionar `w-full sm:w-auto` para consistência mobile

### Resumo
Ajustes puramente de classes Tailwind — sem mudança de lógica. Foco em botões clicáveis com largura total e layout mais limpo em 430px.

