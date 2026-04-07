

## Popup de Desafio Recebido em Tempo Real

### Problema
Quando um motorista lança um duelo, o desafiado não recebe nenhum aviso visual. A query de duelos só atualiza manualmente, e o listener de eventos (`hook_listener_notificacoes`) apenas loga no console sem ação visual.

### Solução
Criar um sistema de escuta em tempo real (Realtime) na tabela `driver_duels` + um popup/dialog que aparece automaticamente quando um novo desafio é detectado.

### Etapas

**1. Habilitar Realtime na tabela `driver_duels`**
Migração SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_duels;
```

**2. Criar hook `hook_escuta_desafios_recebidos.ts`**
Hook que:
- Obtém o `participant_id` do motorista logado
- Assina canal Realtime filtrando `challenged_id=eq.{participantId}` com evento `INSERT`
- Quando detecta novo desafio com status `pending`, invalida a query `driver-duels` e retorna o desafio para exibir no popup
- Inclui estado de controle (desafio pendente, fechar popup)

**3. Criar componente `PopupDesafioRecebido.tsx`**
Dialog/modal que exibe:
- Nome do desafiante (nickname ou nome do customer)
- Período do duelo (data início → fim)
- Valor da aposta (se houver)
- Botão "Ver Desafio" que navega para o DuelsHub
- Botão "Fechar" para dispensar

Visual: estilo arena com ícone de espadas, gradiente de fundo, animação de entrada.

**4. Integrar no `DriverMarketplace.tsx`**
- Importar o hook e o componente popup
- Renderizar o popup no nível raiz do marketplace (fora de qualquer overlay)
- Ao clicar "Ver Desafio", abrir o DuelsHub automaticamente

### Arquivos afetados
- **Nova migração SQL** — habilitar realtime
- **Novo**: `src/components/driver/duels/hook_escuta_desafios_recebidos.ts`
- **Novo**: `src/components/driver/duels/PopupDesafioRecebido.tsx`
- **Editado**: `src/components/driver/DriverMarketplace.tsx` — integrar hook + popup

