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
          "Os dados são filtrados automaticamente pelo seu nível de acesso (marca/filial).",
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
        summary: "Associe um endereço web próprio (ex: app.sualoja.com.br) à sua marca.",
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
          "Ative ou desative filiais conforme necessário.",
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
        summary: "Importe lojas e dados em grande quantidade usando planilhas (arquivo CSV).",
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
        summary: "Defina como os clientes acumulam pontos ao comprar nas lojas.",
        steps: [
          "Configure a taxa base: quantos pontos por real gasto.",
          "Defina limites: máximo por compra, por dia (cliente) e por dia (loja).",
          "Configure quanto vale cada ponto em dinheiro.",
          "Defina se as lojas podem criar regras próprias e quais os limites permitidos.",
          "Ative 'Exigir código de recibo' se desejar rastreabilidade extra.",
        ],
        tips: [
          "Regras personalizadas das lojas precisam de aprovação se a opção 'Requer aprovação' estiver ativada.",
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
          "Clique em uma transação para ver detalhes como loja, valor da compra e regra aplicada.",
        ],
      },
    ],
  },

  "/earn-points": {
    pageTitle: "Pontuar",
    sections: [
      {
        title: "Registrar pontuação para cliente",
        summary: "Registre pontos para um cliente após uma compra na loja.",
        steps: [
          "Selecione a loja que está pontuando.",
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
          "Atribua a marca e/ou filial de acesso.",
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
        title: "Gerenciar perfil da loja",
        summary: "Mantenha as informações públicas da sua loja atualizadas.",
        steps: [
          "Acesse a aba 'Perfil'.",
          "Edite: nome, descrição, fotos, vídeo de apresentação.",
          "Atualize endereço e informações de contato.",
          "Clique em 'Salvar' para publicar as alterações.",
        ],
      },
      {
        title: "Gerenciar funcionários",
        summary: "Cadastre operadores que poderão validar resgates na sua loja.",
        steps: [
          "Acesse a aba 'Funcionários'.",
          "Clique em 'Adicionar funcionário'.",
          "Informe nome e e-mail do funcionário.",
          "O funcionário receberá acesso ao módulo de resgate.",
        ],
      },
      {
        title: "Extrato financeiro",
        summary: "Acompanhe todas as transações da sua loja.",
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
        title: "Configurar regra de pontos da loja",
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
        summary: "Revise e aprove regras de pontos criadas pelas lojas.",
        steps: [
          "Regras pendentes aparecem automaticamente nesta lista.",
          "Revise os valores propostos pela loja.",
          "Clique em 'Aprovar' ou 'Rejeitar'.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     NOTIFICAÇÕES
     ═══════════════════════════════════════════════ */
   "/send-notification": {
    pageTitle: "Enviar Notificação",
    sections: [
      {
        title: "Enviar aviso para clientes",
        summary: "Envie mensagens diretamente para os celulares dos clientes.",
        steps: [
          "Defina o título e o corpo da mensagem.",
          "Selecione o público-alvo.",
          "Clique em 'Enviar'.",
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
          "Envie o logotipo da loja.",
          "Aceite os termos de uso e envie o cadastro para análise.",
        ],
        tips: [
          "Após o cadastro, sua loja passará por aprovação antes de ficar ativa.",
          "Você receberá um e-mail quando a loja for aprovada.",
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
     CATÁLOGO DA LOJA
     ═══════════════════════════════════════════════ */
  "/store-catalog": {
    pageTitle: "Catálogo de Produtos",
    sections: [
      {
        title: "Gerenciar catálogo",
        summary: "Adicione e organize os produtos/serviços da sua loja.",
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
          "Teste ofertas, perfil de loja e funcionalidades de resgate.",
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
          "Cada empresa pode ter múltiplas marcas e filiais.",
          "Ative ou desative empresas conforme a necessidade.",
        ],
        tips: [
          "O apelido é usado no endereço web e não pode ser alterado depois de criado.",
          "Desativar uma empresa desativa todas as marcas e filiais vinculadas automaticamente.",
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
          "Cada funcionalidade representa um recurso do sistema (ex: cupons, pontos, lojas).",
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
          "Defina o alcance: toda a plataforma, por marca ou por filial.",
          "Use o botão para ligar/desligar o recurso.",
          "O sistema verificará automaticamente o controle antes de exibir o recurso.",
        ],
        tips: [
          "Controles globais afetam toda a plataforma.",
          "Controles por marca ou filial permitem ativar recursos de forma gradual.",
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
          "Use 'Aplicar modelo' para copiar seções para uma marca ou filial.",
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
