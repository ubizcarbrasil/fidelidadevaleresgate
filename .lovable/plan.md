

## Diagnóstico e Plano de Correção

### Problema 1: Onde o motorista define o apelido?
Atualmente **nao existe** uma tela para o motorista definir seu proprio apelido. Somente o admin pode editar apelidos na aba "Moderacao de Apelidos" (`ModeracaoApelidos.tsx`). Todos os `public_nickname` no banco estao `null`.

### Problema 2: Por que todos mostram "Motorista"?
A lista de adversarios (`CreateDuelSheet.tsx`) faz join com a tabela `customers` para buscar o nome real. Os nomes existem no banco (ex: `[MOTORISTA] Jorge Aparecido de Souza Oliveira`), mas provavelmente uma politica RLS na tabela `customers` impede que um motorista logado via sessao CPF leia os nomes de outros motoristas. Resultado: o join retorna `null` e o fallback exibe "Motorista".

### Solucao proposta

**1. Criar tela de perfil do motorista com campo de apelido**
- Novo componente no fluxo do motorista (ex: dentro do menu/perfil do DuelsHub ou como sheet acessivel)
- Campo para o motorista digitar e salvar seu `public_nickname` na tabela `driver_duel_participants`
- Validacao simples (max 20 caracteres, sem palavras ofensivas basicas)

**2. Corrigir exibicao de nomes na lista de adversarios**
- Copiar o `public_nickname` e o nome do customer para a propria tabela `driver_duel_participants` (ja existe `public_nickname`; o nome real pode ser populado via trigger ou no momento do enrollment)
- Alterar a query de `useDuelOpponents` para usar os dados ja presentes em `driver_duel_participants` em vez de depender do join com `customers`
- Alternativa mais simples: ajustar RLS da tabela `customers` para permitir leitura do campo `name` por motoristas autenticados via sessao CPF

**3. Priorizar nickname > nome real na lista**
- No `OpponentCard`, inverter a logica: mostrar `public_nickname` como titulo principal (quando existir) e o nome real como subtitulo
- Isso incentiva os motoristas a definirem apelidos e preserva a privacidade

### Arquivos a criar/editar
- **Novo:** `src/components/driver/duels/PerfilMotoristaSheet.tsx` — tela para o motorista editar apelido e avatar
- **Editar:** `src/components/driver/duels/DuelsHub.tsx` — adicionar botao de acesso ao perfil
- **Editar:** `src/components/driver/duels/hook_duelos.ts` — hook para salvar apelido + ajustar `useDuelOpponents` para nao depender do join `customers`
- **Editar:** `src/components/driver/duels/CreateDuelSheet.tsx` — `OpponentCard` priorizar nickname
- **Migracoes SQL:** Avaliar se precisa ajustar RLS de `customers` ou adicionar coluna `display_name` em `driver_duel_participants`

### Abordagem recomendada
A opcao mais segura e rapida: **popular o `public_nickname` automaticamente** com o primeiro nome do motorista no momento do enrollment (upsert), e permitir que o motorista edite depois. Assim a lista nunca mostra "Motorista" para todos.

