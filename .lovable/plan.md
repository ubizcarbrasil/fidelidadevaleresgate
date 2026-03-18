

## Plano: Unificar fluxo de cadastro do perfil da loja

### Problema
Existem **dois fluxos duplicados** para preencher o perfil da loja:
1. **StoreProfileWizard** — wizard passo a passo, aberto pelo card "Complete seu perfil" no dashboard
2. **StoreProfileTab** — formulário completo na aba "Meu Perfil" do menu

Ambos pedem as mesmas informações (logo, banner, nome, segmento, endereço, galeria, horário). O parceiro acaba preenchendo tudo duas vezes.

### Solução

Tornar o wizard inteligente e eliminar a duplicidade:

**1. Wizard começa no primeiro passo pendente** (`StoreProfileWizard.tsx`)
- Ao abrir, calcular quais passos já estão preenchidos usando `isStepValid`
- Iniciar automaticamente no primeiro passo não preenchido (usar `firstMissingIndex` do hook `useStoreProfileCompleteness`)
- Passos já preenchidos ficam marcados com check verde nos dots de navegação e podem ser revisitados clicando, mas não são obrigatórios
- Permitir navegação livre (clicar em qualquer dot, não apenas nos anteriores)

**2. Profile Tab mostra banner de completude** (`StoreProfileTab.tsx`)
- Se perfil incompleto, exibir card no topo com progresso e botão "Continuar configuração" que abre o wizard no passo correto
- O formulário completo continua disponível abaixo para edições pontuais (quem já completou tudo usa normalmente)

**3. Dashboard passa step correto** (`StoreOwnerPanel.tsx`)
- Passar `initialStep={firstMissingIndex}` do hook de completeness ao abrir o wizard
- Recarregar dados da loja ao fechar o wizard (já faz reload)

### Arquivos alterados
- `src/components/store-owner/StoreProfileWizard.tsx` — lógica de skip, navegação livre, iniciar no passo pendente
- `src/components/store-owner/StoreProfileTab.tsx` — banner de completude no topo
- `src/pages/StoreOwnerPanel.tsx` — passar `initialStep` correto

### Impacto
- Zero mudança no banco de dados
- Experiência unificada: parceiro preenche cada campo **uma única vez**
- Ao retornar, vai direto para o que falta

