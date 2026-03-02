

## Problema

A Fase 2 do guia "Jornada Completa" instrui o usuário a "Selecionar a empresa (Tenant)", mas o wizard `/provision-brand` não possui esse campo. O wizard cria Tenant + Marca + Cidade + Domínio + Usuários de uma só vez, automaticamente.

Os passos da Fase 2 estão desalinhados com o fluxo real do wizard.

## Plano

### 1. Corrigir os passos da Fase 2 no `RootJourneyGuidePage.tsx`

Atualizar os passos para refletir o fluxo real do wizard de provisionamento:

1. Acesse o menu lateral → Estrutura → Nova Empresa.
2. Preencha o nome da empresa (ex: 'Vale Resgate Goiânia') — o slug é gerado automaticamente.
3. Clique em 'Próximo'.
4. Preencha o nome da primeira cidade (ex: 'Goiânia Centro') e o estado.
5. Clique em 'Próximo'.
6. (Opcional) Insira a URL do logo e escolha as cores primária e secundária.
7. Defina os pontos iniciais do cliente de teste.
8. Clique em 'Revisar', confira os dados e clique em 'Criar Empresa'.

Também atualizar a **descrição** da Fase 2 para deixar claro que o Tenant é criado automaticamente pelo wizard (não precisa criar antes na Fase 1).

### 2. Revisar se a Fase 1 ainda é necessária

Avaliar se a Fase 1 ("Criar a Empresa / Tenant" manualmente em `/tenants/new`) deve ser mantida como um passo opcional ou removida, já que o wizard da Fase 2 já cria o Tenant. A recomendação é **manter a Fase 1** mas adicionar uma dica explicando que o wizard da Fase 2 já cria o Tenant automaticamente, sendo a Fase 1 necessária apenas se quiser criar Tenants separadamente.

### Arquivo alterado
- `src/pages/RootJourneyGuidePage.tsx` — linhas 54-68 (passos e dicas da Fase 2) + linha 41-44 (dica na Fase 1)

