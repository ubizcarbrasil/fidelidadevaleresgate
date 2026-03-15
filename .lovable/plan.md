

## Plano: Jornada Guiada do Parceiro (Profile Setup Wizard)

### Problema
O perfil do parceiro é um formulário longo e livre — o parceiro pode salvar sem preencher campos essenciais (logo, banner, segmento, descrição, etc.), resultando em lojas incompletas no app do cliente.

### Solução
Criar um **wizard de completude de perfil** que aparece no Dashboard quando o perfil está incompleto, guiando o parceiro passo a passo. Cada etapa salva automaticamente ao avançar.

### Etapas do Wizard

| Passo | Título | Campos | Obrigatório |
|-------|--------|--------|-------------|
| 1 | Logomarca | `logo_url` (upload) | Sim |
| 2 | Banner | `banner_url` (upload) | Sim |
| 3 | Dados Básicos | `name`, `email`, `phone`, `description` | name, description |
| 4 | Segmento | `taxonomy_segment_id` + tags dinâmicas | segment |
| 5 | Endereço e Contato | `address`, `whatsapp`, `instagram`, `site_url` | address |
| 6 | Galeria | `gallery_urls` (upload múltiplo) | Não (skip) |
| 7 | Horário | `operating_hours_json` | Não (skip) |
| 8 | Revisão | Preview do card como aparece para o cliente | — |

### Componentes

#### 1. `StoreProfileWizard.tsx` (novo)
- Wizard com barra de progresso, animação de transição entre passos (similar ao `RedemptionSignupCarousel`)
- Cada passo tem validação; botão "Próximo" só habilita quando campos obrigatórios preenchidos
- Botão "Pular" nos passos opcionais (galeria, horário)
- **Auto-save**: ao avançar de passo, salva os campos daquele passo no banco via `supabase.from("stores").update()`
- Passo final (Revisão) mostra preview do card da loja + botão "Concluir"
- Ao concluir, marca `profile_complete = true` (campo local, não precisa de migração — usa o próprio cálculo de completude)

#### 2. `useStoreProfileCompleteness.ts` (novo hook)
- Calcula % de completude baseado nos campos preenchidos
- Retorna `{ percent, missingSteps, isComplete }`
- Campos com peso: logo (15%), banner (15%), name+description (20%), segment (15%), address (10%), gallery (10%), hours (10%), contato (5%)

#### 3. Integração no `StoreOwnerDashboard`
- Se `isComplete === false`, mostrar card proeminente no topo do dashboard:
  - Barra de progresso circular com % 
  - "Complete seu perfil para aparecer no app"
  - Botão "Continuar configuração" → abre wizard no passo correto
- O parceiro pode fechar e voltar depois; o card persiste até 100%

#### 4. Modificar `StoreProfileTab.tsx`
- Adicionar botão "Configuração guiada" no topo que abre o wizard
- Manter formulário livre para edições pontuais

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/store-owner/StoreProfileWizard.tsx` | Criar — wizard completo |
| `src/hooks/useStoreProfileCompleteness.ts` | Criar — cálculo de completude |
| `src/pages/StoreOwnerPanel.tsx` | Editar — card de completude no dashboard + estado do wizard |
| `src/components/store-owner/StoreProfileTab.tsx` | Editar — botão para abrir wizard |

### UX
- Mobile-first, estilo carousel com animações suaves
- Progress bar no topo com dots clicáveis (só para passos já visitados)
- Ícone + título + subtítulo explicativo em cada passo
- Salva silenciosamente a cada avanço (sem botão "Salvar" explícito até a revisão)

