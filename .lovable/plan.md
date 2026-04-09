

# Plano: Adicionar Mensagens via Machine na página Enviar Notificação

## Contexto
A página "Enviar Notificação" (`/send-notification`, menu Comunicação) atualmente só tem o formulário de push notification para clientes. O usuário quer que o fluxo de mensagens Machine também esteja acessível aqui.

## Solução
Adicionar sub-tabs na `SendNotificationPage`:
- **Notificação Push** — conteúdo atual (formulário de envio push para clientes)
- **Mensagens via Machine** — reutiliza o componente `AbaMensagens` com templates, fluxos, envio manual e relatório

## Mudanças

### `src/pages/SendNotificationPage.tsx`
- Importar `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` e `AbaMensagens`
- Buscar branches com brand_id para passar ao `AbaMensagens`
- Envolver o conteúdo atual em uma tab "Notificação Push"
- Adicionar segunda tab "Mensagens via Machine" renderizando `<AbaMensagens brandId={currentBrandId} branches={branches} />`

Nenhum arquivo novo. Apenas reorganização da página existente.

