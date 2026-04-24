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
        summary: "Cidades (filiais) representam as regiões onde a sua marca opera. Cada cidade tem seus próprios módulos, parceiros e configurações.",
        steps: [
          "Clique em 'Nova cidade' para criar.",
          "Preencha: nome, apelido (slug usado no endereço web), cidade, estado, latitude/longitude e fuso horário.",
          "Escolha o Modelo de Pontuação: DRIVER_ONLY (só motoristas), PASSENGER_ONLY (só clientes) ou BOTH (ambos).",
          "Em 'Módulos de Negócio', ative/desative o que vale para esta cidade — herda da marca, mas pode sobrescrever.",
          "Em 'Gamificação', configure Duelos, Ranking e Cinturão (depende do módulo achadinhos_motorista).",
          "Use 'Resetar pontos' para zerar saldos em massa quando precisar (processado por Edge Function).",
          "A exclusão de cidade é hard-delete via Edge Function — confirme antes de remover.",
        ],
        tips: [
          "Slug deve ser único, sem espaços, com hífens.",
          "Cidades inativas somem para o usuário final.",
          "Atalho 'Criar Franqueado' está disponível em cada card de cidade.",
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
        summary: "Crie e gerencie vouchers (cupons promocionais). Cada voucher segue o ciclo de 12 etapas (versionamento de termos, snapshot de parâmetros, baixa por PIN).",
        steps: [
          "Clique em 'Novo Voucher' para criar.",
          "Defina código, valor, validade, parceiro vinculado e oferta de origem.",
          "Configure limites: usos totais, por cliente e intervalo entre usos.",
          "Ative para liberar o uso pelos clientes.",
          "Acompanhe o status: ATIVO, USADO, EXPIRADO, CANCELADO.",
        ],
        tips: [
          "Vouchers só são considerados USADOS quando o parceiro confirma o PIN.",
          "Use vouchers para campanhas pontuais sem mexer nas regras de pontos.",
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
        summary: "A cidade opera com carteira pré-paga: pontos são debitados conforme motoristas/clientes são pontuados. Saldos negativos ficam registrados como dívida operacional.",
        steps: [
          "Visualize saldo atual, total distribuído e total carregado no topo.",
          "Consulte o extrato completo (carregamentos, distribuições, ajustes).",
          "Compre pacotes de pontos em 'Loja de Pacotes' para reabastecer.",
          "Configure o alerta de saldo baixo para ser avisado antes de zerar.",
        ],
        tips: [
          "Saldo negativo é permitido — o sistema continua pontuando, mas registra a dívida para acerto futuro.",
          "Cada operação fica registrada em branch_wallet_transactions com tipo (LOAD/DISTRIBUTE/ADJUST).",
          "Tudo é processado por Edge Function para manter integridade transacional.",
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
        summary: "Visualize e gerencie os motoristas da sua marca/cidade. A lista é paginada (50 por página) e suporta bases com milhares de registros.",
        steps: [
          "Use o campo de busca para encontrar por nome, CPF, telefone, e-mail ou placa (a placa é detectada automaticamente pelo formato Mercosul/antigo).",
          "Filtre por status: 'Ativo' inclui motoristas sem status definido (status NULL conta como Ativo). 'Inativo' mostra apenas quem foi desativado manualmente.",
          "O contador no topo mostra 'X de Y' (resultados filtrados de total).",
          "Use 'Limpar filtros' para resetar busca e status de uma só vez.",
          "Clique em um motorista para abrir a ficha completa (saldo, corridas, badges de origem).",
        ],
        tips: [
          "Buscas com letras + números são tratadas como nome; o regex específico só dispara para placas válidas (ABC1D23 ou ABC-1234).",
          "Badges na ficha indicam origem: 🟢 CSV, 🔵 1ª corrida (auto-cadastro), ⚪ aguardando dados completos.",
          "Motoristas com status NULL aparecem como 'Ativo' por padrão — só mude para Inativo quem realmente saiu.",
        ],
      },
      {
        title: "Exportar lista em CSV",
        summary: "A exportação ocorre em duas etapas para funcionar bem em iPhone e PWA instalado.",
        steps: [
          "Toque em 'Exportar CSV' — o sistema busca todos os motoristas e prepara o arquivo no servidor.",
          "Quando o botão mudar para 'Abrir CSV', toque novamente para baixar.",
          "No iPhone/PWA, o segundo toque abre o arquivo via URL HTTPS assinada (válida por 30 minutos), evitando tela branca.",
          "No desktop, o download é direto pelo navegador.",
        ],
        tips: [
          "Se aparecer erro durante a preparação, basta tocar de novo em 'Exportar CSV'.",
          "O arquivo gerado fica disponível por 30 minutos antes de expirar.",
        ],
      },
      {
        title: "Importar CSV em massa",
        summary: "Suba a base completa de motoristas (até 10 mil linhas, 100+ campos por linha).",
        steps: [
          "Clique em 'Importar CSV' e baixe o template oficial.",
          "Preencha os dados (CPF, telefone e nome ajudam o sistema a casar com motoristas que já existem).",
          "Faça upload — o sistema deduplica por external_id, CPF, telefone ou nome.",
          "Subir CSV antes da primeira corrida = motorista visível imediatamente. Depois da primeira corrida = enriquece o registro existente sem duplicar.",
        ],
        tips: [
          "O auto-cadastro continua ativo: motoristas novos sem CSV são criados na primeira corrida com dados básicos da TaxiMachine.",
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
        summary: "Centraliza opções de layout e funcionalidade do app do motorista (Home Inteligente, ofertas exclusivas, hub de navegação).",
        steps: [
          "Habilite a 'Home Inteligente' (driver_hub) para o motorista cair em uma central de navegação ao entrar.",
          "Configure quais seções aparecem: Achadinhos, Compre com Pontos, Histórico de Resgates Locais, Ranking, Cinturão.",
          "Ative 'Compra de Pontos' para liberar a aquisição de pontos pelo motorista (preço definido em Pacotes de Pontos).",
          "Marque 'Ofertas restritas a motoristas' para usar o campo driver_only nas ofertas.",
          "Personalize textos e labels da interface do motorista.",
        ],
        tips: [
          "A vinculação automática por CPF associa o motorista a registros existentes no primeiro acesso.",
          "Ofertas com driver_only=true só aparecem no painel do motorista.",
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
        summary: "Hub central do motorista: saldo, achadinhos, compra de pontos, histórico de resgates locais e gamificação.",
        steps: [
          "A 'Home Inteligente' é o ponto de entrada — escolha entre Achadinhos, Compre com Pontos, Resgates Locais ou Ranking.",
          "O saldo de pontos aparece sempre no topo, atualizado em tempo real.",
          "Use 'Comprar pontos' (se habilitado) para adquirir pacotes diretamente pelo app.",
          "Resgate em parceiros locais via fluxo OTP → confirmação → PIN.",
          "Acompanhe duelos, ranking mensal e cinturão da cidade.",
        ],
        tips: [
          "Ofertas com driver_only=true são exclusivas — não aparecem para clientes comuns.",
          "O CPF vincula automaticamente o motorista a registros existentes na marca.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     ROTAS ADICIONAIS — atualização manuais 2026-04
     ═══════════════════════════════════════════════ */
  "/conversao-resgate": {
    pageTitle: "Conversão de Resgates",
    sections: [
      {
        title: "Acompanhar funil de resgate",
        summary: "Veja em que etapa do ciclo de 12 passos cada cupom está e onde os clientes desistem.",
        steps: [
          "Selecione o período de análise.",
          "Veja a taxa de conversão entre as etapas (geração → confirmação → uso).",
          "Identifique parceiros com baixa taxa de baixa de cupom.",
          "Use os filtros por cidade, parceiro e tipo de oferta.",
        ],
        tips: [
          "Cupons só são contabilizados como convertidos quando o parceiro dá baixa (PIN).",
          "Use o relatório para negociar melhorias com parceiros que demoram para confirmar resgates.",
        ],
      },
    ],
  },

  "/relatorio-corridas": {
    pageTitle: "Relatório Detalhado de Corridas",
    sections: [
      {
        title: "Visão consolidada das cidades",
        summary: "Agrega corridas, pontos emitidos e ganhos de todas as suas cidades em um único painel.",
        steps: [
          "Selecione o intervalo de datas (filtra por finalized_at — apenas corridas FINALIZED contam).",
          "Compare cidades lado a lado: corridas, pontos, motoristas únicos.",
          "Faça drilldown clicando em uma cidade para ver detalhes por motorista.",
          "Exporte em CSV para análise externa.",
        ],
        tips: [
          "O isolamento por branch_id é automático — você só vê o que tem acesso.",
          "Use este relatório para entender qual cidade gera mais movimento operacional.",
        ],
      },
    ],
  },

  "/leads-comerciais": {
    pageTitle: "Leads Comerciais",
    sections: [
      {
        title: "Gerenciar leads recebidos",
        summary: "Centraliza interessados que chegaram pelos formulários da landing page e produtos comerciais.",
        steps: [
          "Visualize todos os leads com status (novo, contatado, qualificado, convertido).",
          "Clique em um lead para ver dados completos (empresa, cargo, UTMs).",
          "Adicione notas e atribua o lead a um responsável.",
          "Marque como contatado/qualificado/convertido conforme avança a negociação.",
        ],
        tips: [
          "Os UTMs ajudam a identificar quais campanhas geram leads mais qualificados.",
          "Use as notas para registrar histórico de contato.",
        ],
      },
    ],
  },

  "/admin/central-modulos": {
    pageTitle: "Central de Módulos (Root)",
    sections: [
      {
        title: "Visão geral das 8 abas",
        summary: "Painel mestre Root organizado em: Catálogo, Modelos, Planos, Templates, Empreendedores, Cidades, Auditoria e Manual.",
        steps: [
          "Catálogo: cadastra módulos técnicos (chave, nome, categoria, customer_facing).",
          "Modelos: empacota módulos em pacotes comerciais (Modelos de Negócio) e gerencia add-ons vendáveis.",
          "Planos: matriz módulo × plano (Free / Starter / Profissional / Enterprise) com bulk Todos/Nenhum e 'Aplicar Retroativamente' para sincronizar marcas existentes.",
          "Templates: cria conjuntos livres de módulos reutilizáveis e aplica em lote em marcas e/ou cidades, com política Mesclar (segura) ou Substituir (reset).",
          "Empreendedores: ativa/desativa módulos por marca individualmente.",
          "Cidades: força overrides por filial sobre a configuração da marca.",
          "Auditoria: histórico cronológico de toda alteração com responsável.",
          "Manual: a documentação completa de cada aba, embutida na página.",
        ],
        tips: [
          "Para padronizar várias marcas de uma vez sem mexer em planos, use a aba Templates.",
          "Para padronizar TODAS as marcas de um plano (resetando customizações), use 'Aplicar Retroativamente' na aba Planos.",
          "Para mudança pontual em uma marca específica, use a aba Empreendedores.",
          "Para exceção em uma cidade só, use a aba Cidades (overrides).",
          "Toda mudança fica registrada em Auditoria — consulte antes de abrir chamado.",
        ],
      },
    ],
  },

  "/admin/produtos-comerciais": {
    pageTitle: "Produtos Comerciais (Root)",
    sections: [
      {
        title: "Catálogo comercial vendável",
        summary: "Crie e gerencie os produtos comerciais (bundles de módulos + planos) que o time comercial vende.",
        steps: [
          "Clique em 'Novo Produto' para criar um bundle.",
          "Defina nome, headline, audiência (DRIVER/PASSENGER/MIXED), preço e módulos incluídos.",
          "Configure a landing page pública e o link de cadastro.",
          "Ative o produto para liberá-lo na vitrine comercial.",
        ],
        tips: [
          "Use o tutorial guiado em 'Manuais' para ver um exemplo completo (Vale Resgate Motorista Premium).",
          "Cada produto pode ter sua própria landing page com formulário de leads.",
        ],
      },
    ],
  },

  "/admin/auditoria-duplicacoes": {
    pageTitle: "Auditoria de Duplicações",
    sections: [
      {
        title: "Investigar registros duplicados",
        summary: "Ferramenta Root para detectar e mesclar duplicatas de motoristas, clientes ou parceiros.",
        steps: [
          "Escolha o tipo de entidade (motoristas, clientes, parceiros).",
          "Veja a lista de candidatos a duplicação (match por CPF, telefone, e-mail ou nome).",
          "Compare os registros lado a lado.",
          "Confirme a mescla — o sistema preserva o registro mais antigo e migra pontos/histórico.",
        ],
        tips: [
          "A mescla é irreversível — confirme com cuidado.",
          "Mescle preferencialmente para o registro com mais histórico de pontos.",
        ],
      },
    ],
  },

  "/configuracao-cidade": {
    pageTitle: "Configuração da Cidade",
    sections: [
      {
        title: "Configurações operacionais por cidade",
        summary: "Painel central de configurações específicas: scoring model, timezone, geolocalização e flags operacionais.",
        steps: [
          "Edite nome, slug, cidade/estado, latitude/longitude e fuso horário.",
          "Escolha o scoring_model: DRIVER_ONLY, PASSENGER_ONLY ou BOTH.",
          "Habilite 'is_city_redemption_enabled' para liberar resgates locais por motoristas.",
          "Configure flags em branch_settings_json (precisam ser === true para ligar).",
        ],
        tips: [
          "Flags ausentes em branch_settings_json contam como OFF (regra estrita).",
          "Mudança de scoring_model afeta quais módulos aparecem no menu da cidade.",
        ],
      },
    ],
  },

  "/configuracao-modulos-cidade": {
    pageTitle: "Módulos da Cidade",
    sections: [
      {
        title: "Ativar/desativar módulos por cidade",
        summary: "Override granular: cada cidade pode ligar/desligar módulos independentemente da marca.",
        steps: [
          "Veja a lista de módulos com o estado atual (herdado da marca ou override).",
          "Use os toggles para sobrescrever o estado da marca em uma cidade específica.",
          "Salve para persistir em city_module_overrides.",
        ],
        tips: [
          "Sem override, a cidade herda automaticamente o que a marca configurou.",
          "Override permite testar módulos em uma cidade antes de liberar para todas.",
        ],
      },
    ],
  },

  "/branch-business-models": {
    pageTitle: "Modelos de Negócio por Cidade",
    sections: [
      {
        title: "Configurar modelos por cidade",
        summary: "Override por cidade dos modelos de negócio (Duelo, Achadinho, Mercado Livre etc.) ativados pela marca.",
        steps: [
          "Liste os business models disponíveis na marca.",
          "Para cada cidade, ative ou desative o modelo independentemente.",
          "Salve em city_business_model_overrides.",
        ],
        tips: [
          "Cidades sem override seguem o que a marca habilitou.",
          "Use para liberar Ganha-Ganha apenas em cidades-piloto.",
        ],
      },
    ],
  },

  "/brand-modules/ganha-ganha": {
    pageTitle: "Configuração Ganha-Ganha",
    sections: [
      {
        title: "Configurar ecossistema Ganha-Ganha",
        summary: "Ecossistema de fidelidade compartilhado entre parceiros mistos (Emissor + Receptor).",
        steps: [
          "Defina a margem global (ganha_ganha_margin_pct) sobre o valor das transações.",
          "Configure o engajamento entre parceiros (cada parceiro emite e recebe pontos).",
          "Habilite módulos auxiliares: relatórios, fechamento, billing.",
          "Salve para aplicar em toda a marca.",
        ],
        tips: [
          "A margem é a única fonte de receita do ecossistema — ajuste com cuidado.",
          "Use 'Ganha-Ganha Reports' para acompanhar performance.",
        ],
      },
    ],
  },

  "/ganha-ganha-reports": {
    pageTitle: "Relatórios Ganha-Ganha",
    sections: [
      {
        title: "Acompanhar transações do ecossistema",
        summary: "Visualize emissões, recebimentos e fechamentos do Ganha-Ganha por período e parceiro.",
        steps: [
          "Selecione o período e o parceiro (opcional).",
          "Veja totais por categoria: emitido, recebido, líquido.",
          "Drilldown por parceiro mostra quem mais emite e recebe pontos.",
          "Exporte em CSV.",
        ],
        tips: [
          "Parceiros com saldo negativo persistente devem ser revisados.",
          "Use o fechamento mensal para conciliar valores.",
        ],
      },
    ],
  },

  "/store/ganha-ganha": {
    pageTitle: "Ganha-Ganha (Parceiro)",
    sections: [
      {
        title: "Resumo da participação no Ganha-Ganha",
        summary: "Visão consolidada para o parceiro lojista: pontos emitidos, recebidos e saldo no ecossistema.",
        steps: [
          "Veja seu saldo líquido no Ganha-Ganha.",
          "Liste transações recentes (você emitiu / você recebeu).",
          "Acompanhe o fechamento do mês corrente.",
        ],
        tips: [
          "Quanto mais você participa, mais clientes do ecossistema voltam ao seu estabelecimento.",
        ],
      },
    ],
  },

  "/driver-points-purchase": {
    pageTitle: "Compra de Pontos pelo Motorista",
    sections: [
      {
        title: "Comprar pontos via app",
        summary: "Motorista adquire pontos diretamente, com confirmação manual do empreendedor.",
        steps: [
          "Escolha o pacote de pontos disponível.",
          "Confirme o método de pagamento combinado com o empreendedor.",
          "Aguarde a confirmação manual — os pontos entram no saldo após aprovação.",
        ],
        tips: [
          "O preço do milheiro é definido pelo empreendedor em Pacotes de Pontos.",
          "O histórico de compras fica visível no extrato do motorista.",
        ],
      },
    ],
  },

  "/affiliate-deals/import-mobile": {
    pageTitle: "Importação de Ofertas (Mobile)",
    sections: [
      {
        title: "Importar ofertas pelo celular",
        summary: "Fluxo otimizado para mobile: cole links de programas de afiliados e o sistema extrai os dados.",
        steps: [
          "Cole o link da oferta no campo indicado.",
          "Aguarde a extração automática (título, preço, imagem, descrição).",
          "Revise e ajuste se necessário.",
          "Salve para publicar nas Achadinhos.",
        ],
        tips: [
          "Funciona com Amazon, Mercado Livre e principais marketplaces.",
          "Imagens são otimizadas automaticamente para o app.",
        ],
      },
    ],
  },

  "/public-vouchers": {
    pageTitle: "Vouchers Públicos",
    sections: [
      {
        title: "Vitrine pública de vouchers",
        summary: "Página pública (sem login) que lista vouchers ativos para divulgação externa.",
        steps: [
          "Compartilhe o link público com clientes que ainda não usam o app.",
          "Cada voucher mostra estabelecimento, valor e validade.",
          "Para resgatar, o cliente é direcionado ao app.",
        ],
        tips: [
          "Use a página em campanhas de aquisição.",
          "Vouchers expirados somem automaticamente.",
        ],
      },
    ],
  },

  "/vouchers/redeem": {
    pageTitle: "Resgatar Voucher",
    sections: [
      {
        title: "Fluxo de resgate de voucher",
        summary: "Cliente apresenta o voucher e o parceiro confirma o uso via PIN.",
        steps: [
          "Cliente abre o voucher no app — gera um PIN único.",
          "Parceiro digita o PIN para confirmar a baixa.",
          "Sistema marca o voucher como USADO e registra timestamp.",
        ],
        tips: [
          "O PIN expira em poucos minutos por segurança.",
          "Vouchers só podem ser usados uma vez.",
        ],
      },
    ],
  },

  "/brand-journey": {
    pageTitle: "Jornada da Marca",
    sections: [
      {
        title: "Acompanhar onboarding da marca",
        summary: "Checklist guiado de configuração inicial: aparência, cidades, módulos, parceiros, motoristas.",
        steps: [
          "Cumpra cada etapa para deixar a marca pronta para operar.",
          "Etapas concluídas ficam marcadas em verde.",
          "Pule etapas opcionais conforme o seu modelo de negócio.",
        ],
        tips: [
          "A jornada cobre o mínimo para colocar o app no ar com qualidade.",
          "Volte aqui sempre que quiser revisar a configuração.",
        ],
      },
    ],
  },

  "/root-journey": {
    pageTitle: "Jornada Root",
    sections: [
      {
        title: "Onboarding administrativo Root",
        summary: "Checklist Root: provisionar tenants, marcas, planos e módulos disponíveis no SaaS.",
        steps: [
          "Cadastre tenants e marcas iniciais.",
          "Configure planos (Free/Starter/Pro/Enterprise).",
          "Defina módulos disponíveis em cada plano.",
          "Acompanhe a saúde geral da plataforma.",
        ],
      },
    ],
  },

  "/emitter-journey": {
    pageTitle: "Jornada do Emissor",
    sections: [
      {
        title: "Onboarding de parceiros emissores",
        summary: "Guia para parceiros que vão emitir pontos: configurar regras, treinar equipe, ativar baixas.",
        steps: [
          "Configure regra de pontos (R$ por ponto) na sua loja.",
          "Treine sua equipe para registrar pontuações.",
          "Habilite o módulo de baixa de cupons via PIN.",
        ],
        tips: [
          "Mantenha a regra clara para o cliente entender quanto ganha.",
        ],
      },
    ],
  },

  "/brand-domains": {
    pageTitle: "Domínios da Marca",
    sections: [
      {
        title: "Configurar domínios personalizados",
        summary: "Vincule um endereço próprio (ex.: app.suamarca.com.br) à sua marca, com SSL automático.",
        steps: [
          "Clique em 'Adicionar domínio' e digite o endereço desejado.",
          "Configure o CNAME no seu provedor apontando para o endereço fornecido.",
          "Aguarde a verificação automática (até 48h).",
          "Marque como primário quando estiver verificado.",
        ],
        tips: [
          "Provisionamento automático usa sufixo .com.br por padrão.",
          "É possível ter múltiplos domínios, mas só um primário.",
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
