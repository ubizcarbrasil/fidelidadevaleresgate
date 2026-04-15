import { Swords, DollarSign, ShoppingCart, MessageCircle, Car, Store, Package, ShoppingBag, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToggleCidadeConfig {
  key: string;
  label: string;
  descricao: string;
  icon: LucideIcon;
  /** Se true, usa o campo booleano direto da tabela branches em vez de branch_settings_json */
  campoDirecto?: string;
}

export const TOGGLES_CIDADE: ToggleCidadeConfig[] = [
  {
    key: "enable_duels_module",
    label: "Motorista duela?",
    descricao: "Permite que motoristas participem de duelos de corridas entre si.",
    icon: Swords,
  },
  {
    key: "enable_duel_guesses",
    label: "Motorista aposta?",
    descricao: "Habilita o sistema de apostas em duelos entre motoristas.",
    icon: DollarSign,
  },
  {
    key: "enable_marketplace_module",
    label: "Motorista compra no Mercado Livre?",
    descricao: "Acesso ao marketplace externo para compras com pontos.",
    icon: ShoppingCart,
  },
  {
    key: "enable_whatsapp_access",
    label: "Motorista tem acesso ao WhatsApp?",
    descricao: "Exibe o botão de contato via WhatsApp no painel do motorista.",
    icon: MessageCircle,
  },
  {
    key: "enable_race_earn_module",
    label: "Motorista pontua por viagem?",
    descricao: "Motoristas acumulam pontos automaticamente a cada corrida finalizada.",
    icon: Car,
  },
  {
    key: "is_city_redemption_enabled",
    label: "Motorista resgata com estabelecimentos da cidade?",
    descricao: "Permite que motoristas resgatem ofertas nos parceiros locais.",
    icon: Store,
    campoDirecto: "is_city_redemption_enabled",
  },
  {
    key: "enable_points_purchase",
    label: "Motorista compra com pontos?",
    descricao: "Exibe a seção 'Compre com Pontos' mesmo que os Achadinhos estejam desativados.",
    icon: Package,
  },
  {
    key: "enable_achadinhos_module",
    label: "Motorista acessa os Achadinhos?",
    descricao: "Exibe a seção de Achadinhos (ofertas afiliadas) no painel do motorista.",
    icon: ShoppingBag,
  },
  {
    key: "enable_driver_points_purchase",
    label: "Motorista compra pontos?",
    descricao: "Permite que motoristas comprem pontos diretamente pelo app.",
    icon: Coins,
  },
];
