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
    pageTitle: "Dashboard",
    sections: [
      {
        title: "Visão Geral",
        summary: "O Dashboard exibe indicadores-chave em tempo real sobre a operação.",
        steps: [
          "Os KPIs no topo mostram: resgates do dia, pontos emitidos, clientes ativos e ofertas ativas.",
          "O badge 'Tempo real' indica que os números são atualizados automaticamente.",
          "Use os gráficos para acompanhar tendências de resgates e pontuação ao longo do tempo.",
        ],
        tips: [
          "Clique em qualquer KPI para ver detalhes na página correspondente.",
          "Os dados são filtrados automaticamente pelo seu nível de acesso (marca/filial).",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     BRAND ADMIN — Identidade Visual
     ═══════════════════════════════════════════════ */
  "/brands": {
    pageTitle: "Tema & Marca",
    sections: [
      {
        title: "Personalizar a identidade visual",
        summary: "Configure cores, logo e estilo que serão aplicados no app do cliente.",
        steps: [
          "Selecione a marca que deseja editar na lista.",
          "Faça upload do logotipo (recomendado: PNG transparente 512×512).",
          "Defina as cores primária, secundária e de destaque.",
          "Clique em 'Salvar' para aplicar as alterações.",
        ],
        tips: [
          "Use o preview ao lado para ver como ficará no app do cliente antes de salvar.",
          "O tema é aplicado imediatamente em todas as telas do app do cliente.",
        ],
      },
    ],
  },

  "/domains": {
    pageTitle: "Domínios",
    sections: [
      {
        title: "Configurar domínio personalizado",
        summary: "Associe um domínio próprio (ex: app.sualoja.com.br) à sua marca.",
        steps: [
          "Clique em 'Adicionar domínio'.",
          "Digite o domínio desejado (ex: app.suamarca.com.br).",
          "Configure o registro CNAME no seu provedor de DNS apontando para o endereço fornecido.",
          "Aguarde a verificação (pode levar até 48h).",
          "Marque como domínio primário quando estiver verificado.",
        ],
        tips: [
          "Você pode ter múltiplos domínios, mas apenas um pode ser o primário.",
        ],
      },
    ],
  },

  "/icon-library": {
    pageTitle: "Galeria de Ícones",
    sections: [
      {
        title: "Gerenciar ícones",
        summary: "Adicione e organize os ícones usados nas seções e categorias do app.",
        steps: [
          "Escolha entre ícones Lucide (vetoriais) ou faça upload de imagens personalizadas.",
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
    pageTitle: "Seções da Home",
    sections: [
      {
        title: "Montar a Home do app do cliente",
        summary: "Configure quais seções aparecem na tela inicial e em que ordem.",
        steps: [
          "Arraste as seções para reordená-las.",
          "Clique no ícone de edição para configurar cada seção: título, subtítulo, modo de exibição (carrossel/grade), filtros e quantidade de itens.",
          "Use o toggle para ativar/desativar seções sem excluí-las.",
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
    pageTitle: "Central de Banners",
    sections: [
      {
        title: "Gerenciar banners promocionais",
        summary: "Crie banners com agendamento que aparecem no carrossel da Home.",
        steps: [
          "Clique em 'Novo banner'.",
          "Faça upload da imagem (recomendado: 1080×540px).",
          "Defina título, link de destino e tipo de link (externo, página interna ou oferta).",
          "Configure as datas de início e fim para agendamento.",
          "Reordene os banners arrastando-os na lista.",
        ],
        tips: [
          "Banners expirados são ocultados automaticamente do app.",
          "Use imagens com boa legibilidade em telas pequenas.",
        ],
      },
    ],
  },

  "/menu-labels": {
    pageTitle: "Nomes e Rótulos",
    sections: [
      {
        title: "Personalizar textos do app",
        summary: "Altere os nomes dos menus e rótulos que o cliente vê no app.",
        steps: [
          "Selecione o contexto: 'Admin' (menu lateral) ou 'App do Cliente'.",
          "Clique em qualquer rótulo para editá-lo.",
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
    pageTitle: "Construtor de Páginas",
    sections: [
      {
        title: "Criar páginas personalizadas",
        summary: "Monte páginas customizadas com texto, imagens, botões e dividers.",
        steps: [
          "Clique em 'Nova página'.",
          "Defina título e slug (URL: /p/seu-slug).",
          "Adicione elementos arrastando da barra lateral: Texto, Botão, Banner, Ícone, Divider, Espaçador.",
          "Configure cada elemento: cor, tamanho, link de ação, sombra e opacidade.",
          "Ative 'Publicar' quando a página estiver pronta.",
        ],
        tips: [
          "Use o preview ao vivo para ver exatamente como ficará no celular.",
          "Páginas não publicadas ficam acessíveis apenas para administradores.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     OPERAÇÕES
     ═══════════════════════════════════════════════ */
  "/branches": {
    pageTitle: "Filiais (Branches)",
    sections: [
      {
        title: "Gerenciar filiais",
        summary: "Filiais representam unidades regionais da sua marca.",
        steps: [
          "Clique em 'Nova filial' para criar.",
          "Preencha: nome, slug, cidade, estado e coordenadas (latitude/longitude).",
          "Selecione o fuso horário correto.",
          "Ative ou desative filiais conforme necessário.",
        ],
        tips: [
          "As coordenadas são usadas para filtrar lojas e ofertas por proximidade no app do cliente.",
          "Cada filial pode ter suas próprias regras de pontos e configurações.",
        ],
      },
    ],
  },

  "/stores": {
    pageTitle: "Lojas",
    sections: [
      {
        title: "Gerenciar lojas parceiras",
        summary: "Visualize e gerencie as lojas cadastradas na sua filial.",
        steps: [
          "Use a barra de busca para encontrar lojas por nome.",
          "Clique em uma loja para ver detalhes: perfil, funcionários, extrato e cupons.",
          "Altere o status (ativo/inativo) para controlar a visibilidade no app.",
        ],
      },
    ],
  },

  "/store-approvals": {
    pageTitle: "Aprovação de Lojas",
    sections: [
      {
        title: "Aprovar cadastros de lojas",
        summary: "Revise e aprove novas lojas que se registraram na plataforma.",
        steps: [
          "Lojas pendentes aparecem automaticamente nesta lista.",
          "Clique em 'Aprovar' para ativar a loja ou 'Rejeitar' para recusar.",
          "Após aprovação, a loja poderá criar cupons e receber clientes.",
        ],
      },
    ],
  },

  "/csv-import": {
    pageTitle: "Importar CSV",
    sections: [
      {
        title: "Importação em lote",
        summary: "Importe lojas e dados em massa usando arquivos CSV.",
        steps: [
          "Baixe o modelo CSV clicando em 'Download modelo'.",
          "Preencha os dados seguindo o formato do modelo.",
          "Faça upload do arquivo preenchido.",
          "Revise os erros (se houver) na tela de resultado.",
          "Corrija e reimporte os registros com erro.",
        ],
        tips: [
          "O arquivo deve estar codificado em UTF-8.",
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
          "Configure o valor em dinheiro de cada ponto (money_per_point).",
          "Defina se lojas podem criar regras customizadas e os limites permitidos.",
          "Ative 'Exigir código de recibo' se desejar rastreabilidade extra.",
        ],
        tips: [
          "Regras de loja customizadas precisam de aprovação se 'Requer aprovação' estiver ativo.",
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
          "O sistema valida automaticamente limites diários e por compra.",
          "Códigos de recibo duplicados são bloqueados para evitar fraudes.",
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
          "Clique em 'Nova oferta' para iniciar o wizard de criação.",
          "Preencha: título, descrição, valor de resgate, compra mínima.",
          "Configure dias da semana, horários e limites de uso.",
          "Defina o período de validade (início e fim).",
          "Revise os termos e publique a oferta.",
        ],
        tips: [
          "Ofertas em 'Rascunho' não são visíveis para clientes.",
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
          "Clique em um resgate para ver: oferta, cliente, PIN, valor aplicado.",
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
          "Altere o status do cliente (ativo/inativo) se necessário.",
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
          "Preencha nome, e-mail e selecione a role (papel).",
          "Atribua a marca e/ou filial de acesso.",
          "O usuário receberá um e-mail para definir sua senha.",
        ],
        tips: [
          "Cada role define um conjunto de permissões padrão.",
          "Use 'overrides' para conceder ou negar permissões específicas.",
        ],
      },
    ],
  },

  "/brand-modules": {
    pageTitle: "Módulos",
    sections: [
      {
        title: "Ativar/desativar módulos",
        summary: "Controle quais funcionalidades estão disponíveis na sua marca.",
        steps: [
          "A lista mostra todos os módulos disponíveis com toggle de ativação.",
          "Ative um módulo para habilitar o menu e as funcionalidades correspondentes.",
          "Desative módulos que não são usados para simplificar o menu.",
        ],
        tips: [
          "Módulos desativados ocultam o menu correspondente em todos os consoles da marca.",
          "Módulos 'core' não podem ser desativados.",
        ],
      },
    ],
  },

  "/audit": {
    pageTitle: "Auditoria",
    sections: [
      {
        title: "Rastrear atividades",
        summary: "Acompanhe todas as ações realizadas por usuários na plataforma.",
        steps: [
          "Use filtros de data, tipo de entidade e ação para refinar a busca.",
          "Cada registro mostra: quem fez, o que fez, quando e quais dados mudaram.",
          "Clique em uma entrada para ver o 'antes e depois' das alterações.",
        ],
        tips: [
          "Os logs são filtrados automaticamente pelo seu escopo de acesso.",
          "Administradores de marca veem apenas ações da sua marca.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     RELATÓRIOS
     ═══════════════════════════════════════════════ */
  "/reports": {
    pageTitle: "Relatórios",
    sections: [
      {
        title: "Visualizar relatórios",
        summary: "Acesse relatórios de performance, anti-fraude e gráficos.",
        steps: [
          "Selecione a aba desejada: Performance, Anti-fraude ou Gráficos.",
          "Em 'Performance por Cupom': veja resgates, taxa de conversão e valor total por oferta.",
          "Em 'Anti-fraude': identifique recibos duplicados e emissores suspeitos.",
          "Em 'Gráficos': analise tendências com gráficos de barras, linhas e pizza.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     PAINEL DO LOJISTA (STORE_ADMIN)
     ═══════════════════════════════════════════════ */
  "/store-panel": {
    pageTitle: "Painel do Lojista",
    sections: [
      {
        title: "Visão geral do painel",
        summary: "O painel do lojista é o centro de controle da sua loja na plataforma.",
        steps: [
          "No topo, veja os KPIs: resgates pendentes, cupons ativos e clientes atendidos.",
          "Use as abas inferiores para navegar entre as funcionalidades.",
        ],
      },
      {
        title: "Criar um cupom",
        summary: "O wizard guiará você passo a passo na criação do seu cupom.",
        steps: [
          "Clique em 'Novo Cupom' na aba 'Cupom'.",
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
        summary: "Quando um cliente apresentar um cupom, valide com PIN + CPF.",
        steps: [
          "Acesse a aba 'Resgate'.",
          "Peça ao cliente o PIN de 6 dígitos.",
          "Digite o PIN e o CPF do cliente.",
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
          "Veja KPIs no topo: total de resgates, pontos emitidos, valor creditado.",
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
        summary: "Defina sua própria taxa de pontuação (se permitido pela marca).",
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
        title: "Aprovar regras customizadas",
        summary: "Revise e aprove regras de pontos criadas por lojas.",
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
        title: "Enviar notificação push",
        summary: "Envie mensagens para clientes da plataforma.",
        steps: [
          "Defina o título e o corpo da mensagem.",
          "Selecione o público-alvo.",
          "Clique em 'Enviar'.",
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════
     REGISTRO DE LOJA
     ═══════════════════════════════════════════════ */
  "/register-store": {
    pageTitle: "Cadastro de Loja",
    sections: [
      {
        title: "Registrar sua loja na plataforma",
        summary: "Siga o wizard para cadastrar seu estabelecimento.",
        steps: [
          "Preencha os dados do responsável: nome completo, CPF, telefone.",
          "Informe os dados da empresa: CNPJ, razão social, nome fantasia.",
          "Adicione endereço completo e categoria de atuação.",
          "Faça upload do logo da loja.",
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
        title: "Gerenciar ofertas de afiliados",
        summary: "Crie links de afiliados para produtos e serviços parceiros.",
        steps: [
          "Clique em 'Nova oferta'.",
          "Preencha: título, descrição, preço, URL de afiliado.",
          "Faça upload da imagem do produto.",
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
    pageTitle: "Preview do App do Cliente",
    sections: [
      {
        title: "Visualizar o app como cliente",
        summary: "Veja como o app aparece para os clientes finais.",
        steps: [
          "Navegue pelas seções da Home para verificar a aparência.",
          "Teste ofertas, perfil de loja e funcionalidades de resgate.",
          "Use este preview para validar alterações de tema e seções antes de publicar.",
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
