
Objetivo: corrigir o botão “Preço diferente? Avisar” que hoje aparenta travar a tela no detalhe da oferta.

Diagnóstico encontrado:
- O problema é de camadas visuais, não do cadastro em si.
- A tela `AchadinhoDealDetail` fica em `z-[62]`.
- O modal compartilhado (`src/components/ui/dialog.tsx`) abre com `z-50`.
- O select do motivo (`src/components/ui/select.tsx`) também usa `z-50`.
- Resultado: ao tocar no botão, o diálogo abre “por trás” da tela de detalhe, o foco fica preso no modal invisível e a interface parece travada.
- Isso bate com o estado atual: não há registros recentes em `offer_reports`, então o fluxo nem chega ao envio.

Plano de implementação:
1. Ajustar a hierarquia de camadas dos componentes compartilhados
   - Elevar `DialogOverlay` e `DialogContent` em `src/components/ui/dialog.tsx` para ficarem acima dos overlays mobile do marketplace.
   - Ajustar também `SelectContent` em `src/components/ui/select.tsx` para ficar acima do próprio diálogo.
   - Se necessário, alinhar `src/components/ui/popover.tsx`/`alert-dialog.tsx` para manter consistência do design system.

2. Validar o fluxo do modal de denúncia
   - Garantir que `ReportarOfertaDialog.tsx` continue abrindo via `open/onOpenChange`.
   - Confirmar que o usuário consegue:
     - abrir o modal,
     - selecionar “Preço diferente do informado”,
     - preencher observação,
     - enviar sem congelar a UI.

3. Confirmar o encadeamento até o Dashboard
   - Verificar se o insert em `offer_reports` continua com `status: "pending"`.
   - Confirmar que isso alimenta corretamente:
     - `PendingReportsSection.tsx`
     - `TasksSection.tsx`
   - Assim a denúncia volta a aparecer como tarefa pendente com ação de desativar oferta.

Arquivos envolvidos:
- `src/components/ui/dialog.tsx`
- `src/components/ui/select.tsx`
- possivelmente `src/components/ui/popover.tsx`
- `src/components/customer/ReportarOfertaDialog.tsx` (validação final do fluxo)
- `src/components/customer/AchadinhoDealDetail.tsx` (referência do overlay atual)
- `src/components/dashboard/PendingReportsSection.tsx`
- `src/components/dashboard/TasksSection.tsx`

Detalhe técnico principal:
```text
AchadinhoDealDetail  -> z-[62]
DialogOverlay        -> z-50
DialogContent        -> z-50
SelectContent        -> z-50
```

A correção será padronizar uma pilha assim:
```text
overlay mobile da vitrine < dialog < dropdowns do dialog
```

Resultado esperado:
- o botão deixa de “travar” a tela,
- o modal aparece corretamente,
- a denúncia é enviada,
- a tarefa pendente passa a surgir no Dashboard com análise e ação.
