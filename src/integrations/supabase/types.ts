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
          brand_id: string
          created_at: string
          cta_text: string | null
          id: string
          is_enabled: boolean
          order_index: number
          subtitle: string | null
          template_id: string
          title: string | null
          updated_at: string
          visual_json: Json
        }
        Insert: {
          brand_id: string
          created_at?: string
          cta_text?: string | null
          id?: string
          is_enabled?: boolean
          order_index?: number
          subtitle?: string | null
          template_id: string
          title?: string | null
          updated_at?: string
          visual_json?: Json
        }
        Update: {
          brand_id?: string
          created_at?: string
          cta_text?: string | null
          id?: string
          is_enabled?: boolean
          order_index?: number
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
          tenant_id: string
        }
        Insert: {
          brand_settings_json?: Json | null
          created_at?: string
          default_theme_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tenant_id: string
        }
        Update: {
          brand_settings_json?: Json | null
          created_at?: string
          default_theme_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tenant_id?: string
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
      customers: {
        Row: {
          branch_id: string
          brand_id: string
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
          branch_id: string
          brand_id: string
          created_at: string
          description: string | null
          end_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          likes_count: number
          max_daily_redemptions: number | null
          min_purchase: number
          start_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          store_id: string
          title: string
          updated_at: string
          value_rescue: number
        }
        Insert: {
          allowed_hours?: string | null
          allowed_weekdays?: number[] | null
          branch_id: string
          brand_id: string
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          likes_count?: number
          max_daily_redemptions?: number | null
          min_purchase?: number
          start_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          store_id: string
          title: string
          updated_at?: string
          value_rescue?: number
        }
        Update: {
          allowed_hours?: string | null
          allowed_weekdays?: number[] | null
          branch_id?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          likes_count?: number
          max_daily_redemptions?: number | null
          min_purchase?: number
          start_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          store_id?: string
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
            foreignKeyName: "offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      redemptions: {
        Row: {
          branch_id: string
          brand_id: string
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          offer_id: string
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
          customer_id: string
          expires_at?: string | null
          id?: string
          offer_id: string
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
          customer_id?: string
          expires_at?: string | null
          id?: string
          offer_id?: string
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
      stores: {
        Row: {
          address: string | null
          branch_id: string
          brand_id: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          branch_id: string
          brand_id: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string
          brand_id?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          whatsapp?: string | null
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
          discount_percent: number
          expires_at: string | null
          id: string
          max_uses: number
          status: Database["public"]["Enums"]["voucher_status"]
          title: string
          updated_at: string
        }
        Insert: {
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
          discount_percent: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          status?: Database["public"]["Enums"]["voucher_status"]
          title: string
          updated_at?: string
        }
        Update: {
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
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          status?: Database["public"]["Enums"]["voucher_status"]
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
      store_rule_status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED"
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
      ],
      store_rule_status: ["ACTIVE", "PENDING_APPROVAL", "REJECTED"],
      voucher_status: ["active", "expired", "depleted", "cancelled"],
    },
  },
} as const
