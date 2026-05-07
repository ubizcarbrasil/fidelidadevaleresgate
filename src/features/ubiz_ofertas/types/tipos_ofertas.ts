export interface OfertaPublica {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  affiliate_url: string;
  store_name: string | null;
  store_logo_url: string | null;
  badge_label: string | null;
  category_id: string | null;
  created_at?: string;
  origin?: string | null;
  is_featured?: boolean | null;
}

export interface CategoriaOferta {
  id: string;
  name: string;
  icon_name: string;
  color: string;
}

export interface MarcaOfertas {
  id: string;
  name: string;
  brand_settings_json: Record<string, any> | null;
}