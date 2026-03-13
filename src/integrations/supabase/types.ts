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
            foreignKeyName: "affiliate_clicks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "affiliate_deals"
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
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          order_index: number
          original_price: number | null
          price: number | null
          store_logo_url: string | null
          store_name: string | null
          title: string
          updated_at: string
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
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          order_index?: number
          original_price?: number | null
          price?: number | null
          store_logo_url?: string | null
          store_name?: string | null
          title: string
          updated_at?: string
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
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          order_index?: number
          original_price?: number | null
          price?: number | null
          store_logo_url?: string | null
          store_name?: string | null
          title?: string
          updated_at?: string
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
            foreignKeyName: "banner_schedules_brand_section_id_fkey"
            columns: ["brand_section_id"]
            isOneToOne: false
            referencedRelation: "brand_sections"
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
          latitude: number | null
          longitude: number | null
          name: string
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
          latitude?: number | null
          longitude?: number | null
          name: string
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
          latitude?: number | null
          longitude?: number | null
          name?: string
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
        ]
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
          brand_id: string
          created_at: string
          id: string
          permission_key: string
          updated_at: string
        }
        Insert: {
          allowed_for_brand?: boolean
          allowed_for_store?: boolean
          brand_id: string
          created_at?: string
          id?: string
          permission_key: string
          updated_at?: string
        }
        Update: {
          allowed_for_brand?: boolean
          allowed_for_store?: boolean
          brand_id?: string
          created_at?: string
          id?: string
          permission_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_permission_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
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
          subtitle: string | null
          template_id: string
          title: string | null
          updated_at: string
          visual_json: Json
        }
        Insert: {
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
          subtitle?: string | null
          template_id: string
          title?: string | null
          updated_at?: string
          visual_json?: Json
        }
        Update: {
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
      brands: {
        Row: {
          brand_settings_json: Json | null
          created_at: string
          default_theme_id: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          stripe_customer_id: string | null
          subscription_status: string
          tenant_id: string
          trial_expires_at: string | null
        }
        Insert: {
          brand_settings_json?: Json | null
          created_at?: string
          default_theme_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string
          tenant_id: string
          trial_expires_at?: string | null
        }
        Update: {
          brand_settings_json?: Json | null
          created_at?: string
          default_theme_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          stripe_customer_id?: string | null
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
            foreignKeyName: "catalog_cart_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "crm_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
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
        ]
      }
      customers: {
        Row: {
          branch_id: string
          brand_id: string
          cpf: string | null
          created_at: string
          id: string
          is_active: boolean
          money_balance: number
          name: string
          phone: string | null
          points_balance: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          cpf?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          money_balance?: number
          name: string
          phone?: string | null
          points_balance?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          cpf?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          money_balance?: number
          name?: string
          phone?: string | null
          points_balance?: number
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
            foreignKeyName: "earning_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
        ]
      }
      module_definitions: {
        Row: {
          category: string
          created_at: string
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
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          module: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          module: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          module?: string
        }
        Relationships: []
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
          created_by_user_id: string
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
          created_by_user_id: string
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
          created_by_user_id?: string
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
            foreignKeyName: "points_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
            foreignKeyName: "stores_taxonomy_segment_id_fkey"
            columns: ["taxonomy_segment_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_segments"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      get_user_branch_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_brand_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_tenant_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rate_limit_cleanup: { Args: never; Returns: undefined }
      seed_affiliate_categories: {
        Args: { p_brand_id: string }
        Returns: undefined
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
      ledger_entry_type: "CREDIT" | "DEBIT"
      ledger_reference_type:
        | "EARNING_EVENT"
        | "REDEMPTION"
        | "MANUAL_ADJUSTMENT"
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
      ledger_entry_type: ["CREDIT", "DEBIT"],
      ledger_reference_type: [
        "EARNING_EVENT",
        "REDEMPTION",
        "MANUAL_ADJUSTMENT",
      ],
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
