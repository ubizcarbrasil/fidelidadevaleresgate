

## Plano: Renomear menus e títulos para linguagem comercial

Atualizar os nomes dos menus, grupos e títulos de consoles em todos os sidebars e no header para uma nomenclatura mais comercial e profissional.

### Mapeamento de renomeação

**Títulos de Console (`AppLayout.tsx`)**
| Atual | Novo |
|-------|------|
| Painel Raiz | Central de Comando |
| Painel da Empresa | Gestão Corporativa |
| Painel da Marca | Gestão da Marca |
| Painel da Filial | Gestão Regional |
| Operador do Ponto de Venda | Terminal de Vendas |
| Portal do Parceiro | Meu Negócio |

**Headers dos Sidebars**
| Sidebar | Subtítulo Atual | Novo |
|---------|----------------|------|
| Root | Painel Raiz | Central de Comando |
| Tenant | Administrador da Empresa | Gestão Corporativa |
| Brand | Painel do Empreendedor | Gestão Estratégica |
| Branch | Administrador da Cidade | Gestão Regional |
| Operator | Operador PDV | Terminal de Vendas |

**Grupos do RootSidebar**
| Atual | Novo |
|-------|------|
| Jornadas | Guias Inteligentes |
| Estrutura | Organização |
| Identidade & Vitrine | Marca & Experiência |
| Validação | Aprovações |
| Operação | Gestão Comercial |
| Pontos | Programa de Fidelidade |
| Ganha-Ganha | Cashback Inteligente |
| Usuários e Permissões | Equipe & Acessos |
| CRM Estratégico | Inteligência de Clientes |
| Plataforma | Configurações Avançadas |

**Grupos do BrandSidebar**
| Atual | Novo |
|-------|------|
| Configure | Personalização |
| Páginas do App | Vitrine Digital |
| Validação | Aprovações |
| Operação | Gestão Comercial |
| Jornada | Guias Inteligentes |
| Pontos | Programa de Fidelidade |
| Usuários e Permissões | Equipe & Acessos |
| Relatórios | Inteligência & Dados |
| Ganha-Ganha | Cashback Inteligente |
| CRM Estratégico | Inteligência de Clientes |
| Técnico | Integrações & API |

**Grupos do BranchSidebar**
| Atual | Novo |
|-------|------|
| Operações | Gestão Comercial |
| Programa de Pontos | Programa de Fidelidade |
| Análises | Inteligência & Dados |

**Grupos do TenantSidebar** (remover emojis também)
| Atual | Novo |
|-------|------|
| 📊 Visão Geral | Visão Geral |
| 🏢 Estrutura | Organização |
| 🏪 Operações | Gestão Comercial |
| 👥 Usuários | Equipe |
| 📈 Análises | Inteligência & Dados |

**Items renomeados (defaultTitle) nos sidebars**
| Atual | Novo |
|-------|------|
| Painel Principal | Visão Geral |
| Jornada Completa | Guia Completo |
| Jornada do Empreendedor | Guia do Empreendedor |
| Jornada do Emissor | Guia do Emissor |
| Clonar Cidade | Duplicar Região |
| Provisionar Marca | Nova Marca |
| Central de Acessos | Gestão de Acessos |
| Galeria de Ícones / Ícones | Biblioteca de Ícones |
| Ícones do App | Ícones do Aplicativo |
| Central de Propagandas | Mídia & Banners |
| Nomes e Rótulos | Nomenclaturas |
| Construtor de Páginas | Editor de Páginas |
| Tour de Boas-Vindas | Boas-Vindas |
| LP de Parceiros | Landing Page Parceiros |
| Aprovação de Parceiros | Aprovar Parceiros |
| Aprovar Regras | Validar Regras |
| Solicitações de Emissor | Solicitações de Upgrade |
| Operador PDV | Caixa PDV |
| Importar Planilha | Importação de Dados |
| Achadinhos | Descobertas |
| Categorias Achadinhos | Categorias de Descobertas |
| Regras de Pontos | Regras de Fidelidade |
| Extrato de Pontos | Extrato de Fidelidade |
| Configuração GG | Config. Cashback |
| Painel Financeiro GG | Financeiro Cashback |
| Fechamento Mensal | Fechamento Financeiro |
| Dashboard Consolidado | Painel Cashback |
| Resumo Loja GG | Resumo Cashback |
| Módulos da Marca | Recursos Ativos |
| Permissões por Empresa | Controle de Acesso |
| Permissões dos Parceiros | Controle de Parceiros |
| Permissões Globais | Políticas de Acesso |
| Funcionalidades | Módulos |
| Seções da Home | Seções Iniciais |
| Modelos de Home | Templates |
| Controle de Recursos | Feature Flags |
| Atualizações | Novidades |
| Kit Inicial | Starter Kit |
| Teste Webhook | Lab Webhook |
| TaxiMachine | Integração Mobilidade |
| Configurações da Marca | Configurações |
| Integrações API | APIs & Integrações |
| CRM Estratégico | Inteligência CRM |
| Jornada do Cliente | Jornada CRM |
| Cards de Oferta | Layout de Ofertas |
| Pontuar Cliente | Registrar Pontos |
| Validar Resgate | Confirmar Resgate |

**`useMenuLabels.ts` defaults** — atualizar os mesmos nomes no `DEFAULT_LABELS` para consistência.

### Arquivos a editar

| Arquivo | Escopo |
|---------|--------|
| `src/components/AppLayout.tsx` | CONSOLE_TITLES |
| `src/components/consoles/RootSidebar.tsx` | Group labels + defaultTitles |
| `src/components/consoles/BrandSidebar.tsx` | Group labels + defaultTitles + header subtitle |
| `src/components/consoles/BranchSidebar.tsx` | Group labels + defaultTitles + header subtitle |
| `src/components/consoles/TenantSidebar.tsx` | Group labels (remover emojis) + titles + header subtitle |
| `src/components/consoles/OperatorSidebar.tsx` | Item titles + header subtitle |
| `src/hooks/useMenuLabels.ts` | DEFAULT_LABELS |

### Regras
- Zero alteração em lógica, rotas, queries
- Somente renomeação de strings visíveis ao usuário

