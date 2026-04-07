

## Plano: Melhorar clareza do fluxo de ativação de cidade

### Situação atual
A cidade **Leme - SP** existe na tabela `branches` mas não tem registro em `machine_integrations`. Isso significa que ela foi criada como filial mas ainda não foi "ativada" na aba Pontuar Motorista. O dropdown do card "Ativar integração" mostra Leme corretamente — basta preencher as credenciais e clicar "Ativar cidade".

O problema é de **UX**: não está óbvio que a cidade precisa ser ativada para aparecer em "Cidades conectadas".

### Mudanças propostas

**1. Adicionar indicador visual de cidades pendentes**
No topo da aba, exibir um alerta amarelo quando existirem cidades criadas mas não ativadas, tipo:
> "Você tem 1 cidade pendente de ativação (Leme - SP). Configure as credenciais abaixo para conectá-la."

**2. Destacar o card "Ativar integração" quando houver pendentes**
Adicionar borda destacada (amarela/primary) e scroll automático para o card quando houver cidades não ativadas.

**3. Lista de cidades pendentes no card**
Mostrar as cidades pendentes como chips/badges acima do select para dar visibilidade.

### Arquivos modificados
- `src/features/integracao_mobilidade/components/aba_pontuar_motorista.tsx` — alerta de pendentes
- `src/features/integracao_mobilidade/components/card_adicionar_cidade.tsx` — destaque visual e chips de pendentes

### Resumo
Ajustes puramente visuais/UX para deixar claro que cidades recém-criadas precisam ser ativadas com credenciais antes de aparecerem como conectadas. Sem mudança de lógica de negócio.

