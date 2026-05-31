// Tipos compartilhados entre os módulos de mirror-sync.

export interface VitrinePriceEntry {
  uuid: string;
  price: number | null;
  originalPrice: number | null;
}

export interface DvlinksDeal {
  title: string;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  affiliateUrl: string;
  storeName: string | null;
}

export interface ApiProduct {
  id: number;
  attributes: {
    title: string;
    image: string | null;
    price: string | null;
    price_from: string | null;
    link: string | null;
    uuid: string;
    seller: string | null;
    coupon: string | null;
    free_shipping: boolean | null;
    installment: string | null;
    category: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    description: string | null;
    store_image: string | null;
  };
}

export interface SyncResult {
  slug: string;
  title: string;
  action: "created" | "updated" | "skipped" | "error";
  error?: string;
  price_source?: string;
  price_api?: number | null;
  price_page?: number | null;
  price_used?: number | null;
}

export interface DealCategory {
  id: string;
  name: string;
  keywords: string[];
  is_active: boolean;
}

export interface SyncGroupCounters {
  totalImported: number;
  totalActive: number;
  totalRemoved: number;
  totalReported: number;
}
