

## Plano

Adicionar um link de acesso ao painel correspondente em cada card de conta de teste na tela de sucesso do wizard.

### Alteração

**`src/pages/ProvisionBrandWizard.tsx`** — No step "done", adicionar um botão com ícone `ExternalLink` em cada card de conta de teste que abre `https://{result.domain}/auth` em nova aba. Como todas as contas acessam via `/auth` e o sistema redireciona para o painel correto após login, o link será o mesmo mas com label contextual:

- Administrador → "Abrir Painel Admin"
- Cliente Teste → "Abrir App Cliente"  
- Parceiro Teste → "Abrir Portal Parceiro"

Cada link abrirá `https://{result.domain}/auth` em nova aba (`window.open`).

### Detalhes técnicos

- Adicionar um mapeamento `rolePanelLink` com labels descritivos por role
- Adicionar botão `ExternalLink` abaixo do email/senha em cada card
- O ícone `ExternalLink` já está importado no componente

