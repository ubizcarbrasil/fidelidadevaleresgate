CREATE OR REPLACE FUNCTION public.seed_affiliate_categories(p_brand_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM affiliate_deal_categories WHERE brand_id = p_brand_id) THEN
    RETURN;
  END IF;

  INSERT INTO affiliate_deal_categories (brand_id, name, icon_name, color, order_index, keywords) VALUES
    (p_brand_id, 'Eletrônicos', 'Smartphone', '#3b82f6', 0, ARRAY['eletronic','eletronico','celular','smartphone','tablet','notebook','computador','pc','fone','headphone','audio','tv','televisao','monitor','camera','gopro','drone','relogio','smartwatch']),
    (p_brand_id, 'Moda', 'Shirt', '#ec4899', 1, ARRAY['moda','roupa','vestido','camisa','camiseta','calca','sapato','tenis','calcado','bolsa','acessorio','relogio','oculos','joia','bijuteria','lingerie']),
    (p_brand_id, 'Casa', 'Home', '#f59e0b', 2, ARRAY['casa','decoracao','movel','sofa','mesa','cadeira','cama','colchao','travesseiro','cortina','tapete','luminaria','jardim','organizacao']),
    (p_brand_id, 'Beleza', 'Sparkles', '#a855f7', 3, ARRAY['beleza','cosmetico','maquiagem','perfume','skincare','cabelo','shampoo','creme','protetor','unha','esmalte']),
    (p_brand_id, 'Esportes', 'Dumbbell', '#22c55e', 4, ARRAY['esporte','fitness','academia','bicicleta','bike','corrida','futebol','natacao','yoga','suplemento','whey','proteina']),
    (p_brand_id, 'Cozinha', 'UtensilsCrossed', '#f97316', 5, ARRAY['cozinha','panela','frigideira','air fryer','airfryer','liquidificador','batedeira','cafeteira','microondas','geladeira','fogao','utensilio']),
    (p_brand_id, 'Bebê', 'Baby', '#06b6d4', 6, ARRAY['bebe','infantil','crianca','carrinho','berco','fralda','mamadeira','brinquedo']),
    (p_brand_id, 'Pet', 'PawPrint', '#84cc16', 7, ARRAY['pet','cachorro','gato','racao','animal','veterinario','coleira','brinquedo pet']),
    (p_brand_id, 'Mercado', 'ShoppingBasket', '#10b981', 8, ARRAY['mercado','alimento','bebida','supermercado','comida','snack','chocolate','cafe','cerveja','refrigerante','suco','leite','agua','vinho','whisky','energetico','arroz','feijao','macarrao','farinha','oleo','acucar','sal','molho','queijo','iogurte','manteiga','ovo','carne','frango','peixe','biscoito','bolacha','cereal','granola','geleia','achocolatado','nescau','nutella','sabao','detergente','amaciante','papel higienico','desinfetante','cesta basica','feira','hortifruti','congelado','sorvete','picole']),
    (p_brand_id, 'Livros', 'BookOpen', '#8b5cf6', 9, ARRAY['livro','book','kindle','leitura','revista','educacao','curso']),
    (p_brand_id, 'Games', 'Gamepad2', '#ef4444', 10, ARRAY['game','jogo','playstation','xbox','nintendo','console','gamer','pc gamer']),
    (p_brand_id, 'Automotivo', 'Car', '#64748b', 11, ARRAY['carro','auto','automotivo','pneu','oleo','acessorio veicular','moto','capacete']),
    (p_brand_id, 'Ferramentas', 'Wrench', '#78716c', 12, ARRAY['ferramenta','furadeira','parafuso','construcao','obra','eletrica','hidraulica']),
    (p_brand_id, 'Saúde', 'HeartPulse', '#dc2626', 13, ARRAY['saude','remedio','vitamina','medicamento','farmacia','bem estar','massageador']),
    (p_brand_id, 'Papelaria', 'PenTool', '#0ea5e9', 14, ARRAY['papelaria','caderno','caneta','escritorio','material escolar','mochila']),
    (p_brand_id, 'Cupons', 'Ticket', '#f59e0b', 15, ARRAY['cupom','desconto','promocao','voucher','cashback','oferta']);
END;
$function$;