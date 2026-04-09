/**
 * Conteúdo de ajuda contextual para cada rota/funcionalidade do sistema.
 * Cada entrada contém título, descrição resumida e passos didáticos.
 */

export interface HelpSection {
  title: string;
  summary: string;
  steps: string[];
  tips?: string[];
}

export interface HelpEntry {
  pageTitle: string;
  sections: HelpSection[];
}

const helpContent: Record<string, HelpEntry> = {
  /* ═══════════════════════════════════════════════
     DASHBOARD (comum a todos os consoles)
     ═══════════════════════════════════════════════ */
  "/": {
    pageTitle: "Painel Principal",
    sections: [
      {
        title: "Visão Geral",
        summary: "O Painel Principal exibe os números mais importantes da sua operação em tempo real.",
        steps: [
          "Os indicadores no topo mostram: resgates do dia, pontos emitidos, clientes ativos e ofertas ativas.",
          "A etiqueta 'Tempo real' indica que os números são atualizados automaticamente.",
          "Use os gráficos para acompanhar tendências de resgates e pontuação ao longo do tempo.",
        ],
        tips: [
          "Clique em qualquer indicador para ver detalhes na página correspondente.",
          "Os dados são filtrados automaticamente pelo seu nível de acesso (marca/cidade).",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     BRAND ADMIN — Identidade Visual
     ═══════════════════════════════════════════════ */
   "/brands": {
    pageTitle: "Aparência e Identidade da Marca",
    sections: [
      {
        title: "Personalizar a identidade visual",
        summary: "Configure cores, logotipo e estilo que serão aplicados no aplicativo do cliente.",
        steps: [
          "Selecione a marca que deseja editar na lista.",
          "Envie o logotipo da marca (recomendado: imagem PNG transparente, 512×512 pixels).",
          "Defina as cores primária, secundária e de destaque.",
          "Clique em 'Salvar' para aplicar as alterações.",
        ],
        tips: [
          "Use a pré-visualização ao lado para ver como ficará no aplicativo do cliente antes de salvar.",
          "As alterações de visual são aplicadas imediatamente em todas as telas do aplicativo.",
        ],
      },
    ],
  },

   "/domains": {
    pageTitle: "Endereços Personalizados (Domínios)",
    sections: [
      {
        title: "Configurar endereço personalizado",
        summary: "Associe um endereço web próprio (ex: app.suamarca.com.br) à sua marca.",
        steps: [
          "Clique em 'Adicionar domínio'.",
          "Digite o endereço desejado (ex: app.suamarca.com.br).",
          "Configure o apontamento no seu provedor de hospedagem (registro CNAME) para o endereço fornecido pelo sistema.",
          "Aguarde a verificação automática (pode levar até 48 horas).",
          "Marque como endereço principal quando estiver verificado.",
        ],
        tips: [
          "Você pode ter múltiplos domínios, mas apenas um pode ser o primário.",
        ],
      },
    ],
  },

   "/icon-library": {
    pageTitle: "Galeria de Ícones e Imagens",
    sections: [
      {
        title: "Gerenciar ícones",
        summary: "Adicione e organize os ícones usados nas seções e categorias do aplicativo.",
        steps: [
          "Escolha entre ícones prontos do sistema ou envie imagens personalizadas.",
          "Defina nome, categoria e cor para cada ícone.",
          "Ative ou desative ícones conforme necessário.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     BRAND ADMIN — Vitrine do App
     ═══════════════════════════════════════════════ */
   "/templates": {
    pageTitle: "Seções da Tela Inicial",
    sections: [
      {
        title: "Montar a Tela Inicial do aplicativo",
        summary: "Configure quais seções aparecem na tela inicial do cliente e em que ordem.",
        steps: [
          "Arraste as seções para reordená-las.",
          "Clique no ícone de edição para configurar cada seção: título, subtítulo, modo de exibição (carrossel ou grade), filtros e quantidade de itens.",
          "Use o botão de ligar/desligar para ativar ou desativar seções sem excluí-las.",
          "Configure filtros de cidade, tipo de cupom e modo de ordenação (recentes, mais resgatados, etc.).",
        ],
        tips: [
          "Use 'Filtro de modo' para controlar como os itens são ordenados automaticamente.",
          "O campo 'Colunas' define quantos itens aparecem lado a lado na grade.",
        ],
      },
    ],
  },

   "/banner-manager": {
    pageTitle: "Central de Propagandas (Banners)",
    sections: [
      {
        title: "Gerenciar propagandas visuais",
        summary: "Crie imagens promocionais com agendamento que aparecem no carrossel da tela inicial.",
        steps: [
          "Clique em 'Nova propaganda'.",
          "Envie a imagem (tamanho recomendado: 1080×540 pixels).",
          "Defina título, destino ao clicar e tipo de destino (site externo, página interna ou oferta).",
          "Configure as datas de início e fim para agendamento.",
          "Reordene as propagandas arrastando-as na lista.",
        ],
        tips: [
          "Propagandas com data vencida são ocultadas automaticamente do aplicativo.",
          "Use imagens com boa legibilidade em telas pequenas.",
        ],
      },
    ],
  },

  "/menu-labels": {
    pageTitle: "Nomes e Rótulos",
    sections: [
      {
        title: "Personalizar textos do aplicativo",
        summary: "Altere os nomes dos menus e botões que o cliente vê no aplicativo.",
        steps: [
          "Selecione o contexto: 'Painel Administrativo' (menu lateral) ou 'Aplicativo do Cliente'.",
          "Clique em qualquer nome para editá-lo.",
          "Digite o novo nome e clique em 'Salvar'.",
        ],
        tips: [
          "Se deixar em branco, o sistema usará o nome padrão.",
          "Essa personalização permite adaptar o app à linguagem da sua marca.",
        ],
      },
    ],
  },

   "/page-builder": {
    pageTitle: "Montador de Páginas",
    sections: [
      {
        title: "Criar páginas personalizadas",
        summary: "Monte páginas sob medida com texto, imagens, botões e separadores.",
        steps: [
          "Clique em 'Nova página'.",
          "Defina o título e o endereço da página (ex: /p/sua-pagina).",
          "Adicione elementos arrastando da barra lateral: Texto, Botão, Imagem, Ícone, Linha Divisória, Espaço.",
          "Configure cada elemento: cor, tamanho, ação ao clicar, sombra e transparência.",
          "Ative 'Publicar' quando a página estiver pronta.",
        ],
        tips: [
          "Use a pré-visualização ao vivo para ver exatamente como ficará no celular.",
          "Páginas não publicadas ficam acessíveis apenas para administradores.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     OPERAÇÕES
     ═══════════════════════════════════════════════ */
   "/branches": {
    pageTitle: "Cidades",
    sections: [
      {
        title: "Gerenciar cidades",
        summary: "Cidades representam as regiões onde a sua marca opera.",
        steps: [
          "Clique em 'Nova cidade' para criar.",
          "Preencha: nome, apelido (usado no endereço web), cidade, estado e localização geográfica.",
          "Selecione o fuso horário correto.",
          "Ative ou desative cidades conforme necessário.",
        ],
        tips: [
          "A localização é usada para mostrar parceiros e ofertas mais próximas do cliente no aplicativo.",
          "Cada cidade pode ter suas próprias regras de pontos e configurações.",
        ],
      },
    ],
  },

  "/stores": {
    pageTitle: "Parceiros",
    sections: [
      {
        title: "Gerenciar parceiros",
        summary: "Visualize e gerencie os estabelecimentos parceiros cadastrados na sua cidade.",
        steps: [
          "Use a barra de busca para encontrar parceiros por nome.",
          "Clique em um parceiro para ver detalhes: perfil, funcionários, extrato e cupons.",
          "Altere a situação (ativa/inativa) para controlar a visibilidade no aplicativo.",
        ],
      },
    ],
  },

  "/store-approvals": {
    pageTitle: "Aprovação de Parceiros",
    sections: [
      {
        title: "Aprovar cadastros de parceiros",
        summary: "Revise e aprove novos estabelecimentos que se registraram na plataforma.",
        steps: [
          "Parceiros pendentes aparecem automaticamente nesta lista.",
          "Clique em 'Aprovar' para ativar o parceiro ou 'Rejeitar' para recusar.",
          "Após aprovação, o parceiro poderá criar cupons e receber clientes.",
        ],
      },
    ],
  },

  "/csv-import": {
    pageTitle: "Importar CSV",
    sections: [
      {
        title: "Importação em lote",
        summary: "Importe parceiros e dados em grande quantidade usando planilhas (arquivo CSV).",
        steps: [
          "Baixe o modelo de planilha clicando em 'Baixar modelo'.",
          "Preencha os dados seguindo o formato do modelo.",
          "Envie o arquivo preenchido.",
          "Revise os erros (se houver) na tela de resultado.",
          "Corrija e reimporte os registros com erro.",
        ],
        tips: [
          "O arquivo deve estar no formato correto (codificação UTF-8).",
          "Campos obrigatórios estão destacados no modelo.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     PROGRAMA DE PONTOS
     ═══════════════════════════════════════════════ */
  "/points-rules": {
    pageTitle: "Regras de Pontos",
    sections: [
      {
        title: "Configurar regras de pontuação",
        summary: "Defina como os clientes acumulam pontos ao comprar nos parceiros.",
        steps: [
          "Configure a taxa base: quantos pontos por real gasto.",
          "Defina limites: máximo por compra, por dia (cliente) e por dia (parceiro).",
          "Configure quanto vale cada ponto em dinheiro.",
          "Defina se os parceiros podem criar regras próprias e quais os limites permitidos.",
          "Ative 'Exigir código de recibo' se desejar rastreabilidade extra.",
        ],
        tips: [
          "Regras personalizadas dos parceiros precisam de aprovação se a opção 'Requer aprovação' estiver ativada.",
          "O campo 'Compra mínima' define o valor mínimo para gerar pontos.",
        ],
      },
    ],
  },

  "/points-ledger": {
    pageTitle: "Extrato de Pontos",
    sections: [
      {
        title: "Consultar extrato",
        summary: "Visualize todas as transações de pontos da plataforma.",
        steps: [
          "Use os filtros de data para definir o período.",
          "Filtre por tipo: pontuação (crédito) ou resgate (débito).",
          "Clique em uma transação para ver detalhes como parceiro, valor da compra e regra aplicada.",
        ],
      },
    ],
  },

  "/earn-points": {
    pageTitle: "Pontuar",
    sections: [
      {
        title: "Registrar pontuação para cliente",
        summary: "Registre pontos para um cliente após uma compra no parceiro.",
        steps: [
          "Selecione o parceiro que está pontuando.",
          "Busque o cliente por nome ou telefone.",
          "Informe o valor da compra.",
          "Se exigido, informe o código do recibo.",
          "Confira o cálculo dos pontos e clique em 'Confirmar'.",
        ],
        tips: [
          "O sistema verifica automaticamente os limites diários e por compra.",
          "Códigos de recibo repetidos são bloqueados para evitar fraudes.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     OFERTAS / VOUCHERS / RESGATES
     ═══════════════════════════════════════════════ */
  "/offers": {
    pageTitle: "Ofertas",
    sections: [
      {
        title: "Gerenciar ofertas e cupons",
        summary: "Crie e gerencie cupons de desconto para os clientes.",
        steps: [
          "Clique em 'Nova oferta' para iniciar o assistente de criação passo a passo.",
          "Preencha: título, descrição, valor de resgate, compra mínima.",
          "Configure dias da semana, horários e limites de uso.",
          "Defina o período de validade (início e fim).",
          "Revise os termos e publique a oferta.",
        ],
        tips: [
          "Ofertas em 'Rascunho' ficam invisíveis para os clientes.",
          "Use 'Valores escalonados' para criar cupons progressivos.",
        ],
      },
    ],
  },

  "/vouchers": {
    pageTitle: "Vouchers",
    sections: [
      {
        title: "Gerenciar vouchers",
        summary: "Vouchers são códigos promocionais que podem ser distribuídos.",
        steps: [
          "Crie um novo voucher definindo código, valor e regras de uso.",
          "Configure limites: usos totais, por cliente e intervalo entre usos.",
          "Defina público-alvo e período de validade.",
          "Distribua o código para os clientes desejados.",
        ],
      },
    ],
  },

  "/redemptions": {
    pageTitle: "Resgates",
    sections: [
      {
        title: "Acompanhar resgates",
        summary: "Visualize todos os resgates realizados pelos clientes.",
        steps: [
          "A lista mostra resgates com status: Pendente, Usado, Expirado.",
          "Clique em um resgate para ver: oferta, cliente, código de resgate, valor aplicado.",
          "Use filtros de data e status para encontrar resgates específicos.",
        ],
        tips: [
          "Resgates pendentes expiram automaticamente após o prazo configurado.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     CLIENTES
     ═══════════════════════════════════════════════ */
  "/customers": {
    pageTitle: "Clientes",
    sections: [
      {
        title: "Gerenciar clientes",
        summary: "Visualize e gerencie a base de clientes cadastrados.",
        steps: [
          "Use a busca para encontrar clientes por nome ou telefone.",
          "Clique em um cliente para ver: saldo de pontos, histórico de resgates e pontuações.",
          "Altere a situação do cliente (ativo/inativo) se necessário.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     USUÁRIOS & PERMISSÕES
     ═══════════════════════════════════════════════ */
  "/users": {
    pageTitle: "Usuários",
    sections: [
      {
        title: "Gerenciar usuários administrativos",
        summary: "Cadastre e gerencie os usuários que acessam o painel admin.",
        steps: [
          "Clique em 'Novo usuário'.",
          "Preencha nome, e-mail e selecione o cargo/função do usuário.",
          "Atribua a marca e/ou cidade de acesso.",
          "O usuário receberá um e-mail para definir sua senha.",
        ],
        tips: [
          "Cada cargo define um conjunto de permissões padrão.",
          "Use exceções para conceder ou negar permissões específicas a um usuário.",
        ],
      },
    ],
  },

  "/brand-modules": {
    pageTitle: "Módulos",
    sections: [
      {
        title: "Ativar ou desativar funcionalidades",
        summary: "Controle quais funcionalidades estão disponíveis na sua marca.",
        steps: [
          "A lista mostra todas as funcionalidades disponíveis com botão de ligar/desligar.",
          "Ative uma funcionalidade para habilitar o menu e os recursos correspondentes.",
          "Desative funcionalidades que não são usadas para simplificar o menu.",
        ],
        tips: [
          "Funcionalidades desativadas escondem o menu correspondente em todos os painéis da marca.",
          "Funcionalidades essenciais (obrigatórias) não podem ser desativadas.",
        ],
      },
    ],
  },

  "/audit": {
    pageTitle: "Auditoria",
    sections: [
      {
        title: "Rastrear atividades",
        summary: "Acompanhe tudo o que foi feito por usuários na plataforma.",
        steps: [
          "Use filtros de data, tipo de entidade e ação para refinar a busca.",
          "Cada registro mostra: quem fez, o que fez, quando e quais dados mudaram.",
          "Clique em uma entrada para ver o 'antes e depois' das alterações.",
        ],
        tips: [
          "Os registros são filtrados automaticamente pelo seu nível de acesso.",
          "Administradores de marca veem apenas ações da sua marca.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     RELATÓRIOS
     ═══════════════════════════════════════════════ */
   "/reports": {
    pageTitle: "Relatórios e Análises",
    sections: [
      {
        title: "Visualizar relatórios",
        summary: "Acesse relatórios de performance, anti-fraude e gráficos.",
        steps: [
          "Selecione a aba desejada: Desempenho, Prevenção de Fraude ou Gráficos.",
          "Em 'Desempenho por Cupom': veja resgates, taxa de conversão e valor total por oferta.",
          "Em 'Prevenção de Fraude': identifique recibos duplicados e movimentações suspeitas.",
          "Em 'Gráficos': analise tendências com gráficos de barras, linhas e pizza.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     PORTAL DO PARCEIRO (STORE_ADMIN)
     ═══════════════════════════════════════════════ */
  "/store-panel": {
    pageTitle: "Portal do Parceiro",
    sections: [
      {
        title: "Visão geral do portal",
        summary: "O portal do parceiro é o centro de controle do seu estabelecimento dentro da marca.",
        steps: [
          "No topo, veja os indicadores: resgates pendentes, cupons ativos e clientes atendidos.",
          "Use as abas inferiores para navegar entre as funcionalidades.",
        ],
      },
      {
        title: "Criar um cupom",
        summary: "O assistente guiará você passo a passo na criação do seu cupom.",
        steps: [
          "Clique em 'Novo Cupom' na aba de Cupons.",
          "Passo 1 — Categoria: escolha a categoria do cupom (alimentação, serviço, etc.).",
          "Passo 2 — Tipo: defina se é desconto fixo, percentual ou valor de resgate.",
          "Passo 3 — Valor: configure os valores e escalonamento.",
          "Passo 4 — Validade: defina datas de início e fim.",
          "Passo 5 — Dias/Horários: selecione quando o cupom pode ser resgatado.",
          "Passo 6 — Limites: configure máximos de uso por cliente, por dia e total.",
          "Passo 7 — Agendamento: defina se requer agendamento prévio.",
          "Passo 8 — Cumulativo: permita ou não acumular com outros cupons.",
          "Passo 9 — Tipo de resgate: presencial, online ou ambos.",
          "Passo 10 — Termos: aceite os termos e condições.",
          "Passo 11 — Revisão: confira tudo e publique.",
        ],
        tips: [
          "Cupons em rascunho podem ser editados a qualquer momento.",
          "Após ativar, alterações incrementam a versão dos termos.",
        ],
      },
      {
        title: "Validar um resgate (dar baixa)",
        summary: "Quando um cliente apresentar um cupom, confirme usando o código de 6 dígitos e o CPF.",
        steps: [
          "Acesse a aba 'Resgate'.",
          "Peça ao cliente o código de resgate de 6 dígitos.",
          "Digite o código e o CPF do cliente.",
          "Informe o valor da compra.",
          "Confirme o resgate — o crédito será aplicado automaticamente.",
        ],
        tips: [
          "O sistema calcula automaticamente o valor do crédito com base nas regras do cupom.",
          "Resgates confirmados não podem ser revertidos.",
        ],
      },
      {
        title: "Gerenciar perfil do estabelecimento",
        summary: "Mantenha as informações públicas do seu estabelecimento atualizadas.",
        steps: [
          "Acesse a aba 'Perfil'.",
          "Edite: nome, descrição, fotos, vídeo de apresentação.",
          "Atualize endereço e informações de contato.",
          "Clique em 'Salvar' para publicar as alterações.",
        ],
      },
      {
        title: "Gerenciar funcionários",
        summary: "Cadastre operadores que poderão validar resgates no seu estabelecimento.",
        steps: [
          "Acesse a aba 'Funcionários'.",
          "Clique em 'Adicionar funcionário'.",
          "Informe nome e e-mail do funcionário.",
          "O funcionário receberá acesso ao módulo de resgate.",
        ],
      },
      {
        title: "Extrato financeiro",
        summary: "Acompanhe todas as transações do seu estabelecimento.",
        steps: [
          "Acesse a aba 'Extrato'.",
          "Veja os indicadores no topo: total de resgates, pontos emitidos, valor creditado.",
          "Use filtros de período, tipo e status para refinar a lista.",
          "Clique em uma transação para ver detalhes completos.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     STORE POINTS RULE
     ═══════════════════════════════════════════════ */
  "/store-points-rule": {
    pageTitle: "Minha Regra de Pontos",
    sections: [
      {
        title: "Configurar regra de pontos do parceiro",
        summary: "Defina a sua própria taxa de pontuação (quando permitido pela marca).",
        steps: [
          "Veja a regra da marca (base) e os limites permitidos.",
          "Ajuste o valor de 'Pontos por real' dentro da faixa permitida.",
          "Salve — a regra pode precisar de aprovação antes de entrar em vigor.",
        ],
      },
    ],
  },

  "/approve-store-rules": {
    pageTitle: "Aprovar Regras de Pontos",
    sections: [
      {
        title: "Aprovar regras personalizadas",
        summary: "Revise e aprove regras de pontos criadas pelos parceiros.",
        steps: [
          "Regras pendentes aparecem automaticamente nesta lista.",
          "Revise os valores propostos pelo parceiro.",
          "Clique em 'Aprovar' ou 'Rejeitar'.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     NOTIFICAÇÕES
     ═══════════════════════════════════════════════ */
   "/send-notification": {
    pageTitle: "Comunicação — Notificações e Mensagens",
    sections: [
      {
        title: "Notificação Push para clientes",
        summary: "Envie mensagens diretamente para os celulares dos clientes via push notification.",
        steps: [
          "Selecione a aba 'Notificação Push'.",
          "Defina o título e o corpo da mensagem.",
          "Selecione o público-alvo: todos ou filtrado por cidade.",
          "Clique em 'Enviar'.",
        ],
        tips: [
          "Mensagens curtas e diretas geram melhor engajamento.",
          "Evite enviar muitas notificações no mesmo dia.",
        ],
      },
      {
        title: "Mensagens via Machine (Motoristas)",
        summary: "Envie mensagens para motoristas via TaxiMachine com templates dinâmicos e fluxos automáticos.",
        steps: [
          "Selecione a aba 'Mensagens via Machine'.",
          "Na sub-aba 'Templates', crie modelos com variáveis: {{nome}}, {{pontos}}, {{saldo}}, {{adversario}}, etc.",
          "Na sub-aba 'Fluxos', configure disparos automáticos para eventos de gamificação e apostas.",
          "Na sub-aba 'Envio Manual', envie mensagens em massa ou individual.",
          "Na sub-aba 'Relatório', acompanhe métricas de entrega e logs.",
        ],
        tips: [
          "Teste templates com envio individual antes de disparar em massa.",
          "Configure fluxos para eventos de apostas (SIDE_BET_CREATED, SIDE_BET_ACCEPTED).",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     REGISTRO DE PARCEIRO
     ═══════════════════════════════════════════════ */
   "/register-store": {
    pageTitle: "Cadastro de Parceiro",
    sections: [
      {
        title: "Registrar seu estabelecimento como parceiro",
        summary: "Siga o passo a passo para cadastrar seu estabelecimento na marca.",
        steps: [
          "Preencha os dados do responsável: nome completo, CPF, telefone.",
          "Informe os dados da empresa: CNPJ, razão social, nome fantasia.",
          "Adicione endereço completo e categoria de atuação.",
          "Envie o logotipo do estabelecimento.",
          "Aceite os termos de uso e envie o cadastro para análise.",
        ],
        tips: [
          "Após o cadastro, seu estabelecimento passará por aprovação antes de ficar ativo.",
          "Você receberá um e-mail quando o estabelecimento for aprovado.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     AFFILIATE DEALS
     ═══════════════════════════════════════════════ */
  "/affiliate-deals": {
    pageTitle: "Ofertas de Afiliados",
    sections: [
      {
        title: "Gerenciar ofertas de parceiros",
        summary: "Crie ofertas com links de parceiros para produtos e serviços.",
        steps: [
          "Clique em 'Nova oferta'.",
          "Preencha: título, descrição, preço e endereço do parceiro.",
          "Envie a imagem do produto.",
          "Defina categoria e ordem de exibição.",
          "Ative a oferta para torná-la visível.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     CATÁLOGO DO PARCEIRO
     ═══════════════════════════════════════════════ */
  "/store-catalog": {
    pageTitle: "Catálogo de Produtos",
    sections: [
      {
        title: "Gerenciar catálogo",
        summary: "Adicione e organize os produtos/serviços do seu estabelecimento.",
        steps: [
          "Clique em 'Adicionar item'.",
          "Preencha: nome, descrição, preço e imagem.",
          "Reordene os itens arrastando na lista.",
          "Ative/desative itens conforme a disponibilidade.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     PREVIEW DO CLIENTE
     ═══════════════════════════════════════════════ */
   "/customer-preview": {
    pageTitle: "Pré-visualização do Aplicativo",
    sections: [
      {
        title: "Ver o aplicativo como o cliente vê",
        summary: "Confira como o aplicativo aparece para os clientes finais.",
        steps: [
          "Navegue pelas seções da Tela Inicial para verificar a aparência.",
          "Teste ofertas, perfil de parceiro e funcionalidades de resgate.",
          "Use esta pré-visualização para validar alterações de visual e seções antes de publicar.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     TENANTS (ROOT)
     ═══════════════════════════════════════════════ */
   "/tenants": {
    pageTitle: "Empresas Parceiras (Tenants)",
    sections: [
      {
        title: "Gerenciar empresas parceiras",
        summary: "Empresas parceiras são os clientes (organizações) que utilizam a plataforma.",
        steps: [
          "Clique em 'Nova empresa' para cadastrar um novo cliente da plataforma.",
          "Preencha nome, apelido (usado no endereço web) e dados do responsável.",
          "Cada empresa pode ter múltiplas marcas e cidades.",
          "Ative ou desative empresas conforme a necessidade.",
        ],
        tips: [
          "O apelido é usado no endereço web e não pode ser alterado depois de criado.",
          "Desativar uma empresa desativa todas as marcas e cidades vinculadas automaticamente.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     PERMISSÕES
     ═══════════════════════════════════════════════ */
  "/permissions": {
    pageTitle: "Permissões",
    sections: [
      {
        title: "Gerenciar permissões por cargo",
        summary: "Configure quais ações cada cargo pode executar no sistema.",
        steps: [
          "Selecione um cargo na lista à esquerda.",
          "Marque ou desmarque as permissões desejadas.",
          "As permissões são agrupadas por módulo para facilitar a configuração.",
          "Clique em 'Salvar' para aplicar.",
        ],
        tips: [
          "Cargos do sistema não podem ser excluídos, mas suas permissões podem ser ajustadas.",
          "Alterações se aplicam imediatamente a todos os usuários com aquele cargo.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     MÓDULOS (ROOT)
     ═══════════════════════════════════════════════ */
   "/modules": {
    pageTitle: "Catálogo de Funcionalidades",
    sections: [
      {
        title: "Gerenciar funcionalidades da plataforma",
        summary: "Crie e configure as funcionalidades disponíveis para as marcas.",
        steps: [
          "Cada funcionalidade representa um recurso do sistema (ex: cupons, pontos, parceiros).",
          "Defina identificador, nome, categoria e descrição.",
          "Funcionalidades essenciais são obrigatórias e não podem ser desativadas pelas marcas.",
          "Use a configuração avançada para definir campos personalizáveis.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     FEATURE FLAGS
     ═══════════════════════════════════════════════ */
   "/flags": {
    pageTitle: "Controle de Recursos",
    sections: [
      {
        title: "Ligar ou desligar recursos específicos",
        summary: "Ative ou desative recursos específicos da plataforma sem precisar atualizar o sistema.",
        steps: [
          "Crie um novo controle com identificador e nome descritivo.",
          "Defina o alcance: toda a plataforma, por marca ou por cidade.",
          "Use o botão para ligar/desligar o recurso.",
          "O sistema verificará automaticamente o controle antes de exibir o recurso.",
        ],
        tips: [
          "Controles globais afetam toda a plataforma.",
          "Controles por marca ou cidade permitem ativar recursos de forma gradual.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     RELEASES
     ═══════════════════════════════════════════════ */
   "/releases": {
    pageTitle: "Histórico de Atualizações",
    sections: [
      {
        title: "Registrar versões do sistema",
        summary: "Documente novas versões e mudanças na plataforma.",
        steps: [
          "Clique em 'Nova atualização'.",
          "Informe o número da versão (ex: 1.2.0), título e descrição das mudanças.",
          "As atualizações ficam visíveis no histórico para referência de todos.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     HOME TEMPLATES
     ═══════════════════════════════════════════════ */
   "/home-templates": {
    pageTitle: "Modelos de Tela Inicial",
    sections: [
      {
        title: "Gerenciar modelos de Tela Inicial",
        summary: "Crie e aplique modelos prontos para a tela inicial do aplicativo do cliente.",
        steps: [
          "Visualize os modelos disponíveis na lista.",
          "Clique em um modelo para ver a pré-visualização.",
          "Use 'Aplicar modelo' para copiar seções para uma marca ou cidade.",
          "O campo 'Sobrescrever' define se seções existentes serão substituídas.",
        ],
        tips: [
          "Modelos marcados como 'padrão' são aplicados automaticamente em novas marcas.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     CLONE BRANCH
     ═══════════════════════════════════════════════ */
  "/clone-branch": {
    pageTitle: "Clonar Cidade",
    sections: [
      {
        title: "Duplicar configurações de uma cidade",
        summary: "Copie seções, regras e configurações de uma cidade para outra.",
        steps: [
          "Selecione a cidade de origem (que será copiada).",
          "Selecione a cidade de destino (que receberá a cópia).",
          "Escolha quais elementos copiar: seções, regras de pontos, etc.",
          "Confirme a operação.",
        ],
        tips: [
          "Dados existentes na cidade de destino podem ser sobrescritos — cuidado!",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     OPERADOR PDV
     ═══════════════════════════════════════════════ */
   "/pdv": {
    pageTitle: "Ponto de Venda — Validar Resgate",
    sections: [
      {
        title: "Validar resgate no ponto de venda",
        summary: "Use esta tela para confirmar e dar baixa nos resgates dos clientes.",
        steps: [
          "Peça o código de resgate de 6 dígitos ao cliente.",
          "Digite o código no campo indicado.",
          "O sistema exibirá os detalhes do resgate: oferta, valor, validade.",
          "Confirme o resgate para dar baixa.",
        ],
        tips: [
          "Códigos vencidos ou já utilizados são recusados automaticamente.",
          "Em caso de dúvida, consulte o extrato de resgates.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     GAMIFICAÇÃO — DUELOS ENTRE MOTORISTAS
     ═══════════════════════════════════════════════ */
  "/gamificacao-admin": {
    pageTitle: "Gamificação — Duelos entre Motoristas",
    sections: [
      {
        title: "Configuração do Módulo",
        summary: "Ative e configure duelos, ranking e cinturão individualmente para cada cidade.",
        steps: [
          "Na aba 'Configuração', use os toggles para ativar ou desativar cada funcionalidade.",
          "Defina a duração mínima e máxima dos duelos em horas.",
          "Configure o número máximo de duelos simultâneos por motorista.",
          "Escolha a métrica de competição: corridas ou pontos.",
          "Personalize as frases de recusa com humor leve.",
          "Clique em 'Salvar configuração' para aplicar.",
        ],
        tips: [
          "Cada funcionalidade é independente — ative apenas o que fizer sentido para sua cidade.",
          "Comece com duelos curtos (24h) para testar o engajamento.",
        ],
      },
      {
        title: "Gerenciamento de Duelos",
        summary: "Acompanhe todos os duelos criados na cidade, filtre por status e monitore placares.",
        steps: [
          "Acesse a aba 'Duelos' para ver todos os desafios.",
          "Duelos são organizados por status: Pendente, Ao Vivo, Encerrado, Recusado.",
          "Placares ao vivo são atualizados automaticamente a cada 30 segundos.",
          "Apenas corridas FINALIZED dentro do período do duelo são contabilizadas.",
        ],
        tips: [
          "A contagem de corridas é totalmente automática — não é necessária intervenção manual.",
          "Dados operacionais dos motoristas são preservados em sigilo.",
        ],
      },
      {
        title: "Apostas Laterais (Side Bets)",
        summary: "Monitore apostas P2P em duelos: criação, aceitação, contrapropostas, escrow e resultados.",
        steps: [
          "Acesse a aba 'Apostas' para visualizar todas as apostas ativas e encerradas.",
          "Cada aposta mostra apostadores, pontos, palpite, status e resultado.",
          "Apostas suportam contrapropostas — o oponente pode negociar o valor.",
          "Pontos são reservados em escrow ao aceitar: 90% para o apostador vencedor, 10% de bônus para o duelista vencedor.",
          "Em empate, pontos são devolvidos integralmente.",
        ],
        tips: [
          "Monitore apostas para garantir integridade das competições.",
          "Configure templates de mensagem Machine para eventos de aposta.",
        ],
      },
      {
        title: "Ranking e Cinturão",
        summary: "Acompanhe o ranking mensal dos motoristas e o campeão do cinturão da cidade.",
        steps: [
          "Na aba 'Ranking', veja a classificação dos motoristas por corridas ou pontos.",
          "O ranking também exibe a rentabilidade dos apostadores.",
          "Na aba 'Cinturão', visualize o campeão atual e seu recorde.",
          "O cinturão é atualizado automaticamente quando um novo recordista surge.",
        ],
        tips: [
          "Divulgue o top 3 do ranking e o campeão do cinturão para aumentar o engajamento.",
          "Motoristas usam apelidos públicos, preservando a identidade real.",
        ],
      },
      {
        title: "Moderação de Apelidos",
        summary: "Edite apelidos públicos inadequados para manter um ambiente respeitoso.",
        steps: [
          "Na aba 'Moderação', visualize todos os apelidos dos motoristas participantes.",
          "Identifique e edite apelidos ofensivos ou inadequados.",
          "As alterações são aplicadas imediatamente.",
        ],
      },
      {
        title: "Privacidade e Segurança",
        summary: "O módulo preserva completamente a privacidade dos dados operacionais dos motoristas.",
        steps: [
          "Motoristas competem usando apelidos — nomes reais não são exibidos.",
          "Apenas totais agregados de corridas são usados, sem detalhes de rotas ou valores.",
          "A API retorna somente contagens, sem expor dados individuais de viagens.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     MINHAS CIDADES (BRAND-BRANCHES)
     ═══════════════════════════════════════════════ */
  "/brand-branches": {
    pageTitle: "Minhas Cidades",
    sections: [
      {
        title: "Gerenciar cidades da marca",
        summary: "Visualize, edite e gerencie as cidades onde sua marca opera, com ações rápidas de reset e edição.",
        steps: [
          "Acesse 'Minhas Cidades' no menu lateral.",
          "Visualize todas as cidades com status ativo/inativo.",
          "Use o botão 'Editar' para abrir a tela de edição (nome, slug, geolocalização, scoring model).",
          "Use o botão 'Resetar pontos' para abrir o diálogo de reset granular.",
        ],
        tips: [
          "Os botões 'Resetar pontos' e 'Editar' estão visíveis diretamente na listagem para acesso rápido.",
        ],
      },
      {
        title: "Resetar pontos da cidade",
        summary: "Zere saldos de pontos de forma granular: todos, motoristas, clientes ou usuário específico.",
        steps: [
          "Clique em 'Resetar pontos' na cidade desejada.",
          "Escolha o escopo: todos os usuários, apenas motoristas, apenas clientes ou um usuário específico.",
          "Confirme a operação — os pontos serão zerados e registrados como BRANCH_RESET no extrato.",
          "Consulte o histórico de resets no mesmo diálogo (data, escopo, total zerado).",
        ],
        tips: [
          "O reset é irreversível — confirme com cuidado.",
          "O reset também está disponível dentro da tela de edição da cidade.",
          "Use o reset individual para corrigir saldos sem afetar os demais.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     FRANQUEADO (BRANCH) — Rotas adicionais
     ═══════════════════════════════════════════════ */
  "/branch-wallet": {
    pageTitle: "Carteira de Pontos da Cidade",
    sections: [
      {
        title: "Gerenciar carteira de pontos",
        summary: "Controle o saldo de pontos disponíveis para distribuição na sua cidade.",
        steps: [
          "Visualize o saldo atual, total distribuído e total carregado no topo da página.",
          "Consulte o extrato de transações da carteira (cargas e distribuições).",
          "Solicite recarga de pontos quando o saldo estiver baixo.",
        ],
        tips: [
          "Configure o alerta de saldo baixo para ser notificado antes de ficar sem pontos.",
          "Cada distribuição de pontos é registrada automaticamente no extrato.",
        ],
      },
    ],
  },

  "/branch-reports": {
    pageTitle: "Relatórios da Cidade",
    sections: [
      {
        title: "Visualizar relatórios da cidade",
        summary: "Acesse dados de desempenho, resgates e movimentações da sua cidade.",
        steps: [
          "Selecione o período desejado usando os filtros de data.",
          "Navegue pelas abas para ver diferentes tipos de relatórios.",
          "Analise gráficos de tendência e tabelas detalhadas.",
        ],
        tips: [
          "Os dados são filtrados automaticamente pela sua cidade.",
          "Exporte relatórios para planilha quando necessário.",
        ],
      },
    ],
  },

  "/motoristas": {
    pageTitle: "Gestão de Motoristas",
    sections: [
      {
        title: "Gerenciar motoristas",
        summary: "Visualize e gerencie os motoristas cadastrados na sua cidade.",
        steps: [
          "Use a busca para encontrar motoristas por nome, telefone ou ID externo.",
          "Clique em um motorista para ver detalhes: saldo, histórico e corridas.",
          "Ative ou desative motoristas conforme necessário.",
          "Use filtros para segmentar por tier ou status.",
        ],
        tips: [
          "Motoristas inativos não acumulam pontos automaticamente.",
          "O ID externo vincula o motorista ao sistema de corridas.",
        ],
      },
    ],
  },

  "/driver-points-rules": {
    pageTitle: "Regras de Pontos para Motoristas",
    sections: [
      {
        title: "Configurar regras de pontuação de motoristas",
        summary: "Defina como os motoristas acumulam pontos por corridas realizadas.",
        steps: [
          "Configure a taxa base: quantos pontos por corrida finalizada.",
          "Defina limites diários e por período.",
          "Configure bônus por metas (ex: X corridas = bônus extra).",
          "Salve as configurações para aplicar imediatamente.",
        ],
        tips: [
          "As regras são aplicadas automaticamente a cada corrida FINALIZED.",
          "Teste com valores baixos antes de ajustar para produção.",
        ],
      },
    ],
  },

  "/points-packages-store": {
    pageTitle: "Loja de Pacotes de Pontos",
    sections: [
      {
        title: "Comprar pacotes de pontos",
        summary: "Adquira pacotes de pontos para reabastecer a carteira da cidade.",
        steps: [
          "Visualize os pacotes disponíveis com preços e quantidades.",
          "Selecione o pacote desejado.",
          "Confirme a compra — os pontos serão creditados na carteira da cidade.",
        ],
        tips: [
          "Pacotes maiores geralmente oferecem melhor custo-benefício.",
          "O histórico de compras fica disponível na carteira de pontos.",
        ],
      },
    ],
  },

  "/tier-points-rules": {
    pageTitle: "Regras de Pontos por Tier",
    sections: [
      {
        title: "Configurar pontuação por nível (Tier)",
        summary: "Defina multiplicadores de pontos diferentes para cada nível de cliente.",
        steps: [
          "Visualize os tiers configurados pela marca.",
          "Defina o multiplicador de pontos para cada tier.",
          "Salve — clientes de tiers superiores receberão mais pontos automaticamente.",
        ],
        tips: [
          "Tiers incentivam clientes a subir de nível para ganhar mais benefícios.",
          "Os multiplicadores são aplicados sobre a regra base de pontos.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     EMPREENDEDOR (BRAND) — Rotas adicionais
     ═══════════════════════════════════════════════ */
  "/brand-settings": {
    pageTitle: "Configurações da Marca",
    sections: [
      {
        title: "Ajustar configurações gerais",
        summary: "Configure parâmetros gerais da sua marca: nome, slug, comportamento e integrações.",
        steps: [
          "Edite o nome e slug da marca.",
          "Configure parâmetros de comportamento (pontuação, resgates, notificações).",
          "Ajuste configurações avançadas no JSON de configurações.",
          "Salve para aplicar as alterações.",
        ],
        tips: [
          "Alterações no slug podem afetar links existentes.",
          "Use o JSON de configurações para ajustes finos não disponíveis na interface.",
        ],
      },
    ],
  },

  "/brand-cidades-journey": {
    pageTitle: "Jornada de Cidades",
    sections: [
      {
        title: "Acompanhar a jornada de implantação",
        summary: "Visualize o progresso de cada cidade na jornada de ativação.",
        steps: [
          "Veja o status de cada etapa: configuração, parceiros, ofertas, clientes.",
          "Siga as recomendações para avançar em cada etapa.",
          "Cidades com todas as etapas concluídas ficam marcadas como 'Pronta'.",
        ],
      },
    ],
  },

  "/brand-api-journey": {
    pageTitle: "Jornada de Integração API",
    sections: [
      {
        title: "Configurar integração via API",
        summary: "Siga o passo a passo para integrar seus sistemas à plataforma via API.",
        steps: [
          "Gere suas credenciais de API (chave e segredo).",
          "Configure o webhook para receber eventos.",
          "Teste a integração com o ambiente de sandbox.",
          "Ative a integração em produção.",
        ],
        tips: [
          "Consulte a documentação da API para detalhes técnicos.",
          "Teste cada endpoint antes de ir para produção.",
        ],
      },
    ],
  },

  "/brand-permissions": {
    pageTitle: "Permissões do Parceiro",
    sections: [
      {
        title: "Configurar permissões para parceiros",
        summary: "Defina o que os parceiros podem fazer no portal deles.",
        steps: [
          "Visualize a lista de permissões disponíveis.",
          "Ative ou desative cada permissão para a marca.",
          "Configure permissões específicas por cidade quando necessário.",
          "Salve para aplicar.",
        ],
        tips: [
          "Permissões restritivas dão mais controle mas reduzem autonomia dos parceiros.",
          "Ajuste permissões conforme o nível de maturidade dos parceiros.",
        ],
      },
    ],
  },

  "/subscription": {
    pageTitle: "Assinatura",
    sections: [
      {
        title: "Gerenciar plano e assinatura",
        summary: "Visualize seu plano atual, histórico de pagamentos e opções de upgrade.",
        steps: [
          "Veja os detalhes do plano atual: nome, preço, funcionalidades incluídas.",
          "Compare planos disponíveis para upgrade.",
          "Consulte o histórico de faturas e pagamentos.",
        ],
        tips: [
          "Upgrades são aplicados imediatamente.",
          "Consulte o suporte para planos personalizados.",
        ],
      },
    ],
  },

  "/partner-landing-config": {
    pageTitle: "Landing Page do Parceiro",
    sections: [
      {
        title: "Configurar página de cadastro de parceiros",
        summary: "Personalize a landing page onde novos parceiros se cadastram na sua marca.",
        steps: [
          "Configure título, subtítulo e imagens da página.",
          "Defina os campos obrigatórios no formulário de cadastro.",
          "Personalize cores e textos de acordo com a identidade da marca.",
          "Ative ou desative o cadastro público de parceiros.",
        ],
        tips: [
          "Uma landing page atrativa aumenta a conversão de novos parceiros.",
          "Teste a página em diferentes dispositivos antes de publicar.",
        ],
      },
    ],
  },

  "/machine-integration": {
    pageTitle: "Integração de Mobilidade",
    sections: [
      {
        title: "Credenciais da Matriz",
        summary: "Configure as credenciais de acesso à API da plataforma de mobilidade.",
        steps: [
          "Informe o usuário e senha de autenticação básica (Basic Auth).",
          "Informe a chave de API fornecida pela plataforma de mobilidade.",
          "Salve as credenciais — elas serão usadas por todas as cidades.",
        ],
        tips: [
          "Credenciais incorretas impedirão a pontuação automática.",
          "Altere as credenciais imediatamente caso suspeite de vazamento.",
        ],
      },
      {
        title: "Pontuar Passageiros e Motoristas",
        summary: "Configure a pontuação automática de passageiros e motoristas por corrida.",
        steps: [
          "Na aba 'Passageiro', configure como passageiros acumulam pontos.",
          "Na aba 'Motorista', vincule cidades e configure regras de pontuação.",
          "Ative a integração por cidade para iniciar a pontuação automática.",
        ],
      },
      {
        title: "Notificações e Mensagens",
        summary: "Configure notificações push e mensagens automáticas para motoristas.",
        steps: [
          "Na aba 'Notificações', configure templates e disparos automáticos.",
          "Na aba 'Mensagens', gerencie mensagens enviadas via plataforma de mobilidade.",
          "Configure fluxos automáticos por evento (corrida finalizada, meta atingida, etc.).",
        ],
      },
    ],
  },

  "/machine-webhook-test": {
    pageTitle: "Teste de Webhook",
    sections: [
      {
        title: "Testar integração via webhook",
        summary: "Simule eventos para testar se o webhook está configurado corretamente.",
        steps: [
          "Selecione o tipo de evento para simular.",
          "Preencha os dados do payload de teste.",
          "Clique em 'Enviar' para disparar o evento.",
          "Verifique o resultado e os logs de processamento.",
        ],
        tips: [
          "Use dados fictícios para não afetar registros reais.",
          "Verifique os logs após cada teste para identificar erros.",
        ],
      },
    ],
  },

  "/driver-config": {
    pageTitle: "Configuração do Painel Motorista",
    sections: [
      {
        title: "Personalizar o painel do motorista",
        summary: "Configure o que os motoristas veem e podem fazer no painel deles.",
        steps: [
          "Defina quais seções são visíveis no painel do motorista.",
          "Configure textos e labels personalizados.",
          "Ative ou desative funcionalidades específicas (extrato, ofertas, ranking).",
          "Salve para aplicar.",
        ],
      },
    ],
  },

  "/sponsored-placements": {
    pageTitle: "Espaços Patrocinados",
    sections: [
      {
        title: "Gerenciar espaços patrocinados",
        summary: "Configure posições de destaque no aplicativo para parceiros patrocinadores.",
        steps: [
          "Defina os espaços disponíveis (topo, destaque, banner lateral).",
          "Atribua parceiros a cada espaço patrocinado.",
          "Configure período de exibição e prioridade.",
          "Ative ou desative espaços conforme necessário.",
        ],
        tips: [
          "Espaços patrocinados geram receita adicional para a marca.",
          "Alterne parceiros para manter o conteúdo fresco.",
        ],
      },
    ],
  },

  "/offer-card-config": {
    pageTitle: "Configuração do Card de Oferta",
    sections: [
      {
        title: "Personalizar a aparência dos cards",
        summary: "Configure como os cards de oferta aparecem no aplicativo do cliente.",
        steps: [
          "Escolha o layout do card: compacto, expandido ou destaque.",
          "Configure quais informações são exibidas (preço, desconto, badge).",
          "Ajuste cores e estilos dos badges.",
          "Pré-visualize o resultado antes de salvar.",
        ],
      },
    ],
  },

  "/access-hub": {
    pageTitle: "Hub de Acessos",
    sections: [
      {
        title: "Gerenciar acessos rápidos",
        summary: "Configure links e atalhos de acesso rápido para diferentes portais.",
        steps: [
          "Visualize todos os portais e links de acesso disponíveis.",
          "Copie links de acesso para compartilhar com parceiros ou operadores.",
          "Configure novos acessos conforme necessário.",
        ],
      },
    ],
  },

  "/points-packages": {
    pageTitle: "Pacotes de Pontos",
    sections: [
      {
        title: "Gerenciar pacotes de pontos",
        summary: "Crie e configure pacotes de pontos disponíveis para compra pelas cidades.",
        steps: [
          "Clique em 'Novo pacote' para criar.",
          "Defina nome, quantidade de pontos e preço.",
          "Configure se o pacote é recorrente ou avulso.",
          "Ative ou desative pacotes na lista.",
        ],
        tips: [
          "Ofereça pacotes variados para atender diferentes tamanhos de operação.",
          "Pacotes inativos não aparecem na loja das cidades.",
        ],
      },
    ],
  },

  "/crm": {
    pageTitle: "CRM — Gestão de Relacionamento",
    sections: [
      {
        title: "Gerenciar contatos e campanhas",
        summary: "Centralize contatos, segmente audiências e envie campanhas direcionadas.",
        steps: [
          "Na aba 'Contatos', visualize e busque todos os contatos da marca.",
          "Na aba 'Audiências', crie segmentos com filtros (cidade, corridas, tier, etc.).",
          "Na aba 'Campanhas', crie e agende campanhas de comunicação.",
          "Na aba 'Tiers', configure os níveis de engajamento dos contatos.",
        ],
        tips: [
          "Segmente audiências antes de criar campanhas para melhorar a conversão.",
          "Use filtros combinados para criar segmentos precisos.",
          "Acompanhe os logs de envio para monitorar a entrega.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     ACHADINHOS / MARKETPLACE
     ═══════════════════════════════════════════════ */
  "/affiliate-categories": {
    pageTitle: "Categorias de Afiliados",
    sections: [
      {
        title: "Gerenciar categorias",
        summary: "Organize as ofertas de afiliados em categorias para facilitar a navegação.",
        steps: [
          "Clique em 'Nova categoria' para criar.",
          "Defina nome, ícone, cor e palavras-chave.",
          "Reordene as categorias arrastando na lista.",
          "Ative ou desative categorias conforme necessário.",
        ],
        tips: [
          "Palavras-chave ajudam na classificação automática de ofertas importadas.",
          "Use cores distintas para facilitar a identificação visual.",
        ],
      },
    ],
  },

  "/mirror-sync": {
    pageTitle: "Sincronização de Ofertas",
    sections: [
      {
        title: "Sincronizar ofertas externas",
        summary: "Importe e sincronize ofertas de plataformas externas automaticamente.",
        steps: [
          "Configure a fonte de dados (URL, API ou feed).",
          "Defina a frequência de sincronização.",
          "Mapeie os campos da fonte para os campos da plataforma.",
          "Ative a sincronização e monitore os logs.",
        ],
        tips: [
          "Verifique os logs após cada sincronização para identificar erros.",
          "Ofertas duplicadas são detectadas automaticamente pelo hash de origem.",
        ],
      },
    ],
  },

  "/offer-governance": {
    pageTitle: "Governança de Ofertas",
    sections: [
      {
        title: "Gerenciar aprovação de ofertas",
        summary: "Revise e aprove ofertas antes de serem publicadas no marketplace.",
        steps: [
          "Ofertas pendentes aparecem automaticamente na fila de revisão.",
          "Revise título, preço, imagem e descrição.",
          "Aprove, rejeite ou solicite correções.",
          "Ofertas aprovadas ficam visíveis imediatamente.",
        ],
      },
    ],
  },

  "/product-redemption-orders": {
    pageTitle: "Pedidos de Resgate de Produtos",
    sections: [
      {
        title: "Gerenciar pedidos de resgate",
        summary: "Acompanhe e processe pedidos de resgate de produtos físicos.",
        steps: [
          "Visualize pedidos por status: pendente, processando, enviado, concluído.",
          "Clique em um pedido para ver detalhes: cliente, produto, endereço.",
          "Atualize o status do pedido conforme o processamento avança.",
          "Registre código de rastreamento quando aplicável.",
        ],
      },
    ],
  },

  "/produtos-resgate": {
    pageTitle: "Produtos para Resgate",
    sections: [
      {
        title: "Gerenciar catálogo de produtos resgatáveis",
        summary: "Configure os produtos que podem ser resgatados com pontos.",
        steps: [
          "Clique em 'Novo produto' para adicionar ao catálogo.",
          "Defina nome, descrição, imagem e custo em pontos.",
          "Configure estoque disponível e limites por cliente.",
          "Ative ou desative produtos conforme disponibilidade.",
        ],
        tips: [
          "Produtos com estoque zerado ficam marcados como 'Esgotado' automaticamente.",
          "Use imagens de alta qualidade para melhorar a atratividade.",
        ],
      },
    ],
  },

  "/regras-resgate": {
    pageTitle: "Regras de Resgate",
    sections: [
      {
        title: "Configurar regras de resgate de produtos",
        summary: "Defina as políticas de resgate: limites, elegibilidade e condições.",
        steps: [
          "Configure limites de resgate por período (diário, semanal, mensal).",
          "Defina requisitos de elegibilidade (tier mínimo, pontos mínimos).",
          "Configure as condições de entrega e prazos.",
          "Salve para aplicar as regras.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     GANHA-GANHA
     ═══════════════════════════════════════════════ */
  "/ganha-ganha-config": {
    pageTitle: "Ganha-Ganha — Configuração",
    sections: [
      {
        title: "Configurar módulo Ganha-Ganha",
        summary: "Defina as regras de comissionamento e participação no programa.",
        steps: [
          "Configure a taxa de comissão por venda ou resgate.",
          "Defina os parceiros participantes.",
          "Configure os períodos de apuração e pagamento.",
          "Ative o módulo para iniciar o programa.",
        ],
      },
    ],
  },

  "/ganha-ganha-billing": {
    pageTitle: "Ganha-Ganha — Faturamento",
    sections: [
      {
        title: "Acompanhar faturamento",
        summary: "Visualize faturas, valores devidos e pagamentos do programa Ganha-Ganha.",
        steps: [
          "Consulte o resumo financeiro do período atual.",
          "Visualize faturas individuais por parceiro.",
          "Acompanhe o status de cada pagamento.",
          "Exporte relatórios financeiros para planilha.",
        ],
      },
    ],
  },

  "/ganha-ganha-closing": {
    pageTitle: "Ganha-Ganha — Fechamento",
    sections: [
      {
        title: "Realizar fechamento do período",
        summary: "Processe o fechamento do período para calcular comissões e gerar faturas.",
        steps: [
          "Selecione o período a ser fechado.",
          "Revise o resumo de vendas e comissões.",
          "Confirme o fechamento para gerar as faturas.",
          "Após o fechamento, os valores ficam disponíveis para pagamento.",
        ],
        tips: [
          "O fechamento é irreversível — revise os dados com cuidado.",
          "Períodos fechados geram faturas automaticamente para cada parceiro.",
        ],
      },
    ],
  },

  "/ganha-ganha-dashboard": {
    pageTitle: "Ganha-Ganha — Dashboard",
    sections: [
      {
        title: "Visão geral do programa",
        summary: "Acompanhe indicadores e desempenho do programa Ganha-Ganha.",
        steps: [
          "Veja os indicadores principais: vendas, comissões, parceiros ativos.",
          "Analise gráficos de tendência e comparativos.",
          "Identifique os parceiros com melhor desempenho.",
        ],
      },
    ],
  },

  "/ganha-ganha-store-summary": {
    pageTitle: "Ganha-Ganha — Resumo da Loja",
    sections: [
      {
        title: "Ver resumo por loja",
        summary: "Visualize o desempenho individual de cada loja no programa.",
        steps: [
          "Selecione a loja desejada na lista.",
          "Veja vendas, resgates e comissões do período.",
          "Compare com períodos anteriores para identificar tendências.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     ROOT — Rotas adicionais
     ═══════════════════════════════════════════════ */
  "/provision-brand": {
    pageTitle: "Provisionar Nova Marca",
    sections: [
      {
        title: "Criar uma nova marca na plataforma",
        summary: "Provisione uma marca completa com todas as configurações iniciais.",
        steps: [
          "Preencha os dados da marca: nome, slug e empresa proprietária.",
          "Selecione o plano de assinatura inicial.",
          "Configure os módulos que serão ativados.",
          "Confirme para criar a marca com todas as dependências.",
        ],
        tips: [
          "O slug deve ser único e não pode ser alterado posteriormente.",
          "Módulos podem ser ajustados depois na seção de Módulos da marca.",
        ],
      },
    ],
  },

  "/starter-kit": {
    pageTitle: "Kit Inicial",
    sections: [
      {
        title: "Configurar kit inicial para marcas",
        summary: "Defina o pacote padrão de configurações aplicado a novas marcas.",
        steps: [
          "Configure seções padrão da tela inicial.",
          "Defina regras de pontos iniciais.",
          "Configure módulos que serão ativados automaticamente.",
          "Salve o kit para aplicação automática em novas marcas.",
        ],
      },
    ],
  },

  "/platform-theme": {
    pageTitle: "Tema da Plataforma",
    sections: [
      {
        title: "Personalizar o visual da plataforma",
        summary: "Configure cores, fontes e estilos globais do painel administrativo.",
        steps: [
          "Defina as cores primária, secundária e de destaque.",
          "Configure a fonte principal e secundária.",
          "Ajuste o modo claro/escuro e contrastes.",
          "Pré-visualize as alterações antes de salvar.",
        ],
      },
    ],
  },

  "/app-icons": {
    pageTitle: "Ícones do Aplicativo",
    sections: [
      {
        title: "Gerenciar ícones do app",
        summary: "Configure os ícones exibidos no aplicativo do cliente.",
        steps: [
          "Envie ícones personalizados para substituir os padrão.",
          "Defina ícones por categoria ou funcionalidade.",
          "Pré-visualize como os ícones aparecem no aplicativo.",
          "Salve para aplicar em todas as marcas.",
        ],
      },
    ],
  },

  "/plan-templates": {
    pageTitle: "Templates de Planos",
    sections: [
      {
        title: "Gerenciar templates de planos",
        summary: "Crie modelos de planos de assinatura reutilizáveis.",
        steps: [
          "Clique em 'Novo template' para criar.",
          "Defina nome, descrição e funcionalidades incluídas.",
          "Configure limites (cidades, parceiros, usuários).",
          "Ative o template para ficar disponível na criação de marcas.",
        ],
      },
    ],
  },

  "/plan-pricing": {
    pageTitle: "Preços de Planos",
    sections: [
      {
        title: "Configurar precificação",
        summary: "Defina os preços para cada plano de assinatura da plataforma.",
        steps: [
          "Selecione o plano a ser precificado.",
          "Defina valor mensal e anual.",
          "Configure descontos e promoções.",
          "Salve para aplicar os novos preços.",
        ],
      },
    ],
  },

  "/taxonomy": {
    pageTitle: "Taxonomia",
    sections: [
      {
        title: "Gerenciar taxonomia de categorias",
        summary: "Configure a árvore de categorias usada em toda a plataforma.",
        steps: [
          "Adicione novas categorias e subcategorias.",
          "Defina ícones e cores para cada categoria.",
          "Reordene a hierarquia arrastando os itens.",
          "Desative categorias que não são mais usadas.",
        ],
      },
    ],
  },

  "/welcome-tour": {
    pageTitle: "Tour de Boas-vindas",
    sections: [
      {
        title: "Configurar tour de boas-vindas",
        summary: "Defina as etapas do tour que novos usuários veem ao acessar a plataforma.",
        steps: [
          "Adicione etapas com título, descrição e imagem.",
          "Reordene as etapas arrastando na lista.",
          "Configure o público-alvo do tour (tipo de usuário).",
          "Ative o tour para que novos usuários o vejam automaticamente.",
        ],
      },
    ],
  },

  "/profile-links": {
    pageTitle: "Links do Perfil",
    sections: [
      {
        title: "Configurar links exibidos no perfil",
        summary: "Defina os links que aparecem na seção de perfil do aplicativo do cliente.",
        steps: [
          "Adicione links com título, URL e ícone.",
          "Reordene os links arrastando na lista.",
          "Ative ou desative links individualmente.",
          "Use links para direcionar a redes sociais, suporte, FAQ, etc.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     OUTROS — Rotas adicionais
     ═══════════════════════════════════════════════ */
  "/api-keys": {
    pageTitle: "Chaves de API",
    sections: [
      {
        title: "Gerenciar chaves de API",
        summary: "Crie e gerencie chaves de autenticação para integração via API.",
        steps: [
          "Clique em 'Nova chave' para gerar.",
          "Defina um rótulo descritivo para identificar o uso da chave.",
          "Copie a chave gerada — ela não será exibida novamente.",
          "Desative chaves comprometidas imediatamente.",
        ],
        tips: [
          "Nunca compartilhe chaves de API em locais públicos.",
          "Use rótulos claros para identificar cada integração.",
          "Revogue chaves não utilizadas periodicamente.",
        ],
      },
    ],
  },

  "/api-docs": {
    pageTitle: "Documentação da API",
    sections: [
      {
        title: "Consultar documentação",
        summary: "Acesse a documentação completa dos endpoints da API.",
        steps: [
          "Navegue pelos endpoints organizados por módulo.",
          "Consulte exemplos de requisição e resposta.",
          "Teste endpoints diretamente na interface (quando disponível).",
        ],
      },
    ],
  },

  "/emitter-requests": {
    pageTitle: "Solicitações de Emissores",
    sections: [
      {
        title: "Gerenciar solicitações",
        summary: "Revise e processe solicitações de emissores de pontos.",
        steps: [
          "Visualize solicitações pendentes na fila.",
          "Revise os detalhes de cada solicitação.",
          "Aprove ou rejeite com justificativa.",
        ],
      },
    ],
  },

  "/page-builder-v2": {
    pageTitle: "Montador de Páginas V2",
    sections: [
      {
        title: "Criar páginas com o novo editor",
        summary: "Use o editor visual avançado para montar páginas personalizadas.",
        steps: [
          "Clique em 'Nova página' ou edite uma existente.",
          "Arraste e solte blocos de conteúdo (texto, imagem, botão, seção).",
          "Configure cada bloco com as opções do painel lateral.",
          "Pré-visualize em tempo real e publique quando estiver pronta.",
        ],
        tips: [
          "O V2 oferece mais tipos de blocos e opções de layout que a versão anterior.",
          "Use seções para organizar o conteúdo em grupos visuais.",
        ],
      },
    ],
  },

  "/manuais": {
    pageTitle: "Manuais e Guias",
    sections: [
      {
        title: "Acessar manuais do sistema",
        summary: "Consulte guias completos sobre cada funcionalidade da plataforma.",
        steps: [
          "Navegue pelas categorias de manuais.",
          "Clique em um manual para abrir o conteúdo completo.",
          "Use a busca para encontrar tópicos específicos.",
        ],
      },
    ],
  },

  "/city-onboarding": {
    pageTitle: "Onboarding de Cidade",
    sections: [
      {
        title: "Configurar nova cidade",
        summary: "Siga o passo a passo guiado para configurar uma nova cidade na plataforma.",
        steps: [
          "Preencha os dados da cidade: nome, estado e localização.",
          "Configure as regras de pontos iniciais.",
          "Cadastre os primeiros parceiros.",
          "Crie as primeiras ofertas.",
          "Ative a cidade para começar a operar.",
        ],
        tips: [
          "Complete todas as etapas para garantir uma operação saudável desde o início.",
          "Você pode voltar a qualquer etapa a qualquer momento.",
        ],
      },
    ],
  },

  "/driver": {
    pageTitle: "Painel do Motorista",
    sections: [
      {
        title: "Usar o painel do motorista",
        summary: "Acesse seu saldo, ofertas exclusivas e ranking como motorista.",
        steps: [
          "Visualize seu saldo de pontos no topo da tela.",
          "Navegue pelas ofertas disponíveis para motoristas.",
          "Consulte seu ranking e posição na cidade.",
          "Resgate pontos por prêmios ou produtos disponíveis.",
        ],
        tips: [
          "Complete mais corridas para subir no ranking.",
          "Fique atento a ofertas exclusivas para motoristas.",
        ],
      },
    ],
  },
};

export function getHelpForRoute(pathname: string): HelpEntry | null {
  // Exact match first
  if (helpContent[pathname]) return helpContent[pathname];
  
  // Try base path (e.g. /brands/123 → /brands)
  const basePath = "/" + pathname.split("/").filter(Boolean)[0];
  if (helpContent[basePath]) return helpContent[basePath];

  return null;
}

export default helpContent;
