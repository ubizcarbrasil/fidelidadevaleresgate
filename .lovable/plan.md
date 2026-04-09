

# Atualização do Conteúdo de Ajuda Contextual (Botão ?)

## Situação Atual

O botão de interrogação (?) no canto inferior direito usa o arquivo `src/lib/helpContent.ts` para exibir ajuda contextual por rota. Atualmente:

- **~25 rotas** possuem conteúdo de ajuda
- **~45 rotas** NÃO possuem conteúdo — nessas páginas o botão simplesmente não aparece

### Rotas sem ajuda (principais grupos)

```text
FRANQUEADO (Branch)
├── /branch-wallet         (Carteira de Pontos)
├── /branch-reports        (Relatórios da Cidade)
├── /motoristas            (Gestão de Motoristas)
├── /driver-points-rules   (Regras de Pontos Motorista)
├── /points-packages-store (Loja de Pacotes)
└── /tier-points-rules     (Regras por Tier)

EMPREENDEDOR (Brand)
├── /brand-settings        (Configurações da Marca)
├── /brand-branches        (já existe ✓)
├── /brand-cidades-journey (Jornada Cidades)
├── /brand-api-journey     (Jornada API)
├── /brand-permissions     (Permissões do Parceiro)
├── /subscription          (Assinatura)
├── /partner-landing-config(Config Landing Parceiro)
├── /machine-integration   (Integração Machine)
├── /machine-webhook-test  (Teste Webhook)
├── /driver-config         (Config Painel Motorista)
├── /sponsored-placements  (Espaços Patrocinados)
├── /offer-card-config     (Config Card de Oferta)
├── /access-hub            (Hub de Acessos)
├── /points-packages       (Pacotes de Pontos)
└── /crm                   (CRM)

ACHADINHOS / MARKETPLACE
├── /affiliate-categories  (Categorias)
├── /mirror-sync           (Sincronização)
├── /offer-governance      (Governança)
├── /product-redemption-orders (Pedidos de Resgate)
├── /produtos-resgate      (Produtos Resgate)
└── /regras-resgate        (Regras de Resgate)

GANHA-GANHA
├── /ganha-ganha-config    (Configuração)
├── /ganha-ganha-billing   (Faturamento)
├── /ganha-ganha-closing   (Fechamento)
├── /ganha-ganha-dashboard (Dashboard Root)
└── /ganha-ganha-store-summary (Resumo Loja)

ROOT
├── /provision-brand       (Provisionar Marca)
├── /starter-kit           (Kit Inicial)
├── /platform-theme        (Tema da Plataforma)
├── /app-icons             (Ícones do App)
├── /plan-templates        (Templates de Planos)
├── /plan-pricing          (Preços de Planos)
├── /taxonomy              (Taxonomia)
├── /welcome-tour          (Tour de Boas-vindas)
└── /profile-links         (Links do Perfil)

OUTROS
├── /api-keys              (Chaves de API)
├── /api-docs              (Documentação API)
├── /emitter-requests      (Solicitações Emissores)
├── /page-builder-v2       (Montador V2)
├── /manuais               (Página de Manuais)
├── /city-onboarding       (Onboarding Cidade)
└── /driver                (Painel Motorista)
```

## Plano

### Passo 1 — Adicionar conteúdo de ajuda para todas as rotas faltantes
**Arquivo**: `src/lib/helpContent.ts`

Adicionar entradas para cada uma das ~45 rotas listadas acima, seguindo o mesmo formato existente (título, resumo, passos e dicas). O conteúdo será escrito em português, descritivo e orientado ao usuário final de cada console (Root, Brand, Branch).

### Passo 2 — Revisar e atualizar conteúdo existente
Verificar se as entradas já existentes estão atualizadas com as funcionalidades mais recentes (ex: reset granular em `/brand-branches` já está atualizado, mas conferir se `/gamificacao-admin` inclui apostas laterais — já inclui).

### Detalhe Técnico
- Apenas o arquivo `src/lib/helpContent.ts` será editado
- O `ContextualHelpDrawer` já funciona para qualquer rota — basta adicionar o conteúdo
- A função `getHelpForRoute` já suporta match exato e por base path (`/brands/123` → `/brands`)
- Nenhuma migração de banco ou mudança de componente é necessária

### Impacto
- O botão `?` passará a aparecer em **todas as páginas** do sistema
- Cada página terá instruções contextuais relevantes para o usuário

