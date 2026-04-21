export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          body: string | null
          brand_id: string
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          brand_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_category_banners: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          order_index: number
          title: string | null
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title?: string | null
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_category_banners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_category_banners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_category_banners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          clicked_at: string
          customer_id: string | null
          deal_id: string
          id: string
          ip_address: string | null
        }
        Insert: {
          clicked_at?: string
          customer_id?: string | null
          deal_id: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          clicked_at?: string
          customer_id?: string | null
          deal_id?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "public_affiliate_deals_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_deal_categories: {
        Row: {
          brand_id: string
          color: string
          created_at: string
          icon_name: string
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          order_index: number
        }
        Insert: {
          brand_id: string
          color?: string
          created_at?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          name: string
          order_index?: number
        }
        Update: {
          brand_id?: string
          color?: string
          created_at?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_deal_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deal_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_deals: {
        Row: {
          affiliate_url: string
          badge_label: string | null
          branch_id: string | null
          brand_id: string
          category: string | null
          category_id: string | null
          click_count: number
          created_at: string
          current_status: string
          custom_points_per_real: number | null
          description: string | null
          first_imported_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean | null
          is_flash_promo: boolean | null
          is_redeemable: boolean | null
          last_synced_at: string | null
          marketplace: string | null
          order_index: number
          origin: string | null
          origin_external_id: string | null
          origin_hash: string | null
          origin_url: string | null
          original_price: number | null
          price: number | null
          raw_payload: Json | null
          redeem_points_cost: number | null
          redeemable_by: string
          source_group_id: string | null
          source_group_name: string | null
          store_logo_url: string | null
          store_name: string | null
          sync_error: string | null
          sync_status: string | null
          title: string
          updated_at: string
          visible_driver: boolean | null
        }
        Insert: {
          affiliate_url: string
          badge_label?: string | null
          branch_id?: string | null
          brand_id: string
          category?: string | null
          category_id?: string | null
          click_count?: number
          created_at?: string
          current_status?: string
          custom_points_per_real?: number | null
          description?: string | null
          first_imported_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          is_flash_promo?: boolean | null
          is_redeemable?: boolean | null
          last_synced_at?: string | null
          marketplace?: string | null
          order_index?: number
          origin?: string | null
          origin_external_id?: string | null
          origin_hash?: string | null
          origin_url?: string | null
          original_price?: number | null
          price?: number | null
          raw_payload?: Json | null
          redeem_points_cost?: number | null
          redeemable_by?: string
          source_group_id?: string | null
          source_group_name?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          sync_error?: string | null
          sync_status?: string | null
          title: string
          updated_at?: string
          visible_driver?: boolean | null
        }
        Update: {
          affiliate_url?: string
          badge_label?: string | null
          branch_id?: string | null
          brand_id?: string
          category?: string | null
          category_id?: string | null
          click_count?: number
          created_at?: string
          current_status?: string
          custom_points_per_real?: number | null
          description?: string | null
          first_imported_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          is_flash_promo?: boolean | null
          is_redeemable?: boolean | null
          last_synced_at?: string | null
          marketplace?: string | null
          order_index?: number
          origin?: string | null
          origin_external_id?: string | null
          origin_hash?: string | null
          origin_url?: string | null
          original_price?: number | null
          price?: number | null
          raw_payload?: Json | null
          redeem_points_cost?: number | null
          redeemable_by?: string
          source_group_id?: string | null
          source_group_name?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          sync_error?: string | null
          sync_status?: string | null
          title?: string
          updated_at?: string
          visible_driver?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_deals_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          changes_json: Json
          created_at: string
          details_json: Json
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          scope_id: string | null
          scope_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changes_json?: Json
          created_at?: string
          details_json?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          scope_id?: string | null
          scope_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changes_json?: Json
          created_at?: string
          details_json?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          scope_id?: string | null
          scope_type?: string | null
        }
        Relationships: []
      }
      banner_schedules: {
        Row: {
          brand_id: string
          brand_section_id: string | null
          created_at: string
          end_at: string | null
          height: string
          id: string
          image_url: string
          is_active: boolean
          link_label: string | null
          link_target_id: string | null
          link_type: string
          link_url: string | null
          order_index: number
          start_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          brand_section_id?: string | null
          created_at?: string
          end_at?: string | null
          height?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_label?: string | null
          link_target_id?: string | null
          link_type?: string
          link_url?: string | null
          order_index?: number
          start_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          brand_section_id?: string | null
          created_at?: string
          end_at?: string | null
          height?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_label?: string | null
          link_target_id?: string | null
          link_type?: string
          link_url?: string | null
          order_index?: number
          start_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_schedules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_schedules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_schedules_brand_section_id_fkey"
            columns: ["brand_section_id"]
            isOneToOne: false
            referencedRelation: "brand_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_points_wallet: {
        Row: {
          balance: number
          branch_id: string
          brand_id: string
          created_at: string | null
          id: string
          low_balance_threshold: number
          total_distributed: number
          total_loaded: number
          updated_at: string | null
        }
        Insert: {
          balance?: number
          branch_id: string
          brand_id: string
          created_at?: string | null
          id?: string
          low_balance_threshold?: number
          total_distributed?: number
          total_loaded?: number
          updated_at?: string | null
        }
        Update: {
          balance?: number
          branch_id?: string
          brand_id?: string
          created_at?: string | null
          id?: string
          low_balance_threshold?: number
          total_distributed?: number
          total_loaded?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_points_wallet_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_points_wallet_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_points_wallet_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          branch_id: string
          brand_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          branch_id: string
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          branch_id?: string
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_wallet_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_wallet_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_wallet_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          branch_settings_json: Json | null
          brand_id: string
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          is_city_redemption_enabled: boolean
          last_points_reset_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          scoring_model: string
          slug: string
          state: string | null
          timezone: string
        }
        Insert: {
          branch_settings_json?: Json | null
          brand_id: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_city_redemption_enabled?: boolean
          last_points_reset_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          scoring_model?: string
          slug: string
          state?: string | null
          timezone?: string
        }
        Update: {
          branch_settings_json?: Json | null
          brand_id?: string
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_city_redemption_enabled?: boolean
          last_points_reset_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          scoring_model?: string
          slug?: string
          state?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_api_keys: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          label: string
          last_used_at: string | null
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          last_used_at?: string | null
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_api_keys_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_api_keys_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_business_model_addons: {
        Row: {
          activated_at: string
          billing_cycle: string
          branch_id: string | null
          brand_id: string
          business_model_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          notes: string | null
          price_cents: number
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          billing_cycle?: string
          branch_id?: string | null
          brand_id: string
          business_model_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          price_cents?: number
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          billing_cycle?: string
          branch_id?: string | null
          brand_id?: string
          business_model_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          price_cents?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_business_model_addons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_business_model_addons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_business_model_addons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_business_model_addons_business_model_id_fkey"
            columns: ["business_model_id"]
            isOneToOne: false
            referencedRelation: "business_models"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_business_models: {
        Row: {
          activated_at: string | null
          brand_id: string
          business_model_id: string
          config_json: Json
          created_at: string
          ganha_ganha_margin_pct: number | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          brand_id: string
          business_model_id: string
          config_json?: Json
          created_at?: string
          ganha_ganha_margin_pct?: number | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          brand_id?: string
          business_model_id?: string
          config_json?: Json
          created_at?: string
          ganha_ganha_margin_pct?: number | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_business_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_business_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_business_models_business_model_id_fkey"
            columns: ["business_model_id"]
            isOneToOne: false
            referencedRelation: "business_models"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_domains: {
        Row: {
          brand_id: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          is_primary: boolean
          subdomain: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          subdomain?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          subdomain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_domains_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_domains_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_duelo_prizes: {
        Row: {
          brand_id: string
          id: string
          points_reward: number
          position: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          id?: string
          points_reward: number
          position: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          id?: string
          points_reward?: number
          position?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_duelo_prizes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_duelo_prizes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_duelo_prizes_v2: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string
          id: string
          points_reward: number
          position: string
          tier_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string
          id?: string
          points_reward: number
          position: string
          tier_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          points_reward?: number
          position?: string
          tier_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      brand_modules: {
        Row: {
          brand_id: string
          config_json: Json
          created_at: string
          id: string
          is_enabled: boolean
          module_definition_id: string
          order_index: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          config_json?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_definition_id: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          config_json?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_definition_id?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_modules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_modules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_modules_module_definition_id_fkey"
            columns: ["module_definition_id"]
            isOneToOne: false
            referencedRelation: "module_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_permission_config: {
        Row: {
          allowed_for_brand: boolean
          allowed_for_store: boolean
          branch_id: string | null
          brand_id: string
          created_at: string
          id: string
          permission_key: string
          scope: string | null
          updated_at: string
        }
        Insert: {
          allowed_for_brand?: boolean
          allowed_for_store?: boolean
          branch_id?: string | null
          brand_id: string
          created_at?: string
          id?: string
          permission_key: string
          scope?: string | null
          updated_at?: string
        }
        Update: {
          allowed_for_brand?: boolean
          allowed_for_store?: boolean
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          permission_key?: string
          scope?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_permission_config_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_permission_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_permission_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_section_manual_items: {
        Row: {
          brand_section_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          order_index: number
        }
        Insert: {
          brand_section_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order_index?: number
        }
        Update: {
          brand_section_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_section_manual_items_brand_section_id_fkey"
            columns: ["brand_section_id"]
            isOneToOne: false
            referencedRelation: "brand_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_section_sources: {
        Row: {
          brand_section_id: string
          created_at: string
          filters_json: Json
          id: string
          limit: number
          source_type: Database["public"]["Enums"]["section_source_type"]
        }
        Insert: {
          brand_section_id: string
          created_at?: string
          filters_json?: Json
          id?: string
          limit?: number
          source_type: Database["public"]["Enums"]["section_source_type"]
        }
        Update: {
          brand_section_id?: string
          created_at?: string
          filters_json?: Json
          id?: string
          limit?: number
          source_type?: Database["public"]["Enums"]["section_source_type"]
        }
        Relationships: [
          {
            foreignKeyName: "brand_section_sources_brand_section_id_fkey"
            columns: ["brand_section_id"]
            isOneToOne: false
            referencedRelation: "brand_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_sections: {
        Row: {
          audience: string
          banner_height: string
          banner_image_url: string | null
          banners_json: Json
          brand_id: string
          city_filter_json: Json
          columns_count: number
          coupon_type_filter: string | null
          created_at: string
          cta_text: string | null
          display_mode: string
          filter_mode: string
          icon_size: string
          id: string
          is_enabled: boolean
          max_stores_visible: number | null
          min_stores_visible: number
          order_index: number
          page_id: string | null
          rows_count: number
          segment_filter_ids: string[] | null
          subtitle: string | null
          template_id: string
          title: string | null
          updated_at: string
          visual_json: Json
        }
        Insert: {
          audience?: string
          banner_height?: string
          banner_image_url?: string | null
          banners_json?: Json
          brand_id: string
          city_filter_json?: Json
          columns_count?: number
          coupon_type_filter?: string | null
          created_at?: string
          cta_text?: string | null
          display_mode?: string
          filter_mode?: string
          icon_size?: string
          id?: string
          is_enabled?: boolean
          max_stores_visible?: number | null
          min_stores_visible?: number
          order_index?: number
          page_id?: string | null
          rows_count?: number
          segment_filter_ids?: string[] | null
          subtitle?: string | null
          template_id: string
          title?: string | null
          updated_at?: string
          visual_json?: Json
        }
        Update: {
          audience?: string
          banner_height?: string
          banner_image_url?: string | null
          banners_json?: Json
          brand_id?: string
          city_filter_json?: Json
          columns_count?: number
          coupon_type_filter?: string | null
          created_at?: string
          cta_text?: string | null
          display_mode?: string
          filter_mode?: string
          icon_size?: string
          id?: string
          is_enabled?: boolean
          max_stores_visible?: number | null
          min_stores_visible?: number
          order_index?: number
          page_id?: string | null
          rows_count?: number
          segment_filter_ids?: string[] | null
          subtitle?: string | null
          template_id?: string
          title?: string | null
          updated_at?: string
          visual_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brand_sections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "custom_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "section_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_sub_permission_config: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string | null
          id: string
          is_allowed: boolean | null
          sub_item_id: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          sub_item_id: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          sub_item_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_sub_permission_config_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sub_permission_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sub_permission_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sub_permission_config_sub_item_id_fkey"
            columns: ["sub_item_id"]
            isOneToOne: false
            referencedRelation: "permission_sub_items"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          brand_settings_json: Json | null
          created_at: string
          default_theme_id: string | null
          home_layout_json: Json | null
          id: string
          is_active: boolean
          matrix_api_key: string | null
          matrix_basic_auth_password: string | null
          matrix_basic_auth_user: string | null
          name: string
          slug: string
          stripe_customer_id: string | null
          subscription_plan: string
          subscription_status: string
          tenant_id: string
          trial_expires_at: string | null
        }
        Insert: {
          brand_settings_json?: Json | null
          created_at?: string
          default_theme_id?: string | null
          home_layout_json?: Json | null
          id?: string
          is_active?: boolean
          matrix_api_key?: string | null
          matrix_basic_auth_password?: string | null
          matrix_basic_auth_user?: string | null
          name: string
          slug: string
          stripe_customer_id?: string | null
          subscription_plan?: string
          subscription_status?: string
          tenant_id: string
          trial_expires_at?: string | null
        }
        Update: {
          brand_settings_json?: Json | null
          created_at?: string
          default_theme_id?: string | null
          home_layout_json?: Json | null
          id?: string
          is_active?: boolean
          matrix_api_key?: string | null
          matrix_basic_auth_password?: string | null
          matrix_basic_auth_user?: string | null
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          subscription_plan?: string
          subscription_status?: string
          tenant_id?: string
          trial_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_model_modules: {
        Row: {
          business_model_id: string
          created_at: string
          is_required: boolean
          module_definition_id: string
        }
        Insert: {
          business_model_id: string
          created_at?: string
          is_required?: boolean
          module_definition_id: string
        }
        Update: {
          business_model_id?: string
          created_at?: string
          is_required?: boolean
          module_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_model_modules_business_model_id_fkey"
            columns: ["business_model_id"]
            isOneToOne: false
            referencedRelation: "business_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_model_modules_module_definition_id_fkey"
            columns: ["module_definition_id"]
            isOneToOne: false
            referencedRelation: "module_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_models: {
        Row: {
          addon_price_monthly_cents: number | null
          addon_price_yearly_cents: number | null
          audience: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_sellable_addon: boolean
          key: string
          name: string
          pricing_model: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          addon_price_monthly_cents?: number | null
          addon_price_yearly_cents?: number | null
          audience: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_sellable_addon?: boolean
          key: string
          name: string
          pricing_model?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          addon_price_monthly_cents?: number | null
          addon_price_yearly_cents?: number | null
          audience?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_sellable_addon?: boolean
          key?: string
          name?: string
          pricing_model?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_cart_orders: {
        Row: {
          branch_id: string
          brand_id: string
          confirmed_by_user_id: string | null
          created_at: string
          customer_cpf: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          items_json: Json
          notes: string | null
          points_confirmed_at: string | null
          points_earned_estimate: number
          status: string
          store_id: string
          total_amount: number
          whatsapp_url_sent: string | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          confirmed_by_user_id?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          items_json?: Json
          notes?: string | null
          points_confirmed_at?: string | null
          points_earned_estimate?: number
          status?: string
          store_id: string
          total_amount?: number
          whatsapp_url_sent?: string | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          confirmed_by_user_id?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          items_json?: Json
          notes?: string | null
          points_confirmed_at?: string | null
          points_earned_estimate?: number
          status?: string
          store_id?: string
          total_amount?: number
          whatsapp_url_sent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_cart_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_cart_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_cart_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_cart_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_cart_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_cart_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_cart_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      city_belt_champions: {
        Row: {
          achieved_at: string
          assigned_manually: boolean
          belt_prize_points: number
          branch_id: string
          brand_id: string
          champion_customer_id: string
          created_at: string
          id: string
          record_type: string
          record_value: number
          updated_at: string
        }
        Insert: {
          achieved_at?: string
          assigned_manually?: boolean
          belt_prize_points?: number
          branch_id: string
          brand_id: string
          champion_customer_id: string
          created_at?: string
          id?: string
          record_type?: string
          record_value?: number
          updated_at?: string
        }
        Update: {
          achieved_at?: string
          assigned_manually?: boolean
          belt_prize_points?: number
          branch_id?: string
          brand_id?: string
          champion_customer_id?: string
          created_at?: string
          id?: string
          record_type?: string
          record_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_belt_champions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_belt_champions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_belt_champions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_belt_champions_champion_customer_id_fkey"
            columns: ["champion_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_belt_champions_champion_customer_id_fkey"
            columns: ["champion_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      city_business_model_overrides: {
        Row: {
          branch_id: string
          brand_id: string
          business_model_id: string
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          business_model_id: string
          created_at?: string
          id?: string
          is_enabled: boolean
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          business_model_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_business_model_overrides_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_business_model_overrides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_business_model_overrides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_business_model_overrides_business_model_id_fkey"
            columns: ["business_model_id"]
            isOneToOne: false
            referencedRelation: "business_models"
            referencedColumns: ["id"]
          },
        ]
      }
      city_feed_events: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          customer_id: string | null
          description: string | null
          event_type: string
          id: string
          metadata_json: Json | null
          title: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata_json?: Json | null
          title: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata_json?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_feed_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_feed_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_feed_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_feed_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_feed_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      city_module_overrides: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          id: string
          is_enabled: boolean
          module_definition_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          id?: string
          is_enabled: boolean
          module_definition_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_definition_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_module_overrides_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_module_overrides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_module_overrides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_module_overrides_module_definition_id_fkey"
            columns: ["module_definition_id"]
            isOneToOne: false
            referencedRelation: "module_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_lead_notes: {
        Row: {
          author_name: string | null
          author_user_id: string | null
          content: string
          created_at: string
          id: string
          lead_id: string
          note_type: string
        }
        Insert: {
          author_name?: string | null
          author_user_id?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id: string
          note_type?: string
        }
        Update: {
          author_name?: string | null
          author_user_id?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "commercial_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_leads: {
        Row: {
          assigned_to: string | null
          city: string | null
          company_name: string
          company_role: string | null
          company_size: string | null
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          current_solution: string | null
          full_name: string
          id: string
          interest_message: string | null
          ip_address: string | null
          notes: string | null
          phone: string
          preferred_contact: string | null
          preferred_window: string | null
          product_id: string | null
          product_name: string | null
          product_slug: string | null
          qualified_at: string | null
          source: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          work_email: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          company_name: string
          company_role?: string | null
          company_size?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          current_solution?: string | null
          full_name: string
          id?: string
          interest_message?: string | null
          ip_address?: string | null
          notes?: string | null
          phone: string
          preferred_contact?: string | null
          preferred_window?: string | null
          product_id?: string | null
          product_name?: string | null
          product_slug?: string | null
          qualified_at?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          work_email: string
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          company_name?: string
          company_role?: string | null
          company_size?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          current_solution?: string | null
          full_name?: string
          id?: string
          interest_message?: string | null
          ip_address?: string | null
          notes?: string | null
          phone?: string
          preferred_contact?: string | null
          preferred_window?: string | null
          product_id?: string | null
          product_name?: string | null
          product_slug?: string | null
          qualified_at?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          work_email?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          branch_id: string
          brand_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          offer_id: string | null
          status: string
          store_id: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          branch_id: string
          brand_id: string
          code?: string
          created_at?: string
          expires_at: string
          id?: string
          offer_id?: string | null
          status?: string
          store_id: string
          type: string
          updated_at?: string
          value?: number
        }
        Update: {
          branch_id?: string
          brand_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          offer_id?: string | null
          status?: string
          store_id?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      cp_notes: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cp_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_audiences: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          description: string | null
          estimated_count: number
          filters_json: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_count?: number
          filters_json?: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_count?: number
          filters_json?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_audiences_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_audiences_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_logs: {
        Row: {
          campaign_id: string
          channel: string
          contact_id: string
          created_at: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          channel: string
          contact_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          contact_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience_id: string | null
          brand_id: string
          channel: string
          cost_per_send: number
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          message_template: string | null
          offer_config_json: Json
          scheduled_at: string | null
          sent_at: string | null
          status: string
          store_id: string | null
          title: string
          total_cost: number
          total_recipients: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience_id?: string | null
          brand_id: string
          channel?: string
          cost_per_send?: number
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          message_template?: string | null
          offer_config_json?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          store_id?: string | null
          title: string
          total_cost?: number
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience_id?: string | null
          brand_id?: string
          channel?: string
          cost_per_send?: number
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          message_template?: string | null
          offer_config_json?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          store_id?: string | null
          title?: string
          total_cost?: number
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "crm_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          branch_id: string | null
          brand_id: string
          cpf: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          external_id: string | null
          first_ride_at: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_ride_at: string | null
          latitude: number | null
          longitude: number | null
          metadata_json: Json
          name: string | null
          os_platform: string | null
          phone: string | null
          ride_count: number
          source: string
          tags_json: Json
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          cpf?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          external_id?: string | null
          first_ride_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_ride_at?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata_json?: Json
          name?: string | null
          os_platform?: string | null
          phone?: string | null
          ride_count?: number
          source?: string
          tags_json?: Json
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          cpf?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          external_id?: string | null
          first_ride_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_ride_at?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata_json?: Json
          name?: string | null
          os_platform?: string | null
          phone?: string | null
          ride_count?: number
          source?: string
          tags_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_events: {
        Row: {
          brand_id: string
          contact_id: string
          created_at: string
          event_subtype: string | null
          event_type: string
          id: string
          latitude: number | null
          longitude: number | null
          payload_json: Json
        }
        Insert: {
          brand_id: string
          contact_id: string
          created_at?: string
          event_subtype?: string | null
          event_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          payload_json?: Json
        }
        Update: {
          brand_id?: string
          contact_id?: string
          created_at?: string
          event_subtype?: string | null
          event_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          payload_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tiers: {
        Row: {
          brand_id: string
          color: string
          created_at: string
          icon: string | null
          id: string
          max_events: number | null
          min_events: number
          name: string
          order_index: number
        }
        Insert: {
          brand_id: string
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          max_events?: number | null
          min_events?: number
          name: string
          order_index?: number
        }
        Update: {
          brand_id?: string
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          max_events?: number | null
          min_events?: number
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_tiers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tiers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_pages: {
        Row: {
          banner_config_json: Json
          brand_id: string
          created_at: string
          elements_json: Json
          id: string
          is_published: boolean
          page_version: number
          permissions_json: Json
          published_at: string | null
          search_enabled: boolean
          slug: string
          subtitle: string | null
          tags_json: Json
          title: string
          updated_at: string
          visibility_config_json: Json
          visibility_type: string
        }
        Insert: {
          banner_config_json?: Json
          brand_id: string
          created_at?: string
          elements_json?: Json
          id?: string
          is_published?: boolean
          page_version?: number
          permissions_json?: Json
          published_at?: string | null
          search_enabled?: boolean
          slug: string
          subtitle?: string | null
          tags_json?: Json
          title: string
          updated_at?: string
          visibility_config_json?: Json
          visibility_type?: string
        }
        Update: {
          banner_config_json?: Json
          brand_id?: string
          created_at?: string
          elements_json?: Json
          id?: string
          is_published?: boolean
          page_version?: number
          permissions_json?: Json
          published_at?: string | null
          search_enabled?: boolean
          slug?: string
          subtitle?: string | null
          tags_json?: Json
          title?: string
          updated_at?: string
          visibility_config_json?: Json
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_click_events: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          customer_id: string
          entity_id: string
          entity_type: string
          id: string
          store_id: string | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          customer_id: string
          entity_id: string
          entity_type?: string
          id?: string
          store_id?: string | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          customer_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_click_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_click_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_click_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_click_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_click_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorite_stores: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          store_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          store_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorite_stores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorite_stores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorite_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorite_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          offer_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          offer_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorites_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string
          id: string
          is_read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          branch_id: string
          brand_id: string
          cpf: string | null
          created_at: string
          crm_contact_id: string | null
          crm_sync_status: string | null
          customer_tier: string | null
          driver_cycle_start: string | null
          driver_monthly_ride_count: number | null
          email: string | null
          external_driver_id: string | null
          id: string
          is_active: boolean
          money_balance: number
          name: string
          phone: string | null
          points_balance: number
          ride_count: number | null
          scoring_disabled: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          cpf?: string | null
          created_at?: string
          crm_contact_id?: string | null
          crm_sync_status?: string | null
          customer_tier?: string | null
          driver_cycle_start?: string | null
          driver_monthly_ride_count?: number | null
          email?: string | null
          external_driver_id?: string | null
          id?: string
          is_active?: boolean
          money_balance?: number
          name: string
          phone?: string | null
          points_balance?: number
          ride_count?: number | null
          scoring_disabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          cpf?: string | null
          created_at?: string
          crm_contact_id?: string | null
          crm_sync_status?: string | null
          customer_tier?: string | null
          driver_cycle_start?: string | null
          driver_monthly_ride_count?: number | null
          email?: string | null
          external_driver_id?: string | null
          id?: string
          is_active?: boolean
          money_balance?: number
          name?: string
          phone?: string | null
          points_balance?: number
          ride_count?: number | null
          scoring_disabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_achievements: {
        Row: {
          achieved_at: string
          achievement_key: string
          achievement_label: string
          branch_id: string
          brand_id: string
          customer_id: string
          icon_name: string | null
          id: string
          metadata_json: Json | null
        }
        Insert: {
          achieved_at?: string
          achievement_key: string
          achievement_label: string
          branch_id: string
          brand_id: string
          customer_id: string
          icon_name?: string | null
          id?: string
          metadata_json?: Json | null
        }
        Update: {
          achieved_at?: string
          achievement_key?: string
          achievement_label?: string
          branch_id?: string
          brand_id?: string
          customer_id?: string
          icon_name?: string | null
          id?: string
          metadata_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_achievements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_achievements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_achievements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_achievements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_achievements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_duel_audit_log: {
        Row: {
          challenged_customer_id: string
          challenged_ride_ids: string[] | null
          challenged_rides_counted: number
          challenger_customer_id: string
          challenger_ride_ids: string[] | null
          challenger_rides_counted: number
          count_window_end: string
          count_window_start: string
          created_at: string | null
          duel_id: string
          finalized_by: string | null
          id: string
          points_settled: boolean | null
          winner_participant_id: string | null
        }
        Insert: {
          challenged_customer_id: string
          challenged_ride_ids?: string[] | null
          challenged_rides_counted?: number
          challenger_customer_id: string
          challenger_ride_ids?: string[] | null
          challenger_rides_counted?: number
          count_window_end: string
          count_window_start: string
          created_at?: string | null
          duel_id: string
          finalized_by?: string | null
          id?: string
          points_settled?: boolean | null
          winner_participant_id?: string | null
        }
        Update: {
          challenged_customer_id?: string
          challenged_ride_ids?: string[] | null
          challenged_rides_counted?: number
          challenger_customer_id?: string
          challenger_ride_ids?: string[] | null
          challenger_rides_counted?: number
          count_window_end?: string
          count_window_start?: string
          created_at?: string | null
          duel_id?: string
          finalized_by?: string | null
          id?: string
          points_settled?: boolean | null
          winner_participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_duel_audit_log_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "driver_duels"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_duel_guesses: {
        Row: {
          created_at: string
          customer_id: string
          duel_id: string
          id: string
          predicted_winner_participant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          duel_id: string
          id?: string
          predicted_winner_participant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          duel_id?: string
          id?: string
          predicted_winner_participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_duel_guesses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_guesses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_guesses_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "driver_duels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_guesses_predicted_winner_participant_id_fkey"
            columns: ["predicted_winner_participant_id"]
            isOneToOne: false
            referencedRelation: "driver_duel_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_duel_participants: {
        Row: {
          avatar_url: string | null
          branch_id: string
          brand_id: string
          created_at: string
          customer_id: string
          display_name: string | null
          duels_enabled: boolean
          id: string
          public_nickname: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id: string
          brand_id: string
          created_at?: string
          customer_id: string
          display_name?: string | null
          duels_enabled?: boolean
          id?: string
          public_nickname?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string
          brand_id?: string
          created_at?: string
          customer_id?: string
          display_name?: string | null
          duels_enabled?: boolean
          id?: string
          public_nickname?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_duel_participants_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_participants_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_participants_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_participants_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_participants_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_duel_ratings: {
        Row: {
          comment: string | null
          created_at: string
          duel_id: string
          id: string
          rated_customer_id: string
          rater_customer_id: string
          rating: number
          tags: string[]
        }
        Insert: {
          comment?: string | null
          created_at?: string
          duel_id: string
          id?: string
          rated_customer_id: string
          rater_customer_id: string
          rating: number
          tags?: string[]
        }
        Update: {
          comment?: string | null
          created_at?: string
          duel_id?: string
          id?: string
          rated_customer_id?: string
          rater_customer_id?: string
          rating?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "driver_duel_ratings_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "driver_duels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_ratings_rated_customer_id_fkey"
            columns: ["rated_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_ratings_rated_customer_id_fkey"
            columns: ["rated_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_ratings_rater_customer_id_fkey"
            columns: ["rater_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duel_ratings_rater_customer_id_fkey"
            columns: ["rater_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_duels: {
        Row: {
          accepted_at: string | null
          branch_id: string
          brand_id: string
          challenged_id: string
          challenged_points_bet: number
          challenged_rides_count: number
          challenger_id: string
          challenger_points_bet: number
          challenger_rides_count: number
          counter_proposal_by: string | null
          counter_proposal_points: number | null
          created_at: string
          declined_at: string | null
          duel_mode: string
          duel_origin: string
          end_at: string
          finished_at: string | null
          id: string
          is_rematch: boolean
          negotiation_status: string
          points_reserved: boolean
          points_settled: boolean
          prize_points: number
          rematch_of: string | null
          season_id: string | null
          sponsored_by_brand: boolean
          start_at: string
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          branch_id: string
          brand_id: string
          challenged_id: string
          challenged_points_bet?: number
          challenged_rides_count?: number
          challenger_id: string
          challenger_points_bet?: number
          challenger_rides_count?: number
          counter_proposal_by?: string | null
          counter_proposal_points?: number | null
          created_at?: string
          declined_at?: string | null
          duel_mode?: string
          duel_origin?: string
          end_at: string
          finished_at?: string | null
          id?: string
          is_rematch?: boolean
          negotiation_status?: string
          points_reserved?: boolean
          points_settled?: boolean
          prize_points?: number
          rematch_of?: string | null
          season_id?: string | null
          sponsored_by_brand?: boolean
          start_at: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          branch_id?: string
          brand_id?: string
          challenged_id?: string
          challenged_points_bet?: number
          challenged_rides_count?: number
          challenger_id?: string
          challenger_points_bet?: number
          challenger_rides_count?: number
          counter_proposal_by?: string | null
          counter_proposal_points?: number | null
          created_at?: string
          declined_at?: string | null
          duel_mode?: string
          duel_origin?: string
          end_at?: string
          finished_at?: string | null
          id?: string
          is_rematch?: boolean
          negotiation_status?: string
          points_reserved?: boolean
          points_settled?: boolean
          prize_points?: number
          rematch_of?: string | null
          season_id?: string | null
          sponsored_by_brand?: boolean
          start_at?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_duels_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_challenged_id_fkey"
            columns: ["challenged_id"]
            isOneToOne: false
            referencedRelation: "driver_duel_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "driver_duel_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_rematch_of_fkey"
            columns: ["rematch_of"]
            isOneToOne: false
            referencedRelation: "driver_duels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "gamification_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_duels_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "driver_duel_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_import_jobs: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string
          created_by: string | null
          created_count: number
          error_count: number
          errors_json: Json
          finished_at: string | null
          id: string
          processed_rows: number
          skipped_count: number
          started_at: string | null
          status: string
          total_rows: number
          updated_count: number
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string
          created_by?: string | null
          created_count?: number
          error_count?: number
          errors_json?: Json
          finished_at?: string | null
          id?: string
          processed_rows?: number
          skipped_count?: number
          started_at?: string | null
          status?: string
          total_rows?: number
          updated_count?: number
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          created_by?: string | null
          created_count?: number
          error_count?: number
          errors_json?: Json
          finished_at?: string | null
          id?: string
          processed_rows?: number
          skipped_count?: number
          started_at?: string | null
          status?: string
          total_rows?: number
          updated_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_import_jobs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_import_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_import_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_message_flows: {
        Row: {
          audience: string
          branch_id: string | null
          brand_id: string
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          template_id: string
          updated_at: string
        }
        Insert: {
          audience?: string
          branch_id?: string | null
          brand_id: string
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          template_id: string
          updated_at?: string
        }
        Update: {
          audience?: string
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_message_flows_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_flows_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_flows_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_flows_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "driver_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_message_logs: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string
          customer_id: string
          error_detail: string | null
          event_type: string | null
          flow_id: string | null
          id: string
          metadata_json: Json
          rendered_message: string
          status: string
          template_id: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string
          customer_id: string
          error_detail?: string | null
          event_type?: string | null
          flow_id?: string | null
          id?: string
          metadata_json?: Json
          rendered_message?: string
          status?: string
          template_id?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          customer_id?: string
          error_detail?: string | null
          event_type?: string | null
          flow_id?: string | null
          id?: string
          metadata_json?: Json
          rendered_message?: string
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_message_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_logs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "driver_message_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "driver_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_message_templates: {
        Row: {
          available_vars: string[]
          body_template: string
          brand_id: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          available_vars?: string[]
          body_template?: string
          brand_id: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          available_vars?: string[]
          body_template?: string
          brand_id?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_message_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_message_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_points_orders: {
        Row: {
          branch_id: string | null
          brand_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          customer_id: string
          id: string
          points_amount: number
          price_cents: number
          status: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id: string
          id?: string
          points_amount: number
          price_cents: number
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          points_amount?: number
          price_cents?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_points_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_points_purchase_config: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          is_active: boolean
          max_points: number
          min_points: number
          price_per_thousand_cents: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_points?: number
          min_points?: number
          price_per_thousand_cents?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_points?: number
          min_points?: number
          price_per_thousand_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_points_purchase_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_purchase_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_points_rules: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string | null
          fixed_points_per_ride: number | null
          id: string
          is_active: boolean | null
          macaneta_points_per_ride: number
          percent_of_passenger: number | null
          points_per_real: number | null
          rule_mode: string
          updated_at: string | null
          volume_cycle_days: number | null
          volume_tiers: Json | null
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string | null
          fixed_points_per_ride?: number | null
          id?: string
          is_active?: boolean | null
          macaneta_points_per_ride?: number
          percent_of_passenger?: number | null
          points_per_real?: number | null
          rule_mode?: string
          updated_at?: string | null
          volume_cycle_days?: number | null
          volume_tiers?: Json | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string | null
          fixed_points_per_ride?: number | null
          id?: string
          is_active?: boolean | null
          macaneta_points_per_ride?: number
          percent_of_passenger?: number | null
          points_per_real?: number | null
          rule_mode?: string
          updated_at?: string | null
          volume_cycle_days?: number | null
          volume_tiers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_points_rules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          acceptance_rate: number | null
          acceptance_rate_updated_at: string | null
          accepted_payments: Json | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zipcode: string | null
          app_version: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_code: string | null
          bank_holder_cpf: string | null
          bank_holder_name: string | null
          birth_date: string | null
          block_reason: string | null
          blocked_until: string | null
          branch_id: string | null
          brand_id: string
          cnh_expiration: string | null
          cnh_number: string | null
          customer_id: string
          external_id: string | null
          extra_data: string | null
          fees_json: Json | null
          gender: string | null
          has_ear: boolean | null
          imei_1: string | null
          imei_2: string | null
          imported_at: string
          internal_note_1: string | null
          internal_note_2: string | null
          internal_note_3: string | null
          last_activity_at: string | null
          last_os_at: string | null
          link_type: string | null
          mother_name: string | null
          pix_key: string | null
          rating: number | null
          raw_import_json: Json | null
          referred_by: string | null
          registered_at: string | null
          registration_status: string | null
          registration_status_at: string | null
          relationship: string | null
          services_offered: Json | null
          updated_at: string
          vehicle1_city: string | null
          vehicle1_color: string | null
          vehicle1_exercise_year: number | null
          vehicle1_model: string | null
          vehicle1_own: boolean | null
          vehicle1_plate: string | null
          vehicle1_renavam: string | null
          vehicle1_state: string | null
          vehicle1_year: number | null
          vehicle2_city: string | null
          vehicle2_color: string | null
          vehicle2_exercise_year: number | null
          vehicle2_model: string | null
          vehicle2_own: boolean | null
          vehicle2_plate: string | null
          vehicle2_renavam: string | null
          vehicle2_state: string | null
          vehicle2_year: number | null
          vtr: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          acceptance_rate_updated_at?: string | null
          accepted_payments?: Json | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          app_version?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_holder_cpf?: string | null
          bank_holder_name?: string | null
          birth_date?: string | null
          block_reason?: string | null
          blocked_until?: string | null
          branch_id?: string | null
          brand_id: string
          cnh_expiration?: string | null
          cnh_number?: string | null
          customer_id: string
          external_id?: string | null
          extra_data?: string | null
          fees_json?: Json | null
          gender?: string | null
          has_ear?: boolean | null
          imei_1?: string | null
          imei_2?: string | null
          imported_at?: string
          internal_note_1?: string | null
          internal_note_2?: string | null
          internal_note_3?: string | null
          last_activity_at?: string | null
          last_os_at?: string | null
          link_type?: string | null
          mother_name?: string | null
          pix_key?: string | null
          rating?: number | null
          raw_import_json?: Json | null
          referred_by?: string | null
          registered_at?: string | null
          registration_status?: string | null
          registration_status_at?: string | null
          relationship?: string | null
          services_offered?: Json | null
          updated_at?: string
          vehicle1_city?: string | null
          vehicle1_color?: string | null
          vehicle1_exercise_year?: number | null
          vehicle1_model?: string | null
          vehicle1_own?: boolean | null
          vehicle1_plate?: string | null
          vehicle1_renavam?: string | null
          vehicle1_state?: string | null
          vehicle1_year?: number | null
          vehicle2_city?: string | null
          vehicle2_color?: string | null
          vehicle2_exercise_year?: number | null
          vehicle2_model?: string | null
          vehicle2_own?: boolean | null
          vehicle2_plate?: string | null
          vehicle2_renavam?: string | null
          vehicle2_state?: string | null
          vehicle2_year?: number | null
          vtr?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          acceptance_rate_updated_at?: string | null
          accepted_payments?: Json | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          app_version?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_holder_cpf?: string | null
          bank_holder_name?: string | null
          birth_date?: string | null
          block_reason?: string | null
          blocked_until?: string | null
          branch_id?: string | null
          brand_id?: string
          cnh_expiration?: string | null
          cnh_number?: string | null
          customer_id?: string
          external_id?: string | null
          extra_data?: string | null
          fees_json?: Json | null
          gender?: string | null
          has_ear?: boolean | null
          imei_1?: string | null
          imei_2?: string | null
          imported_at?: string
          internal_note_1?: string | null
          internal_note_2?: string | null
          internal_note_3?: string | null
          last_activity_at?: string | null
          last_os_at?: string | null
          link_type?: string | null
          mother_name?: string | null
          pix_key?: string | null
          rating?: number | null
          raw_import_json?: Json | null
          referred_by?: string | null
          registered_at?: string | null
          registration_status?: string | null
          registration_status_at?: string | null
          relationship?: string | null
          services_offered?: Json | null
          updated_at?: string
          vehicle1_city?: string | null
          vehicle1_color?: string | null
          vehicle1_exercise_year?: number | null
          vehicle1_model?: string | null
          vehicle1_own?: boolean | null
          vehicle1_plate?: string | null
          vehicle1_renavam?: string | null
          vehicle1_state?: string | null
          vehicle1_year?: number | null
          vehicle2_city?: string | null
          vehicle2_color?: string | null
          vehicle2_exercise_year?: number | null
          vehicle2_model?: string | null
          vehicle2_own?: boolean | null
          vehicle2_plate?: string | null
          vehicle2_renavam?: string | null
          vehicle2_state?: string | null
          vehicle2_year?: number | null
          vtr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_verification_codes: {
        Row: {
          code: string
          created_at: string
          customer_id: string
          email: string | null
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          customer_id: string
          email?: string | null
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          customer_id?: string
          email?: string | null
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "driver_verification_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_verification_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      duel_cycle_reset_history: {
        Row: {
          action_executed: string
          branch_id: string
          brand_id: string
          config_snapshot: Json
          details_json: Json | null
          drivers_affected: number
          executed_at: string
          id: string
          total_points_distributed: number
          triggered_by: string
          triggered_by_user: string | null
        }
        Insert: {
          action_executed: string
          branch_id: string
          brand_id: string
          config_snapshot?: Json
          details_json?: Json | null
          drivers_affected?: number
          executed_at?: string
          id?: string
          total_points_distributed?: number
          triggered_by?: string
          triggered_by_user?: string | null
        }
        Update: {
          action_executed?: string
          branch_id?: string
          brand_id?: string
          config_snapshot?: Json
          details_json?: Json | null
          drivers_affected?: number
          executed_at?: string
          id?: string
          total_points_distributed?: number
          triggered_by?: string
          triggered_by_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duel_cycle_reset_history_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_cycle_reset_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_cycle_reset_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      duel_prize_campaigns: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          image_url: string | null
          name: string
          points_cost: number
          quantity_redeemed: number
          quantity_total: number
          season_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          image_url?: string | null
          name: string
          points_cost: number
          quantity_redeemed?: number
          quantity_total: number
          season_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          image_url?: string | null
          name?: string
          points_cost?: number
          quantity_redeemed?: number
          quantity_total?: number
          season_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duel_prize_campaigns_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_prize_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_prize_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_prize_campaigns_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "gamification_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      duel_side_bets: {
        Row: {
          bettor_a_customer_id: string
          bettor_a_points: number
          bettor_a_predicted_winner: string
          bettor_b_customer_id: string | null
          bettor_b_points: number | null
          bettor_b_predicted_winner: string | null
          branch_id: string
          brand_id: string
          counter_proposal_points: number | null
          created_at: string
          duel_id: string
          duel_winner_bonus: number | null
          id: string
          points_reserved: boolean
          settled_at: string | null
          status: string
          updated_at: string
          winner_customer_id: string | null
        }
        Insert: {
          bettor_a_customer_id: string
          bettor_a_points: number
          bettor_a_predicted_winner: string
          bettor_b_customer_id?: string | null
          bettor_b_points?: number | null
          bettor_b_predicted_winner?: string | null
          branch_id: string
          brand_id: string
          counter_proposal_points?: number | null
          created_at?: string
          duel_id: string
          duel_winner_bonus?: number | null
          id?: string
          points_reserved?: boolean
          settled_at?: string | null
          status?: string
          updated_at?: string
          winner_customer_id?: string | null
        }
        Update: {
          bettor_a_customer_id?: string
          bettor_a_points?: number
          bettor_a_predicted_winner?: string
          bettor_b_customer_id?: string | null
          bettor_b_points?: number | null
          bettor_b_predicted_winner?: string | null
          branch_id?: string
          brand_id?: string
          counter_proposal_points?: number | null
          created_at?: string
          duel_id?: string
          duel_winner_bonus?: number | null
          id?: string
          points_reserved?: boolean
          settled_at?: string | null
          status?: string
          updated_at?: string
          winner_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duel_side_bets_bettor_a_customer_id_fkey"
            columns: ["bettor_a_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_bettor_a_customer_id_fkey"
            columns: ["bettor_a_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_bettor_a_predicted_winner_fkey"
            columns: ["bettor_a_predicted_winner"]
            isOneToOne: false
            referencedRelation: "driver_duel_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_bettor_b_customer_id_fkey"
            columns: ["bettor_b_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_bettor_b_customer_id_fkey"
            columns: ["bettor_b_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_bettor_b_predicted_winner_fkey"
            columns: ["bettor_b_predicted_winner"]
            isOneToOne: false
            referencedRelation: "driver_duel_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "driver_duels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_winner_customer_id_fkey"
            columns: ["winner_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_side_bets_winner_customer_id_fkey"
            columns: ["winner_customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_attempts_log: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          code: string
          created_at: string
          details_json: Json
          driver_id: string | null
          id: string
          ride_id: string | null
          season_id: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          code: string
          created_at?: string
          details_json?: Json
          driver_id?: string | null
          id?: string
          ride_id?: string | null
          season_id?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          code?: string
          created_at?: string
          details_json?: Json
          driver_id?: string | null
          id?: string
          ride_id?: string | null
          season_id?: string | null
        }
        Relationships: []
      }
      duelo_brackets: {
        Row: {
          driver_a_id: string | null
          driver_a_rides: number
          driver_b_id: string | null
          driver_b_rides: number
          ends_at: string
          id: string
          round: string
          season_id: string
          slot: number
          starts_at: string
          tier_id: string | null
          winner_id: string | null
        }
        Insert: {
          driver_a_id?: string | null
          driver_a_rides?: number
          driver_b_id?: string | null
          driver_b_rides?: number
          ends_at: string
          id?: string
          round: string
          season_id: string
          slot: number
          starts_at: string
          tier_id?: string | null
          winner_id?: string | null
        }
        Update: {
          driver_a_id?: string | null
          driver_a_rides?: number
          driver_b_id?: string | null
          driver_b_rides?: number
          ends_at?: string
          id?: string
          round?: string
          season_id?: string
          slot?: number
          starts_at?: string
          tier_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duelo_brackets_driver_a_id_fkey"
            columns: ["driver_a_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_driver_a_id_fkey"
            columns: ["driver_a_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_driver_b_id_fkey"
            columns: ["driver_b_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_driver_b_id_fkey"
            columns: ["driver_b_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "duelo_season_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_brackets_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_champions: {
        Row: {
          branch_id: string
          brand_id: string
          champion_driver_id: string | null
          finalized_at: string | null
          id: string
          prizes_distributed: boolean
          quarterfinalist_ids: string[]
          r16_ids: string[]
          runner_up_driver_id: string | null
          season_id: string
          semifinalist_ids: string[]
        }
        Insert: {
          branch_id: string
          brand_id: string
          champion_driver_id?: string | null
          finalized_at?: string | null
          id?: string
          prizes_distributed?: boolean
          quarterfinalist_ids?: string[]
          r16_ids?: string[]
          runner_up_driver_id?: string | null
          season_id: string
          semifinalist_ids?: string[]
        }
        Update: {
          branch_id?: string
          brand_id?: string
          champion_driver_id?: string | null
          finalized_at?: string | null
          id?: string
          prizes_distributed?: boolean
          quarterfinalist_ids?: string[]
          r16_ids?: string[]
          runner_up_driver_id?: string | null
          season_id?: string
          semifinalist_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "duelo_champions_champion_driver_id_fkey"
            columns: ["champion_driver_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_champions_champion_driver_id_fkey"
            columns: ["champion_driver_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_champions_runner_up_driver_id_fkey"
            columns: ["runner_up_driver_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_champions_runner_up_driver_id_fkey"
            columns: ["runner_up_driver_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_champions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: true
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_classificacao_auditoria: {
        Row: {
          attempted_by: string | null
          block_code: string | null
          block_reason: string | null
          branch_id: string
          brand_id: string
          created_at: string
          details_json: Json
          divergent_count: number | null
          divergent_sample: Json | null
          eligible_count: number | null
          id: string
          outcome: string
          required_count: number | null
          season_id: string
        }
        Insert: {
          attempted_by?: string | null
          block_code?: string | null
          block_reason?: string | null
          branch_id: string
          brand_id: string
          created_at?: string
          details_json?: Json
          divergent_count?: number | null
          divergent_sample?: Json | null
          eligible_count?: number | null
          id?: string
          outcome: string
          required_count?: number | null
          season_id: string
        }
        Update: {
          attempted_by?: string | null
          block_code?: string | null
          block_reason?: string | null
          branch_id?: string
          brand_id?: string
          created_at?: string
          details_json?: Json
          divergent_count?: number | null
          divergent_sample?: Json | null
          eligible_count?: number | null
          id?: string
          outcome?: string
          required_count?: number | null
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duelo_classificacao_auditoria_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_driver_tier_history: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          driver_id: string
          ending_position: number | null
          ending_tier_id: string | null
          id: string
          outcome: string | null
          season_id: string
          starting_tier_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          driver_id: string
          ending_position?: number | null
          ending_tier_id?: string | null
          id?: string
          outcome?: string | null
          season_id: string
          starting_tier_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          driver_id?: string
          ending_position?: number | null
          ending_tier_id?: string | null
          id?: string
          outcome?: string | null
          season_id?: string
          starting_tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duelo_driver_tier_history_ending_tier_id_fkey"
            columns: ["ending_tier_id"]
            isOneToOne: false
            referencedRelation: "duelo_season_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_driver_tier_history_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_driver_tier_history_starting_tier_id_fkey"
            columns: ["starting_tier_id"]
            isOneToOne: false
            referencedRelation: "duelo_season_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_match_events: {
        Row: {
          bracket_id: string
          driver_id: string
          event_ref_id: string | null
          event_type: string
          id: string
          occurred_at: string
        }
        Insert: {
          bracket_id: string
          driver_id: string
          event_ref_id?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
        }
        Update: {
          bracket_id?: string
          driver_id?: string
          event_ref_id?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duelo_match_events_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "duelo_brackets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_match_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_match_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_season_standings: {
        Row: {
          driver_id: string
          five_star_count: number
          id: string
          last_ride_at: string | null
          points: number
          position: number | null
          position_in_tier: number | null
          qualified: boolean
          relegated_auto: boolean
          season_id: string
          tier_id: string | null
        }
        Insert: {
          driver_id: string
          five_star_count?: number
          id?: string
          last_ride_at?: string | null
          points?: number
          position?: number | null
          position_in_tier?: number | null
          qualified?: boolean
          relegated_auto?: boolean
          season_id: string
          tier_id?: string | null
        }
        Update: {
          driver_id?: string
          five_star_count?: number
          id?: string
          last_ride_at?: string | null
          points?: number
          position?: number | null
          position_in_tier?: number | null
          qualified?: boolean
          relegated_auto?: boolean
          season_id?: string
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duelo_season_standings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_season_standings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_season_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_season_standings_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "duelo_season_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_season_tiers: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          id: string
          name: string
          promotion_count: number
          relegation_count: number
          season_id: string
          target_size: number
          tier_order: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          id?: string
          name: string
          promotion_count?: number
          relegation_count?: number
          season_id: string
          target_size?: number
          tier_order: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          promotion_count?: number
          relegation_count?: number
          season_id?: string
          target_size?: number
          tier_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duelo_season_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_seasons: {
        Row: {
          branch_id: string
          brand_id: string
          classification_ends_at: string
          classification_starts_at: string
          created_at: string
          created_by: string | null
          id: string
          knockout_ends_at: string
          knockout_starts_at: string
          month: number
          name: string
          phase: string
          relegation_policy: string
          tier_seeding_completed_at: string | null
          tiers_config_json: Json
          tiers_count: number
          updated_at: string
          year: number
        }
        Insert: {
          branch_id: string
          brand_id: string
          classification_ends_at: string
          classification_starts_at: string
          created_at?: string
          created_by?: string | null
          id?: string
          knockout_ends_at: string
          knockout_starts_at: string
          month: number
          name: string
          phase?: string
          relegation_policy?: string
          tier_seeding_completed_at?: string | null
          tiers_config_json?: Json
          tiers_count?: number
          updated_at?: string
          year: number
        }
        Update: {
          branch_id?: string
          brand_id?: string
          classification_ends_at?: string
          classification_starts_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          knockout_ends_at?: string
          knockout_starts_at?: string
          month?: number
          name?: string
          phase?: string
          relegation_policy?: string
          tier_seeding_completed_at?: string | null
          tiers_config_json?: Json
          tiers_count?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "duelo_seasons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_seasons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_seasons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      duelo_tier_memberships: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          driver_id: string
          id: string
          season_id: string
          source: string
          tier_id: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          driver_id: string
          id?: string
          season_id: string
          source?: string
          tier_id: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          driver_id?: string
          id?: string
          season_id?: string
          source?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duelo_tier_memberships_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "duelo_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duelo_tier_memberships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "duelo_season_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      earning_events: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          created_by_user_id: string
          customer_id: string
          id: string
          money_earned: number
          points_earned: number
          purchase_value: number
          receipt_code: string | null
          rule_snapshot_json: Json | null
          source: Database["public"]["Enums"]["earning_source"]
          status: Database["public"]["Enums"]["earning_status"]
          store_id: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          created_by_user_id: string
          customer_id: string
          id?: string
          money_earned?: number
          points_earned?: number
          purchase_value?: number
          receipt_code?: string | null
          rule_snapshot_json?: Json | null
          source?: Database["public"]["Enums"]["earning_source"]
          status?: Database["public"]["Enums"]["earning_status"]
          store_id: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          created_by_user_id?: string
          customer_id?: string
          id?: string
          money_earned?: number
          points_earned?: number
          purchase_value?: number
          receipt_code?: string | null
          rule_snapshot_json?: Json | null
          source?: Database["public"]["Enums"]["earning_source"]
          status?: Database["public"]["Enums"]["earning_status"]
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earning_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          message: string
          metadata_json: Json | null
          severity: string
          source: string
          stack: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata_json?: Json | null
          severity?: string
          source?: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata_json?: Json | null
          severity?: string
          source?: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          label: string
          metadata_json: Json
          scope_id: string | null
          scope_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          label: string
          metadata_json?: Json
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          label?: string
          metadata_json?: Json
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      gamification_seasons: {
        Row: {
          branch_id: string
          brand_id: string
          config_json: Json | null
          created_at: string
          end_at: string
          id: string
          name: string
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          config_json?: Json | null
          created_at?: string
          end_at: string
          id?: string
          name: string
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          config_json?: Json | null
          created_at?: string
          end_at?: string
          id?: string
          name?: string
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_seasons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_seasons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_seasons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      ganha_ganha_billing_events: {
        Row: {
          brand_id: string
          created_at: string
          event_type: string
          fee_per_point: number
          fee_total: number
          id: string
          period_month: string
          points_amount: number
          reference_id: string | null
          reference_type: string | null
          store_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          event_type: string
          fee_per_point?: number
          fee_total?: number
          id?: string
          period_month?: string
          points_amount?: number
          reference_id?: string | null
          reference_type?: string | null
          store_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          event_type?: string
          fee_per_point?: number
          fee_total?: number
          id?: string
          period_month?: string
          points_amount?: number
          reference_id?: string | null
          reference_type?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ganha_ganha_billing_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_billing_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_billing_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_billing_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ganha_ganha_config: {
        Row: {
          brand_id: string
          created_at: string
          fee_mode: string
          fee_per_point_earned: number
          fee_per_point_redeemed: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          fee_mode?: string
          fee_per_point_earned?: number
          fee_per_point_redeemed?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          fee_mode?: string
          fee_per_point_earned?: number
          fee_per_point_redeemed?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ganha_ganha_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      ganha_ganha_store_fees: {
        Row: {
          brand_id: string
          created_at: string
          fee_per_point_earned: number
          fee_per_point_redeemed: number
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          fee_per_point_earned?: number
          fee_per_point_redeemed?: number
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          fee_per_point_earned?: number
          fee_per_point_redeemed?: number
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ganha_ganha_store_fees_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_store_fees_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_store_fees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganha_ganha_store_fees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      home_template_apply_jobs: {
        Row: {
          created_at: string
          created_by: string
          finished_at: string | null
          id: string
          logs_json: Json
          overwrite: boolean
          scope_id: string | null
          scope_type: string
          status: string
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          finished_at?: string | null
          id?: string
          logs_json?: Json
          overwrite?: boolean
          scope_id?: string | null
          scope_type?: string
          status?: string
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          finished_at?: string | null
          id?: string
          logs_json?: Json
          overwrite?: boolean
          scope_id?: string | null
          scope_type?: string
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_template_apply_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "home_template_library"
            referencedColumns: ["id"]
          },
        ]
      }
      home_template_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          key: string
          name: string
          preview_image_url: string | null
          template_payload_json: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          key: string
          name: string
          preview_image_url?: string | null
          template_payload_json?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          key?: string
          name?: string
          preview_image_url?: string | null
          template_payload_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      icon_library: {
        Row: {
          brand_id: string | null
          category: string
          color: string | null
          created_at: string
          icon_type: string
          id: string
          image_url: string | null
          is_active: boolean
          lucide_name: string | null
          name: string
        }
        Insert: {
          brand_id?: string | null
          category?: string
          color?: string | null
          created_at?: string
          icon_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          lucide_name?: string | null
          name: string
        }
        Update: {
          brand_id?: string | null
          category?: string
          color?: string | null
          created_at?: string
          icon_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          lucide_name?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "icon_library_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_library_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string
          created_by: string
          error_rows_json: Json
          file_url: string | null
          finished_at: string | null
          id: string
          status: string
          summary_json: Json
          type: string
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string
          created_by: string
          error_rows_json?: Json
          file_url?: string | null
          finished_at?: string | null
          id?: string
          status?: string
          summary_json?: Json
          type?: string
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          created_by?: string
          error_rows_json?: Json
          file_url?: string | null
          finished_at?: string | null
          id?: string
          status?: string
          summary_json?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_integrations: {
        Row: {
          api_key: string
          basic_auth_password: string
          basic_auth_user: string
          branch_id: string | null
          brand_id: string
          callback_url: string | null
          created_at: string
          driver_customer_tag: string
          driver_message_enabled: boolean
          driver_message_frequency: string
          driver_message_frequency_value: number | null
          driver_points_enabled: boolean
          driver_points_mode: string
          driver_points_per_real: number
          driver_points_percent: number
          id: string
          is_active: boolean
          last_ride_processed_at: string | null
          last_webhook_at: string | null
          matrix_api_key: string | null
          matrix_basic_auth_password: string | null
          matrix_basic_auth_user: string | null
          preferred_endpoint: string
          receipt_api_key: string | null
          telegram_chat_id: string | null
          total_points: number
          total_rides: number
          updated_at: string
          webhook_registered: boolean
        }
        Insert: {
          api_key: string
          basic_auth_password?: string
          basic_auth_user?: string
          branch_id?: string | null
          brand_id: string
          callback_url?: string | null
          created_at?: string
          driver_customer_tag?: string
          driver_message_enabled?: boolean
          driver_message_frequency?: string
          driver_message_frequency_value?: number | null
          driver_points_enabled?: boolean
          driver_points_mode?: string
          driver_points_per_real?: number
          driver_points_percent?: number
          id?: string
          is_active?: boolean
          last_ride_processed_at?: string | null
          last_webhook_at?: string | null
          matrix_api_key?: string | null
          matrix_basic_auth_password?: string | null
          matrix_basic_auth_user?: string | null
          preferred_endpoint?: string
          receipt_api_key?: string | null
          telegram_chat_id?: string | null
          total_points?: number
          total_rides?: number
          updated_at?: string
          webhook_registered?: boolean
        }
        Update: {
          api_key?: string
          basic_auth_password?: string
          basic_auth_user?: string
          branch_id?: string | null
          brand_id?: string
          callback_url?: string | null
          created_at?: string
          driver_customer_tag?: string
          driver_message_enabled?: boolean
          driver_message_frequency?: string
          driver_message_frequency_value?: number | null
          driver_points_enabled?: boolean
          driver_points_mode?: string
          driver_points_per_real?: number
          driver_points_percent?: number
          id?: string
          is_active?: boolean
          last_ride_processed_at?: string | null
          last_webhook_at?: string | null
          matrix_api_key?: string | null
          matrix_basic_auth_password?: string | null
          matrix_basic_auth_user?: string | null
          preferred_endpoint?: string
          receipt_api_key?: string | null
          telegram_chat_id?: string | null
          total_points?: number
          total_rides?: number
          updated_at?: string
          webhook_registered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "machine_integrations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_integrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_integrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_ride_events: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          ip_address: string | null
          machine_ride_id: string
          raw_payload: Json
          status_code: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          machine_ride_id: string
          raw_payload?: Json
          status_code: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          machine_ride_id?: string
          raw_payload?: Json
          status_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_ride_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_ride_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_ride_notifications: {
        Row: {
          branch_id: string | null
          brand_id: string
          city_name: string | null
          created_at: string
          customer_cpf_masked: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          driver_name: string | null
          finalized_at: string
          id: string
          machine_ride_id: string
          notification_type: string
          points_credited: number
          ride_value: number
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          city_name?: string | null
          created_at?: string
          customer_cpf_masked?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          driver_name?: string | null
          finalized_at?: string
          id?: string
          machine_ride_id: string
          notification_type?: string
          points_credited?: number
          ride_value?: number
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          city_name?: string | null
          created_at?: string
          customer_cpf_masked?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          driver_name?: string | null
          finalized_at?: string
          id?: string
          machine_ride_id?: string
          notification_type?: string
          points_credited?: number
          ride_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_ride_notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_ride_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_ride_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_ride_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_ride_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_rides: {
        Row: {
          branch_id: string | null
          brand_id: string
          created_at: string
          driver_customer_id: string | null
          driver_id: string | null
          driver_name: string | null
          driver_points_credited: number
          finalized_at: string | null
          id: string
          machine_ride_id: string
          passenger_cpf: string | null
          passenger_email: string | null
          passenger_name: string | null
          passenger_phone: string | null
          points_credited: number
          ride_status: string
          ride_value: number
        }
        Insert: {
          branch_id?: string | null
          brand_id: string
          created_at?: string
          driver_customer_id?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_points_credited?: number
          finalized_at?: string | null
          id?: string
          machine_ride_id: string
          passenger_cpf?: string | null
          passenger_email?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          points_credited?: number
          ride_status?: string
          ride_value?: number
        }
        Update: {
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          driver_customer_id?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_points_credited?: number
          finalized_at?: string | null
          id?: string
          machine_ride_id?: string
          passenger_cpf?: string | null
          passenger_email?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          points_credited?: number
          ride_status?: string
          ride_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_rides_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_rides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_rides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_labels: {
        Row: {
          brand_id: string
          context: string
          created_at: string
          custom_label: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          context?: string
          created_at?: string
          custom_label: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          context?: string
          created_at?: string
          custom_label?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_labels_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_labels_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      mirror_sync_config: {
        Row: {
          auto_activate: boolean | null
          auto_sync_enabled: boolean | null
          auto_visible_driver: boolean | null
          brand_id: string
          created_at: string | null
          debug_mode: boolean | null
          extra_pages: string[] | null
          id: string
          max_offers_per_read: number | null
          max_pages: number | null
          origin_url: string
          source_type: string
          sync_interval_minutes: number | null
          timeout_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          auto_activate?: boolean | null
          auto_sync_enabled?: boolean | null
          auto_visible_driver?: boolean | null
          brand_id: string
          created_at?: string | null
          debug_mode?: boolean | null
          extra_pages?: string[] | null
          id?: string
          max_offers_per_read?: number | null
          max_pages?: number | null
          origin_url?: string
          source_type?: string
          sync_interval_minutes?: number | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_activate?: boolean | null
          auto_sync_enabled?: boolean | null
          auto_visible_driver?: boolean | null
          brand_id?: string
          created_at?: string | null
          debug_mode?: boolean | null
          extra_pages?: string[] | null
          id?: string
          max_offers_per_read?: number | null
          max_pages?: number | null
          origin_url?: string
          source_type?: string
          sync_interval_minutes?: number | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mirror_sync_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mirror_sync_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      mirror_sync_logs: {
        Row: {
          brand_id: string
          created_at: string | null
          details: Json | null
          finished_at: string | null
          id: string
          origin: string
          started_at: string
          status: string | null
          summary: string | null
          total_errors: number | null
          total_new: number | null
          total_read: number | null
          total_skipped: number | null
          total_updated: number | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          details?: Json | null
          finished_at?: string | null
          id?: string
          origin?: string
          started_at?: string
          status?: string | null
          summary?: string | null
          total_errors?: number | null
          total_new?: number | null
          total_read?: number | null
          total_skipped?: number | null
          total_updated?: number | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          details?: Json | null
          finished_at?: string | null
          id?: string
          origin?: string
          started_at?: string
          status?: string | null
          summary?: string | null
          total_errors?: number | null
          total_new?: number | null
          total_read?: number | null
          total_skipped?: number | null
          total_updated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mirror_sync_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mirror_sync_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      module_definitions: {
        Row: {
          category: string
          created_at: string
          customer_facing: boolean
          description: string | null
          id: string
          is_active: boolean
          is_core: boolean
          key: string
          name: string
          schema_json: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          customer_facing?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          is_core?: boolean
          key: string
          name: string
          schema_json?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_facing?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          is_core?: boolean
          key?: string
          name?: string
          schema_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      module_definitions_backup_pre_norm: {
        Row: {
          category: string | null
          created_at: string | null
          customer_facing: boolean | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_core: boolean | null
          key: string | null
          name: string | null
          schema_json: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          customer_facing?: boolean | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_core?: boolean | null
          key?: string | null
          name?: string | null
          schema_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          customer_facing?: boolean | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_core?: boolean | null
          key?: string | null
          name?: string | null
          schema_json?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      offer_reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          offer_id: string
          reason: string
          screenshot_url: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          offer_id: string
          reason: string
          screenshot_url?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          offer_id?: string
          reason?: string
          screenshot_url?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_reports_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_reports_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "public_affiliate_deals_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_sync_groups: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          last_sync_at: string | null
          last_sync_status: string
          source_group_id: string
          source_group_name: string | null
          source_system: string
          sync_version: number
          total_active: number
          total_imported: number
          total_removed: number
          total_reported: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string
          source_group_id: string
          source_group_name?: string | null
          source_system: string
          sync_version?: number
          total_active?: number
          total_imported?: number
          total_removed?: number
          total_reported?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string
          source_group_id?: string
          source_group_name?: string | null
          source_system?: string
          sync_version?: number
          total_active?: number
          total_imported?: number
          total_removed?: number
          total_reported?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_sync_groups_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_sync_groups_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          allowed_hours: string | null
          allowed_weekdays: number[] | null
          badge_config_json: Json | null
          branch_id: string
          brand_id: string
          coupon_category: string | null
          coupon_type: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          driver_only: boolean | null
          end_at: string | null
          id: string
          image_url: string | null
          interval_between_uses_days: number | null
          is_active: boolean
          is_cumulative: boolean | null
          likes_count: number
          max_daily_redemptions: number | null
          max_total_uses: number | null
          max_uses_per_customer: number | null
          min_purchase: number
          offer_purpose: Database["public"]["Enums"]["offer_purpose"]
          product_id: string | null
          redemption_branch_id: string | null
          redemption_type: string | null
          requires_scheduling: boolean | null
          scaled_values_json: Json | null
          scheduling_advance_hours: number | null
          specific_days_json: Json | null
          start_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          store_id: string
          terms_accepted_at: string | null
          terms_accepted_by_user_id: string | null
          terms_params_json: Json
          terms_text: string | null
          terms_version: string | null
          title: string
          updated_at: string
          value_rescue: number
        }
        Insert: {
          allowed_hours?: string | null
          allowed_weekdays?: number[] | null
          badge_config_json?: Json | null
          branch_id: string
          brand_id: string
          coupon_category?: string | null
          coupon_type?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          driver_only?: boolean | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          interval_between_uses_days?: number | null
          is_active?: boolean
          is_cumulative?: boolean | null
          likes_count?: number
          max_daily_redemptions?: number | null
          max_total_uses?: number | null
          max_uses_per_customer?: number | null
          min_purchase?: number
          offer_purpose?: Database["public"]["Enums"]["offer_purpose"]
          product_id?: string | null
          redemption_branch_id?: string | null
          redemption_type?: string | null
          requires_scheduling?: boolean | null
          scaled_values_json?: Json | null
          scheduling_advance_hours?: number | null
          specific_days_json?: Json | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          store_id: string
          terms_accepted_at?: string | null
          terms_accepted_by_user_id?: string | null
          terms_params_json?: Json
          terms_text?: string | null
          terms_version?: string | null
          title: string
          updated_at?: string
          value_rescue?: number
        }
        Update: {
          allowed_hours?: string | null
          allowed_weekdays?: number[] | null
          badge_config_json?: Json | null
          branch_id?: string
          brand_id?: string
          coupon_category?: string | null
          coupon_type?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          driver_only?: boolean | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          interval_between_uses_days?: number | null
          is_active?: boolean
          is_cumulative?: boolean | null
          likes_count?: number
          max_daily_redemptions?: number | null
          max_total_uses?: number | null
          max_uses_per_customer?: number | null
          min_purchase?: number
          offer_purpose?: Database["public"]["Enums"]["offer_purpose"]
          product_id?: string | null
          redemption_branch_id?: string | null
          redemption_type?: string | null
          requires_scheduling?: boolean | null
          scaled_values_json?: Json | null
          scheduling_advance_hours?: number | null
          specific_days_json?: Json | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          store_id?: string
          terms_accepted_at?: string | null
          terms_accepted_by_user_id?: string | null
          terms_params_json?: Json
          terms_text?: string | null
          terms_version?: string | null
          title?: string
          updated_at?: string
          value_rescue?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_redemption_branch_id_fkey"
            columns: ["redemption_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_landing_config: {
        Row: {
          benefits_json: Json
          brand_id: string
          created_at: string
          cta_button_text: string
          cta_link_url: string | null
          cta_subtitle: string
          cta_title: string
          faq_json: Json
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          how_it_works_json: Json
          id: string
          is_active: boolean
          logo_url: string | null
          numbers_json: Json
          social_email: string | null
          social_instagram: string | null
          social_whatsapp: string | null
          testimonials_json: Json | null
          updated_at: string
        }
        Insert: {
          benefits_json?: Json
          brand_id: string
          created_at?: string
          cta_button_text?: string
          cta_link_url?: string | null
          cta_subtitle?: string
          cta_title?: string
          faq_json?: Json
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          how_it_works_json?: Json
          id?: string
          is_active?: boolean
          logo_url?: string | null
          numbers_json?: Json
          social_email?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          testimonials_json?: Json | null
          updated_at?: string
        }
        Update: {
          benefits_json?: Json
          brand_id?: string
          created_at?: string
          cta_button_text?: string
          cta_link_url?: string | null
          cta_subtitle?: string
          cta_title?: string
          faq_json?: Json
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          how_it_works_json?: Json
          id?: string
          is_active?: boolean
          logo_url?: string | null
          numbers_json?: Json
          social_email?: string | null
          social_instagram?: string | null
          social_whatsapp?: string | null
          testimonials_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_landing_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_landing_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_groups: {
        Row: {
          created_at: string | null
          icon_name: string | null
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          created_at?: string | null
          icon_name?: string | null
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          created_at?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      permission_sub_items: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          key: string
          order_index: number | null
          permission_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          key: string
          order_index?: number | null
          permission_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          key?: string
          order_index?: number | null
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_sub_items_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_subgroups: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_subgroups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          key: string
          module: string
          order_index: number | null
          subgroup_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          module: string
          order_index?: number | null
          subgroup_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          module?: string
          order_index?: number | null
          subgroup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "permission_subgroups"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_business_models: {
        Row: {
          business_model_id: string
          created_at: string
          is_included: boolean
          plan_key: string
        }
        Insert: {
          business_model_id: string
          created_at?: string
          is_included?: boolean
          plan_key: string
        }
        Update: {
          business_model_id?: string
          created_at?: string
          is_included?: boolean
          plan_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_business_models_business_model_id_fkey"
            columns: ["business_model_id"]
            isOneToOne: false
            referencedRelation: "business_models"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_duelo_prize_ranges: {
        Row: {
          created_at: string
          id: string
          max_points: number
          min_points: number
          plan_key: string
          position: string
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_points: number
          min_points: number
          plan_key: string
          position: string
          tier_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_points?: number
          min_points?: number
          plan_key?: string
          position?: string
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_ganha_ganha_pricing: {
        Row: {
          created_at: string
          id: string
          max_margin_pct: number | null
          min_margin_pct: number | null
          plan_key: string
          price_per_point_cents: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_margin_pct?: number | null
          min_margin_pct?: number | null
          plan_key: string
          price_per_point_cents: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_margin_pct?: number | null
          min_margin_pct?: number | null
          plan_key?: string
          price_per_point_cents?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      plan_module_templates: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          module_definition_id: string
          plan_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_definition_id: string
          plan_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_definition_id?: string
          plan_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_module_templates_module_definition_id_fkey"
            columns: ["module_definition_id"]
            isOneToOne: false
            referencedRelation: "module_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          created_by_user_id: string | null
          customer_id: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          money_amount: number
          points_amount: number
          reason: string | null
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["ledger_reference_type"]
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          created_by_user_id?: string | null
          customer_id: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          money_amount?: number
          points_amount?: number
          reason?: string | null
          reference_id?: string | null
          reference_type: Database["public"]["Enums"]["ledger_reference_type"]
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          created_by_user_id?: string | null
          customer_id?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          money_amount?: number
          points_amount?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["ledger_reference_type"]
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      points_package_orders: {
        Row: {
          branch_id: string
          brand_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          package_id: string
          points_amount: number
          price_cents: number
          purchased_by: string | null
          status: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          package_id: string
          points_amount: number
          price_cents: number
          purchased_by?: string | null
          status?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          package_id?: string
          points_amount?: number
          price_cents?: number
          purchased_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_package_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_package_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_package_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_package_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "points_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      points_packages: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          points_amount: number
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_amount: number
          price_cents: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_amount?: number
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_packages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_packages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      points_rules: {
        Row: {
          allow_store_custom_rule: boolean
          branch_id: string | null
          brand_id: string
          created_at: string
          id: string
          is_active: boolean
          max_points_per_customer_per_day: number
          max_points_per_purchase: number
          max_points_per_store_per_day: number
          min_purchase_to_earn: number
          money_per_point: number
          points_per_real: number
          require_receipt_code: boolean
          rule_type: Database["public"]["Enums"]["points_rule_type"]
          store_points_per_real_max: number
          store_points_per_real_min: number
          store_rule_requires_approval: boolean
          updated_at: string
        }
        Insert: {
          allow_store_custom_rule?: boolean
          branch_id?: string | null
          brand_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_points_per_customer_per_day?: number
          max_points_per_purchase?: number
          max_points_per_store_per_day?: number
          min_purchase_to_earn?: number
          money_per_point?: number
          points_per_real?: number
          require_receipt_code?: boolean
          rule_type?: Database["public"]["Enums"]["points_rule_type"]
          store_points_per_real_max?: number
          store_points_per_real_min?: number
          store_rule_requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          allow_store_custom_rule?: boolean
          branch_id?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_points_per_customer_per_day?: number
          max_points_per_purchase?: number
          max_points_per_store_per_day?: number
          min_purchase_to_earn?: number
          money_per_point?: number
          points_per_real?: number
          require_receipt_code?: boolean
          rule_type?: Database["public"]["Enums"]["points_rule_type"]
          store_points_per_real_max?: number
          store_points_per_real_min?: number
          store_rule_requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_rules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      product_redemption_orders: {
        Row: {
          admin_notes: string | null
          affiliate_url: string
          branch_id: string | null
          brand_id: string
          created_at: string | null
          customer_cpf: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          deal_id: string
          deal_snapshot_json: Json
          delivery_address: string
          delivery_cep: string
          delivery_city: string
          delivery_complement: string | null
          delivery_neighborhood: string
          delivery_number: string
          delivery_state: string
          id: string
          order_source: string
          points_spent: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_url: string
          branch_id?: string | null
          brand_id: string
          created_at?: string | null
          customer_cpf?: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          deal_id: string
          deal_snapshot_json?: Json
          delivery_address: string
          delivery_cep: string
          delivery_city: string
          delivery_complement?: string | null
          delivery_neighborhood: string
          delivery_number: string
          delivery_state: string
          id?: string
          order_source?: string
          points_spent: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_url?: string
          branch_id?: string | null
          brand_id?: string
          created_at?: string | null
          customer_cpf?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          deal_id?: string
          deal_snapshot_json?: Json
          delivery_address?: string
          delivery_cep?: string
          delivery_city?: string
          delivery_complement?: string | null
          delivery_neighborhood?: string
          delivery_number?: string
          delivery_state?: string
          id?: string
          order_source?: string
          points_spent?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_redemption_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_redemption_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_redemption_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_redemption_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_redemption_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_redemption_orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_redemption_orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "public_affiliate_deals_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          brand_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          selected_branch_id: string | null
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          selected_branch_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          selected_branch_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_selected_branch_id_fkey"
            columns: ["selected_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          customer_id: string
          endpoint: string
          id: string
          keys_json: Json
        }
        Insert: {
          created_at?: string
          customer_id: string
          endpoint: string
          id?: string
          keys_json?: Json
        }
        Update: {
          created_at?: string
          customer_id?: string
          endpoint?: string
          id?: string
          keys_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_entries: {
        Row: {
          id: string
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          id?: string
          key: string
          request_count?: number
          window_start?: string
        }
        Update: {
          id?: string
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          credit_value_applied: number | null
          customer_cpf: string | null
          customer_id: string
          expires_at: string | null
          id: string
          offer_id: string
          offer_snapshot_json: Json | null
          purchase_value: number | null
          qr_data: string | null
          status: Database["public"]["Enums"]["redemption_status"]
          token: string
          used_at: string | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          credit_value_applied?: number | null
          customer_cpf?: string | null
          customer_id: string
          expires_at?: string | null
          id?: string
          offer_id: string
          offer_snapshot_json?: Json | null
          purchase_value?: number | null
          qr_data?: string | null
          status?: Database["public"]["Enums"]["redemption_status"]
          token?: string
          used_at?: string | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          credit_value_applied?: number | null
          customer_cpf?: string | null
          customer_id?: string
          expires_at?: string | null
          id?: string
          offer_id?: string
          offer_snapshot_json?: Json | null
          purchase_value?: number | null
          qr_data?: string | null
          status?: Database["public"]["Enums"]["redemption_status"]
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          payload_json: Json
          title: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payload_json?: Json
          title: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payload_json?: Json
          title?: string
          version?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      section_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          name: string
          schema_json: Json
          type: Database["public"]["Enums"]["section_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          schema_json?: Json
          type: Database["public"]["Enums"]["section_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          schema_json?: Json
          type?: Database["public"]["Enums"]["section_type"]
        }
        Relationships: []
      }
      segment_synonym_logs: {
        Row: {
          created_at: string
          free_text: string
          id: string
          match_method: string | null
          match_score: number
          matched_segment_id: string | null
          normalized_text: string
          store_id: string | null
          was_accepted: boolean
        }
        Insert: {
          created_at?: string
          free_text: string
          id?: string
          match_method?: string | null
          match_score?: number
          matched_segment_id?: string | null
          normalized_text: string
          store_id?: string | null
          was_accepted?: boolean
        }
        Update: {
          created_at?: string
          free_text?: string
          id?: string
          match_method?: string | null
          match_score?: number
          matched_segment_id?: string | null
          normalized_text?: string
          store_id?: string | null
          was_accepted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "segment_synonym_logs_matched_segment_id_fkey"
            columns: ["matched_segment_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_placements: {
        Row: {
          brand_id: string
          created_at: string | null
          created_by: string | null
          ends_at: string
          id: string
          is_active: boolean
          notes: string | null
          placement_type: string
          priority: number
          starts_at: string
          store_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          notes?: string | null
          placement_type?: string
          priority?: number
          starts_at?: string
          store_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          placement_type?: string
          priority?: number
          starts_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_placements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_placements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_placements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_placements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_catalog_categories: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          store_id: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          store_id: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_catalog_categories_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_catalog_items: {
        Row: {
          allow_half: boolean
          branch_id: string
          brand_id: string
          category: string | null
          created_at: string
          description: string | null
          half_price: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          price: number
          store_id: string
          updated_at: string
        }
        Insert: {
          allow_half?: boolean
          branch_id: string
          brand_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          half_price?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          price?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          allow_half?: boolean
          branch_id?: string
          brand_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          half_price?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          price?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_catalog_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_catalog_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_documents: {
        Row: {
          document_type: string
          file_name: string | null
          file_url: string
          id: string
          store_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name?: string | null
          file_url: string
          id?: string
          store_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          store_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_employees: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          id: string
          invited_at: string | null
          is_active: boolean
          name: string
          phone: string | null
          role: string
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_employees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_employees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_points_rules: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          branch_id: string
          brand_id: string
          created_at: string
          created_by_user_id: string
          ends_at: string | null
          id: string
          is_active: boolean
          points_per_real: number
          starts_at: string | null
          status: Database["public"]["Enums"]["store_rule_status"]
          store_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          branch_id: string
          brand_id: string
          created_at?: string
          created_by_user_id: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          points_per_real?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["store_rule_status"]
          store_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          branch_id?: string
          brand_id?: string
          created_at?: string
          created_by_user_id?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          points_per_real?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["store_rule_status"]
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_points_rules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_points_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_points_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          store_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_approved: boolean
          rating: number
          store_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_approved?: boolean
          rating: number
          store_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_approved?: boolean
          rating?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_type_requests: {
        Row: {
          brand_id: string
          current_type: string
          id: string
          reason: string | null
          rejection_reason: string | null
          requested_at: string
          requested_type: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          store_id: string
        }
        Insert: {
          brand_id: string
          current_type: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          store_id: string
        }
        Update: {
          brand_id?: string
          current_type?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_type_requests_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_type_requests_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_type_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "public_stores_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_type_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          approval_status: Database["public"]["Enums"]["store_approval_status"]
          approved_at: string | null
          banner_url: string | null
          branch_id: string
          brand_id: string
          category: string | null
          cnpj: string | null
          created_at: string
          description: string | null
          email: string | null
          faq_json: Json
          gallery_urls: string[] | null
          id: string
          instagram: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          operating_hours_json: Json | null
          owner_user_id: string | null
          phone: string | null
          points_deadline_text: string | null
          points_per_real: number | null
          points_rule_text: string | null
          rejection_reason: string | null
          segment: string | null
          site_url: string | null
          slug: string
          store_catalog_config_json: Json | null
          store_type: Database["public"]["Enums"]["store_type"]
          submitted_at: string | null
          tags: string[] | null
          taxonomy_segment_id: string | null
          updated_at: string
          video_url: string | null
          whatsapp: string | null
          wizard_data_json: Json | null
          wizard_step: number | null
        }
        Insert: {
          address?: string | null
          approval_status?: Database["public"]["Enums"]["store_approval_status"]
          approved_at?: string | null
          banner_url?: string | null
          branch_id: string
          brand_id: string
          category?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          faq_json?: Json
          gallery_urls?: string[] | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          operating_hours_json?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          points_deadline_text?: string | null
          points_per_real?: number | null
          points_rule_text?: string | null
          rejection_reason?: string | null
          segment?: string | null
          site_url?: string | null
          slug: string
          store_catalog_config_json?: Json | null
          store_type?: Database["public"]["Enums"]["store_type"]
          submitted_at?: string | null
          tags?: string[] | null
          taxonomy_segment_id?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
          wizard_data_json?: Json | null
          wizard_step?: number | null
        }
        Update: {
          address?: string | null
          approval_status?: Database["public"]["Enums"]["store_approval_status"]
          approved_at?: string | null
          banner_url?: string | null
          branch_id?: string
          brand_id?: string
          category?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          faq_json?: Json
          gallery_urls?: string[] | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          operating_hours_json?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          points_deadline_text?: string | null
          points_per_real?: number | null
          points_rule_text?: string | null
          rejection_reason?: string | null
          segment?: string | null
          site_url?: string | null
          slug?: string
          store_catalog_config_json?: Json | null
          store_type?: Database["public"]["Enums"]["store_type"]
          submitted_at?: string | null
          tags?: string[] | null
          taxonomy_segment_id?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
          wizard_data_json?: Json | null
          wizard_step?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_taxonomy_segment_id_fkey"
            columns: ["taxonomy_segment_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          excluded_features: string[] | null
          features: string[] | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          is_public_listed: boolean
          label: string
          landing_config_json: Json
          plan_key: string
          price_cents: number
          price_yearly_cents: number | null
          product_name: string | null
          slug: string
          sort_order: number | null
          trial_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          excluded_features?: string[] | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_public_listed?: boolean
          label: string
          landing_config_json?: Json
          plan_key: string
          price_cents: number
          price_yearly_cents?: number | null
          product_name?: string | null
          slug: string
          sort_order?: number | null
          trial_days?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          excluded_features?: string[] | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_public_listed?: boolean
          label?: string
          landing_config_json?: Json
          plan_key?: string
          price_cents?: number
          price_yearly_cents?: number | null
          product_name?: string | null
          slug?: string
          sort_order?: number | null
          trial_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      taxonomy_categories: {
        Row: {
          created_at: string
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_segments: {
        Row: {
          aliases: string[]
          category_id: string
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          order_index: number
          related_segment_ids: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          category_id: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          name: string
          order_index?: number
          related_segment_ids?: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          category_id?: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          name?: string
          order_index?: number
          related_segment_ids?: string[]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_segments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          plan: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plan?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan?: string
          slug?: string
        }
        Relationships: []
      }
      tier_points_rules: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          points_per_real: number
          tier: string
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          points_per_real?: number
          tier: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          points_per_real?: number
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_points_rules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_points_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          permission_key: string
          scope_id: string | null
          scope_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key: string
          scope_id?: string | null
          scope_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_redemptions: {
        Row: {
          id: string
          notes: string | null
          redeemed_at: string
          redeemed_by: string
          voucher_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          redeemed_at?: string
          redeemed_by: string
          voucher_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          redeemed_at?: string
          redeemed_by?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          bg_color: string | null
          branch_id: string
          campaign: string | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          discount_fixed_value: number
          discount_percent: number
          discount_type: string
          expires_at: string | null
          id: string
          is_public: boolean
          max_uses: number
          max_uses_per_customer: number
          min_purchase: number
          redirect_url: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["voucher_status"]
          target_audience: string
          terms: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          branch_id: string
          campaign?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          discount_fixed_value?: number
          discount_percent: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          max_uses?: number
          max_uses_per_customer?: number
          min_purchase?: number
          redirect_url?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["voucher_status"]
          target_audience?: string
          terms?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          branch_id?: string
          campaign?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          discount_fixed_value?: number
          discount_percent?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          max_uses?: number
          max_uses_per_customer?: number
          min_purchase?: number
          redirect_url?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["voucher_status"]
          target_audience?: string
          terms?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_logs_safe: {
        Row: {
          action: string | null
          actor_user_id: string | null
          changes_json: Json | null
          created_at: string | null
          details_json: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          scope_id: string | null
          scope_type: string | null
        }
        Insert: {
          action?: string | null
          actor_user_id?: string | null
          changes_json?: Json | null
          created_at?: string | null
          details_json?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          scope_id?: string | null
          scope_type?: string | null
        }
        Update: {
          action?: string | null
          actor_user_id?: string | null
          changes_json?: Json | null
          created_at?: string | null
          details_json?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          scope_id?: string | null
          scope_type?: string | null
        }
        Relationships: []
      }
      brand_api_keys_safe: {
        Row: {
          api_key_prefix: string | null
          brand_id: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          is_active: boolean | null
          label: string | null
          last_used_at: string | null
        }
        Insert: {
          api_key_prefix?: string | null
          brand_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
        }
        Update: {
          api_key_prefix?: string | null
          brand_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_api_keys_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_api_keys_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts_safe: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          cpf_masked: string | null
          created_at: string | null
          customer_id: string | null
          email_masked: string | null
          external_id: string | null
          first_ride_at: string | null
          gender: string | null
          id: string | null
          is_active: boolean | null
          last_ride_at: string | null
          name: string | null
          os_platform: string | null
          phone_masked: string | null
          ride_count: number | null
          source: string | null
          tags_json: Json | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          cpf_masked?: never
          created_at?: string | null
          customer_id?: string | null
          email_masked?: never
          external_id?: string | null
          first_ride_at?: string | null
          gender?: string | null
          id?: string | null
          is_active?: boolean | null
          last_ride_at?: string | null
          name?: string | null
          os_platform?: string | null
          phone_masked?: never
          ride_count?: number | null
          source?: string | null
          tags_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          cpf_masked?: never
          created_at?: string | null
          customer_id?: string | null
          email_masked?: never
          external_id?: string | null
          first_ride_at?: string | null
          gender?: string | null
          id?: string | null
          is_active?: boolean | null
          last_ride_at?: string | null
          name?: string | null
          os_platform?: string | null
          phone_masked?: never
          ride_count?: number | null
          source?: string | null
          tags_json?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      customers_safe: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          created_at: string | null
          crm_sync_status: string | null
          customer_tier: string | null
          id: string | null
          is_active: boolean | null
          money_balance: number | null
          name: string | null
          phone_masked: string | null
          points_balance: number | null
          ride_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          crm_sync_status?: string | null
          customer_tier?: string | null
          id?: string | null
          is_active?: boolean | null
          money_balance?: number | null
          name?: string | null
          phone_masked?: never
          points_balance?: number | null
          ride_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          crm_sync_status?: string | null
          customer_tier?: string | null
          id?: string | null
          is_active?: boolean | null
          money_balance?: number | null
          name?: string | null
          phone_masked?: never
          points_balance?: number | null
          ride_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_safe: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          brand_id: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          selected_branch_id: string | null
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          selected_branch_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          selected_branch_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_selected_branch_id_fkey"
            columns: ["selected_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_affiliate_deals_safe: {
        Row: {
          affiliate_url: string | null
          badge_label: string | null
          branch_id: string | null
          brand_id: string | null
          category: string | null
          category_id: string | null
          click_count: number | null
          created_at: string | null
          current_status: string | null
          custom_points_per_real: number | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_flash_promo: boolean | null
          is_redeemable: boolean | null
          marketplace: string | null
          order_index: number | null
          original_price: number | null
          price: number | null
          redeem_points_cost: number | null
          redeemable_by: string | null
          source_group_id: string | null
          source_group_name: string | null
          store_logo_url: string | null
          store_name: string | null
          title: string | null
          updated_at: string | null
          visible_driver: boolean | null
        }
        Insert: {
          affiliate_url?: string | null
          badge_label?: string | null
          branch_id?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          click_count?: number | null
          created_at?: string | null
          current_status?: string | null
          custom_points_per_real?: number | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_flash_promo?: boolean | null
          is_redeemable?: boolean | null
          marketplace?: string | null
          order_index?: number | null
          original_price?: number | null
          price?: number | null
          redeem_points_cost?: number | null
          redeemable_by?: string | null
          source_group_id?: string | null
          source_group_name?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          title?: string | null
          updated_at?: string | null
          visible_driver?: boolean | null
        }
        Update: {
          affiliate_url?: string | null
          badge_label?: string | null
          branch_id?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          click_count?: number | null
          created_at?: string | null
          current_status?: string | null
          custom_points_per_real?: number | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_flash_promo?: boolean | null
          is_redeemable?: boolean | null
          marketplace?: string | null
          order_index?: number | null
          original_price?: number | null
          price?: number | null
          redeem_points_cost?: number | null
          redeemable_by?: string | null
          source_group_id?: string | null
          source_group_name?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          title?: string | null
          updated_at?: string | null
          visible_driver?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_deals_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_deals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      public_brand_modules_safe: {
        Row: {
          brand_id: string | null
          config_json: Json | null
          created_at: string | null
          id: string | null
          is_enabled: boolean | null
          module_definition_id: string | null
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          config_json?: Json | null
          created_at?: string | null
          id?: string | null
          is_enabled?: boolean | null
          module_definition_id?: string | null
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          config_json?: Json | null
          created_at?: string | null
          id?: string | null
          is_enabled?: boolean | null
          module_definition_id?: string | null
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_modules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_modules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_modules_module_definition_id_fkey"
            columns: ["module_definition_id"]
            isOneToOne: false
            referencedRelation: "module_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      public_brands_safe: {
        Row: {
          brand_settings_json: Json | null
          created_at: string | null
          default_theme_id: string | null
          home_layout_json: Json | null
          id: string | null
          is_active: boolean | null
          name: string | null
          slug: string | null
          subscription_plan: string | null
          subscription_status: string | null
          tenant_id: string | null
          trial_expires_at: string | null
        }
        Insert: {
          brand_settings_json?: Json | null
          created_at?: string | null
          default_theme_id?: string | null
          home_layout_json?: Json | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tenant_id?: string | null
          trial_expires_at?: string | null
        }
        Update: {
          brand_settings_json?: Json | null
          created_at?: string | null
          default_theme_id?: string | null
          home_layout_json?: Json | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tenant_id?: string | null
          trial_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_stores_safe: {
        Row: {
          address: string | null
          approval_status:
            | Database["public"]["Enums"]["store_approval_status"]
            | null
          banner_url: string | null
          branch_id: string | null
          brand_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          phone: string | null
          segment: string | null
          slug: string | null
          store_type: Database["public"]["Enums"]["store_type"] | null
          tags: string[] | null
        }
        Insert: {
          address?: string | null
          approval_status?:
            | Database["public"]["Enums"]["store_approval_status"]
            | null
          banner_url?: string | null
          branch_id?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          segment?: string | null
          slug?: string | null
          store_type?: Database["public"]["Enums"]["store_type"] | null
          tags?: string[] | null
        }
        Update: {
          address?: string | null
          approval_status?:
            | Database["public"]["Enums"]["store_approval_status"]
            | null
          banner_url?: string | null
          branch_id?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          segment?: string | null
          slug?: string | null
          store_type?: Database["public"]["Enums"]["store_type"] | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions_safe: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          created_at: string | null
          credit_value_applied: number | null
          customer_id: string | null
          expires_at: string | null
          id: string | null
          offer_id: string | null
          offer_snapshot_json: Json | null
          purchase_value: number | null
          status: Database["public"]["Enums"]["redemption_status"] | null
          token: string | null
          used_at: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          credit_value_applied?: number | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string | null
          offer_id?: string | null
          offer_snapshot_json?: Json | null
          purchase_value?: number | null
          status?: Database["public"]["Enums"]["redemption_status"] | null
          token?: string | null
          used_at?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          credit_value_applied?: number | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string | null
          offer_id?: string | null
          offer_snapshot_json?: Json | null
          purchase_value?: number | null
          status?: Database["public"]["Enums"]["redemption_status"] | null
          token?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_brands_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _duelo_log_attempt: {
        Args: {
          p_actor: string
          p_branch_id: string
          p_brand_id: string
          p_code: string
          p_details: Json
          p_divergent_count: number
          p_divergent_sample: Json
          p_eligible_count: number
          p_outcome: string
          p_reason: string
          p_required_count: number
          p_season_id: string
        }
        Returns: undefined
      }
      accept_side_bet: {
        Args: { p_bet_id: string; p_customer_id: string }
        Returns: Json
      }
      admin_boost_duel: {
        Args: { p_amount: number; p_branch_id: string; p_duel_id: string }
        Returns: Json
      }
      admin_create_bulk_duels: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_end_at: string
          p_pairs: Json
          p_prize_points_per_pair?: number
          p_sponsored?: boolean
          p_start_at: string
        }
        Returns: Json
      }
      admin_create_duel: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_challenged_customer_id: string
          p_challenger_customer_id: string
          p_end_at: string
          p_prize_points?: number
          p_start_at: string
        }
        Returns: Json
      }
      assign_city_belt_manual: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_customer_id: string
          p_prize_points?: number
          p_record_value: number
        }
        Returns: Json
      }
      collect_duel_ride_ids: {
        Args: {
          p_branch_id: string
          p_customer_id: string
          p_end_at: string
          p_start_at: string
        }
        Returns: string[]
      }
      confirm_driver_points_order: {
        Args: { p_confirmed_by: string; p_order_id: string }
        Returns: Json
      }
      confirm_package_order: {
        Args: { p_confirmed_by: string; p_order_id: string }
        Returns: Json
      }
      count_duel_rides: {
        Args: {
          p_branch_id: string
          p_customer_id: string
          p_end_at: string
          p_start_at: string
        }
        Returns: number
      }
      counter_propose_duel: {
        Args: {
          p_counter_points: number
          p_customer_id: string
          p_duel_id: string
        }
        Returns: Json
      }
      counter_propose_side_bet: {
        Args: {
          p_bet_id: string
          p_counter_points: number
          p_customer_id: string
        }
        Returns: Json
      }
      create_duel_challenge:
        | {
            Args: {
              p_branch_id: string
              p_brand_id: string
              p_challenged_customer_id: string
              p_challenger_customer_id: string
              p_end_at: string
              p_start_at: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_branch_id: string
              p_brand_id: string
              p_challenged_customer_id: string
              p_challenger_customer_id: string
              p_end_at: string
              p_points_bet?: number
              p_start_at: string
            }
            Returns: Json
          }
      create_side_bet: {
        Args: {
          p_customer_id: string
          p_duel_id: string
          p_points: number
          p_predicted_winner_participant_id: string
        }
        Returns: Json
      }
      credit_customer_points: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_customer_id: string
          p_money?: number
          p_points: number
          p_reason?: string
          p_reference_type?: string
        }
        Returns: undefined
      }
      debit_branch_wallet: {
        Args: { p_amount: number; p_branch_id: string; p_description?: string }
        Returns: Json
      }
      duelo_backfill_standings: { Args: { p_season_id: string }; Returns: Json }
      duelo_gerar_chaveamento: { Args: { p_season_id: string }; Returns: Json }
      duelo_reconcile_standings: { Args: { p_hours?: number }; Returns: Json }
      duelo_seed_initial_tier_memberships: {
        Args: { p_season_id: string }
        Returns: Json
      }
      finalize_duel: { Args: { p_duel_id: string }; Returns: Json }
      get_branch_dashboard_stats: {
        Args: { p_branch_id: string }
        Returns: {
          total_drivers: number
          total_points_distributed: number
          total_redemptions: number
          total_rides: number
          wallet_balance: number
        }[]
      }
      get_branch_dashboard_stats_v2: {
        Args: { p_branch_id: string }
        Returns: Json
      }
      get_branch_passenger_stats: {
        Args: { p_branch_id: string }
        Returns: Json
      }
      get_branch_points_ranking: {
        Args: { p_branch_id: string; p_limit?: number }
        Returns: {
          participant_name: string
          participant_type: string
          total_points: number
        }[]
      }
      get_city_belt_champion: {
        Args: { p_branch_id: string }
        Returns: {
          achieved_at: string
          assigned_manually: boolean
          belt_prize_points: number
          branch_id: string
          champion_avatar_url: string
          champion_customer_id: string
          champion_name: string
          champion_nickname: string
          id: string
          record_type: string
          record_value: number
        }[]
      }
      get_city_driver_ranking: {
        Args: { p_branch_id: string; p_limit?: number }
        Returns: {
          customer_id: string
          driver_name: string
          rank_position: number
          total_rides: number
        }[]
      }
      get_customer_ids_for_store_owner: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_dashboard_kpis: {
        Args: {
          p_brand_id?: string
          p_month_start?: string
          p_period_start?: string
        }
        Returns: Json
      }
      get_driver_city_position: {
        Args: { p_branch_id: string; p_customer_id: string }
        Returns: {
          rank_position: number
          total_rides: number
        }[]
      }
      get_driver_competitive_profile: {
        Args: { p_customer_id: string }
        Returns: Json
      }
      get_driver_ledger: {
        Args: { p_customer_id: string }
        Returns: {
          branch_name: string
          created_at: string
          entry_type: string
          id: string
          money_amount: number
          points_amount: number
          reason: string
          reference_type: string
        }[]
      }
      get_driver_reputation: { Args: { p_customer_id: string }; Returns: Json }
      get_driver_ride_stats: {
        Args: { p_brand_id: string; p_customer_ids: string[] }
        Returns: {
          customer_id: string
          total_ride_points: number
          total_rides: number
        }[]
      }
      get_duel_guesses_summary: {
        Args: { p_duel_id: string }
        Returns: {
          guess_count: number
          participant_id: string
        }[]
      }
      get_duel_match_suggestions: {
        Args: {
          p_branch_id: string
          p_limit?: number
          p_volume_tolerance?: number
        }
        Returns: Json
      }
      get_own_customer_ids: { Args: { _user_id: string }; Returns: string[] }
      get_points_ranking: {
        Args: { p_brand_id: string; p_limit?: number }
        Returns: {
          participant_name: string
          participant_type: string
          total_points: number
        }[]
      }
      get_points_summary: {
        Args: { p_brand_id: string }
        Returns: {
          client_points_total: number
          driver_points_total: number
        }[]
      }
      get_recommended_offers: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_customer_id?: string
          p_limit?: number
        }
        Returns: {
          offer_id: string
          score: number
        }[]
      }
      get_rides_report_by_branch: {
        Args: { p_brand_id: string }
        Returns: {
          branch_city: string
          branch_id: string
          branch_name: string
          branch_state: string
          rides_current_month: number
          rides_prev_month: number
          total_client_points: number
          total_driver_points: number
          total_drivers: number
          total_ride_value: number
          total_rides: number
        }[]
      }
      get_side_bet_ranking: {
        Args: { p_branch_id: string; p_limit?: number }
        Returns: {
          bets_lost: number
          bets_won: number
          bettor_name: string
          customer_id: string
          net_points: number
          points_lost: number
          points_won: number
          rank_position: number
          total_bets: number
          win_rate: number
        }[]
      }
      get_user_branch_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_brand_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_tenant_ids: { Args: { _user_id: string }; Returns: string[] }
      grant_achievement: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_customer_id: string
          p_icon?: string
          p_key: string
          p_label: string
          p_metadata?: Json
        }
        Returns: boolean
      }
      grant_duel_achievements: {
        Args: { p_duel_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_branch_drivers_for_duels: {
        Args: { p_branch_id: string; p_exclude_customer_id: string }
        Returns: {
          avatar_url: string
          customer_id: string
          display_name: string
          is_enrolled: boolean
          public_nickname: string
        }[]
      }
      list_business_model_addons: {
        Args: never
        Returns: {
          activated_at: string
          billing_cycle: string
          branch_id: string
          branch_name: string
          brand_id: string
          brand_name: string
          brand_slug: string
          business_model_id: string
          created_at: string
          expires_at: string
          id: string
          model_audience: string
          model_key: string
          model_name: string
          notes: string
          price_cents: number
          status: string
          subscription_plan: string
        }[]
      }
      lookup_driver_by_cpf: {
        Args: { p_brand_id: string; p_cpf: string }
        Returns: {
          branch_id: string
          branch_name: string
          brand_id: string
          cpf: string
          email: string
          id: string
          money_balance: number
          name: string
          phone: string
          points_balance: number
        }[]
      }
      lookup_driver_by_id: {
        Args: { p_brand_id: string; p_customer_id: string }
        Returns: {
          branch_id: string
          branch_name: string
          brand_id: string
          cpf: string
          email: string
          id: string
          money_balance: number
          name: string
          phone: string
          points_balance: number
        }[]
      }
      process_product_redemption: {
        Args: {
          p_address: string
          p_affiliate_url: string
          p_branch_id: string
          p_brand_id: string
          p_cep: string
          p_city: string
          p_complement: string
          p_cpf: string
          p_customer_id: string
          p_deal_id: string
          p_deal_snapshot: Json
          p_name: string
          p_neighborhood: string
          p_number: string
          p_order_source: string
          p_phone: string
          p_points_cost: number
          p_state: string
        }
        Returns: string
      }
      rate_limit_cleanup: { Args: never; Returns: undefined }
      redeem_city_offer_driver: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_customer_cpf?: string
          p_customer_id: string
          p_offer_id: string
        }
        Returns: Json
      }
      redeem_prize_campaign: {
        Args: { p_campaign_id: string; p_customer_id: string }
        Returns: Json
      }
      reprocess_missing_driver_points: {
        Args: { p_branch_id: string }
        Returns: Json
      }
      resolve_active_business_models: {
        Args: { p_branch_id?: string; p_brand_id: string }
        Returns: {
          is_enabled: boolean
          model_key: string
          source: string
        }[]
      }
      resolve_active_modules: {
        Args: { p_branch_id?: string; p_brand_id: string }
        Returns: {
          is_enabled: boolean
          module_key: string
          source: string
        }[]
      }
      respond_counter_proposal: {
        Args: { p_accept: boolean; p_customer_id: string; p_duel_id: string }
        Returns: Json
      }
      respond_side_bet_counter: {
        Args: { p_accept: boolean; p_bet_id: string; p_customer_id: string }
        Returns: Json
      }
      respond_to_duel: {
        Args: { p_accept: boolean; p_customer_id: string; p_duel_id: string }
        Returns: Json
      }
      rpc_get_driver_city_redemptions: {
        Args: { p_customer_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          min_purchase: number
          offer_title: string
          status: string
          store_logo_url: string
          store_name: string
          token: string
          used_at: string
          value_rescue: number
        }[]
      }
      rpc_get_store_owner_redemptions: {
        Args: { p_page?: number; p_page_size?: number; p_store_id: string }
        Returns: {
          branch_name: string
          coupon_type: string
          created_at: string
          credit_value_applied: number
          customer_cpf: string
          customer_name: string
          customer_phone: string
          expires_at: string
          id: string
          min_purchase: number
          offer_end_at: string
          offer_title: string
          purchase_value: number
          status: string
          token: string
          used_at: string
          value_rescue: number
        }[]
      }
      rpc_gg_report_by_branch: {
        Args: {
          p_brand_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          branch_city: string
          branch_id: string
          branch_name: string
          branch_state: string
          n_stores: number
          total_fee: number
          total_pts: number
        }[]
      }
      rpc_gg_report_by_month: {
        Args: { p_brand_id: string; p_year: number }
        Returns: {
          earn_fee: number
          earn_pts: number
          month: string
          n_events: number
          redeem_fee: number
          redeem_pts: number
          total_fee: number
        }[]
      }
      rpc_gg_report_by_store: {
        Args: {
          p_branch_id?: string
          p_brand_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          branch_id: string
          earn_fee: number
          earn_pts: number
          redeem_fee: number
          redeem_pts: number
          store_id: string
          store_name: string
          total_fee: number
        }[]
      }
      rpc_gg_report_summary: {
        Args: {
          p_branch_id?: string
          p_brand_id: string
          p_period_end: string
          p_period_start: string
          p_store_id?: string
        }
        Returns: {
          n_events: number
          n_stores: number
          total_earn_fee: number
          total_earn_pts: number
          total_fee: number
          total_redeem_fee: number
          total_redeem_pts: number
        }[]
      }
      seed_affiliate_categories: {
        Args: { p_brand_id: string }
        Returns: undefined
      }
      settle_side_bets: {
        Args: { p_duel_id: string; p_winner_participant_id: string }
        Returns: Json
      }
      toggle_duel_participation: {
        Args: {
          p_branch_id: string
          p_brand_id: string
          p_customer_id: string
          p_enabled: boolean
        }
        Returns: Json
      }
      update_city_belt: {
        Args: { p_branch_id: string; p_brand_id: string }
        Returns: Json
      }
      update_ganha_ganha_pricing: {
        Args: {
          p_max_margin_pct?: number
          p_min_margin_pct?: number
          p_plan_key: string
          p_price_cents: number
        }
        Returns: string
      }
      user_has_permission: {
        Args: {
          _permission_key: string
          _scope_id?: string
          _scope_type?: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "root_admin"
        | "tenant_admin"
        | "brand_admin"
        | "branch_admin"
        | "branch_operator"
        | "operator_pdv"
        | "store_admin"
        | "customer"
      earning_source: "STORE" | "PDV" | "ADMIN" | "IMPORT" | "API"
      earning_status: "APPROVED" | "REJECTED"
      ledger_entry_type: "CREDIT" | "DEBIT" | "PRIZE_REDEEM" | "CYCLE_BONUS"
      ledger_reference_type:
        | "EARNING_EVENT"
        | "REDEMPTION"
        | "MANUAL_ADJUSTMENT"
        | "MACHINE_RIDE"
        | "DUEL_RESERVE"
        | "DUEL_WIN"
        | "DUEL_REFUND"
        | "DRIVER_RIDE"
        | "SIDE_BET_RESERVE"
        | "SIDE_BET_WIN"
        | "SIDE_BET_REFUND"
        | "SIDE_BET_DUEL_BONUS"
        | "BELT_PRIZE"
        | "DUEL_SETTLEMENT"
        | "BRANCH_RESET"
        | "PRIZE_CAMPAIGN"
        | "CYCLE_RESET"
      offer_purpose: "EARN" | "REDEEM" | "BOTH"
      offer_status: "DRAFT" | "PENDING" | "APPROVED" | "ACTIVE" | "EXPIRED"
      points_rule_type: "PER_REAL" | "FIXED" | "TIERED"
      redemption_status: "PENDING" | "USED" | "EXPIRED" | "CANCELED"
      section_source_type:
        | "OFFERS"
        | "STORES"
        | "CATEGORIES"
        | "CUSTOM_QUERY"
        | "MANUAL"
      section_type:
        | "BANNER_CAROUSEL"
        | "OFFERS_CAROUSEL"
        | "OFFERS_GRID"
        | "STORES_GRID"
        | "STORES_LIST"
        | "VOUCHERS_CARDS"
        | "MANUAL_LINKS_CAROUSEL"
        | "MANUAL_LINKS_GRID"
        | "LIST_INFO"
        | "GRID_INFO"
        | "GRID_LOGOS"
        | "HIGHLIGHTS_WEEKLY"
      store_approval_status:
        | "DRAFT"
        | "PENDING_APPROVAL"
        | "APPROVED"
        | "REJECTED"
      store_rule_status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED"
      store_type: "RECEPTORA" | "EMISSORA" | "MISTA"
      voucher_status: "active" | "expired" | "depleted" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "root_admin",
        "tenant_admin",
        "brand_admin",
        "branch_admin",
        "branch_operator",
        "operator_pdv",
        "store_admin",
        "customer",
      ],
      earning_source: ["STORE", "PDV", "ADMIN", "IMPORT", "API"],
      earning_status: ["APPROVED", "REJECTED"],
      ledger_entry_type: ["CREDIT", "DEBIT", "PRIZE_REDEEM", "CYCLE_BONUS"],
      ledger_reference_type: [
        "EARNING_EVENT",
        "REDEMPTION",
        "MANUAL_ADJUSTMENT",
        "MACHINE_RIDE",
        "DUEL_RESERVE",
        "DUEL_WIN",
        "DUEL_REFUND",
        "DRIVER_RIDE",
        "SIDE_BET_RESERVE",
        "SIDE_BET_WIN",
        "SIDE_BET_REFUND",
        "SIDE_BET_DUEL_BONUS",
        "BELT_PRIZE",
        "DUEL_SETTLEMENT",
        "BRANCH_RESET",
        "PRIZE_CAMPAIGN",
        "CYCLE_RESET",
      ],
      offer_purpose: ["EARN", "REDEEM", "BOTH"],
      offer_status: ["DRAFT", "PENDING", "APPROVED", "ACTIVE", "EXPIRED"],
      points_rule_type: ["PER_REAL", "FIXED", "TIERED"],
      redemption_status: ["PENDING", "USED", "EXPIRED", "CANCELED"],
      section_source_type: [
        "OFFERS",
        "STORES",
        "CATEGORIES",
        "CUSTOM_QUERY",
        "MANUAL",
      ],
      section_type: [
        "BANNER_CAROUSEL",
        "OFFERS_CAROUSEL",
        "OFFERS_GRID",
        "STORES_GRID",
        "STORES_LIST",
        "VOUCHERS_CARDS",
        "MANUAL_LINKS_CAROUSEL",
        "MANUAL_LINKS_GRID",
        "LIST_INFO",
        "GRID_INFO",
        "GRID_LOGOS",
        "HIGHLIGHTS_WEEKLY",
      ],
      store_approval_status: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
      ],
      store_rule_status: ["ACTIVE", "PENDING_APPROVAL", "REJECTED"],
      store_type: ["RECEPTORA", "EMISSORA", "MISTA"],
      voucher_status: ["active", "expired", "depleted", "cancelled"],
    },
  },
} as const
