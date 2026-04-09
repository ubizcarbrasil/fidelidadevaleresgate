import type { GrupoManual } from "./tipos_manuais";

export const gruposManuais: GrupoManual[] = [
  {
    categoria: "Personalização & Vitrine",
    icone: "Palette",
    manuais: [
      {
        id: "aparencia-marca",
        titulo: "Aparência da Marca",
        descricao: "Personalize as cores, logo, favicon e identidade visual da sua marca no aplicativo. Tudo que o cliente final vê reflete o que você configura aqui.",
        comoAtivar: "Esse módulo já vem ativo por padrão. Acesse pelo menu lateral em 'Aparência da Marca'.",
        passos: [
          "Acesse 'Aparência da Marca' no menu lateral.",
          "Faça upload do logotipo da marca (recomendado: PNG com fundo transparente, mínimo 512×512px).",
          "Defina a cor primária e a cor de destaque da marca.",
          "Configure o favicon que aparecerá na aba do navegador.",
          "Preencha o nome de exibição da marca.",
          "Salve as alterações e visualize no preview do aplicativo."
        ],
        dicas: [
          "Use imagens de alta qualidade para o logo para melhor aparência em todos os dispositivos.",
          "Escolha cores com bom contraste para facilitar a leitura.",
          "Teste a aparência tanto no modo claro quanto no modo escuro."
        ],
        rota: "/brands"
      },
      {
        id: "cidades",
        titulo: "Cidades (Branches)",
        descricao: "Gerencie as cidades ou regiões onde sua marca opera. Cada cidade funciona como uma 'filial' que agrupa parceiros, clientes e configurações específicas da localidade.",
        comoAtivar: "Módulo ativo por padrão. Acesse 'Cidades' no menu lateral para adicionar ou editar.",
        passos: [
          "Acesse 'Cidades' no menu lateral.",
          "Clique em 'Nova Cidade' para adicionar uma localidade.",
          "Preencha o nome da cidade, estado e slug (identificador único).",
          "Opcionalmente, configure latitude e longitude para geolocalização.",
          "Defina o fuso horário da cidade.",
          "Configure o Modelo de Pontuação (Motorista, Cliente ou Ambos).",
          "Na seção 'Módulos de Negócio', ative ou desative os módulos disponíveis para esta cidade: Duelo, Achadinho, Mercado Livre, Corra e Ganhe Pontos e Cliente Pontua.",
          "Na seção 'Gamificação de Motoristas', configure duelos, ranking e cinturão.",
          "Ative ou desative a cidade conforme necessário.",
          "Salve e a cidade ficará disponível para vincular parceiros e clientes."
        ],
        dicas: [
          "O slug deve ser único e sem espaços (use hífens).",
          "Cidades inativas não aparecem para o usuário final.",
          "Os Módulos de Negócio controlam quais funcionalidades aparecem no painel do franqueado de cada cidade.",
          "Módulos desativados são ocultos automaticamente no sidebar e no dashboard da cidade.",
          "Vincule parceiros à cidade correta para segmentar corretamente ofertas e pontos."
        ],
        rota: "/branches"
      },
      {
        id: "biblioteca-icones",
        titulo: "Biblioteca de Ícones",
        descricao: "Gerencie ícones personalizados que podem ser usados em seções, menus e cards do aplicativo. Faça upload dos seus próprios ícones para manter a identidade visual.",
        comoAtivar: "Ative o módulo 'Biblioteca de Ícones' na página de Módulos. Disponível nos planos intermediário e avançado.",
        passos: [
          "Acesse 'Biblioteca de Ícones' no menu lateral.",
          "Clique em 'Adicionar Ícone' para fazer upload.",
          "Selecione a imagem do ícone (recomendado: SVG ou PNG com fundo transparente).",
          "Dê um nome identificador ao ícone.",
          "Salve e o ícone ficará disponível para uso nas seções do app."
        ],
        dicas: [
          "SVGs ficam mais nítidos em qualquer tamanho.",
          "Mantenha padrão de tamanho entre os ícones para uniformidade visual.",
          "Use nomes descritivos para facilitar a busca."
        ],
        rota: "/icon-library"
      },
      {
        id: "landing-parceiros",
        titulo: "Landing Page Parceiros",
        descricao: "Configure uma página de apresentação para atrair novos parceiros à sua plataforma. Essa landing page pode ser compartilhada publicamente.",
        comoAtivar: "Ative o módulo 'Landing Page Parceiros' na página de Módulos.",
        passos: [
          "Acesse 'Landing Page Parceiros' no menu lateral.",
          "Configure o título, subtítulo e descrição da página.",
          "Faça upload de imagens e banners de destaque.",
          "Defina os benefícios que serão exibidos para os parceiros.",
          "Configure o formulário de contato ou botão de ação.",
          "Publique a página e compartilhe o link gerado."
        ],
        dicas: [
          "Use textos claros e objetivos sobre os benefícios para parceiros.",
          "Inclua depoimentos de parceiros existentes para gerar confiança.",
          "Teste o link em dispositivos móveis antes de compartilhar."
        ],
        rota: "/partner-landing-config"
      },
      {
        id: "boas-vindas",
        titulo: "Boas-Vindas (Welcome Tour)",
        descricao: "Configure o tour de boas-vindas que é exibido para novos usuários no primeiro acesso ao aplicativo. Guie seus clientes pelos recursos principais.",
        comoAtivar: "Ative o módulo 'Boas-Vindas' na página de Módulos.",
        passos: [
          "Acesse 'Boas-Vindas' no menu lateral.",
          "Adicione as telas (slides) do tour de boas-vindas.",
          "Para cada tela, defina imagem, título e descrição.",
          "Organize a ordem dos slides arrastando-os.",
          "Configure o botão de ação final (ex: 'Começar', 'Entrar').",
          "Salve e o tour será exibido no primeiro acesso do usuário."
        ],
        dicas: [
          "Use no máximo 4-5 telas para não cansar o usuário.",
          "Destaque os benefícios mais atrativos da plataforma.",
          "Inclua imagens ilustrativas de alta qualidade."
        ],
        rota: "/welcome-tour"
      },
      {
        id: "links-perfil",
        titulo: "Links do Perfil",
        descricao: "Configure links úteis que aparecem no perfil do usuário dentro do aplicativo, como redes sociais, termos de uso, políticas e canais de atendimento.",
        comoAtivar: "Ative o módulo 'Links do Perfil' na página de Módulos.",
        passos: [
          "Acesse 'Links do Perfil' no menu lateral.",
          "Clique em 'Adicionar Link'.",
          "Preencha o título do link, URL de destino e escolha um ícone.",
          "Defina a ordem de exibição.",
          "Ative ou desative links conforme necessidade.",
          "Salve as alterações."
        ],
        dicas: [
          "Inclua links essenciais como Termos de Uso e Política de Privacidade.",
          "Links para redes sociais aumentam o engajamento.",
          "Mantenha os links atualizados e funcionais."
        ],
        rota: "/profile-links"
      },
      {
        id: "layout-ofertas",
        titulo: "Layout de Ofertas",
        descricao: "Personalize como os cards de ofertas são exibidos no aplicativo. Configure formato, informações visíveis, cores e estilos dos cards.",
        comoAtivar: "Ative o módulo 'Layout de Ofertas' na página de Módulos.",
        passos: [
          "Acesse 'Layout de Ofertas' no menu lateral.",
          "Escolha o template base do card de oferta.",
          "Configure quais informações serão visíveis (preço, desconto, validade, etc.).",
          "Personalize cores e bordas do card.",
          "Visualize o preview em tempo real.",
          "Salve as configurações."
        ],
        dicas: [
          "Cards mais limpos tendem a ter melhor conversão.",
          "Destaque sempre o desconto ou benefício principal.",
          "Teste a aparência em telas pequenas (mobile)."
        ],
        rota: "/offer-card-config"
      },
      {
        id: "editor-paginas",
        titulo: "Editor de Páginas",
        descricao: "Crie páginas personalizadas para o aplicativo usando o editor visual drag-and-drop. Monte seções com banners, lojas, ofertas, links e muito mais.",
        comoAtivar: "Ative o módulo 'Editor de Páginas' na página de Módulos. Disponível nos planos intermediário e avançado.",
        passos: [
          "Acesse 'Editor de Páginas' no menu lateral.",
          "Clique em 'Nova Página' para criar uma página personalizada.",
          "Defina título, slug e subtítulo da página.",
          "Adicione seções usando o botão '+ Seção'.",
          "Escolha o tipo de seção: banners, lista de lojas, ofertas, links, etc.",
          "Configure cada seção individualmente (ordem, filtros, aparência).",
          "Publique a página quando estiver pronta.",
          "A página ficará acessível pelo slug configurado."
        ],
        dicas: [
          "Use slugs descritivos e curtos para facilitar o acesso.",
          "Combine diferentes tipos de seção para páginas mais ricas.",
          "Teste a página em modo preview antes de publicar."
        ],
        rota: "/page-builder-v2"
      },
      {
        id: "midia-banners",
        titulo: "Mídia & Banners",
        descricao: "Gerencie banners promocionais que aparecem no aplicativo. Configure imagens, links de destino, agendamento de exibição e posicionamento.",
        comoAtivar: "Ative o módulo 'Banners' na página de Módulos.",
        passos: [
          "Acesse 'Mídia & Banners' no menu lateral.",
          "Clique em 'Novo Banner' para adicionar um banner.",
          "Faça upload da imagem do banner (recomendado: 1080×400px para banners horizontais).",
          "Configure o link de destino ao clicar no banner.",
          "Defina a data de início e fim da exibição.",
          "Escolha a seção/posição onde o banner aparecerá.",
          "Organize a ordem dos banners arrastando-os.",
          "Ative o banner e salve."
        ],
        dicas: [
          "Banners com chamadas claras (CTA) geram mais cliques.",
          "Agende banners sazonais com antecedência.",
          "Remova ou desative banners expirados para manter o app organizado."
        ],
        rota: "/banner-manager"
      },
      {
        id: "minhas-cidades",
        titulo: "Minhas Cidades",
        descricao: "Gerencie as cidades da sua marca com ações rápidas de edição e reset de pontos. Cada cidade exibe botões 'Resetar pontos' e 'Editar' diretamente na listagem para acesso rápido.",
        comoAtivar: "Acesse 'Minhas Cidades' no menu lateral. Disponível para marcas com modelo de mobilidade.",
        passos: [
          "Acesse 'Minhas Cidades' no menu lateral.",
          "Visualize todas as cidades da marca com status ativo/inativo.",
          "Clique em 'Editar' para abrir a tela de edição da cidade (nome, slug, geolocalização, scoring model, módulos de negócio).",
          "Na edição, configure os Módulos de Negócio: Duelo, Achadinho, Mercado Livre, Corra e Ganhe Pontos e Cliente Pontua.",
          "Clique em 'Resetar pontos' para abrir o diálogo de reset granular.",
          "No diálogo de reset, escolha o escopo: todos os usuários, apenas motoristas, apenas clientes ou um usuário específico.",
          "Confirme o reset — os pontos serão zerados e registrados no extrato como BRANCH_RESET.",
          "Consulte o histórico de resets no mesmo diálogo para auditoria (data, escopo, total zerado).",
          "O reset de pontos também está disponível dentro da tela de edição da cidade."
        ],
        dicas: [
          "O reset é irreversível — confirme com cuidado antes de executar.",
          "Use o reset individual para corrigir saldos de um usuário específico sem afetar os demais.",
          "Os Módulos de Negócio permitem personalizar a experiência de cada cidade — desative o que não se aplica.",
          "O histórico de resets é visível diretamente no diálogo para fins de auditoria.",
          "Cidades inativas não distribuem pontos, mas os dados são preservados."
        ],
        rota: "/brand-branches"
      },
    ],
  },
  {
    categoria: "Achadinhos",
    icone: "Sparkles",
    manuais: [
      {
        id: "achadinhos",
        titulo: "Achadinhos (Produtos Afiliados)",
        descricao: "Gerencie produtos de afiliados que são exibidos como 'achadinhos' no aplicativo. São ofertas de parceiros externos com links de afiliado para gerar receita.",
        comoAtivar: "Ative o módulo 'Achadinhos' na página de Módulos.",
        passos: [
          "Acesse 'Achadinhos' no menu lateral.",
          "Clique em 'Novo Achadinho' para cadastrar manualmente, ou use a importação.",
          "Preencha título, descrição, preço original e preço promocional.",
          "Cole o link de afiliado no campo 'URL do Afiliado'.",
          "Faça upload da imagem do produto.",
          "Selecione a categoria do achadinho.",
          "Defina se é destaque (featured) ou promoção relâmpago (flash).",
          "Ative e salve o achadinho."
        ],
        dicas: [
          "Achadinhos com boas imagens e preços atrativos geram mais cliques.",
          "Use categorias para organizar e facilitar a navegação.",
          "Monitore os cliques para entender o engajamento."
        ],
        rota: "/affiliate-deals"
      },
      {
        id: "categorias-achadinhos",
        titulo: "Categorias de Achadinhos",
        descricao: "Organize os achadinhos em categorias temáticas como Eletrônicos, Moda, Casa, etc. Facilite a navegação dos usuários com categorias bem definidas.",
        comoAtivar: "Disponível automaticamente quando o módulo 'Achadinhos' está ativo.",
        passos: [
          "Acesse 'Categorias de Achadinhos' no menu lateral.",
          "Clique em 'Nova Categoria'.",
          "Defina nome, cor e ícone da categoria.",
          "Adicione palavras-chave para auto-categorização.",
          "Defina a ordem de exibição.",
          "Ative a categoria e salve."
        ],
        dicas: [
          "Palavras-chave ajudam na categorização automática de novos achadinhos.",
          "Use cores distintas para diferenciar visualmente as categorias.",
          "Não crie categorias demais — mantenha entre 5 e 12 para boa usabilidade."
        ],
        rota: "/affiliate-categories"
      },
      {
        id: "espelhamento",
        titulo: "Espelhamento de Achadinhos",
        descricao: "Sincronize achadinhos automaticamente a partir de fontes externas como grupos de Telegram, APIs ou feeds. Mantenha seu catálogo sempre atualizado sem trabalho manual.",
        comoAtivar: "Disponível automaticamente quando o módulo 'Achadinhos' está ativo.",
        passos: [
          "Acesse 'Espelhamento Achadinho' no menu lateral.",
          "Configure a fonte de dados (grupo, API ou feed).",
          "Defina as regras de filtragem e mapeamento de campos.",
          "Configure a frequência de sincronização.",
          "Ative o espelhamento.",
          "Monitore o status de sincronização e erros no painel."
        ],
        dicas: [
          "Configure filtros para evitar importar produtos irrelevantes.",
          "Monitore regularmente os erros de sincronização.",
          "Use a governança para revisar achadinhos importados automaticamente."
        ],
        rota: "/mirror-sync"
      },
      {
        id: "governanca-achadinhos",
        titulo: "Governança de Achadinhos",
        descricao: "Controle a qualidade e moderação dos achadinhos da plataforma. Revise, aprove ou rejeite achadinhos antes de serem publicados. Defina regras automáticas de moderação.",
        comoAtivar: "Disponível automaticamente quando o módulo 'Achadinhos' está ativo.",
        passos: [
          "Acesse 'Governança Achadinho' no menu lateral.",
          "Visualize os achadinhos pendentes de aprovação.",
          "Revise título, imagem, preço e link de cada achadinho.",
          "Aprove ou rejeite cada item individualmente.",
          "Configure regras automáticas de moderação (palavras bloqueadas, faixa de preço).",
          "Monitore o histórico de moderação."
        ],
        dicas: [
          "Defina critérios claros de aprovação para manter a qualidade.",
          "Regras automáticas agilizam a moderação em grande volume.",
          "Revise periodicamente as regras para ajustá-las."
        ],
        rota: "/offer-governance"
      },
      {
        id: "painel-motorista",
        titulo: "Painel do Motorista (Config)",
        descricao: "Configure o painel exclusivo para motoristas parceiros. Defina quais funcionalidades, ofertas e informações ficam visíveis no painel do motorista.",
        comoAtivar: "Acesse 'Painel do Motorista' no menu lateral. Requer que a integração de mobilidade esteja configurada.",
        passos: [
          "Acesse 'Painel do Motorista' no menu lateral.",
          "Configure as seções visíveis no painel (saldo, ofertas, achadinhos).",
          "Defina a ordem das seções.",
          "Configure banners específicos para motoristas.",
          "Personalize textos e mensagens de boas-vindas.",
          "Salve as configurações."
        ],
        dicas: [
          "Mantenha o painel simples e direto — motoristas usam durante o trabalho.",
          "Destaque o saldo de pontos e ofertas disponíveis.",
          "Teste a experiência no celular, pois é o dispositivo principal."
        ],
        rota: "/driver-config"
      },
    ],
  },
  {
    categoria: "Resgate com Pontos",
    icone: "ShoppingBag",
    manuais: [
      {
        id: "produtos-resgate",
        titulo: "Produtos de Resgate",
        descricao: "Cadastre produtos físicos ou digitais que os clientes podem resgatar usando seus pontos de fidelidade. Configure fotos, custo em pontos, estoque e regras.",
        comoAtivar: "Este módulo já vem ativo por padrão para todas as marcas.",
        passos: [
          "Acesse 'Produtos de Resgate' no menu lateral.",
          "Clique em 'Novo Produto' para cadastrar.",
          "Preencha nome, descrição e faça upload da foto do produto.",
          "Defina o custo em pontos para resgate.",
          "Configure o estoque disponível (ou ilimitado).",
          "Defina se o produto é digital ou físico.",
          "Ative o produto e salve."
        ],
        dicas: [
          "Produtos com boas fotos geram mais interesse de resgate.",
          "Mantenha o estoque atualizado para evitar frustrações.",
          "Varie os produtos entre digitais e físicos para atender todos os perfis."
        ],
        rota: "/produtos-resgate"
      },
      {
        id: "regras-resgate",
        titulo: "Regras de Resgate",
        descricao: "Configure regras globais de resgate como mínimo de pontos, limite de resgates por período, e restrições por categoria de cliente.",
        comoAtivar: "Este módulo já vem ativo por padrão para todas as marcas.",
        passos: [
          "Acesse 'Regras de Resgate' no menu lateral.",
          "Defina o saldo mínimo de pontos para permitir resgate.",
          "Configure limite de resgates por dia/semana/mês por cliente.",
          "Defina restrições por tier de fidelidade, se aplicável.",
          "Configure mensagens personalizadas para cada regra.",
          "Salve as regras."
        ],
        dicas: [
          "Regras muito restritivas podem desestimular o engajamento.",
          "Use limites para controlar custos sem frustrar o cliente.",
          "Revise as regras periodicamente com base nos dados de resgate."
        ],
        rota: "/regras-resgate"
      },
      {
        id: "pedidos-resgate",
        titulo: "Pedidos de Resgate",
        descricao: "Acompanhe e gerencie todos os pedidos de resgate feitos pelos clientes. Visualize status, detalhes do pedido e realize a gestão de entrega.",
        comoAtivar: "Este módulo já vem ativo por padrão para todas as marcas.",
        passos: [
          "Acesse 'Pedidos de Resgate' no menu lateral.",
          "Visualize a lista de pedidos com filtros por status (pendente, aprovado, entregue).",
          "Clique em um pedido para ver os detalhes completos.",
          "Atualize o status do pedido conforme o andamento da entrega.",
          "Para produtos físicos, registre informações de envio.",
          "Exporte relatórios de pedidos se necessário."
        ],
        dicas: [
          "Processe os pedidos rapidamente para manter a satisfação.",
          "Use filtros de data para acompanhar pedidos recentes.",
          "Mantenha o cliente informado sobre o status do pedido."
        ],
        rota: "/product-redemption-orders"
      },
    ],
  },
  {
    categoria: "Comercialização de Pontos",
    icone: "Package",
    manuais: [
      {
        id: "pacotes-pontos",
        titulo: "Pacotes de Pontos",
        descricao: "Crie pacotes de pontos com preço fixo para que as cidades (franqueados) possam comprar diretamente pelo painel. É o modelo de comercialização da plataforma: o empreendedor define os pacotes e aprova os pedidos.",
        comoAtivar: "Acesse 'Pacotes de Pontos' no menu lateral, dentro do grupo 'Cidades'.",
        passos: [
          "Acesse 'Pacotes de Pontos' no menu lateral.",
          "Na aba 'Pacotes', clique em 'Novo Pacote' para criar um pacote.",
          "Defina o nome do pacote (ex: 'Pacote Básico'), quantidade de pontos e preço em R$.",
          "Adicione uma descrição opcional para orientar o franqueado.",
          "Ative ou desative o pacote conforme necessidade.",
          "Na aba 'Pedidos', visualize os pedidos feitos pelos franqueados.",
          "Para cada pedido pendente, clique em 'Confirmar' para aprovar ou 'Cancelar' para recusar.",
          "Ao confirmar, os pontos são creditados automaticamente na carteira da cidade.",
        ],
        dicas: [
          "Crie pacotes com diferentes faixas de preço para atender cidades de todos os tamanhos.",
          "A confirmação do pedido é atômica — os pontos são creditados e a transação registrada automaticamente.",
          "Monitore os pedidos pendentes regularmente para não atrasar a operação das cidades.",
          "Pacotes inativos não aparecem na loja do franqueado, mas os pedidos existentes são mantidos.",
        ],
        rota: "/points-packages",
      },
      {
        id: "modulos-negocio",
        titulo: "Módulos de Negócio por Cidade",
        descricao: "Configure quais funcionalidades cada cidade terá disponível. Ative ou desative módulos individualmente para personalizar o modelo de negócio de cada franqueado.",
        comoAtivar: "Acesse 'Minhas Cidades' > 'Editar' cidade. Os módulos ficam no card 'Módulos de Negócio'.",
        passos: [
          "Acesse 'Minhas Cidades' no menu lateral.",
          "Clique em 'Editar' na cidade desejada.",
          "No card 'Módulos de Negócio', configure os 5 módulos:",
          "• Módulo Duelo — competições entre motoristas com apostas de pontos.",
          "• Módulo Achadinho — vitrine de ofertas afiliadas.",
          "• Módulo Mercado Livre — marketplace de produtos para motoristas.",
          "• Módulo Corra e Ganhe Pontos — motoristas acumulam pontos por corrida.",
          "• Módulo Cliente Pontua — programa de fidelidade para clientes em lojas parceiras.",
          "Ative ou desative cada módulo usando o toggle.",
          "Salve as alterações — o painel do franqueado será atualizado imediatamente.",
        ],
        dicas: [
          "Todos os módulos vêm ativados por padrão — é um modelo opt-out.",
          "Módulos desativados ocultam automaticamente os menus e KPIs correspondentes no painel do franqueado.",
          "Cada cidade pode ter uma configuração diferente, permitindo modelos de negócio distintos.",
          "Desativar um módulo não apaga dados — você pode reativá-lo a qualquer momento.",
        ],
        rota: "/brand-branches",
      },
    ],
  },
  {
    categoria: "Gestão Comercial",
    icone: "Store",
    manuais: [
      {
        id: "caixa-pdv",
        titulo: "Caixa PDV",
        descricao: "Terminal de ponto de venda para operadores do caixa pontuarem clientes. O operador informa o CPF e o valor da compra para registrar pontos automaticamente.",
        comoAtivar: "Ative o módulo 'Pontuar na Loja' na página de Módulos.",
        passos: [
          "Acesse 'Caixa PDV' no menu lateral.",
          "O operador informa o CPF ou telefone do cliente.",
          "O sistema localiza o cliente e exibe o saldo atual.",
          "Informe o valor da compra realizada.",
          "O sistema calcula os pontos automaticamente com base nas regras.",
          "Confirme a pontuação.",
          "O cliente recebe os pontos instantaneamente."
        ],
        dicas: [
          "Treine os operadores no uso do PDV antes de liberar.",
          "Certifique-se de que as regras de pontuação estão configuradas.",
          "O PDV funciona melhor em tablets ou computadores no caixa."
        ],
        rota: "/pdv"
      },
      {
        id: "ofertas",
        titulo: "Ofertas",
        descricao: "Crie e gerencie ofertas e promoções dos parceiros que aparecem no aplicativo. Ofertas atraem clientes e geram engajamento com a plataforma.",
        comoAtivar: "Ative o módulo 'Ofertas' na página de Módulos.",
        passos: [
          "Acesse 'Ofertas' no menu lateral.",
          "Clique em 'Nova Oferta'.",
          "Selecione o parceiro responsável pela oferta.",
          "Preencha título, descrição e condições da oferta.",
          "Faça upload da imagem da oferta.",
          "Defina data de início e validade.",
          "Configure o tipo de desconto (percentual, valor fixo, brinde).",
          "Ative a oferta e salve."
        ],
        dicas: [
          "Ofertas com prazo curto geram senso de urgência.",
          "Imagens de qualidade aumentam a taxa de clique.",
          "Monitore as ofertas mais populares e replique o formato."
        ],
        rota: "/offers"
      },
      {
        id: "resgates",
        titulo: "Resgates (QR Code)",
        descricao: "Gerencie resgates de ofertas feitos pelos clientes via QR Code. O cliente apresenta o QR no parceiro e o operador valida o resgate.",
        comoAtivar: "Ative o módulo 'Resgate QR' na página de Módulos.",
        passos: [
          "O cliente seleciona uma oferta no app e gera um QR Code de resgate.",
          "O cliente apresenta o QR Code no parceiro.",
          "O operador acessa 'Resgates' no painel e escaneia o QR Code.",
          "O sistema valida o resgate e debita os pontos (se aplicável).",
          "O resgate é registrado no histórico.",
          "O parceiro libera o benefício ao cliente."
        ],
        dicas: [
          "Treine os operadores dos parceiros para escanear QR Codes.",
          "Verifique se os dispositivos têm câmera funcional.",
          "Monitore resgates para identificar possíveis fraudes."
        ],
        rota: "/redemptions"
      },
      {
        id: "cupons",
        titulo: "Cupons",
        descricao: "Crie e distribua cupons de desconto para seus clientes. Cupons podem ser únicos ou em lote, com regras de validade e uso.",
        comoAtivar: "Ative o módulo 'Cupons' na página de Módulos.",
        passos: [
          "Acesse 'Cupons' no menu lateral.",
          "Clique em 'Novo Cupom' ou use o assistente de criação.",
          "Defina o tipo de cupom (desconto fixo, percentual, brinde).",
          "Configure o valor do desconto.",
          "Defina a validade e limite de usos.",
          "Vincule o cupom a um parceiro e cidade.",
          "Gere o código do cupom (automático ou manual).",
          "Distribua o código aos clientes."
        ],
        dicas: [
          "Cupons com prazo curto incentivam o uso rápido.",
          "Limite os usos para controlar o custo da promoção.",
          "Acompanhe a taxa de uso dos cupons para medir o ROI."
        ],
        rota: "/vouchers"
      },
      {
        id: "parceiros",
        titulo: "Parceiros (Lojas)",
        descricao: "Gerencie os parceiros (lojas, comércios, prestadores) cadastrados na plataforma. Configure informações, horários, categorias e status de cada parceiro.",
        comoAtivar: "Ative o módulo 'Parceiros' na página de Módulos.",
        passos: [
          "Acesse 'Parceiros' no menu lateral.",
          "Clique em 'Novo Parceiro' para cadastrar.",
          "Preencha nome, descrição, endereço e contato.",
          "Faça upload do logo e imagem de capa.",
          "Vincule à cidade (branch) correspondente.",
          "Configure categorias e tags do parceiro.",
          "Defina horários de funcionamento.",
          "Ative o parceiro e salve."
        ],
        dicas: [
          "Parceiros com perfil completo geram mais confiança.",
          "Mantenha as informações de contato atualizadas.",
          "Use categorias para facilitar a busca pelo cliente."
        ],
        rota: "/stores"
      },
      {
        id: "clientes",
        titulo: "Clientes",
        descricao: "Visualize e gerencie a base de clientes da plataforma. Veja saldo de pontos, histórico, dados de contato e status de cada cliente.",
        comoAtivar: "Ative o módulo 'Carteira' na página de Módulos.",
        passos: [
          "Acesse 'Clientes' no menu lateral.",
          "Visualize a lista completa de clientes com busca e filtros.",
          "Clique em um cliente para ver detalhes (saldo, histórico, dados).",
          "Edite informações do cliente se necessário.",
          "Consulte o extrato de pontos e resgates do cliente.",
          "Ative ou desative clientes conforme necessidade."
        ],
        dicas: [
          "Use filtros para segmentar clientes por saldo, atividade ou cidade.",
          "Monitore clientes inativos para campanhas de reengajamento.",
          "Exporte dados de clientes para análises externas."
        ],
        rota: "/customers"
      },
      {
        id: "motoristas",
        titulo: "Motoristas",
        descricao: "Gerencie motoristas parceiros da plataforma. Visualize dados, saldo de pontos, corridas realizadas e status de cada motorista.",
        comoAtivar: "Ative o módulo 'Integração Mobilidade' na página de Módulos.",
        passos: [
          "Acesse 'Motorista' no menu lateral.",
          "Visualize a lista de motoristas com dados de corridas e pontos.",
          "Clique em um motorista para ver o perfil completo.",
          "Consulte o extrato de pontos e histórico de corridas.",
          "Gerencie o saldo e ajustes de pontos.",
          "Veja o ranking de motoristas por corridas ou pontos."
        ],
        dicas: [
          "Acompanhe os motoristas mais ativos para premiações.",
          "Use o extrato para resolver contestações de pontos.",
          "Monitore a saúde geral da base de motoristas."
        ],
        rota: "/motoristas"
      },
      {
        id: "patrocinados",
        titulo: "Patrocinados",
        descricao: "Gerencie posicionamentos patrocinados no aplicativo. Parceiros podem pagar por destaque em seções especiais para maior visibilidade.",
        comoAtivar: "Ative o módulo 'Patrocinados' na página de Módulos.",
        passos: [
          "Acesse 'Patrocinados' no menu lateral.",
          "Clique em 'Novo Patrocínio'.",
          "Selecione o parceiro que será patrocinado.",
          "Defina a posição e seção de destaque.",
          "Configure o período do patrocínio (início e fim).",
          "Defina o valor ou contrapartida.",
          "Ative o patrocínio e salve."
        ],
        dicas: [
          "Limite o número de patrocinados para manter a exclusividade.",
          "Rotacione os patrocinados para dar oportunidade a diferentes parceiros.",
          "Monitore os cliques e engajamento dos patrocinados."
        ],
        rota: "/sponsored-placements"
      },
    ],
  },
  {
    categoria: "Programa de Fidelidade",
    icone: "Coins",
    manuais: [
      {
        id: "pontuar",
        titulo: "Pontuar",
        descricao: "Registre pontos para clientes manualmente. Útil para bonificações especiais, ajustes ou pontuação fora do PDV automático.",
        comoAtivar: "Ative o módulo 'Pontuar na Loja' na página de Módulos.",
        passos: [
          "Acesse 'Pontuar' no menu lateral.",
          "Busque o cliente por CPF, telefone ou nome.",
          "Selecione o cliente na lista de resultados.",
          "Informe a quantidade de pontos a adicionar.",
          "Adicione uma justificativa/motivo da pontuação.",
          "Confirme a operação.",
          "Os pontos são creditados instantaneamente."
        ],
        dicas: [
          "Sempre registre um motivo claro para pontuações manuais.",
          "Pontuações manuais ficam registradas na auditoria.",
          "Use para bonificações de aniversário, compensações ou promoções especiais."
        ],
        rota: "/earn-points"
      },
      {
        id: "regras-fidelidade",
        titulo: "Regras de Fidelidade",
        descricao: "Configure as regras de acúmulo de pontos: quantos pontos por real gasto, multiplicadores, limites e regras especiais por parceiro.",
        comoAtivar: "Ative o módulo 'Pontuar na Loja' na página de Módulos.",
        passos: [
          "Acesse 'Regras de Fidelidade' no menu lateral.",
          "Configure a regra padrão: pontos por real gasto.",
          "Defina multiplicadores para datas especiais ou categorias.",
          "Configure limites de pontuação por transação ou dia.",
          "Defina regras específicas por parceiro (se aplicável).",
          "Salve as regras — elas passam a valer imediatamente."
        ],
        dicas: [
          "Comece com regras simples e ajuste com o tempo.",
          "Multiplicadores em datas comemorativas aumentam o engajamento.",
          "Regras claras geram confiança nos clientes."
        ],
        rota: "/points-rules"
      },
      {
        id: "pontuacao-tier",
        titulo: "Pontuação por Tier",
        descricao: "Configure multiplicadores de pontos baseados no nível (tier) de fidelidade do cliente. Clientes de tier mais alto ganham mais pontos por transação.",
        comoAtivar: "Ative o módulo 'Pontuar na Loja' na página de Módulos.",
        passos: [
          "Acesse 'Pontuação por Tier' no menu lateral.",
          "Visualize os tiers existentes (Bronze, Prata, Ouro, etc.).",
          "Defina o multiplicador de pontos para cada tier.",
          "Configure regras de progressão entre tiers.",
          "Salve as configurações."
        ],
        dicas: [
          "Multiplicadores progressivos incentivam clientes a subir de tier.",
          "Mantenha a diferença entre tiers significativa mas justa.",
          "Comunique os benefícios de cada tier para os clientes."
        ],
        rota: "/tier-points-rules"
      },
      {
        id: "extrato-fidelidade",
        titulo: "Extrato de Fidelidade",
        descricao: "Consulte o histórico detalhado de todas as movimentações de pontos: acúmulos, resgates, expiração, ajustes e transferências.",
        comoAtivar: "Ative o módulo 'Pontuar na Loja' na página de Módulos.",
        passos: [
          "Acesse 'Extrato de Fidelidade' no menu lateral.",
          "Use os filtros para buscar por período, cliente ou tipo de operação.",
          "Visualize o extrato completo com data, tipo, valor e saldo.",
          "Exporte o extrato em formato de relatório, se necessário.",
          "Use os dados para auditorias e análises."
        ],
        dicas: [
          "Consulte o extrato para resolver dúvidas de clientes.",
          "Exporte dados periodicamente para backup.",
          "Use filtros de data para análises de períodos específicos."
        ],
        rota: "/points-ledger"
      },
      {
        id: "pontuacao-motorista",
        titulo: "Regras de Pontuação Motorista",
        descricao: "Configure regras específicas de acúmulo de pontos para motoristas parceiros, baseadas em corridas realizadas, distância ou valor.",
        comoAtivar: "Ative o módulo 'Integração Mobilidade' na página de Módulos.",
        passos: [
          "Acesse 'Regras de Pontuação Motorista' no menu lateral.",
          "Configure a regra base: pontos por corrida realizada.",
          "Defina multiplicadores por período ou meta de corridas.",
          "Configure bonificações por metas alcançadas.",
          "Defina limites de pontuação por período.",
          "Salve as regras."
        ],
        dicas: [
          "Metas progressivas incentivam os motoristas a fazer mais corridas.",
          "Bonificações em horários de pico ajudam na demanda.",
          "Revise as regras mensalmente com base nos dados."
        ],
        rota: "/driver-points-rules"
      },
    ],
  },
  {
    categoria: "Cashback Inteligente",
    icone: "ReceiptText",
    manuais: [
      {
        id: "config-cashback",
        titulo: "Configuração de Cashback",
        descricao: "Configure o sistema de cashback da plataforma (Ganha-Ganha). Defina percentuais de cashback, regras de ativação e distribuição entre parceiros.",
        comoAtivar: "Ative o módulo 'Ganha-Ganha' na página de Módulos.",
        passos: [
          "Acesse 'Config. Cashback' no menu lateral.",
          "Defina o percentual de cashback padrão.",
          "Configure a distribuição: quanto vai para o cliente, marca e plataforma.",
          "Defina regras de ativação (valor mínimo, categorias).",
          "Configure o período de carência para liberação do cashback.",
          "Salve as configurações."
        ],
        dicas: [
          "Percentuais entre 1% e 5% costumam ser sustentáveis.",
          "O período de carência evita fraudes com devoluções.",
          "Teste com poucos parceiros antes de expandir."
        ],
        rota: "/ganha-ganha-config"
      },
      {
        id: "financeiro-cashback",
        titulo: "Financeiro Cashback",
        descricao: "Acompanhe o faturamento e custos do programa de cashback. Veja receitas, despesas e margem por parceiro e período.",
        comoAtivar: "Disponível automaticamente quando o módulo 'Ganha-Ganha' está ativo.",
        passos: [
          "Acesse 'Financeiro Cashback' no menu lateral.",
          "Visualize o resumo financeiro do período atual.",
          "Filtre por parceiro, cidade ou período.",
          "Analise receitas vs. custos de cashback.",
          "Exporte relatórios financeiros para contabilidade.",
          "Monitore a margem de cada parceiro."
        ],
        dicas: [
          "Revise o financeiro semanalmente para evitar surpresas.",
          "Identifique parceiros com margem negativa e ajuste regras.",
          "Use os dados para negociar melhores condições com parceiros."
        ],
        rota: "/ganha-ganha-billing"
      },
      {
        id: "fechamento-financeiro",
        titulo: "Fechamento Financeiro",
        descricao: "Realize o fechamento financeiro do cashback por período. Consolide os valores, gere relatórios de fechamento e prepare a cobrança ou repasse.",
        comoAtivar: "Disponível automaticamente quando o módulo 'Ganha-Ganha' está ativo.",
        passos: [
          "Acesse 'Fechamento Financeiro' no menu lateral.",
          "Selecione o período de fechamento.",
          "Revise os valores consolidados por parceiro.",
          "Verifique ajustes ou contestações pendentes.",
          "Confirme o fechamento do período.",
          "Gere os relatórios de cobrança/repasse.",
          "Envie os relatórios aos parceiros."
        ],
        dicas: [
          "Faça o fechamento no mesmo dia todo mês para manter a rotina.",
          "Confira contestações antes de fechar o período.",
          "Mantenha histórico dos fechamentos para auditoria."
        ],
        rota: "/ganha-ganha-closing"
      },
    ],
  },
  {
    categoria: "Aprovações",
    icone: "ShieldCheck",
    manuais: [
      {
        id: "solicitacoes-upgrade",
        titulo: "Solicitações de Upgrade (Emissor)",
        descricao: "Gerencie solicitações de parceiros que desejam se tornar emissores de pontos. Aprove ou rejeite com base nos critérios definidos.",
        comoAtivar: "Ative o módulo 'Multi-Emissor' na página de Módulos.",
        passos: [
          "Acesse 'Solicitações de Upgrade' no menu lateral.",
          "Visualize as solicitações pendentes.",
          "Analise os dados e documentos do solicitante.",
          "Verifique se atende aos critérios de emissor.",
          "Aprove ou rejeite a solicitação com uma justificativa.",
          "O parceiro é notificado automaticamente da decisão."
        ],
        dicas: [
          "Defina critérios claros e documentados para aprovação.",
          "Responda as solicitações em até 48h para boa experiência.",
          "Mantenha registro das justificativas de rejeição."
        ],
        rota: "/emitter-requests"
      },
      {
        id: "validar-regras",
        titulo: "Validar Regras de Parceiros",
        descricao: "Revise e aprove regras de pontuação criadas pelos parceiros emissores. Garanta que as regras estejam dentro dos parâmetros da marca.",
        comoAtivar: "Ative o módulo 'Multi-Emissor' na página de Módulos.",
        passos: [
          "Acesse 'Validar Regras' no menu lateral.",
          "Visualize as regras pendentes de aprovação.",
          "Analise os parâmetros de cada regra (pontos/real, limites, etc.).",
          "Compare com os parâmetros permitidos pela marca.",
          "Aprove ou rejeite cada regra.",
          "O parceiro é notificado e pode ajustar se rejeitado."
        ],
        dicas: [
          "Defina limites claros para pontos por real.",
          "Regras muito generosas podem gerar custos altos.",
          "Comunique os parâmetros permitidos aos parceiros antecipadamente."
        ],
        rota: "/approve-store-rules"
      },
      {
        id: "catalogo",
        titulo: "Catálogo de Produtos",
        descricao: "Gerencie o catálogo de produtos dos parceiros. Revise e aprove os produtos antes de serem exibidos no aplicativo.",
        comoAtivar: "Ative o módulo 'Catálogo' na página de Módulos.",
        passos: [
          "Acesse 'Catálogo' no menu lateral.",
          "Visualize os produtos cadastrados pelos parceiros.",
          "Filtre por parceiro, categoria ou status.",
          "Revise cada produto (foto, descrição, preço).",
          "Aprove ou solicite ajustes ao parceiro.",
          "Produtos aprovados ficam visíveis no app."
        ],
        dicas: [
          "Defina padrões de qualidade para fotos de produtos.",
          "Use categorias para organizar o catálogo.",
          "Monitore a qualidade dos produtos periodicamente."
        ],
        rota: "/store-catalog"
      },
    ],
  },
  {
    categoria: "Equipe & Acessos",
    icone: "Users",
    manuais: [
      {
        id: "usuarios",
        titulo: "Usuários",
        descricao: "Gerencie os usuários administrativos da plataforma. Adicione, edite ou remova operadores, gerentes e administradores com diferentes níveis de acesso.",
        comoAtivar: "Disponível por padrão. Acesse 'Usuários' no menu lateral.",
        passos: [
          "Acesse 'Usuários' no menu lateral.",
          "Clique em 'Novo Usuário' para adicionar.",
          "Preencha nome, e-mail e telefone.",
          "Defina o papel/role do usuário (operador, gerente, admin).",
          "Vincule o usuário à cidade e parceiro (se aplicável).",
          "O usuário receberá um convite por e-mail.",
          "Gerencie permissões e status dos usuários existentes."
        ],
        dicas: [
          "Use o princípio do menor privilégio — dê apenas as permissões necessárias.",
          "Revise periodicamente os acessos e desative usuários inativos.",
          "Mantenha pelo menos dois administradores para contingência."
        ],
        rota: "/users"
      },
      {
        id: "permissao-parceiros",
        titulo: "Permissão de Parceiros",
        descricao: "Configure quais funcionalidades cada parceiro pode acessar no painel próprio. Controle granularmente o que cada parceiro pode ver e fazer.",
        comoAtivar: "Ative o módulo 'Permissões de Parceiro' na página de Módulos.",
        passos: [
          "Acesse 'Permissão de Parceiros' no menu lateral.",
          "Selecione a funcionalidade/permissão a configurar.",
          "Defina se é permitido para a marca e/ou para parceiros.",
          "Configure permissões por cidade, se necessário.",
          "Salve as configurações.",
          "As permissões são aplicadas imediatamente."
        ],
        dicas: [
          "Comece com permissões restritas e libere conforme necessidade.",
          "Documente quais permissões cada tipo de parceiro tem.",
          "Teste as permissões com um usuário de teste."
        ],
        rota: "/brand-permissions"
      },
      {
        id: "gestao-acessos",
        titulo: "Gestão de Acessos",
        descricao: "Visão centralizada de todos os acessos e permissões do sistema. Veja quem tem acesso a quê e gerencie de forma centralizada.",
        comoAtivar: "Ative o módulo 'Gestão de Acessos' na página de Módulos.",
        passos: [
          "Acesse 'Gestão de Acessos' no menu lateral.",
          "Visualize o mapa de acessos por usuário ou por funcionalidade.",
          "Identifique acessos excessivos ou inadequados.",
          "Ajuste permissões diretamente da tela centralizada.",
          "Exporte o relatório de acessos para auditoria."
        ],
        dicas: [
          "Faça uma revisão de acessos pelo menos trimestralmente.",
          "Use este painel para auditorias de segurança.",
          "Identifique e corrija acessos desnecessários proativamente."
        ],
        rota: "/access-hub"
      },
    ],
  },
  {
    categoria: "Inteligência & Dados",
    icone: "BarChart3",
    manuais: [
      {
        id: "crm",
        titulo: "Inteligência CRM",
        descricao: "Plataforma de CRM integrada para gerenciar contatos, segmentar audiências, criar campanhas e analisar o comportamento dos clientes.",
        comoAtivar: "Ative o módulo 'CRM' na página de Módulos.",
        passos: [
          "Acesse 'Inteligência CRM' no menu lateral.",
          "Explore as abas: Contatos, Audiências, Campanhas, Análises.",
          "Na aba Contatos, veja todos os contatos sincronizados.",
          "Em Audiências, crie segmentos com filtros avançados.",
          "Em Campanhas, crie e envie campanhas para segmentos.",
          "Em Análises, veja métricas de engajamento e comportamento."
        ],
        dicas: [
          "Segmente sua base antes de enviar campanhas para melhor resultado.",
          "Monitore taxas de abertura e engajamento das campanhas.",
          "Use dados de comportamento para personalizar comunicações."
        ],
        rota: "/crm"
      },
      {
        id: "relatorios",
        titulo: "Relatórios",
        descricao: "Acesse relatórios analíticos da plataforma: vendas, pontos, resgates, engajamento, parceiros e clientes com dados em tempo real.",
        comoAtivar: "Ative o módulo 'Relatórios' na página de Módulos.",
        passos: [
          "Acesse 'Relatórios' no menu lateral.",
          "Selecione o tipo de relatório desejado.",
          "Configure o período e filtros (cidade, parceiro, etc.).",
          "Visualize os dados em gráficos e tabelas.",
          "Exporte o relatório em CSV ou PDF.",
          "Agende relatórios recorrentes, se disponível."
        ],
        dicas: [
          "Compare períodos para identificar tendências.",
          "Use relatórios semanais para acompanhar a operação.",
          "Compartilhe relatórios relevantes com a equipe."
        ],
        rota: "/reports"
      },
      {
        id: "auditoria",
        titulo: "Auditoria",
        descricao: "Consulte o log de auditoria de todas as ações realizadas na plataforma. Rastreie quem fez o quê, quando e quais dados foram alterados.",
        comoAtivar: "Ative o módulo 'Auditoria' na página de Módulos.",
        passos: [
          "Acesse 'Auditoria' no menu lateral.",
          "Use os filtros para buscar por período, usuário ou tipo de ação.",
          "Visualize os logs detalhados com antes/depois das alterações.",
          "Exporte os logs para análise externa.",
          "Use os dados para investigações e compliance."
        ],
        dicas: [
          "Monitore ações críticas como exclusão de dados ou mudança de permissões.",
          "Use a auditoria para resolver disputas e esclarecer eventos.",
          "Mantenha os logs por pelo menos 12 meses."
        ],
        rota: "/audit"
      },
      {
        id: "importacao-dados",
        titulo: "Importação de Dados (CSV)",
        descricao: "Importe dados em massa via arquivos CSV. Útil para migração de clientes, pontos, parceiros ou produtos de outros sistemas.",
        comoAtivar: "Ative o módulo 'Importação CSV' na página de Módulos.",
        passos: [
          "Acesse 'Importação de Dados' no menu lateral.",
          "Selecione o tipo de dado a importar (clientes, pontos, etc.).",
          "Baixe o template CSV com os campos esperados.",
          "Preencha o arquivo CSV com seus dados.",
          "Faça upload do arquivo preenchido.",
          "Revise o mapeamento de campos.",
          "Confirme a importação.",
          "Acompanhe o progresso e resultado da importação."
        ],
        dicas: [
          "Sempre use o template fornecido para evitar erros.",
          "Teste com poucos registros antes de importar tudo.",
          "Verifique a codificação UTF-8 do arquivo para evitar caracteres estranhos."
        ],
        rota: "/csv-import"
      },
      {
        id: "taxonomia",
        titulo: "Taxonomia",
        descricao: "Gerencie a estrutura de categorias, tags e classificações usadas em toda a plataforma. A taxonomia organiza parceiros, ofertas e produtos.",
        comoAtivar: "Ative o módulo 'Taxonomia' na página de Módulos.",
        passos: [
          "Acesse 'Taxonomia' no menu lateral.",
          "Visualize a árvore de categorias existente.",
          "Adicione novas categorias ou subcategorias.",
          "Edite nomes, ícones e ordem das categorias.",
          "Vincule categorias a parceiros e ofertas.",
          "Remova categorias sem uso."
        ],
        dicas: [
          "Mantenha a hierarquia de categorias simples e intuitiva.",
          "Evite categorias muito genéricas ou muito específicas.",
          "Revise a taxonomia quando adicionar novos tipos de parceiros."
        ],
        rota: "/taxonomy"
      },
    ],
  },
  {
    categoria: "Integrações & API",
    icone: "Key",
    manuais: [
      {
        id: "api-integracoes",
        titulo: "APIs & Integrações",
        descricao: "Gerencie as chaves de API da sua marca para integração com sistemas externos. Crie, rotacione e monitore o uso das chaves.",
        comoAtivar: "Ative o módulo 'APIs & Integrações' na página de Módulos.",
        passos: [
          "Acesse 'APIs & Integrações' no menu lateral.",
          "Clique em 'Nova Chave API' para gerar uma chave.",
          "Dê um nome/label identificador para a chave.",
          "Copie a chave gerada — ela só será exibida uma vez.",
          "Use a chave nas integrações com sistemas externos.",
          "Monitore o uso e última utilização de cada chave.",
          "Desative ou rotacione chaves quando necessário."
        ],
        dicas: [
          "Nunca compartilhe chaves de API em locais públicos.",
          "Use uma chave diferente para cada integração.",
          "Rotacione chaves periodicamente por segurança."
        ],
        rota: "/api-keys"
      },
      {
        id: "docs-api",
        titulo: "Documentação API",
        descricao: "Acesse a documentação técnica completa da API da plataforma. Encontre endpoints, parâmetros, exemplos de requisição e resposta.",
        comoAtivar: "Disponível automaticamente quando o módulo 'APIs & Integrações' está ativo.",
        passos: [
          "Acesse 'Documentação API' no menu lateral.",
          "Navegue pelos endpoints disponíveis por categoria.",
          "Consulte os parâmetros necessários para cada requisição.",
          "Veja exemplos de requisição e resposta.",
          "Teste chamadas diretamente pela documentação interativa.",
          "Use a documentação como referência durante o desenvolvimento."
        ],
        dicas: [
          "Comece pelos endpoints básicos antes de avançar para os complexos.",
          "Use o ambiente de testes antes de integrar em produção.",
          "Mantenha a documentação salva/bookmarkada para consulta rápida."
        ],
        rota: "/api-docs"
      },
      {
        id: "integracao-mobilidade",
        titulo: "Integração Mobilidade (TaxiMachine)",
        descricao: "Configure a integração com a plataforma TaxiMachine para pontuar passageiros e motoristas automaticamente. A interface é organizada em 3 ambientes: Pontuar Passageiro, Pontuar Motorista e Notificações.",
        comoAtivar: "Ative o módulo 'Integração Mobilidade' na página de Módulos.",
        passos: [
          "Acesse 'Integração Mobilidade' no menu lateral.",
          "Configure as credenciais centralizadas no nível da Marca: API Key e Basic Auth (usuário e senha).",
          "Ambiente 1 — Pontuar Passageiro: configure Logs de corridas e integração Matrix para identificar passageiros em todas as cidades.",
          "Ambiente 2 — Pontuar Motorista: ative cidades via Webhook (automático ou manual), acompanhe diagnósticos em tempo real e status de cada cidade.",
          "Ambiente 3 — Notificações: configure Chat no app e Telegram com fallback automático para o Chat ID da marca.",
          "Teste a conexão com dados de exemplo em cada ambiente.",
          "Ative a integração em produção e monitore o fluxo de dados."
        ],
        dicas: [
          "As credenciais da Marca alimentam a identificação de passageiros em todas as cidades automaticamente.",
          "Use o Lab Webhook para testar cenários antes de ativar em produção.",
          "O ambiente de Notificações possui fallback automático — se Telegram falhar, o sistema tenta o Chat no app.",
          "Monitore os diagnósticos em tempo real para detectar problemas rapidamente."
        ],
        rota: "/machine-integration"
      },
      {
        id: "lab-webhook",
        titulo: "Lab Webhook",
        descricao: "Ambiente de testes para webhooks da integração de mobilidade. Simule eventos e verifique o processamento sem afetar dados reais.",
        comoAtivar: "Disponível automaticamente quando o módulo 'Integração Mobilidade' está ativo.",
        passos: [
          "Acesse 'Lab Webhook' no menu lateral.",
          "Selecione o tipo de evento a simular (corrida concluída, cancelada, etc.).",
          "Preencha ou edite o payload de exemplo.",
          "Envie o webhook de teste.",
          "Visualize a resposta e o processamento do evento.",
          "Verifique se os dados foram processados corretamente.",
          "Ajuste a integração com base nos resultados."
        ],
        dicas: [
          "Sempre teste antes de ativar integrações em produção.",
          "Simule cenários de erro para validar o tratamento.",
          "Use o lab para debugar problemas reportados."
        ],
        rota: "/machine-webhook-test"
      },
    ],
  },
  {
    categoria: "Configurações",
    icone: "Settings2",
    manuais: [
      {
        id: "modulos",
        titulo: "Módulos",
        descricao: "Ative ou desative funcionalidades da plataforma. Cada módulo controla uma área do sistema, permitindo personalizar exatamente o que sua marca precisa.",
        comoAtivar: "Disponível por padrão. Acesse 'Módulos' no menu lateral.",
        passos: [
          "Acesse 'Módulos' no menu lateral.",
          "Visualize todos os módulos disponíveis organizados por categoria.",
          "Clique no toggle para ativar ou desativar cada módulo.",
          "Módulos ativos ficam visíveis no menu lateral e acessíveis.",
          "Módulos inativos são ocultados e suas funcionalidades desabilitadas.",
          "As alterações são aplicadas imediatamente."
        ],
        dicas: [
          "Ative apenas os módulos que sua operação realmente precisa.",
          "Desativar um módulo não apaga os dados — você pode reativá-lo depois.",
          "Consulte os manuais de cada módulo antes de ativar para entender o funcionamento."
        ],
        rota: "/brand-modules"
      },
      {
        id: "configuracoes",
        titulo: "Configurações Gerais",
        descricao: "Configure parâmetros gerais da marca como nome de exibição, moeda, idioma, timezone e outras preferências globais.",
        comoAtivar: "Ative o módulo 'Configurações' na página de Módulos.",
        passos: [
          "Acesse 'Configurações' no menu lateral.",
          "Edite o nome de exibição da marca.",
          "Configure timezone e moeda padrão.",
          "Defina preferências de notificação.",
          "Configure integrações de terceiros (se disponível).",
          "Salve as alterações."
        ],
        dicas: [
          "O timezone afeta agendamentos de banners, cupons e relatórios.",
          "Revise as configurações ao expandir para novas regiões.",
          "Mantenha as configurações documentadas para a equipe."
        ],
        rota: "/brand-settings"
      },
      {
        id: "meu-plano",
        titulo: "Meu Plano (Assinatura)",
        descricao: "Visualize e gerencie o plano de assinatura da sua marca. Veja os recursos incluídos, limites e opções de upgrade.",
        comoAtivar: "Disponível por padrão. Acesse 'Meu Plano' no menu lateral.",
        passos: [
          "Acesse 'Meu Plano' no menu lateral.",
          "Visualize o plano atual e seus recursos incluídos.",
          "Compare com outros planos disponíveis.",
          "Para fazer upgrade, clique em 'Mudar Plano'.",
          "Siga as instruções de pagamento.",
          "O upgrade é ativado imediatamente após confirmação."
        ],
        dicas: [
          "Verifique se seu plano atual atende às suas necessidades.",
          "Upgrades são proporcionais — você paga a diferença.",
          "Consulte o suporte para planos corporativos personalizados."
        ],
        rota: "/subscription"
      },
    ],
  },
  {
    categoria: "Comunicação",
    icone: "MessageSquare",
    manuais: [
      {
        id: "notificacao-push",
        titulo: "Notificação Push",
        descricao: "Envie notificações push diretamente para os celulares dos clientes. Selecione público-alvo por cidade e personalize título e mensagem.",
        comoAtivar: "Acesse 'Enviar Notificação' no menu lateral, aba 'Notificação Push'.",
        passos: [
          "Acesse 'Enviar Notificação' no menu lateral.",
          "Selecione a aba 'Notificação Push'.",
          "Defina o título e o corpo da mensagem.",
          "Selecione o público-alvo: todos os clientes ou filtrado por cidade.",
          "Clique em 'Enviar' para disparar a notificação.",
          "Acompanhe o status de envio na tela."
        ],
        dicas: [
          "Mensagens curtas e diretas geram melhor engajamento.",
          "Evite enviar muitas notificações no mesmo dia para não irritar os clientes.",
          "Use horários estratégicos (manhã ou fim de tarde) para melhor taxa de abertura."
        ],
        rota: "/send-notification"
      },
      {
        id: "mensagens-machine",
        titulo: "Mensagens via Machine",
        descricao: "Envie mensagens para motoristas via TaxiMachine. Configure templates com variáveis dinâmicas, fluxos automáticos para eventos de gamificação e apostas, envie mensagens manuais (em massa ou individual) e acompanhe relatórios de entrega.",
        comoAtivar: "Acesse 'Enviar Notificação' no menu lateral, aba 'Mensagens via Machine'.",
        passos: [
          "Acesse 'Enviar Notificação' no menu lateral.",
          "Selecione a aba 'Mensagens via Machine'.",
          "Na sub-aba 'Templates', crie modelos de mensagem com variáveis: {{nome}}, {{pontos}}, {{saldo}}, {{adversario}}, {{corridas}}, {{premio}}, {{cidade}}.",
          "Na sub-aba 'Fluxos', configure disparos automáticos para eventos: desafios, aceites, vitórias, apostas (SIDE_BET_CREATED, SIDE_BET_ACCEPTED) e conquista de cinturão.",
          "Para cada fluxo, selecione o template, a audiência-alvo e ative/desative conforme necessário.",
          "Na sub-aba 'Envio Manual', envie mensagens em massa (para todos ou por cidade) ou individual (por ID do motorista).",
          "Na sub-aba 'Relatório', acompanhe métricas de entrega, erros e logs de auditoria (driver_message_logs)."
        ],
        dicas: [
          "Use variáveis nos templates para personalizar mensagens automaticamente.",
          "Teste templates com envio individual antes de disparar em massa.",
          "Configure fluxos de apostas para manter os motoristas informados sobre palpites P2P.",
          "Monitore o relatório de entregas regularmente para identificar falhas de envio."
        ],
        rota: "/send-notification"
      },
    ],
  },
  {
    categoria: "Gamificação — Administração",
    icone: "Swords",
    manuais: [
      {
        id: "gamif-admin-visao-geral",
        titulo: "Visão Geral da Gamificação",
        descricao: "Entenda o módulo completo de gamificação: duelos entre motoristas, ranking mensal e cinturão da cidade. Saiba como cada funcionalidade funciona e como ativá-las.",
        comoAtivar: "Acesse 'Gamificação' no menu lateral. O módulo está disponível para cidades com scoring model de motoristas.",
        passos: [
          "Acesse 'Gamificação' no menu lateral.",
          "O módulo inclui 5 abas: Configuração, Duelos, Ranking, Cinturão e Moderação.",
          "Na aba Configuração, ative as funcionalidades desejadas.",
          "Acompanhe as estatísticas gerais no topo da página.",
          "Monitore a atividade em cada aba individualmente.",
        ],
        dicas: [
          "A gamificação aumenta significativamente o engajamento dos motoristas.",
          "Comece ativando apenas duelos e observe o impacto antes de ativar tudo.",
          "O módulo respeita a privacidade — dados operacionais nunca são expostos.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-admin-regras-privacidade",
        titulo: "Regras de Privacidade e Anonimato",
        descricao: "Entenda como o módulo de gamificação protege a privacidade dos motoristas. Dados operacionais são mantidos em sigilo enquanto a competição acontece de forma segura.",
        comoAtivar: "As regras de privacidade são aplicadas automaticamente.",
        passos: [
          "Motoristas usam apelidos públicos — o nome real nunca é exibido nos duelos.",
          "A contagem de corridas usa apenas dados agregados (total), sem detalhes de rotas ou valores.",
          "Apenas corridas com status FINALIZED são contabilizadas.",
          "A API RPC `count_duel_rides` retorna apenas o número total, sem expor dados individuais.",
          "Administradores podem moderar apelidos inadequados na aba Moderação.",
        ],
        dicas: [
          "O anonimato total garante que motoristas se sintam seguros para competir.",
          "Nenhum dado financeiro ou de rota é compartilhado entre participantes.",
          "Em caso de dúvida sobre privacidade, consulte a política de dados da plataforma.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-admin-duvidas-frequentes",
        titulo: "Dúvidas Frequentes (FAQ)",
        descricao: "Respostas para as perguntas mais comuns sobre o módulo de gamificação, incluindo contagem de corridas, limites e resolução de problemas.",
        comoAtivar: "Consulte este manual sempre que tiver dúvidas sobre o funcionamento.",
        passos: [
          "Como são contadas as corridas? → Apenas corridas FINALIZED dentro do período do duelo.",
          "E se der empate? → Ambos motoristas são considerados vencedores.",
          "Motorista pode recusar um duelo? → Sim, sem nenhuma penalidade.",
          "Quantos duelos simultâneos? → Configurável (padrão: 3 por motorista).",
          "O ranking reseta todo mês? → Depende da configuração da cidade.",
          "Quem pode ver os duelos? → Depende do toggle 'Visualização pública'.",
        ],
        dicas: [
          "Incentive motoristas a experimentarem pelo menos um duelo curto (24h).",
          "Em caso de problemas técnicos, verifique se o scoring model da cidade inclui motoristas.",
          "O módulo funciona melhor com pelo menos 5 motoristas ativos na cidade.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-admin-apostas-laterais",
        titulo: "Apostas Laterais (Side Bets)",
        descricao: "Gerencie o sistema de apostas P2P em duelos. Espectadores podem apostar pontos entre si palpitando no vencedor de um duelo. O módulo inclui criação, aceitação, contrapropostas, ranking de apostadores e bônus automático para o vencedor do duelo.",
        comoAtivar: "As apostas laterais ficam disponíveis automaticamente quando os duelos estão ativos. Acesse 'Gamificação' > aba 'Apostas'.",
        passos: [
          "Acesse a aba 'Apostas' dentro da página de Gamificação.",
          "Visualize todas as apostas ativas, pendentes e encerradas nos duelos da marca.",
          "Cada aposta mostra: apostadores, pontos apostados, palpite (em quem apostou), status e resultado.",
          "Apostas suportam contrapropostas — o oponente pode negociar o valor antes de aceitar.",
          "Ao aceitar, os pontos de ambos os apostadores são reservados em escrow automaticamente.",
          "Quando o duelo encerra: 90% do prêmio vai para o apostador vencedor e 10% como bônus para o motorista que venceu o duelo real.",
          "Em caso de empate no duelo, todos os pontos em escrow são devolvidos integralmente.",
          "Na aba 'Ranking', visualize o ranking de rentabilidade dos apostadores.",
          "Configure templates de mensagem para os eventos SIDE_BET_CREATED e SIDE_BET_ACCEPTED na aba Mensagens via Machine."
        ],
        dicas: [
          "Monitore as apostas ativas para garantir a integridade das competições.",
          "Use a aba de moderação para cancelar apostas suspeitas se necessário.",
          "O bônus de 10% para o vencedor do duelo incentiva os competidores a manterem alta performance.",
          "Notificações push e mensagens Machine são disparadas automaticamente nos eventos de aposta."
        ],
        rota: "/gamificacao-admin",
      },
    ],
  },
];

// Grupo de manuais do franqueado (Achadinhos Motorista)
export const gruposManuaisFranqueado: GrupoManual[] = [
      {
        id: "comprar-pontos-franqueado",
        titulo: "Comprar Pontos (Pacotes)",
        descricao: "Adquira pacotes de pontos criados pelo empreendedor diretamente pelo seu painel. Os pontos são creditados na carteira da cidade após confirmação.",
        comoAtivar: "Acesse 'Comprar Pontos' no menu lateral.",
        passos: [
          "Acesse 'Comprar Pontos' no menu lateral.",
          "Visualize os pacotes disponíveis com nome, quantidade de pontos e preço.",
          "Clique em 'Comprar' no pacote desejado para criar um pedido.",
          "O pedido será enviado ao empreendedor com status 'Pendente'.",
          "Aguarde a confirmação — quando aprovado, os pontos são creditados automaticamente na sua carteira.",
          "Acompanhe o histórico de pedidos na aba 'Meus Pedidos'.",
        ],
        dicas: [
          "Planeje suas compras para manter o saldo sempre positivo.",
          "Pedidos pendentes podem ser acompanhados na mesma tela.",
          "Ao ser confirmado, o saldo é atualizado instantaneamente.",
          "Entre em contato com o empreendedor se um pedido ficar pendente por muito tempo.",
        ],
        rota: "/points-packages-store",
      },
    categoria: "Achadinhos Motorista — Franqueado",
    icone: "Coins",
    scoringFilter: "DRIVER",
    manuais: [
      {
        id: "carteira-pontos",
        titulo: "Carteira de Pontos",
        descricao: "Entenda como funciona a carteira de pontos da sua cidade. O saldo precisa ser recarregado pelo empreendedor para que os motoristas recebam pontos pelas corridas.",
        comoAtivar: "Acesse 'Carteira de Pontos' no menu lateral.",
        passos: [
          "Acesse 'Carteira de Pontos' no menu lateral.",
          "Visualize o saldo disponível, total carregado e total distribuído.",
          "O empreendedor realiza recargas quando necessário.",
          "Acompanhe o histórico de transações (recargas e débitos).",
          "Os pontos são debitados automaticamente conforme motoristas são pontuados.",
        ],
        dicas: [
          "Solicite recarga ao empreendedor antes que o saldo fique zerado.",
          "Acompanhe o histórico para controlar gastos.",
          "Se o saldo acabar, as pontuações ficarão pendentes.",
        ],
        rota: "/branch-wallet",
      },
      {
        id: "regras-pontuacao-motorista",
        titulo: "Regras de Pontuação Motorista",
        descricao: "Configure quantos pontos o motorista recebe por corrida. Defina regras baseadas no valor da corrida ou pontuação fixa.",
        comoAtivar: "Acesse 'Regras de Pontuação' no menu lateral.",
        passos: [
          "Acesse 'Regras de Pontuação' no menu lateral.",
          "Defina a pontuação base por corrida.",
          "Configure regras avançadas (por faixa de valor, maçaneta, etc).",
          "Salve as alterações.",
          "As novas regras valem para as próximas corridas.",
        ],
        dicas: [
          "Teste diferentes valores para encontrar o equilíbrio ideal.",
          "Regras por faixa de valor incentivam corridas mais longas.",
          "A pontuação maçaneta pode ter valor diferente da regra padrão.",
        ],
        rota: "/driver-points-rules",
      },
      {
        id: "produtos-resgate-franqueado",
        titulo: "Produtos de Resgate",
        descricao: "Gerencie os produtos disponíveis para que motoristas resgatem com seus pontos. Defina preços em pontos, ative ou desative produtos.",
        comoAtivar: "Acesse 'Produtos de Resgate' no menu lateral.",
        passos: [
          "Acesse 'Produtos de Resgate' no menu lateral.",
          "Visualize os produtos disponíveis e seus preços em pontos.",
          "Ative ou desative produtos conforme disponibilidade.",
          "Edite o custo em pontos de cada produto.",
          "Os motoristas verão apenas produtos ativos no app.",
        ],
        dicas: [
          "Mantenha preços em pontos proporcionais ao valor real do produto.",
          "Desative produtos temporariamente esgotados.",
          "Acompanhe os pedidos de resgate para monitorar a demanda.",
        ],
        rota: "/produtos-resgate",
      },
      {
        id: "pedidos-resgate-franqueado",
        titulo: "Pedidos de Resgate",
        descricao: "Acompanhe e gerencie os pedidos de resgate feitos pelos motoristas. Aprove, rejeite, registre envio e confirme entrega.",
        comoAtivar: "Acesse 'Pedidos de Resgate' no menu lateral.",
        passos: [
          "Acesse 'Pedidos de Resgate' no menu lateral.",
          "Visualize os pedidos pendentes, aprovados, enviados e entregues.",
          "Clique em um pedido para ver os detalhes e dados de entrega.",
          "Aprove ou rejeite pedidos pendentes.",
          "Registre o código de rastreio ao enviar.",
          "Confirme a entrega quando o motorista receber o produto.",
        ],
        dicas: [
          "Processe pedidos pendentes rapidamente para manter os motoristas engajados.",
          "Pedidos rejeitados estornam os pontos automaticamente.",
          "Use filtros de status para organizar o fluxo de atendimento.",
        ],
        rota: "/product-redemption-orders",
      },
      {
        id: "motoristas-franqueado",
        titulo: "Motoristas",
        descricao: "Visualize e gerencie os motoristas cadastrados na sua cidade. Acompanhe saldo de pontos, corridas e status.",
        comoAtivar: "Acesse 'Motoristas' no menu lateral.",
        passos: [
          "Acesse 'Motoristas' no menu lateral.",
          "Visualize a lista de motoristas da sua cidade.",
          "Pesquise por nome, CPF ou telefone.",
          "Clique em um motorista para ver o extrato de pontos e corridas.",
          "Gerencie o status ativo/inativo dos motoristas.",
        ],
        dicas: [
          "Motoristas são cadastrados automaticamente via integração de corridas.",
          "Use o extrato para verificar pontuações e resgates.",
          "Motoristas inativos não aparecem no ranking.",
        ],
        rota: "/motoristas",
      },
      {
        id: "dashboard-cidade",
        titulo: "Dashboard da Cidade",
        descricao: "Acompanhe os indicadores da sua cidade em tempo real: corridas, motoristas, pontos, resgates e ranking.",
        comoAtivar: "O dashboard é a página inicial do painel.",
        passos: [
          "Acesse o painel para ver automaticamente o dashboard.",
          "Visualize os KPIs: corridas, motoristas, pontos, resgates e saldo.",
          "Acompanhe o ranking de motoristas da sua cidade.",
          "Use os filtros de período para analisar tendências.",
        ],
        dicas: [
          "O dashboard atualiza em tempo real conforme corridas são finalizadas.",
          "Use o ranking para identificar os motoristas mais engajados.",
          "Compare períodos para avaliar o crescimento da operação.",
        ],
         rota: "/",
      },
    ],
  },
  {
    categoria: "Gestão da Cidade (Franqueado)",
    icone: "Building2",
    scoringFilter: "DRIVER",
    manuais: [
      {
        id: "carteira-pontos-cidade",
        titulo: "Carteira de Pontos da Cidade",
        descricao: "Gerencie o estoque de pontos da sua cidade. A carteira controla o saldo disponível para distribuir aos motoristas e registra todas as movimentações de recarga e consumo.",
        comoAtivar: "Acesse 'Carteira de Pontos' no menu lateral do painel da cidade.",
        passos: [
          "Acesse 'Carteira de Pontos' no menu lateral.",
          "Visualize o saldo atual, total recarregado e total distribuído.",
          "Para recarregar, clique em 'Recarregar Pontos' e informe a quantidade.",
          "Acompanhe o histórico de recargas na aba 'Recargas'.",
          "Acompanhe o histórico de distribuições na aba 'Distribuições'.",
          "Configure o alerta de saldo baixo para receber avisos quando o estoque estiver crítico.",
        ],
        dicas: [
          "Mantenha o saldo sempre positivo para não interromper a distribuição de pontos aos motoristas.",
          "O alerta de saldo baixo ajuda a se antecipar e recarregar antes de ficar sem pontos.",
          "Use as abas para analisar separadamente recargas e consumo.",
        ],
        rota: "/branch-wallet",
      },
      {
        id: "regras-pontuacao-cidade",
        titulo: "Regras de Pontuação",
        descricao: "Configure como os motoristas da sua cidade ganham pontos. Defina regras por corrida, campanhas temporárias, bônus por meta e regras promocionais.",
        comoAtivar: "Acesse 'Regra de Pontos' no menu lateral do painel da cidade.",
        passos: [
          "Acesse 'Regra de Pontos' no menu lateral.",
          "Escolha o modelo de pontuação (por valor, percentual, fixo ou faixas de volume).",
          "Defina quantos pontos o motorista ganha por corrida.",
          "Crie campanhas temporárias com validade inicial e final.",
          "Configure bônus por meta (ex: acima de 20 corridas no dia = bônus extra).",
          "Ative ou desative regras conforme necessário.",
          "Salve as alterações.",
        ],
        dicas: [
          "Cada cidade pode ter regras diferentes de pontuação.",
          "Use campanhas temporárias para engajar motoristas em períodos específicos.",
          "Teste diferentes configurações e acompanhe o impacto no dashboard.",
        ],
        rota: "/driver-points-rules",
      },
      {
        id: "pedidos-resgate-cidade",
        titulo: "Pedidos de Resgate",
        descricao: "Gerencie os pedidos de resgate realizados pelos motoristas da sua cidade. Aprove, rejeite ou acompanhe o status de cada solicitação.",
        comoAtivar: "Acesse 'Pedidos de Resgate' no menu lateral do painel da cidade.",
        passos: [
          "Acesse 'Pedidos de Resgate' no menu lateral.",
          "Visualize a lista de pedidos pendentes, aprovados e rejeitados.",
          "Clique em um pedido para ver os detalhes (motorista, produto, pontos utilizados).",
          "Aprove ou rejeite o pedido conforme a política da cidade.",
          "Acompanhe o histórico completo de pedidos.",
        ],
        dicas: [
          "Pedidos pendentes devem ser analisados o mais rápido possível para manter a satisfação dos motoristas.",
          "Verifique se o motorista tem saldo suficiente antes de aprovar.",
          "Use os filtros para encontrar pedidos específicos rapidamente.",
        ],
        rota: "/product-redemption-orders",
      },
      {
        id: "motoristas-cidade",
        titulo: "Gestão de Motoristas",
        descricao: "Acompanhe os motoristas cadastrados na sua cidade. Visualize pontuação, corridas realizadas, saldo de pontos e status de cada motorista.",
        comoAtivar: "Acesse 'Motoristas' no menu lateral do painel da cidade.",
        passos: [
          "Acesse 'Motoristas' no menu lateral.",
          "Visualize a lista de motoristas com saldo, corridas e status.",
          "Use a busca para encontrar um motorista específico.",
          "Clique em um motorista para ver o histórico detalhado de pontuação.",
          "Realize pontuação manual quando necessário.",
        ],
        dicas: [
          "Monitore regularmente os motoristas com saldo alto que ainda não resgataram.",
          "O ranking do dashboard mostra os motoristas mais engajados.",
          "Use a pontuação manual para ajustes ou bonificações especiais.",
        ],
        rota: "/motoristas",
      },
      {
        id: "produtos-resgate-cidade",
        titulo: "Produtos de Resgate",
        descricao: "Gerencie o catálogo de produtos disponíveis para resgate pelos motoristas da sua cidade. Adicione, edite ou desative produtos.",
        comoAtivar: "Acesse 'Produtos' no menu lateral do painel da cidade.",
        passos: [
          "Acesse 'Produtos' no menu lateral.",
          "Visualize os produtos disponíveis para resgate.",
          "Clique em 'Novo Produto' para adicionar um item ao catálogo.",
          "Preencha nome, descrição, custo em pontos e imagem.",
          "Ative ou desative produtos conforme a disponibilidade.",
          "Salve as alterações.",
        ],
        dicas: [
          "Mantenha o catálogo atualizado para motivar os motoristas.",
          "Produtos com custo acessível incentivam resgates mais frequentes.",
          "Use imagens atrativas para destacar os produtos.",
        ],
        rota: "/produtos-resgate",
      },
      {
        id: "relatorios-cidade",
        titulo: "Relatórios da Cidade",
        descricao: "Gere relatórios em CSV com dados de motoristas, corridas e pedidos de resgate da sua cidade para análise e controle operacional.",
        comoAtivar: "Acesse 'Relatórios' no menu lateral do painel da cidade.",
        passos: [
          "Acesse 'Relatórios' no menu lateral.",
          "Escolha o tipo de relatório: Motoristas, Corridas ou Pedidos de Resgate.",
          "Clique em 'Exportar CSV' para baixar os dados.",
          "Abra o arquivo em uma planilha para análise.",
        ],
        dicas: [
          "Exporte regularmente para acompanhar a evolução da operação.",
          "Os dados são filtrados automaticamente pela sua cidade.",
          "Use planilhas para criar gráficos e análises personalizadas.",
        ],
        rota: "/branch-reports",
      },
    ],
  },
  {
    categoria: "Gamificação — Duelos entre Motoristas",
    icone: "Swords",
    scoringFilter: "DRIVER" as const,
    manuais: [
      {
        id: "gamif-ativacao-modulo",
        titulo: "Ativação do Módulo de Gamificação",
        descricao: "Aprenda a ativar e configurar o módulo de Duelos, Ranking e Cinturão na sua cidade. Cada funcionalidade pode ser ligada ou desligada individualmente.",
        comoAtivar: "Acesse 'Gamificação' no menu lateral e vá até a aba 'Configuração'.",
        passos: [
          "Acesse 'Gamificação' no menu lateral do painel.",
          "Na aba 'Configuração', ative o toggle 'Duelos entre motoristas'.",
          "Opcionalmente, ative 'Ranking da cidade' e 'Cinturão da cidade'.",
          "Configure duração mínima e máxima dos duelos (em horas).",
          "Defina o número máximo de duelos simultâneos por motorista.",
          "Escolha a métrica principal (corridas ou pontos).",
          "Clique em 'Salvar configuração'.",
        ],
        dicas: [
          "Você pode ativar apenas duelos sem ativar ranking ou cinturão.",
          "Comece com durações curtas (24-48h) para engajar os motoristas inicialmente.",
          "O módulo só aparece para motoristas quando pelo menos uma funcionalidade está ativa.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-gerenciando-duelos",
        titulo: "Gerenciando Duelos",
        descricao: "Visualize todos os duelos criados na sua cidade, filtre por status, acompanhe corridas em tempo real e monitore a competitividade saudável entre motoristas.",
        comoAtivar: "Acesse 'Gamificação' > aba 'Duelos'.",
        passos: [
          "Acesse a aba 'Duelos' dentro da página de Gamificação.",
          "Visualize os duelos organizados por status: Pendente, Ao Vivo, Encerrado, Recusado.",
          "Clique em um duelo para ver detalhes: participantes, placar, período.",
          "Acompanhe a contagem de corridas em tempo real nos duelos ao vivo.",
          "Use os filtros para localizar duelos específicos.",
        ],
        dicas: [
          "Duelos 'Ao Vivo' atualizam o placar automaticamente a cada 30 segundos.",
          "Apenas corridas com status FINALIZED são contabilizadas.",
          "A privacidade dos motoristas é preservada — dados operacionais não são expostos.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-ranking-cidade",
        titulo: "Ranking da Cidade",
        descricao: "Entenda como funciona o ranking mensal de motoristas, como ele é calculado, e como acompanhá-lo no painel administrativo.",
        comoAtivar: "Ative 'Ranking da cidade' na aba 'Configuração' da Gamificação.",
        passos: [
          "Acesse a aba 'Ranking' dentro da página de Gamificação.",
          "Visualize a classificação dos motoristas pelo critério configurado (corridas ou pontos).",
          "O ranking é atualizado automaticamente conforme os motoristas completam corridas.",
          "Acompanhe a posição de cada motorista e sua pontuação acumulada.",
        ],
        dicas: [
          "O ranking é visível publicamente para os motoristas, incentivando a competitividade.",
          "Motoristas usam apelidos públicos, preservando a identidade real.",
          "Considere divulgar os top 3 mensalmente para aumentar o engajamento.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-cinturao-cidade",
        titulo: "Cinturão da Cidade",
        descricao: "O Cinturão é um título de campeão que o motorista com mais corridas/pontos conquista. Entenda como funciona, como atualizar e quem é o campeão atual.",
        comoAtivar: "Ative 'Cinturão da cidade' na aba 'Configuração' da Gamificação.",
        passos: [
          "Acesse a aba 'Cinturão' dentro da página de Gamificação.",
          "Visualize o campeão atual e seu recorde.",
          "O cinturão é atualizado automaticamente quando um novo recordista aparece.",
          "Acompanhe o histórico de campeões anteriores.",
        ],
        dicas: [
          "O cinturão gera grande engajamento — divulgue o campeão nas redes sociais.",
          "A disputa pelo cinturão motiva os motoristas a manterem alta performance.",
          "O campeão recebe destaque visual especial no aplicativo.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-moderacao-apelidos",
        titulo: "Moderação de Apelidos",
        descricao: "Gerencie os apelidos públicos dos motoristas que participam dos duelos. Edite apelidos inadequados e mantenha um ambiente respeitoso.",
        comoAtivar: "Acesse 'Gamificação' > aba 'Moderação'.",
        passos: [
          "Acesse a aba 'Moderação' dentro da página de Gamificação.",
          "Visualize a lista de motoristas com seus apelidos públicos.",
          "Identifique apelidos inadequados ou ofensivos.",
          "Clique para editar o apelido do motorista.",
          "Salve as alterações — o motorista verá o novo apelido imediatamente.",
        ],
        dicas: [
          "Apelidos são a identidade pública do motorista nos duelos e ranking.",
          "Mantenha uma política clara sobre apelidos aceitáveis.",
          "Motoristas podem alterar seus próprios apelidos, então monitore periodicamente.",
        ],
        rota: "/gamificacao-admin",
      },
      {
        id: "gamif-config-avancada",
        titulo: "Configurações Avançadas de Duelos",
        descricao: "Ajuste parâmetros detalhados como duração, limites simultâneos, frases de recusa com humor e métricas de competição.",
        comoAtivar: "Acesse 'Gamificação' > aba 'Configuração'.",
        passos: [
          "Defina a duração mínima (ex: 24h) e máxima (ex: 168h) dos duelos.",
          "Configure o número máximo de duelos simultâneos por motorista (padrão: 3).",
          "Escolha a métrica do ranking: Corridas ou Pontos.",
          "Escolha a métrica do cinturão: Corridas ou Pontos.",
          "Ative 'Visualização pública de duelos' se quiser que todos vejam os duelos.",
          "Personalize as frases de recusa com humor leve para manter o clima divertido.",
          "Clique em 'Salvar configuração'.",
        ],
        dicas: [
          "Frases de recusa engraçadas tornam a experiência mais leve e divertida.",
          "Limite de 3 duelos simultâneos evita sobrecarga sem limitar a diversão.",
          "Métricas diferentes para ranking e cinturão criam múltiplas formas de competir.",
        ],
        rota: "/gamificacao-admin",
      },
    ],
  },
  {
    categoria: "Apostas em Duelos — Franqueado",
    icone: "Swords",
    scoringFilter: "DRIVER" as const,
    manuais: [
      {
        id: "gamif-apostas-franqueado",
        titulo: "Apostas Laterais (Side Bets)",
        descricao: "Acompanhe as apostas P2P realizadas pelos motoristas nos duelos da sua cidade. Espectadores apostam pontos entre si palpitando no vencedor, com contrapropostas e escrow automático.",
        comoAtivar: "Acesse 'Gamificação' > aba 'Apostas'. Disponível quando os duelos estão ativos na cidade.",
        passos: [
          "Acesse a aba 'Apostas' dentro da página de Gamificação.",
          "Visualize as apostas ativas, pendentes e encerradas nos duelos da sua cidade.",
          "Cada aposta exibe: apostadores (apelidos), pontos apostados, palpite e status.",
          "Apostas podem ter contrapropostas — o oponente negocia o valor antes de aceitar.",
          "Ao aceitar, os pontos são reservados em escrow automaticamente.",
          "Resultado: 90% do prêmio vai ao apostador vencedor, 10% de bônus ao motorista que venceu o duelo.",
          "Em empate, todos os pontos são devolvidos integralmente.",
          "Consulte o ranking de apostadores na aba 'Ranking' para ver os mais rentáveis."
        ],
        dicas: [
          "Apostas aumentam significativamente o engajamento nos duelos.",
          "Monitore apostas para garantir competições saudáveis.",
          "O bônus de 10% para o duelista vencedor motiva alta performance.",
          "Notificações são enviadas automaticamente nos eventos de aposta."
        ],
        rota: "/gamificacao-admin",
      },
    ],
  },
];
