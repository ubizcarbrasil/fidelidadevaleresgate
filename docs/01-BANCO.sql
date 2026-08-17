-- =====================================================================
-- 01-BANCO.sql — schema completo extraido do banco em producao
-- Gerado a partir do catalogo do Postgres (pg_catalog / information_schema).
-- Ordem sugerida de execucao do zero: enums -> tabelas -> views -> indices
-- -> grants -> RLS -> policies -> funcoes -> triggers -> cron -> storage.
-- =====================================================================


-- =====================================================================
-- ENUMS (CREATE TYPE)
-- =====================================================================

CREATE TYPE public.app_role AS ENUM ('root_admin', 'tenant_admin', 'brand_admin', 'branch_admin', 'branch_operator', 'operator_pdv', 'store_admin', 'customer');
CREATE TYPE public.earning_source AS ENUM ('STORE', 'PDV', 'ADMIN', 'IMPORT', 'API');
CREATE TYPE public.earning_status AS ENUM ('APPROVED', 'REJECTED');
CREATE TYPE public.ledger_entry_type AS ENUM ('CREDIT', 'DEBIT', 'PRIZE_REDEEM', 'CYCLE_BONUS');
CREATE TYPE public.ledger_reference_type AS ENUM ('EARNING_EVENT', 'REDEMPTION', 'MANUAL_ADJUSTMENT', 'MACHINE_RIDE', 'DUEL_RESERVE', 'DUEL_WIN', 'DUEL_REFUND', 'DRIVER_RIDE', 'SIDE_BET_RESERVE', 'SIDE_BET_WIN', 'SIDE_BET_REFUND', 'SIDE_BET_DUEL_BONUS', 'BELT_PRIZE', 'DUEL_SETTLEMENT', 'BRANCH_RESET', 'PRIZE_CAMPAIGN', 'CYCLE_RESET', 'CAMPEONATO_PRIZE');
CREATE TYPE public.offer_purpose AS ENUM ('EARN', 'REDEEM', 'BOTH');
CREATE TYPE public.offer_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ACTIVE', 'EXPIRED');
CREATE TYPE public.points_rule_type AS ENUM ('PER_REAL', 'FIXED', 'TIERED');
CREATE TYPE public.redemption_status AS ENUM ('PENDING', 'USED', 'EXPIRED', 'CANCELED');
CREATE TYPE public.section_source_type AS ENUM ('OFFERS', 'STORES', 'CATEGORIES', 'CUSTOM_QUERY', 'MANUAL');
CREATE TYPE public.section_type AS ENUM ('BANNER_CAROUSEL', 'OFFERS_CAROUSEL', 'OFFERS_GRID', 'STORES_GRID', 'STORES_LIST', 'VOUCHERS_CARDS', 'MANUAL_LINKS_CAROUSEL', 'MANUAL_LINKS_GRID', 'LIST_INFO', 'GRID_INFO', 'GRID_LOGOS', 'HIGHLIGHTS_WEEKLY');
CREATE TYPE public.store_approval_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
CREATE TYPE public.store_rule_status AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'REJECTED');
CREATE TYPE public.store_type AS ENUM ('RECEPTORA', 'EMISSORA', 'MISTA');
CREATE TYPE public.voucher_status AS ENUM ('active', 'expired', 'depleted', 'cancelled');


-- =====================================================================
-- TABELAS (CREATE TABLE + PK/FK/UNIQUE/CHECK)
-- =====================================================================

CREATE TABLE public.admin_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text DEFAULT 'general'::text NOT NULL,
  reference_id uuid,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.affiliate_category_banners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  category_id uuid NOT NULL,
  image_url text NOT NULL,
  title text,
  link_url text,
  order_index integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.affiliate_category_banners ADD CONSTRAINT affiliate_category_banners_pkey PRIMARY KEY (id);
ALTER TABLE public.affiliate_category_banners ADD CONSTRAINT affiliate_category_banners_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.affiliate_category_banners ADD CONSTRAINT affiliate_category_banners_category_id_fkey FOREIGN KEY (category_id) REFERENCES affiliate_deal_categories(id) ON DELETE CASCADE;

CREATE TABLE public.affiliate_clicks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  deal_id uuid NOT NULL,
  customer_id uuid,
  clicked_at timestamp with time zone DEFAULT now() NOT NULL,
  ip_address text
);
ALTER TABLE public.affiliate_clicks ADD CONSTRAINT affiliate_clicks_pkey PRIMARY KEY (id);
ALTER TABLE public.affiliate_clicks ADD CONSTRAINT affiliate_clicks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE public.affiliate_clicks ADD CONSTRAINT affiliate_clicks_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES affiliate_deals(id) ON DELETE CASCADE;

CREATE TABLE public.affiliate_deal_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  icon_name text DEFAULT 'Tag'::text NOT NULL,
  color text DEFAULT '#6366f1'::text NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  keywords text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.affiliate_deal_categories ADD CONSTRAINT affiliate_deal_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.affiliate_deal_categories ADD CONSTRAINT affiliate_deal_categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.affiliate_deals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  title text NOT NULL,
  description text,
  image_url text,
  price numeric,
  original_price numeric,
  affiliate_url text NOT NULL,
  store_name text,
  category text,
  is_active boolean DEFAULT true NOT NULL,
  click_count integer DEFAULT 0 NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  store_logo_url text,
  badge_label text,
  category_id uuid,
  origin text DEFAULT 'manual'::text,
  origin_external_id text,
  origin_url text,
  origin_hash text,
  is_featured boolean DEFAULT false,
  is_flash_promo boolean DEFAULT false,
  visible_driver boolean DEFAULT true,
  sync_status text DEFAULT 'manual'::text,
  sync_error text,
  raw_payload jsonb,
  first_imported_at timestamp with time zone,
  last_synced_at timestamp with time zone,
  source_group_id text,
  source_group_name text,
  marketplace text,
  current_status text DEFAULT 'active'::text NOT NULL,
  is_redeemable boolean DEFAULT false,
  redeem_points_cost integer,
  redeemable_by text DEFAULT 'driver'::text NOT NULL,
  custom_points_per_real numeric
);
ALTER TABLE public.affiliate_deals ADD CONSTRAINT affiliate_deals_pkey PRIMARY KEY (id);
ALTER TABLE public.affiliate_deals ADD CONSTRAINT affiliate_deals_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.affiliate_deals ADD CONSTRAINT affiliate_deals_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.affiliate_deals ADD CONSTRAINT affiliate_deals_category_id_fkey FOREIGN KEY (category_id) REFERENCES affiliate_deal_categories(id) ON DELETE SET NULL;

CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  scope_type text,
  scope_id uuid,
  changes_json jsonb DEFAULT '{}'::jsonb NOT NULL
);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

CREATE TABLE public.banner_schedules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  brand_section_id uuid,
  image_url text NOT NULL,
  title text,
  link_url text,
  link_type text DEFAULT 'external'::text NOT NULL,
  link_target_id uuid,
  start_at timestamp with time zone DEFAULT now() NOT NULL,
  end_at timestamp with time zone,
  is_active boolean DEFAULT true NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  height text DEFAULT 'medium'::text NOT NULL,
  link_label text
);
ALTER TABLE public.banner_schedules ADD CONSTRAINT banner_schedules_pkey PRIMARY KEY (id);
ALTER TABLE public.banner_schedules ADD CONSTRAINT banner_schedules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.banner_schedules ADD CONSTRAINT banner_schedules_brand_section_id_fkey FOREIGN KEY (brand_section_id) REFERENCES brand_sections(id) ON DELETE SET NULL;

CREATE TABLE public.branch_points_wallet (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  total_loaded numeric DEFAULT 0 NOT NULL,
  total_distributed numeric DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  low_balance_threshold numeric DEFAULT 1000 NOT NULL
);
ALTER TABLE public.branch_points_wallet ADD CONSTRAINT branch_points_wallet_branch_id_key UNIQUE (branch_id);
ALTER TABLE public.branch_points_wallet ADD CONSTRAINT branch_points_wallet_pkey PRIMARY KEY (id);
ALTER TABLE public.branch_points_wallet ADD CONSTRAINT branch_points_wallet_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.branch_points_wallet ADD CONSTRAINT branch_points_wallet_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.branch_wallet_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.branch_wallet_transactions ADD CONSTRAINT branch_wallet_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.branch_wallet_transactions ADD CONSTRAINT branch_wallet_transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.branch_wallet_transactions ADD CONSTRAINT branch_wallet_transactions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.branches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  city text,
  state text,
  timezone text DEFAULT 'America/Sao_Paulo'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  branch_settings_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  latitude numeric,
  longitude numeric,
  scoring_model text DEFAULT 'BOTH'::text NOT NULL,
  is_city_redemption_enabled boolean DEFAULT false NOT NULL,
  last_points_reset_at timestamp with time zone
);
ALTER TABLE public.branches ADD CONSTRAINT branches_brand_id_slug_key UNIQUE (brand_id, slug);
ALTER TABLE public.branches ADD CONSTRAINT branches_pkey PRIMARY KEY (id);
ALTER TABLE public.branches ADD CONSTRAINT branches_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.brand_api_keys (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  label text DEFAULT 'default'::text NOT NULL,
  api_key_hash text NOT NULL,
  api_key_prefix text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_used_at timestamp with time zone,
  created_by uuid
);
ALTER TABLE public.brand_api_keys ADD CONSTRAINT brand_api_keys_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_api_keys ADD CONSTRAINT brand_api_keys_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.brand_business_model_addons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  business_model_id uuid NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  billing_cycle text DEFAULT 'monthly'::text NOT NULL,
  price_cents integer DEFAULT 0 NOT NULL,
  activated_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  created_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  branch_id uuid
);
ALTER TABLE public.brand_business_model_addons ADD CONSTRAINT brand_business_model_addons_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_business_model_addons ADD CONSTRAINT brand_business_model_addons_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.brand_business_model_addons ADD CONSTRAINT brand_business_model_addons_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_business_model_addons ADD CONSTRAINT brand_business_model_addons_business_model_id_fkey FOREIGN KEY (business_model_id) REFERENCES business_models(id) ON DELETE CASCADE;
ALTER TABLE public.brand_business_model_addons ADD CONSTRAINT brand_business_model_addons_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])));
ALTER TABLE public.brand_business_model_addons ADD CONSTRAINT brand_business_model_addons_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'past_due'::text])));

CREATE TABLE public.brand_business_models (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  business_model_id uuid NOT NULL,
  is_enabled boolean DEFAULT false NOT NULL,
  ganha_ganha_margin_pct numeric,
  config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  activated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  engagement_format text DEFAULT 'duelo'::text NOT NULL,
  allowed_engagement_formats text[] DEFAULT ARRAY['duelo'::text, 'mass_duel'::text, 'campeonato'::text] NOT NULL
);
ALTER TABLE public.brand_business_models ADD CONSTRAINT brand_business_models_brand_id_business_model_id_key UNIQUE (brand_id, business_model_id);
ALTER TABLE public.brand_business_models ADD CONSTRAINT brand_business_models_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_business_models ADD CONSTRAINT brand_business_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_business_models ADD CONSTRAINT brand_business_models_business_model_id_fkey FOREIGN KEY (business_model_id) REFERENCES business_models(id) ON DELETE CASCADE;
ALTER TABLE public.brand_business_models ADD CONSTRAINT brand_business_models_engagement_format_check CHECK ((engagement_format = ANY (ARRAY['duelo'::text, 'mass_duel'::text, 'campeonato'::text])));

CREATE TABLE public.brand_domains (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  domain text NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  subdomain text,
  is_active boolean DEFAULT true NOT NULL
);
ALTER TABLE public.brand_domains ADD CONSTRAINT brand_domains_domain_key UNIQUE (domain);
ALTER TABLE public.brand_domains ADD CONSTRAINT brand_domains_subdomain_key UNIQUE (subdomain);
ALTER TABLE public.brand_domains ADD CONSTRAINT brand_domains_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_domains ADD CONSTRAINT brand_domains_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.brand_duelo_prizes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  tier_name text NOT NULL,
  "position" text NOT NULL,
  points_reward integer NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.brand_duelo_prizes ADD CONSTRAINT brand_duelo_prizes_brand_id_branch_id_tier_name_position_key UNIQUE (brand_id, branch_id, tier_name, "position");
ALTER TABLE public.brand_duelo_prizes ADD CONSTRAINT brand_duelo_prizes_pkey PRIMARY KEY (id);

CREATE TABLE public.brand_modules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  module_definition_id uuid NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.brand_modules ADD CONSTRAINT brand_modules_brand_id_module_definition_id_key UNIQUE (brand_id, module_definition_id);
ALTER TABLE public.brand_modules ADD CONSTRAINT brand_modules_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_modules ADD CONSTRAINT brand_modules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_modules ADD CONSTRAINT brand_modules_module_definition_id_fkey FOREIGN KEY (module_definition_id) REFERENCES module_definitions(id) ON DELETE CASCADE;

CREATE TABLE public.brand_permission_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  permission_key text NOT NULL,
  allowed_for_brand boolean DEFAULT true NOT NULL,
  allowed_for_store boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  branch_id uuid,
  scope text DEFAULT 'brand'::text
);
ALTER TABLE public.brand_permission_config ADD CONSTRAINT brand_permission_config_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_permission_config ADD CONSTRAINT brand_permission_config_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.brand_permission_config ADD CONSTRAINT brand_permission_config_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.brand_section_manual_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_section_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.brand_section_manual_items ADD CONSTRAINT brand_section_manual_items_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_section_manual_items ADD CONSTRAINT brand_section_manual_items_brand_section_id_fkey FOREIGN KEY (brand_section_id) REFERENCES brand_sections(id) ON DELETE CASCADE;
ALTER TABLE public.brand_section_manual_items ADD CONSTRAINT brand_section_manual_items_item_type_check CHECK ((item_type = ANY (ARRAY['offer'::text, 'store'::text])));

CREATE TABLE public.brand_section_sources (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_section_id uuid NOT NULL,
  source_type section_source_type NOT NULL,
  filters_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  "limit" integer DEFAULT 10 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.brand_section_sources ADD CONSTRAINT brand_section_sources_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_section_sources ADD CONSTRAINT brand_section_sources_brand_section_id_fkey FOREIGN KEY (brand_section_id) REFERENCES brand_sections(id) ON DELETE CASCADE;

CREATE TABLE public.brand_sections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  template_id uuid NOT NULL,
  title text,
  subtitle text,
  cta_text text,
  order_index integer DEFAULT 0 NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  visual_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  banner_image_url text,
  banner_height text DEFAULT 'medium'::text NOT NULL,
  display_mode text DEFAULT 'carousel'::text NOT NULL,
  rows_count integer DEFAULT 1 NOT NULL,
  columns_count integer DEFAULT 4 NOT NULL,
  icon_size text DEFAULT 'medium'::text NOT NULL,
  filter_mode text DEFAULT 'recent'::text NOT NULL,
  coupon_type_filter text,
  min_stores_visible integer DEFAULT 1 NOT NULL,
  max_stores_visible integer,
  city_filter_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  banners_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  page_id uuid,
  segment_filter_ids uuid[],
  audience text DEFAULT 'all'::text NOT NULL
);
ALTER TABLE public.brand_sections ADD CONSTRAINT brand_sections_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_sections ADD CONSTRAINT brand_sections_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_sections ADD CONSTRAINT brand_sections_page_id_fkey FOREIGN KEY (page_id) REFERENCES custom_pages(id) ON DELETE CASCADE;
ALTER TABLE public.brand_sections ADD CONSTRAINT brand_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES section_templates(id) ON DELETE RESTRICT;

CREATE TABLE public.brand_sub_permission_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  sub_item_id uuid NOT NULL,
  branch_id uuid,
  is_allowed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.brand_sub_permission_config ADD CONSTRAINT brand_sub_permission_config_pkey PRIMARY KEY (id);
ALTER TABLE public.brand_sub_permission_config ADD CONSTRAINT brand_sub_permission_config_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.brand_sub_permission_config ADD CONSTRAINT brand_sub_permission_config_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.brand_sub_permission_config ADD CONSTRAINT brand_sub_permission_config_sub_item_id_fkey FOREIGN KEY (sub_item_id) REFERENCES permission_sub_items(id) ON DELETE CASCADE;

CREATE TABLE public.brands (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  default_theme_id text,
  brand_settings_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  trial_expires_at timestamp with time zone,
  subscription_status text DEFAULT 'NONE'::text NOT NULL,
  stripe_customer_id text,
  home_layout_json jsonb,
  subscription_plan text DEFAULT 'free'::text NOT NULL,
  matrix_api_key text,
  matrix_basic_auth_user text,
  matrix_basic_auth_password text
);
ALTER TABLE public.brands ADD CONSTRAINT brands_tenant_id_slug_key UNIQUE (tenant_id, slug);
ALTER TABLE public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
ALTER TABLE public.brands ADD CONSTRAINT brands_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE TABLE public.business_model_modules (
  business_model_id uuid NOT NULL,
  module_definition_id uuid NOT NULL,
  is_required boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.business_model_modules ADD CONSTRAINT business_model_modules_pkey PRIMARY KEY (business_model_id, module_definition_id);
ALTER TABLE public.business_model_modules ADD CONSTRAINT business_model_modules_business_model_id_fkey FOREIGN KEY (business_model_id) REFERENCES business_models(id) ON DELETE CASCADE;
ALTER TABLE public.business_model_modules ADD CONSTRAINT business_model_modules_module_definition_id_fkey FOREIGN KEY (module_definition_id) REFERENCES module_definitions(id) ON DELETE CASCADE;

CREATE TABLE public.business_models (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  audience text NOT NULL,
  icon text,
  color text,
  sort_order integer DEFAULT 0 NOT NULL,
  pricing_model text DEFAULT 'included'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  is_sellable_addon boolean DEFAULT false NOT NULL,
  addon_price_monthly_cents integer,
  addon_price_yearly_cents integer
);
ALTER TABLE public.business_models ADD CONSTRAINT business_models_key_key UNIQUE (key);
ALTER TABLE public.business_models ADD CONSTRAINT business_models_pkey PRIMARY KEY (id);
ALTER TABLE public.business_models ADD CONSTRAINT business_models_audience_check CHECK ((audience = ANY (ARRAY['cliente'::text, 'motorista'::text, 'b2b'::text])));
ALTER TABLE public.business_models ADD CONSTRAINT business_models_pricing_model_check CHECK ((pricing_model = ANY (ARRAY['included'::text, 'usage_based'::text, 'fixed_addon'::text])));

CREATE TABLE public.campeonato_artilharia_window_prizes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  window_key text NOT NULL,
  enabled boolean DEFAULT false NOT NULL,
  label text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  "position" integer DEFAULT 1 NOT NULL,
  prize_kind text,
  prize_value text,
  description text
);
ALTER TABLE public.campeonato_artilharia_window_prizes ADD CONSTRAINT campeonato_artilharia_window_prizes_season_window_pos_key UNIQUE (season_id, window_key, "position");
ALTER TABLE public.campeonato_artilharia_window_prizes ADD CONSTRAINT duelo_artilharia_window_prizes_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_artilharia_window_prizes ADD CONSTRAINT campeonato_artilharia_window_prizes_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_artilharia_window_prizes ADD CONSTRAINT campeonato_artilharia_window_prizes_position_check CHECK ((("position" >= 1) AND ("position" <= 50)));
ALTER TABLE public.campeonato_artilharia_window_prizes ADD CONSTRAINT campeonato_artilharia_window_prizes_prize_kind_check CHECK (((prize_kind IS NULL) OR (prize_kind = ANY (ARRAY['points'::text, 'item'::text]))));
ALTER TABLE public.campeonato_artilharia_window_prizes ADD CONSTRAINT duelo_artilharia_window_prizes_window_key_check CHECK ((window_key = ANY (ARRAY['24h'::text, '7d'::text, '15d'::text, '30d'::text])));

CREATE TABLE public.campeonato_attempts_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  season_id uuid,
  driver_id uuid,
  brand_id uuid,
  branch_id uuid,
  ride_id uuid,
  details_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_attempts_log ADD CONSTRAINT duelo_attempts_log_pkey PRIMARY KEY (id);

CREATE TABLE public.campeonato_brackets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  round text NOT NULL,
  slot integer NOT NULL,
  driver_a_id uuid,
  driver_b_id uuid,
  driver_a_rides integer DEFAULT 0 NOT NULL,
  driver_b_rides integer DEFAULT 0 NOT NULL,
  winner_id uuid,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  tier_id uuid,
  bracket_scope text DEFAULT 'within_tier'::text NOT NULL
);
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT duelo_brackets_season_id_round_slot_key UNIQUE (season_id, round, slot);
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT duelo_brackets_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT campeonato_brackets_driver_a_id_fkey FOREIGN KEY (driver_a_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT campeonato_brackets_driver_b_id_fkey FOREIGN KEY (driver_b_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT campeonato_brackets_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT campeonato_brackets_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT campeonato_brackets_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_brackets ADD CONSTRAINT duelo_brackets_round_check CHECK ((round = ANY (ARRAY['r16'::text, 'qf'::text, 'sf'::text, 'final'::text])));

CREATE TABLE public.campeonato_champions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  champion_driver_id uuid,
  runner_up_driver_id uuid,
  semifinalist_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  quarterfinalist_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  r16_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  prizes_distributed boolean DEFAULT false NOT NULL,
  finalized_at timestamp with time zone
);
ALTER TABLE public.campeonato_champions ADD CONSTRAINT duelo_champions_season_id_key UNIQUE (season_id);
ALTER TABLE public.campeonato_champions ADD CONSTRAINT duelo_champions_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_champions ADD CONSTRAINT campeonato_champions_champion_driver_id_fkey FOREIGN KEY (champion_driver_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_champions ADD CONSTRAINT campeonato_champions_runner_up_driver_id_fkey FOREIGN KEY (runner_up_driver_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_champions ADD CONSTRAINT campeonato_champions_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;

CREATE TABLE public.campeonato_classificacao_auditoria (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  attempted_by uuid,
  outcome text NOT NULL,
  block_reason text,
  block_code text,
  eligible_count integer,
  required_count integer,
  divergent_count integer,
  divergent_sample jsonb,
  details_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_classificacao_auditoria ADD CONSTRAINT duelo_classificacao_auditoria_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_classificacao_auditoria ADD CONSTRAINT campeonato_classificacao_auditoria_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_classificacao_auditoria ADD CONSTRAINT duelo_classificacao_auditoria_outcome_check CHECK ((outcome = ANY (ARRAY['success'::text, 'blocked'::text])));

CREATE TABLE public.campeonato_driver_tier_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  starting_tier_id uuid,
  ending_tier_id uuid,
  ending_position integer,
  outcome text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_driver_tier_history ADD CONSTRAINT duelo_driver_tier_history_season_id_driver_id_key UNIQUE (season_id, driver_id);
ALTER TABLE public.campeonato_driver_tier_history ADD CONSTRAINT duelo_driver_tier_history_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_driver_tier_history ADD CONSTRAINT campeonato_driver_tier_history_ending_tier_id_fkey FOREIGN KEY (ending_tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_driver_tier_history ADD CONSTRAINT campeonato_driver_tier_history_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_driver_tier_history ADD CONSTRAINT campeonato_driver_tier_history_starting_tier_id_fkey FOREIGN KEY (starting_tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE SET NULL;

CREATE TABLE public.campeonato_match_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bracket_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  event_type text DEFAULT 'ride_completed'::text NOT NULL,
  event_ref_id uuid,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_match_events ADD CONSTRAINT duelo_match_events_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_match_events ADD CONSTRAINT campeonato_match_events_bracket_id_fkey FOREIGN KEY (bracket_id) REFERENCES campeonato_brackets(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_match_events ADD CONSTRAINT campeonato_match_events_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.campeonato_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  season_id uuid,
  event_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_notifications ADD CONSTRAINT duelo_notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_notifications ADD CONSTRAINT campeonato_notifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_notifications ADD CONSTRAINT campeonato_notifications_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_notifications ADD CONSTRAINT campeonato_notifications_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_notifications ADD CONSTRAINT duelo_notifications_event_type_check CHECK ((event_type = ANY (ARRAY['season_created'::text, 'knockout_started'::text, 'match_result'::text, 'prize_received'::text, 'duelo_win'::text, 'duelo_loss'::text, 'duelo_draw'::text])));

CREATE TABLE public.campeonato_prize_distributions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  tier_id uuid NOT NULL,
  tier_name text NOT NULL,
  "position" text NOT NULL,
  points_awarded integer NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  cancelled_reason text,
  points_ledger_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT duelo_prize_distributions_season_id_driver_id_tier_id_posit_key UNIQUE (season_id, driver_id, tier_id, "position");
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT duelo_prize_distributions_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_points_ledger_id_fkey FOREIGN KEY (points_ledger_id) REFERENCES points_ledger(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT campeonato_prize_distributions_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT duelo_prize_distributions_points_awarded_check CHECK ((points_awarded >= 0));
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT duelo_prize_distributions_position_check CHECK (("position" = ANY (ARRAY['champion'::text, 'runner_up'::text, 'semifinalist'::text, 'quarterfinalist'::text, 'r16'::text])));
ALTER TABLE public.campeonato_prize_distributions ADD CONSTRAINT duelo_prize_distributions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text])));

CREATE TABLE public.campeonato_season_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  tier_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.campeonato_season_enrollments ADD CONSTRAINT duelo_season_enrollments_season_id_driver_id_key UNIQUE (season_id, driver_id);
ALTER TABLE public.campeonato_season_enrollments ADD CONSTRAINT duelo_season_enrollments_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_season_enrollments ADD CONSTRAINT campeonato_season_enrollments_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_season_enrollments ADD CONSTRAINT campeonato_season_enrollments_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE SET NULL;
ALTER TABLE public.campeonato_season_enrollments ADD CONSTRAINT duelo_season_enrollments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

CREATE TABLE public.campeonato_season_phase_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  phase text NOT NULL,
  duration_hours integer DEFAULT 24 NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.campeonato_season_phase_config ADD CONSTRAINT duelo_season_phase_config_season_id_phase_key UNIQUE (season_id, phase);
ALTER TABLE public.campeonato_season_phase_config ADD CONSTRAINT duelo_season_phase_config_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_season_phase_config ADD CONSTRAINT campeonato_season_phase_config_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_season_phase_config ADD CONSTRAINT duelo_season_phase_config_duration_hours_check CHECK ((duration_hours > 0));
ALTER TABLE public.campeonato_season_phase_config ADD CONSTRAINT duelo_season_phase_config_phase_check CHECK ((phase = ANY (ARRAY['R16'::text, 'QF'::text, 'SF'::text, 'Final'::text])));

CREATE TABLE public.campeonato_season_prizes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  tier_id uuid,
  "position" integer NOT NULL,
  prize_kind text DEFAULT 'points'::text NOT NULL,
  prize_value numeric DEFAULT 0 NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT duelo_season_prizes_season_id_tier_id_position_key UNIQUE (season_id, tier_id, "position");
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT duelo_season_prizes_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT campeonato_season_prizes_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT campeonato_season_prizes_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT duelo_season_prizes_position_check CHECK (("position" > 0));
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT duelo_season_prizes_prize_kind_check CHECK ((prize_kind = ANY (ARRAY['points'::text, 'money'::text, 'item'::text])));
ALTER TABLE public.campeonato_season_prizes ADD CONSTRAINT duelo_season_prizes_prize_value_check CHECK ((prize_value >= (0)::numeric));

CREATE TABLE public.campeonato_season_standings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  points integer DEFAULT 0 NOT NULL,
  last_ride_at timestamp with time zone,
  "position" integer,
  qualified boolean DEFAULT false NOT NULL,
  tier_id uuid,
  position_in_tier integer,
  relegated_auto boolean DEFAULT false NOT NULL,
  weekend_rides_count integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.campeonato_season_standings ADD CONSTRAINT duelo_season_standings_season_id_driver_id_key UNIQUE (season_id, driver_id);
ALTER TABLE public.campeonato_season_standings ADD CONSTRAINT duelo_season_standings_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_season_standings ADD CONSTRAINT campeonato_season_standings_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_season_standings ADD CONSTRAINT campeonato_season_standings_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_season_standings ADD CONSTRAINT campeonato_season_standings_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE SET NULL;

CREATE TABLE public.campeonato_season_tiers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  tier_order integer NOT NULL,
  target_size integer DEFAULT 16 NOT NULL,
  promotion_count integer DEFAULT 0 NOT NULL,
  relegation_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  aborted_at timestamp with time zone
);
ALTER TABLE public.campeonato_season_tiers ADD CONSTRAINT duelo_season_tiers_season_id_name_key UNIQUE (season_id, name);
ALTER TABLE public.campeonato_season_tiers ADD CONSTRAINT duelo_season_tiers_season_id_tier_order_key UNIQUE (season_id, tier_order);
ALTER TABLE public.campeonato_season_tiers ADD CONSTRAINT duelo_season_tiers_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_season_tiers ADD CONSTRAINT campeonato_season_tiers_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;

CREATE TABLE public.campeonato_seasons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  phase text DEFAULT 'classification'::text NOT NULL,
  classification_starts_at timestamp with time zone NOT NULL,
  classification_ends_at timestamp with time zone NOT NULL,
  knockout_starts_at timestamp with time zone NOT NULL,
  knockout_ends_at timestamp with time zone NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  tiers_count integer DEFAULT 1 NOT NULL,
  relegation_policy text DEFAULT 'auto_zero'::text NOT NULL,
  tiers_config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  tier_seeding_completed_at timestamp with time zone,
  promotion_applied_at timestamp with time zone,
  paused_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  scoring_mode text DEFAULT 'total_points'::text NOT NULL,
  scoring_config_json jsonb DEFAULT '{"win": 3, "draw": 1, "loss": 0}'::jsonb NOT NULL,
  enrollment_mode text DEFAULT 'auto'::text NOT NULL,
  entry_fee_cents integer DEFAULT 0 NOT NULL,
  entry_fee_currency text DEFAULT 'BRL'::text NOT NULL,
  enrollment_opens_at timestamp with time zone,
  enrollment_closes_at timestamp with time zone,
  default_match_hours integer DEFAULT 24 NOT NULL,
  published_at timestamp with time zone
);
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT campeonato_seasons_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT campeonato_seasons_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_default_match_hours_chk CHECK ((default_match_hours > 0));
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_enrollment_mode_chk CHECK ((enrollment_mode = ANY (ARRAY['auto'::text, 'manual'::text])));
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_entry_fee_chk CHECK ((entry_fee_cents >= 0));
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_month_check CHECK (((month >= 1) AND (month <= 12)));
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_phase_check CHECK ((phase = ANY (ARRAY['classification'::text, 'knockout_r16'::text, 'knockout_qf'::text, 'knockout_sf'::text, 'knockout_final'::text, 'finished'::text, 'cancelled'::text])));
ALTER TABLE public.campeonato_seasons ADD CONSTRAINT duelo_seasons_scoring_mode_chk CHECK ((scoring_mode = ANY (ARRAY['total_points'::text, 'daily_matchup'::text])));

CREATE TABLE public.campeonato_tier_memberships (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  season_id uuid NOT NULL,
  tier_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  source text DEFAULT 'seed'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.campeonato_tier_memberships ADD CONSTRAINT duelo_tier_memberships_season_id_driver_id_key UNIQUE (season_id, driver_id);
ALTER TABLE public.campeonato_tier_memberships ADD CONSTRAINT duelo_tier_memberships_pkey PRIMARY KEY (id);
ALTER TABLE public.campeonato_tier_memberships ADD CONSTRAINT campeonato_tier_memberships_season_id_fkey FOREIGN KEY (season_id) REFERENCES campeonato_seasons(id) ON DELETE CASCADE;
ALTER TABLE public.campeonato_tier_memberships ADD CONSTRAINT campeonato_tier_memberships_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES campeonato_season_tiers(id) ON DELETE CASCADE;

CREATE TABLE public.catalog_cart_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  customer_id uuid,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  items_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  total_amount numeric DEFAULT 0 NOT NULL,
  points_earned_estimate integer DEFAULT 0 NOT NULL,
  whatsapp_url_sent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  customer_name text,
  customer_cpf text,
  points_confirmed_at timestamp with time zone,
  confirmed_by_user_id uuid,
  notes text
);
ALTER TABLE public.catalog_cart_orders ADD CONSTRAINT catalog_cart_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.catalog_cart_orders ADD CONSTRAINT catalog_cart_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.catalog_cart_orders ADD CONSTRAINT catalog_cart_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.catalog_cart_orders ADD CONSTRAINT catalog_cart_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE public.catalog_cart_orders ADD CONSTRAINT catalog_cart_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);

CREATE TABLE public.city_belt_champions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  champion_customer_id uuid NOT NULL,
  record_value bigint DEFAULT 0 NOT NULL,
  record_type text DEFAULT 'monthly'::text NOT NULL,
  achieved_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  belt_prize_points integer DEFAULT 0 NOT NULL,
  assigned_manually boolean DEFAULT false NOT NULL
);
ALTER TABLE public.city_belt_champions ADD CONSTRAINT city_belt_champions_branch_id_record_type_key UNIQUE (branch_id, record_type);
ALTER TABLE public.city_belt_champions ADD CONSTRAINT city_belt_champions_pkey PRIMARY KEY (id);
ALTER TABLE public.city_belt_champions ADD CONSTRAINT city_belt_champions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.city_belt_champions ADD CONSTRAINT city_belt_champions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.city_belt_champions ADD CONSTRAINT city_belt_champions_champion_customer_id_fkey FOREIGN KEY (champion_customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.city_business_model_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  business_model_id uuid NOT NULL,
  is_enabled boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  config_json jsonb DEFAULT '{}'::jsonb NOT NULL
);
ALTER TABLE public.city_business_model_overrides ADD CONSTRAINT city_business_model_overrides_branch_id_business_model_id_key UNIQUE (branch_id, business_model_id);
ALTER TABLE public.city_business_model_overrides ADD CONSTRAINT city_business_model_overrides_pkey PRIMARY KEY (id);
ALTER TABLE public.city_business_model_overrides ADD CONSTRAINT city_business_model_overrides_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.city_business_model_overrides ADD CONSTRAINT city_business_model_overrides_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.city_business_model_overrides ADD CONSTRAINT city_business_model_overrides_business_model_id_fkey FOREIGN KEY (business_model_id) REFERENCES business_models(id) ON DELETE CASCADE;

CREATE TABLE public.city_feed_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  event_type text NOT NULL,
  customer_id uuid,
  title text NOT NULL,
  description text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.city_feed_events ADD CONSTRAINT city_feed_events_pkey PRIMARY KEY (id);
ALTER TABLE public.city_feed_events ADD CONSTRAINT city_feed_events_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.city_feed_events ADD CONSTRAINT city_feed_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.city_feed_events ADD CONSTRAINT city_feed_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE TABLE public.city_module_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  module_definition_id uuid NOT NULL,
  is_enabled boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.city_module_overrides ADD CONSTRAINT city_module_overrides_branch_id_module_definition_id_key UNIQUE (branch_id, module_definition_id);
ALTER TABLE public.city_module_overrides ADD CONSTRAINT city_module_overrides_pkey PRIMARY KEY (id);
ALTER TABLE public.city_module_overrides ADD CONSTRAINT city_module_overrides_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.city_module_overrides ADD CONSTRAINT city_module_overrides_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.city_module_overrides ADD CONSTRAINT city_module_overrides_module_definition_id_fkey FOREIGN KEY (module_definition_id) REFERENCES module_definitions(id) ON DELETE CASCADE;

CREATE TABLE public.commercial_lead_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  lead_id uuid NOT NULL,
  author_user_id uuid,
  author_name text,
  content text NOT NULL,
  note_type text DEFAULT 'manual'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.commercial_lead_notes ADD CONSTRAINT commercial_lead_notes_pkey PRIMARY KEY (id);
ALTER TABLE public.commercial_lead_notes ADD CONSTRAINT commercial_lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES commercial_leads(id) ON DELETE CASCADE;

CREATE TABLE public.commercial_leads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_id uuid,
  product_slug text,
  product_name text,
  full_name text NOT NULL,
  work_email text NOT NULL,
  phone text NOT NULL,
  company_name text NOT NULL,
  company_role text,
  company_size text,
  city text,
  current_solution text,
  interest_message text,
  preferred_contact text DEFAULT 'whatsapp'::text,
  preferred_window text,
  source text DEFAULT 'landing_produto'::text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  ip_address text,
  user_agent text,
  status text DEFAULT 'novo'::text NOT NULL,
  assigned_to uuid,
  notes text,
  contacted_at timestamp with time zone,
  qualified_at timestamp with time zone,
  converted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.commercial_leads ADD CONSTRAINT commercial_leads_pkey PRIMARY KEY (id);

CREATE TABLE public.coupons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  offer_id uuid,
  type text NOT NULL,
  value numeric DEFAULT 0 NOT NULL,
  code text DEFAULT upper(substr((gen_random_uuid())::text, 1, 8)) NOT NULL,
  status text DEFAULT 'ACTIVE'::text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);
ALTER TABLE public.coupons ADD CONSTRAINT coupons_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.coupons ADD CONSTRAINT coupons_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES offers(id);
ALTER TABLE public.coupons ADD CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.cp_contacts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text DEFAULT ''::text NOT NULL,
  email text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  tags text[] DEFAULT '{}'::text[],
  notes text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid
);
ALTER TABLE public.cp_contacts ADD CONSTRAINT cp_contacts_pkey PRIMARY KEY (id);
ALTER TABLE public.cp_contacts ADD CONSTRAINT cp_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE public.cp_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text DEFAULT ''::text NOT NULL,
  content text DEFAULT ''::text,
  category text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid
);
ALTER TABLE public.cp_notes ADD CONSTRAINT cp_notes_pkey PRIMARY KEY (id);
ALTER TABLE public.cp_notes ADD CONSTRAINT cp_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE public.cp_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text DEFAULT ''::text NOT NULL,
  description text DEFAULT ''::text,
  status text DEFAULT 'pending'::text NOT NULL,
  priority text DEFAULT 'medium'::text NOT NULL,
  due_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid
);
ALTER TABLE public.cp_tasks ADD CONSTRAINT cp_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.cp_tasks ADD CONSTRAINT cp_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE public.crm_audiences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  filters_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  estimated_count integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.crm_audiences ADD CONSTRAINT crm_audiences_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_audiences ADD CONSTRAINT crm_audiences_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.crm_campaign_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  channel text NOT NULL,
  status text DEFAULT 'QUEUED'::text NOT NULL,
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.crm_campaign_logs ADD CONSTRAINT crm_campaign_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_campaign_logs ADD CONSTRAINT crm_campaign_logs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES crm_campaigns(id) ON DELETE CASCADE;
ALTER TABLE public.crm_campaign_logs ADD CONSTRAINT crm_campaign_logs_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

CREATE TABLE public.crm_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  audience_id uuid,
  store_id uuid,
  title text NOT NULL,
  message_template text,
  image_url text,
  channel text DEFAULT 'PUSH'::text NOT NULL,
  cost_per_send numeric DEFAULT 0.03 NOT NULL,
  total_cost numeric DEFAULT 0 NOT NULL,
  total_recipients integer DEFAULT 0 NOT NULL,
  status text DEFAULT 'DRAFT'::text NOT NULL,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  approved_by uuid,
  approved_at timestamp with time zone,
  offer_config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.crm_campaigns ADD CONSTRAINT crm_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_campaigns ADD CONSTRAINT crm_campaigns_audience_id_fkey FOREIGN KEY (audience_id) REFERENCES crm_audiences(id);
ALTER TABLE public.crm_campaigns ADD CONSTRAINT crm_campaigns_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.crm_campaigns ADD CONSTRAINT crm_campaigns_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);

CREATE TABLE public.crm_contacts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  customer_id uuid,
  external_id text,
  name text,
  phone text,
  email text,
  cpf text,
  gender text,
  os_platform text,
  source text DEFAULT 'MANUAL'::text NOT NULL,
  latitude numeric,
  longitude numeric,
  tags_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  ride_count integer DEFAULT 0 NOT NULL,
  first_ride_at timestamp with time zone,
  last_ride_at timestamp with time zone
);
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_brand_id_cpf_key UNIQUE (brand_id, cpf);
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_brand_id_external_id_key UNIQUE (brand_id, external_id);
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);

CREATE TABLE public.crm_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  event_type text NOT NULL,
  event_subtype text,
  latitude numeric,
  longitude numeric,
  payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.crm_events ADD CONSTRAINT crm_events_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_events ADD CONSTRAINT crm_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.crm_events ADD CONSTRAINT crm_events_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

CREATE TABLE public.crm_tiers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  min_events integer DEFAULT 0 NOT NULL,
  max_events integer,
  color text DEFAULT '#6366f1'::text NOT NULL,
  icon text DEFAULT 'Star'::text,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.crm_tiers ADD CONSTRAINT crm_tiers_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_tiers ADD CONSTRAINT crm_tiers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.custom_pages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  elements_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  permissions_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  tags_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  subtitle text,
  search_enabled boolean DEFAULT false NOT NULL,
  visibility_type text DEFAULT 'public'::text NOT NULL,
  visibility_config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  banner_config_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  page_version integer DEFAULT 0 NOT NULL,
  published_at timestamp with time zone
);
ALTER TABLE public.custom_pages ADD CONSTRAINT custom_pages_brand_id_slug_key UNIQUE (brand_id, slug);
ALTER TABLE public.custom_pages ADD CONSTRAINT custom_pages_pkey PRIMARY KEY (id);
ALTER TABLE public.custom_pages ADD CONSTRAINT custom_pages_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.customer_click_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  entity_type text DEFAULT 'offer'::text NOT NULL,
  entity_id uuid NOT NULL,
  store_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.customer_click_events ADD CONSTRAINT customer_click_events_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_click_events ADD CONSTRAINT customer_click_events_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.customer_click_events ADD CONSTRAINT customer_click_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.customer_click_events ADD CONSTRAINT customer_click_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.customer_favorite_stores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  store_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.customer_favorite_stores ADD CONSTRAINT customer_favorite_stores_customer_id_store_id_key UNIQUE (customer_id, store_id);
ALTER TABLE public.customer_favorite_stores ADD CONSTRAINT customer_favorite_stores_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_favorite_stores ADD CONSTRAINT customer_favorite_stores_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.customer_favorite_stores ADD CONSTRAINT customer_favorite_stores_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.customer_favorites (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.customer_favorites ADD CONSTRAINT customer_favorites_customer_id_offer_id_key UNIQUE (customer_id, offer_id);
ALTER TABLE public.customer_favorites ADD CONSTRAINT customer_favorites_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_favorites ADD CONSTRAINT customer_favorites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.customer_favorites ADD CONSTRAINT customer_favorites_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE;

CREATE TABLE public.customer_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text DEFAULT 'offer_expiring'::text NOT NULL,
  reference_id uuid,
  reference_type text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.customer_notifications ADD CONSTRAINT customer_notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_notifications ADD CONSTRAINT customer_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  points_balance numeric DEFAULT 0 NOT NULL,
  money_balance numeric DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  cpf text,
  email text,
  crm_contact_id uuid,
  crm_sync_status text DEFAULT 'NONE'::text,
  ride_count integer DEFAULT 0,
  customer_tier text DEFAULT 'INICIANTE'::text,
  driver_monthly_ride_count integer DEFAULT 0,
  driver_cycle_start date DEFAULT CURRENT_DATE,
  external_driver_id text,
  scoring_disabled boolean DEFAULT false NOT NULL,
  is_driver boolean DEFAULT ((external_driver_id IS NOT NULL) OR (name ~~* '%[MOTORISTA]%'::text)),
  photo_url text
);
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE public.customers ADD CONSTRAINT customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.customers ADD CONSTRAINT customers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD CONSTRAINT customers_crm_contact_id_fkey FOREIGN KEY (crm_contact_id) REFERENCES crm_contacts(id);
ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE TABLE public.driver_achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  achievement_key text NOT NULL,
  achievement_label text NOT NULL,
  icon_name text DEFAULT 'Trophy'::text,
  achieved_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata_json jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.driver_achievements ADD CONSTRAINT driver_achievements_customer_id_achievement_key_key UNIQUE (customer_id, achievement_key);
ALTER TABLE public.driver_achievements ADD CONSTRAINT driver_achievements_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_achievements ADD CONSTRAINT driver_achievements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.driver_achievements ADD CONSTRAINT driver_achievements_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_achievements ADD CONSTRAINT driver_achievements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.driver_duel_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  duel_id uuid NOT NULL,
  challenger_customer_id uuid NOT NULL,
  challenged_customer_id uuid NOT NULL,
  challenger_rides_counted bigint DEFAULT 0 NOT NULL,
  challenged_rides_counted bigint DEFAULT 0 NOT NULL,
  challenger_ride_ids uuid[] DEFAULT '{}'::uuid[],
  challenged_ride_ids uuid[] DEFAULT '{}'::uuid[],
  winner_participant_id uuid,
  count_window_start timestamp with time zone NOT NULL,
  count_window_end timestamp with time zone NOT NULL,
  points_settled boolean DEFAULT false,
  finalized_by text DEFAULT 'cron'::text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.driver_duel_audit_log ADD CONSTRAINT driver_duel_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_duel_audit_log ADD CONSTRAINT driver_duel_audit_log_duel_id_fkey FOREIGN KEY (duel_id) REFERENCES driver_duels(id) ON DELETE CASCADE;

CREATE TABLE public.driver_duel_guesses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  duel_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  predicted_winner_participant_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_duel_guesses ADD CONSTRAINT driver_duel_guesses_duel_id_customer_id_key UNIQUE (duel_id, customer_id);
ALTER TABLE public.driver_duel_guesses ADD CONSTRAINT driver_duel_guesses_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_duel_guesses ADD CONSTRAINT driver_duel_guesses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_guesses ADD CONSTRAINT driver_duel_guesses_duel_id_fkey FOREIGN KEY (duel_id) REFERENCES driver_duels(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_guesses ADD CONSTRAINT driver_duel_guesses_predicted_winner_participant_id_fkey FOREIGN KEY (predicted_winner_participant_id) REFERENCES driver_duel_participants(id) ON DELETE CASCADE;

CREATE TABLE public.driver_duel_participants (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  duels_enabled boolean DEFAULT false NOT NULL,
  public_nickname text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  display_name text
);
ALTER TABLE public.driver_duel_participants ADD CONSTRAINT driver_duel_participants_customer_id_key UNIQUE (customer_id);
ALTER TABLE public.driver_duel_participants ADD CONSTRAINT driver_duel_participants_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_duel_participants ADD CONSTRAINT driver_duel_participants_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_participants ADD CONSTRAINT driver_duel_participants_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_participants ADD CONSTRAINT driver_duel_participants_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.driver_duel_ratings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  duel_id uuid NOT NULL,
  rater_customer_id uuid NOT NULL,
  rated_customer_id uuid NOT NULL,
  rating smallint NOT NULL,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT unique_rating_per_duel UNIQUE (duel_id, rater_customer_id);
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT driver_duel_ratings_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT driver_duel_ratings_duel_id_fkey FOREIGN KEY (duel_id) REFERENCES driver_duels(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT driver_duel_ratings_rated_customer_id_fkey FOREIGN KEY (rated_customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT driver_duel_ratings_rater_customer_id_fkey FOREIGN KEY (rater_customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT comment_length CHECK ((char_length(comment) <= 200));
ALTER TABLE public.driver_duel_ratings ADD CONSTRAINT rating_range CHECK (((rating >= 1) AND (rating <= 5)));

CREATE TABLE public.driver_duels (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  challenger_id uuid NOT NULL,
  challenged_id uuid NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  challenger_rides_count integer DEFAULT 0 NOT NULL,
  challenged_rides_count integer DEFAULT 0 NOT NULL,
  winner_id uuid,
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  duel_mode text DEFAULT 'rides'::text NOT NULL,
  season_id uuid,
  is_rematch boolean DEFAULT false NOT NULL,
  rematch_of uuid,
  prize_points integer DEFAULT 0 NOT NULL,
  challenger_points_bet integer DEFAULT 0 NOT NULL,
  challenged_points_bet integer DEFAULT 0 NOT NULL,
  negotiation_status text DEFAULT 'none'::text NOT NULL,
  counter_proposal_points integer,
  counter_proposal_by text,
  points_reserved boolean DEFAULT false NOT NULL,
  points_settled boolean DEFAULT false NOT NULL,
  sponsored_by_brand boolean DEFAULT false NOT NULL,
  duel_origin text DEFAULT 'DRIVER_VS_DRIVER'::text NOT NULL
);
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_challenged_id_fkey FOREIGN KEY (challenged_id) REFERENCES driver_duel_participants(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_challenger_id_fkey FOREIGN KEY (challenger_id) REFERENCES driver_duel_participants(id) ON DELETE CASCADE;
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_rematch_of_fkey FOREIGN KEY (rematch_of) REFERENCES driver_duels(id);
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_season_id_fkey FOREIGN KEY (season_id) REFERENCES gamification_seasons(id);
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES driver_duel_participants(id);
ALTER TABLE public.driver_duels ADD CONSTRAINT driver_duels_duel_origin_check CHECK ((duel_origin = ANY (ARRAY['DRIVER_VS_DRIVER'::text, 'SPONSORED'::text])));

CREATE TABLE public.driver_import_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  created_by uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  total_rows integer DEFAULT 0 NOT NULL,
  processed_rows integer DEFAULT 0 NOT NULL,
  created_count integer DEFAULT 0 NOT NULL,
  updated_count integer DEFAULT 0 NOT NULL,
  skipped_count integer DEFAULT 0 NOT NULL,
  error_count integer DEFAULT 0 NOT NULL,
  errors_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_import_jobs ADD CONSTRAINT driver_import_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_import_jobs ADD CONSTRAINT driver_import_jobs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.driver_import_jobs ADD CONSTRAINT driver_import_jobs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.driver_message_flows (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  event_type text NOT NULL,
  template_id uuid NOT NULL,
  audience text DEFAULT 'all_drivers'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_message_flows ADD CONSTRAINT driver_message_flows_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_message_flows ADD CONSTRAINT driver_message_flows_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.driver_message_flows ADD CONSTRAINT driver_message_flows_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_message_flows ADD CONSTRAINT driver_message_flows_template_id_fkey FOREIGN KEY (template_id) REFERENCES driver_message_templates(id) ON DELETE CASCADE;

CREATE TABLE public.driver_message_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  flow_id uuid,
  template_id uuid,
  customer_id uuid NOT NULL,
  event_type text,
  rendered_message text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'sent'::text NOT NULL,
  error_detail text,
  metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_message_logs ADD CONSTRAINT driver_message_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_message_logs ADD CONSTRAINT driver_message_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.driver_message_logs ADD CONSTRAINT driver_message_logs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_message_logs ADD CONSTRAINT driver_message_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.driver_message_logs ADD CONSTRAINT driver_message_logs_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES driver_message_flows(id) ON DELETE SET NULL;
ALTER TABLE public.driver_message_logs ADD CONSTRAINT driver_message_logs_template_id_fkey FOREIGN KEY (template_id) REFERENCES driver_message_templates(id) ON DELETE SET NULL;

CREATE TABLE public.driver_message_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  body_template text DEFAULT ''::text NOT NULL,
  available_vars text[] DEFAULT '{}'::text[] NOT NULL,
  category text DEFAULT 'general'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_message_templates ADD CONSTRAINT driver_message_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_message_templates ADD CONSTRAINT driver_message_templates_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.driver_points_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  customer_id uuid NOT NULL,
  points_amount integer NOT NULL,
  price_cents integer NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  confirmed_at timestamp with time zone,
  confirmed_by uuid
);
ALTER TABLE public.driver_points_orders ADD CONSTRAINT driver_points_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_points_orders ADD CONSTRAINT driver_points_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.driver_points_orders ADD CONSTRAINT driver_points_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_points_orders ADD CONSTRAINT driver_points_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.driver_points_purchase_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  price_per_thousand_cents integer DEFAULT 7000 NOT NULL,
  min_points integer DEFAULT 1000 NOT NULL,
  max_points integer DEFAULT 300000 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_points_purchase_config ADD CONSTRAINT driver_points_purchase_config_brand_id_key UNIQUE (brand_id);
ALTER TABLE public.driver_points_purchase_config ADD CONSTRAINT driver_points_purchase_config_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_points_purchase_config ADD CONSTRAINT driver_points_purchase_config_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.driver_points_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  rule_mode text DEFAULT 'PER_REAL'::text NOT NULL,
  points_per_real numeric DEFAULT 1,
  percent_of_passenger numeric DEFAULT 50,
  fixed_points_per_ride integer DEFAULT 10,
  volume_tiers jsonb DEFAULT '[]'::jsonb,
  volume_cycle_days integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  macaneta_points_per_ride integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.driver_points_rules ADD CONSTRAINT driver_points_rules_brand_id_branch_id_key UNIQUE (brand_id, branch_id);
ALTER TABLE public.driver_points_rules ADD CONSTRAINT driver_points_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_points_rules ADD CONSTRAINT driver_points_rules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.driver_points_rules ADD CONSTRAINT driver_points_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.driver_profiles (
  customer_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  external_id text,
  gender text,
  birth_date date,
  mother_name text,
  cnh_number text,
  cnh_expiration date,
  has_ear boolean,
  rating numeric(3,2),
  acceptance_rate integer,
  acceptance_rate_updated_at timestamp with time zone,
  registration_status text,
  registration_status_at timestamp with time zone,
  registered_at timestamp with time zone,
  blocked_until timestamp with time zone,
  block_reason text,
  last_os_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  accepted_payments jsonb DEFAULT '{}'::jsonb,
  services_offered jsonb DEFAULT '{}'::jsonb,
  link_type text,
  relationship text,
  vehicle1_model text,
  vehicle1_year integer,
  vehicle1_color text,
  vehicle1_plate text,
  vehicle1_state text,
  vehicle1_city text,
  vehicle1_renavam text,
  vehicle1_own boolean,
  vehicle1_exercise_year integer,
  vehicle2_model text,
  vehicle2_year integer,
  vehicle2_color text,
  vehicle2_plate text,
  vehicle2_state text,
  vehicle2_city text,
  vehicle2_renavam text,
  vehicle2_own boolean,
  vehicle2_exercise_year integer,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zipcode text,
  bank_holder_cpf text,
  bank_holder_name text,
  bank_code text,
  bank_agency text,
  bank_account text,
  pix_key text,
  extra_data text,
  internal_note_1 text,
  internal_note_2 text,
  internal_note_3 text,
  imei_1 text,
  imei_2 text,
  vtr text,
  app_version text,
  referred_by text,
  fees_json jsonb DEFAULT '{}'::jsonb,
  raw_import_json jsonb,
  imported_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  photo_url text
);
ALTER TABLE public.driver_profiles ADD CONSTRAINT driver_profiles_pkey PRIMARY KEY (customer_id);
ALTER TABLE public.driver_profiles ADD CONSTRAINT driver_profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.driver_profiles ADD CONSTRAINT driver_profiles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.driver_profiles ADD CONSTRAINT driver_profiles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.driver_verification_codes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  code text NOT NULL,
  email text,
  expires_at timestamp with time zone DEFAULT (now() + '00:10:00'::interval) NOT NULL,
  used boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.driver_verification_codes ADD CONSTRAINT driver_verification_codes_pkey PRIMARY KEY (id);
ALTER TABLE public.driver_verification_codes ADD CONSTRAINT driver_verification_codes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.duel_cycle_reset_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  executed_at timestamp with time zone DEFAULT now() NOT NULL,
  drivers_affected integer DEFAULT 0 NOT NULL,
  total_points_distributed bigint DEFAULT 0 NOT NULL,
  action_executed text NOT NULL,
  config_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  details_json jsonb DEFAULT '{}'::jsonb,
  triggered_by text DEFAULT 'cron'::text NOT NULL,
  triggered_by_user uuid
);
ALTER TABLE public.duel_cycle_reset_history ADD CONSTRAINT duel_cycle_reset_history_pkey PRIMARY KEY (id);
ALTER TABLE public.duel_cycle_reset_history ADD CONSTRAINT duel_cycle_reset_history_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.duel_cycle_reset_history ADD CONSTRAINT duel_cycle_reset_history_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.duel_cycle_reset_history ADD CONSTRAINT duel_cycle_reset_history_triggered_by_check CHECK ((triggered_by = ANY (ARRAY['cron'::text, 'manual'::text])));

CREATE TABLE public.duel_prize_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  season_id uuid,
  name text NOT NULL,
  description text,
  image_url text,
  points_cost integer NOT NULL,
  quantity_total integer NOT NULL,
  quantity_redeemed integer DEFAULT 0 NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_season_id_fkey FOREIGN KEY (season_id) REFERENCES gamification_seasons(id) ON DELETE SET NULL;
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_check CHECK ((ends_at > starts_at));
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_check1 CHECK ((quantity_redeemed <= quantity_total));
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_points_cost_check CHECK ((points_cost > 0));
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_quantity_redeemed_check CHECK ((quantity_redeemed >= 0));
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_quantity_total_check CHECK ((quantity_total > 0));
ALTER TABLE public.duel_prize_campaigns ADD CONSTRAINT duel_prize_campaigns_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])));

CREATE TABLE public.duel_side_bets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  duel_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  bettor_a_customer_id uuid NOT NULL,
  bettor_a_predicted_winner uuid NOT NULL,
  bettor_a_points integer NOT NULL,
  bettor_b_customer_id uuid,
  bettor_b_predicted_winner uuid,
  bettor_b_points integer,
  status text DEFAULT 'open'::text NOT NULL,
  counter_proposal_points integer,
  points_reserved boolean DEFAULT false NOT NULL,
  winner_customer_id uuid,
  duel_winner_bonus integer DEFAULT 0,
  settled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_pkey PRIMARY KEY (id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_bettor_a_customer_id_fkey FOREIGN KEY (bettor_a_customer_id) REFERENCES customers(id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_bettor_a_predicted_winner_fkey FOREIGN KEY (bettor_a_predicted_winner) REFERENCES driver_duel_participants(id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_bettor_b_customer_id_fkey FOREIGN KEY (bettor_b_customer_id) REFERENCES customers(id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_bettor_b_predicted_winner_fkey FOREIGN KEY (bettor_b_predicted_winner) REFERENCES driver_duel_participants(id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_duel_id_fkey FOREIGN KEY (duel_id) REFERENCES driver_duels(id) ON DELETE CASCADE;
ALTER TABLE public.duel_side_bets ADD CONSTRAINT duel_side_bets_winner_customer_id_fkey FOREIGN KEY (winner_customer_id) REFERENCES customers(id);

CREATE TABLE public.earning_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  store_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  purchase_value numeric DEFAULT 0 NOT NULL,
  receipt_code text,
  points_earned integer DEFAULT 0 NOT NULL,
  money_earned numeric DEFAULT 0 NOT NULL,
  source earning_source DEFAULT 'STORE'::earning_source NOT NULL,
  created_by_user_id uuid NOT NULL,
  status earning_status DEFAULT 'APPROVED'::earning_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  rule_snapshot_json jsonb
);
ALTER TABLE public.earning_events ADD CONSTRAINT earning_events_pkey PRIMARY KEY (id);
ALTER TABLE public.earning_events ADD CONSTRAINT earning_events_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.earning_events ADD CONSTRAINT earning_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.earning_events ADD CONSTRAINT earning_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.earning_events ADD CONSTRAINT earning_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.error_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  message text NOT NULL,
  stack text,
  url text,
  user_id uuid,
  brand_id uuid,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'error'::text NOT NULL,
  source text DEFAULT 'client'::text NOT NULL
);
ALTER TABLE public.error_logs ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);

CREATE TABLE public.feature_flags (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false NOT NULL,
  scope_type text DEFAULT 'PLATFORM'::text NOT NULL,
  scope_id uuid,
  metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_key_key UNIQUE (key);
ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);

CREATE TABLE public.gamification_seasons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  status text DEFAULT 'upcoming'::text NOT NULL,
  config_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.gamification_seasons ADD CONSTRAINT gamification_seasons_pkey PRIMARY KEY (id);
ALTER TABLE public.gamification_seasons ADD CONSTRAINT gamification_seasons_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.gamification_seasons ADD CONSTRAINT gamification_seasons_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.ganha_ganha_billing_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  store_id uuid NOT NULL,
  event_type text NOT NULL,
  points_amount integer DEFAULT 0 NOT NULL,
  fee_per_point numeric DEFAULT 0 NOT NULL,
  fee_total numeric DEFAULT 0 NOT NULL,
  reference_id uuid,
  reference_type text,
  period_month text DEFAULT to_char(now(), 'YYYY-MM'::text) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ganha_ganha_billing_events ADD CONSTRAINT ganha_ganha_billing_events_pkey PRIMARY KEY (id);
ALTER TABLE public.ganha_ganha_billing_events ADD CONSTRAINT ganha_ganha_billing_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.ganha_ganha_billing_events ADD CONSTRAINT ganha_ganha_billing_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.ganha_ganha_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  fee_per_point_earned numeric DEFAULT 0.01 NOT NULL,
  fee_per_point_redeemed numeric DEFAULT 0.01 NOT NULL,
  fee_mode text DEFAULT 'UNIFORM'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ganha_ganha_config ADD CONSTRAINT ganha_ganha_config_brand_id_key UNIQUE (brand_id);
ALTER TABLE public.ganha_ganha_config ADD CONSTRAINT ganha_ganha_config_pkey PRIMARY KEY (id);
ALTER TABLE public.ganha_ganha_config ADD CONSTRAINT ganha_ganha_config_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.ganha_ganha_store_fees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  store_id uuid NOT NULL,
  fee_per_point_earned numeric DEFAULT 0.01 NOT NULL,
  fee_per_point_redeemed numeric DEFAULT 0.01 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ganha_ganha_store_fees ADD CONSTRAINT ganha_ganha_store_fees_brand_id_store_id_key UNIQUE (brand_id, store_id);
ALTER TABLE public.ganha_ganha_store_fees ADD CONSTRAINT ganha_ganha_store_fees_pkey PRIMARY KEY (id);
ALTER TABLE public.ganha_ganha_store_fees ADD CONSTRAINT ganha_ganha_store_fees_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.ganha_ganha_store_fees ADD CONSTRAINT ganha_ganha_store_fees_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.home_template_apply_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_by uuid NOT NULL,
  template_id uuid NOT NULL,
  scope_type text DEFAULT 'BRAND'::text NOT NULL,
  scope_id uuid,
  overwrite boolean DEFAULT true NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  finished_at timestamp with time zone,
  logs_json jsonb DEFAULT '[]'::jsonb NOT NULL
);
ALTER TABLE public.home_template_apply_jobs ADD CONSTRAINT home_template_apply_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.home_template_apply_jobs ADD CONSTRAINT home_template_apply_jobs_template_id_fkey FOREIGN KEY (template_id) REFERENCES home_template_library(id) ON DELETE CASCADE;

CREATE TABLE public.home_template_library (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  preview_image_url text,
  template_payload_json jsonb DEFAULT '{"sections": []}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.home_template_library ADD CONSTRAINT home_template_library_key_key UNIQUE (key);
ALTER TABLE public.home_template_library ADD CONSTRAINT home_template_library_pkey PRIMARY KEY (id);

CREATE TABLE public.icon_library (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid,
  name text NOT NULL,
  category text DEFAULT 'geral'::text NOT NULL,
  icon_type text DEFAULT 'lucide'::text NOT NULL,
  lucide_name text,
  image_url text,
  color text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.icon_library ADD CONSTRAINT icon_library_pkey PRIMARY KEY (id);
ALTER TABLE public.icon_library ADD CONSTRAINT icon_library_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.import_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  created_by uuid NOT NULL,
  type text DEFAULT 'STORES'::text NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  file_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  finished_at timestamp with time zone,
  summary_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  error_rows_json jsonb DEFAULT '[]'::jsonb NOT NULL
);
ALTER TABLE public.import_jobs ADD CONSTRAINT import_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.import_jobs ADD CONSTRAINT import_jobs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.import_jobs ADD CONSTRAINT import_jobs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.machine_integrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  api_key text NOT NULL,
  basic_auth_user text DEFAULT ''::text NOT NULL,
  basic_auth_password text DEFAULT ''::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  total_rides integer DEFAULT 0 NOT NULL,
  total_points integer DEFAULT 0 NOT NULL,
  last_webhook_at timestamp with time zone,
  last_ride_processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  callback_url text,
  branch_id uuid,
  webhook_registered boolean DEFAULT false NOT NULL,
  telegram_chat_id text,
  receipt_api_key text,
  preferred_endpoint text DEFAULT 'recibo'::text NOT NULL,
  matrix_api_key text,
  matrix_basic_auth_user text,
  matrix_basic_auth_password text,
  driver_points_enabled boolean DEFAULT false NOT NULL,
  driver_points_percent numeric DEFAULT 50 NOT NULL,
  driver_customer_tag text DEFAULT 'MOTORISTA'::text NOT NULL,
  driver_points_mode text DEFAULT 'PERCENT'::text NOT NULL,
  driver_points_per_real numeric DEFAULT 1 NOT NULL,
  driver_message_enabled boolean DEFAULT false NOT NULL,
  driver_message_frequency text DEFAULT 'EVERY_RIDE'::text NOT NULL,
  driver_message_frequency_value integer
);
ALTER TABLE public.machine_integrations ADD CONSTRAINT machine_integrations_brand_branch_unique UNIQUE (brand_id, branch_id);
ALTER TABLE public.machine_integrations ADD CONSTRAINT machine_integrations_pkey PRIMARY KEY (id);
ALTER TABLE public.machine_integrations ADD CONSTRAINT machine_integrations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.machine_integrations ADD CONSTRAINT machine_integrations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.machine_ride_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  machine_ride_id text NOT NULL,
  status_code text NOT NULL,
  raw_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.machine_ride_events ADD CONSTRAINT machine_ride_events_pkey PRIMARY KEY (id);
ALTER TABLE public.machine_ride_events ADD CONSTRAINT machine_ride_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.machine_ride_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  machine_ride_id text NOT NULL,
  customer_name text,
  customer_phone text,
  customer_cpf_masked text,
  city_name text,
  points_credited integer DEFAULT 0 NOT NULL,
  ride_value numeric(10,2) DEFAULT 0 NOT NULL,
  finalized_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  driver_name text,
  customer_id uuid,
  notification_type text DEFAULT 'PASSENGER'::text NOT NULL
);
ALTER TABLE public.machine_ride_notifications ADD CONSTRAINT machine_ride_notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.machine_ride_notifications ADD CONSTRAINT machine_ride_notifications_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.machine_ride_notifications ADD CONSTRAINT machine_ride_notifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.machine_ride_notifications ADD CONSTRAINT machine_ride_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);

CREATE TABLE public.machine_rides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  machine_ride_id text NOT NULL,
  passenger_cpf text,
  ride_value numeric DEFAULT 0 NOT NULL,
  ride_status text DEFAULT 'PENDING'::text NOT NULL,
  points_credited integer DEFAULT 0 NOT NULL,
  finalized_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  branch_id uuid,
  driver_name text,
  passenger_name text,
  passenger_phone text,
  passenger_email text,
  driver_points_credited integer DEFAULT 0 NOT NULL,
  driver_customer_id uuid,
  driver_id text
);
ALTER TABLE public.machine_rides ADD CONSTRAINT machine_rides_brand_id_machine_ride_id_key UNIQUE (brand_id, machine_ride_id);
ALTER TABLE public.machine_rides ADD CONSTRAINT machine_rides_brand_ride_unique UNIQUE (brand_id, machine_ride_id);
ALTER TABLE public.machine_rides ADD CONSTRAINT machine_rides_pkey PRIMARY KEY (id);
ALTER TABLE public.machine_rides ADD CONSTRAINT machine_rides_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.machine_rides ADD CONSTRAINT machine_rides_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.menu_labels (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  context text DEFAULT 'admin'::text NOT NULL,
  key text NOT NULL,
  custom_label text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.menu_labels ADD CONSTRAINT menu_labels_brand_id_context_key_key UNIQUE (brand_id, context, key);
ALTER TABLE public.menu_labels ADD CONSTRAINT menu_labels_pkey PRIMARY KEY (id);
ALTER TABLE public.menu_labels ADD CONSTRAINT menu_labels_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.mirror_source_catalog (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  source_key text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  is_enabled boolean DEFAULT true NOT NULL,
  scraper_handler text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.mirror_source_catalog ADD CONSTRAINT mirror_source_catalog_source_key_key UNIQUE (source_key);
ALTER TABLE public.mirror_source_catalog ADD CONSTRAINT mirror_source_catalog_pkey PRIMARY KEY (id);

CREATE TABLE public.mirror_sync_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  origin_url text DEFAULT 'https://www.divulgadorinteligente.com/ubizresgata'::text NOT NULL,
  extra_pages text[] DEFAULT '{}'::text[],
  auto_sync_enabled boolean DEFAULT false,
  sync_interval_minutes integer DEFAULT 10,
  max_offers_per_read integer DEFAULT 100,
  max_pages integer DEFAULT 5,
  timeout_seconds integer DEFAULT 30,
  debug_mode boolean DEFAULT false,
  auto_activate boolean DEFAULT true,
  auto_visible_driver boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_type text DEFAULT 'divulgador_inteligente'::text NOT NULL,
  label text,
  is_enabled boolean DEFAULT true NOT NULL
);
ALTER TABLE public.mirror_sync_config ADD CONSTRAINT mirror_sync_config_pkey PRIMARY KEY (id);
ALTER TABLE public.mirror_sync_config ADD CONSTRAINT mirror_sync_config_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.mirror_sync_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  origin text DEFAULT 'divulgador_inteligente'::text NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  finished_at timestamp with time zone,
  total_read integer DEFAULT 0,
  total_new integer DEFAULT 0,
  total_updated integer DEFAULT 0,
  total_skipped integer DEFAULT 0,
  total_errors integer DEFAULT 0,
  status text DEFAULT 'running'::text,
  summary text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.mirror_sync_logs ADD CONSTRAINT mirror_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.mirror_sync_logs ADD CONSTRAINT mirror_sync_logs_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.module_definitions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  category text DEFAULT 'essencial'::text NOT NULL,
  is_core boolean DEFAULT false NOT NULL,
  schema_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  customer_facing boolean DEFAULT false NOT NULL
);
ALTER TABLE public.module_definitions ADD CONSTRAINT module_definitions_key_key UNIQUE (key);
ALTER TABLE public.module_definitions ADD CONSTRAINT module_definitions_pkey PRIMARY KEY (id);
ALTER TABLE public.module_definitions ADD CONSTRAINT module_definitions_category_check CHECK ((category = ANY (ARRAY['essencial'::text, 'comercial'::text, 'fidelidade_pontos'::text, 'engajamento'::text, 'personalizacao'::text, 'governanca'::text, 'inteligencia_dados'::text, 'integracoes'::text])));

CREATE TABLE public.module_definitions_backup_pre_norm (
  id uuid,
  key text,
  name text,
  description text,
  category text,
  is_core boolean,
  schema_json jsonb,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  customer_facing boolean
);

CREATE TABLE public.module_template_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  template_id uuid NOT NULL,
  module_definition_id uuid NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.module_template_items ADD CONSTRAINT module_template_items_template_id_module_definition_id_key UNIQUE (template_id, module_definition_id);
ALTER TABLE public.module_template_items ADD CONSTRAINT module_template_items_pkey PRIMARY KEY (id);
ALTER TABLE public.module_template_items ADD CONSTRAINT module_template_items_module_definition_id_fkey FOREIGN KEY (module_definition_id) REFERENCES module_definitions(id) ON DELETE CASCADE;
ALTER TABLE public.module_template_items ADD CONSTRAINT module_template_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES module_templates(id) ON DELETE CASCADE;

CREATE TABLE public.module_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid
);
ALTER TABLE public.module_templates ADD CONSTRAINT module_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.module_templates ADD CONSTRAINT module_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE public.offer_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  offer_id uuid NOT NULL,
  user_id uuid,
  reason text NOT NULL,
  note text,
  screenshot_url text,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.offer_reports ADD CONSTRAINT offer_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.offer_reports ADD CONSTRAINT offer_reports_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES affiliate_deals(id) ON DELETE CASCADE;
ALTER TABLE public.offer_reports ADD CONSTRAINT offer_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE public.offer_sync_groups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  source_system text NOT NULL,
  source_group_id text NOT NULL,
  source_group_name text,
  last_sync_at timestamp with time zone,
  last_sync_status text DEFAULT 'pending'::text NOT NULL,
  total_imported integer DEFAULT 0 NOT NULL,
  total_active integer DEFAULT 0 NOT NULL,
  total_removed integer DEFAULT 0 NOT NULL,
  total_reported integer DEFAULT 0 NOT NULL,
  sync_version integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.offer_sync_groups ADD CONSTRAINT offer_sync_groups_brand_id_source_system_source_group_id_key UNIQUE (brand_id, source_system, source_group_id);
ALTER TABLE public.offer_sync_groups ADD CONSTRAINT offer_sync_groups_pkey PRIMARY KEY (id);
ALTER TABLE public.offer_sync_groups ADD CONSTRAINT offer_sync_groups_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.offers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  store_id uuid NOT NULL,
  title text NOT NULL,
  image_url text,
  description text,
  value_rescue numeric DEFAULT 0 NOT NULL,
  min_purchase numeric DEFAULT 0 NOT NULL,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  allowed_weekdays integer[] DEFAULT '{0,1,2,3,4,5,6}'::integer[],
  allowed_hours text,
  max_daily_redemptions integer,
  status offer_status DEFAULT 'DRAFT'::offer_status NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  likes_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  coupon_type text DEFAULT 'STORE'::text,
  coupon_category text,
  discount_percent numeric DEFAULT 0,
  scaled_values_json jsonb DEFAULT '[]'::jsonb,
  requires_scheduling boolean DEFAULT false,
  scheduling_advance_hours integer DEFAULT 0,
  is_cumulative boolean DEFAULT true,
  specific_days_json jsonb DEFAULT '[]'::jsonb,
  max_total_uses integer,
  max_uses_per_customer integer,
  interval_between_uses_days integer DEFAULT 0,
  redemption_type text DEFAULT 'PRESENCIAL'::text,
  redemption_branch_id uuid,
  terms_text text,
  terms_accepted_at timestamp with time zone,
  product_id uuid,
  terms_version text,
  terms_params_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  terms_accepted_by_user_id uuid,
  badge_config_json jsonb,
  offer_purpose offer_purpose DEFAULT 'REDEEM'::offer_purpose NOT NULL,
  driver_only boolean DEFAULT false
);
ALTER TABLE public.offers ADD CONSTRAINT offers_pkey PRIMARY KEY (id);
ALTER TABLE public.offers ADD CONSTRAINT offers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.offers ADD CONSTRAINT offers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES store_catalog_items(id);
ALTER TABLE public.offers ADD CONSTRAINT offers_redemption_branch_id_fkey FOREIGN KEY (redemption_branch_id) REFERENCES branches(id);
ALTER TABLE public.offers ADD CONSTRAINT offers_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);

CREATE TABLE public.partner_landing_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  hero_title text DEFAULT 'Seja um Parceiro'::text NOT NULL,
  hero_subtitle text DEFAULT 'Faça parte da maior rede de benefícios da sua região e atraia mais clientes para o seu negócio.'::text NOT NULL,
  hero_image_url text,
  numbers_json jsonb DEFAULT '[{"label": "Usuários ativos", "value": "10.000+"}, {"label": "Parceiros", "value": "500+"}, {"label": "Resgates realizados", "value": "50.000+"}]'::jsonb NOT NULL,
  benefits_json jsonb DEFAULT '[{"icon": "Eye", "title": "Visibilidade", "description": "Apareça para milhares de clientes que buscam ofertas na sua região."}, {"icon": "Heart", "title": "Fidelização", "description": "Fidelize clientes com programa de pontos e cashback automático."}, {"icon": "Zap", "title": "Sem custo inicial", "description": "Comece gratuitamente e pague apenas pelo que usar."}, {"icon": "BarChart3", "title": "Gestão completa", "description": "Painel administrativo para gerenciar ofertas, resgates e métricas."}]'::jsonb NOT NULL,
  how_it_works_json jsonb DEFAULT '[{"step": "1", "title": "Cadastre-se", "description": "Preencha o formulário com os dados do seu estabelecimento."}, {"step": "2", "title": "Configure", "description": "Crie suas ofertas e configure as regras de resgate."}, {"step": "3", "title": "Atraia clientes", "description": "Seus cupons ficam visíveis para todos os usuários do app."}]'::jsonb NOT NULL,
  faq_json jsonb DEFAULT '[{"answer": "O cadastro é gratuito. Você só paga uma pequena taxa por resgate efetivado.", "question": "Quanto custa para participar?"}, {"answer": "Não! Seu estabelecimento aparece automaticamente no aplicativo para todos os usuários.", "question": "Preciso ter um site ou app?"}, {"answer": "Os pagamentos dos clientes são feitos diretamente no seu estabelecimento.", "question": "Como recebo os pagamentos?"}, {"answer": "Sim, não há fidelidade. Você pode pausar ou encerrar sua participação quando quiser.", "question": "Posso cancelar a qualquer momento?"}]'::jsonb NOT NULL,
  cta_title text DEFAULT 'Pronto para crescer?'::text NOT NULL,
  cta_subtitle text DEFAULT 'Cadastre-se agora e comece a receber clientes pelo aplicativo.'::text NOT NULL,
  cta_button_text text DEFAULT 'Quero ser Parceiro'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  logo_url text,
  testimonials_json jsonb DEFAULT '[]'::jsonb,
  social_instagram text,
  social_whatsapp text,
  social_email text,
  cta_link_url text
);
ALTER TABLE public.partner_landing_config ADD CONSTRAINT partner_landing_config_brand_id_key UNIQUE (brand_id);
ALTER TABLE public.partner_landing_config ADD CONSTRAINT partner_landing_config_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_landing_config ADD CONSTRAINT partner_landing_config_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.permission_groups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  icon_name text DEFAULT 'Blocks'::text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.permission_groups ADD CONSTRAINT permission_groups_pkey PRIMARY KEY (id);

CREATE TABLE public.permission_sub_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  permission_id uuid NOT NULL,
  key text NOT NULL,
  display_name text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.permission_sub_items ADD CONSTRAINT permission_sub_items_permission_id_key_key UNIQUE (permission_id, key);
ALTER TABLE public.permission_sub_items ADD CONSTRAINT permission_sub_items_pkey PRIMARY KEY (id);
ALTER TABLE public.permission_sub_items ADD CONSTRAINT permission_sub_items_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

CREATE TABLE public.permission_subgroups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  group_id uuid NOT NULL,
  name text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.permission_subgroups ADD CONSTRAINT permission_subgroups_pkey PRIMARY KEY (id);
ALTER TABLE public.permission_subgroups ADD CONSTRAINT permission_subgroups_group_id_fkey FOREIGN KEY (group_id) REFERENCES permission_groups(id) ON DELETE CASCADE;

CREATE TABLE public.permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  description text,
  module text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  subgroup_id uuid,
  display_name text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true
);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_key_key UNIQUE (key);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_subgroup_id_fkey FOREIGN KEY (subgroup_id) REFERENCES permission_subgroups(id) ON DELETE SET NULL;

CREATE TABLE public.plan_business_models (
  plan_key text NOT NULL,
  business_model_id uuid NOT NULL,
  is_included boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.plan_business_models ADD CONSTRAINT plan_business_models_pkey PRIMARY KEY (plan_key, business_model_id);
ALTER TABLE public.plan_business_models ADD CONSTRAINT plan_business_models_business_model_id_fkey FOREIGN KEY (business_model_id) REFERENCES business_models(id) ON DELETE CASCADE;

CREATE TABLE public.plan_ganha_ganha_pricing (
  plan_key text NOT NULL,
  price_per_point_cents integer NOT NULL,
  min_margin_pct numeric,
  max_margin_pct numeric,
  valid_from timestamp with time zone DEFAULT now() NOT NULL,
  valid_to timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  id uuid DEFAULT gen_random_uuid() NOT NULL
);
ALTER TABLE public.plan_ganha_ganha_pricing ADD CONSTRAINT plan_ganha_ganha_pricing_pkey PRIMARY KEY (id);

CREATE TABLE public.plan_module_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_key text NOT NULL,
  module_definition_id uuid NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.plan_module_templates ADD CONSTRAINT plan_module_templates_plan_key_module_definition_id_key UNIQUE (plan_key, module_definition_id);
ALTER TABLE public.plan_module_templates ADD CONSTRAINT plan_module_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.plan_module_templates ADD CONSTRAINT plan_module_templates_module_definition_id_fkey FOREIGN KEY (module_definition_id) REFERENCES module_definitions(id) ON DELETE CASCADE;

CREATE TABLE public.platform_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  value_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.platform_config ADD CONSTRAINT platform_config_key_key UNIQUE (key);
ALTER TABLE public.platform_config ADD CONSTRAINT platform_config_pkey PRIMARY KEY (id);

CREATE TABLE public.points_ledger (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  entry_type ledger_entry_type NOT NULL,
  points_amount integer DEFAULT 0 NOT NULL,
  money_amount numeric DEFAULT 0 NOT NULL,
  reason text,
  reference_type ledger_reference_type NOT NULL,
  reference_id uuid,
  created_by_user_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.points_ledger ADD CONSTRAINT points_ledger_pkey PRIMARY KEY (id);
ALTER TABLE public.points_ledger ADD CONSTRAINT points_ledger_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.points_ledger ADD CONSTRAINT points_ledger_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.points_ledger ADD CONSTRAINT points_ledger_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.points_package_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  package_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  points_amount integer NOT NULL,
  price_cents integer NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  purchased_by uuid,
  confirmed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  confirmed_at timestamp with time zone
);
ALTER TABLE public.points_package_orders ADD CONSTRAINT points_package_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.points_package_orders ADD CONSTRAINT points_package_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.points_package_orders ADD CONSTRAINT points_package_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.points_package_orders ADD CONSTRAINT points_package_orders_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES auth.users(id);
ALTER TABLE public.points_package_orders ADD CONSTRAINT points_package_orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES points_packages(id) ON DELETE RESTRICT;
ALTER TABLE public.points_package_orders ADD CONSTRAINT points_package_orders_purchased_by_fkey FOREIGN KEY (purchased_by) REFERENCES auth.users(id);

CREATE TABLE public.points_packages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  name text NOT NULL,
  points_amount integer NOT NULL,
  price_cents integer NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.points_packages ADD CONSTRAINT points_packages_pkey PRIMARY KEY (id);
ALTER TABLE public.points_packages ADD CONSTRAINT points_packages_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.points_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  rule_type points_rule_type DEFAULT 'PER_REAL'::points_rule_type NOT NULL,
  points_per_real numeric DEFAULT 1.0 NOT NULL,
  money_per_point numeric DEFAULT 0.01 NOT NULL,
  min_purchase_to_earn numeric DEFAULT 10.0 NOT NULL,
  max_points_per_purchase integer DEFAULT 500 NOT NULL,
  max_points_per_customer_per_day integer DEFAULT 2000 NOT NULL,
  max_points_per_store_per_day integer DEFAULT 10000 NOT NULL,
  require_receipt_code boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  allow_store_custom_rule boolean DEFAULT false NOT NULL,
  store_points_per_real_min numeric DEFAULT 1.0 NOT NULL,
  store_points_per_real_max numeric DEFAULT 3.0 NOT NULL,
  store_rule_requires_approval boolean DEFAULT true NOT NULL
);
ALTER TABLE public.points_rules ADD CONSTRAINT points_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.points_rules ADD CONSTRAINT points_rules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.points_rules ADD CONSTRAINT points_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

CREATE TABLE public.product_redemption_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid,
  customer_id uuid NOT NULL,
  deal_id uuid NOT NULL,
  deal_snapshot_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  affiliate_url text NOT NULL,
  points_spent integer NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_cpf text,
  delivery_cep text NOT NULL,
  delivery_address text NOT NULL,
  delivery_number text NOT NULL,
  delivery_complement text,
  delivery_neighborhood text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  admin_notes text,
  tracking_code text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  order_source text DEFAULT 'driver'::text NOT NULL
);
ALTER TABLE public.product_redemption_orders ADD CONSTRAINT product_redemption_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.product_redemption_orders ADD CONSTRAINT product_redemption_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.product_redemption_orders ADD CONSTRAINT product_redemption_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE public.product_redemption_orders ADD CONSTRAINT product_redemption_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE public.product_redemption_orders ADD CONSTRAINT product_redemption_orders_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES affiliate_deals(id);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  selected_branch_id uuid,
  tenant_id uuid,
  brand_id uuid,
  branch_id uuid,
  phone text,
  is_active boolean DEFAULT true NOT NULL
);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_selected_branch_id_fkey FOREIGN KEY (selected_branch_id) REFERENCES branches(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

CREATE TABLE public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  endpoint text NOT NULL,
  keys_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_customer_id_endpoint_key UNIQUE (customer_id, endpoint);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

CREATE TABLE public.rate_limit_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  window_start timestamp with time zone DEFAULT now() NOT NULL,
  request_count integer DEFAULT 1 NOT NULL
);
ALTER TABLE public.rate_limit_entries ADD CONSTRAINT rate_limit_entries_key_window_start_key UNIQUE (key, window_start);
ALTER TABLE public.rate_limit_entries ADD CONSTRAINT rate_limit_entries_pkey PRIMARY KEY (id);

CREATE TABLE public.redemptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  token text DEFAULT lpad((floor((random() * (1000000)::double precision)))::text, 6, '0'::text) NOT NULL,
  qr_data text,
  status redemption_status DEFAULT 'PENDING'::redemption_status NOT NULL,
  purchase_value numeric,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  used_at timestamp with time zone,
  customer_cpf text,
  offer_snapshot_json jsonb,
  credit_value_applied numeric
);
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_pkey PRIMARY KEY (id);
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES offers(id);

CREATE TABLE public.releases (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  description text,
  payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.releases ADD CONSTRAINT releases_pkey PRIMARY KEY (id);

CREATE TABLE public.role_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

CREATE TABLE public.roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

CREATE TABLE public.section_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  type section_type NOT NULL,
  schema_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.section_templates ADD CONSTRAINT section_templates_key_key UNIQUE (key);
ALTER TABLE public.section_templates ADD CONSTRAINT section_templates_pkey PRIMARY KEY (id);

CREATE TABLE public.segment_synonym_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  free_text text NOT NULL,
  normalized_text text NOT NULL,
  matched_segment_id uuid,
  match_score numeric DEFAULT 0 NOT NULL,
  match_method text,
  was_accepted boolean DEFAULT false NOT NULL,
  store_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.segment_synonym_logs ADD CONSTRAINT segment_synonym_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.segment_synonym_logs ADD CONSTRAINT segment_synonym_logs_matched_segment_id_fkey FOREIGN KEY (matched_segment_id) REFERENCES taxonomy_segments(id) ON DELETE SET NULL;

CREATE TABLE public.sponsored_placements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  store_id uuid NOT NULL,
  starts_at timestamp with time zone DEFAULT now() NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  priority integer DEFAULT 0 NOT NULL,
  placement_type text DEFAULT 'HOME_BOOST'::text NOT NULL,
  notes text,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.sponsored_placements ADD CONSTRAINT sponsored_placements_pkey PRIMARY KEY (id);
ALTER TABLE public.sponsored_placements ADD CONSTRAINT sponsored_placements_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.sponsored_placements ADD CONSTRAINT sponsored_placements_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.store_catalog_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.store_catalog_categories ADD CONSTRAINT store_catalog_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.store_catalog_categories ADD CONSTRAINT store_catalog_categories_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.store_catalog_categories ADD CONSTRAINT store_catalog_categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.store_catalog_categories ADD CONSTRAINT store_catalog_categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.store_catalog_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  category text,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  allow_half boolean DEFAULT false NOT NULL,
  half_price numeric
);
ALTER TABLE public.store_catalog_items ADD CONSTRAINT store_catalog_items_pkey PRIMARY KEY (id);
ALTER TABLE public.store_catalog_items ADD CONSTRAINT store_catalog_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.store_catalog_items ADD CONSTRAINT store_catalog_items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.store_catalog_items ADD CONSTRAINT store_catalog_items_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.store_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.store_documents ADD CONSTRAINT store_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.store_documents ADD CONSTRAINT store_documents_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.store_employees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'operator'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.store_employees ADD CONSTRAINT store_employees_pkey PRIMARY KEY (id);
ALTER TABLE public.store_employees ADD CONSTRAINT store_employees_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE public.store_employees ADD CONSTRAINT store_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE public.store_points_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  store_id uuid NOT NULL,
  points_per_real numeric DEFAULT 1.0 NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_active boolean DEFAULT true NOT NULL,
  status store_rule_status DEFAULT 'PENDING_APPROVAL'::store_rule_status NOT NULL,
  created_by_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  approved_by_user_id uuid,
  approved_at timestamp with time zone
);
ALTER TABLE public.store_points_rules ADD CONSTRAINT store_points_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.store_points_rules ADD CONSTRAINT store_points_rules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.store_points_rules ADD CONSTRAINT store_points_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.store_points_rules ADD CONSTRAINT store_points_rules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);

CREATE TABLE public.store_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.store_products ADD CONSTRAINT store_products_pkey PRIMARY KEY (id);
ALTER TABLE public.store_products ADD CONSTRAINT store_products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.store_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  rating smallint NOT NULL,
  comment text,
  is_approved boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.store_reviews ADD CONSTRAINT store_reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.store_reviews ADD CONSTRAINT store_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE public.store_reviews ADD CONSTRAINT store_reviews_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE public.store_reviews ADD CONSTRAINT store_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

CREATE TABLE public.store_type_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  requested_type text NOT NULL,
  current_type text NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  reason text,
  rejection_reason text,
  requested_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved_at timestamp with time zone,
  resolved_by uuid
);
ALTER TABLE public.store_type_requests ADD CONSTRAINT store_type_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.store_type_requests ADD CONSTRAINT store_type_requests_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.store_type_requests ADD CONSTRAINT store_type_requests_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE TABLE public.stores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  category text,
  address text,
  whatsapp text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  store_type store_type DEFAULT 'RECEPTORA'::store_type NOT NULL,
  approval_status store_approval_status DEFAULT 'DRAFT'::store_approval_status NOT NULL,
  cnpj text,
  segment text,
  tags text[] DEFAULT '{}'::text[],
  email text,
  phone text,
  site_url text,
  instagram text,
  description text,
  banner_url text,
  video_url text,
  gallery_urls text[] DEFAULT '{}'::text[],
  points_per_real numeric DEFAULT 0,
  owner_user_id uuid,
  rejection_reason text,
  submitted_at timestamp with time zone,
  approved_at timestamp with time zone,
  wizard_step integer DEFAULT 0,
  wizard_data_json jsonb DEFAULT '{}'::jsonb,
  taxonomy_segment_id uuid,
  points_rule_text text,
  points_deadline_text text,
  faq_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  store_catalog_config_json jsonb DEFAULT '{}'::jsonb,
  operating_hours_json jsonb DEFAULT '[]'::jsonb
);
ALTER TABLE public.stores ADD CONSTRAINT stores_branch_id_slug_key UNIQUE (branch_id, slug);
ALTER TABLE public.stores ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
ALTER TABLE public.stores ADD CONSTRAINT stores_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.stores ADD CONSTRAINT stores_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.stores ADD CONSTRAINT stores_taxonomy_segment_id_fkey FOREIGN KEY (taxonomy_segment_id) REFERENCES taxonomy_segments(id) ON DELETE SET NULL;

CREATE TABLE public.subscription_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plan_key text NOT NULL,
  label text NOT NULL,
  price_cents integer NOT NULL,
  features text[] DEFAULT '{}'::text[],
  excluded_features text[] DEFAULT '{}'::text[],
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  product_name text,
  slug text NOT NULL,
  price_yearly_cents integer,
  landing_config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_public_listed boolean DEFAULT false NOT NULL,
  trial_days integer DEFAULT 30 NOT NULL
);
ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_plan_key_key UNIQUE (plan_key);
ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);

CREATE TABLE public.taxonomy_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  icon_name text,
  is_active boolean DEFAULT true NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.taxonomy_categories ADD CONSTRAINT taxonomy_categories_slug_key UNIQUE (slug);
ALTER TABLE public.taxonomy_categories ADD CONSTRAINT taxonomy_categories_pkey PRIMARY KEY (id);

CREATE TABLE public.taxonomy_segments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  category_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  aliases text[] DEFAULT '{}'::text[] NOT NULL,
  keywords text[] DEFAULT '{}'::text[] NOT NULL,
  related_segment_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  icon_name text
);
ALTER TABLE public.taxonomy_segments ADD CONSTRAINT taxonomy_segments_category_id_slug_key UNIQUE (category_id, slug);
ALTER TABLE public.taxonomy_segments ADD CONSTRAINT taxonomy_segments_pkey PRIMARY KEY (id);
ALTER TABLE public.taxonomy_segments ADD CONSTRAINT taxonomy_segments_category_id_fkey FOREIGN KEY (category_id) REFERENCES taxonomy_categories(id) ON DELETE CASCADE;

CREATE TABLE public.tenants (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  plan text DEFAULT 'free'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.tenants ADD CONSTRAINT tenants_slug_key UNIQUE (slug);
ALTER TABLE public.tenants ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);

CREATE TABLE public.tier_points_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  tier text NOT NULL,
  points_per_real numeric DEFAULT 1 NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.tier_points_rules ADD CONSTRAINT tier_points_rules_brand_id_branch_id_tier_key UNIQUE (brand_id, branch_id, tier);
ALTER TABLE public.tier_points_rules ADD CONSTRAINT tier_points_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.tier_points_rules ADD CONSTRAINT tier_points_rules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);
ALTER TABLE public.tier_points_rules ADD CONSTRAINT tier_points_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);

CREATE TABLE public.user_permission_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  permission_key text NOT NULL,
  scope_type text NOT NULL,
  scope_id uuid,
  is_allowed boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.user_permission_overrides ADD CONSTRAINT user_permission_overrides_pkey PRIMARY KEY (id);
ALTER TABLE public.user_permission_overrides ADD CONSTRAINT user_permission_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_permission_overrides ADD CONSTRAINT user_permission_overrides_scope_type_check CHECK ((scope_type = ANY (ARRAY['PLATFORM'::text, 'TENANT'::text, 'BRAND'::text, 'BRANCH'::text])));

CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  tenant_id uuid,
  brand_id uuid,
  branch_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_tenant_id_brand_id_branch_id_key UNIQUE (user_id, role, tenant_id, brand_id, branch_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE public.voucher_redemptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  voucher_id uuid NOT NULL,
  redeemed_by uuid NOT NULL,
  redeemed_at timestamp with time zone DEFAULT now() NOT NULL,
  notes text
);
ALTER TABLE public.voucher_redemptions ADD CONSTRAINT voucher_redemptions_pkey PRIMARY KEY (id);
ALTER TABLE public.voucher_redemptions ADD CONSTRAINT voucher_redemptions_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES auth.users(id);
ALTER TABLE public.voucher_redemptions ADD CONSTRAINT voucher_redemptions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE;

CREATE TABLE public.vouchers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  discount_percent numeric(5,2) NOT NULL,
  status voucher_status DEFAULT 'active'::voucher_status NOT NULL,
  max_uses integer DEFAULT 1 NOT NULL,
  current_uses integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone,
  campaign text,
  customer_name text,
  customer_phone text,
  customer_email text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  discount_type text DEFAULT 'PERCENT'::text NOT NULL,
  discount_fixed_value numeric DEFAULT 0 NOT NULL,
  min_purchase numeric DEFAULT 0 NOT NULL,
  start_at timestamp with time zone,
  max_uses_per_customer integer DEFAULT 1 NOT NULL,
  terms text,
  is_public boolean DEFAULT false NOT NULL,
  target_audience text DEFAULT 'ALL'::text NOT NULL,
  redirect_url text,
  bg_color text,
  text_color text
);
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_code_branch_id_key UNIQUE (code, branch_id);
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_discount_percent_check CHECK (((discount_percent > (0)::numeric) AND (discount_percent <= (100)::numeric)));


-- =====================================================================
-- VIEWS
-- =====================================================================

CREATE OR REPLACE VIEW public.audit_logs_safe AS
 SELECT id,
    action,
    actor_user_id,
    entity_type,
    entity_id,
    scope_type,
    scope_id,
    changes_json,
    details_json,
    created_at
   FROM audit_logs;

CREATE OR REPLACE VIEW public.brand_api_keys_safe AS
 SELECT id,
    brand_id,
    label,
    api_key_prefix,
    is_active,
    created_at,
    last_used_at,
    created_by
   FROM brand_api_keys;

CREATE OR REPLACE VIEW public.crm_contacts_safe AS
 SELECT id,
    brand_id,
    branch_id,
    customer_id,
    external_id,
    name,
    source,
    gender,
    os_platform,
        CASE
            WHEN phone IS NOT NULL THEN '***'::text || "right"(phone, 4)
            ELSE NULL::text
        END AS phone_masked,
        CASE
            WHEN email IS NOT NULL THEN ("left"(email, 2) || '***@'::text) || split_part(email, '@'::text, 2)
            ELSE NULL::text
        END AS email_masked,
        CASE
            WHEN cpf IS NOT NULL THEN '***.***.***-'::text || "right"(cpf, 2)
            ELSE NULL::text
        END AS cpf_masked,
    tags_json,
    is_active,
    created_at,
    updated_at,
    ride_count,
    first_ride_at,
    last_ride_at
   FROM crm_contacts;

CREATE OR REPLACE VIEW public.customers_safe AS
 SELECT id,
    user_id,
    brand_id,
    branch_id,
    name,
        CASE
            WHEN phone IS NOT NULL THEN '***'::text || "right"(phone, 4)
            ELSE NULL::text
        END AS phone_masked,
    points_balance,
    money_balance,
    is_active,
    created_at,
    updated_at,
    crm_sync_status,
    ride_count,
    customer_tier
   FROM customers;

CREATE OR REPLACE VIEW public.profiles_safe AS
 SELECT id,
    full_name,
    avatar_url,
    created_at,
    selected_branch_id,
    tenant_id,
    brand_id,
    branch_id,
    is_active
   FROM profiles;

CREATE OR REPLACE VIEW public.public_affiliate_deals_safe AS
 SELECT id,
    brand_id,
    branch_id,
    title,
    description,
    image_url,
    affiliate_url,
    category,
    category_id,
    price,
    original_price,
    store_name,
    store_logo_url,
    badge_label,
    is_active,
    is_featured,
    is_flash_promo,
    is_redeemable,
    redeem_points_cost,
    redeemable_by,
    custom_points_per_real,
    click_count,
    order_index,
    created_at,
    updated_at,
    current_status,
    marketplace,
    source_group_id,
    source_group_name,
    visible_driver
   FROM affiliate_deals;

CREATE OR REPLACE VIEW public.public_brand_modules_safe AS
 SELECT id,
    brand_id,
    module_definition_id,
    is_enabled,
    config_json,
    order_index,
    created_at,
    updated_at
   FROM brand_modules;

CREATE OR REPLACE VIEW public.public_brands_safe AS
 SELECT id,
    name,
    slug,
    is_active,
    subscription_status,
    tenant_id,
    default_theme_id,
    home_layout_json,
    brand_settings_json,
    created_at,
    trial_expires_at,
    subscription_plan
   FROM brands;

CREATE OR REPLACE VIEW public.public_stores_safe AS
 SELECT id,
    name,
    brand_id,
    branch_id,
    is_active,
    segment,
    phone,
    address,
    logo_url,
    banner_url,
    description,
    slug,
    category,
    tags,
    store_type,
    approval_status,
    created_at
   FROM stores;

CREATE OR REPLACE VIEW public.redemptions_safe AS
 SELECT id,
    brand_id,
    branch_id,
    customer_id,
    offer_id,
    token,
    status,
    purchase_value,
    created_at,
    expires_at,
    used_at,
    credit_value_applied,
    offer_snapshot_json
   FROM redemptions;


-- =====================================================================
-- INDICES
-- =====================================================================

CREATE UNIQUE INDEX admin_notifications_pkey ON public.admin_notifications USING btree (id);
CREATE INDEX idx_admin_notifications_brand_id ON public.admin_notifications USING btree (brand_id);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications USING btree (brand_id, is_read) WHERE (is_read = false);
CREATE UNIQUE INDEX affiliate_category_banners_pkey ON public.affiliate_category_banners USING btree (id);
CREATE UNIQUE INDEX affiliate_clicks_pkey ON public.affiliate_clicks USING btree (id);
CREATE UNIQUE INDEX affiliate_deal_categories_pkey ON public.affiliate_deal_categories USING btree (id);
CREATE INDEX idx_affiliate_deal_categories_brand ON public.affiliate_deal_categories USING btree (brand_id);
CREATE UNIQUE INDEX affiliate_deals_pkey ON public.affiliate_deals USING btree (id);
CREATE INDEX idx_affiliate_deals_category_id ON public.affiliate_deals USING btree (category_id);
CREATE INDEX idx_affiliate_deals_current_status ON public.affiliate_deals USING btree (current_status);
CREATE INDEX idx_affiliate_deals_origin ON public.affiliate_deals USING btree (brand_id, origin) WHERE (origin IS NOT NULL);
CREATE UNIQUE INDEX idx_affiliate_deals_origin_hash ON public.affiliate_deals USING btree (brand_id, origin_hash) WHERE (origin_hash IS NOT NULL);
CREATE INDEX idx_affiliate_deals_source_group ON public.affiliate_deals USING btree (origin, source_group_id);
CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);
CREATE INDEX idx_audit_logs_entity_type_id ON public.audit_logs USING btree (entity_type, entity_id);
CREATE UNIQUE INDEX banner_schedules_pkey ON public.banner_schedules USING btree (id);
CREATE UNIQUE INDEX branch_points_wallet_branch_id_key ON public.branch_points_wallet USING btree (branch_id);
CREATE UNIQUE INDEX branch_points_wallet_pkey ON public.branch_points_wallet USING btree (id);
CREATE UNIQUE INDEX branch_wallet_transactions_pkey ON public.branch_wallet_transactions USING btree (id);
CREATE UNIQUE INDEX branches_brand_id_slug_key ON public.branches USING btree (brand_id, slug);
CREATE UNIQUE INDEX branches_pkey ON public.branches USING btree (id);
CREATE UNIQUE INDEX brand_api_keys_pkey ON public.brand_api_keys USING btree (id);
CREATE UNIQUE INDEX brand_business_model_addons_pkey ON public.brand_business_model_addons USING btree (id);
CREATE UNIQUE INDEX brand_business_model_addons_unique ON public.brand_business_model_addons USING btree (brand_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), business_model_id);
CREATE INDEX idx_bbma_branch ON public.brand_business_model_addons USING btree (branch_id) WHERE (branch_id IS NOT NULL);
CREATE INDEX idx_bbma_brand ON public.brand_business_model_addons USING btree (brand_id);
CREATE INDEX idx_bbma_model ON public.brand_business_model_addons USING btree (business_model_id);
CREATE INDEX idx_bbma_status ON public.brand_business_model_addons USING btree (status);
CREATE UNIQUE INDEX brand_business_models_brand_id_business_model_id_key ON public.brand_business_models USING btree (brand_id, business_model_id);
CREATE UNIQUE INDEX brand_business_models_pkey ON public.brand_business_models USING btree (id);
CREATE INDEX idx_bbm_brand ON public.brand_business_models USING btree (brand_id);
CREATE INDEX idx_bbm_brand_format ON public.brand_business_models USING btree (brand_id, engagement_format);
CREATE INDEX idx_bbm_business_model ON public.brand_business_models USING btree (business_model_id);
CREATE UNIQUE INDEX brand_domains_domain_key ON public.brand_domains USING btree (domain);
CREATE UNIQUE INDEX brand_domains_pkey ON public.brand_domains USING btree (id);
CREATE UNIQUE INDEX brand_domains_subdomain_key ON public.brand_domains USING btree (subdomain);
CREATE INDEX idx_brand_domains_subdomain ON public.brand_domains USING btree (subdomain) WHERE (is_active = true);
CREATE UNIQUE INDEX brand_duelo_prizes_brand_id_branch_id_tier_name_position_key ON public.brand_duelo_prizes USING btree (brand_id, branch_id, tier_name, "position");
CREATE UNIQUE INDEX brand_duelo_prizes_pkey ON public.brand_duelo_prizes USING btree (id);
CREATE INDEX idx_brand_duelo_prizes_brand ON public.brand_duelo_prizes USING btree (brand_id);
CREATE UNIQUE INDEX brand_modules_brand_id_module_definition_id_key ON public.brand_modules USING btree (brand_id, module_definition_id);
CREATE UNIQUE INDEX brand_modules_pkey ON public.brand_modules USING btree (id);
CREATE UNIQUE INDEX brand_permission_config_brand_perm_branch_uniq ON public.brand_permission_config USING btree (brand_id, permission_key, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX brand_permission_config_pkey ON public.brand_permission_config USING btree (id);
CREATE INDEX idx_brand_permission_config_brand ON public.brand_permission_config USING btree (brand_id);
CREATE UNIQUE INDEX brand_section_manual_items_pkey ON public.brand_section_manual_items USING btree (id);
CREATE INDEX idx_manual_items_section ON public.brand_section_manual_items USING btree (brand_section_id);
CREATE UNIQUE INDEX brand_section_sources_pkey ON public.brand_section_sources USING btree (id);
CREATE INDEX idx_section_sources_section ON public.brand_section_sources USING btree (brand_section_id);
CREATE UNIQUE INDEX brand_sections_pkey ON public.brand_sections USING btree (id);
CREATE INDEX idx_brand_sections_brand ON public.brand_sections USING btree (brand_id);
CREATE INDEX idx_brand_sections_order ON public.brand_sections USING btree (brand_id, order_index);
CREATE INDEX idx_brand_sections_page_id ON public.brand_sections USING btree (page_id);
CREATE UNIQUE INDEX brand_sub_perm_unique ON public.brand_sub_permission_config USING btree (brand_id, sub_item_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX brand_sub_permission_config_pkey ON public.brand_sub_permission_config USING btree (id);
CREATE UNIQUE INDEX brands_pkey ON public.brands USING btree (id);
CREATE UNIQUE INDEX brands_tenant_id_slug_key ON public.brands USING btree (tenant_id, slug);
CREATE UNIQUE INDEX business_model_modules_pkey ON public.business_model_modules USING btree (business_model_id, module_definition_id);
CREATE INDEX idx_bmm_module ON public.business_model_modules USING btree (module_definition_id);
CREATE UNIQUE INDEX business_models_key_key ON public.business_models USING btree (key);
CREATE UNIQUE INDEX business_models_pkey ON public.business_models USING btree (id);
CREATE INDEX idx_business_models_audience ON public.business_models USING btree (audience);
CREATE INDEX idx_business_models_sort_order ON public.business_models USING btree (sort_order);
CREATE UNIQUE INDEX campeonato_artilharia_window_prizes_season_window_pos_key ON public.campeonato_artilharia_window_prizes USING btree (season_id, window_key, "position");
CREATE UNIQUE INDEX duelo_artilharia_window_prizes_pkey ON public.campeonato_artilharia_window_prizes USING btree (id);
CREATE INDEX idx_campeonato_artilharia_window_prizes_swp ON public.campeonato_artilharia_window_prizes USING btree (season_id, window_key, "position");
CREATE INDEX idx_duelo_artilharia_window_prizes_season ON public.campeonato_artilharia_window_prizes USING btree (season_id);
CREATE UNIQUE INDEX duelo_attempts_log_pkey ON public.campeonato_attempts_log USING btree (id);
CREATE INDEX idx_duelo_attempts_log_code_created ON public.campeonato_attempts_log USING btree (code, created_at DESC);
CREATE INDEX idx_duelo_attempts_log_season ON public.campeonato_attempts_log USING btree (season_id, created_at DESC);
CREATE UNIQUE INDEX duelo_brackets_pkey ON public.campeonato_brackets USING btree (id);
CREATE UNIQUE INDEX duelo_brackets_season_id_round_slot_key ON public.campeonato_brackets USING btree (season_id, round, slot);
CREATE INDEX idx_duelo_brackets_season_round ON public.campeonato_brackets USING btree (season_id, round);
CREATE UNIQUE INDEX duelo_champions_pkey ON public.campeonato_champions USING btree (id);
CREATE UNIQUE INDEX duelo_champions_season_id_key ON public.campeonato_champions USING btree (season_id);
CREATE INDEX idx_duelo_champions_brand_branch ON public.campeonato_champions USING btree (brand_id, branch_id);
CREATE UNIQUE INDEX duelo_classificacao_auditoria_pkey ON public.campeonato_classificacao_auditoria USING btree (id);
CREATE INDEX idx_duelo_audit_brand_branch ON public.campeonato_classificacao_auditoria USING btree (brand_id, branch_id, created_at DESC);
CREATE INDEX idx_duelo_audit_season ON public.campeonato_classificacao_auditoria USING btree (season_id, created_at DESC);
CREATE UNIQUE INDEX duelo_driver_tier_history_pkey ON public.campeonato_driver_tier_history USING btree (id);
CREATE UNIQUE INDEX duelo_driver_tier_history_season_id_driver_id_key ON public.campeonato_driver_tier_history USING btree (season_id, driver_id);
CREATE INDEX idx_duelo_driver_tier_history_brand_branch ON public.campeonato_driver_tier_history USING btree (brand_id, branch_id);
CREATE INDEX idx_duelo_driver_tier_history_driver ON public.campeonato_driver_tier_history USING btree (driver_id);
CREATE UNIQUE INDEX duelo_match_events_pkey ON public.campeonato_match_events USING btree (id);
CREATE INDEX idx_duelo_match_events_bracket_driver ON public.campeonato_match_events USING btree (bracket_id, driver_id);
CREATE UNIQUE INDEX duelo_notifications_pkey ON public.campeonato_notifications USING btree (id);
CREATE INDEX idx_duelo_notif_driver_created ON public.campeonato_notifications USING btree (driver_id, created_at DESC);
CREATE INDEX idx_duelo_notif_driver_unread ON public.campeonato_notifications USING btree (driver_id, read_at) WHERE (read_at IS NULL);
CREATE UNIQUE INDEX duelo_prize_distributions_pkey ON public.campeonato_prize_distributions USING btree (id);
CREATE UNIQUE INDEX duelo_prize_distributions_season_id_driver_id_tier_id_posit_key ON public.campeonato_prize_distributions USING btree (season_id, driver_id, tier_id, "position");
CREATE INDEX idx_duelo_prize_dist_brand ON public.campeonato_prize_distributions USING btree (brand_id, status);
CREATE INDEX idx_duelo_prize_dist_driver ON public.campeonato_prize_distributions USING btree (driver_id);
CREATE INDEX idx_duelo_prize_dist_season_status ON public.campeonato_prize_distributions USING btree (season_id, status);
CREATE UNIQUE INDEX duelo_season_enrollments_pkey ON public.campeonato_season_enrollments USING btree (id);
CREATE UNIQUE INDEX duelo_season_enrollments_season_id_driver_id_key ON public.campeonato_season_enrollments USING btree (season_id, driver_id);
CREATE INDEX idx_dse_brand_branch ON public.campeonato_season_enrollments USING btree (brand_id, branch_id);
CREATE INDEX idx_dse_driver ON public.campeonato_season_enrollments USING btree (driver_id);
CREATE INDEX idx_dse_season_status ON public.campeonato_season_enrollments USING btree (season_id, status);
CREATE UNIQUE INDEX duelo_season_phase_config_pkey ON public.campeonato_season_phase_config USING btree (id);
CREATE UNIQUE INDEX duelo_season_phase_config_season_id_phase_key ON public.campeonato_season_phase_config USING btree (season_id, phase);
CREATE UNIQUE INDEX duelo_season_prizes_pkey ON public.campeonato_season_prizes USING btree (id);
CREATE UNIQUE INDEX duelo_season_prizes_season_id_tier_id_position_key ON public.campeonato_season_prizes USING btree (season_id, tier_id, "position");
CREATE INDEX idx_duelo_season_prizes_season ON public.campeonato_season_prizes USING btree (season_id);
CREATE UNIQUE INDEX duelo_season_standings_pkey ON public.campeonato_season_standings USING btree (id);
CREATE UNIQUE INDEX duelo_season_standings_season_id_driver_id_key ON public.campeonato_season_standings USING btree (season_id, driver_id);
CREATE INDEX idx_duelo_standings_ranking ON public.campeonato_season_standings USING btree (season_id, points DESC, weekend_rides_count DESC, last_ride_at);
CREATE UNIQUE INDEX duelo_season_tiers_pkey ON public.campeonato_season_tiers USING btree (id);
CREATE UNIQUE INDEX duelo_season_tiers_season_id_name_key ON public.campeonato_season_tiers USING btree (season_id, name);
CREATE UNIQUE INDEX duelo_season_tiers_season_id_tier_order_key ON public.campeonato_season_tiers USING btree (season_id, tier_order);
CREATE INDEX idx_duelo_season_tiers_brand_branch ON public.campeonato_season_tiers USING btree (brand_id, branch_id);
CREATE INDEX idx_duelo_season_tiers_season ON public.campeonato_season_tiers USING btree (season_id);
CREATE UNIQUE INDEX campeonato_seasons_active_brand_branch_year_month_key ON public.campeonato_seasons USING btree (brand_id, branch_id, year, month) WHERE (cancelled_at IS NULL);
CREATE UNIQUE INDEX duelo_seasons_pkey ON public.campeonato_seasons USING btree (id);
CREATE INDEX idx_duelo_seasons_active_for_motor ON public.campeonato_seasons USING btree (brand_id, branch_id) WHERE ((phase <> ALL (ARRAY['finished'::text, 'cancelled'::text])) AND (paused_at IS NULL));
CREATE INDEX idx_duelo_seasons_brand_branch_period ON public.campeonato_seasons USING btree (brand_id, branch_id, year DESC, month DESC);
CREATE UNIQUE INDEX duelo_tier_memberships_pkey ON public.campeonato_tier_memberships USING btree (id);
CREATE UNIQUE INDEX duelo_tier_memberships_season_id_driver_id_key ON public.campeonato_tier_memberships USING btree (season_id, driver_id);
CREATE INDEX idx_duelo_tier_memberships_brand_branch ON public.campeonato_tier_memberships USING btree (brand_id, branch_id);
CREATE INDEX idx_duelo_tier_memberships_driver ON public.campeonato_tier_memberships USING btree (driver_id);
CREATE INDEX idx_duelo_tier_memberships_tier ON public.campeonato_tier_memberships USING btree (tier_id);
CREATE UNIQUE INDEX catalog_cart_orders_pkey ON public.catalog_cart_orders USING btree (id);
CREATE UNIQUE INDEX city_belt_champions_branch_id_record_type_key ON public.city_belt_champions USING btree (branch_id, record_type);
CREATE UNIQUE INDEX city_belt_champions_pkey ON public.city_belt_champions USING btree (id);
CREATE UNIQUE INDEX city_business_model_overrides_branch_id_business_model_id_key ON public.city_business_model_overrides USING btree (branch_id, business_model_id);
CREATE UNIQUE INDEX city_business_model_overrides_pkey ON public.city_business_model_overrides USING btree (id);
CREATE INDEX idx_cbmo_branch ON public.city_business_model_overrides USING btree (branch_id);
CREATE INDEX idx_cbmo_brand ON public.city_business_model_overrides USING btree (brand_id);
CREATE INDEX idx_cbmo_business_model ON public.city_business_model_overrides USING btree (business_model_id);
CREATE UNIQUE INDEX city_feed_events_pkey ON public.city_feed_events USING btree (id);
CREATE UNIQUE INDEX city_module_overrides_branch_id_module_definition_id_key ON public.city_module_overrides USING btree (branch_id, module_definition_id);
CREATE UNIQUE INDEX city_module_overrides_pkey ON public.city_module_overrides USING btree (id);
CREATE INDEX idx_cmo_branch ON public.city_module_overrides USING btree (branch_id);
CREATE INDEX idx_cmo_brand ON public.city_module_overrides USING btree (brand_id);
CREATE UNIQUE INDEX commercial_lead_notes_pkey ON public.commercial_lead_notes USING btree (id);
CREATE INDEX idx_commercial_lead_notes_lead_id ON public.commercial_lead_notes USING btree (lead_id, created_at DESC);
CREATE UNIQUE INDEX commercial_leads_pkey ON public.commercial_leads USING btree (id);
CREATE INDEX idx_commercial_leads_assigned_to ON public.commercial_leads USING btree (assigned_to);
CREATE INDEX idx_commercial_leads_created_at ON public.commercial_leads USING btree (created_at DESC);
CREATE INDEX idx_commercial_leads_product_slug ON public.commercial_leads USING btree (product_slug);
CREATE INDEX idx_commercial_leads_status ON public.commercial_leads USING btree (status);
CREATE UNIQUE INDEX coupons_pkey ON public.coupons USING btree (id);
CREATE UNIQUE INDEX cp_contacts_pkey ON public.cp_contacts USING btree (id);
CREATE UNIQUE INDEX cp_notes_pkey ON public.cp_notes USING btree (id);
CREATE UNIQUE INDEX cp_tasks_pkey ON public.cp_tasks USING btree (id);
CREATE UNIQUE INDEX crm_audiences_pkey ON public.crm_audiences USING btree (id);
CREATE UNIQUE INDEX crm_campaign_logs_pkey ON public.crm_campaign_logs USING btree (id);
CREATE INDEX idx_crm_campaign_logs_campaign ON public.crm_campaign_logs USING btree (campaign_id);
CREATE UNIQUE INDEX crm_campaigns_pkey ON public.crm_campaigns USING btree (id);
CREATE INDEX idx_crm_campaigns_brand ON public.crm_campaigns USING btree (brand_id);
CREATE INDEX idx_crm_campaigns_status ON public.crm_campaigns USING btree (brand_id, status);
CREATE UNIQUE INDEX crm_contacts_brand_id_cpf_key ON public.crm_contacts USING btree (brand_id, cpf);
CREATE UNIQUE INDEX crm_contacts_brand_id_customer_id_key ON public.crm_contacts USING btree (brand_id, customer_id) WHERE (customer_id IS NOT NULL);
CREATE UNIQUE INDEX crm_contacts_brand_id_external_id_key ON public.crm_contacts USING btree (brand_id, external_id);
CREATE UNIQUE INDEX crm_contacts_pkey ON public.crm_contacts USING btree (id);
CREATE INDEX idx_crm_contacts_brand ON public.crm_contacts USING btree (brand_id);
CREATE INDEX idx_crm_contacts_customer_id ON public.crm_contacts USING btree (customer_id);
CREATE INDEX idx_crm_contacts_external ON public.crm_contacts USING btree (brand_id, external_id);
CREATE INDEX idx_crm_contacts_source ON public.crm_contacts USING btree (brand_id, source);
CREATE UNIQUE INDEX crm_events_pkey ON public.crm_events USING btree (id);
CREATE INDEX idx_crm_events_brand ON public.crm_events USING btree (brand_id);
CREATE INDEX idx_crm_events_contact ON public.crm_events USING btree (contact_id);
CREATE INDEX idx_crm_events_created ON public.crm_events USING btree (brand_id, created_at DESC);
CREATE INDEX idx_crm_events_type ON public.crm_events USING btree (brand_id, event_type);
CREATE UNIQUE INDEX crm_tiers_pkey ON public.crm_tiers USING btree (id);
CREATE UNIQUE INDEX custom_pages_brand_id_slug_key ON public.custom_pages USING btree (brand_id, slug);
CREATE UNIQUE INDEX custom_pages_pkey ON public.custom_pages USING btree (id);
CREATE UNIQUE INDEX customer_click_events_pkey ON public.customer_click_events USING btree (id);
CREATE INDEX idx_click_events_branch ON public.customer_click_events USING btree (branch_id, entity_type, entity_id);
CREATE INDEX idx_click_events_customer ON public.customer_click_events USING btree (customer_id, created_at DESC);
CREATE UNIQUE INDEX customer_favorite_stores_customer_id_store_id_key ON public.customer_favorite_stores USING btree (customer_id, store_id);
CREATE UNIQUE INDEX customer_favorite_stores_pkey ON public.customer_favorite_stores USING btree (id);
CREATE UNIQUE INDEX customer_favorites_customer_id_offer_id_key ON public.customer_favorites USING btree (customer_id, offer_id);
CREATE UNIQUE INDEX customer_favorites_pkey ON public.customer_favorites USING btree (id);
CREATE INDEX idx_customer_favorites_customer ON public.customer_favorites USING btree (customer_id);
CREATE INDEX idx_customer_favorites_offer ON public.customer_favorites USING btree (offer_id);
CREATE UNIQUE INDEX customer_notifications_pkey ON public.customer_notifications USING btree (id);
CREATE INDEX idx_customer_notifications_customer ON public.customer_notifications USING btree (customer_id);
CREATE INDEX idx_customer_notifications_read ON public.customer_notifications USING btree (customer_id, is_read);
CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);
CREATE INDEX idx_customers_branch_id ON public.customers USING btree (branch_id);
CREATE INDEX idx_customers_brand_branch_active ON public.customers USING btree (brand_id, branch_id, is_active);
CREATE UNIQUE INDEX idx_customers_brand_external_driver ON public.customers USING btree (brand_id, external_driver_id) WHERE (external_driver_id IS NOT NULL);
CREATE INDEX idx_customers_brand_id ON public.customers USING btree (brand_id);
CREATE INDEX idx_customers_cpf ON public.customers USING btree (cpf);
CREATE INDEX idx_customers_crm_contact_id ON public.customers USING btree (crm_contact_id);
CREATE INDEX idx_customers_crm_sync_status ON public.customers USING btree (crm_sync_status);
CREATE INDEX idx_customers_customer_tier ON public.customers USING btree (customer_tier);
CREATE INDEX idx_customers_is_driver ON public.customers USING btree (brand_id, branch_id) WHERE (is_driver = true);
CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);
CREATE INDEX idx_customers_user_id ON public.customers USING btree (user_id);
CREATE UNIQUE INDEX driver_achievements_customer_id_achievement_key_key ON public.driver_achievements USING btree (customer_id, achievement_key);
CREATE UNIQUE INDEX driver_achievements_pkey ON public.driver_achievements USING btree (id);
CREATE UNIQUE INDEX driver_duel_audit_log_pkey ON public.driver_duel_audit_log USING btree (id);
CREATE INDEX idx_duel_audit_log_duel_id ON public.driver_duel_audit_log USING btree (duel_id);
CREATE UNIQUE INDEX driver_duel_guesses_duel_id_customer_id_key ON public.driver_duel_guesses USING btree (duel_id, customer_id);
CREATE UNIQUE INDEX driver_duel_guesses_pkey ON public.driver_duel_guesses USING btree (id);
CREATE INDEX idx_duel_guesses_duel ON public.driver_duel_guesses USING btree (duel_id);
CREATE UNIQUE INDEX driver_duel_participants_customer_id_key ON public.driver_duel_participants USING btree (customer_id);
CREATE UNIQUE INDEX driver_duel_participants_pkey ON public.driver_duel_participants USING btree (id);
CREATE INDEX idx_duel_participants_branch ON public.driver_duel_participants USING btree (branch_id);
CREATE INDEX idx_duel_participants_brand ON public.driver_duel_participants USING btree (brand_id);
CREATE UNIQUE INDEX driver_duel_ratings_pkey ON public.driver_duel_ratings USING btree (id);
CREATE INDEX idx_duel_ratings_rated ON public.driver_duel_ratings USING btree (rated_customer_id);
CREATE UNIQUE INDEX unique_rating_per_duel ON public.driver_duel_ratings USING btree (duel_id, rater_customer_id);
CREATE UNIQUE INDEX driver_duels_pkey ON public.driver_duels USING btree (id);
CREATE INDEX idx_driver_duels_origin ON public.driver_duels USING btree (duel_origin);
CREATE INDEX idx_duels_branch ON public.driver_duels USING btree (branch_id);
CREATE INDEX idx_duels_challenged ON public.driver_duels USING btree (challenged_id);
CREATE INDEX idx_duels_challenger ON public.driver_duels USING btree (challenger_id);
CREATE INDEX idx_duels_sponsored ON public.driver_duels USING btree (sponsored_by_brand) WHERE (sponsored_by_brand = true);
CREATE INDEX idx_duels_status ON public.driver_duels USING btree (status);
CREATE UNIQUE INDEX driver_import_jobs_pkey ON public.driver_import_jobs USING btree (id);
CREATE INDEX idx_driver_import_jobs_brand ON public.driver_import_jobs USING btree (brand_id, created_at DESC);
CREATE UNIQUE INDEX driver_message_flows_pkey ON public.driver_message_flows USING btree (id);
CREATE INDEX idx_driver_message_flows_brand ON public.driver_message_flows USING btree (brand_id);
CREATE INDEX idx_driver_message_flows_event ON public.driver_message_flows USING btree (brand_id, event_type);
CREATE UNIQUE INDEX driver_message_logs_pkey ON public.driver_message_logs USING btree (id);
CREATE INDEX idx_driver_message_logs_brand ON public.driver_message_logs USING btree (brand_id, created_at DESC);
CREATE INDEX idx_driver_message_logs_customer ON public.driver_message_logs USING btree (customer_id, created_at DESC);
CREATE UNIQUE INDEX driver_message_templates_pkey ON public.driver_message_templates USING btree (id);
CREATE INDEX idx_driver_message_templates_brand ON public.driver_message_templates USING btree (brand_id);
CREATE UNIQUE INDEX driver_points_orders_pkey ON public.driver_points_orders USING btree (id);
CREATE UNIQUE INDEX driver_points_purchase_config_brand_id_key ON public.driver_points_purchase_config USING btree (brand_id);
CREATE UNIQUE INDEX driver_points_purchase_config_pkey ON public.driver_points_purchase_config USING btree (id);
CREATE UNIQUE INDEX driver_points_rules_brand_id_branch_id_key ON public.driver_points_rules USING btree (brand_id, branch_id);
CREATE UNIQUE INDEX driver_points_rules_pkey ON public.driver_points_rules USING btree (id);
CREATE UNIQUE INDEX driver_profiles_pkey ON public.driver_profiles USING btree (customer_id);
CREATE INDEX idx_driver_profiles_branch_id ON public.driver_profiles USING btree (branch_id);
CREATE INDEX idx_driver_profiles_brand_id ON public.driver_profiles USING btree (brand_id);
CREATE INDEX idx_driver_profiles_cnh ON public.driver_profiles USING btree (cnh_number) WHERE (cnh_number IS NOT NULL);
CREATE INDEX idx_driver_profiles_external_id ON public.driver_profiles USING btree (external_id) WHERE (external_id IS NOT NULL);
CREATE UNIQUE INDEX driver_verification_codes_pkey ON public.driver_verification_codes USING btree (id);
CREATE INDEX idx_driver_verification_codes_customer ON public.driver_verification_codes USING btree (customer_id, used, expires_at DESC);
CREATE UNIQUE INDEX duel_cycle_reset_history_pkey ON public.duel_cycle_reset_history USING btree (id);
CREATE INDEX idx_dcrh_branch_executed ON public.duel_cycle_reset_history USING btree (branch_id, executed_at DESC);
CREATE INDEX idx_dcrh_brand_executed ON public.duel_cycle_reset_history USING btree (brand_id, executed_at DESC);
CREATE UNIQUE INDEX duel_prize_campaigns_pkey ON public.duel_prize_campaigns USING btree (id);
CREATE INDEX idx_dpc_active_window ON public.duel_prize_campaigns USING btree (branch_id, status, starts_at, ends_at);
CREATE INDEX idx_dpc_branch ON public.duel_prize_campaigns USING btree (branch_id);
CREATE INDEX idx_dpc_brand ON public.duel_prize_campaigns USING btree (brand_id);
CREATE INDEX idx_dpc_status ON public.duel_prize_campaigns USING btree (status);
CREATE UNIQUE INDEX duel_side_bets_pkey ON public.duel_side_bets USING btree (id);
CREATE INDEX idx_duel_side_bets_bettor_a ON public.duel_side_bets USING btree (bettor_a_customer_id);
CREATE INDEX idx_duel_side_bets_bettor_b ON public.duel_side_bets USING btree (bettor_b_customer_id);
CREATE INDEX idx_duel_side_bets_duel_id ON public.duel_side_bets USING btree (duel_id);
CREATE INDEX idx_duel_side_bets_status ON public.duel_side_bets USING btree (status);
CREATE UNIQUE INDEX earning_events_pkey ON public.earning_events USING btree (id);
CREATE INDEX idx_earning_events_branch_id ON public.earning_events USING btree (branch_id);
CREATE INDEX idx_earning_events_brand_id ON public.earning_events USING btree (brand_id);
CREATE INDEX idx_earning_events_created_at ON public.earning_events USING btree (created_at DESC);
CREATE INDEX idx_earning_events_customer_day ON public.earning_events USING btree (customer_id, created_at);
CREATE INDEX idx_earning_events_customer_id ON public.earning_events USING btree (customer_id);
CREATE INDEX idx_earning_events_receipt ON public.earning_events USING btree (store_id, receipt_code) WHERE (receipt_code IS NOT NULL);
CREATE UNIQUE INDEX idx_earning_events_receipt_code_unique ON public.earning_events USING btree (store_id, receipt_code) WHERE (receipt_code IS NOT NULL);
CREATE INDEX idx_earning_events_store_day ON public.earning_events USING btree (store_id, created_at);
CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id);
CREATE INDEX idx_error_logs_brand_id ON public.error_logs USING btree (brand_id) WHERE (brand_id IS NOT NULL);
CREATE INDEX idx_error_logs_created_at ON public.error_logs USING btree (created_at DESC);
CREATE UNIQUE INDEX feature_flags_key_key ON public.feature_flags USING btree (key);
CREATE UNIQUE INDEX feature_flags_pkey ON public.feature_flags USING btree (id);
CREATE UNIQUE INDEX gamification_seasons_pkey ON public.gamification_seasons USING btree (id);
CREATE UNIQUE INDEX ganha_ganha_billing_events_pkey ON public.ganha_ganha_billing_events USING btree (id);
CREATE INDEX idx_gg_billing_brand_created ON public.ganha_ganha_billing_events USING btree (brand_id, created_at DESC);
CREATE INDEX idx_gg_billing_period ON public.ganha_ganha_billing_events USING btree (brand_id, period_month);
CREATE INDEX idx_gg_billing_store ON public.ganha_ganha_billing_events USING btree (store_id, period_month);
CREATE UNIQUE INDEX ganha_ganha_config_brand_id_key ON public.ganha_ganha_config USING btree (brand_id);
CREATE UNIQUE INDEX ganha_ganha_config_pkey ON public.ganha_ganha_config USING btree (id);
CREATE UNIQUE INDEX ganha_ganha_store_fees_brand_id_store_id_key ON public.ganha_ganha_store_fees USING btree (brand_id, store_id);
CREATE UNIQUE INDEX ganha_ganha_store_fees_pkey ON public.ganha_ganha_store_fees USING btree (id);
CREATE UNIQUE INDEX home_template_apply_jobs_pkey ON public.home_template_apply_jobs USING btree (id);
CREATE UNIQUE INDEX home_template_library_key_key ON public.home_template_library USING btree (key);
CREATE UNIQUE INDEX home_template_library_pkey ON public.home_template_library USING btree (id);
CREATE UNIQUE INDEX icon_library_pkey ON public.icon_library USING btree (id);
CREATE UNIQUE INDEX import_jobs_pkey ON public.import_jobs USING btree (id);
CREATE UNIQUE INDEX machine_integrations_brand_branch_unique ON public.machine_integrations USING btree (brand_id, branch_id);
CREATE UNIQUE INDEX machine_integrations_pkey ON public.machine_integrations USING btree (id);
CREATE INDEX idx_machine_ride_events_ride ON public.machine_ride_events USING btree (brand_id, machine_ride_id, created_at DESC);
CREATE UNIQUE INDEX machine_ride_events_pkey ON public.machine_ride_events USING btree (id);
CREATE UNIQUE INDEX machine_ride_notifications_pkey ON public.machine_ride_notifications USING btree (id);
CREATE INDEX idx_machine_rides_branch_id ON public.machine_rides USING btree (branch_id);
CREATE INDEX idx_machine_rides_branch_status ON public.machine_rides USING btree (branch_id, ride_status);
CREATE INDEX idx_machine_rides_brand_id ON public.machine_rides USING btree (brand_id);
CREATE INDEX idx_machine_rides_driver_customer_id ON public.machine_rides USING btree (driver_customer_id);
CREATE INDEX idx_machine_rides_finalized_at ON public.machine_rides USING btree (finalized_at DESC);
CREATE INDEX idx_machine_rides_ride_status ON public.machine_rides USING btree (ride_status);
CREATE UNIQUE INDEX machine_rides_brand_id_machine_ride_id_key ON public.machine_rides USING btree (brand_id, machine_ride_id);
CREATE UNIQUE INDEX machine_rides_brand_ride_unique ON public.machine_rides USING btree (brand_id, machine_ride_id);
CREATE UNIQUE INDEX machine_rides_pkey ON public.machine_rides USING btree (id);
CREATE UNIQUE INDEX menu_labels_brand_id_context_key_key ON public.menu_labels USING btree (brand_id, context, key);
CREATE UNIQUE INDEX menu_labels_pkey ON public.menu_labels USING btree (id);
CREATE UNIQUE INDEX mirror_source_catalog_pkey ON public.mirror_source_catalog USING btree (id);
CREATE UNIQUE INDEX mirror_source_catalog_source_key_key ON public.mirror_source_catalog USING btree (source_key);
CREATE INDEX idx_mirror_sync_config_brand_source ON public.mirror_sync_config USING btree (brand_id, source_type, is_enabled);
CREATE UNIQUE INDEX mirror_sync_config_brand_source_label_unique ON public.mirror_sync_config USING btree (brand_id, source_type, label);
CREATE UNIQUE INDEX mirror_sync_config_pkey ON public.mirror_sync_config USING btree (id);
CREATE UNIQUE INDEX mirror_sync_logs_pkey ON public.mirror_sync_logs USING btree (id);
CREATE UNIQUE INDEX module_definitions_key_key ON public.module_definitions USING btree (key);
CREATE UNIQUE INDEX module_definitions_pkey ON public.module_definitions USING btree (id);
CREATE INDEX idx_module_template_items_template ON public.module_template_items USING btree (template_id);
CREATE UNIQUE INDEX module_template_items_pkey ON public.module_template_items USING btree (id);
CREATE UNIQUE INDEX module_template_items_template_id_module_definition_id_key ON public.module_template_items USING btree (template_id, module_definition_id);
CREATE UNIQUE INDEX module_templates_pkey ON public.module_templates USING btree (id);
CREATE INDEX idx_offer_reports_offer_id ON public.offer_reports USING btree (offer_id);
CREATE INDEX idx_offer_reports_status ON public.offer_reports USING btree (status);
CREATE UNIQUE INDEX offer_reports_pkey ON public.offer_reports USING btree (id);
CREATE INDEX idx_offer_sync_groups_brand ON public.offer_sync_groups USING btree (brand_id, source_system);
CREATE UNIQUE INDEX offer_sync_groups_brand_id_source_system_source_group_id_key ON public.offer_sync_groups USING btree (brand_id, source_system, source_group_id);
CREATE UNIQUE INDEX offer_sync_groups_pkey ON public.offer_sync_groups USING btree (id);
CREATE INDEX idx_offers_branch_active ON public.offers USING btree (brand_id, branch_id, is_active, status);
CREATE INDEX idx_offers_branch_active_status ON public.offers USING btree (branch_id, is_active, status);
CREATE INDEX idx_offers_branch_id ON public.offers USING btree (branch_id);
CREATE INDEX idx_offers_brand_id ON public.offers USING btree (brand_id);
CREATE INDEX idx_offers_coupon_type ON public.offers USING btree (coupon_type);
CREATE INDEX idx_offers_dates ON public.offers USING btree (start_at, end_at) WHERE (is_active = true);
CREATE INDEX idx_offers_is_active ON public.offers USING btree (is_active);
CREATE INDEX idx_offers_product_id ON public.offers USING btree (product_id);
CREATE INDEX idx_offers_status ON public.offers USING btree (status);
CREATE INDEX idx_offers_store_id ON public.offers USING btree (store_id);
CREATE INDEX idx_offers_store_status ON public.offers USING btree (store_id, status, is_active);
CREATE INDEX idx_offers_title_search ON public.offers USING gin (to_tsvector('portuguese'::regconfig, title));
CREATE UNIQUE INDEX offers_pkey ON public.offers USING btree (id);
CREATE UNIQUE INDEX partner_landing_config_brand_id_key ON public.partner_landing_config USING btree (brand_id);
CREATE UNIQUE INDEX partner_landing_config_pkey ON public.partner_landing_config USING btree (id);
CREATE UNIQUE INDEX permission_groups_pkey ON public.permission_groups USING btree (id);
CREATE UNIQUE INDEX permission_sub_items_permission_id_key_key ON public.permission_sub_items USING btree (permission_id, key);
CREATE UNIQUE INDEX permission_sub_items_pkey ON public.permission_sub_items USING btree (id);
CREATE UNIQUE INDEX permission_subgroups_pkey ON public.permission_subgroups USING btree (id);
CREATE UNIQUE INDEX permissions_key_key ON public.permissions USING btree (key);
CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);
CREATE INDEX idx_pbm_business_model ON public.plan_business_models USING btree (business_model_id);
CREATE UNIQUE INDEX plan_business_models_pkey ON public.plan_business_models USING btree (plan_key, business_model_id);
CREATE UNIQUE INDEX plan_ganha_ganha_pricing_active_uniq ON public.plan_ganha_ganha_pricing USING btree (plan_key) WHERE (valid_to IS NULL);
CREATE INDEX plan_ganha_ganha_pricing_history_idx ON public.plan_ganha_ganha_pricing USING btree (plan_key, valid_from DESC);
CREATE UNIQUE INDEX plan_ganha_ganha_pricing_pkey ON public.plan_ganha_ganha_pricing USING btree (id);
CREATE UNIQUE INDEX plan_module_templates_pkey ON public.plan_module_templates USING btree (id);
CREATE UNIQUE INDEX plan_module_templates_plan_key_module_definition_id_key ON public.plan_module_templates USING btree (plan_key, module_definition_id);
CREATE UNIQUE INDEX platform_config_key_key ON public.platform_config USING btree (key);
CREATE UNIQUE INDEX platform_config_pkey ON public.platform_config USING btree (id);
CREATE INDEX idx_points_ledger_branch_id ON public.points_ledger USING btree (branch_id);
CREATE INDEX idx_points_ledger_brand_id ON public.points_ledger USING btree (brand_id);
CREATE INDEX idx_points_ledger_created_at ON public.points_ledger USING btree (created_at DESC);
CREATE INDEX idx_points_ledger_customer ON public.points_ledger USING btree (customer_id, created_at);
CREATE INDEX idx_points_ledger_customer_created ON public.points_ledger USING btree (customer_id, created_at DESC);
CREATE INDEX idx_points_ledger_customer_id ON public.points_ledger USING btree (customer_id);
CREATE INDEX idx_points_ledger_entry_type ON public.points_ledger USING btree (entry_type);
CREATE UNIQUE INDEX points_ledger_pkey ON public.points_ledger USING btree (id);
CREATE UNIQUE INDEX points_package_orders_pkey ON public.points_package_orders USING btree (id);
CREATE UNIQUE INDEX points_packages_pkey ON public.points_packages USING btree (id);
CREATE INDEX idx_points_rules_brand ON public.points_rules USING btree (brand_id, is_active);
CREATE UNIQUE INDEX points_rules_pkey ON public.points_rules USING btree (id);
CREATE INDEX idx_product_redemption_orders_branch_id ON public.product_redemption_orders USING btree (branch_id);
CREATE INDEX idx_product_redemption_orders_branch_status ON public.product_redemption_orders USING btree (branch_id, status);
CREATE INDEX idx_product_redemption_orders_customer_id ON public.product_redemption_orders USING btree (customer_id);
CREATE INDEX idx_product_redemption_orders_status ON public.product_redemption_orders USING btree (status);
CREATE UNIQUE INDEX product_redemption_orders_pkey ON public.product_redemption_orders USING btree (id);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE INDEX idx_push_subscriptions_customer ON public.push_subscriptions USING btree (customer_id);
CREATE UNIQUE INDEX push_subscriptions_customer_id_endpoint_key ON public.push_subscriptions USING btree (customer_id, endpoint);
CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);
CREATE INDEX idx_rate_limit_key_window ON public.rate_limit_entries USING btree (key, window_start);
CREATE UNIQUE INDEX rate_limit_entries_key_window_start_key ON public.rate_limit_entries USING btree (key, window_start);
CREATE UNIQUE INDEX rate_limit_entries_pkey ON public.rate_limit_entries USING btree (id);
CREATE INDEX idx_redemptions_branch_id ON public.redemptions USING btree (branch_id);
CREATE INDEX idx_redemptions_branch_status ON public.redemptions USING btree (brand_id, branch_id, status, created_at);
CREATE INDEX idx_redemptions_created_at ON public.redemptions USING btree (created_at DESC);
CREATE INDEX idx_redemptions_customer_id ON public.redemptions USING btree (customer_id);
CREATE INDEX idx_redemptions_customer_status ON public.redemptions USING btree (customer_id, status);
CREATE INDEX idx_redemptions_offer_id ON public.redemptions USING btree (offer_id);
CREATE INDEX idx_redemptions_status ON public.redemptions USING btree (status);
CREATE INDEX idx_redemptions_status_expires ON public.redemptions USING btree (status, expires_at);
CREATE INDEX idx_redemptions_token_status ON public.redemptions USING btree (token, status);
CREATE UNIQUE INDEX redemptions_pkey ON public.redemptions USING btree (id);
CREATE UNIQUE INDEX releases_pkey ON public.releases USING btree (id);
CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);
CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);
CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);
CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);
CREATE UNIQUE INDEX section_templates_key_key ON public.section_templates USING btree (key);
CREATE UNIQUE INDEX section_templates_pkey ON public.section_templates USING btree (id);
CREATE INDEX idx_segment_synonym_logs_segment ON public.segment_synonym_logs USING btree (matched_segment_id);
CREATE INDEX idx_segment_synonym_logs_text ON public.segment_synonym_logs USING btree (normalized_text);
CREATE UNIQUE INDEX segment_synonym_logs_pkey ON public.segment_synonym_logs USING btree (id);
CREATE INDEX idx_sponsored_active ON public.sponsored_placements USING btree (brand_id, is_active, ends_at);
CREATE UNIQUE INDEX sponsored_placements_pkey ON public.sponsored_placements USING btree (id);
CREATE UNIQUE INDEX store_catalog_categories_pkey ON public.store_catalog_categories USING btree (id);
CREATE INDEX idx_store_catalog_store ON public.store_catalog_items USING btree (store_id);
CREATE UNIQUE INDEX store_catalog_items_pkey ON public.store_catalog_items USING btree (id);
CREATE INDEX idx_store_documents_store ON public.store_documents USING btree (store_id);
CREATE UNIQUE INDEX store_documents_pkey ON public.store_documents USING btree (id);
CREATE INDEX idx_store_employees_store_id ON public.store_employees USING btree (store_id);
CREATE UNIQUE INDEX store_employees_pkey ON public.store_employees USING btree (id);
CREATE INDEX idx_store_points_rules_branch ON public.store_points_rules USING btree (branch_id, status);
CREATE INDEX idx_store_points_rules_store ON public.store_points_rules USING btree (store_id, status, is_active);
CREATE UNIQUE INDEX store_points_rules_pkey ON public.store_points_rules USING btree (id);
CREATE INDEX idx_store_products_branch_id ON public.store_products USING btree (branch_id);
CREATE INDEX idx_store_products_brand_id ON public.store_products USING btree (brand_id);
CREATE INDEX idx_store_products_store_id ON public.store_products USING btree (store_id);
CREATE UNIQUE INDEX store_products_pkey ON public.store_products USING btree (id);
CREATE UNIQUE INDEX store_reviews_customer_store_unique ON public.store_reviews USING btree (store_id, customer_id);
CREATE UNIQUE INDEX store_reviews_pkey ON public.store_reviews USING btree (id);
CREATE UNIQUE INDEX store_type_requests_pkey ON public.store_type_requests USING btree (id);
CREATE INDEX idx_stores_approval ON public.stores USING btree (approval_status);
CREATE INDEX idx_stores_approval_status ON public.stores USING btree (approval_status);
CREATE INDEX idx_stores_branch_active ON public.stores USING btree (brand_id, branch_id, is_active);
CREATE INDEX idx_stores_branch_active_approval ON public.stores USING btree (branch_id, is_active, approval_status);
CREATE INDEX idx_stores_branch_id ON public.stores USING btree (branch_id);
CREATE INDEX idx_stores_brand_id ON public.stores USING btree (brand_id);
CREATE INDEX idx_stores_name_search ON public.stores USING gin (to_tsvector('portuguese'::regconfig, name));
CREATE INDEX idx_stores_owner ON public.stores USING btree (owner_user_id);
CREATE INDEX idx_stores_owner_user_id ON public.stores USING btree (owner_user_id);
CREATE INDEX idx_stores_taxonomy_segment_id ON public.stores USING btree (taxonomy_segment_id);
CREATE INDEX idx_stores_type ON public.stores USING btree (store_type);
CREATE UNIQUE INDEX stores_branch_id_slug_key ON public.stores USING btree (branch_id, slug);
CREATE UNIQUE INDEX stores_pkey ON public.stores USING btree (id);
CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);
CREATE UNIQUE INDEX subscription_plans_plan_key_key ON public.subscription_plans USING btree (plan_key);
CREATE UNIQUE INDEX subscription_plans_slug_unique ON public.subscription_plans USING btree (slug);
CREATE INDEX idx_taxonomy_categories_slug ON public.taxonomy_categories USING btree (slug);
CREATE UNIQUE INDEX taxonomy_categories_pkey ON public.taxonomy_categories USING btree (id);
CREATE UNIQUE INDEX taxonomy_categories_slug_key ON public.taxonomy_categories USING btree (slug);
CREATE INDEX idx_taxonomy_segments_aliases ON public.taxonomy_segments USING gin (aliases);
CREATE INDEX idx_taxonomy_segments_category ON public.taxonomy_segments USING btree (category_id);
CREATE INDEX idx_taxonomy_segments_keywords ON public.taxonomy_segments USING gin (keywords);
CREATE INDEX idx_taxonomy_segments_name_trgm ON public.taxonomy_segments USING gin (name extensions.gin_trgm_ops);
CREATE UNIQUE INDEX taxonomy_segments_category_id_slug_key ON public.taxonomy_segments USING btree (category_id, slug);
CREATE UNIQUE INDEX taxonomy_segments_pkey ON public.taxonomy_segments USING btree (id);
CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);
CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);
CREATE UNIQUE INDEX tier_points_rules_brand_id_branch_id_tier_key ON public.tier_points_rules USING btree (brand_id, branch_id, tier);
CREATE UNIQUE INDEX tier_points_rules_pkey ON public.tier_points_rules USING btree (id);
CREATE UNIQUE INDEX upo_user_perm_scope_idx ON public.user_permission_overrides USING btree (user_id, permission_key, scope_type, scope_id) WHERE (scope_id IS NOT NULL);
CREATE UNIQUE INDEX upo_user_perm_scope_null_idx ON public.user_permission_overrides USING btree (user_id, permission_key, scope_type) WHERE (scope_id IS NULL);
CREATE UNIQUE INDEX user_permission_overrides_pkey ON public.user_permission_overrides USING btree (id);
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);
CREATE UNIQUE INDEX user_roles_user_id_role_tenant_id_brand_id_branch_id_key ON public.user_roles USING btree (user_id, role, tenant_id, brand_id, branch_id);
CREATE UNIQUE INDEX voucher_redemptions_pkey ON public.voucher_redemptions USING btree (id);
CREATE UNIQUE INDEX vouchers_code_branch_id_key ON public.vouchers USING btree (code, branch_id);
CREATE UNIQUE INDEX vouchers_pkey ON public.vouchers USING btree (id);


-- =====================================================================
-- GRANTS (Data API)
-- =====================================================================

GRANT DELETE ON public.admin_notifications TO anon;
GRANT INSERT ON public.admin_notifications TO anon;
GRANT REFERENCES ON public.admin_notifications TO anon;
GRANT SELECT ON public.admin_notifications TO anon;
GRANT TRIGGER ON public.admin_notifications TO anon;
GRANT TRUNCATE ON public.admin_notifications TO anon;
GRANT UPDATE ON public.admin_notifications TO anon;
GRANT DELETE ON public.admin_notifications TO authenticated;
GRANT INSERT ON public.admin_notifications TO authenticated;
GRANT REFERENCES ON public.admin_notifications TO authenticated;
GRANT SELECT ON public.admin_notifications TO authenticated;
GRANT TRIGGER ON public.admin_notifications TO authenticated;
GRANT TRUNCATE ON public.admin_notifications TO authenticated;
GRANT UPDATE ON public.admin_notifications TO authenticated;
GRANT DELETE ON public.admin_notifications TO service_role;
GRANT INSERT ON public.admin_notifications TO service_role;
GRANT REFERENCES ON public.admin_notifications TO service_role;
GRANT SELECT ON public.admin_notifications TO service_role;
GRANT TRIGGER ON public.admin_notifications TO service_role;
GRANT TRUNCATE ON public.admin_notifications TO service_role;
GRANT UPDATE ON public.admin_notifications TO service_role;
GRANT DELETE ON public.affiliate_category_banners TO anon;
GRANT INSERT ON public.affiliate_category_banners TO anon;
GRANT REFERENCES ON public.affiliate_category_banners TO anon;
GRANT SELECT ON public.affiliate_category_banners TO anon;
GRANT TRIGGER ON public.affiliate_category_banners TO anon;
GRANT TRUNCATE ON public.affiliate_category_banners TO anon;
GRANT UPDATE ON public.affiliate_category_banners TO anon;
GRANT DELETE ON public.affiliate_category_banners TO authenticated;
GRANT INSERT ON public.affiliate_category_banners TO authenticated;
GRANT REFERENCES ON public.affiliate_category_banners TO authenticated;
GRANT SELECT ON public.affiliate_category_banners TO authenticated;
GRANT TRIGGER ON public.affiliate_category_banners TO authenticated;
GRANT TRUNCATE ON public.affiliate_category_banners TO authenticated;
GRANT UPDATE ON public.affiliate_category_banners TO authenticated;
GRANT DELETE ON public.affiliate_category_banners TO service_role;
GRANT INSERT ON public.affiliate_category_banners TO service_role;
GRANT REFERENCES ON public.affiliate_category_banners TO service_role;
GRANT SELECT ON public.affiliate_category_banners TO service_role;
GRANT TRIGGER ON public.affiliate_category_banners TO service_role;
GRANT TRUNCATE ON public.affiliate_category_banners TO service_role;
GRANT UPDATE ON public.affiliate_category_banners TO service_role;
GRANT DELETE ON public.affiliate_clicks TO anon;
GRANT INSERT ON public.affiliate_clicks TO anon;
GRANT REFERENCES ON public.affiliate_clicks TO anon;
GRANT SELECT ON public.affiliate_clicks TO anon;
GRANT TRIGGER ON public.affiliate_clicks TO anon;
GRANT TRUNCATE ON public.affiliate_clicks TO anon;
GRANT UPDATE ON public.affiliate_clicks TO anon;
GRANT DELETE ON public.affiliate_clicks TO authenticated;
GRANT INSERT ON public.affiliate_clicks TO authenticated;
GRANT REFERENCES ON public.affiliate_clicks TO authenticated;
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT TRIGGER ON public.affiliate_clicks TO authenticated;
GRANT TRUNCATE ON public.affiliate_clicks TO authenticated;
GRANT UPDATE ON public.affiliate_clicks TO authenticated;
GRANT DELETE ON public.affiliate_clicks TO service_role;
GRANT INSERT ON public.affiliate_clicks TO service_role;
GRANT REFERENCES ON public.affiliate_clicks TO service_role;
GRANT SELECT ON public.affiliate_clicks TO service_role;
GRANT TRIGGER ON public.affiliate_clicks TO service_role;
GRANT TRUNCATE ON public.affiliate_clicks TO service_role;
GRANT UPDATE ON public.affiliate_clicks TO service_role;
GRANT DELETE ON public.affiliate_deal_categories TO anon;
GRANT INSERT ON public.affiliate_deal_categories TO anon;
GRANT REFERENCES ON public.affiliate_deal_categories TO anon;
GRANT SELECT ON public.affiliate_deal_categories TO anon;
GRANT TRIGGER ON public.affiliate_deal_categories TO anon;
GRANT TRUNCATE ON public.affiliate_deal_categories TO anon;
GRANT UPDATE ON public.affiliate_deal_categories TO anon;
GRANT DELETE ON public.affiliate_deal_categories TO authenticated;
GRANT INSERT ON public.affiliate_deal_categories TO authenticated;
GRANT REFERENCES ON public.affiliate_deal_categories TO authenticated;
GRANT SELECT ON public.affiliate_deal_categories TO authenticated;
GRANT TRIGGER ON public.affiliate_deal_categories TO authenticated;
GRANT TRUNCATE ON public.affiliate_deal_categories TO authenticated;
GRANT UPDATE ON public.affiliate_deal_categories TO authenticated;
GRANT DELETE ON public.affiliate_deal_categories TO service_role;
GRANT INSERT ON public.affiliate_deal_categories TO service_role;
GRANT REFERENCES ON public.affiliate_deal_categories TO service_role;
GRANT SELECT ON public.affiliate_deal_categories TO service_role;
GRANT TRIGGER ON public.affiliate_deal_categories TO service_role;
GRANT TRUNCATE ON public.affiliate_deal_categories TO service_role;
GRANT UPDATE ON public.affiliate_deal_categories TO service_role;
GRANT DELETE ON public.affiliate_deals TO anon;
GRANT INSERT ON public.affiliate_deals TO anon;
GRANT REFERENCES ON public.affiliate_deals TO anon;
GRANT SELECT ON public.affiliate_deals TO anon;
GRANT TRIGGER ON public.affiliate_deals TO anon;
GRANT TRUNCATE ON public.affiliate_deals TO anon;
GRANT UPDATE ON public.affiliate_deals TO anon;
GRANT DELETE ON public.affiliate_deals TO authenticated;
GRANT INSERT ON public.affiliate_deals TO authenticated;
GRANT REFERENCES ON public.affiliate_deals TO authenticated;
GRANT SELECT ON public.affiliate_deals TO authenticated;
GRANT TRIGGER ON public.affiliate_deals TO authenticated;
GRANT TRUNCATE ON public.affiliate_deals TO authenticated;
GRANT UPDATE ON public.affiliate_deals TO authenticated;
GRANT DELETE ON public.affiliate_deals TO service_role;
GRANT INSERT ON public.affiliate_deals TO service_role;
GRANT REFERENCES ON public.affiliate_deals TO service_role;
GRANT SELECT ON public.affiliate_deals TO service_role;
GRANT TRIGGER ON public.affiliate_deals TO service_role;
GRANT TRUNCATE ON public.affiliate_deals TO service_role;
GRANT UPDATE ON public.affiliate_deals TO service_role;
GRANT DELETE ON public.audit_logs TO anon;
GRANT INSERT ON public.audit_logs TO anon;
GRANT REFERENCES ON public.audit_logs TO anon;
GRANT SELECT ON public.audit_logs TO anon;
GRANT TRIGGER ON public.audit_logs TO anon;
GRANT TRUNCATE ON public.audit_logs TO anon;
GRANT UPDATE ON public.audit_logs TO anon;
GRANT DELETE ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT REFERENCES ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT TRIGGER ON public.audit_logs TO authenticated;
GRANT TRUNCATE ON public.audit_logs TO authenticated;
GRANT UPDATE ON public.audit_logs TO authenticated;
GRANT DELETE ON public.audit_logs TO service_role;
GRANT INSERT ON public.audit_logs TO service_role;
GRANT REFERENCES ON public.audit_logs TO service_role;
GRANT SELECT ON public.audit_logs TO service_role;
GRANT TRIGGER ON public.audit_logs TO service_role;
GRANT TRUNCATE ON public.audit_logs TO service_role;
GRANT UPDATE ON public.audit_logs TO service_role;
GRANT DELETE ON public.audit_logs_safe TO anon;
GRANT INSERT ON public.audit_logs_safe TO anon;
GRANT REFERENCES ON public.audit_logs_safe TO anon;
GRANT SELECT ON public.audit_logs_safe TO anon;
GRANT TRIGGER ON public.audit_logs_safe TO anon;
GRANT TRUNCATE ON public.audit_logs_safe TO anon;
GRANT UPDATE ON public.audit_logs_safe TO anon;
GRANT DELETE ON public.audit_logs_safe TO authenticated;
GRANT INSERT ON public.audit_logs_safe TO authenticated;
GRANT REFERENCES ON public.audit_logs_safe TO authenticated;
GRANT SELECT ON public.audit_logs_safe TO authenticated;
GRANT TRIGGER ON public.audit_logs_safe TO authenticated;
GRANT TRUNCATE ON public.audit_logs_safe TO authenticated;
GRANT UPDATE ON public.audit_logs_safe TO authenticated;
GRANT DELETE ON public.audit_logs_safe TO service_role;
GRANT INSERT ON public.audit_logs_safe TO service_role;
GRANT REFERENCES ON public.audit_logs_safe TO service_role;
GRANT SELECT ON public.audit_logs_safe TO service_role;
GRANT TRIGGER ON public.audit_logs_safe TO service_role;
GRANT TRUNCATE ON public.audit_logs_safe TO service_role;
GRANT UPDATE ON public.audit_logs_safe TO service_role;
GRANT DELETE ON public.banner_schedules TO anon;
GRANT INSERT ON public.banner_schedules TO anon;
GRANT REFERENCES ON public.banner_schedules TO anon;
GRANT SELECT ON public.banner_schedules TO anon;
GRANT TRIGGER ON public.banner_schedules TO anon;
GRANT TRUNCATE ON public.banner_schedules TO anon;
GRANT UPDATE ON public.banner_schedules TO anon;
GRANT DELETE ON public.banner_schedules TO authenticated;
GRANT INSERT ON public.banner_schedules TO authenticated;
GRANT REFERENCES ON public.banner_schedules TO authenticated;
GRANT SELECT ON public.banner_schedules TO authenticated;
GRANT TRIGGER ON public.banner_schedules TO authenticated;
GRANT TRUNCATE ON public.banner_schedules TO authenticated;
GRANT UPDATE ON public.banner_schedules TO authenticated;
GRANT DELETE ON public.banner_schedules TO service_role;
GRANT INSERT ON public.banner_schedules TO service_role;
GRANT REFERENCES ON public.banner_schedules TO service_role;
GRANT SELECT ON public.banner_schedules TO service_role;
GRANT TRIGGER ON public.banner_schedules TO service_role;
GRANT TRUNCATE ON public.banner_schedules TO service_role;
GRANT UPDATE ON public.banner_schedules TO service_role;
GRANT DELETE ON public.branch_points_wallet TO anon;
GRANT INSERT ON public.branch_points_wallet TO anon;
GRANT REFERENCES ON public.branch_points_wallet TO anon;
GRANT SELECT ON public.branch_points_wallet TO anon;
GRANT TRIGGER ON public.branch_points_wallet TO anon;
GRANT TRUNCATE ON public.branch_points_wallet TO anon;
GRANT UPDATE ON public.branch_points_wallet TO anon;
GRANT DELETE ON public.branch_points_wallet TO authenticated;
GRANT INSERT ON public.branch_points_wallet TO authenticated;
GRANT REFERENCES ON public.branch_points_wallet TO authenticated;
GRANT SELECT ON public.branch_points_wallet TO authenticated;
GRANT TRIGGER ON public.branch_points_wallet TO authenticated;
GRANT TRUNCATE ON public.branch_points_wallet TO authenticated;
GRANT UPDATE ON public.branch_points_wallet TO authenticated;
GRANT DELETE ON public.branch_points_wallet TO service_role;
GRANT INSERT ON public.branch_points_wallet TO service_role;
GRANT REFERENCES ON public.branch_points_wallet TO service_role;
GRANT SELECT ON public.branch_points_wallet TO service_role;
GRANT TRIGGER ON public.branch_points_wallet TO service_role;
GRANT TRUNCATE ON public.branch_points_wallet TO service_role;
GRANT UPDATE ON public.branch_points_wallet TO service_role;
GRANT DELETE ON public.branch_wallet_transactions TO anon;
GRANT INSERT ON public.branch_wallet_transactions TO anon;
GRANT REFERENCES ON public.branch_wallet_transactions TO anon;
GRANT SELECT ON public.branch_wallet_transactions TO anon;
GRANT TRIGGER ON public.branch_wallet_transactions TO anon;
GRANT TRUNCATE ON public.branch_wallet_transactions TO anon;
GRANT UPDATE ON public.branch_wallet_transactions TO anon;
GRANT DELETE ON public.branch_wallet_transactions TO authenticated;
GRANT INSERT ON public.branch_wallet_transactions TO authenticated;
GRANT REFERENCES ON public.branch_wallet_transactions TO authenticated;
GRANT SELECT ON public.branch_wallet_transactions TO authenticated;
GRANT TRIGGER ON public.branch_wallet_transactions TO authenticated;
GRANT TRUNCATE ON public.branch_wallet_transactions TO authenticated;
GRANT UPDATE ON public.branch_wallet_transactions TO authenticated;
GRANT DELETE ON public.branch_wallet_transactions TO service_role;
GRANT INSERT ON public.branch_wallet_transactions TO service_role;
GRANT REFERENCES ON public.branch_wallet_transactions TO service_role;
GRANT SELECT ON public.branch_wallet_transactions TO service_role;
GRANT TRIGGER ON public.branch_wallet_transactions TO service_role;
GRANT TRUNCATE ON public.branch_wallet_transactions TO service_role;
GRANT UPDATE ON public.branch_wallet_transactions TO service_role;
GRANT DELETE ON public.branches TO anon;
GRANT INSERT ON public.branches TO anon;
GRANT REFERENCES ON public.branches TO anon;
GRANT SELECT ON public.branches TO anon;
GRANT TRIGGER ON public.branches TO anon;
GRANT TRUNCATE ON public.branches TO anon;
GRANT UPDATE ON public.branches TO anon;
GRANT DELETE ON public.branches TO authenticated;
GRANT INSERT ON public.branches TO authenticated;
GRANT REFERENCES ON public.branches TO authenticated;
GRANT SELECT ON public.branches TO authenticated;
GRANT TRIGGER ON public.branches TO authenticated;
GRANT TRUNCATE ON public.branches TO authenticated;
GRANT UPDATE ON public.branches TO authenticated;
GRANT DELETE ON public.branches TO service_role;
GRANT INSERT ON public.branches TO service_role;
GRANT REFERENCES ON public.branches TO service_role;
GRANT SELECT ON public.branches TO service_role;
GRANT TRIGGER ON public.branches TO service_role;
GRANT TRUNCATE ON public.branches TO service_role;
GRANT UPDATE ON public.branches TO service_role;
GRANT DELETE ON public.brand_api_keys TO anon;
GRANT INSERT ON public.brand_api_keys TO anon;
GRANT REFERENCES ON public.brand_api_keys TO anon;
GRANT SELECT ON public.brand_api_keys TO anon;
GRANT TRIGGER ON public.brand_api_keys TO anon;
GRANT TRUNCATE ON public.brand_api_keys TO anon;
GRANT UPDATE ON public.brand_api_keys TO anon;
GRANT DELETE ON public.brand_api_keys TO authenticated;
GRANT INSERT ON public.brand_api_keys TO authenticated;
GRANT REFERENCES ON public.brand_api_keys TO authenticated;
GRANT SELECT ON public.brand_api_keys TO authenticated;
GRANT TRIGGER ON public.brand_api_keys TO authenticated;
GRANT TRUNCATE ON public.brand_api_keys TO authenticated;
GRANT UPDATE ON public.brand_api_keys TO authenticated;
GRANT DELETE ON public.brand_api_keys TO service_role;
GRANT INSERT ON public.brand_api_keys TO service_role;
GRANT REFERENCES ON public.brand_api_keys TO service_role;
GRANT SELECT ON public.brand_api_keys TO service_role;
GRANT TRIGGER ON public.brand_api_keys TO service_role;
GRANT TRUNCATE ON public.brand_api_keys TO service_role;
GRANT UPDATE ON public.brand_api_keys TO service_role;
GRANT DELETE ON public.brand_api_keys_safe TO anon;
GRANT INSERT ON public.brand_api_keys_safe TO anon;
GRANT REFERENCES ON public.brand_api_keys_safe TO anon;
GRANT SELECT ON public.brand_api_keys_safe TO anon;
GRANT TRIGGER ON public.brand_api_keys_safe TO anon;
GRANT TRUNCATE ON public.brand_api_keys_safe TO anon;
GRANT UPDATE ON public.brand_api_keys_safe TO anon;
GRANT DELETE ON public.brand_api_keys_safe TO authenticated;
GRANT INSERT ON public.brand_api_keys_safe TO authenticated;
GRANT REFERENCES ON public.brand_api_keys_safe TO authenticated;
GRANT SELECT ON public.brand_api_keys_safe TO authenticated;
GRANT TRIGGER ON public.brand_api_keys_safe TO authenticated;
GRANT TRUNCATE ON public.brand_api_keys_safe TO authenticated;
GRANT UPDATE ON public.brand_api_keys_safe TO authenticated;
GRANT DELETE ON public.brand_api_keys_safe TO service_role;
GRANT INSERT ON public.brand_api_keys_safe TO service_role;
GRANT REFERENCES ON public.brand_api_keys_safe TO service_role;
GRANT SELECT ON public.brand_api_keys_safe TO service_role;
GRANT TRIGGER ON public.brand_api_keys_safe TO service_role;
GRANT TRUNCATE ON public.brand_api_keys_safe TO service_role;
GRANT UPDATE ON public.brand_api_keys_safe TO service_role;
GRANT DELETE ON public.brand_business_model_addons TO anon;
GRANT INSERT ON public.brand_business_model_addons TO anon;
GRANT REFERENCES ON public.brand_business_model_addons TO anon;
GRANT SELECT ON public.brand_business_model_addons TO anon;
GRANT TRIGGER ON public.brand_business_model_addons TO anon;
GRANT TRUNCATE ON public.brand_business_model_addons TO anon;
GRANT UPDATE ON public.brand_business_model_addons TO anon;
GRANT DELETE ON public.brand_business_model_addons TO authenticated;
GRANT INSERT ON public.brand_business_model_addons TO authenticated;
GRANT REFERENCES ON public.brand_business_model_addons TO authenticated;
GRANT SELECT ON public.brand_business_model_addons TO authenticated;
GRANT TRIGGER ON public.brand_business_model_addons TO authenticated;
GRANT TRUNCATE ON public.brand_business_model_addons TO authenticated;
GRANT UPDATE ON public.brand_business_model_addons TO authenticated;
GRANT DELETE ON public.brand_business_model_addons TO service_role;
GRANT INSERT ON public.brand_business_model_addons TO service_role;
GRANT REFERENCES ON public.brand_business_model_addons TO service_role;
GRANT SELECT ON public.brand_business_model_addons TO service_role;
GRANT TRIGGER ON public.brand_business_model_addons TO service_role;
GRANT TRUNCATE ON public.brand_business_model_addons TO service_role;
GRANT UPDATE ON public.brand_business_model_addons TO service_role;
GRANT DELETE ON public.brand_business_models TO anon;
GRANT INSERT ON public.brand_business_models TO anon;
GRANT REFERENCES ON public.brand_business_models TO anon;
GRANT SELECT ON public.brand_business_models TO anon;
GRANT TRIGGER ON public.brand_business_models TO anon;
GRANT TRUNCATE ON public.brand_business_models TO anon;
GRANT UPDATE ON public.brand_business_models TO anon;
GRANT DELETE ON public.brand_business_models TO authenticated;
GRANT INSERT ON public.brand_business_models TO authenticated;
GRANT REFERENCES ON public.brand_business_models TO authenticated;
GRANT SELECT ON public.brand_business_models TO authenticated;
GRANT TRIGGER ON public.brand_business_models TO authenticated;
GRANT TRUNCATE ON public.brand_business_models TO authenticated;
GRANT UPDATE ON public.brand_business_models TO authenticated;
GRANT DELETE ON public.brand_business_models TO service_role;
GRANT INSERT ON public.brand_business_models TO service_role;
GRANT REFERENCES ON public.brand_business_models TO service_role;
GRANT SELECT ON public.brand_business_models TO service_role;
GRANT TRIGGER ON public.brand_business_models TO service_role;
GRANT TRUNCATE ON public.brand_business_models TO service_role;
GRANT UPDATE ON public.brand_business_models TO service_role;
GRANT DELETE ON public.brand_domains TO anon;
GRANT INSERT ON public.brand_domains TO anon;
GRANT REFERENCES ON public.brand_domains TO anon;
GRANT SELECT ON public.brand_domains TO anon;
GRANT TRIGGER ON public.brand_domains TO anon;
GRANT TRUNCATE ON public.brand_domains TO anon;
GRANT UPDATE ON public.brand_domains TO anon;
GRANT DELETE ON public.brand_domains TO authenticated;
GRANT INSERT ON public.brand_domains TO authenticated;
GRANT REFERENCES ON public.brand_domains TO authenticated;
GRANT SELECT ON public.brand_domains TO authenticated;
GRANT TRIGGER ON public.brand_domains TO authenticated;
GRANT TRUNCATE ON public.brand_domains TO authenticated;
GRANT UPDATE ON public.brand_domains TO authenticated;
GRANT DELETE ON public.brand_domains TO service_role;
GRANT INSERT ON public.brand_domains TO service_role;
GRANT REFERENCES ON public.brand_domains TO service_role;
GRANT SELECT ON public.brand_domains TO service_role;
GRANT TRIGGER ON public.brand_domains TO service_role;
GRANT TRUNCATE ON public.brand_domains TO service_role;
GRANT UPDATE ON public.brand_domains TO service_role;
GRANT DELETE ON public.brand_duelo_prizes TO anon;
GRANT INSERT ON public.brand_duelo_prizes TO anon;
GRANT REFERENCES ON public.brand_duelo_prizes TO anon;
GRANT SELECT ON public.brand_duelo_prizes TO anon;
GRANT TRIGGER ON public.brand_duelo_prizes TO anon;
GRANT TRUNCATE ON public.brand_duelo_prizes TO anon;
GRANT UPDATE ON public.brand_duelo_prizes TO anon;
GRANT DELETE ON public.brand_duelo_prizes TO authenticated;
GRANT INSERT ON public.brand_duelo_prizes TO authenticated;
GRANT REFERENCES ON public.brand_duelo_prizes TO authenticated;
GRANT SELECT ON public.brand_duelo_prizes TO authenticated;
GRANT TRIGGER ON public.brand_duelo_prizes TO authenticated;
GRANT TRUNCATE ON public.brand_duelo_prizes TO authenticated;
GRANT UPDATE ON public.brand_duelo_prizes TO authenticated;
GRANT DELETE ON public.brand_duelo_prizes TO service_role;
GRANT INSERT ON public.brand_duelo_prizes TO service_role;
GRANT REFERENCES ON public.brand_duelo_prizes TO service_role;
GRANT SELECT ON public.brand_duelo_prizes TO service_role;
GRANT TRIGGER ON public.brand_duelo_prizes TO service_role;
GRANT TRUNCATE ON public.brand_duelo_prizes TO service_role;
GRANT UPDATE ON public.brand_duelo_prizes TO service_role;
GRANT DELETE ON public.brand_modules TO anon;
GRANT INSERT ON public.brand_modules TO anon;
GRANT REFERENCES ON public.brand_modules TO anon;
GRANT SELECT ON public.brand_modules TO anon;
GRANT TRIGGER ON public.brand_modules TO anon;
GRANT TRUNCATE ON public.brand_modules TO anon;
GRANT UPDATE ON public.brand_modules TO anon;
GRANT DELETE ON public.brand_modules TO authenticated;
GRANT INSERT ON public.brand_modules TO authenticated;
GRANT REFERENCES ON public.brand_modules TO authenticated;
GRANT SELECT ON public.brand_modules TO authenticated;
GRANT TRIGGER ON public.brand_modules TO authenticated;
GRANT TRUNCATE ON public.brand_modules TO authenticated;
GRANT UPDATE ON public.brand_modules TO authenticated;
GRANT DELETE ON public.brand_modules TO service_role;
GRANT INSERT ON public.brand_modules TO service_role;
GRANT REFERENCES ON public.brand_modules TO service_role;
GRANT SELECT ON public.brand_modules TO service_role;
GRANT TRIGGER ON public.brand_modules TO service_role;
GRANT TRUNCATE ON public.brand_modules TO service_role;
GRANT UPDATE ON public.brand_modules TO service_role;
GRANT DELETE ON public.brand_permission_config TO anon;
GRANT INSERT ON public.brand_permission_config TO anon;
GRANT REFERENCES ON public.brand_permission_config TO anon;
GRANT SELECT ON public.brand_permission_config TO anon;
GRANT TRIGGER ON public.brand_permission_config TO anon;
GRANT TRUNCATE ON public.brand_permission_config TO anon;
GRANT UPDATE ON public.brand_permission_config TO anon;
GRANT DELETE ON public.brand_permission_config TO authenticated;
GRANT INSERT ON public.brand_permission_config TO authenticated;
GRANT REFERENCES ON public.brand_permission_config TO authenticated;
GRANT SELECT ON public.brand_permission_config TO authenticated;
GRANT TRIGGER ON public.brand_permission_config TO authenticated;
GRANT TRUNCATE ON public.brand_permission_config TO authenticated;
GRANT UPDATE ON public.brand_permission_config TO authenticated;
GRANT DELETE ON public.brand_permission_config TO service_role;
GRANT INSERT ON public.brand_permission_config TO service_role;
GRANT REFERENCES ON public.brand_permission_config TO service_role;
GRANT SELECT ON public.brand_permission_config TO service_role;
GRANT TRIGGER ON public.brand_permission_config TO service_role;
GRANT TRUNCATE ON public.brand_permission_config TO service_role;
GRANT UPDATE ON public.brand_permission_config TO service_role;
GRANT DELETE ON public.brand_section_manual_items TO anon;
GRANT INSERT ON public.brand_section_manual_items TO anon;
GRANT REFERENCES ON public.brand_section_manual_items TO anon;
GRANT SELECT ON public.brand_section_manual_items TO anon;
GRANT TRIGGER ON public.brand_section_manual_items TO anon;
GRANT TRUNCATE ON public.brand_section_manual_items TO anon;
GRANT UPDATE ON public.brand_section_manual_items TO anon;
GRANT DELETE ON public.brand_section_manual_items TO authenticated;
GRANT INSERT ON public.brand_section_manual_items TO authenticated;
GRANT REFERENCES ON public.brand_section_manual_items TO authenticated;
GRANT SELECT ON public.brand_section_manual_items TO authenticated;
GRANT TRIGGER ON public.brand_section_manual_items TO authenticated;
GRANT TRUNCATE ON public.brand_section_manual_items TO authenticated;
GRANT UPDATE ON public.brand_section_manual_items TO authenticated;
GRANT DELETE ON public.brand_section_manual_items TO service_role;
GRANT INSERT ON public.brand_section_manual_items TO service_role;
GRANT REFERENCES ON public.brand_section_manual_items TO service_role;
GRANT SELECT ON public.brand_section_manual_items TO service_role;
GRANT TRIGGER ON public.brand_section_manual_items TO service_role;
GRANT TRUNCATE ON public.brand_section_manual_items TO service_role;
GRANT UPDATE ON public.brand_section_manual_items TO service_role;
GRANT DELETE ON public.brand_section_sources TO anon;
GRANT INSERT ON public.brand_section_sources TO anon;
GRANT REFERENCES ON public.brand_section_sources TO anon;
GRANT SELECT ON public.brand_section_sources TO anon;
GRANT TRIGGER ON public.brand_section_sources TO anon;
GRANT TRUNCATE ON public.brand_section_sources TO anon;
GRANT UPDATE ON public.brand_section_sources TO anon;
GRANT DELETE ON public.brand_section_sources TO authenticated;
GRANT INSERT ON public.brand_section_sources TO authenticated;
GRANT REFERENCES ON public.brand_section_sources TO authenticated;
GRANT SELECT ON public.brand_section_sources TO authenticated;
GRANT TRIGGER ON public.brand_section_sources TO authenticated;
GRANT TRUNCATE ON public.brand_section_sources TO authenticated;
GRANT UPDATE ON public.brand_section_sources TO authenticated;
GRANT DELETE ON public.brand_section_sources TO service_role;
GRANT INSERT ON public.brand_section_sources TO service_role;
GRANT REFERENCES ON public.brand_section_sources TO service_role;
GRANT SELECT ON public.brand_section_sources TO service_role;
GRANT TRIGGER ON public.brand_section_sources TO service_role;
GRANT TRUNCATE ON public.brand_section_sources TO service_role;
GRANT UPDATE ON public.brand_section_sources TO service_role;
GRANT DELETE ON public.brand_sections TO anon;
GRANT INSERT ON public.brand_sections TO anon;
GRANT REFERENCES ON public.brand_sections TO anon;
GRANT SELECT ON public.brand_sections TO anon;
GRANT TRIGGER ON public.brand_sections TO anon;
GRANT TRUNCATE ON public.brand_sections TO anon;
GRANT UPDATE ON public.brand_sections TO anon;
GRANT DELETE ON public.brand_sections TO authenticated;
GRANT INSERT ON public.brand_sections TO authenticated;
GRANT REFERENCES ON public.brand_sections TO authenticated;
GRANT SELECT ON public.brand_sections TO authenticated;
GRANT TRIGGER ON public.brand_sections TO authenticated;
GRANT TRUNCATE ON public.brand_sections TO authenticated;
GRANT UPDATE ON public.brand_sections TO authenticated;
GRANT DELETE ON public.brand_sections TO service_role;
GRANT INSERT ON public.brand_sections TO service_role;
GRANT REFERENCES ON public.brand_sections TO service_role;
GRANT SELECT ON public.brand_sections TO service_role;
GRANT TRIGGER ON public.brand_sections TO service_role;
GRANT TRUNCATE ON public.brand_sections TO service_role;
GRANT UPDATE ON public.brand_sections TO service_role;
GRANT DELETE ON public.brand_sub_permission_config TO anon;
GRANT INSERT ON public.brand_sub_permission_config TO anon;
GRANT REFERENCES ON public.brand_sub_permission_config TO anon;
GRANT SELECT ON public.brand_sub_permission_config TO anon;
GRANT TRIGGER ON public.brand_sub_permission_config TO anon;
GRANT TRUNCATE ON public.brand_sub_permission_config TO anon;
GRANT UPDATE ON public.brand_sub_permission_config TO anon;
GRANT DELETE ON public.brand_sub_permission_config TO authenticated;
GRANT INSERT ON public.brand_sub_permission_config TO authenticated;
GRANT REFERENCES ON public.brand_sub_permission_config TO authenticated;
GRANT SELECT ON public.brand_sub_permission_config TO authenticated;
GRANT TRIGGER ON public.brand_sub_permission_config TO authenticated;
GRANT TRUNCATE ON public.brand_sub_permission_config TO authenticated;
GRANT UPDATE ON public.brand_sub_permission_config TO authenticated;
GRANT DELETE ON public.brand_sub_permission_config TO service_role;
GRANT INSERT ON public.brand_sub_permission_config TO service_role;
GRANT REFERENCES ON public.brand_sub_permission_config TO service_role;
GRANT SELECT ON public.brand_sub_permission_config TO service_role;
GRANT TRIGGER ON public.brand_sub_permission_config TO service_role;
GRANT TRUNCATE ON public.brand_sub_permission_config TO service_role;
GRANT UPDATE ON public.brand_sub_permission_config TO service_role;
GRANT DELETE ON public.brands TO anon;
GRANT INSERT ON public.brands TO anon;
GRANT REFERENCES ON public.brands TO anon;
GRANT SELECT ON public.brands TO anon;
GRANT TRIGGER ON public.brands TO anon;
GRANT TRUNCATE ON public.brands TO anon;
GRANT UPDATE ON public.brands TO anon;
GRANT DELETE ON public.brands TO authenticated;
GRANT INSERT ON public.brands TO authenticated;
GRANT REFERENCES ON public.brands TO authenticated;
GRANT SELECT ON public.brands TO authenticated;
GRANT TRIGGER ON public.brands TO authenticated;
GRANT TRUNCATE ON public.brands TO authenticated;
GRANT UPDATE ON public.brands TO authenticated;
GRANT DELETE ON public.brands TO service_role;
GRANT INSERT ON public.brands TO service_role;
GRANT REFERENCES ON public.brands TO service_role;
GRANT SELECT ON public.brands TO service_role;
GRANT TRIGGER ON public.brands TO service_role;
GRANT TRUNCATE ON public.brands TO service_role;
GRANT UPDATE ON public.brands TO service_role;
GRANT DELETE ON public.business_model_modules TO anon;
GRANT INSERT ON public.business_model_modules TO anon;
GRANT REFERENCES ON public.business_model_modules TO anon;
GRANT SELECT ON public.business_model_modules TO anon;
GRANT TRIGGER ON public.business_model_modules TO anon;
GRANT TRUNCATE ON public.business_model_modules TO anon;
GRANT UPDATE ON public.business_model_modules TO anon;
GRANT DELETE ON public.business_model_modules TO authenticated;
GRANT INSERT ON public.business_model_modules TO authenticated;
GRANT REFERENCES ON public.business_model_modules TO authenticated;
GRANT SELECT ON public.business_model_modules TO authenticated;
GRANT TRIGGER ON public.business_model_modules TO authenticated;
GRANT TRUNCATE ON public.business_model_modules TO authenticated;
GRANT UPDATE ON public.business_model_modules TO authenticated;
GRANT DELETE ON public.business_model_modules TO service_role;
GRANT INSERT ON public.business_model_modules TO service_role;
GRANT REFERENCES ON public.business_model_modules TO service_role;
GRANT SELECT ON public.business_model_modules TO service_role;
GRANT TRIGGER ON public.business_model_modules TO service_role;
GRANT TRUNCATE ON public.business_model_modules TO service_role;
GRANT UPDATE ON public.business_model_modules TO service_role;
GRANT DELETE ON public.business_models TO anon;
GRANT INSERT ON public.business_models TO anon;
GRANT REFERENCES ON public.business_models TO anon;
GRANT SELECT ON public.business_models TO anon;
GRANT TRIGGER ON public.business_models TO anon;
GRANT TRUNCATE ON public.business_models TO anon;
GRANT UPDATE ON public.business_models TO anon;
GRANT DELETE ON public.business_models TO authenticated;
GRANT INSERT ON public.business_models TO authenticated;
GRANT REFERENCES ON public.business_models TO authenticated;
GRANT SELECT ON public.business_models TO authenticated;
GRANT TRIGGER ON public.business_models TO authenticated;
GRANT TRUNCATE ON public.business_models TO authenticated;
GRANT UPDATE ON public.business_models TO authenticated;
GRANT DELETE ON public.business_models TO service_role;
GRANT INSERT ON public.business_models TO service_role;
GRANT REFERENCES ON public.business_models TO service_role;
GRANT SELECT ON public.business_models TO service_role;
GRANT TRIGGER ON public.business_models TO service_role;
GRANT TRUNCATE ON public.business_models TO service_role;
GRANT UPDATE ON public.business_models TO service_role;
GRANT DELETE ON public.campeonato_artilharia_window_prizes TO anon;
GRANT INSERT ON public.campeonato_artilharia_window_prizes TO anon;
GRANT REFERENCES ON public.campeonato_artilharia_window_prizes TO anon;
GRANT SELECT ON public.campeonato_artilharia_window_prizes TO anon;
GRANT TRIGGER ON public.campeonato_artilharia_window_prizes TO anon;
GRANT TRUNCATE ON public.campeonato_artilharia_window_prizes TO anon;
GRANT UPDATE ON public.campeonato_artilharia_window_prizes TO anon;
GRANT DELETE ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT INSERT ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT REFERENCES ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT SELECT ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT TRIGGER ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT TRUNCATE ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT UPDATE ON public.campeonato_artilharia_window_prizes TO authenticated;
GRANT DELETE ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT INSERT ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT REFERENCES ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT SELECT ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT TRIGGER ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT TRUNCATE ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT UPDATE ON public.campeonato_artilharia_window_prizes TO service_role;
GRANT DELETE ON public.campeonato_attempts_log TO anon;
GRANT INSERT ON public.campeonato_attempts_log TO anon;
GRANT REFERENCES ON public.campeonato_attempts_log TO anon;
GRANT SELECT ON public.campeonato_attempts_log TO anon;
GRANT TRIGGER ON public.campeonato_attempts_log TO anon;
GRANT TRUNCATE ON public.campeonato_attempts_log TO anon;
GRANT UPDATE ON public.campeonato_attempts_log TO anon;
GRANT DELETE ON public.campeonato_attempts_log TO authenticated;
GRANT INSERT ON public.campeonato_attempts_log TO authenticated;
GRANT REFERENCES ON public.campeonato_attempts_log TO authenticated;
GRANT SELECT ON public.campeonato_attempts_log TO authenticated;
GRANT TRIGGER ON public.campeonato_attempts_log TO authenticated;
GRANT TRUNCATE ON public.campeonato_attempts_log TO authenticated;
GRANT UPDATE ON public.campeonato_attempts_log TO authenticated;
GRANT DELETE ON public.campeonato_attempts_log TO service_role;
GRANT INSERT ON public.campeonato_attempts_log TO service_role;
GRANT REFERENCES ON public.campeonato_attempts_log TO service_role;
GRANT SELECT ON public.campeonato_attempts_log TO service_role;
GRANT TRIGGER ON public.campeonato_attempts_log TO service_role;
GRANT TRUNCATE ON public.campeonato_attempts_log TO service_role;
GRANT UPDATE ON public.campeonato_attempts_log TO service_role;
GRANT DELETE ON public.campeonato_brackets TO anon;
GRANT INSERT ON public.campeonato_brackets TO anon;
GRANT REFERENCES ON public.campeonato_brackets TO anon;
GRANT SELECT ON public.campeonato_brackets TO anon;
GRANT TRIGGER ON public.campeonato_brackets TO anon;
GRANT TRUNCATE ON public.campeonato_brackets TO anon;
GRANT UPDATE ON public.campeonato_brackets TO anon;
GRANT DELETE ON public.campeonato_brackets TO authenticated;
GRANT INSERT ON public.campeonato_brackets TO authenticated;
GRANT REFERENCES ON public.campeonato_brackets TO authenticated;
GRANT SELECT ON public.campeonato_brackets TO authenticated;
GRANT TRIGGER ON public.campeonato_brackets TO authenticated;
GRANT TRUNCATE ON public.campeonato_brackets TO authenticated;
GRANT UPDATE ON public.campeonato_brackets TO authenticated;
GRANT DELETE ON public.campeonato_brackets TO service_role;
GRANT INSERT ON public.campeonato_brackets TO service_role;
GRANT REFERENCES ON public.campeonato_brackets TO service_role;
GRANT SELECT ON public.campeonato_brackets TO service_role;
GRANT TRIGGER ON public.campeonato_brackets TO service_role;
GRANT TRUNCATE ON public.campeonato_brackets TO service_role;
GRANT UPDATE ON public.campeonato_brackets TO service_role;
GRANT DELETE ON public.campeonato_champions TO anon;
GRANT INSERT ON public.campeonato_champions TO anon;
GRANT REFERENCES ON public.campeonato_champions TO anon;
GRANT SELECT ON public.campeonato_champions TO anon;
GRANT TRIGGER ON public.campeonato_champions TO anon;
GRANT TRUNCATE ON public.campeonato_champions TO anon;
GRANT UPDATE ON public.campeonato_champions TO anon;
GRANT DELETE ON public.campeonato_champions TO authenticated;
GRANT INSERT ON public.campeonato_champions TO authenticated;
GRANT REFERENCES ON public.campeonato_champions TO authenticated;
GRANT SELECT ON public.campeonato_champions TO authenticated;
GRANT TRIGGER ON public.campeonato_champions TO authenticated;
GRANT TRUNCATE ON public.campeonato_champions TO authenticated;
GRANT UPDATE ON public.campeonato_champions TO authenticated;
GRANT DELETE ON public.campeonato_champions TO service_role;
GRANT INSERT ON public.campeonato_champions TO service_role;
GRANT REFERENCES ON public.campeonato_champions TO service_role;
GRANT SELECT ON public.campeonato_champions TO service_role;
GRANT TRIGGER ON public.campeonato_champions TO service_role;
GRANT TRUNCATE ON public.campeonato_champions TO service_role;
GRANT UPDATE ON public.campeonato_champions TO service_role;
GRANT DELETE ON public.campeonato_classificacao_auditoria TO anon;
GRANT INSERT ON public.campeonato_classificacao_auditoria TO anon;
GRANT REFERENCES ON public.campeonato_classificacao_auditoria TO anon;
GRANT SELECT ON public.campeonato_classificacao_auditoria TO anon;
GRANT TRIGGER ON public.campeonato_classificacao_auditoria TO anon;
GRANT TRUNCATE ON public.campeonato_classificacao_auditoria TO anon;
GRANT UPDATE ON public.campeonato_classificacao_auditoria TO anon;
GRANT DELETE ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT INSERT ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT REFERENCES ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT SELECT ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT TRIGGER ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT TRUNCATE ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT UPDATE ON public.campeonato_classificacao_auditoria TO authenticated;
GRANT DELETE ON public.campeonato_classificacao_auditoria TO service_role;
GRANT INSERT ON public.campeonato_classificacao_auditoria TO service_role;
GRANT REFERENCES ON public.campeonato_classificacao_auditoria TO service_role;
GRANT SELECT ON public.campeonato_classificacao_auditoria TO service_role;
GRANT TRIGGER ON public.campeonato_classificacao_auditoria TO service_role;
GRANT TRUNCATE ON public.campeonato_classificacao_auditoria TO service_role;
GRANT UPDATE ON public.campeonato_classificacao_auditoria TO service_role;
GRANT DELETE ON public.campeonato_driver_tier_history TO anon;
GRANT INSERT ON public.campeonato_driver_tier_history TO anon;
GRANT REFERENCES ON public.campeonato_driver_tier_history TO anon;
GRANT SELECT ON public.campeonato_driver_tier_history TO anon;
GRANT TRIGGER ON public.campeonato_driver_tier_history TO anon;
GRANT TRUNCATE ON public.campeonato_driver_tier_history TO anon;
GRANT UPDATE ON public.campeonato_driver_tier_history TO anon;
GRANT DELETE ON public.campeonato_driver_tier_history TO authenticated;
GRANT INSERT ON public.campeonato_driver_tier_history TO authenticated;
GRANT REFERENCES ON public.campeonato_driver_tier_history TO authenticated;
GRANT SELECT ON public.campeonato_driver_tier_history TO authenticated;
GRANT TRIGGER ON public.campeonato_driver_tier_history TO authenticated;
GRANT TRUNCATE ON public.campeonato_driver_tier_history TO authenticated;
GRANT UPDATE ON public.campeonato_driver_tier_history TO authenticated;
GRANT DELETE ON public.campeonato_driver_tier_history TO service_role;
GRANT INSERT ON public.campeonato_driver_tier_history TO service_role;
GRANT REFERENCES ON public.campeonato_driver_tier_history TO service_role;
GRANT SELECT ON public.campeonato_driver_tier_history TO service_role;
GRANT TRIGGER ON public.campeonato_driver_tier_history TO service_role;
GRANT TRUNCATE ON public.campeonato_driver_tier_history TO service_role;
GRANT UPDATE ON public.campeonato_driver_tier_history TO service_role;
GRANT DELETE ON public.campeonato_match_events TO anon;
GRANT INSERT ON public.campeonato_match_events TO anon;
GRANT REFERENCES ON public.campeonato_match_events TO anon;
GRANT SELECT ON public.campeonato_match_events TO anon;
GRANT TRIGGER ON public.campeonato_match_events TO anon;
GRANT TRUNCATE ON public.campeonato_match_events TO anon;
GRANT UPDATE ON public.campeonato_match_events TO anon;
GRANT DELETE ON public.campeonato_match_events TO authenticated;
GRANT INSERT ON public.campeonato_match_events TO authenticated;
GRANT REFERENCES ON public.campeonato_match_events TO authenticated;
GRANT SELECT ON public.campeonato_match_events TO authenticated;
GRANT TRIGGER ON public.campeonato_match_events TO authenticated;
GRANT TRUNCATE ON public.campeonato_match_events TO authenticated;
GRANT UPDATE ON public.campeonato_match_events TO authenticated;
GRANT DELETE ON public.campeonato_match_events TO service_role;
GRANT INSERT ON public.campeonato_match_events TO service_role;
GRANT REFERENCES ON public.campeonato_match_events TO service_role;
GRANT SELECT ON public.campeonato_match_events TO service_role;
GRANT TRIGGER ON public.campeonato_match_events TO service_role;
GRANT TRUNCATE ON public.campeonato_match_events TO service_role;
GRANT UPDATE ON public.campeonato_match_events TO service_role;
GRANT DELETE ON public.campeonato_notifications TO anon;
GRANT INSERT ON public.campeonato_notifications TO anon;
GRANT REFERENCES ON public.campeonato_notifications TO anon;
GRANT SELECT ON public.campeonato_notifications TO anon;
GRANT TRIGGER ON public.campeonato_notifications TO anon;
GRANT TRUNCATE ON public.campeonato_notifications TO anon;
GRANT UPDATE ON public.campeonato_notifications TO anon;
GRANT DELETE ON public.campeonato_notifications TO authenticated;
GRANT INSERT ON public.campeonato_notifications TO authenticated;
GRANT REFERENCES ON public.campeonato_notifications TO authenticated;
GRANT SELECT ON public.campeonato_notifications TO authenticated;
GRANT TRIGGER ON public.campeonato_notifications TO authenticated;
GRANT TRUNCATE ON public.campeonato_notifications TO authenticated;
GRANT UPDATE ON public.campeonato_notifications TO authenticated;
GRANT DELETE ON public.campeonato_notifications TO service_role;
GRANT INSERT ON public.campeonato_notifications TO service_role;
GRANT REFERENCES ON public.campeonato_notifications TO service_role;
GRANT SELECT ON public.campeonato_notifications TO service_role;
GRANT TRIGGER ON public.campeonato_notifications TO service_role;
GRANT TRUNCATE ON public.campeonato_notifications TO service_role;
GRANT UPDATE ON public.campeonato_notifications TO service_role;
GRANT DELETE ON public.campeonato_prize_distributions TO anon;
GRANT INSERT ON public.campeonato_prize_distributions TO anon;
GRANT REFERENCES ON public.campeonato_prize_distributions TO anon;
GRANT SELECT ON public.campeonato_prize_distributions TO anon;
GRANT TRIGGER ON public.campeonato_prize_distributions TO anon;
GRANT TRUNCATE ON public.campeonato_prize_distributions TO anon;
GRANT UPDATE ON public.campeonato_prize_distributions TO anon;
GRANT DELETE ON public.campeonato_prize_distributions TO authenticated;
GRANT INSERT ON public.campeonato_prize_distributions TO authenticated;
GRANT REFERENCES ON public.campeonato_prize_distributions TO authenticated;
GRANT SELECT ON public.campeonato_prize_distributions TO authenticated;
GRANT TRIGGER ON public.campeonato_prize_distributions TO authenticated;
GRANT TRUNCATE ON public.campeonato_prize_distributions TO authenticated;
GRANT UPDATE ON public.campeonato_prize_distributions TO authenticated;
GRANT DELETE ON public.campeonato_prize_distributions TO service_role;
GRANT INSERT ON public.campeonato_prize_distributions TO service_role;
GRANT REFERENCES ON public.campeonato_prize_distributions TO service_role;
GRANT SELECT ON public.campeonato_prize_distributions TO service_role;
GRANT TRIGGER ON public.campeonato_prize_distributions TO service_role;
GRANT TRUNCATE ON public.campeonato_prize_distributions TO service_role;
GRANT UPDATE ON public.campeonato_prize_distributions TO service_role;
GRANT DELETE ON public.campeonato_season_enrollments TO anon;
GRANT INSERT ON public.campeonato_season_enrollments TO anon;
GRANT REFERENCES ON public.campeonato_season_enrollments TO anon;
GRANT SELECT ON public.campeonato_season_enrollments TO anon;
GRANT TRIGGER ON public.campeonato_season_enrollments TO anon;
GRANT TRUNCATE ON public.campeonato_season_enrollments TO anon;
GRANT UPDATE ON public.campeonato_season_enrollments TO anon;
GRANT DELETE ON public.campeonato_season_enrollments TO authenticated;
GRANT INSERT ON public.campeonato_season_enrollments TO authenticated;
GRANT REFERENCES ON public.campeonato_season_enrollments TO authenticated;
GRANT SELECT ON public.campeonato_season_enrollments TO authenticated;
GRANT TRIGGER ON public.campeonato_season_enrollments TO authenticated;
GRANT TRUNCATE ON public.campeonato_season_enrollments TO authenticated;
GRANT UPDATE ON public.campeonato_season_enrollments TO authenticated;
GRANT DELETE ON public.campeonato_season_enrollments TO service_role;
GRANT INSERT ON public.campeonato_season_enrollments TO service_role;
GRANT REFERENCES ON public.campeonato_season_enrollments TO service_role;
GRANT SELECT ON public.campeonato_season_enrollments TO service_role;
GRANT TRIGGER ON public.campeonato_season_enrollments TO service_role;
GRANT TRUNCATE ON public.campeonato_season_enrollments TO service_role;
GRANT UPDATE ON public.campeonato_season_enrollments TO service_role;
GRANT DELETE ON public.campeonato_season_phase_config TO anon;
GRANT INSERT ON public.campeonato_season_phase_config TO anon;
GRANT REFERENCES ON public.campeonato_season_phase_config TO anon;
GRANT SELECT ON public.campeonato_season_phase_config TO anon;
GRANT TRIGGER ON public.campeonato_season_phase_config TO anon;
GRANT TRUNCATE ON public.campeonato_season_phase_config TO anon;
GRANT UPDATE ON public.campeonato_season_phase_config TO anon;
GRANT DELETE ON public.campeonato_season_phase_config TO authenticated;
GRANT INSERT ON public.campeonato_season_phase_config TO authenticated;
GRANT REFERENCES ON public.campeonato_season_phase_config TO authenticated;
GRANT SELECT ON public.campeonato_season_phase_config TO authenticated;
GRANT TRIGGER ON public.campeonato_season_phase_config TO authenticated;
GRANT TRUNCATE ON public.campeonato_season_phase_config TO authenticated;
GRANT UPDATE ON public.campeonato_season_phase_config TO authenticated;
GRANT DELETE ON public.campeonato_season_phase_config TO service_role;
GRANT INSERT ON public.campeonato_season_phase_config TO service_role;
GRANT REFERENCES ON public.campeonato_season_phase_config TO service_role;
GRANT SELECT ON public.campeonato_season_phase_config TO service_role;
GRANT TRIGGER ON public.campeonato_season_phase_config TO service_role;
GRANT TRUNCATE ON public.campeonato_season_phase_config TO service_role;
GRANT UPDATE ON public.campeonato_season_phase_config TO service_role;
GRANT DELETE ON public.campeonato_season_prizes TO anon;
GRANT INSERT ON public.campeonato_season_prizes TO anon;
GRANT REFERENCES ON public.campeonato_season_prizes TO anon;
GRANT SELECT ON public.campeonato_season_prizes TO anon;
GRANT TRIGGER ON public.campeonato_season_prizes TO anon;
GRANT TRUNCATE ON public.campeonato_season_prizes TO anon;
GRANT UPDATE ON public.campeonato_season_prizes TO anon;
GRANT DELETE ON public.campeonato_season_prizes TO authenticated;
GRANT INSERT ON public.campeonato_season_prizes TO authenticated;
GRANT REFERENCES ON public.campeonato_season_prizes TO authenticated;
GRANT SELECT ON public.campeonato_season_prizes TO authenticated;
GRANT TRIGGER ON public.campeonato_season_prizes TO authenticated;
GRANT TRUNCATE ON public.campeonato_season_prizes TO authenticated;
GRANT UPDATE ON public.campeonato_season_prizes TO authenticated;
GRANT DELETE ON public.campeonato_season_prizes TO service_role;
GRANT INSERT ON public.campeonato_season_prizes TO service_role;
GRANT REFERENCES ON public.campeonato_season_prizes TO service_role;
GRANT SELECT ON public.campeonato_season_prizes TO service_role;
GRANT TRIGGER ON public.campeonato_season_prizes TO service_role;
GRANT TRUNCATE ON public.campeonato_season_prizes TO service_role;
GRANT UPDATE ON public.campeonato_season_prizes TO service_role;
GRANT DELETE ON public.campeonato_season_standings TO anon;
GRANT INSERT ON public.campeonato_season_standings TO anon;
GRANT REFERENCES ON public.campeonato_season_standings TO anon;
GRANT SELECT ON public.campeonato_season_standings TO anon;
GRANT TRIGGER ON public.campeonato_season_standings TO anon;
GRANT TRUNCATE ON public.campeonato_season_standings TO anon;
GRANT UPDATE ON public.campeonato_season_standings TO anon;
GRANT DELETE ON public.campeonato_season_standings TO authenticated;
GRANT INSERT ON public.campeonato_season_standings TO authenticated;
GRANT REFERENCES ON public.campeonato_season_standings TO authenticated;
GRANT SELECT ON public.campeonato_season_standings TO authenticated;
GRANT TRIGGER ON public.campeonato_season_standings TO authenticated;
GRANT TRUNCATE ON public.campeonato_season_standings TO authenticated;
GRANT UPDATE ON public.campeonato_season_standings TO authenticated;
GRANT DELETE ON public.campeonato_season_standings TO service_role;
GRANT INSERT ON public.campeonato_season_standings TO service_role;
GRANT REFERENCES ON public.campeonato_season_standings TO service_role;
GRANT SELECT ON public.campeonato_season_standings TO service_role;
GRANT TRIGGER ON public.campeonato_season_standings TO service_role;
GRANT TRUNCATE ON public.campeonato_season_standings TO service_role;
GRANT UPDATE ON public.campeonato_season_standings TO service_role;
GRANT DELETE ON public.campeonato_season_tiers TO anon;
GRANT INSERT ON public.campeonato_season_tiers TO anon;
GRANT REFERENCES ON public.campeonato_season_tiers TO anon;
GRANT SELECT ON public.campeonato_season_tiers TO anon;
GRANT TRIGGER ON public.campeonato_season_tiers TO anon;
GRANT TRUNCATE ON public.campeonato_season_tiers TO anon;
GRANT UPDATE ON public.campeonato_season_tiers TO anon;
GRANT DELETE ON public.campeonato_season_tiers TO authenticated;
GRANT INSERT ON public.campeonato_season_tiers TO authenticated;
GRANT REFERENCES ON public.campeonato_season_tiers TO authenticated;
GRANT SELECT ON public.campeonato_season_tiers TO authenticated;
GRANT TRIGGER ON public.campeonato_season_tiers TO authenticated;
GRANT TRUNCATE ON public.campeonato_season_tiers TO authenticated;
GRANT UPDATE ON public.campeonato_season_tiers TO authenticated;
GRANT DELETE ON public.campeonato_season_tiers TO service_role;
GRANT INSERT ON public.campeonato_season_tiers TO service_role;
GRANT REFERENCES ON public.campeonato_season_tiers TO service_role;
GRANT SELECT ON public.campeonato_season_tiers TO service_role;
GRANT TRIGGER ON public.campeonato_season_tiers TO service_role;
GRANT TRUNCATE ON public.campeonato_season_tiers TO service_role;
GRANT UPDATE ON public.campeonato_season_tiers TO service_role;
GRANT DELETE ON public.campeonato_seasons TO anon;
GRANT INSERT ON public.campeonato_seasons TO anon;
GRANT REFERENCES ON public.campeonato_seasons TO anon;
GRANT SELECT ON public.campeonato_seasons TO anon;
GRANT TRIGGER ON public.campeonato_seasons TO anon;
GRANT TRUNCATE ON public.campeonato_seasons TO anon;
GRANT UPDATE ON public.campeonato_seasons TO anon;
GRANT DELETE ON public.campeonato_seasons TO authenticated;
GRANT INSERT ON public.campeonato_seasons TO authenticated;
GRANT REFERENCES ON public.campeonato_seasons TO authenticated;
GRANT SELECT ON public.campeonato_seasons TO authenticated;
GRANT TRIGGER ON public.campeonato_seasons TO authenticated;
GRANT TRUNCATE ON public.campeonato_seasons TO authenticated;
GRANT UPDATE ON public.campeonato_seasons TO authenticated;
GRANT DELETE ON public.campeonato_seasons TO service_role;
GRANT INSERT ON public.campeonato_seasons TO service_role;
GRANT REFERENCES ON public.campeonato_seasons TO service_role;
GRANT SELECT ON public.campeonato_seasons TO service_role;
GRANT TRIGGER ON public.campeonato_seasons TO service_role;
GRANT TRUNCATE ON public.campeonato_seasons TO service_role;
GRANT UPDATE ON public.campeonato_seasons TO service_role;
GRANT DELETE ON public.campeonato_tier_memberships TO anon;
GRANT INSERT ON public.campeonato_tier_memberships TO anon;
GRANT REFERENCES ON public.campeonato_tier_memberships TO anon;
GRANT SELECT ON public.campeonato_tier_memberships TO anon;
GRANT TRIGGER ON public.campeonato_tier_memberships TO anon;
GRANT TRUNCATE ON public.campeonato_tier_memberships TO anon;
GRANT UPDATE ON public.campeonato_tier_memberships TO anon;
GRANT DELETE ON public.campeonato_tier_memberships TO authenticated;
GRANT INSERT ON public.campeonato_tier_memberships TO authenticated;
GRANT REFERENCES ON public.campeonato_tier_memberships TO authenticated;
GRANT SELECT ON public.campeonato_tier_memberships TO authenticated;
GRANT TRIGGER ON public.campeonato_tier_memberships TO authenticated;
GRANT TRUNCATE ON public.campeonato_tier_memberships TO authenticated;
GRANT UPDATE ON public.campeonato_tier_memberships TO authenticated;
GRANT DELETE ON public.campeonato_tier_memberships TO service_role;
GRANT INSERT ON public.campeonato_tier_memberships TO service_role;
GRANT REFERENCES ON public.campeonato_tier_memberships TO service_role;
GRANT SELECT ON public.campeonato_tier_memberships TO service_role;
GRANT TRIGGER ON public.campeonato_tier_memberships TO service_role;
GRANT TRUNCATE ON public.campeonato_tier_memberships TO service_role;
GRANT UPDATE ON public.campeonato_tier_memberships TO service_role;
GRANT DELETE ON public.catalog_cart_orders TO anon;
GRANT INSERT ON public.catalog_cart_orders TO anon;
GRANT REFERENCES ON public.catalog_cart_orders TO anon;
GRANT SELECT ON public.catalog_cart_orders TO anon;
GRANT TRIGGER ON public.catalog_cart_orders TO anon;
GRANT TRUNCATE ON public.catalog_cart_orders TO anon;
GRANT UPDATE ON public.catalog_cart_orders TO anon;
GRANT DELETE ON public.catalog_cart_orders TO authenticated;
GRANT INSERT ON public.catalog_cart_orders TO authenticated;
GRANT REFERENCES ON public.catalog_cart_orders TO authenticated;
GRANT SELECT ON public.catalog_cart_orders TO authenticated;
GRANT TRIGGER ON public.catalog_cart_orders TO authenticated;
GRANT TRUNCATE ON public.catalog_cart_orders TO authenticated;
GRANT UPDATE ON public.catalog_cart_orders TO authenticated;
GRANT DELETE ON public.catalog_cart_orders TO service_role;
GRANT INSERT ON public.catalog_cart_orders TO service_role;
GRANT REFERENCES ON public.catalog_cart_orders TO service_role;
GRANT SELECT ON public.catalog_cart_orders TO service_role;
GRANT TRIGGER ON public.catalog_cart_orders TO service_role;
GRANT TRUNCATE ON public.catalog_cart_orders TO service_role;
GRANT UPDATE ON public.catalog_cart_orders TO service_role;
GRANT DELETE ON public.city_belt_champions TO anon;
GRANT INSERT ON public.city_belt_champions TO anon;
GRANT REFERENCES ON public.city_belt_champions TO anon;
GRANT SELECT ON public.city_belt_champions TO anon;
GRANT TRIGGER ON public.city_belt_champions TO anon;
GRANT TRUNCATE ON public.city_belt_champions TO anon;
GRANT UPDATE ON public.city_belt_champions TO anon;
GRANT DELETE ON public.city_belt_champions TO authenticated;
GRANT INSERT ON public.city_belt_champions TO authenticated;
GRANT REFERENCES ON public.city_belt_champions TO authenticated;
GRANT SELECT ON public.city_belt_champions TO authenticated;
GRANT TRIGGER ON public.city_belt_champions TO authenticated;
GRANT TRUNCATE ON public.city_belt_champions TO authenticated;
GRANT UPDATE ON public.city_belt_champions TO authenticated;
GRANT DELETE ON public.city_belt_champions TO service_role;
GRANT INSERT ON public.city_belt_champions TO service_role;
GRANT REFERENCES ON public.city_belt_champions TO service_role;
GRANT SELECT ON public.city_belt_champions TO service_role;
GRANT TRIGGER ON public.city_belt_champions TO service_role;
GRANT TRUNCATE ON public.city_belt_champions TO service_role;
GRANT UPDATE ON public.city_belt_champions TO service_role;
GRANT DELETE ON public.city_business_model_overrides TO anon;
GRANT INSERT ON public.city_business_model_overrides TO anon;
GRANT REFERENCES ON public.city_business_model_overrides TO anon;
GRANT SELECT ON public.city_business_model_overrides TO anon;
GRANT TRIGGER ON public.city_business_model_overrides TO anon;
GRANT TRUNCATE ON public.city_business_model_overrides TO anon;
GRANT UPDATE ON public.city_business_model_overrides TO anon;
GRANT DELETE ON public.city_business_model_overrides TO authenticated;
GRANT INSERT ON public.city_business_model_overrides TO authenticated;
GRANT REFERENCES ON public.city_business_model_overrides TO authenticated;
GRANT SELECT ON public.city_business_model_overrides TO authenticated;
GRANT TRIGGER ON public.city_business_model_overrides TO authenticated;
GRANT TRUNCATE ON public.city_business_model_overrides TO authenticated;
GRANT UPDATE ON public.city_business_model_overrides TO authenticated;
GRANT DELETE ON public.city_business_model_overrides TO service_role;
GRANT INSERT ON public.city_business_model_overrides TO service_role;
GRANT REFERENCES ON public.city_business_model_overrides TO service_role;
GRANT SELECT ON public.city_business_model_overrides TO service_role;
GRANT TRIGGER ON public.city_business_model_overrides TO service_role;
GRANT TRUNCATE ON public.city_business_model_overrides TO service_role;
GRANT UPDATE ON public.city_business_model_overrides TO service_role;
GRANT DELETE ON public.city_feed_events TO anon;
GRANT INSERT ON public.city_feed_events TO anon;
GRANT REFERENCES ON public.city_feed_events TO anon;
GRANT SELECT ON public.city_feed_events TO anon;
GRANT TRIGGER ON public.city_feed_events TO anon;
GRANT TRUNCATE ON public.city_feed_events TO anon;
GRANT UPDATE ON public.city_feed_events TO anon;
GRANT DELETE ON public.city_feed_events TO authenticated;
GRANT INSERT ON public.city_feed_events TO authenticated;
GRANT REFERENCES ON public.city_feed_events TO authenticated;
GRANT SELECT ON public.city_feed_events TO authenticated;
GRANT TRIGGER ON public.city_feed_events TO authenticated;
GRANT TRUNCATE ON public.city_feed_events TO authenticated;
GRANT UPDATE ON public.city_feed_events TO authenticated;
GRANT DELETE ON public.city_feed_events TO service_role;
GRANT INSERT ON public.city_feed_events TO service_role;
GRANT REFERENCES ON public.city_feed_events TO service_role;
GRANT SELECT ON public.city_feed_events TO service_role;
GRANT TRIGGER ON public.city_feed_events TO service_role;
GRANT TRUNCATE ON public.city_feed_events TO service_role;
GRANT UPDATE ON public.city_feed_events TO service_role;
GRANT DELETE ON public.city_module_overrides TO anon;
GRANT INSERT ON public.city_module_overrides TO anon;
GRANT REFERENCES ON public.city_module_overrides TO anon;
GRANT SELECT ON public.city_module_overrides TO anon;
GRANT TRIGGER ON public.city_module_overrides TO anon;
GRANT TRUNCATE ON public.city_module_overrides TO anon;
GRANT UPDATE ON public.city_module_overrides TO anon;
GRANT DELETE ON public.city_module_overrides TO authenticated;
GRANT INSERT ON public.city_module_overrides TO authenticated;
GRANT REFERENCES ON public.city_module_overrides TO authenticated;
GRANT SELECT ON public.city_module_overrides TO authenticated;
GRANT TRIGGER ON public.city_module_overrides TO authenticated;
GRANT TRUNCATE ON public.city_module_overrides TO authenticated;
GRANT UPDATE ON public.city_module_overrides TO authenticated;
GRANT DELETE ON public.city_module_overrides TO service_role;
GRANT INSERT ON public.city_module_overrides TO service_role;
GRANT REFERENCES ON public.city_module_overrides TO service_role;
GRANT SELECT ON public.city_module_overrides TO service_role;
GRANT TRIGGER ON public.city_module_overrides TO service_role;
GRANT TRUNCATE ON public.city_module_overrides TO service_role;
GRANT UPDATE ON public.city_module_overrides TO service_role;
GRANT DELETE ON public.commercial_lead_notes TO anon;
GRANT INSERT ON public.commercial_lead_notes TO anon;
GRANT REFERENCES ON public.commercial_lead_notes TO anon;
GRANT SELECT ON public.commercial_lead_notes TO anon;
GRANT TRIGGER ON public.commercial_lead_notes TO anon;
GRANT TRUNCATE ON public.commercial_lead_notes TO anon;
GRANT UPDATE ON public.commercial_lead_notes TO anon;
GRANT DELETE ON public.commercial_lead_notes TO authenticated;
GRANT INSERT ON public.commercial_lead_notes TO authenticated;
GRANT REFERENCES ON public.commercial_lead_notes TO authenticated;
GRANT SELECT ON public.commercial_lead_notes TO authenticated;
GRANT TRIGGER ON public.commercial_lead_notes TO authenticated;
GRANT TRUNCATE ON public.commercial_lead_notes TO authenticated;
GRANT UPDATE ON public.commercial_lead_notes TO authenticated;
GRANT DELETE ON public.commercial_lead_notes TO service_role;
GRANT INSERT ON public.commercial_lead_notes TO service_role;
GRANT REFERENCES ON public.commercial_lead_notes TO service_role;
GRANT SELECT ON public.commercial_lead_notes TO service_role;
GRANT TRIGGER ON public.commercial_lead_notes TO service_role;
GRANT TRUNCATE ON public.commercial_lead_notes TO service_role;
GRANT UPDATE ON public.commercial_lead_notes TO service_role;
GRANT DELETE ON public.commercial_leads TO anon;
GRANT INSERT ON public.commercial_leads TO anon;
GRANT REFERENCES ON public.commercial_leads TO anon;
GRANT SELECT ON public.commercial_leads TO anon;
GRANT TRIGGER ON public.commercial_leads TO anon;
GRANT TRUNCATE ON public.commercial_leads TO anon;
GRANT UPDATE ON public.commercial_leads TO anon;
GRANT DELETE ON public.commercial_leads TO authenticated;
GRANT INSERT ON public.commercial_leads TO authenticated;
GRANT REFERENCES ON public.commercial_leads TO authenticated;
GRANT SELECT ON public.commercial_leads TO authenticated;
GRANT TRIGGER ON public.commercial_leads TO authenticated;
GRANT TRUNCATE ON public.commercial_leads TO authenticated;
GRANT UPDATE ON public.commercial_leads TO authenticated;
GRANT DELETE ON public.commercial_leads TO service_role;
GRANT INSERT ON public.commercial_leads TO service_role;
GRANT REFERENCES ON public.commercial_leads TO service_role;
GRANT SELECT ON public.commercial_leads TO service_role;
GRANT TRIGGER ON public.commercial_leads TO service_role;
GRANT TRUNCATE ON public.commercial_leads TO service_role;
GRANT UPDATE ON public.commercial_leads TO service_role;
GRANT DELETE ON public.coupons TO anon;
GRANT INSERT ON public.coupons TO anon;
GRANT REFERENCES ON public.coupons TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT TRIGGER ON public.coupons TO anon;
GRANT TRUNCATE ON public.coupons TO anon;
GRANT UPDATE ON public.coupons TO anon;
GRANT DELETE ON public.coupons TO authenticated;
GRANT INSERT ON public.coupons TO authenticated;
GRANT REFERENCES ON public.coupons TO authenticated;
GRANT SELECT ON public.coupons TO authenticated;
GRANT TRIGGER ON public.coupons TO authenticated;
GRANT TRUNCATE ON public.coupons TO authenticated;
GRANT UPDATE ON public.coupons TO authenticated;
GRANT DELETE ON public.coupons TO service_role;
GRANT INSERT ON public.coupons TO service_role;
GRANT REFERENCES ON public.coupons TO service_role;
GRANT SELECT ON public.coupons TO service_role;
GRANT TRIGGER ON public.coupons TO service_role;
GRANT TRUNCATE ON public.coupons TO service_role;
GRANT UPDATE ON public.coupons TO service_role;
GRANT DELETE ON public.cp_contacts TO anon;
GRANT INSERT ON public.cp_contacts TO anon;
GRANT REFERENCES ON public.cp_contacts TO anon;
GRANT SELECT ON public.cp_contacts TO anon;
GRANT TRIGGER ON public.cp_contacts TO anon;
GRANT TRUNCATE ON public.cp_contacts TO anon;
GRANT UPDATE ON public.cp_contacts TO anon;
GRANT DELETE ON public.cp_contacts TO authenticated;
GRANT INSERT ON public.cp_contacts TO authenticated;
GRANT REFERENCES ON public.cp_contacts TO authenticated;
GRANT SELECT ON public.cp_contacts TO authenticated;
GRANT TRIGGER ON public.cp_contacts TO authenticated;
GRANT TRUNCATE ON public.cp_contacts TO authenticated;
GRANT UPDATE ON public.cp_contacts TO authenticated;
GRANT DELETE ON public.cp_contacts TO service_role;
GRANT INSERT ON public.cp_contacts TO service_role;
GRANT REFERENCES ON public.cp_contacts TO service_role;
GRANT SELECT ON public.cp_contacts TO service_role;
GRANT TRIGGER ON public.cp_contacts TO service_role;
GRANT TRUNCATE ON public.cp_contacts TO service_role;
GRANT UPDATE ON public.cp_contacts TO service_role;
GRANT DELETE ON public.cp_notes TO anon;
GRANT INSERT ON public.cp_notes TO anon;
GRANT REFERENCES ON public.cp_notes TO anon;
GRANT SELECT ON public.cp_notes TO anon;
GRANT TRIGGER ON public.cp_notes TO anon;
GRANT TRUNCATE ON public.cp_notes TO anon;
GRANT UPDATE ON public.cp_notes TO anon;
GRANT DELETE ON public.cp_notes TO authenticated;
GRANT INSERT ON public.cp_notes TO authenticated;
GRANT REFERENCES ON public.cp_notes TO authenticated;
GRANT SELECT ON public.cp_notes TO authenticated;
GRANT TRIGGER ON public.cp_notes TO authenticated;
GRANT TRUNCATE ON public.cp_notes TO authenticated;
GRANT UPDATE ON public.cp_notes TO authenticated;
GRANT DELETE ON public.cp_notes TO service_role;
GRANT INSERT ON public.cp_notes TO service_role;
GRANT REFERENCES ON public.cp_notes TO service_role;
GRANT SELECT ON public.cp_notes TO service_role;
GRANT TRIGGER ON public.cp_notes TO service_role;
GRANT TRUNCATE ON public.cp_notes TO service_role;
GRANT UPDATE ON public.cp_notes TO service_role;
GRANT DELETE ON public.cp_tasks TO anon;
GRANT INSERT ON public.cp_tasks TO anon;
GRANT REFERENCES ON public.cp_tasks TO anon;
GRANT SELECT ON public.cp_tasks TO anon;
GRANT TRIGGER ON public.cp_tasks TO anon;
GRANT TRUNCATE ON public.cp_tasks TO anon;
GRANT UPDATE ON public.cp_tasks TO anon;
GRANT DELETE ON public.cp_tasks TO authenticated;
GRANT INSERT ON public.cp_tasks TO authenticated;
GRANT REFERENCES ON public.cp_tasks TO authenticated;
GRANT SELECT ON public.cp_tasks TO authenticated;
GRANT TRIGGER ON public.cp_tasks TO authenticated;
GRANT TRUNCATE ON public.cp_tasks TO authenticated;
GRANT UPDATE ON public.cp_tasks TO authenticated;
GRANT DELETE ON public.cp_tasks TO service_role;
GRANT INSERT ON public.cp_tasks TO service_role;
GRANT REFERENCES ON public.cp_tasks TO service_role;
GRANT SELECT ON public.cp_tasks TO service_role;
GRANT TRIGGER ON public.cp_tasks TO service_role;
GRANT TRUNCATE ON public.cp_tasks TO service_role;
GRANT UPDATE ON public.cp_tasks TO service_role;
GRANT DELETE ON public.crm_audiences TO anon;
GRANT INSERT ON public.crm_audiences TO anon;
GRANT REFERENCES ON public.crm_audiences TO anon;
GRANT SELECT ON public.crm_audiences TO anon;
GRANT TRIGGER ON public.crm_audiences TO anon;
GRANT TRUNCATE ON public.crm_audiences TO anon;
GRANT UPDATE ON public.crm_audiences TO anon;
GRANT DELETE ON public.crm_audiences TO authenticated;
GRANT INSERT ON public.crm_audiences TO authenticated;
GRANT REFERENCES ON public.crm_audiences TO authenticated;
GRANT SELECT ON public.crm_audiences TO authenticated;
GRANT TRIGGER ON public.crm_audiences TO authenticated;
GRANT TRUNCATE ON public.crm_audiences TO authenticated;
GRANT UPDATE ON public.crm_audiences TO authenticated;
GRANT DELETE ON public.crm_audiences TO service_role;
GRANT INSERT ON public.crm_audiences TO service_role;
GRANT REFERENCES ON public.crm_audiences TO service_role;
GRANT SELECT ON public.crm_audiences TO service_role;
GRANT TRIGGER ON public.crm_audiences TO service_role;
GRANT TRUNCATE ON public.crm_audiences TO service_role;
GRANT UPDATE ON public.crm_audiences TO service_role;
GRANT DELETE ON public.crm_campaign_logs TO anon;
GRANT INSERT ON public.crm_campaign_logs TO anon;
GRANT REFERENCES ON public.crm_campaign_logs TO anon;
GRANT SELECT ON public.crm_campaign_logs TO anon;
GRANT TRIGGER ON public.crm_campaign_logs TO anon;
GRANT TRUNCATE ON public.crm_campaign_logs TO anon;
GRANT UPDATE ON public.crm_campaign_logs TO anon;
GRANT DELETE ON public.crm_campaign_logs TO authenticated;
GRANT INSERT ON public.crm_campaign_logs TO authenticated;
GRANT REFERENCES ON public.crm_campaign_logs TO authenticated;
GRANT SELECT ON public.crm_campaign_logs TO authenticated;
GRANT TRIGGER ON public.crm_campaign_logs TO authenticated;
GRANT TRUNCATE ON public.crm_campaign_logs TO authenticated;
GRANT UPDATE ON public.crm_campaign_logs TO authenticated;
GRANT DELETE ON public.crm_campaign_logs TO service_role;
GRANT INSERT ON public.crm_campaign_logs TO service_role;
GRANT REFERENCES ON public.crm_campaign_logs TO service_role;
GRANT SELECT ON public.crm_campaign_logs TO service_role;
GRANT TRIGGER ON public.crm_campaign_logs TO service_role;
GRANT TRUNCATE ON public.crm_campaign_logs TO service_role;
GRANT UPDATE ON public.crm_campaign_logs TO service_role;
GRANT DELETE ON public.crm_campaigns TO anon;
GRANT INSERT ON public.crm_campaigns TO anon;
GRANT REFERENCES ON public.crm_campaigns TO anon;
GRANT SELECT ON public.crm_campaigns TO anon;
GRANT TRIGGER ON public.crm_campaigns TO anon;
GRANT TRUNCATE ON public.crm_campaigns TO anon;
GRANT UPDATE ON public.crm_campaigns TO anon;
GRANT DELETE ON public.crm_campaigns TO authenticated;
GRANT INSERT ON public.crm_campaigns TO authenticated;
GRANT REFERENCES ON public.crm_campaigns TO authenticated;
GRANT SELECT ON public.crm_campaigns TO authenticated;
GRANT TRIGGER ON public.crm_campaigns TO authenticated;
GRANT TRUNCATE ON public.crm_campaigns TO authenticated;
GRANT UPDATE ON public.crm_campaigns TO authenticated;
GRANT DELETE ON public.crm_campaigns TO service_role;
GRANT INSERT ON public.crm_campaigns TO service_role;
GRANT REFERENCES ON public.crm_campaigns TO service_role;
GRANT SELECT ON public.crm_campaigns TO service_role;
GRANT TRIGGER ON public.crm_campaigns TO service_role;
GRANT TRUNCATE ON public.crm_campaigns TO service_role;
GRANT UPDATE ON public.crm_campaigns TO service_role;
GRANT DELETE ON public.crm_contacts TO anon;
GRANT INSERT ON public.crm_contacts TO anon;
GRANT REFERENCES ON public.crm_contacts TO anon;
GRANT SELECT ON public.crm_contacts TO anon;
GRANT TRIGGER ON public.crm_contacts TO anon;
GRANT TRUNCATE ON public.crm_contacts TO anon;
GRANT UPDATE ON public.crm_contacts TO anon;
GRANT DELETE ON public.crm_contacts TO authenticated;
GRANT INSERT ON public.crm_contacts TO authenticated;
GRANT REFERENCES ON public.crm_contacts TO authenticated;
GRANT SELECT ON public.crm_contacts TO authenticated;
GRANT TRIGGER ON public.crm_contacts TO authenticated;
GRANT TRUNCATE ON public.crm_contacts TO authenticated;
GRANT UPDATE ON public.crm_contacts TO authenticated;
GRANT DELETE ON public.crm_contacts TO service_role;
GRANT INSERT ON public.crm_contacts TO service_role;
GRANT REFERENCES ON public.crm_contacts TO service_role;
GRANT SELECT ON public.crm_contacts TO service_role;
GRANT TRIGGER ON public.crm_contacts TO service_role;
GRANT TRUNCATE ON public.crm_contacts TO service_role;
GRANT UPDATE ON public.crm_contacts TO service_role;
GRANT DELETE ON public.crm_contacts_safe TO anon;
GRANT INSERT ON public.crm_contacts_safe TO anon;
GRANT REFERENCES ON public.crm_contacts_safe TO anon;
GRANT SELECT ON public.crm_contacts_safe TO anon;
GRANT TRIGGER ON public.crm_contacts_safe TO anon;
GRANT TRUNCATE ON public.crm_contacts_safe TO anon;
GRANT UPDATE ON public.crm_contacts_safe TO anon;
GRANT DELETE ON public.crm_contacts_safe TO authenticated;
GRANT INSERT ON public.crm_contacts_safe TO authenticated;
GRANT REFERENCES ON public.crm_contacts_safe TO authenticated;
GRANT SELECT ON public.crm_contacts_safe TO authenticated;
GRANT TRIGGER ON public.crm_contacts_safe TO authenticated;
GRANT TRUNCATE ON public.crm_contacts_safe TO authenticated;
GRANT UPDATE ON public.crm_contacts_safe TO authenticated;
GRANT DELETE ON public.crm_contacts_safe TO service_role;
GRANT INSERT ON public.crm_contacts_safe TO service_role;
GRANT REFERENCES ON public.crm_contacts_safe TO service_role;
GRANT SELECT ON public.crm_contacts_safe TO service_role;
GRANT TRIGGER ON public.crm_contacts_safe TO service_role;
GRANT TRUNCATE ON public.crm_contacts_safe TO service_role;
GRANT UPDATE ON public.crm_contacts_safe TO service_role;
GRANT DELETE ON public.crm_events TO anon;
GRANT INSERT ON public.crm_events TO anon;
GRANT REFERENCES ON public.crm_events TO anon;
GRANT SELECT ON public.crm_events TO anon;
GRANT TRIGGER ON public.crm_events TO anon;
GRANT TRUNCATE ON public.crm_events TO anon;
GRANT UPDATE ON public.crm_events TO anon;
GRANT DELETE ON public.crm_events TO authenticated;
GRANT INSERT ON public.crm_events TO authenticated;
GRANT REFERENCES ON public.crm_events TO authenticated;
GRANT SELECT ON public.crm_events TO authenticated;
GRANT TRIGGER ON public.crm_events TO authenticated;
GRANT TRUNCATE ON public.crm_events TO authenticated;
GRANT UPDATE ON public.crm_events TO authenticated;
GRANT DELETE ON public.crm_events TO service_role;
GRANT INSERT ON public.crm_events TO service_role;
GRANT REFERENCES ON public.crm_events TO service_role;
GRANT SELECT ON public.crm_events TO service_role;
GRANT TRIGGER ON public.crm_events TO service_role;
GRANT TRUNCATE ON public.crm_events TO service_role;
GRANT UPDATE ON public.crm_events TO service_role;
GRANT DELETE ON public.crm_tiers TO anon;
GRANT INSERT ON public.crm_tiers TO anon;
GRANT REFERENCES ON public.crm_tiers TO anon;
GRANT SELECT ON public.crm_tiers TO anon;
GRANT TRIGGER ON public.crm_tiers TO anon;
GRANT TRUNCATE ON public.crm_tiers TO anon;
GRANT UPDATE ON public.crm_tiers TO anon;
GRANT DELETE ON public.crm_tiers TO authenticated;
GRANT INSERT ON public.crm_tiers TO authenticated;
GRANT REFERENCES ON public.crm_tiers TO authenticated;
GRANT SELECT ON public.crm_tiers TO authenticated;
GRANT TRIGGER ON public.crm_tiers TO authenticated;
GRANT TRUNCATE ON public.crm_tiers TO authenticated;
GRANT UPDATE ON public.crm_tiers TO authenticated;
GRANT DELETE ON public.crm_tiers TO service_role;
GRANT INSERT ON public.crm_tiers TO service_role;
GRANT REFERENCES ON public.crm_tiers TO service_role;
GRANT SELECT ON public.crm_tiers TO service_role;
GRANT TRIGGER ON public.crm_tiers TO service_role;
GRANT TRUNCATE ON public.crm_tiers TO service_role;
GRANT UPDATE ON public.crm_tiers TO service_role;
GRANT DELETE ON public.custom_pages TO anon;
GRANT INSERT ON public.custom_pages TO anon;
GRANT REFERENCES ON public.custom_pages TO anon;
GRANT SELECT ON public.custom_pages TO anon;
GRANT TRIGGER ON public.custom_pages TO anon;
GRANT TRUNCATE ON public.custom_pages TO anon;
GRANT UPDATE ON public.custom_pages TO anon;
GRANT DELETE ON public.custom_pages TO authenticated;
GRANT INSERT ON public.custom_pages TO authenticated;
GRANT REFERENCES ON public.custom_pages TO authenticated;
GRANT SELECT ON public.custom_pages TO authenticated;
GRANT TRIGGER ON public.custom_pages TO authenticated;
GRANT TRUNCATE ON public.custom_pages TO authenticated;
GRANT UPDATE ON public.custom_pages TO authenticated;
GRANT DELETE ON public.custom_pages TO service_role;
GRANT INSERT ON public.custom_pages TO service_role;
GRANT REFERENCES ON public.custom_pages TO service_role;
GRANT SELECT ON public.custom_pages TO service_role;
GRANT TRIGGER ON public.custom_pages TO service_role;
GRANT TRUNCATE ON public.custom_pages TO service_role;
GRANT UPDATE ON public.custom_pages TO service_role;
GRANT DELETE ON public.customer_click_events TO anon;
GRANT INSERT ON public.customer_click_events TO anon;
GRANT REFERENCES ON public.customer_click_events TO anon;
GRANT SELECT ON public.customer_click_events TO anon;
GRANT TRIGGER ON public.customer_click_events TO anon;
GRANT TRUNCATE ON public.customer_click_events TO anon;
GRANT UPDATE ON public.customer_click_events TO anon;
GRANT DELETE ON public.customer_click_events TO authenticated;
GRANT INSERT ON public.customer_click_events TO authenticated;
GRANT REFERENCES ON public.customer_click_events TO authenticated;
GRANT SELECT ON public.customer_click_events TO authenticated;
GRANT TRIGGER ON public.customer_click_events TO authenticated;
GRANT TRUNCATE ON public.customer_click_events TO authenticated;
GRANT UPDATE ON public.customer_click_events TO authenticated;
GRANT DELETE ON public.customer_click_events TO service_role;
GRANT INSERT ON public.customer_click_events TO service_role;
GRANT REFERENCES ON public.customer_click_events TO service_role;
GRANT SELECT ON public.customer_click_events TO service_role;
GRANT TRIGGER ON public.customer_click_events TO service_role;
GRANT TRUNCATE ON public.customer_click_events TO service_role;
GRANT UPDATE ON public.customer_click_events TO service_role;
GRANT DELETE ON public.customer_favorite_stores TO anon;
GRANT INSERT ON public.customer_favorite_stores TO anon;
GRANT REFERENCES ON public.customer_favorite_stores TO anon;
GRANT SELECT ON public.customer_favorite_stores TO anon;
GRANT TRIGGER ON public.customer_favorite_stores TO anon;
GRANT TRUNCATE ON public.customer_favorite_stores TO anon;
GRANT UPDATE ON public.customer_favorite_stores TO anon;
GRANT DELETE ON public.customer_favorite_stores TO authenticated;
GRANT INSERT ON public.customer_favorite_stores TO authenticated;
GRANT REFERENCES ON public.customer_favorite_stores TO authenticated;
GRANT SELECT ON public.customer_favorite_stores TO authenticated;
GRANT TRIGGER ON public.customer_favorite_stores TO authenticated;
GRANT TRUNCATE ON public.customer_favorite_stores TO authenticated;
GRANT UPDATE ON public.customer_favorite_stores TO authenticated;
GRANT DELETE ON public.customer_favorite_stores TO service_role;
GRANT INSERT ON public.customer_favorite_stores TO service_role;
GRANT REFERENCES ON public.customer_favorite_stores TO service_role;
GRANT SELECT ON public.customer_favorite_stores TO service_role;
GRANT TRIGGER ON public.customer_favorite_stores TO service_role;
GRANT TRUNCATE ON public.customer_favorite_stores TO service_role;
GRANT UPDATE ON public.customer_favorite_stores TO service_role;
GRANT DELETE ON public.customer_favorites TO anon;
GRANT INSERT ON public.customer_favorites TO anon;
GRANT REFERENCES ON public.customer_favorites TO anon;
GRANT SELECT ON public.customer_favorites TO anon;
GRANT TRIGGER ON public.customer_favorites TO anon;
GRANT TRUNCATE ON public.customer_favorites TO anon;
GRANT UPDATE ON public.customer_favorites TO anon;
GRANT DELETE ON public.customer_favorites TO authenticated;
GRANT INSERT ON public.customer_favorites TO authenticated;
GRANT REFERENCES ON public.customer_favorites TO authenticated;
GRANT SELECT ON public.customer_favorites TO authenticated;
GRANT TRIGGER ON public.customer_favorites TO authenticated;
GRANT TRUNCATE ON public.customer_favorites TO authenticated;
GRANT UPDATE ON public.customer_favorites TO authenticated;
GRANT DELETE ON public.customer_favorites TO service_role;
GRANT INSERT ON public.customer_favorites TO service_role;
GRANT REFERENCES ON public.customer_favorites TO service_role;
GRANT SELECT ON public.customer_favorites TO service_role;
GRANT TRIGGER ON public.customer_favorites TO service_role;
GRANT TRUNCATE ON public.customer_favorites TO service_role;
GRANT UPDATE ON public.customer_favorites TO service_role;
GRANT DELETE ON public.customer_notifications TO anon;
GRANT INSERT ON public.customer_notifications TO anon;
GRANT REFERENCES ON public.customer_notifications TO anon;
GRANT SELECT ON public.customer_notifications TO anon;
GRANT TRIGGER ON public.customer_notifications TO anon;
GRANT TRUNCATE ON public.customer_notifications TO anon;
GRANT UPDATE ON public.customer_notifications TO anon;
GRANT DELETE ON public.customer_notifications TO authenticated;
GRANT INSERT ON public.customer_notifications TO authenticated;
GRANT REFERENCES ON public.customer_notifications TO authenticated;
GRANT SELECT ON public.customer_notifications TO authenticated;
GRANT TRIGGER ON public.customer_notifications TO authenticated;
GRANT TRUNCATE ON public.customer_notifications TO authenticated;
GRANT UPDATE ON public.customer_notifications TO authenticated;
GRANT DELETE ON public.customer_notifications TO service_role;
GRANT INSERT ON public.customer_notifications TO service_role;
GRANT REFERENCES ON public.customer_notifications TO service_role;
GRANT SELECT ON public.customer_notifications TO service_role;
GRANT TRIGGER ON public.customer_notifications TO service_role;
GRANT TRUNCATE ON public.customer_notifications TO service_role;
GRANT UPDATE ON public.customer_notifications TO service_role;
GRANT DELETE ON public.customers TO anon;
GRANT INSERT ON public.customers TO anon;
GRANT REFERENCES ON public.customers TO anon;
GRANT SELECT ON public.customers TO anon;
GRANT TRIGGER ON public.customers TO anon;
GRANT TRUNCATE ON public.customers TO anon;
GRANT UPDATE ON public.customers TO anon;
GRANT DELETE ON public.customers TO authenticated;
GRANT INSERT ON public.customers TO authenticated;
GRANT REFERENCES ON public.customers TO authenticated;
GRANT SELECT ON public.customers TO authenticated;
GRANT TRIGGER ON public.customers TO authenticated;
GRANT TRUNCATE ON public.customers TO authenticated;
GRANT UPDATE ON public.customers TO authenticated;
GRANT DELETE ON public.customers TO service_role;
GRANT INSERT ON public.customers TO service_role;
GRANT REFERENCES ON public.customers TO service_role;
GRANT SELECT ON public.customers TO service_role;
GRANT TRIGGER ON public.customers TO service_role;
GRANT TRUNCATE ON public.customers TO service_role;
GRANT UPDATE ON public.customers TO service_role;
GRANT DELETE ON public.customers_safe TO anon;
GRANT INSERT ON public.customers_safe TO anon;
GRANT REFERENCES ON public.customers_safe TO anon;
GRANT SELECT ON public.customers_safe TO anon;
GRANT TRIGGER ON public.customers_safe TO anon;
GRANT TRUNCATE ON public.customers_safe TO anon;
GRANT UPDATE ON public.customers_safe TO anon;
GRANT DELETE ON public.customers_safe TO authenticated;
GRANT INSERT ON public.customers_safe TO authenticated;
GRANT REFERENCES ON public.customers_safe TO authenticated;
GRANT SELECT ON public.customers_safe TO authenticated;
GRANT TRIGGER ON public.customers_safe TO authenticated;
GRANT TRUNCATE ON public.customers_safe TO authenticated;
GRANT UPDATE ON public.customers_safe TO authenticated;
GRANT DELETE ON public.customers_safe TO service_role;
GRANT INSERT ON public.customers_safe TO service_role;
GRANT REFERENCES ON public.customers_safe TO service_role;
GRANT SELECT ON public.customers_safe TO service_role;
GRANT TRIGGER ON public.customers_safe TO service_role;
GRANT TRUNCATE ON public.customers_safe TO service_role;
GRANT UPDATE ON public.customers_safe TO service_role;
GRANT DELETE ON public.driver_achievements TO anon;
GRANT INSERT ON public.driver_achievements TO anon;
GRANT REFERENCES ON public.driver_achievements TO anon;
GRANT SELECT ON public.driver_achievements TO anon;
GRANT TRIGGER ON public.driver_achievements TO anon;
GRANT TRUNCATE ON public.driver_achievements TO anon;
GRANT UPDATE ON public.driver_achievements TO anon;
GRANT DELETE ON public.driver_achievements TO authenticated;
GRANT INSERT ON public.driver_achievements TO authenticated;
GRANT REFERENCES ON public.driver_achievements TO authenticated;
GRANT SELECT ON public.driver_achievements TO authenticated;
GRANT TRIGGER ON public.driver_achievements TO authenticated;
GRANT TRUNCATE ON public.driver_achievements TO authenticated;
GRANT UPDATE ON public.driver_achievements TO authenticated;
GRANT DELETE ON public.driver_achievements TO service_role;
GRANT INSERT ON public.driver_achievements TO service_role;
GRANT REFERENCES ON public.driver_achievements TO service_role;
GRANT SELECT ON public.driver_achievements TO service_role;
GRANT TRIGGER ON public.driver_achievements TO service_role;
GRANT TRUNCATE ON public.driver_achievements TO service_role;
GRANT UPDATE ON public.driver_achievements TO service_role;
GRANT DELETE ON public.driver_duel_audit_log TO anon;
GRANT INSERT ON public.driver_duel_audit_log TO anon;
GRANT REFERENCES ON public.driver_duel_audit_log TO anon;
GRANT SELECT ON public.driver_duel_audit_log TO anon;
GRANT TRIGGER ON public.driver_duel_audit_log TO anon;
GRANT TRUNCATE ON public.driver_duel_audit_log TO anon;
GRANT UPDATE ON public.driver_duel_audit_log TO anon;
GRANT DELETE ON public.driver_duel_audit_log TO authenticated;
GRANT INSERT ON public.driver_duel_audit_log TO authenticated;
GRANT REFERENCES ON public.driver_duel_audit_log TO authenticated;
GRANT SELECT ON public.driver_duel_audit_log TO authenticated;
GRANT TRIGGER ON public.driver_duel_audit_log TO authenticated;
GRANT TRUNCATE ON public.driver_duel_audit_log TO authenticated;
GRANT UPDATE ON public.driver_duel_audit_log TO authenticated;
GRANT DELETE ON public.driver_duel_audit_log TO service_role;
GRANT INSERT ON public.driver_duel_audit_log TO service_role;
GRANT REFERENCES ON public.driver_duel_audit_log TO service_role;
GRANT SELECT ON public.driver_duel_audit_log TO service_role;
GRANT TRIGGER ON public.driver_duel_audit_log TO service_role;
GRANT TRUNCATE ON public.driver_duel_audit_log TO service_role;
GRANT UPDATE ON public.driver_duel_audit_log TO service_role;
GRANT DELETE ON public.driver_duel_guesses TO anon;
GRANT INSERT ON public.driver_duel_guesses TO anon;
GRANT REFERENCES ON public.driver_duel_guesses TO anon;
GRANT SELECT ON public.driver_duel_guesses TO anon;
GRANT TRIGGER ON public.driver_duel_guesses TO anon;
GRANT TRUNCATE ON public.driver_duel_guesses TO anon;
GRANT UPDATE ON public.driver_duel_guesses TO anon;
GRANT DELETE ON public.driver_duel_guesses TO authenticated;
GRANT INSERT ON public.driver_duel_guesses TO authenticated;
GRANT REFERENCES ON public.driver_duel_guesses TO authenticated;
GRANT SELECT ON public.driver_duel_guesses TO authenticated;
GRANT TRIGGER ON public.driver_duel_guesses TO authenticated;
GRANT TRUNCATE ON public.driver_duel_guesses TO authenticated;
GRANT UPDATE ON public.driver_duel_guesses TO authenticated;
GRANT DELETE ON public.driver_duel_guesses TO service_role;
GRANT INSERT ON public.driver_duel_guesses TO service_role;
GRANT REFERENCES ON public.driver_duel_guesses TO service_role;
GRANT SELECT ON public.driver_duel_guesses TO service_role;
GRANT TRIGGER ON public.driver_duel_guesses TO service_role;
GRANT TRUNCATE ON public.driver_duel_guesses TO service_role;
GRANT UPDATE ON public.driver_duel_guesses TO service_role;
GRANT DELETE ON public.driver_duel_participants TO anon;
GRANT INSERT ON public.driver_duel_participants TO anon;
GRANT REFERENCES ON public.driver_duel_participants TO anon;
GRANT SELECT ON public.driver_duel_participants TO anon;
GRANT TRIGGER ON public.driver_duel_participants TO anon;
GRANT TRUNCATE ON public.driver_duel_participants TO anon;
GRANT UPDATE ON public.driver_duel_participants TO anon;
GRANT DELETE ON public.driver_duel_participants TO authenticated;
GRANT INSERT ON public.driver_duel_participants TO authenticated;
GRANT REFERENCES ON public.driver_duel_participants TO authenticated;
GRANT SELECT ON public.driver_duel_participants TO authenticated;
GRANT TRIGGER ON public.driver_duel_participants TO authenticated;
GRANT TRUNCATE ON public.driver_duel_participants TO authenticated;
GRANT UPDATE ON public.driver_duel_participants TO authenticated;
GRANT DELETE ON public.driver_duel_participants TO service_role;
GRANT INSERT ON public.driver_duel_participants TO service_role;
GRANT REFERENCES ON public.driver_duel_participants TO service_role;
GRANT SELECT ON public.driver_duel_participants TO service_role;
GRANT TRIGGER ON public.driver_duel_participants TO service_role;
GRANT TRUNCATE ON public.driver_duel_participants TO service_role;
GRANT UPDATE ON public.driver_duel_participants TO service_role;
GRANT DELETE ON public.driver_duel_ratings TO anon;
GRANT INSERT ON public.driver_duel_ratings TO anon;
GRANT REFERENCES ON public.driver_duel_ratings TO anon;
GRANT SELECT ON public.driver_duel_ratings TO anon;
GRANT TRIGGER ON public.driver_duel_ratings TO anon;
GRANT TRUNCATE ON public.driver_duel_ratings TO anon;
GRANT UPDATE ON public.driver_duel_ratings TO anon;
GRANT DELETE ON public.driver_duel_ratings TO authenticated;
GRANT INSERT ON public.driver_duel_ratings TO authenticated;
GRANT REFERENCES ON public.driver_duel_ratings TO authenticated;
GRANT SELECT ON public.driver_duel_ratings TO authenticated;
GRANT TRIGGER ON public.driver_duel_ratings TO authenticated;
GRANT TRUNCATE ON public.driver_duel_ratings TO authenticated;
GRANT UPDATE ON public.driver_duel_ratings TO authenticated;
GRANT DELETE ON public.driver_duel_ratings TO service_role;
GRANT INSERT ON public.driver_duel_ratings TO service_role;
GRANT REFERENCES ON public.driver_duel_ratings TO service_role;
GRANT SELECT ON public.driver_duel_ratings TO service_role;
GRANT TRIGGER ON public.driver_duel_ratings TO service_role;
GRANT TRUNCATE ON public.driver_duel_ratings TO service_role;
GRANT UPDATE ON public.driver_duel_ratings TO service_role;
GRANT DELETE ON public.driver_duels TO anon;
GRANT INSERT ON public.driver_duels TO anon;
GRANT REFERENCES ON public.driver_duels TO anon;
GRANT SELECT ON public.driver_duels TO anon;
GRANT TRIGGER ON public.driver_duels TO anon;
GRANT TRUNCATE ON public.driver_duels TO anon;
GRANT UPDATE ON public.driver_duels TO anon;
GRANT DELETE ON public.driver_duels TO authenticated;
GRANT INSERT ON public.driver_duels TO authenticated;
GRANT REFERENCES ON public.driver_duels TO authenticated;
GRANT SELECT ON public.driver_duels TO authenticated;
GRANT TRIGGER ON public.driver_duels TO authenticated;
GRANT TRUNCATE ON public.driver_duels TO authenticated;
GRANT UPDATE ON public.driver_duels TO authenticated;
GRANT DELETE ON public.driver_duels TO service_role;
GRANT INSERT ON public.driver_duels TO service_role;
GRANT REFERENCES ON public.driver_duels TO service_role;
GRANT SELECT ON public.driver_duels TO service_role;
GRANT TRIGGER ON public.driver_duels TO service_role;
GRANT TRUNCATE ON public.driver_duels TO service_role;
GRANT UPDATE ON public.driver_duels TO service_role;
GRANT DELETE ON public.driver_import_jobs TO anon;
GRANT INSERT ON public.driver_import_jobs TO anon;
GRANT REFERENCES ON public.driver_import_jobs TO anon;
GRANT SELECT ON public.driver_import_jobs TO anon;
GRANT TRIGGER ON public.driver_import_jobs TO anon;
GRANT TRUNCATE ON public.driver_import_jobs TO anon;
GRANT UPDATE ON public.driver_import_jobs TO anon;
GRANT DELETE ON public.driver_import_jobs TO authenticated;
GRANT INSERT ON public.driver_import_jobs TO authenticated;
GRANT REFERENCES ON public.driver_import_jobs TO authenticated;
GRANT SELECT ON public.driver_import_jobs TO authenticated;
GRANT TRIGGER ON public.driver_import_jobs TO authenticated;
GRANT TRUNCATE ON public.driver_import_jobs TO authenticated;
GRANT UPDATE ON public.driver_import_jobs TO authenticated;
GRANT DELETE ON public.driver_import_jobs TO service_role;
GRANT INSERT ON public.driver_import_jobs TO service_role;
GRANT REFERENCES ON public.driver_import_jobs TO service_role;
GRANT SELECT ON public.driver_import_jobs TO service_role;
GRANT TRIGGER ON public.driver_import_jobs TO service_role;
GRANT TRUNCATE ON public.driver_import_jobs TO service_role;
GRANT UPDATE ON public.driver_import_jobs TO service_role;
GRANT DELETE ON public.driver_message_flows TO anon;
GRANT INSERT ON public.driver_message_flows TO anon;
GRANT REFERENCES ON public.driver_message_flows TO anon;
GRANT SELECT ON public.driver_message_flows TO anon;
GRANT TRIGGER ON public.driver_message_flows TO anon;
GRANT TRUNCATE ON public.driver_message_flows TO anon;
GRANT UPDATE ON public.driver_message_flows TO anon;
GRANT DELETE ON public.driver_message_flows TO authenticated;
GRANT INSERT ON public.driver_message_flows TO authenticated;
GRANT REFERENCES ON public.driver_message_flows TO authenticated;
GRANT SELECT ON public.driver_message_flows TO authenticated;
GRANT TRIGGER ON public.driver_message_flows TO authenticated;
GRANT TRUNCATE ON public.driver_message_flows TO authenticated;
GRANT UPDATE ON public.driver_message_flows TO authenticated;
GRANT DELETE ON public.driver_message_flows TO service_role;
GRANT INSERT ON public.driver_message_flows TO service_role;
GRANT REFERENCES ON public.driver_message_flows TO service_role;
GRANT SELECT ON public.driver_message_flows TO service_role;
GRANT TRIGGER ON public.driver_message_flows TO service_role;
GRANT TRUNCATE ON public.driver_message_flows TO service_role;
GRANT UPDATE ON public.driver_message_flows TO service_role;
GRANT DELETE ON public.driver_message_logs TO anon;
GRANT INSERT ON public.driver_message_logs TO anon;
GRANT REFERENCES ON public.driver_message_logs TO anon;
GRANT SELECT ON public.driver_message_logs TO anon;
GRANT TRIGGER ON public.driver_message_logs TO anon;
GRANT TRUNCATE ON public.driver_message_logs TO anon;
GRANT UPDATE ON public.driver_message_logs TO anon;
GRANT DELETE ON public.driver_message_logs TO authenticated;
GRANT INSERT ON public.driver_message_logs TO authenticated;
GRANT REFERENCES ON public.driver_message_logs TO authenticated;
GRANT SELECT ON public.driver_message_logs TO authenticated;
GRANT TRIGGER ON public.driver_message_logs TO authenticated;
GRANT TRUNCATE ON public.driver_message_logs TO authenticated;
GRANT UPDATE ON public.driver_message_logs TO authenticated;
GRANT DELETE ON public.driver_message_logs TO service_role;
GRANT INSERT ON public.driver_message_logs TO service_role;
GRANT REFERENCES ON public.driver_message_logs TO service_role;
GRANT SELECT ON public.driver_message_logs TO service_role;
GRANT TRIGGER ON public.driver_message_logs TO service_role;
GRANT TRUNCATE ON public.driver_message_logs TO service_role;
GRANT UPDATE ON public.driver_message_logs TO service_role;
GRANT DELETE ON public.driver_message_templates TO anon;
GRANT INSERT ON public.driver_message_templates TO anon;
GRANT REFERENCES ON public.driver_message_templates TO anon;
GRANT SELECT ON public.driver_message_templates TO anon;
GRANT TRIGGER ON public.driver_message_templates TO anon;
GRANT TRUNCATE ON public.driver_message_templates TO anon;
GRANT UPDATE ON public.driver_message_templates TO anon;
GRANT DELETE ON public.driver_message_templates TO authenticated;
GRANT INSERT ON public.driver_message_templates TO authenticated;
GRANT REFERENCES ON public.driver_message_templates TO authenticated;
GRANT SELECT ON public.driver_message_templates TO authenticated;
GRANT TRIGGER ON public.driver_message_templates TO authenticated;
GRANT TRUNCATE ON public.driver_message_templates TO authenticated;
GRANT UPDATE ON public.driver_message_templates TO authenticated;
GRANT DELETE ON public.driver_message_templates TO service_role;
GRANT INSERT ON public.driver_message_templates TO service_role;
GRANT REFERENCES ON public.driver_message_templates TO service_role;
GRANT SELECT ON public.driver_message_templates TO service_role;
GRANT TRIGGER ON public.driver_message_templates TO service_role;
GRANT TRUNCATE ON public.driver_message_templates TO service_role;
GRANT UPDATE ON public.driver_message_templates TO service_role;
GRANT DELETE ON public.driver_points_orders TO anon;
GRANT INSERT ON public.driver_points_orders TO anon;
GRANT REFERENCES ON public.driver_points_orders TO anon;
GRANT SELECT ON public.driver_points_orders TO anon;
GRANT TRIGGER ON public.driver_points_orders TO anon;
GRANT TRUNCATE ON public.driver_points_orders TO anon;
GRANT UPDATE ON public.driver_points_orders TO anon;
GRANT DELETE ON public.driver_points_orders TO authenticated;
GRANT INSERT ON public.driver_points_orders TO authenticated;
GRANT REFERENCES ON public.driver_points_orders TO authenticated;
GRANT SELECT ON public.driver_points_orders TO authenticated;
GRANT TRIGGER ON public.driver_points_orders TO authenticated;
GRANT TRUNCATE ON public.driver_points_orders TO authenticated;
GRANT UPDATE ON public.driver_points_orders TO authenticated;
GRANT DELETE ON public.driver_points_orders TO service_role;
GRANT INSERT ON public.driver_points_orders TO service_role;
GRANT REFERENCES ON public.driver_points_orders TO service_role;
GRANT SELECT ON public.driver_points_orders TO service_role;
GRANT TRIGGER ON public.driver_points_orders TO service_role;
GRANT TRUNCATE ON public.driver_points_orders TO service_role;
GRANT UPDATE ON public.driver_points_orders TO service_role;
GRANT DELETE ON public.driver_points_purchase_config TO anon;
GRANT INSERT ON public.driver_points_purchase_config TO anon;
GRANT REFERENCES ON public.driver_points_purchase_config TO anon;
GRANT SELECT ON public.driver_points_purchase_config TO anon;
GRANT TRIGGER ON public.driver_points_purchase_config TO anon;
GRANT TRUNCATE ON public.driver_points_purchase_config TO anon;
GRANT UPDATE ON public.driver_points_purchase_config TO anon;
GRANT DELETE ON public.driver_points_purchase_config TO authenticated;
GRANT INSERT ON public.driver_points_purchase_config TO authenticated;
GRANT REFERENCES ON public.driver_points_purchase_config TO authenticated;
GRANT SELECT ON public.driver_points_purchase_config TO authenticated;
GRANT TRIGGER ON public.driver_points_purchase_config TO authenticated;
GRANT TRUNCATE ON public.driver_points_purchase_config TO authenticated;
GRANT UPDATE ON public.driver_points_purchase_config TO authenticated;
GRANT DELETE ON public.driver_points_purchase_config TO service_role;
GRANT INSERT ON public.driver_points_purchase_config TO service_role;
GRANT REFERENCES ON public.driver_points_purchase_config TO service_role;
GRANT SELECT ON public.driver_points_purchase_config TO service_role;
GRANT TRIGGER ON public.driver_points_purchase_config TO service_role;
GRANT TRUNCATE ON public.driver_points_purchase_config TO service_role;
GRANT UPDATE ON public.driver_points_purchase_config TO service_role;
GRANT DELETE ON public.driver_points_rules TO anon;
GRANT INSERT ON public.driver_points_rules TO anon;
GRANT REFERENCES ON public.driver_points_rules TO anon;
GRANT SELECT ON public.driver_points_rules TO anon;
GRANT TRIGGER ON public.driver_points_rules TO anon;
GRANT TRUNCATE ON public.driver_points_rules TO anon;
GRANT UPDATE ON public.driver_points_rules TO anon;
GRANT DELETE ON public.driver_points_rules TO authenticated;
GRANT INSERT ON public.driver_points_rules TO authenticated;
GRANT REFERENCES ON public.driver_points_rules TO authenticated;
GRANT SELECT ON public.driver_points_rules TO authenticated;
GRANT TRIGGER ON public.driver_points_rules TO authenticated;
GRANT TRUNCATE ON public.driver_points_rules TO authenticated;
GRANT UPDATE ON public.driver_points_rules TO authenticated;
GRANT DELETE ON public.driver_points_rules TO service_role;
GRANT INSERT ON public.driver_points_rules TO service_role;
GRANT REFERENCES ON public.driver_points_rules TO service_role;
GRANT SELECT ON public.driver_points_rules TO service_role;
GRANT TRIGGER ON public.driver_points_rules TO service_role;
GRANT TRUNCATE ON public.driver_points_rules TO service_role;
GRANT UPDATE ON public.driver_points_rules TO service_role;
GRANT DELETE ON public.driver_profiles TO anon;
GRANT INSERT ON public.driver_profiles TO anon;
GRANT REFERENCES ON public.driver_profiles TO anon;
GRANT SELECT ON public.driver_profiles TO anon;
GRANT TRIGGER ON public.driver_profiles TO anon;
GRANT TRUNCATE ON public.driver_profiles TO anon;
GRANT UPDATE ON public.driver_profiles TO anon;
GRANT DELETE ON public.driver_profiles TO authenticated;
GRANT INSERT ON public.driver_profiles TO authenticated;
GRANT REFERENCES ON public.driver_profiles TO authenticated;
GRANT SELECT ON public.driver_profiles TO authenticated;
GRANT TRIGGER ON public.driver_profiles TO authenticated;
GRANT TRUNCATE ON public.driver_profiles TO authenticated;
GRANT UPDATE ON public.driver_profiles TO authenticated;
GRANT DELETE ON public.driver_profiles TO service_role;
GRANT INSERT ON public.driver_profiles TO service_role;
GRANT REFERENCES ON public.driver_profiles TO service_role;
GRANT SELECT ON public.driver_profiles TO service_role;
GRANT TRIGGER ON public.driver_profiles TO service_role;
GRANT TRUNCATE ON public.driver_profiles TO service_role;
GRANT UPDATE ON public.driver_profiles TO service_role;
GRANT DELETE ON public.driver_verification_codes TO anon;
GRANT INSERT ON public.driver_verification_codes TO anon;
GRANT REFERENCES ON public.driver_verification_codes TO anon;
GRANT SELECT ON public.driver_verification_codes TO anon;
GRANT TRIGGER ON public.driver_verification_codes TO anon;
GRANT TRUNCATE ON public.driver_verification_codes TO anon;
GRANT UPDATE ON public.driver_verification_codes TO anon;
GRANT DELETE ON public.driver_verification_codes TO authenticated;
GRANT INSERT ON public.driver_verification_codes TO authenticated;
GRANT REFERENCES ON public.driver_verification_codes TO authenticated;
GRANT SELECT ON public.driver_verification_codes TO authenticated;
GRANT TRIGGER ON public.driver_verification_codes TO authenticated;
GRANT TRUNCATE ON public.driver_verification_codes TO authenticated;
GRANT UPDATE ON public.driver_verification_codes TO authenticated;
GRANT DELETE ON public.driver_verification_codes TO service_role;
GRANT INSERT ON public.driver_verification_codes TO service_role;
GRANT REFERENCES ON public.driver_verification_codes TO service_role;
GRANT SELECT ON public.driver_verification_codes TO service_role;
GRANT TRIGGER ON public.driver_verification_codes TO service_role;
GRANT TRUNCATE ON public.driver_verification_codes TO service_role;
GRANT UPDATE ON public.driver_verification_codes TO service_role;
GRANT DELETE ON public.duel_cycle_reset_history TO anon;
GRANT INSERT ON public.duel_cycle_reset_history TO anon;
GRANT REFERENCES ON public.duel_cycle_reset_history TO anon;
GRANT SELECT ON public.duel_cycle_reset_history TO anon;
GRANT TRIGGER ON public.duel_cycle_reset_history TO anon;
GRANT TRUNCATE ON public.duel_cycle_reset_history TO anon;
GRANT UPDATE ON public.duel_cycle_reset_history TO anon;
GRANT DELETE ON public.duel_cycle_reset_history TO authenticated;
GRANT INSERT ON public.duel_cycle_reset_history TO authenticated;
GRANT REFERENCES ON public.duel_cycle_reset_history TO authenticated;
GRANT SELECT ON public.duel_cycle_reset_history TO authenticated;
GRANT TRIGGER ON public.duel_cycle_reset_history TO authenticated;
GRANT TRUNCATE ON public.duel_cycle_reset_history TO authenticated;
GRANT UPDATE ON public.duel_cycle_reset_history TO authenticated;
GRANT DELETE ON public.duel_cycle_reset_history TO service_role;
GRANT INSERT ON public.duel_cycle_reset_history TO service_role;
GRANT REFERENCES ON public.duel_cycle_reset_history TO service_role;
GRANT SELECT ON public.duel_cycle_reset_history TO service_role;
GRANT TRIGGER ON public.duel_cycle_reset_history TO service_role;
GRANT TRUNCATE ON public.duel_cycle_reset_history TO service_role;
GRANT UPDATE ON public.duel_cycle_reset_history TO service_role;
GRANT DELETE ON public.duel_prize_campaigns TO anon;
GRANT INSERT ON public.duel_prize_campaigns TO anon;
GRANT REFERENCES ON public.duel_prize_campaigns TO anon;
GRANT SELECT ON public.duel_prize_campaigns TO anon;
GRANT TRIGGER ON public.duel_prize_campaigns TO anon;
GRANT TRUNCATE ON public.duel_prize_campaigns TO anon;
GRANT UPDATE ON public.duel_prize_campaigns TO anon;
GRANT DELETE ON public.duel_prize_campaigns TO authenticated;
GRANT INSERT ON public.duel_prize_campaigns TO authenticated;
GRANT REFERENCES ON public.duel_prize_campaigns TO authenticated;
GRANT SELECT ON public.duel_prize_campaigns TO authenticated;
GRANT TRIGGER ON public.duel_prize_campaigns TO authenticated;
GRANT TRUNCATE ON public.duel_prize_campaigns TO authenticated;
GRANT UPDATE ON public.duel_prize_campaigns TO authenticated;
GRANT DELETE ON public.duel_prize_campaigns TO service_role;
GRANT INSERT ON public.duel_prize_campaigns TO service_role;
GRANT REFERENCES ON public.duel_prize_campaigns TO service_role;
GRANT SELECT ON public.duel_prize_campaigns TO service_role;
GRANT TRIGGER ON public.duel_prize_campaigns TO service_role;
GRANT TRUNCATE ON public.duel_prize_campaigns TO service_role;
GRANT UPDATE ON public.duel_prize_campaigns TO service_role;
GRANT DELETE ON public.duel_side_bets TO anon;
GRANT INSERT ON public.duel_side_bets TO anon;
GRANT REFERENCES ON public.duel_side_bets TO anon;
GRANT SELECT ON public.duel_side_bets TO anon;
GRANT TRIGGER ON public.duel_side_bets TO anon;
GRANT TRUNCATE ON public.duel_side_bets TO anon;
GRANT UPDATE ON public.duel_side_bets TO anon;
GRANT DELETE ON public.duel_side_bets TO authenticated;
GRANT INSERT ON public.duel_side_bets TO authenticated;
GRANT REFERENCES ON public.duel_side_bets TO authenticated;
GRANT SELECT ON public.duel_side_bets TO authenticated;
GRANT TRIGGER ON public.duel_side_bets TO authenticated;
GRANT TRUNCATE ON public.duel_side_bets TO authenticated;
GRANT UPDATE ON public.duel_side_bets TO authenticated;
GRANT DELETE ON public.duel_side_bets TO service_role;
GRANT INSERT ON public.duel_side_bets TO service_role;
GRANT REFERENCES ON public.duel_side_bets TO service_role;
GRANT SELECT ON public.duel_side_bets TO service_role;
GRANT TRIGGER ON public.duel_side_bets TO service_role;
GRANT TRUNCATE ON public.duel_side_bets TO service_role;
GRANT UPDATE ON public.duel_side_bets TO service_role;
GRANT DELETE ON public.earning_events TO anon;
GRANT INSERT ON public.earning_events TO anon;
GRANT REFERENCES ON public.earning_events TO anon;
GRANT SELECT ON public.earning_events TO anon;
GRANT TRIGGER ON public.earning_events TO anon;
GRANT TRUNCATE ON public.earning_events TO anon;
GRANT UPDATE ON public.earning_events TO anon;
GRANT DELETE ON public.earning_events TO authenticated;
GRANT INSERT ON public.earning_events TO authenticated;
GRANT REFERENCES ON public.earning_events TO authenticated;
GRANT SELECT ON public.earning_events TO authenticated;
GRANT TRIGGER ON public.earning_events TO authenticated;
GRANT TRUNCATE ON public.earning_events TO authenticated;
GRANT UPDATE ON public.earning_events TO authenticated;
GRANT DELETE ON public.earning_events TO service_role;
GRANT INSERT ON public.earning_events TO service_role;
GRANT REFERENCES ON public.earning_events TO service_role;
GRANT SELECT ON public.earning_events TO service_role;
GRANT TRIGGER ON public.earning_events TO service_role;
GRANT TRUNCATE ON public.earning_events TO service_role;
GRANT UPDATE ON public.earning_events TO service_role;
GRANT DELETE ON public.error_logs TO anon;
GRANT INSERT ON public.error_logs TO anon;
GRANT REFERENCES ON public.error_logs TO anon;
GRANT SELECT ON public.error_logs TO anon;
GRANT TRIGGER ON public.error_logs TO anon;
GRANT TRUNCATE ON public.error_logs TO anon;
GRANT UPDATE ON public.error_logs TO anon;
GRANT DELETE ON public.error_logs TO authenticated;
GRANT INSERT ON public.error_logs TO authenticated;
GRANT REFERENCES ON public.error_logs TO authenticated;
GRANT SELECT ON public.error_logs TO authenticated;
GRANT TRIGGER ON public.error_logs TO authenticated;
GRANT TRUNCATE ON public.error_logs TO authenticated;
GRANT UPDATE ON public.error_logs TO authenticated;
GRANT DELETE ON public.error_logs TO service_role;
GRANT INSERT ON public.error_logs TO service_role;
GRANT REFERENCES ON public.error_logs TO service_role;
GRANT SELECT ON public.error_logs TO service_role;
GRANT TRIGGER ON public.error_logs TO service_role;
GRANT TRUNCATE ON public.error_logs TO service_role;
GRANT UPDATE ON public.error_logs TO service_role;
GRANT DELETE ON public.feature_flags TO anon;
GRANT INSERT ON public.feature_flags TO anon;
GRANT REFERENCES ON public.feature_flags TO anon;
GRANT SELECT ON public.feature_flags TO anon;
GRANT TRIGGER ON public.feature_flags TO anon;
GRANT TRUNCATE ON public.feature_flags TO anon;
GRANT UPDATE ON public.feature_flags TO anon;
GRANT DELETE ON public.feature_flags TO authenticated;
GRANT INSERT ON public.feature_flags TO authenticated;
GRANT REFERENCES ON public.feature_flags TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT TRIGGER ON public.feature_flags TO authenticated;
GRANT TRUNCATE ON public.feature_flags TO authenticated;
GRANT UPDATE ON public.feature_flags TO authenticated;
GRANT DELETE ON public.feature_flags TO service_role;
GRANT INSERT ON public.feature_flags TO service_role;
GRANT REFERENCES ON public.feature_flags TO service_role;
GRANT SELECT ON public.feature_flags TO service_role;
GRANT TRIGGER ON public.feature_flags TO service_role;
GRANT TRUNCATE ON public.feature_flags TO service_role;
GRANT UPDATE ON public.feature_flags TO service_role;
GRANT DELETE ON public.gamification_seasons TO anon;
GRANT INSERT ON public.gamification_seasons TO anon;
GRANT REFERENCES ON public.gamification_seasons TO anon;
GRANT SELECT ON public.gamification_seasons TO anon;
GRANT TRIGGER ON public.gamification_seasons TO anon;
GRANT TRUNCATE ON public.gamification_seasons TO anon;
GRANT UPDATE ON public.gamification_seasons TO anon;
GRANT DELETE ON public.gamification_seasons TO authenticated;
GRANT INSERT ON public.gamification_seasons TO authenticated;
GRANT REFERENCES ON public.gamification_seasons TO authenticated;
GRANT SELECT ON public.gamification_seasons TO authenticated;
GRANT TRIGGER ON public.gamification_seasons TO authenticated;
GRANT TRUNCATE ON public.gamification_seasons TO authenticated;
GRANT UPDATE ON public.gamification_seasons TO authenticated;
GRANT DELETE ON public.gamification_seasons TO service_role;
GRANT INSERT ON public.gamification_seasons TO service_role;
GRANT REFERENCES ON public.gamification_seasons TO service_role;
GRANT SELECT ON public.gamification_seasons TO service_role;
GRANT TRIGGER ON public.gamification_seasons TO service_role;
GRANT TRUNCATE ON public.gamification_seasons TO service_role;
GRANT UPDATE ON public.gamification_seasons TO service_role;
GRANT DELETE ON public.ganha_ganha_billing_events TO anon;
GRANT INSERT ON public.ganha_ganha_billing_events TO anon;
GRANT REFERENCES ON public.ganha_ganha_billing_events TO anon;
GRANT SELECT ON public.ganha_ganha_billing_events TO anon;
GRANT TRIGGER ON public.ganha_ganha_billing_events TO anon;
GRANT TRUNCATE ON public.ganha_ganha_billing_events TO anon;
GRANT UPDATE ON public.ganha_ganha_billing_events TO anon;
GRANT DELETE ON public.ganha_ganha_billing_events TO authenticated;
GRANT INSERT ON public.ganha_ganha_billing_events TO authenticated;
GRANT REFERENCES ON public.ganha_ganha_billing_events TO authenticated;
GRANT SELECT ON public.ganha_ganha_billing_events TO authenticated;
GRANT TRIGGER ON public.ganha_ganha_billing_events TO authenticated;
GRANT TRUNCATE ON public.ganha_ganha_billing_events TO authenticated;
GRANT UPDATE ON public.ganha_ganha_billing_events TO authenticated;
GRANT DELETE ON public.ganha_ganha_billing_events TO service_role;
GRANT INSERT ON public.ganha_ganha_billing_events TO service_role;
GRANT REFERENCES ON public.ganha_ganha_billing_events TO service_role;
GRANT SELECT ON public.ganha_ganha_billing_events TO service_role;
GRANT TRIGGER ON public.ganha_ganha_billing_events TO service_role;
GRANT TRUNCATE ON public.ganha_ganha_billing_events TO service_role;
GRANT UPDATE ON public.ganha_ganha_billing_events TO service_role;
GRANT DELETE ON public.ganha_ganha_config TO anon;
GRANT INSERT ON public.ganha_ganha_config TO anon;
GRANT REFERENCES ON public.ganha_ganha_config TO anon;
GRANT SELECT ON public.ganha_ganha_config TO anon;
GRANT TRIGGER ON public.ganha_ganha_config TO anon;
GRANT TRUNCATE ON public.ganha_ganha_config TO anon;
GRANT UPDATE ON public.ganha_ganha_config TO anon;
GRANT DELETE ON public.ganha_ganha_config TO authenticated;
GRANT INSERT ON public.ganha_ganha_config TO authenticated;
GRANT REFERENCES ON public.ganha_ganha_config TO authenticated;
GRANT SELECT ON public.ganha_ganha_config TO authenticated;
GRANT TRIGGER ON public.ganha_ganha_config TO authenticated;
GRANT TRUNCATE ON public.ganha_ganha_config TO authenticated;
GRANT UPDATE ON public.ganha_ganha_config TO authenticated;
GRANT DELETE ON public.ganha_ganha_config TO service_role;
GRANT INSERT ON public.ganha_ganha_config TO service_role;
GRANT REFERENCES ON public.ganha_ganha_config TO service_role;
GRANT SELECT ON public.ganha_ganha_config TO service_role;
GRANT TRIGGER ON public.ganha_ganha_config TO service_role;
GRANT TRUNCATE ON public.ganha_ganha_config TO service_role;
GRANT UPDATE ON public.ganha_ganha_config TO service_role;
GRANT DELETE ON public.ganha_ganha_store_fees TO anon;
GRANT INSERT ON public.ganha_ganha_store_fees TO anon;
GRANT REFERENCES ON public.ganha_ganha_store_fees TO anon;
GRANT SELECT ON public.ganha_ganha_store_fees TO anon;
GRANT TRIGGER ON public.ganha_ganha_store_fees TO anon;
GRANT TRUNCATE ON public.ganha_ganha_store_fees TO anon;
GRANT UPDATE ON public.ganha_ganha_store_fees TO anon;
GRANT DELETE ON public.ganha_ganha_store_fees TO authenticated;
GRANT INSERT ON public.ganha_ganha_store_fees TO authenticated;
GRANT REFERENCES ON public.ganha_ganha_store_fees TO authenticated;
GRANT SELECT ON public.ganha_ganha_store_fees TO authenticated;
GRANT TRIGGER ON public.ganha_ganha_store_fees TO authenticated;
GRANT TRUNCATE ON public.ganha_ganha_store_fees TO authenticated;
GRANT UPDATE ON public.ganha_ganha_store_fees TO authenticated;
GRANT DELETE ON public.ganha_ganha_store_fees TO service_role;
GRANT INSERT ON public.ganha_ganha_store_fees TO service_role;
GRANT REFERENCES ON public.ganha_ganha_store_fees TO service_role;
GRANT SELECT ON public.ganha_ganha_store_fees TO service_role;
GRANT TRIGGER ON public.ganha_ganha_store_fees TO service_role;
GRANT TRUNCATE ON public.ganha_ganha_store_fees TO service_role;
GRANT UPDATE ON public.ganha_ganha_store_fees TO service_role;
GRANT DELETE ON public.home_template_apply_jobs TO anon;
GRANT INSERT ON public.home_template_apply_jobs TO anon;
GRANT REFERENCES ON public.home_template_apply_jobs TO anon;
GRANT SELECT ON public.home_template_apply_jobs TO anon;
GRANT TRIGGER ON public.home_template_apply_jobs TO anon;
GRANT TRUNCATE ON public.home_template_apply_jobs TO anon;
GRANT UPDATE ON public.home_template_apply_jobs TO anon;
GRANT DELETE ON public.home_template_apply_jobs TO authenticated;
GRANT INSERT ON public.home_template_apply_jobs TO authenticated;
GRANT REFERENCES ON public.home_template_apply_jobs TO authenticated;
GRANT SELECT ON public.home_template_apply_jobs TO authenticated;
GRANT TRIGGER ON public.home_template_apply_jobs TO authenticated;
GRANT TRUNCATE ON public.home_template_apply_jobs TO authenticated;
GRANT UPDATE ON public.home_template_apply_jobs TO authenticated;
GRANT DELETE ON public.home_template_apply_jobs TO service_role;
GRANT INSERT ON public.home_template_apply_jobs TO service_role;
GRANT REFERENCES ON public.home_template_apply_jobs TO service_role;
GRANT SELECT ON public.home_template_apply_jobs TO service_role;
GRANT TRIGGER ON public.home_template_apply_jobs TO service_role;
GRANT TRUNCATE ON public.home_template_apply_jobs TO service_role;
GRANT UPDATE ON public.home_template_apply_jobs TO service_role;
GRANT DELETE ON public.home_template_library TO anon;
GRANT INSERT ON public.home_template_library TO anon;
GRANT REFERENCES ON public.home_template_library TO anon;
GRANT SELECT ON public.home_template_library TO anon;
GRANT TRIGGER ON public.home_template_library TO anon;
GRANT TRUNCATE ON public.home_template_library TO anon;
GRANT UPDATE ON public.home_template_library TO anon;
GRANT DELETE ON public.home_template_library TO authenticated;
GRANT INSERT ON public.home_template_library TO authenticated;
GRANT REFERENCES ON public.home_template_library TO authenticated;
GRANT SELECT ON public.home_template_library TO authenticated;
GRANT TRIGGER ON public.home_template_library TO authenticated;
GRANT TRUNCATE ON public.home_template_library TO authenticated;
GRANT UPDATE ON public.home_template_library TO authenticated;
GRANT DELETE ON public.home_template_library TO service_role;
GRANT INSERT ON public.home_template_library TO service_role;
GRANT REFERENCES ON public.home_template_library TO service_role;
GRANT SELECT ON public.home_template_library TO service_role;
GRANT TRIGGER ON public.home_template_library TO service_role;
GRANT TRUNCATE ON public.home_template_library TO service_role;
GRANT UPDATE ON public.home_template_library TO service_role;
GRANT DELETE ON public.icon_library TO anon;
GRANT INSERT ON public.icon_library TO anon;
GRANT REFERENCES ON public.icon_library TO anon;
GRANT SELECT ON public.icon_library TO anon;
GRANT TRIGGER ON public.icon_library TO anon;
GRANT TRUNCATE ON public.icon_library TO anon;
GRANT UPDATE ON public.icon_library TO anon;
GRANT DELETE ON public.icon_library TO authenticated;
GRANT INSERT ON public.icon_library TO authenticated;
GRANT REFERENCES ON public.icon_library TO authenticated;
GRANT SELECT ON public.icon_library TO authenticated;
GRANT TRIGGER ON public.icon_library TO authenticated;
GRANT TRUNCATE ON public.icon_library TO authenticated;
GRANT UPDATE ON public.icon_library TO authenticated;
GRANT DELETE ON public.icon_library TO service_role;
GRANT INSERT ON public.icon_library TO service_role;
GRANT REFERENCES ON public.icon_library TO service_role;
GRANT SELECT ON public.icon_library TO service_role;
GRANT TRIGGER ON public.icon_library TO service_role;
GRANT TRUNCATE ON public.icon_library TO service_role;
GRANT UPDATE ON public.icon_library TO service_role;
GRANT DELETE ON public.import_jobs TO anon;
GRANT INSERT ON public.import_jobs TO anon;
GRANT REFERENCES ON public.import_jobs TO anon;
GRANT SELECT ON public.import_jobs TO anon;
GRANT TRIGGER ON public.import_jobs TO anon;
GRANT TRUNCATE ON public.import_jobs TO anon;
GRANT UPDATE ON public.import_jobs TO anon;
GRANT DELETE ON public.import_jobs TO authenticated;
GRANT INSERT ON public.import_jobs TO authenticated;
GRANT REFERENCES ON public.import_jobs TO authenticated;
GRANT SELECT ON public.import_jobs TO authenticated;
GRANT TRIGGER ON public.import_jobs TO authenticated;
GRANT TRUNCATE ON public.import_jobs TO authenticated;
GRANT UPDATE ON public.import_jobs TO authenticated;
GRANT DELETE ON public.import_jobs TO service_role;
GRANT INSERT ON public.import_jobs TO service_role;
GRANT REFERENCES ON public.import_jobs TO service_role;
GRANT SELECT ON public.import_jobs TO service_role;
GRANT TRIGGER ON public.import_jobs TO service_role;
GRANT TRUNCATE ON public.import_jobs TO service_role;
GRANT UPDATE ON public.import_jobs TO service_role;
GRANT DELETE ON public.machine_integrations TO anon;
GRANT INSERT ON public.machine_integrations TO anon;
GRANT REFERENCES ON public.machine_integrations TO anon;
GRANT SELECT ON public.machine_integrations TO anon;
GRANT TRIGGER ON public.machine_integrations TO anon;
GRANT TRUNCATE ON public.machine_integrations TO anon;
GRANT UPDATE ON public.machine_integrations TO anon;
GRANT DELETE ON public.machine_integrations TO authenticated;
GRANT INSERT ON public.machine_integrations TO authenticated;
GRANT REFERENCES ON public.machine_integrations TO authenticated;
GRANT SELECT ON public.machine_integrations TO authenticated;
GRANT TRIGGER ON public.machine_integrations TO authenticated;
GRANT TRUNCATE ON public.machine_integrations TO authenticated;
GRANT UPDATE ON public.machine_integrations TO authenticated;
GRANT DELETE ON public.machine_integrations TO service_role;
GRANT INSERT ON public.machine_integrations TO service_role;
GRANT REFERENCES ON public.machine_integrations TO service_role;
GRANT SELECT ON public.machine_integrations TO service_role;
GRANT TRIGGER ON public.machine_integrations TO service_role;
GRANT TRUNCATE ON public.machine_integrations TO service_role;
GRANT UPDATE ON public.machine_integrations TO service_role;
GRANT DELETE ON public.machine_ride_events TO anon;
GRANT INSERT ON public.machine_ride_events TO anon;
GRANT REFERENCES ON public.machine_ride_events TO anon;
GRANT SELECT ON public.machine_ride_events TO anon;
GRANT TRIGGER ON public.machine_ride_events TO anon;
GRANT TRUNCATE ON public.machine_ride_events TO anon;
GRANT UPDATE ON public.machine_ride_events TO anon;
GRANT DELETE ON public.machine_ride_events TO authenticated;
GRANT INSERT ON public.machine_ride_events TO authenticated;
GRANT REFERENCES ON public.machine_ride_events TO authenticated;
GRANT SELECT ON public.machine_ride_events TO authenticated;
GRANT TRIGGER ON public.machine_ride_events TO authenticated;
GRANT TRUNCATE ON public.machine_ride_events TO authenticated;
GRANT UPDATE ON public.machine_ride_events TO authenticated;
GRANT DELETE ON public.machine_ride_events TO service_role;
GRANT INSERT ON public.machine_ride_events TO service_role;
GRANT REFERENCES ON public.machine_ride_events TO service_role;
GRANT SELECT ON public.machine_ride_events TO service_role;
GRANT TRIGGER ON public.machine_ride_events TO service_role;
GRANT TRUNCATE ON public.machine_ride_events TO service_role;
GRANT UPDATE ON public.machine_ride_events TO service_role;
GRANT DELETE ON public.machine_ride_notifications TO anon;
GRANT INSERT ON public.machine_ride_notifications TO anon;
GRANT REFERENCES ON public.machine_ride_notifications TO anon;
GRANT SELECT ON public.machine_ride_notifications TO anon;
GRANT TRIGGER ON public.machine_ride_notifications TO anon;
GRANT TRUNCATE ON public.machine_ride_notifications TO anon;
GRANT UPDATE ON public.machine_ride_notifications TO anon;
GRANT DELETE ON public.machine_ride_notifications TO authenticated;
GRANT INSERT ON public.machine_ride_notifications TO authenticated;
GRANT REFERENCES ON public.machine_ride_notifications TO authenticated;
GRANT SELECT ON public.machine_ride_notifications TO authenticated;
GRANT TRIGGER ON public.machine_ride_notifications TO authenticated;
GRANT TRUNCATE ON public.machine_ride_notifications TO authenticated;
GRANT UPDATE ON public.machine_ride_notifications TO authenticated;
GRANT DELETE ON public.machine_ride_notifications TO service_role;
GRANT INSERT ON public.machine_ride_notifications TO service_role;
GRANT REFERENCES ON public.machine_ride_notifications TO service_role;
GRANT SELECT ON public.machine_ride_notifications TO service_role;
GRANT TRIGGER ON public.machine_ride_notifications TO service_role;
GRANT TRUNCATE ON public.machine_ride_notifications TO service_role;
GRANT UPDATE ON public.machine_ride_notifications TO service_role;
GRANT DELETE ON public.machine_rides TO anon;
GRANT INSERT ON public.machine_rides TO anon;
GRANT REFERENCES ON public.machine_rides TO anon;
GRANT SELECT ON public.machine_rides TO anon;
GRANT TRIGGER ON public.machine_rides TO anon;
GRANT TRUNCATE ON public.machine_rides TO anon;
GRANT UPDATE ON public.machine_rides TO anon;
GRANT DELETE ON public.machine_rides TO authenticated;
GRANT INSERT ON public.machine_rides TO authenticated;
GRANT REFERENCES ON public.machine_rides TO authenticated;
GRANT SELECT ON public.machine_rides TO authenticated;
GRANT TRIGGER ON public.machine_rides TO authenticated;
GRANT TRUNCATE ON public.machine_rides TO authenticated;
GRANT UPDATE ON public.machine_rides TO authenticated;
GRANT DELETE ON public.machine_rides TO service_role;
GRANT INSERT ON public.machine_rides TO service_role;
GRANT REFERENCES ON public.machine_rides TO service_role;
GRANT SELECT ON public.machine_rides TO service_role;
GRANT TRIGGER ON public.machine_rides TO service_role;
GRANT TRUNCATE ON public.machine_rides TO service_role;
GRANT UPDATE ON public.machine_rides TO service_role;
GRANT DELETE ON public.menu_labels TO anon;
GRANT INSERT ON public.menu_labels TO anon;
GRANT REFERENCES ON public.menu_labels TO anon;
GRANT SELECT ON public.menu_labels TO anon;
GRANT TRIGGER ON public.menu_labels TO anon;
GRANT TRUNCATE ON public.menu_labels TO anon;
GRANT UPDATE ON public.menu_labels TO anon;
GRANT DELETE ON public.menu_labels TO authenticated;
GRANT INSERT ON public.menu_labels TO authenticated;
GRANT REFERENCES ON public.menu_labels TO authenticated;
GRANT SELECT ON public.menu_labels TO authenticated;
GRANT TRIGGER ON public.menu_labels TO authenticated;
GRANT TRUNCATE ON public.menu_labels TO authenticated;
GRANT UPDATE ON public.menu_labels TO authenticated;
GRANT DELETE ON public.menu_labels TO service_role;
GRANT INSERT ON public.menu_labels TO service_role;
GRANT REFERENCES ON public.menu_labels TO service_role;
GRANT SELECT ON public.menu_labels TO service_role;
GRANT TRIGGER ON public.menu_labels TO service_role;
GRANT TRUNCATE ON public.menu_labels TO service_role;
GRANT UPDATE ON public.menu_labels TO service_role;
GRANT DELETE ON public.mirror_source_catalog TO anon;
GRANT INSERT ON public.mirror_source_catalog TO anon;
GRANT REFERENCES ON public.mirror_source_catalog TO anon;
GRANT SELECT ON public.mirror_source_catalog TO anon;
GRANT TRIGGER ON public.mirror_source_catalog TO anon;
GRANT TRUNCATE ON public.mirror_source_catalog TO anon;
GRANT UPDATE ON public.mirror_source_catalog TO anon;
GRANT DELETE ON public.mirror_source_catalog TO authenticated;
GRANT INSERT ON public.mirror_source_catalog TO authenticated;
GRANT REFERENCES ON public.mirror_source_catalog TO authenticated;
GRANT SELECT ON public.mirror_source_catalog TO authenticated;
GRANT TRIGGER ON public.mirror_source_catalog TO authenticated;
GRANT TRUNCATE ON public.mirror_source_catalog TO authenticated;
GRANT UPDATE ON public.mirror_source_catalog TO authenticated;
GRANT DELETE ON public.mirror_source_catalog TO service_role;
GRANT INSERT ON public.mirror_source_catalog TO service_role;
GRANT REFERENCES ON public.mirror_source_catalog TO service_role;
GRANT SELECT ON public.mirror_source_catalog TO service_role;
GRANT TRIGGER ON public.mirror_source_catalog TO service_role;
GRANT TRUNCATE ON public.mirror_source_catalog TO service_role;
GRANT UPDATE ON public.mirror_source_catalog TO service_role;
GRANT DELETE ON public.mirror_sync_config TO anon;
GRANT INSERT ON public.mirror_sync_config TO anon;
GRANT REFERENCES ON public.mirror_sync_config TO anon;
GRANT SELECT ON public.mirror_sync_config TO anon;
GRANT TRIGGER ON public.mirror_sync_config TO anon;
GRANT TRUNCATE ON public.mirror_sync_config TO anon;
GRANT UPDATE ON public.mirror_sync_config TO anon;
GRANT DELETE ON public.mirror_sync_config TO authenticated;
GRANT INSERT ON public.mirror_sync_config TO authenticated;
GRANT REFERENCES ON public.mirror_sync_config TO authenticated;
GRANT SELECT ON public.mirror_sync_config TO authenticated;
GRANT TRIGGER ON public.mirror_sync_config TO authenticated;
GRANT TRUNCATE ON public.mirror_sync_config TO authenticated;
GRANT UPDATE ON public.mirror_sync_config TO authenticated;
GRANT DELETE ON public.mirror_sync_config TO service_role;
GRANT INSERT ON public.mirror_sync_config TO service_role;
GRANT REFERENCES ON public.mirror_sync_config TO service_role;
GRANT SELECT ON public.mirror_sync_config TO service_role;
GRANT TRIGGER ON public.mirror_sync_config TO service_role;
GRANT TRUNCATE ON public.mirror_sync_config TO service_role;
GRANT UPDATE ON public.mirror_sync_config TO service_role;
GRANT DELETE ON public.mirror_sync_logs TO anon;
GRANT INSERT ON public.mirror_sync_logs TO anon;
GRANT REFERENCES ON public.mirror_sync_logs TO anon;
GRANT SELECT ON public.mirror_sync_logs TO anon;
GRANT TRIGGER ON public.mirror_sync_logs TO anon;
GRANT TRUNCATE ON public.mirror_sync_logs TO anon;
GRANT UPDATE ON public.mirror_sync_logs TO anon;
GRANT DELETE ON public.mirror_sync_logs TO authenticated;
GRANT INSERT ON public.mirror_sync_logs TO authenticated;
GRANT REFERENCES ON public.mirror_sync_logs TO authenticated;
GRANT SELECT ON public.mirror_sync_logs TO authenticated;
GRANT TRIGGER ON public.mirror_sync_logs TO authenticated;
GRANT TRUNCATE ON public.mirror_sync_logs TO authenticated;
GRANT UPDATE ON public.mirror_sync_logs TO authenticated;
GRANT DELETE ON public.mirror_sync_logs TO service_role;
GRANT INSERT ON public.mirror_sync_logs TO service_role;
GRANT REFERENCES ON public.mirror_sync_logs TO service_role;
GRANT SELECT ON public.mirror_sync_logs TO service_role;
GRANT TRIGGER ON public.mirror_sync_logs TO service_role;
GRANT TRUNCATE ON public.mirror_sync_logs TO service_role;
GRANT UPDATE ON public.mirror_sync_logs TO service_role;
GRANT DELETE ON public.module_definitions TO anon;
GRANT INSERT ON public.module_definitions TO anon;
GRANT REFERENCES ON public.module_definitions TO anon;
GRANT SELECT ON public.module_definitions TO anon;
GRANT TRIGGER ON public.module_definitions TO anon;
GRANT TRUNCATE ON public.module_definitions TO anon;
GRANT UPDATE ON public.module_definitions TO anon;
GRANT DELETE ON public.module_definitions TO authenticated;
GRANT INSERT ON public.module_definitions TO authenticated;
GRANT REFERENCES ON public.module_definitions TO authenticated;
GRANT SELECT ON public.module_definitions TO authenticated;
GRANT TRIGGER ON public.module_definitions TO authenticated;
GRANT TRUNCATE ON public.module_definitions TO authenticated;
GRANT UPDATE ON public.module_definitions TO authenticated;
GRANT DELETE ON public.module_definitions TO service_role;
GRANT INSERT ON public.module_definitions TO service_role;
GRANT REFERENCES ON public.module_definitions TO service_role;
GRANT SELECT ON public.module_definitions TO service_role;
GRANT TRIGGER ON public.module_definitions TO service_role;
GRANT TRUNCATE ON public.module_definitions TO service_role;
GRANT UPDATE ON public.module_definitions TO service_role;
GRANT DELETE ON public.module_definitions_backup_pre_norm TO anon;
GRANT INSERT ON public.module_definitions_backup_pre_norm TO anon;
GRANT REFERENCES ON public.module_definitions_backup_pre_norm TO anon;
GRANT SELECT ON public.module_definitions_backup_pre_norm TO anon;
GRANT TRIGGER ON public.module_definitions_backup_pre_norm TO anon;
GRANT TRUNCATE ON public.module_definitions_backup_pre_norm TO anon;
GRANT UPDATE ON public.module_definitions_backup_pre_norm TO anon;
GRANT DELETE ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT INSERT ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT REFERENCES ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT SELECT ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT TRIGGER ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT TRUNCATE ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT UPDATE ON public.module_definitions_backup_pre_norm TO authenticated;
GRANT DELETE ON public.module_definitions_backup_pre_norm TO service_role;
GRANT INSERT ON public.module_definitions_backup_pre_norm TO service_role;
GRANT REFERENCES ON public.module_definitions_backup_pre_norm TO service_role;
GRANT SELECT ON public.module_definitions_backup_pre_norm TO service_role;
GRANT TRIGGER ON public.module_definitions_backup_pre_norm TO service_role;
GRANT TRUNCATE ON public.module_definitions_backup_pre_norm TO service_role;
GRANT UPDATE ON public.module_definitions_backup_pre_norm TO service_role;
GRANT DELETE ON public.module_template_items TO anon;
GRANT INSERT ON public.module_template_items TO anon;
GRANT REFERENCES ON public.module_template_items TO anon;
GRANT SELECT ON public.module_template_items TO anon;
GRANT TRIGGER ON public.module_template_items TO anon;
GRANT TRUNCATE ON public.module_template_items TO anon;
GRANT UPDATE ON public.module_template_items TO anon;
GRANT DELETE ON public.module_template_items TO authenticated;
GRANT INSERT ON public.module_template_items TO authenticated;
GRANT REFERENCES ON public.module_template_items TO authenticated;
GRANT SELECT ON public.module_template_items TO authenticated;
GRANT TRIGGER ON public.module_template_items TO authenticated;
GRANT TRUNCATE ON public.module_template_items TO authenticated;
GRANT UPDATE ON public.module_template_items TO authenticated;
GRANT DELETE ON public.module_template_items TO service_role;
GRANT INSERT ON public.module_template_items TO service_role;
GRANT REFERENCES ON public.module_template_items TO service_role;
GRANT SELECT ON public.module_template_items TO service_role;
GRANT TRIGGER ON public.module_template_items TO service_role;
GRANT TRUNCATE ON public.module_template_items TO service_role;
GRANT UPDATE ON public.module_template_items TO service_role;
GRANT DELETE ON public.module_templates TO anon;
GRANT INSERT ON public.module_templates TO anon;
GRANT REFERENCES ON public.module_templates TO anon;
GRANT SELECT ON public.module_templates TO anon;
GRANT TRIGGER ON public.module_templates TO anon;
GRANT TRUNCATE ON public.module_templates TO anon;
GRANT UPDATE ON public.module_templates TO anon;
GRANT DELETE ON public.module_templates TO authenticated;
GRANT INSERT ON public.module_templates TO authenticated;
GRANT REFERENCES ON public.module_templates TO authenticated;
GRANT SELECT ON public.module_templates TO authenticated;
GRANT TRIGGER ON public.module_templates TO authenticated;
GRANT TRUNCATE ON public.module_templates TO authenticated;
GRANT UPDATE ON public.module_templates TO authenticated;
GRANT DELETE ON public.module_templates TO service_role;
GRANT INSERT ON public.module_templates TO service_role;
GRANT REFERENCES ON public.module_templates TO service_role;
GRANT SELECT ON public.module_templates TO service_role;
GRANT TRIGGER ON public.module_templates TO service_role;
GRANT TRUNCATE ON public.module_templates TO service_role;
GRANT UPDATE ON public.module_templates TO service_role;
GRANT DELETE ON public.offer_reports TO anon;
GRANT INSERT ON public.offer_reports TO anon;
GRANT REFERENCES ON public.offer_reports TO anon;
GRANT SELECT ON public.offer_reports TO anon;
GRANT TRIGGER ON public.offer_reports TO anon;
GRANT TRUNCATE ON public.offer_reports TO anon;
GRANT UPDATE ON public.offer_reports TO anon;
GRANT DELETE ON public.offer_reports TO authenticated;
GRANT INSERT ON public.offer_reports TO authenticated;
GRANT REFERENCES ON public.offer_reports TO authenticated;
GRANT SELECT ON public.offer_reports TO authenticated;
GRANT TRIGGER ON public.offer_reports TO authenticated;
GRANT TRUNCATE ON public.offer_reports TO authenticated;
GRANT UPDATE ON public.offer_reports TO authenticated;
GRANT DELETE ON public.offer_reports TO service_role;
GRANT INSERT ON public.offer_reports TO service_role;
GRANT REFERENCES ON public.offer_reports TO service_role;
GRANT SELECT ON public.offer_reports TO service_role;
GRANT TRIGGER ON public.offer_reports TO service_role;
GRANT TRUNCATE ON public.offer_reports TO service_role;
GRANT UPDATE ON public.offer_reports TO service_role;
GRANT DELETE ON public.offer_sync_groups TO anon;
GRANT INSERT ON public.offer_sync_groups TO anon;
GRANT REFERENCES ON public.offer_sync_groups TO anon;
GRANT SELECT ON public.offer_sync_groups TO anon;
GRANT TRIGGER ON public.offer_sync_groups TO anon;
GRANT TRUNCATE ON public.offer_sync_groups TO anon;
GRANT UPDATE ON public.offer_sync_groups TO anon;
GRANT DELETE ON public.offer_sync_groups TO authenticated;
GRANT INSERT ON public.offer_sync_groups TO authenticated;
GRANT REFERENCES ON public.offer_sync_groups TO authenticated;
GRANT SELECT ON public.offer_sync_groups TO authenticated;
GRANT TRIGGER ON public.offer_sync_groups TO authenticated;
GRANT TRUNCATE ON public.offer_sync_groups TO authenticated;
GRANT UPDATE ON public.offer_sync_groups TO authenticated;
GRANT DELETE ON public.offer_sync_groups TO service_role;
GRANT INSERT ON public.offer_sync_groups TO service_role;
GRANT REFERENCES ON public.offer_sync_groups TO service_role;
GRANT SELECT ON public.offer_sync_groups TO service_role;
GRANT TRIGGER ON public.offer_sync_groups TO service_role;
GRANT TRUNCATE ON public.offer_sync_groups TO service_role;
GRANT UPDATE ON public.offer_sync_groups TO service_role;
GRANT DELETE ON public.offers TO anon;
GRANT INSERT ON public.offers TO anon;
GRANT REFERENCES ON public.offers TO anon;
GRANT SELECT ON public.offers TO anon;
GRANT TRIGGER ON public.offers TO anon;
GRANT TRUNCATE ON public.offers TO anon;
GRANT UPDATE ON public.offers TO anon;
GRANT DELETE ON public.offers TO authenticated;
GRANT INSERT ON public.offers TO authenticated;
GRANT REFERENCES ON public.offers TO authenticated;
GRANT SELECT ON public.offers TO authenticated;
GRANT TRIGGER ON public.offers TO authenticated;
GRANT TRUNCATE ON public.offers TO authenticated;
GRANT UPDATE ON public.offers TO authenticated;
GRANT DELETE ON public.offers TO service_role;
GRANT INSERT ON public.offers TO service_role;
GRANT REFERENCES ON public.offers TO service_role;
GRANT SELECT ON public.offers TO service_role;
GRANT TRIGGER ON public.offers TO service_role;
GRANT TRUNCATE ON public.offers TO service_role;
GRANT UPDATE ON public.offers TO service_role;
GRANT DELETE ON public.partner_landing_config TO anon;
GRANT INSERT ON public.partner_landing_config TO anon;
GRANT REFERENCES ON public.partner_landing_config TO anon;
GRANT SELECT ON public.partner_landing_config TO anon;
GRANT TRIGGER ON public.partner_landing_config TO anon;
GRANT TRUNCATE ON public.partner_landing_config TO anon;
GRANT UPDATE ON public.partner_landing_config TO anon;
GRANT DELETE ON public.partner_landing_config TO authenticated;
GRANT INSERT ON public.partner_landing_config TO authenticated;
GRANT REFERENCES ON public.partner_landing_config TO authenticated;
GRANT SELECT ON public.partner_landing_config TO authenticated;
GRANT TRIGGER ON public.partner_landing_config TO authenticated;
GRANT TRUNCATE ON public.partner_landing_config TO authenticated;
GRANT UPDATE ON public.partner_landing_config TO authenticated;
GRANT DELETE ON public.partner_landing_config TO service_role;
GRANT INSERT ON public.partner_landing_config TO service_role;
GRANT REFERENCES ON public.partner_landing_config TO service_role;
GRANT SELECT ON public.partner_landing_config TO service_role;
GRANT TRIGGER ON public.partner_landing_config TO service_role;
GRANT TRUNCATE ON public.partner_landing_config TO service_role;
GRANT UPDATE ON public.partner_landing_config TO service_role;
GRANT DELETE ON public.permission_groups TO anon;
GRANT INSERT ON public.permission_groups TO anon;
GRANT REFERENCES ON public.permission_groups TO anon;
GRANT SELECT ON public.permission_groups TO anon;
GRANT TRIGGER ON public.permission_groups TO anon;
GRANT TRUNCATE ON public.permission_groups TO anon;
GRANT UPDATE ON public.permission_groups TO anon;
GRANT DELETE ON public.permission_groups TO authenticated;
GRANT INSERT ON public.permission_groups TO authenticated;
GRANT REFERENCES ON public.permission_groups TO authenticated;
GRANT SELECT ON public.permission_groups TO authenticated;
GRANT TRIGGER ON public.permission_groups TO authenticated;
GRANT TRUNCATE ON public.permission_groups TO authenticated;
GRANT UPDATE ON public.permission_groups TO authenticated;
GRANT DELETE ON public.permission_groups TO service_role;
GRANT INSERT ON public.permission_groups TO service_role;
GRANT REFERENCES ON public.permission_groups TO service_role;
GRANT SELECT ON public.permission_groups TO service_role;
GRANT TRIGGER ON public.permission_groups TO service_role;
GRANT TRUNCATE ON public.permission_groups TO service_role;
GRANT UPDATE ON public.permission_groups TO service_role;
GRANT DELETE ON public.permission_sub_items TO anon;
GRANT INSERT ON public.permission_sub_items TO anon;
GRANT REFERENCES ON public.permission_sub_items TO anon;
GRANT SELECT ON public.permission_sub_items TO anon;
GRANT TRIGGER ON public.permission_sub_items TO anon;
GRANT TRUNCATE ON public.permission_sub_items TO anon;
GRANT UPDATE ON public.permission_sub_items TO anon;
GRANT DELETE ON public.permission_sub_items TO authenticated;
GRANT INSERT ON public.permission_sub_items TO authenticated;
GRANT REFERENCES ON public.permission_sub_items TO authenticated;
GRANT SELECT ON public.permission_sub_items TO authenticated;
GRANT TRIGGER ON public.permission_sub_items TO authenticated;
GRANT TRUNCATE ON public.permission_sub_items TO authenticated;
GRANT UPDATE ON public.permission_sub_items TO authenticated;
GRANT DELETE ON public.permission_sub_items TO service_role;
GRANT INSERT ON public.permission_sub_items TO service_role;
GRANT REFERENCES ON public.permission_sub_items TO service_role;
GRANT SELECT ON public.permission_sub_items TO service_role;
GRANT TRIGGER ON public.permission_sub_items TO service_role;
GRANT TRUNCATE ON public.permission_sub_items TO service_role;
GRANT UPDATE ON public.permission_sub_items TO service_role;
GRANT DELETE ON public.permission_subgroups TO anon;
GRANT INSERT ON public.permission_subgroups TO anon;
GRANT REFERENCES ON public.permission_subgroups TO anon;
GRANT SELECT ON public.permission_subgroups TO anon;
GRANT TRIGGER ON public.permission_subgroups TO anon;
GRANT TRUNCATE ON public.permission_subgroups TO anon;
GRANT UPDATE ON public.permission_subgroups TO anon;
GRANT DELETE ON public.permission_subgroups TO authenticated;
GRANT INSERT ON public.permission_subgroups TO authenticated;
GRANT REFERENCES ON public.permission_subgroups TO authenticated;
GRANT SELECT ON public.permission_subgroups TO authenticated;
GRANT TRIGGER ON public.permission_subgroups TO authenticated;
GRANT TRUNCATE ON public.permission_subgroups TO authenticated;
GRANT UPDATE ON public.permission_subgroups TO authenticated;
GRANT DELETE ON public.permission_subgroups TO service_role;
GRANT INSERT ON public.permission_subgroups TO service_role;
GRANT REFERENCES ON public.permission_subgroups TO service_role;
GRANT SELECT ON public.permission_subgroups TO service_role;
GRANT TRIGGER ON public.permission_subgroups TO service_role;
GRANT TRUNCATE ON public.permission_subgroups TO service_role;
GRANT UPDATE ON public.permission_subgroups TO service_role;
GRANT DELETE ON public.permissions TO anon;
GRANT INSERT ON public.permissions TO anon;
GRANT REFERENCES ON public.permissions TO anon;
GRANT SELECT ON public.permissions TO anon;
GRANT TRIGGER ON public.permissions TO anon;
GRANT TRUNCATE ON public.permissions TO anon;
GRANT UPDATE ON public.permissions TO anon;
GRANT DELETE ON public.permissions TO authenticated;
GRANT INSERT ON public.permissions TO authenticated;
GRANT REFERENCES ON public.permissions TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT TRIGGER ON public.permissions TO authenticated;
GRANT TRUNCATE ON public.permissions TO authenticated;
GRANT UPDATE ON public.permissions TO authenticated;
GRANT DELETE ON public.permissions TO service_role;
GRANT INSERT ON public.permissions TO service_role;
GRANT REFERENCES ON public.permissions TO service_role;
GRANT SELECT ON public.permissions TO service_role;
GRANT TRIGGER ON public.permissions TO service_role;
GRANT TRUNCATE ON public.permissions TO service_role;
GRANT UPDATE ON public.permissions TO service_role;
GRANT DELETE ON public.plan_business_models TO anon;
GRANT INSERT ON public.plan_business_models TO anon;
GRANT REFERENCES ON public.plan_business_models TO anon;
GRANT SELECT ON public.plan_business_models TO anon;
GRANT TRIGGER ON public.plan_business_models TO anon;
GRANT TRUNCATE ON public.plan_business_models TO anon;
GRANT UPDATE ON public.plan_business_models TO anon;
GRANT DELETE ON public.plan_business_models TO authenticated;
GRANT INSERT ON public.plan_business_models TO authenticated;
GRANT REFERENCES ON public.plan_business_models TO authenticated;
GRANT SELECT ON public.plan_business_models TO authenticated;
GRANT TRIGGER ON public.plan_business_models TO authenticated;
GRANT TRUNCATE ON public.plan_business_models TO authenticated;
GRANT UPDATE ON public.plan_business_models TO authenticated;
GRANT DELETE ON public.plan_business_models TO service_role;
GRANT INSERT ON public.plan_business_models TO service_role;
GRANT REFERENCES ON public.plan_business_models TO service_role;
GRANT SELECT ON public.plan_business_models TO service_role;
GRANT TRIGGER ON public.plan_business_models TO service_role;
GRANT TRUNCATE ON public.plan_business_models TO service_role;
GRANT UPDATE ON public.plan_business_models TO service_role;
GRANT DELETE ON public.plan_ganha_ganha_pricing TO anon;
GRANT INSERT ON public.plan_ganha_ganha_pricing TO anon;
GRANT REFERENCES ON public.plan_ganha_ganha_pricing TO anon;
GRANT SELECT ON public.plan_ganha_ganha_pricing TO anon;
GRANT TRIGGER ON public.plan_ganha_ganha_pricing TO anon;
GRANT TRUNCATE ON public.plan_ganha_ganha_pricing TO anon;
GRANT UPDATE ON public.plan_ganha_ganha_pricing TO anon;
GRANT DELETE ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT INSERT ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT REFERENCES ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT SELECT ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT TRIGGER ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT TRUNCATE ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT UPDATE ON public.plan_ganha_ganha_pricing TO authenticated;
GRANT DELETE ON public.plan_ganha_ganha_pricing TO service_role;
GRANT INSERT ON public.plan_ganha_ganha_pricing TO service_role;
GRANT REFERENCES ON public.plan_ganha_ganha_pricing TO service_role;
GRANT SELECT ON public.plan_ganha_ganha_pricing TO service_role;
GRANT TRIGGER ON public.plan_ganha_ganha_pricing TO service_role;
GRANT TRUNCATE ON public.plan_ganha_ganha_pricing TO service_role;
GRANT UPDATE ON public.plan_ganha_ganha_pricing TO service_role;
GRANT DELETE ON public.plan_module_templates TO anon;
GRANT INSERT ON public.plan_module_templates TO anon;
GRANT REFERENCES ON public.plan_module_templates TO anon;
GRANT SELECT ON public.plan_module_templates TO anon;
GRANT TRIGGER ON public.plan_module_templates TO anon;
GRANT TRUNCATE ON public.plan_module_templates TO anon;
GRANT UPDATE ON public.plan_module_templates TO anon;
GRANT DELETE ON public.plan_module_templates TO authenticated;
GRANT INSERT ON public.plan_module_templates TO authenticated;
GRANT REFERENCES ON public.plan_module_templates TO authenticated;
GRANT SELECT ON public.plan_module_templates TO authenticated;
GRANT TRIGGER ON public.plan_module_templates TO authenticated;
GRANT TRUNCATE ON public.plan_module_templates TO authenticated;
GRANT UPDATE ON public.plan_module_templates TO authenticated;
GRANT DELETE ON public.plan_module_templates TO service_role;
GRANT INSERT ON public.plan_module_templates TO service_role;
GRANT REFERENCES ON public.plan_module_templates TO service_role;
GRANT SELECT ON public.plan_module_templates TO service_role;
GRANT TRIGGER ON public.plan_module_templates TO service_role;
GRANT TRUNCATE ON public.plan_module_templates TO service_role;
GRANT UPDATE ON public.plan_module_templates TO service_role;
GRANT DELETE ON public.platform_config TO anon;
GRANT INSERT ON public.platform_config TO anon;
GRANT REFERENCES ON public.platform_config TO anon;
GRANT SELECT ON public.platform_config TO anon;
GRANT TRIGGER ON public.platform_config TO anon;
GRANT TRUNCATE ON public.platform_config TO anon;
GRANT UPDATE ON public.platform_config TO anon;
GRANT DELETE ON public.platform_config TO authenticated;
GRANT INSERT ON public.platform_config TO authenticated;
GRANT REFERENCES ON public.platform_config TO authenticated;
GRANT SELECT ON public.platform_config TO authenticated;
GRANT TRIGGER ON public.platform_config TO authenticated;
GRANT TRUNCATE ON public.platform_config TO authenticated;
GRANT UPDATE ON public.platform_config TO authenticated;
GRANT DELETE ON public.platform_config TO service_role;
GRANT INSERT ON public.platform_config TO service_role;
GRANT REFERENCES ON public.platform_config TO service_role;
GRANT SELECT ON public.platform_config TO service_role;
GRANT TRIGGER ON public.platform_config TO service_role;
GRANT TRUNCATE ON public.platform_config TO service_role;
GRANT UPDATE ON public.platform_config TO service_role;
GRANT DELETE ON public.points_ledger TO anon;
GRANT INSERT ON public.points_ledger TO anon;
GRANT REFERENCES ON public.points_ledger TO anon;
GRANT SELECT ON public.points_ledger TO anon;
GRANT TRIGGER ON public.points_ledger TO anon;
GRANT TRUNCATE ON public.points_ledger TO anon;
GRANT UPDATE ON public.points_ledger TO anon;
GRANT DELETE ON public.points_ledger TO authenticated;
GRANT INSERT ON public.points_ledger TO authenticated;
GRANT REFERENCES ON public.points_ledger TO authenticated;
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT TRIGGER ON public.points_ledger TO authenticated;
GRANT TRUNCATE ON public.points_ledger TO authenticated;
GRANT UPDATE ON public.points_ledger TO authenticated;
GRANT DELETE ON public.points_ledger TO service_role;
GRANT INSERT ON public.points_ledger TO service_role;
GRANT REFERENCES ON public.points_ledger TO service_role;
GRANT SELECT ON public.points_ledger TO service_role;
GRANT TRIGGER ON public.points_ledger TO service_role;
GRANT TRUNCATE ON public.points_ledger TO service_role;
GRANT UPDATE ON public.points_ledger TO service_role;
GRANT DELETE ON public.points_package_orders TO anon;
GRANT INSERT ON public.points_package_orders TO anon;
GRANT REFERENCES ON public.points_package_orders TO anon;
GRANT SELECT ON public.points_package_orders TO anon;
GRANT TRIGGER ON public.points_package_orders TO anon;
GRANT TRUNCATE ON public.points_package_orders TO anon;
GRANT UPDATE ON public.points_package_orders TO anon;
GRANT DELETE ON public.points_package_orders TO authenticated;
GRANT INSERT ON public.points_package_orders TO authenticated;
GRANT REFERENCES ON public.points_package_orders TO authenticated;
GRANT SELECT ON public.points_package_orders TO authenticated;
GRANT TRIGGER ON public.points_package_orders TO authenticated;
GRANT TRUNCATE ON public.points_package_orders TO authenticated;
GRANT UPDATE ON public.points_package_orders TO authenticated;
GRANT DELETE ON public.points_package_orders TO service_role;
GRANT INSERT ON public.points_package_orders TO service_role;
GRANT REFERENCES ON public.points_package_orders TO service_role;
GRANT SELECT ON public.points_package_orders TO service_role;
GRANT TRIGGER ON public.points_package_orders TO service_role;
GRANT TRUNCATE ON public.points_package_orders TO service_role;
GRANT UPDATE ON public.points_package_orders TO service_role;
GRANT DELETE ON public.points_packages TO anon;
GRANT INSERT ON public.points_packages TO anon;
GRANT REFERENCES ON public.points_packages TO anon;
GRANT SELECT ON public.points_packages TO anon;
GRANT TRIGGER ON public.points_packages TO anon;
GRANT TRUNCATE ON public.points_packages TO anon;
GRANT UPDATE ON public.points_packages TO anon;
GRANT DELETE ON public.points_packages TO authenticated;
GRANT INSERT ON public.points_packages TO authenticated;
GRANT REFERENCES ON public.points_packages TO authenticated;
GRANT SELECT ON public.points_packages TO authenticated;
GRANT TRIGGER ON public.points_packages TO authenticated;
GRANT TRUNCATE ON public.points_packages TO authenticated;
GRANT UPDATE ON public.points_packages TO authenticated;
GRANT DELETE ON public.points_packages TO service_role;
GRANT INSERT ON public.points_packages TO service_role;
GRANT REFERENCES ON public.points_packages TO service_role;
GRANT SELECT ON public.points_packages TO service_role;
GRANT TRIGGER ON public.points_packages TO service_role;
GRANT TRUNCATE ON public.points_packages TO service_role;
GRANT UPDATE ON public.points_packages TO service_role;
GRANT DELETE ON public.points_rules TO anon;
GRANT INSERT ON public.points_rules TO anon;
GRANT REFERENCES ON public.points_rules TO anon;
GRANT SELECT ON public.points_rules TO anon;
GRANT TRIGGER ON public.points_rules TO anon;
GRANT TRUNCATE ON public.points_rules TO anon;
GRANT UPDATE ON public.points_rules TO anon;
GRANT DELETE ON public.points_rules TO authenticated;
GRANT INSERT ON public.points_rules TO authenticated;
GRANT REFERENCES ON public.points_rules TO authenticated;
GRANT SELECT ON public.points_rules TO authenticated;
GRANT TRIGGER ON public.points_rules TO authenticated;
GRANT TRUNCATE ON public.points_rules TO authenticated;
GRANT UPDATE ON public.points_rules TO authenticated;
GRANT DELETE ON public.points_rules TO service_role;
GRANT INSERT ON public.points_rules TO service_role;
GRANT REFERENCES ON public.points_rules TO service_role;
GRANT SELECT ON public.points_rules TO service_role;
GRANT TRIGGER ON public.points_rules TO service_role;
GRANT TRUNCATE ON public.points_rules TO service_role;
GRANT UPDATE ON public.points_rules TO service_role;
GRANT DELETE ON public.product_redemption_orders TO anon;
GRANT INSERT ON public.product_redemption_orders TO anon;
GRANT REFERENCES ON public.product_redemption_orders TO anon;
GRANT SELECT ON public.product_redemption_orders TO anon;
GRANT TRIGGER ON public.product_redemption_orders TO anon;
GRANT TRUNCATE ON public.product_redemption_orders TO anon;
GRANT UPDATE ON public.product_redemption_orders TO anon;
GRANT DELETE ON public.product_redemption_orders TO authenticated;
GRANT INSERT ON public.product_redemption_orders TO authenticated;
GRANT REFERENCES ON public.product_redemption_orders TO authenticated;
GRANT SELECT ON public.product_redemption_orders TO authenticated;
GRANT TRIGGER ON public.product_redemption_orders TO authenticated;
GRANT TRUNCATE ON public.product_redemption_orders TO authenticated;
GRANT UPDATE ON public.product_redemption_orders TO authenticated;
GRANT DELETE ON public.product_redemption_orders TO service_role;
GRANT INSERT ON public.product_redemption_orders TO service_role;
GRANT REFERENCES ON public.product_redemption_orders TO service_role;
GRANT SELECT ON public.product_redemption_orders TO service_role;
GRANT TRIGGER ON public.product_redemption_orders TO service_role;
GRANT TRUNCATE ON public.product_redemption_orders TO service_role;
GRANT UPDATE ON public.product_redemption_orders TO service_role;
GRANT DELETE ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT REFERENCES ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT TRIGGER ON public.profiles TO anon;
GRANT TRUNCATE ON public.profiles TO anon;
GRANT UPDATE ON public.profiles TO anon;
GRANT DELETE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT REFERENCES ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT TRIGGER ON public.profiles TO authenticated;
GRANT TRUNCATE ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.profiles TO service_role;
GRANT INSERT ON public.profiles TO service_role;
GRANT REFERENCES ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO service_role;
GRANT TRIGGER ON public.profiles TO service_role;
GRANT TRUNCATE ON public.profiles TO service_role;
GRANT UPDATE ON public.profiles TO service_role;
GRANT DELETE ON public.profiles_safe TO anon;
GRANT INSERT ON public.profiles_safe TO anon;
GRANT REFERENCES ON public.profiles_safe TO anon;
GRANT SELECT ON public.profiles_safe TO anon;
GRANT TRIGGER ON public.profiles_safe TO anon;
GRANT TRUNCATE ON public.profiles_safe TO anon;
GRANT UPDATE ON public.profiles_safe TO anon;
GRANT DELETE ON public.profiles_safe TO authenticated;
GRANT INSERT ON public.profiles_safe TO authenticated;
GRANT REFERENCES ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT TRIGGER ON public.profiles_safe TO authenticated;
GRANT TRUNCATE ON public.profiles_safe TO authenticated;
GRANT UPDATE ON public.profiles_safe TO authenticated;
GRANT DELETE ON public.profiles_safe TO service_role;
GRANT INSERT ON public.profiles_safe TO service_role;
GRANT REFERENCES ON public.profiles_safe TO service_role;
GRANT SELECT ON public.profiles_safe TO service_role;
GRANT TRIGGER ON public.profiles_safe TO service_role;
GRANT TRUNCATE ON public.profiles_safe TO service_role;
GRANT UPDATE ON public.profiles_safe TO service_role;
GRANT DELETE ON public.public_affiliate_deals_safe TO anon;
GRANT INSERT ON public.public_affiliate_deals_safe TO anon;
GRANT REFERENCES ON public.public_affiliate_deals_safe TO anon;
GRANT SELECT ON public.public_affiliate_deals_safe TO anon;
GRANT TRIGGER ON public.public_affiliate_deals_safe TO anon;
GRANT TRUNCATE ON public.public_affiliate_deals_safe TO anon;
GRANT UPDATE ON public.public_affiliate_deals_safe TO anon;
GRANT DELETE ON public.public_affiliate_deals_safe TO authenticated;
GRANT INSERT ON public.public_affiliate_deals_safe TO authenticated;
GRANT REFERENCES ON public.public_affiliate_deals_safe TO authenticated;
GRANT SELECT ON public.public_affiliate_deals_safe TO authenticated;
GRANT TRIGGER ON public.public_affiliate_deals_safe TO authenticated;
GRANT TRUNCATE ON public.public_affiliate_deals_safe TO authenticated;
GRANT UPDATE ON public.public_affiliate_deals_safe TO authenticated;
GRANT DELETE ON public.public_affiliate_deals_safe TO service_role;
GRANT INSERT ON public.public_affiliate_deals_safe TO service_role;
GRANT REFERENCES ON public.public_affiliate_deals_safe TO service_role;
GRANT SELECT ON public.public_affiliate_deals_safe TO service_role;
GRANT TRIGGER ON public.public_affiliate_deals_safe TO service_role;
GRANT TRUNCATE ON public.public_affiliate_deals_safe TO service_role;
GRANT UPDATE ON public.public_affiliate_deals_safe TO service_role;
GRANT DELETE ON public.public_brand_modules_safe TO anon;
GRANT INSERT ON public.public_brand_modules_safe TO anon;
GRANT REFERENCES ON public.public_brand_modules_safe TO anon;
GRANT SELECT ON public.public_brand_modules_safe TO anon;
GRANT TRIGGER ON public.public_brand_modules_safe TO anon;
GRANT TRUNCATE ON public.public_brand_modules_safe TO anon;
GRANT UPDATE ON public.public_brand_modules_safe TO anon;
GRANT DELETE ON public.public_brand_modules_safe TO authenticated;
GRANT INSERT ON public.public_brand_modules_safe TO authenticated;
GRANT REFERENCES ON public.public_brand_modules_safe TO authenticated;
GRANT SELECT ON public.public_brand_modules_safe TO authenticated;
GRANT TRIGGER ON public.public_brand_modules_safe TO authenticated;
GRANT TRUNCATE ON public.public_brand_modules_safe TO authenticated;
GRANT UPDATE ON public.public_brand_modules_safe TO authenticated;
GRANT DELETE ON public.public_brand_modules_safe TO service_role;
GRANT INSERT ON public.public_brand_modules_safe TO service_role;
GRANT REFERENCES ON public.public_brand_modules_safe TO service_role;
GRANT SELECT ON public.public_brand_modules_safe TO service_role;
GRANT TRIGGER ON public.public_brand_modules_safe TO service_role;
GRANT TRUNCATE ON public.public_brand_modules_safe TO service_role;
GRANT UPDATE ON public.public_brand_modules_safe TO service_role;
GRANT DELETE ON public.public_brands_safe TO anon;
GRANT INSERT ON public.public_brands_safe TO anon;
GRANT REFERENCES ON public.public_brands_safe TO anon;
GRANT SELECT ON public.public_brands_safe TO anon;
GRANT TRIGGER ON public.public_brands_safe TO anon;
GRANT TRUNCATE ON public.public_brands_safe TO anon;
GRANT UPDATE ON public.public_brands_safe TO anon;
GRANT DELETE ON public.public_brands_safe TO authenticated;
GRANT INSERT ON public.public_brands_safe TO authenticated;
GRANT REFERENCES ON public.public_brands_safe TO authenticated;
GRANT SELECT ON public.public_brands_safe TO authenticated;
GRANT TRIGGER ON public.public_brands_safe TO authenticated;
GRANT TRUNCATE ON public.public_brands_safe TO authenticated;
GRANT UPDATE ON public.public_brands_safe TO authenticated;
GRANT DELETE ON public.public_brands_safe TO service_role;
GRANT INSERT ON public.public_brands_safe TO service_role;
GRANT REFERENCES ON public.public_brands_safe TO service_role;
GRANT SELECT ON public.public_brands_safe TO service_role;
GRANT TRIGGER ON public.public_brands_safe TO service_role;
GRANT TRUNCATE ON public.public_brands_safe TO service_role;
GRANT UPDATE ON public.public_brands_safe TO service_role;
GRANT DELETE ON public.public_stores_safe TO anon;
GRANT INSERT ON public.public_stores_safe TO anon;
GRANT REFERENCES ON public.public_stores_safe TO anon;
GRANT SELECT ON public.public_stores_safe TO anon;
GRANT TRIGGER ON public.public_stores_safe TO anon;
GRANT TRUNCATE ON public.public_stores_safe TO anon;
GRANT UPDATE ON public.public_stores_safe TO anon;
GRANT DELETE ON public.public_stores_safe TO authenticated;
GRANT INSERT ON public.public_stores_safe TO authenticated;
GRANT REFERENCES ON public.public_stores_safe TO authenticated;
GRANT SELECT ON public.public_stores_safe TO authenticated;
GRANT TRIGGER ON public.public_stores_safe TO authenticated;
GRANT TRUNCATE ON public.public_stores_safe TO authenticated;
GRANT UPDATE ON public.public_stores_safe TO authenticated;
GRANT DELETE ON public.public_stores_safe TO service_role;
GRANT INSERT ON public.public_stores_safe TO service_role;
GRANT REFERENCES ON public.public_stores_safe TO service_role;
GRANT SELECT ON public.public_stores_safe TO service_role;
GRANT TRIGGER ON public.public_stores_safe TO service_role;
GRANT TRUNCATE ON public.public_stores_safe TO service_role;
GRANT UPDATE ON public.public_stores_safe TO service_role;
GRANT DELETE ON public.push_subscriptions TO anon;
GRANT INSERT ON public.push_subscriptions TO anon;
GRANT REFERENCES ON public.push_subscriptions TO anon;
GRANT SELECT ON public.push_subscriptions TO anon;
GRANT TRIGGER ON public.push_subscriptions TO anon;
GRANT TRUNCATE ON public.push_subscriptions TO anon;
GRANT UPDATE ON public.push_subscriptions TO anon;
GRANT DELETE ON public.push_subscriptions TO authenticated;
GRANT INSERT ON public.push_subscriptions TO authenticated;
GRANT REFERENCES ON public.push_subscriptions TO authenticated;
GRANT SELECT ON public.push_subscriptions TO authenticated;
GRANT TRIGGER ON public.push_subscriptions TO authenticated;
GRANT TRUNCATE ON public.push_subscriptions TO authenticated;
GRANT UPDATE ON public.push_subscriptions TO authenticated;
GRANT DELETE ON public.push_subscriptions TO service_role;
GRANT INSERT ON public.push_subscriptions TO service_role;
GRANT REFERENCES ON public.push_subscriptions TO service_role;
GRANT SELECT ON public.push_subscriptions TO service_role;
GRANT TRIGGER ON public.push_subscriptions TO service_role;
GRANT TRUNCATE ON public.push_subscriptions TO service_role;
GRANT UPDATE ON public.push_subscriptions TO service_role;
GRANT DELETE ON public.rate_limit_entries TO anon;
GRANT INSERT ON public.rate_limit_entries TO anon;
GRANT REFERENCES ON public.rate_limit_entries TO anon;
GRANT SELECT ON public.rate_limit_entries TO anon;
GRANT TRIGGER ON public.rate_limit_entries TO anon;
GRANT TRUNCATE ON public.rate_limit_entries TO anon;
GRANT UPDATE ON public.rate_limit_entries TO anon;
GRANT DELETE ON public.rate_limit_entries TO authenticated;
GRANT INSERT ON public.rate_limit_entries TO authenticated;
GRANT REFERENCES ON public.rate_limit_entries TO authenticated;
GRANT SELECT ON public.rate_limit_entries TO authenticated;
GRANT TRIGGER ON public.rate_limit_entries TO authenticated;
GRANT TRUNCATE ON public.rate_limit_entries TO authenticated;
GRANT UPDATE ON public.rate_limit_entries TO authenticated;
GRANT DELETE ON public.rate_limit_entries TO service_role;
GRANT INSERT ON public.rate_limit_entries TO service_role;
GRANT REFERENCES ON public.rate_limit_entries TO service_role;
GRANT SELECT ON public.rate_limit_entries TO service_role;
GRANT TRIGGER ON public.rate_limit_entries TO service_role;
GRANT TRUNCATE ON public.rate_limit_entries TO service_role;
GRANT UPDATE ON public.rate_limit_entries TO service_role;
GRANT DELETE ON public.redemptions TO anon;
GRANT INSERT ON public.redemptions TO anon;
GRANT REFERENCES ON public.redemptions TO anon;
GRANT SELECT ON public.redemptions TO anon;
GRANT TRIGGER ON public.redemptions TO anon;
GRANT TRUNCATE ON public.redemptions TO anon;
GRANT UPDATE ON public.redemptions TO anon;
GRANT DELETE ON public.redemptions TO authenticated;
GRANT INSERT ON public.redemptions TO authenticated;
GRANT REFERENCES ON public.redemptions TO authenticated;
GRANT SELECT ON public.redemptions TO authenticated;
GRANT TRIGGER ON public.redemptions TO authenticated;
GRANT TRUNCATE ON public.redemptions TO authenticated;
GRANT UPDATE ON public.redemptions TO authenticated;
GRANT DELETE ON public.redemptions TO service_role;
GRANT INSERT ON public.redemptions TO service_role;
GRANT REFERENCES ON public.redemptions TO service_role;
GRANT SELECT ON public.redemptions TO service_role;
GRANT TRIGGER ON public.redemptions TO service_role;
GRANT TRUNCATE ON public.redemptions TO service_role;
GRANT UPDATE ON public.redemptions TO service_role;
GRANT DELETE ON public.redemptions_safe TO anon;
GRANT INSERT ON public.redemptions_safe TO anon;
GRANT REFERENCES ON public.redemptions_safe TO anon;
GRANT SELECT ON public.redemptions_safe TO anon;
GRANT TRIGGER ON public.redemptions_safe TO anon;
GRANT TRUNCATE ON public.redemptions_safe TO anon;
GRANT UPDATE ON public.redemptions_safe TO anon;
GRANT DELETE ON public.redemptions_safe TO authenticated;
GRANT INSERT ON public.redemptions_safe TO authenticated;
GRANT REFERENCES ON public.redemptions_safe TO authenticated;
GRANT SELECT ON public.redemptions_safe TO authenticated;
GRANT TRIGGER ON public.redemptions_safe TO authenticated;
GRANT TRUNCATE ON public.redemptions_safe TO authenticated;
GRANT UPDATE ON public.redemptions_safe TO authenticated;
GRANT DELETE ON public.redemptions_safe TO service_role;
GRANT INSERT ON public.redemptions_safe TO service_role;
GRANT REFERENCES ON public.redemptions_safe TO service_role;
GRANT SELECT ON public.redemptions_safe TO service_role;
GRANT TRIGGER ON public.redemptions_safe TO service_role;
GRANT TRUNCATE ON public.redemptions_safe TO service_role;
GRANT UPDATE ON public.redemptions_safe TO service_role;
GRANT DELETE ON public.releases TO anon;
GRANT INSERT ON public.releases TO anon;
GRANT REFERENCES ON public.releases TO anon;
GRANT SELECT ON public.releases TO anon;
GRANT TRIGGER ON public.releases TO anon;
GRANT TRUNCATE ON public.releases TO anon;
GRANT UPDATE ON public.releases TO anon;
GRANT DELETE ON public.releases TO authenticated;
GRANT INSERT ON public.releases TO authenticated;
GRANT REFERENCES ON public.releases TO authenticated;
GRANT SELECT ON public.releases TO authenticated;
GRANT TRIGGER ON public.releases TO authenticated;
GRANT TRUNCATE ON public.releases TO authenticated;
GRANT UPDATE ON public.releases TO authenticated;
GRANT DELETE ON public.releases TO service_role;
GRANT INSERT ON public.releases TO service_role;
GRANT REFERENCES ON public.releases TO service_role;
GRANT SELECT ON public.releases TO service_role;
GRANT TRIGGER ON public.releases TO service_role;
GRANT TRUNCATE ON public.releases TO service_role;
GRANT UPDATE ON public.releases TO service_role;
GRANT DELETE ON public.role_permissions TO anon;
GRANT INSERT ON public.role_permissions TO anon;
GRANT REFERENCES ON public.role_permissions TO anon;
GRANT SELECT ON public.role_permissions TO anon;
GRANT TRIGGER ON public.role_permissions TO anon;
GRANT TRUNCATE ON public.role_permissions TO anon;
GRANT UPDATE ON public.role_permissions TO anon;
GRANT DELETE ON public.role_permissions TO authenticated;
GRANT INSERT ON public.role_permissions TO authenticated;
GRANT REFERENCES ON public.role_permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT TRIGGER ON public.role_permissions TO authenticated;
GRANT TRUNCATE ON public.role_permissions TO authenticated;
GRANT UPDATE ON public.role_permissions TO authenticated;
GRANT DELETE ON public.role_permissions TO service_role;
GRANT INSERT ON public.role_permissions TO service_role;
GRANT REFERENCES ON public.role_permissions TO service_role;
GRANT SELECT ON public.role_permissions TO service_role;
GRANT TRIGGER ON public.role_permissions TO service_role;
GRANT TRUNCATE ON public.role_permissions TO service_role;
GRANT UPDATE ON public.role_permissions TO service_role;
GRANT DELETE ON public.roles TO anon;
GRANT INSERT ON public.roles TO anon;
GRANT REFERENCES ON public.roles TO anon;
GRANT SELECT ON public.roles TO anon;
GRANT TRIGGER ON public.roles TO anon;
GRANT TRUNCATE ON public.roles TO anon;
GRANT UPDATE ON public.roles TO anon;
GRANT DELETE ON public.roles TO authenticated;
GRANT INSERT ON public.roles TO authenticated;
GRANT REFERENCES ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT TRIGGER ON public.roles TO authenticated;
GRANT TRUNCATE ON public.roles TO authenticated;
GRANT UPDATE ON public.roles TO authenticated;
GRANT DELETE ON public.roles TO service_role;
GRANT INSERT ON public.roles TO service_role;
GRANT REFERENCES ON public.roles TO service_role;
GRANT SELECT ON public.roles TO service_role;
GRANT TRIGGER ON public.roles TO service_role;
GRANT TRUNCATE ON public.roles TO service_role;
GRANT UPDATE ON public.roles TO service_role;
GRANT DELETE ON public.section_templates TO anon;
GRANT INSERT ON public.section_templates TO anon;
GRANT REFERENCES ON public.section_templates TO anon;
GRANT SELECT ON public.section_templates TO anon;
GRANT TRIGGER ON public.section_templates TO anon;
GRANT TRUNCATE ON public.section_templates TO anon;
GRANT UPDATE ON public.section_templates TO anon;
GRANT DELETE ON public.section_templates TO authenticated;
GRANT INSERT ON public.section_templates TO authenticated;
GRANT REFERENCES ON public.section_templates TO authenticated;
GRANT SELECT ON public.section_templates TO authenticated;
GRANT TRIGGER ON public.section_templates TO authenticated;
GRANT TRUNCATE ON public.section_templates TO authenticated;
GRANT UPDATE ON public.section_templates TO authenticated;
GRANT DELETE ON public.section_templates TO service_role;
GRANT INSERT ON public.section_templates TO service_role;
GRANT REFERENCES ON public.section_templates TO service_role;
GRANT SELECT ON public.section_templates TO service_role;
GRANT TRIGGER ON public.section_templates TO service_role;
GRANT TRUNCATE ON public.section_templates TO service_role;
GRANT UPDATE ON public.section_templates TO service_role;
GRANT DELETE ON public.segment_synonym_logs TO anon;
GRANT INSERT ON public.segment_synonym_logs TO anon;
GRANT REFERENCES ON public.segment_synonym_logs TO anon;
GRANT SELECT ON public.segment_synonym_logs TO anon;
GRANT TRIGGER ON public.segment_synonym_logs TO anon;
GRANT TRUNCATE ON public.segment_synonym_logs TO anon;
GRANT UPDATE ON public.segment_synonym_logs TO anon;
GRANT DELETE ON public.segment_synonym_logs TO authenticated;
GRANT INSERT ON public.segment_synonym_logs TO authenticated;
GRANT REFERENCES ON public.segment_synonym_logs TO authenticated;
GRANT SELECT ON public.segment_synonym_logs TO authenticated;
GRANT TRIGGER ON public.segment_synonym_logs TO authenticated;
GRANT TRUNCATE ON public.segment_synonym_logs TO authenticated;
GRANT UPDATE ON public.segment_synonym_logs TO authenticated;
GRANT DELETE ON public.segment_synonym_logs TO service_role;
GRANT INSERT ON public.segment_synonym_logs TO service_role;
GRANT REFERENCES ON public.segment_synonym_logs TO service_role;
GRANT SELECT ON public.segment_synonym_logs TO service_role;
GRANT TRIGGER ON public.segment_synonym_logs TO service_role;
GRANT TRUNCATE ON public.segment_synonym_logs TO service_role;
GRANT UPDATE ON public.segment_synonym_logs TO service_role;
GRANT DELETE ON public.sponsored_placements TO anon;
GRANT INSERT ON public.sponsored_placements TO anon;
GRANT REFERENCES ON public.sponsored_placements TO anon;
GRANT SELECT ON public.sponsored_placements TO anon;
GRANT TRIGGER ON public.sponsored_placements TO anon;
GRANT TRUNCATE ON public.sponsored_placements TO anon;
GRANT UPDATE ON public.sponsored_placements TO anon;
GRANT DELETE ON public.sponsored_placements TO authenticated;
GRANT INSERT ON public.sponsored_placements TO authenticated;
GRANT REFERENCES ON public.sponsored_placements TO authenticated;
GRANT SELECT ON public.sponsored_placements TO authenticated;
GRANT TRIGGER ON public.sponsored_placements TO authenticated;
GRANT TRUNCATE ON public.sponsored_placements TO authenticated;
GRANT UPDATE ON public.sponsored_placements TO authenticated;
GRANT DELETE ON public.sponsored_placements TO service_role;
GRANT INSERT ON public.sponsored_placements TO service_role;
GRANT REFERENCES ON public.sponsored_placements TO service_role;
GRANT SELECT ON public.sponsored_placements TO service_role;
GRANT TRIGGER ON public.sponsored_placements TO service_role;
GRANT TRUNCATE ON public.sponsored_placements TO service_role;
GRANT UPDATE ON public.sponsored_placements TO service_role;
GRANT DELETE ON public.store_catalog_categories TO anon;
GRANT INSERT ON public.store_catalog_categories TO anon;
GRANT REFERENCES ON public.store_catalog_categories TO anon;
GRANT SELECT ON public.store_catalog_categories TO anon;
GRANT TRIGGER ON public.store_catalog_categories TO anon;
GRANT TRUNCATE ON public.store_catalog_categories TO anon;
GRANT UPDATE ON public.store_catalog_categories TO anon;
GRANT DELETE ON public.store_catalog_categories TO authenticated;
GRANT INSERT ON public.store_catalog_categories TO authenticated;
GRANT REFERENCES ON public.store_catalog_categories TO authenticated;
GRANT SELECT ON public.store_catalog_categories TO authenticated;
GRANT TRIGGER ON public.store_catalog_categories TO authenticated;
GRANT TRUNCATE ON public.store_catalog_categories TO authenticated;
GRANT UPDATE ON public.store_catalog_categories TO authenticated;
GRANT DELETE ON public.store_catalog_categories TO service_role;
GRANT INSERT ON public.store_catalog_categories TO service_role;
GRANT REFERENCES ON public.store_catalog_categories TO service_role;
GRANT SELECT ON public.store_catalog_categories TO service_role;
GRANT TRIGGER ON public.store_catalog_categories TO service_role;
GRANT TRUNCATE ON public.store_catalog_categories TO service_role;
GRANT UPDATE ON public.store_catalog_categories TO service_role;
GRANT DELETE ON public.store_catalog_items TO anon;
GRANT INSERT ON public.store_catalog_items TO anon;
GRANT REFERENCES ON public.store_catalog_items TO anon;
GRANT SELECT ON public.store_catalog_items TO anon;
GRANT TRIGGER ON public.store_catalog_items TO anon;
GRANT TRUNCATE ON public.store_catalog_items TO anon;
GRANT UPDATE ON public.store_catalog_items TO anon;
GRANT DELETE ON public.store_catalog_items TO authenticated;
GRANT INSERT ON public.store_catalog_items TO authenticated;
GRANT REFERENCES ON public.store_catalog_items TO authenticated;
GRANT SELECT ON public.store_catalog_items TO authenticated;
GRANT TRIGGER ON public.store_catalog_items TO authenticated;
GRANT TRUNCATE ON public.store_catalog_items TO authenticated;
GRANT UPDATE ON public.store_catalog_items TO authenticated;
GRANT DELETE ON public.store_catalog_items TO service_role;
GRANT INSERT ON public.store_catalog_items TO service_role;
GRANT REFERENCES ON public.store_catalog_items TO service_role;
GRANT SELECT ON public.store_catalog_items TO service_role;
GRANT TRIGGER ON public.store_catalog_items TO service_role;
GRANT TRUNCATE ON public.store_catalog_items TO service_role;
GRANT UPDATE ON public.store_catalog_items TO service_role;
GRANT DELETE ON public.store_documents TO anon;
GRANT INSERT ON public.store_documents TO anon;
GRANT REFERENCES ON public.store_documents TO anon;
GRANT SELECT ON public.store_documents TO anon;
GRANT TRIGGER ON public.store_documents TO anon;
GRANT TRUNCATE ON public.store_documents TO anon;
GRANT UPDATE ON public.store_documents TO anon;
GRANT DELETE ON public.store_documents TO authenticated;
GRANT INSERT ON public.store_documents TO authenticated;
GRANT REFERENCES ON public.store_documents TO authenticated;
GRANT SELECT ON public.store_documents TO authenticated;
GRANT TRIGGER ON public.store_documents TO authenticated;
GRANT TRUNCATE ON public.store_documents TO authenticated;
GRANT UPDATE ON public.store_documents TO authenticated;
GRANT DELETE ON public.store_documents TO service_role;
GRANT INSERT ON public.store_documents TO service_role;
GRANT REFERENCES ON public.store_documents TO service_role;
GRANT SELECT ON public.store_documents TO service_role;
GRANT TRIGGER ON public.store_documents TO service_role;
GRANT TRUNCATE ON public.store_documents TO service_role;
GRANT UPDATE ON public.store_documents TO service_role;
GRANT DELETE ON public.store_employees TO anon;
GRANT INSERT ON public.store_employees TO anon;
GRANT REFERENCES ON public.store_employees TO anon;
GRANT SELECT ON public.store_employees TO anon;
GRANT TRIGGER ON public.store_employees TO anon;
GRANT TRUNCATE ON public.store_employees TO anon;
GRANT UPDATE ON public.store_employees TO anon;
GRANT DELETE ON public.store_employees TO authenticated;
GRANT INSERT ON public.store_employees TO authenticated;
GRANT REFERENCES ON public.store_employees TO authenticated;
GRANT SELECT ON public.store_employees TO authenticated;
GRANT TRIGGER ON public.store_employees TO authenticated;
GRANT TRUNCATE ON public.store_employees TO authenticated;
GRANT UPDATE ON public.store_employees TO authenticated;
GRANT DELETE ON public.store_employees TO service_role;
GRANT INSERT ON public.store_employees TO service_role;
GRANT REFERENCES ON public.store_employees TO service_role;
GRANT SELECT ON public.store_employees TO service_role;
GRANT TRIGGER ON public.store_employees TO service_role;
GRANT TRUNCATE ON public.store_employees TO service_role;
GRANT UPDATE ON public.store_employees TO service_role;
GRANT DELETE ON public.store_points_rules TO anon;
GRANT INSERT ON public.store_points_rules TO anon;
GRANT REFERENCES ON public.store_points_rules TO anon;
GRANT SELECT ON public.store_points_rules TO anon;
GRANT TRIGGER ON public.store_points_rules TO anon;
GRANT TRUNCATE ON public.store_points_rules TO anon;
GRANT UPDATE ON public.store_points_rules TO anon;
GRANT DELETE ON public.store_points_rules TO authenticated;
GRANT INSERT ON public.store_points_rules TO authenticated;
GRANT REFERENCES ON public.store_points_rules TO authenticated;
GRANT SELECT ON public.store_points_rules TO authenticated;
GRANT TRIGGER ON public.store_points_rules TO authenticated;
GRANT TRUNCATE ON public.store_points_rules TO authenticated;
GRANT UPDATE ON public.store_points_rules TO authenticated;
GRANT DELETE ON public.store_points_rules TO service_role;
GRANT INSERT ON public.store_points_rules TO service_role;
GRANT REFERENCES ON public.store_points_rules TO service_role;
GRANT SELECT ON public.store_points_rules TO service_role;
GRANT TRIGGER ON public.store_points_rules TO service_role;
GRANT TRUNCATE ON public.store_points_rules TO service_role;
GRANT UPDATE ON public.store_points_rules TO service_role;
GRANT DELETE ON public.store_products TO anon;
GRANT INSERT ON public.store_products TO anon;
GRANT REFERENCES ON public.store_products TO anon;
GRANT SELECT ON public.store_products TO anon;
GRANT TRIGGER ON public.store_products TO anon;
GRANT TRUNCATE ON public.store_products TO anon;
GRANT UPDATE ON public.store_products TO anon;
GRANT DELETE ON public.store_products TO authenticated;
GRANT INSERT ON public.store_products TO authenticated;
GRANT REFERENCES ON public.store_products TO authenticated;
GRANT SELECT ON public.store_products TO authenticated;
GRANT TRIGGER ON public.store_products TO authenticated;
GRANT TRUNCATE ON public.store_products TO authenticated;
GRANT UPDATE ON public.store_products TO authenticated;
GRANT DELETE ON public.store_products TO service_role;
GRANT INSERT ON public.store_products TO service_role;
GRANT REFERENCES ON public.store_products TO service_role;
GRANT SELECT ON public.store_products TO service_role;
GRANT TRIGGER ON public.store_products TO service_role;
GRANT TRUNCATE ON public.store_products TO service_role;
GRANT UPDATE ON public.store_products TO service_role;
GRANT DELETE ON public.store_reviews TO anon;
GRANT INSERT ON public.store_reviews TO anon;
GRANT REFERENCES ON public.store_reviews TO anon;
GRANT SELECT ON public.store_reviews TO anon;
GRANT TRIGGER ON public.store_reviews TO anon;
GRANT TRUNCATE ON public.store_reviews TO anon;
GRANT UPDATE ON public.store_reviews TO anon;
GRANT DELETE ON public.store_reviews TO authenticated;
GRANT INSERT ON public.store_reviews TO authenticated;
GRANT REFERENCES ON public.store_reviews TO authenticated;
GRANT SELECT ON public.store_reviews TO authenticated;
GRANT TRIGGER ON public.store_reviews TO authenticated;
GRANT TRUNCATE ON public.store_reviews TO authenticated;
GRANT UPDATE ON public.store_reviews TO authenticated;
GRANT DELETE ON public.store_reviews TO service_role;
GRANT INSERT ON public.store_reviews TO service_role;
GRANT REFERENCES ON public.store_reviews TO service_role;
GRANT SELECT ON public.store_reviews TO service_role;
GRANT TRIGGER ON public.store_reviews TO service_role;
GRANT TRUNCATE ON public.store_reviews TO service_role;
GRANT UPDATE ON public.store_reviews TO service_role;
GRANT DELETE ON public.store_type_requests TO anon;
GRANT INSERT ON public.store_type_requests TO anon;
GRANT REFERENCES ON public.store_type_requests TO anon;
GRANT SELECT ON public.store_type_requests TO anon;
GRANT TRIGGER ON public.store_type_requests TO anon;
GRANT TRUNCATE ON public.store_type_requests TO anon;
GRANT UPDATE ON public.store_type_requests TO anon;
GRANT DELETE ON public.store_type_requests TO authenticated;
GRANT INSERT ON public.store_type_requests TO authenticated;
GRANT REFERENCES ON public.store_type_requests TO authenticated;
GRANT SELECT ON public.store_type_requests TO authenticated;
GRANT TRIGGER ON public.store_type_requests TO authenticated;
GRANT TRUNCATE ON public.store_type_requests TO authenticated;
GRANT UPDATE ON public.store_type_requests TO authenticated;
GRANT DELETE ON public.store_type_requests TO service_role;
GRANT INSERT ON public.store_type_requests TO service_role;
GRANT REFERENCES ON public.store_type_requests TO service_role;
GRANT SELECT ON public.store_type_requests TO service_role;
GRANT TRIGGER ON public.store_type_requests TO service_role;
GRANT TRUNCATE ON public.store_type_requests TO service_role;
GRANT UPDATE ON public.store_type_requests TO service_role;
GRANT DELETE ON public.stores TO anon;
GRANT INSERT ON public.stores TO anon;
GRANT REFERENCES ON public.stores TO anon;
GRANT SELECT ON public.stores TO anon;
GRANT TRIGGER ON public.stores TO anon;
GRANT TRUNCATE ON public.stores TO anon;
GRANT UPDATE ON public.stores TO anon;
GRANT DELETE ON public.stores TO authenticated;
GRANT INSERT ON public.stores TO authenticated;
GRANT REFERENCES ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO authenticated;
GRANT TRIGGER ON public.stores TO authenticated;
GRANT TRUNCATE ON public.stores TO authenticated;
GRANT UPDATE ON public.stores TO authenticated;
GRANT DELETE ON public.stores TO service_role;
GRANT INSERT ON public.stores TO service_role;
GRANT REFERENCES ON public.stores TO service_role;
GRANT SELECT ON public.stores TO service_role;
GRANT TRIGGER ON public.stores TO service_role;
GRANT TRUNCATE ON public.stores TO service_role;
GRANT UPDATE ON public.stores TO service_role;
GRANT DELETE ON public.subscription_plans TO anon;
GRANT INSERT ON public.subscription_plans TO anon;
GRANT REFERENCES ON public.subscription_plans TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT TRIGGER ON public.subscription_plans TO anon;
GRANT TRUNCATE ON public.subscription_plans TO anon;
GRANT UPDATE ON public.subscription_plans TO anon;
GRANT DELETE ON public.subscription_plans TO authenticated;
GRANT INSERT ON public.subscription_plans TO authenticated;
GRANT REFERENCES ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT TRIGGER ON public.subscription_plans TO authenticated;
GRANT TRUNCATE ON public.subscription_plans TO authenticated;
GRANT UPDATE ON public.subscription_plans TO authenticated;
GRANT DELETE ON public.subscription_plans TO service_role;
GRANT INSERT ON public.subscription_plans TO service_role;
GRANT REFERENCES ON public.subscription_plans TO service_role;
GRANT SELECT ON public.subscription_plans TO service_role;
GRANT TRIGGER ON public.subscription_plans TO service_role;
GRANT TRUNCATE ON public.subscription_plans TO service_role;
GRANT UPDATE ON public.subscription_plans TO service_role;
GRANT DELETE ON public.taxonomy_categories TO anon;
GRANT INSERT ON public.taxonomy_categories TO anon;
GRANT REFERENCES ON public.taxonomy_categories TO anon;
GRANT SELECT ON public.taxonomy_categories TO anon;
GRANT TRIGGER ON public.taxonomy_categories TO anon;
GRANT TRUNCATE ON public.taxonomy_categories TO anon;
GRANT UPDATE ON public.taxonomy_categories TO anon;
GRANT DELETE ON public.taxonomy_categories TO authenticated;
GRANT INSERT ON public.taxonomy_categories TO authenticated;
GRANT REFERENCES ON public.taxonomy_categories TO authenticated;
GRANT SELECT ON public.taxonomy_categories TO authenticated;
GRANT TRIGGER ON public.taxonomy_categories TO authenticated;
GRANT TRUNCATE ON public.taxonomy_categories TO authenticated;
GRANT UPDATE ON public.taxonomy_categories TO authenticated;
GRANT DELETE ON public.taxonomy_categories TO service_role;
GRANT INSERT ON public.taxonomy_categories TO service_role;
GRANT REFERENCES ON public.taxonomy_categories TO service_role;
GRANT SELECT ON public.taxonomy_categories TO service_role;
GRANT TRIGGER ON public.taxonomy_categories TO service_role;
GRANT TRUNCATE ON public.taxonomy_categories TO service_role;
GRANT UPDATE ON public.taxonomy_categories TO service_role;
GRANT DELETE ON public.taxonomy_segments TO anon;
GRANT INSERT ON public.taxonomy_segments TO anon;
GRANT REFERENCES ON public.taxonomy_segments TO anon;
GRANT SELECT ON public.taxonomy_segments TO anon;
GRANT TRIGGER ON public.taxonomy_segments TO anon;
GRANT TRUNCATE ON public.taxonomy_segments TO anon;
GRANT UPDATE ON public.taxonomy_segments TO anon;
GRANT DELETE ON public.taxonomy_segments TO authenticated;
GRANT INSERT ON public.taxonomy_segments TO authenticated;
GRANT REFERENCES ON public.taxonomy_segments TO authenticated;
GRANT SELECT ON public.taxonomy_segments TO authenticated;
GRANT TRIGGER ON public.taxonomy_segments TO authenticated;
GRANT TRUNCATE ON public.taxonomy_segments TO authenticated;
GRANT UPDATE ON public.taxonomy_segments TO authenticated;
GRANT DELETE ON public.taxonomy_segments TO service_role;
GRANT INSERT ON public.taxonomy_segments TO service_role;
GRANT REFERENCES ON public.taxonomy_segments TO service_role;
GRANT SELECT ON public.taxonomy_segments TO service_role;
GRANT TRIGGER ON public.taxonomy_segments TO service_role;
GRANT TRUNCATE ON public.taxonomy_segments TO service_role;
GRANT UPDATE ON public.taxonomy_segments TO service_role;
GRANT DELETE ON public.tenants TO anon;
GRANT INSERT ON public.tenants TO anon;
GRANT REFERENCES ON public.tenants TO anon;
GRANT SELECT ON public.tenants TO anon;
GRANT TRIGGER ON public.tenants TO anon;
GRANT TRUNCATE ON public.tenants TO anon;
GRANT UPDATE ON public.tenants TO anon;
GRANT DELETE ON public.tenants TO authenticated;
GRANT INSERT ON public.tenants TO authenticated;
GRANT REFERENCES ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT TRIGGER ON public.tenants TO authenticated;
GRANT TRUNCATE ON public.tenants TO authenticated;
GRANT UPDATE ON public.tenants TO authenticated;
GRANT DELETE ON public.tenants TO service_role;
GRANT INSERT ON public.tenants TO service_role;
GRANT REFERENCES ON public.tenants TO service_role;
GRANT SELECT ON public.tenants TO service_role;
GRANT TRIGGER ON public.tenants TO service_role;
GRANT TRUNCATE ON public.tenants TO service_role;
GRANT UPDATE ON public.tenants TO service_role;
GRANT DELETE ON public.tier_points_rules TO anon;
GRANT INSERT ON public.tier_points_rules TO anon;
GRANT REFERENCES ON public.tier_points_rules TO anon;
GRANT SELECT ON public.tier_points_rules TO anon;
GRANT TRIGGER ON public.tier_points_rules TO anon;
GRANT TRUNCATE ON public.tier_points_rules TO anon;
GRANT UPDATE ON public.tier_points_rules TO anon;
GRANT DELETE ON public.tier_points_rules TO authenticated;
GRANT INSERT ON public.tier_points_rules TO authenticated;
GRANT REFERENCES ON public.tier_points_rules TO authenticated;
GRANT SELECT ON public.tier_points_rules TO authenticated;
GRANT TRIGGER ON public.tier_points_rules TO authenticated;
GRANT TRUNCATE ON public.tier_points_rules TO authenticated;
GRANT UPDATE ON public.tier_points_rules TO authenticated;
GRANT DELETE ON public.tier_points_rules TO service_role;
GRANT INSERT ON public.tier_points_rules TO service_role;
GRANT REFERENCES ON public.tier_points_rules TO service_role;
GRANT SELECT ON public.tier_points_rules TO service_role;
GRANT TRIGGER ON public.tier_points_rules TO service_role;
GRANT TRUNCATE ON public.tier_points_rules TO service_role;
GRANT UPDATE ON public.tier_points_rules TO service_role;
GRANT DELETE ON public.user_permission_overrides TO anon;
GRANT INSERT ON public.user_permission_overrides TO anon;
GRANT REFERENCES ON public.user_permission_overrides TO anon;
GRANT SELECT ON public.user_permission_overrides TO anon;
GRANT TRIGGER ON public.user_permission_overrides TO anon;
GRANT TRUNCATE ON public.user_permission_overrides TO anon;
GRANT UPDATE ON public.user_permission_overrides TO anon;
GRANT DELETE ON public.user_permission_overrides TO authenticated;
GRANT INSERT ON public.user_permission_overrides TO authenticated;
GRANT REFERENCES ON public.user_permission_overrides TO authenticated;
GRANT SELECT ON public.user_permission_overrides TO authenticated;
GRANT TRIGGER ON public.user_permission_overrides TO authenticated;
GRANT TRUNCATE ON public.user_permission_overrides TO authenticated;
GRANT UPDATE ON public.user_permission_overrides TO authenticated;
GRANT DELETE ON public.user_permission_overrides TO service_role;
GRANT INSERT ON public.user_permission_overrides TO service_role;
GRANT REFERENCES ON public.user_permission_overrides TO service_role;
GRANT SELECT ON public.user_permission_overrides TO service_role;
GRANT TRIGGER ON public.user_permission_overrides TO service_role;
GRANT TRUNCATE ON public.user_permission_overrides TO service_role;
GRANT UPDATE ON public.user_permission_overrides TO service_role;
GRANT DELETE ON public.user_roles TO anon;
GRANT INSERT ON public.user_roles TO anon;
GRANT REFERENCES ON public.user_roles TO anon;
GRANT SELECT ON public.user_roles TO anon;
GRANT TRIGGER ON public.user_roles TO anon;
GRANT TRUNCATE ON public.user_roles TO anon;
GRANT UPDATE ON public.user_roles TO anon;
GRANT DELETE ON public.user_roles TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;
GRANT REFERENCES ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT TRIGGER ON public.user_roles TO authenticated;
GRANT TRUNCATE ON public.user_roles TO authenticated;
GRANT UPDATE ON public.user_roles TO authenticated;
GRANT DELETE ON public.user_roles TO service_role;
GRANT INSERT ON public.user_roles TO service_role;
GRANT REFERENCES ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO service_role;
GRANT TRIGGER ON public.user_roles TO service_role;
GRANT TRUNCATE ON public.user_roles TO service_role;
GRANT UPDATE ON public.user_roles TO service_role;
GRANT DELETE ON public.voucher_redemptions TO anon;
GRANT INSERT ON public.voucher_redemptions TO anon;
GRANT REFERENCES ON public.voucher_redemptions TO anon;
GRANT SELECT ON public.voucher_redemptions TO anon;
GRANT TRIGGER ON public.voucher_redemptions TO anon;
GRANT TRUNCATE ON public.voucher_redemptions TO anon;
GRANT UPDATE ON public.voucher_redemptions TO anon;
GRANT DELETE ON public.voucher_redemptions TO authenticated;
GRANT INSERT ON public.voucher_redemptions TO authenticated;
GRANT REFERENCES ON public.voucher_redemptions TO authenticated;
GRANT SELECT ON public.voucher_redemptions TO authenticated;
GRANT TRIGGER ON public.voucher_redemptions TO authenticated;
GRANT TRUNCATE ON public.voucher_redemptions TO authenticated;
GRANT UPDATE ON public.voucher_redemptions TO authenticated;
GRANT DELETE ON public.voucher_redemptions TO service_role;
GRANT INSERT ON public.voucher_redemptions TO service_role;
GRANT REFERENCES ON public.voucher_redemptions TO service_role;
GRANT SELECT ON public.voucher_redemptions TO service_role;
GRANT TRIGGER ON public.voucher_redemptions TO service_role;
GRANT TRUNCATE ON public.voucher_redemptions TO service_role;
GRANT UPDATE ON public.voucher_redemptions TO service_role;
GRANT DELETE ON public.vouchers TO anon;
GRANT INSERT ON public.vouchers TO anon;
GRANT REFERENCES ON public.vouchers TO anon;
GRANT SELECT ON public.vouchers TO anon;
GRANT TRIGGER ON public.vouchers TO anon;
GRANT TRUNCATE ON public.vouchers TO anon;
GRANT UPDATE ON public.vouchers TO anon;
GRANT DELETE ON public.vouchers TO authenticated;
GRANT INSERT ON public.vouchers TO authenticated;
GRANT REFERENCES ON public.vouchers TO authenticated;
GRANT SELECT ON public.vouchers TO authenticated;
GRANT TRIGGER ON public.vouchers TO authenticated;
GRANT TRUNCATE ON public.vouchers TO authenticated;
GRANT UPDATE ON public.vouchers TO authenticated;
GRANT DELETE ON public.vouchers TO service_role;
GRANT INSERT ON public.vouchers TO service_role;
GRANT REFERENCES ON public.vouchers TO service_role;
GRANT SELECT ON public.vouchers TO service_role;
GRANT TRIGGER ON public.vouchers TO service_role;
GRANT TRUNCATE ON public.vouchers TO service_role;
GRANT UPDATE ON public.vouchers TO service_role;


-- =====================================================================
-- ROW LEVEL SECURITY - habilitacao
-- =====================================================================

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_category_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_deal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_points_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_business_model_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_duelo_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_permission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_section_manual_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_section_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_sub_permission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_model_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_artilharia_window_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_attempts_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_classificacao_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_driver_tier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_prize_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_season_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_season_phase_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_season_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_season_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_season_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_tier_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_cart_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_belt_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_business_model_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_module_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorite_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_duel_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_duel_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_duel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_duel_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_message_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_points_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_points_purchase_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_cycle_reset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_prize_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_side_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ganha_ganha_billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ganha_ganha_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ganha_ganha_store_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_template_apply_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_template_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icon_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_ride_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mirror_source_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mirror_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mirror_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_sync_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_landing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_sub_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_ganha_ganha_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_package_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_redemption_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_synonym_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_type_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- POLITICAS RLS (public + storage)
-- =====================================================================

CREATE POLICY "Brand users can update admin notifications" ON public.admin_notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Brand users can view admin notifications" ON public.admin_notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Public can view active banners" ON public.affiliate_category_banners AS PERMISSIVE FOR SELECT TO anon USING ((is_active = true));
CREATE POLICY "Users can manage banners for their brands" ON public.affiliate_category_banners AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Users can view banners for their brands" ON public.affiliate_category_banners AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Admin read affiliate clicks" ON public.affiliate_clicks AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (deal_id IN ( SELECT ad.id
   FROM affiliate_deals ad
  WHERE (ad.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))))));
CREATE POLICY "Authenticated insert affiliate clicks" ON public.affiliate_clicks AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Anyone can read active categories" ON public.affiliate_deal_categories AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Brand admins can delete categories" ON public.affiliate_deal_categories AS PERMISSIVE FOR DELETE TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Brand admins can insert categories" ON public.affiliate_deal_categories AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Brand admins can select all own categories" ON public.affiliate_deal_categories AS PERMISSIVE FOR SELECT TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Brand admins can update categories" ON public.affiliate_deal_categories AS PERMISSIVE FOR UPDATE TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role))) WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Admin manage affiliate deals" ON public.affiliate_deals AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (user_has_permission(auth.uid(), 'offers.create'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))))));
CREATE POLICY "Public can view active driver deals" ON public.affiliate_deals AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (visible_driver = true)));
CREATE POLICY "Public can view redeemable deals" ON public.affiliate_deals AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (is_redeemable = true)));
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Brand/branch admins read scoped audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO public USING ((((scope_type = 'BRAND'::text) AND (scope_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) OR ((scope_type = 'BRANCH'::text) AND (scope_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))) OR ((scope_type = 'BRAND'::text) AND (scope_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))))));
CREATE POLICY "Root admins can view brand_module audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((entity_type = 'brand_module'::text) AND has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Root can read all audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can read active banners" ON public.banner_schedules AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Brand admins manage banners" ON public.banner_schedules AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "branch_admin can view own branch wallet" ON public.branch_points_wallet AS PERMISSIVE FOR SELECT TO authenticated USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY "brand_admin can manage own brand wallets" ON public.branch_points_wallet AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "root_admin full access wallets" ON public.branch_points_wallet AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "branch_admin can view own branch wallet txns" ON public.branch_wallet_transactions AS PERMISSIVE FOR SELECT TO authenticated USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY "brand_admin can manage own brand wallet txns" ON public.branch_wallet_transactions AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "root_admin full access wallet txns" ON public.branch_wallet_transactions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anon read active branches" ON public.branches AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Delete branches" ON public.branches AS PERMISSIVE FOR DELETE TO authenticated USING ((user_has_permission(auth.uid(), 'branches.delete'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY "Insert branches" ON public.branches AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_has_permission(auth.uid(), 'branches.create'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY "Select branches" ON public.branches AS PERMISSIVE FOR SELECT TO authenticated USING ((user_has_permission(auth.uid(), 'branches.read'::text) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Update branches" ON public.branches AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_has_permission(auth.uid(), 'branches.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Brand admins manage api keys" ON public.brand_api_keys AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))))) WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY bbma_root_admin_all ON public.brand_business_model_addons AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY bbma_select_authenticated ON public.brand_business_model_addons AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
CREATE POLICY bbm_brand_admin_manage ON public.brand_business_models AS PERMISSIVE FOR ALL TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role))) WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY bbm_root_admin_all ON public.brand_business_models AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY bbm_select_scope ON public.brand_business_models AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Delete brand domains" ON public.brand_domains AS PERMISSIVE FOR DELETE TO authenticated USING ((user_has_permission(auth.uid(), 'domains.delete'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY "Insert brand domains" ON public.brand_domains AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_has_permission(auth.uid(), 'domains.create'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY "Select brand domains" ON public.brand_domains AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Update brand domains" ON public.brand_domains AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_has_permission(auth.uid(), 'domains.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY brand_duelo_prizes_branch_admin_select ON public.brand_duelo_prizes AS PERMISSIVE FOR SELECT TO authenticated USING (((branch_id IS NULL) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY brand_duelo_prizes_brand_admin_all ON public.brand_duelo_prizes AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY brand_duelo_prizes_root_all ON public.brand_duelo_prizes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anon can read brand_modules" ON public.brand_modules AS PERMISSIVE FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can read brand_modules" ON public.brand_modules AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Brand admins manage own brand_modules" ON public.brand_modules AS PERMISSIVE FOR ALL TO public USING ((user_has_permission(auth.uid(), 'settings.update'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))))));
CREATE POLICY "Manage brand_modules (root)" ON public.brand_modules AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Select brand_modules" ON public.brand_modules AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Brand admins read own permission config" ON public.brand_permission_config AS PERMISSIVE FOR SELECT TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Brand admins update store permissions" ON public.brand_permission_config AS PERMISSIVE FOR UPDATE TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages brand_permission_config" ON public.brand_permission_config AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can read manual items" ON public.brand_section_manual_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Manage manual items" ON public.brand_section_manual_items AS PERMISSIVE FOR ALL TO authenticated USING ((user_has_permission(auth.uid(), 'settings.update'::text) AND (brand_section_id IN ( SELECT bs.id
   FROM brand_sections bs
  WHERE (has_role(auth.uid(), 'root_admin'::app_role) OR (bs.brand_id IN ( SELECT b.id
           FROM brands b
          WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (bs.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))))));
CREATE POLICY "Anyone can read section sources" ON public.brand_section_sources AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Manage section sources" ON public.brand_section_sources AS PERMISSIVE FOR ALL TO authenticated USING ((user_has_permission(auth.uid(), 'settings.update'::text) AND (brand_section_id IN ( SELECT bs.id
   FROM brand_sections bs
  WHERE (has_role(auth.uid(), 'root_admin'::app_role) OR (bs.brand_id IN ( SELECT b.id
           FROM brands b
          WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (bs.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))))));
CREATE POLICY "Anyone can read enabled brand sections" ON public.brand_sections AS PERMISSIVE FOR SELECT TO public USING ((is_enabled = true));
CREATE POLICY "Manage brand sections" ON public.brand_sections AS PERMISSIVE FOR ALL TO authenticated USING ((user_has_permission(auth.uid(), 'settings.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY "Brand admins can read own sub perm config" ON public.brand_sub_permission_config AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Root admins can manage sub perm config" ON public.brand_sub_permission_config AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Delete brands" ON public.brands AS PERMISSIVE FOR DELETE TO authenticated USING ((user_has_permission(auth.uid(), 'brands.delete'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))));
CREATE POLICY "Insert brands" ON public.brands AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_has_permission(auth.uid(), 'brands.create'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))));
CREATE POLICY "Select brands" ON public.brands AS PERMISSIVE FOR SELECT TO authenticated USING ((user_has_permission(auth.uid(), 'brands.read'::text) OR (tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)) OR (id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Update brands" ON public.brands AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_has_permission(auth.uid(), 'brands.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)) OR (id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))));
CREATE POLICY bmm_root_admin_all ON public.business_model_modules AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY bmm_select_authenticated ON public.business_model_modules AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY business_models_root_admin_all ON public.business_models AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY business_models_select_authenticated ON public.business_models AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY artilharia_window_prizes_admin_write ON public.campeonato_artilharia_window_prizes AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_artilharia_window_prizes.season_id) AND campeonato_admin_can_manage(s.brand_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_artilharia_window_prizes.season_id) AND campeonato_admin_can_manage(s.brand_id)))));
CREATE POLICY artilharia_window_prizes_select ON public.campeonato_artilharia_window_prizes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_artilharia_window_prizes.season_id) AND (campeonato_admin_can_manage(s.brand_id) OR (EXISTS ( SELECT 1
           FROM customers c
          WHERE ((c.user_id = auth.uid()) AND (c.brand_id = s.brand_id) AND (c.branch_id = s.branch_id)))))))));
CREATE POLICY duelo_attempts_log_branch_admin_select ON public.campeonato_attempts_log AS PERMISSIVE FOR SELECT TO authenticated USING (((branch_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'branch_admin'::app_role) AND (ur.branch_id = campeonato_attempts_log.branch_id))))));
CREATE POLICY duelo_attempts_log_brand_admin_select ON public.campeonato_attempts_log AS PERMISSIVE FOR SELECT TO authenticated USING (((brand_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'brand_admin'::app_role) AND (ur.brand_id = campeonato_attempts_log.brand_id))))));
CREATE POLICY duelo_attempts_log_root_all ON public.campeonato_attempts_log AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY duelo_brackets_admin_write ON public.campeonato_brackets AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_brackets.season_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR ((s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_brackets.season_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR ((s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role)))))));
CREATE POLICY duelo_brackets_select_scope ON public.campeonato_brackets AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_brackets.season_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))))));
CREATE POLICY duelo_champions_admin_write ON public.campeonato_champions AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role)))) WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))));
CREATE POLICY duelo_champions_select_scope ON public.campeonato_champions AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY duelo_audit_root_write ON public.campeonato_classificacao_auditoria AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY duelo_audit_select_scope ON public.campeonato_classificacao_auditoria AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY duelo_driver_tier_history_brand_admin_all ON public.campeonato_driver_tier_history AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY duelo_driver_tier_history_root_all ON public.campeonato_driver_tier_history AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY duelo_match_events_admin_write ON public.campeonato_match_events AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM (campeonato_brackets b
     JOIN campeonato_seasons s ON ((s.id = b.season_id)))
  WHERE ((b.id = campeonato_match_events.bracket_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR ((s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (campeonato_brackets b
     JOIN campeonato_seasons s ON ((s.id = b.season_id)))
  WHERE ((b.id = campeonato_match_events.bracket_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR ((s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role)))))));
CREATE POLICY duelo_match_events_select_scope ON public.campeonato_match_events AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (campeonato_brackets b
     JOIN campeonato_seasons s ON ((s.id = b.season_id)))
  WHERE ((b.id = campeonato_match_events.bracket_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))))));
CREATE POLICY duelo_notif_admin_read ON public.campeonato_notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role))));
CREATE POLICY duelo_notif_service_all ON public.campeonato_notifications AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY duelo_prize_dist_select_admin ON public.campeonato_prize_distributions AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))));
CREATE POLICY dse_admin_delete ON public.campeonato_season_enrollments AS PERMISSIVE FOR DELETE TO authenticated USING (campeonato_admin_can_manage(brand_id));
CREATE POLICY dse_admin_insert ON public.campeonato_season_enrollments AS PERMISSIVE FOR INSERT TO public WITH CHECK (campeonato_admin_can_manage(brand_id));
CREATE POLICY dse_admin_select ON public.campeonato_season_enrollments AS PERMISSIVE FOR SELECT TO public USING (campeonato_admin_can_manage(brand_id));
CREATE POLICY dse_admin_update ON public.campeonato_season_enrollments AS PERMISSIVE FOR UPDATE TO authenticated USING (campeonato_admin_can_manage(brand_id)) WITH CHECK (campeonato_admin_can_manage(brand_id));
CREATE POLICY phase_config_admin_write ON public.campeonato_season_phase_config AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_phase_config.season_id) AND campeonato_admin_can_manage(s.brand_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_phase_config.season_id) AND campeonato_admin_can_manage(s.brand_id)))));
CREATE POLICY phase_config_select ON public.campeonato_season_phase_config AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_phase_config.season_id) AND (campeonato_admin_can_manage(s.brand_id) OR (EXISTS ( SELECT 1
           FROM customers c
          WHERE ((c.user_id = auth.uid()) AND (c.brand_id = s.brand_id) AND (c.branch_id = s.branch_id)))))))));
CREATE POLICY season_prizes_admin_write ON public.campeonato_season_prizes AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_prizes.season_id) AND campeonato_admin_can_manage(s.brand_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_prizes.season_id) AND campeonato_admin_can_manage(s.brand_id)))));
CREATE POLICY season_prizes_select ON public.campeonato_season_prizes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_prizes.season_id) AND (campeonato_admin_can_manage(s.brand_id) OR (EXISTS ( SELECT 1
           FROM customers c
          WHERE ((c.user_id = auth.uid()) AND (c.brand_id = s.brand_id) AND (c.branch_id = s.branch_id)))))))));
CREATE POLICY duelo_standings_admin_write ON public.campeonato_season_standings AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_standings.season_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR ((s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_standings.season_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR ((s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)) OR ((s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role)))))));
CREATE POLICY duelo_standings_select_scope ON public.campeonato_season_standings AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM campeonato_seasons s
  WHERE ((s.id = campeonato_season_standings.season_id) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (s.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (s.branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))))));
CREATE POLICY duelo_season_tiers_branch_admin_select ON public.campeonato_season_tiers AS PERMISSIVE FOR SELECT TO authenticated USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY duelo_season_tiers_brand_admin_all ON public.campeonato_season_tiers AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY duelo_season_tiers_root_all ON public.campeonato_season_tiers AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY duelo_seasons_branch_admin ON public.campeonato_seasons AS PERMISSIVE FOR ALL TO authenticated USING (((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))) WITH CHECK (((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role)));
CREATE POLICY duelo_seasons_brand_admin ON public.campeonato_seasons AS PERMISSIVE FOR ALL TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role))) WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY duelo_seasons_root_all ON public.campeonato_seasons AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY duelo_seasons_select_scope ON public.campeonato_seasons AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY duelo_tier_memberships_branch_admin_select ON public.campeonato_tier_memberships AS PERMISSIVE FOR SELECT TO authenticated USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY duelo_tier_memberships_brand_admin_all ON public.campeonato_tier_memberships AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY duelo_tier_memberships_root_all ON public.campeonato_tier_memberships AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Admin read cart orders" ON public.catalog_cart_orders AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Admin update cart orders" ON public.catalog_cart_orders AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Anyone authenticated can insert cart orders" ON public.catalog_cart_orders AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Customers read own cart orders" ON public.catalog_cart_orders AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Store owners read own store cart orders" ON public.catalog_cart_orders AS PERMISSIVE FOR SELECT TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Store owners update own store cart orders" ON public.catalog_cart_orders AS PERMISSIVE FOR UPDATE TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Anyone can view belt champions" ON public.city_belt_champions AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cbmo_branch_admin_manage ON public.city_business_model_overrides AS PERMISSIVE FOR ALL TO authenticated USING (((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role))) WITH CHECK (((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND has_role(auth.uid(), 'branch_admin'::app_role)));
CREATE POLICY cbmo_brand_admin_manage ON public.city_business_model_overrides AS PERMISSIVE FOR ALL TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role))) WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) AND has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY cbmo_root_admin_all ON public.city_business_model_overrides AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY cbmo_select_scope ON public.city_business_model_overrides AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Anyone can view feed" ON public.city_feed_events AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can insert feed events" ON public.city_feed_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY cmo_delete_admins ON public.city_module_overrides AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY cmo_insert_admins ON public.city_module_overrides AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY cmo_select_admins ON public.city_module_overrides AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY cmo_update_admins ON public.city_module_overrides AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Root admins podem criar notas de leads" ON public.commercial_lead_notes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admins podem deletar notas de leads" ON public.commercial_lead_notes AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admins podem editar notas de leads" ON public.commercial_lead_notes AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admins podem ver notas de leads" ON public.commercial_lead_notes AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Public can submit commercial leads" ON public.commercial_leads AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Root admins can delete commercial leads" ON public.commercial_leads AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admins can update commercial leads" ON public.commercial_leads AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admins can view commercial leads" ON public.commercial_leads AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Admin read coupons" ON public.coupons AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Brand admins manage coupons" ON public.coupons AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))))) WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Store owners manage own coupons" ON public.coupons AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))) WITH CHECK ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Users can delete own cp_contacts" ON public.cp_contacts AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can insert own cp_contacts" ON public.cp_contacts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can read own cp_contacts" ON public.cp_contacts AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update own cp_contacts" ON public.cp_contacts AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can delete own cp_notes" ON public.cp_notes AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can insert own cp_notes" ON public.cp_notes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can read own cp_notes" ON public.cp_notes AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update own cp_notes" ON public.cp_notes AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can delete own cp_tasks" ON public.cp_tasks AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can insert own cp_tasks" ON public.cp_tasks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can read own cp_tasks" ON public.cp_tasks AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update own cp_tasks" ON public.cp_tasks AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Brand admins manage crm_audiences" ON public.crm_audiences AS PERMISSIVE FOR ALL TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages crm_audiences" ON public.crm_audiences AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Store owners read crm_audiences" ON public.crm_audiences AS PERMISSIVE FOR SELECT TO public USING ((brand_id IN ( SELECT s.brand_id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Brand admins read crm_campaign_logs" ON public.crm_campaign_logs AS PERMISSIVE FOR SELECT TO public USING ((campaign_id IN ( SELECT c.id
   FROM crm_campaigns c
  WHERE ((c.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (c.brand_id IN ( SELECT b.id
           FROM brands b
          WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))))));
CREATE POLICY "Root manages crm_campaign_logs" ON public.crm_campaign_logs AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Brand admins manage crm_campaigns" ON public.crm_campaigns AS PERMISSIVE FOR ALL TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages crm_campaigns" ON public.crm_campaigns AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Store owners manage own campaigns" ON public.crm_campaigns AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Brand admins manage crm_contacts" ON public.crm_contacts AS PERMISSIVE FOR ALL TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages crm_contacts" ON public.crm_contacts AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Store owners read crm_contacts" ON public.crm_contacts AS PERMISSIVE FOR SELECT TO public USING ((brand_id IN ( SELECT s.brand_id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Brand admins read crm_events" ON public.crm_events AS PERMISSIVE FOR SELECT TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages crm_events" ON public.crm_events AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone read crm_tiers" ON public.crm_tiers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Brand admins manage crm_tiers" ON public.crm_tiers AS PERMISSIVE FOR ALL TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages crm_tiers" ON public.crm_tiers AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can read published pages" ON public.custom_pages AS PERMISSIVE FOR SELECT TO public USING ((is_published = true));
CREATE POLICY "Brand admins manage custom pages" ON public.custom_pages AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Admins manage clicks" ON public.customer_click_events AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Customers can insert own clicks" ON public.customer_click_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))));
CREATE POLICY "Customers can read own clicks" ON public.customer_click_events AS PERMISSIVE FOR SELECT TO authenticated USING ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))));
CREATE POLICY "Admin read favorite stores" ON public.customer_favorite_stores AS PERMISSIVE FOR SELECT TO public USING (user_has_permission(auth.uid(), 'customers.read'::text));
CREATE POLICY "Delete own favorite stores" ON public.customer_favorite_stores AS PERMISSIVE FOR DELETE TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Insert own favorite stores" ON public.customer_favorite_stores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Select own favorite stores" ON public.customer_favorite_stores AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Admin read favorites" ON public.customer_favorites AS PERMISSIVE FOR SELECT TO public USING (user_has_permission(auth.uid(), 'customers.read'::text));
CREATE POLICY "Delete own favorites" ON public.customer_favorites AS PERMISSIVE FOR DELETE TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Insert own favorites" ON public.customer_favorites AS PERMISSIVE FOR INSERT TO public WITH CHECK ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Select own favorites" ON public.customer_favorites AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Delete own notifications" ON public.customer_notifications AS PERMISSIVE FOR DELETE TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Select own notifications" ON public.customer_notifications AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Update own notifications" ON public.customer_notifications AS PERMISSIVE FOR UPDATE TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Insert customers" ON public.customers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_has_permission(auth.uid(), 'customers.create'::text) OR (auth.uid() = user_id)));
CREATE POLICY "Select customers (admin)" ON public.customers AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'customers.read'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Select own customer" ON public.customers AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Store owner can read customers of own redemptions" ON public.customers AS PERMISSIVE FOR SELECT TO authenticated USING ((id IN ( SELECT get_customer_ids_for_store_owner(auth.uid()) AS get_customer_ids_for_store_owner)));
CREATE POLICY "Update customers" ON public.customers AS PERMISSIVE FOR UPDATE TO public USING (((user_has_permission(auth.uid(), 'customers.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))) OR (auth.uid() = user_id)));
CREATE POLICY "Anyone can view achievements" ON public.driver_achievements AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Conquistas visíveis publicamente" ON public.driver_achievements AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Sistema concede conquistas" ON public.driver_achievements AS PERMISSIVE FOR INSERT TO public WITH CHECK (false);
CREATE POLICY "Admins can read duel audit logs" ON public.driver_duel_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR has_role(auth.uid(), 'brand_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role)));
CREATE POLICY "Authenticated users can insert own guess" ON public.driver_duel_guesses AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))));
CREATE POLICY "Authenticated users can view guesses" ON public.driver_duel_guesses AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read duel participants" ON public.driver_duel_participants AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Participants can rate finished duels" ON public.driver_duel_ratings AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM ((driver_duels d
     JOIN driver_duel_participants p1 ON ((p1.id = d.challenger_id)))
     JOIN driver_duel_participants p2 ON ((p2.id = d.challenged_id)))
  WHERE ((d.id = driver_duel_ratings.duel_id) AND (d.status = 'finished'::text) AND ((driver_duel_ratings.rater_customer_id = p1.customer_id) OR (driver_duel_ratings.rater_customer_id = p2.customer_id)) AND ((driver_duel_ratings.rated_customer_id = p1.customer_id) OR (driver_duel_ratings.rated_customer_id = p2.customer_id)) AND (driver_duel_ratings.rater_customer_id <> driver_duel_ratings.rated_customer_id)))));
CREATE POLICY "Ratings are publicly readable" ON public.driver_duel_ratings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read duels" ON public.driver_duels AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Branch admins manage own city import jobs" ON public.driver_import_jobs AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_import_jobs.brand_id) AND (ur.branch_id = driver_import_jobs.branch_id) AND (ur.role = 'branch_admin'::app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_import_jobs.brand_id) AND (ur.branch_id = driver_import_jobs.branch_id) AND (ur.role = 'branch_admin'::app_role)))));
CREATE POLICY "Brand admins manage import jobs" ON public.driver_import_jobs AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_import_jobs.brand_id) AND (ur.role = ANY (ARRAY['brand_admin'::app_role, 'root_admin'::app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_import_jobs.brand_id) AND (ur.role = ANY (ARRAY['brand_admin'::app_role, 'root_admin'::app_role]))))));
CREATE POLICY "Brand admins can manage flows" ON public.driver_message_flows AS PERMISSIVE FOR ALL TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Brand admins can view logs" ON public.driver_message_logs AS PERMISSIVE FOR SELECT TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Service role can insert logs" ON public.driver_message_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Brand admins can manage templates" ON public.driver_message_templates AS PERMISSIVE FOR ALL TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Admins delete orders" ON public.driver_points_orders AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Admins update orders" ON public.driver_points_orders AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Customers insert own orders" ON public.driver_points_orders AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))));
CREATE POLICY "Customers read own orders" ON public.driver_points_orders AS PERMISSIVE FOR SELECT TO authenticated USING (((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))) OR has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Authenticated users can manage" ON public.driver_points_purchase_config AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON public.driver_points_purchase_config AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert driver_points_rules" ON public.driver_points_rules AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can read driver_points_rules" ON public.driver_points_rules AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update driver_points_rules" ON public.driver_points_rules AS PERMISSIVE FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Branch admins can manage own city driver_profiles" ON public.driver_profiles AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_profiles.brand_id) AND (ur.branch_id = driver_profiles.branch_id) AND (ur.role = 'branch_admin'::app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_profiles.brand_id) AND (ur.branch_id = driver_profiles.branch_id) AND (ur.role = 'branch_admin'::app_role)))));
CREATE POLICY "Brand admins can manage driver_profiles" ON public.driver_profiles AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_profiles.brand_id) AND (ur.role = ANY (ARRAY['brand_admin'::app_role, 'root_admin'::app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.brand_id = driver_profiles.brand_id) AND (ur.role = ANY (ARRAY['brand_admin'::app_role, 'root_admin'::app_role]))))));
CREATE POLICY "Anyone can insert verification codes" ON public.driver_verification_codes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read verification codes" ON public.driver_verification_codes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update verification codes" ON public.driver_verification_codes AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Branch admins read own branch reset history" ON public.duel_cycle_reset_history AS PERMISSIVE FOR SELECT TO public USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY "Brand admins read own reset history" ON public.duel_cycle_reset_history AS PERMISSIVE FOR SELECT TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Root reads reset history" ON public.duel_cycle_reset_history AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can view active prize campaigns" ON public.duel_prize_campaigns AS PERMISSIVE FOR SELECT TO public USING (((status = 'active'::text) AND ((now() >= starts_at) AND (now() <= ends_at))));
CREATE POLICY "Branch admins manage own branch prize campaigns" ON public.duel_prize_campaigns AS PERMISSIVE FOR ALL TO public USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))) WITH CHECK ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY "Brand admins manage own prize campaigns" ON public.duel_prize_campaigns AS PERMISSIVE FOR ALL TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Root manages prize campaigns" ON public.duel_prize_campaigns AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can view side bets" ON public.duel_side_bets AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Insert earning_events" ON public.earning_events AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Root manages earning_events" ON public.earning_events AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Select earning_events (admin)" ON public.earning_events AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Select own earning_events" ON public.earning_events AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Anon can insert error logs" ON public.error_logs AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can insert error logs" ON public.error_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Root admins can read error logs" ON public.error_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Manage feature flags" ON public.feature_flags AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Select feature flags" ON public.feature_flags AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'settings.read'::text) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Anyone can view seasons" ON public.gamification_seasons AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Brand admins insert billing events" ON public.ganha_ganha_billing_events AS PERMISSIVE FOR INSERT TO public WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Brand admins read own billing events" ON public.ganha_ganha_billing_events AS PERMISSIVE FOR SELECT TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages ganha_ganha_billing_events" ON public.ganha_ganha_billing_events AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Store owners read own billing events" ON public.ganha_ganha_billing_events AS PERMISSIVE FOR SELECT TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Brand admins manage own ganha_ganha_config" ON public.ganha_ganha_config AS PERMISSIVE FOR ALL TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages ganha_ganha_config" ON public.ganha_ganha_config AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Brand admins manage own ganha_ganha_store_fees" ON public.ganha_ganha_store_fees AS PERMISSIVE FOR ALL TO public USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Root manages ganha_ganha_store_fees" ON public.ganha_ganha_store_fees AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root manages apply jobs" ON public.home_template_apply_jobs AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone authenticated can read templates" ON public.home_template_library AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Root manages home templates" ON public.home_template_library AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can read active icons" ON public.icon_library AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Brand admins manage icons" ON public.icon_library AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Brand/Branch admins manage own import jobs" ON public.import_jobs AS PERMISSIVE FOR ALL TO public USING ((user_has_permission(auth.uid(), 'stores.create'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Root manages import jobs" ON public.import_jobs AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Users can manage their brand integrations" ON public.machine_integrations AS PERMISSIVE FOR ALL TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Users can view their brand integrations" ON public.machine_integrations AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY brand_users_read ON public.machine_ride_events AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY service_role_full_access ON public.machine_ride_events AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Brand members can read notifications" ON public.machine_ride_notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Brand members can update notifications" ON public.machine_ride_notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Service role can insert notifications" ON public.machine_ride_notifications AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Brand members can update rides" ON public.machine_rides AS PERMISSIVE FOR UPDATE TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Users can view their brand rides" ON public.machine_rides AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Anyone can read menu labels" ON public.menu_labels AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Brand admins manage menu labels" ON public.menu_labels AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY authenticated_read_source_catalog ON public.mirror_source_catalog AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY root_admin_manage_source_catalog ON public.mirror_source_catalog AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY brand_admin_manage_sync_config ON public.mirror_sync_config AS PERMISSIVE FOR ALL TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role))) WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY brand_admin_read_sync_logs ON public.mirror_sync_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY root_admin_all_sync_logs ON public.mirror_sync_logs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY service_role_sync_logs ON public.mirror_sync_logs AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone authenticated can read module_definitions" ON public.module_definitions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Root manages module_definitions" ON public.module_definitions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY root_admin_all_template_items ON public.module_template_items AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY root_admin_all_templates ON public.module_templates AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Admins can update reports" ON public.offer_reports AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY "Admins can view reports" ON public.offer_reports AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY "Anyone can report offers" ON public.offer_reports AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can view own reports" ON public.offer_reports AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage sync groups" ON public.offer_sync_groups AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR has_role(auth.uid(), 'brand_admin'::app_role))) WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY "Anon read active offers" ON public.offers AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (status = 'ACTIVE'::offer_status)));
CREATE POLICY "Delete offers" ON public.offers AS PERMISSIVE FOR DELETE TO public USING ((user_has_permission(auth.uid(), 'offers.delete'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Insert offers" ON public.offers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_has_permission(auth.uid(), 'offers.create'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Select offers" ON public.offers AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'offers.read'::text) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Store owners manage own offers" ON public.offers AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))) WITH CHECK ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Update offers" ON public.offers AS PERMISSIVE FOR UPDATE TO public USING ((user_has_permission(auth.uid(), 'offers.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Brand admins can manage their partner landing config" ON public.partner_landing_config AS PERMISSIVE FOR ALL TO authenticated USING (((has_role(auth.uid(), 'brand_admin'::app_role) AND (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) OR has_role(auth.uid(), 'root_admin'::app_role))) WITH CHECK (((has_role(auth.uid(), 'brand_admin'::app_role) AND (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Public can read active partner landing config" ON public.partner_landing_config AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((is_active = true));
CREATE POLICY "Authenticated users can read permission_groups" ON public.permission_groups AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Root admins can manage permission_groups" ON public.permission_groups AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Authenticated can read sub items" ON public.permission_sub_items AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Root admins can manage sub items" ON public.permission_sub_items AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Authenticated users can read permission_subgroups" ON public.permission_subgroups AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Root admins can manage permission_subgroups" ON public.permission_subgroups AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone authenticated can read permissions" ON public.permissions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage permissions table" ON public.permissions AS PERMISSIVE FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'::text));
CREATE POLICY pbm_root_admin_all ON public.plan_business_models AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY pbm_select_authenticated ON public.plan_business_models AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY pggp_root_admin_all ON public.plan_ganha_ganha_pricing AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY pggp_select_authenticated ON public.plan_ganha_ganha_pricing AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read plan_module_templates" ON public.plan_module_templates AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Root admin can delete plan_module_templates" ON public.plan_module_templates AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admin can insert plan_module_templates" ON public.plan_module_templates AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admin can update plan_module_templates" ON public.plan_module_templates AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Authenticated read platform_config" ON public.platform_config AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Root manages platform_config" ON public.platform_config AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Customer insert debit on redemption" ON public.points_ledger AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((entry_type = 'DEBIT'::ledger_entry_type) AND (reference_type = 'REDEMPTION'::ledger_reference_type) AND (customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid())))));
CREATE POLICY "Insert points_ledger" ON public.points_ledger AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Root manages points_ledger" ON public.points_ledger AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Select own points_ledger" ON public.points_ledger AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Select points_ledger (admin)" ON public.points_ledger AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Select points_ledger (brand admin broad)" ON public.points_ledger AS PERMISSIVE FOR SELECT TO authenticated USING (((user_has_permission(auth.uid(), 'earn_points'::text) OR user_has_permission(auth.uid(), 'reports.view'::text) OR has_role(auth.uid(), 'root_admin'::app_role) OR has_role(auth.uid(), 'brand_admin'::app_role)) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "branch_admin create orders" ON public.points_package_orders AS PERMISSIVE FOR INSERT TO public WITH CHECK (((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) AND (status = 'PENDING'::text)));
CREATE POLICY "branch_admin read own orders" ON public.points_package_orders AS PERMISSIVE FOR SELECT TO public USING ((branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)));
CREATE POLICY "brand_admin manage orders" ON public.points_package_orders AS PERMISSIVE FOR ALL TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "root_admin full access on orders" ON public.points_package_orders AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "branch_admin read active packages" ON public.points_packages AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "brand_admin manage own packages" ON public.points_packages AS PERMISSIVE FOR ALL TO public USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))) WITH CHECK ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "root_admin full access on points_packages" ON public.points_packages AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Brand/branch admins manage own points_rules" ON public.points_rules AS PERMISSIVE FOR ALL TO public USING ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Root manages points_rules" ON public.points_rules AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Select points_rules for earners" ON public.points_rules AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Brand admins can update brand redemption orders" ON public.product_redemption_orders AS PERMISSIVE FOR UPDATE TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Brand admins can view brand redemption orders" ON public.product_redemption_orders AS PERMISSIVE FOR SELECT TO authenticated USING ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)));
CREATE POLICY "Customers can insert own redemption orders" ON public.product_redemption_orders AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((customer_id IN ( SELECT get_own_customer_ids(auth.uid()) AS get_own_customer_ids)));
CREATE POLICY "Customers can view own redemption orders" ON public.product_redemption_orders AS PERMISSIVE FOR SELECT TO authenticated USING ((customer_id IN ( SELECT get_own_customer_ids(auth.uid()) AS get_own_customer_ids)));
CREATE POLICY "Insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));
CREATE POLICY "Select all profiles (admin)" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (user_has_permission(auth.uid(), 'users.read'::text));
CREATE POLICY "Select own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Update any profile (admin)" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (user_has_permission(auth.uid(), 'users.update'::text));
CREATE POLICY "Update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Delete own push subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR DELETE TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Insert own push subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Select own push subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR SELECT TO public USING ((customer_id IN ( SELECT c.id
   FROM customers c
  WHERE (c.user_id = auth.uid()))));
CREATE POLICY "Service role full access on rate_limit_entries" ON public.rate_limit_entries AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Insert redemptions" ON public.redemptions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_has_permission(auth.uid(), 'redemptions.create'::text) OR (customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid())))));
CREATE POLICY "Select own redemptions" ON public.redemptions AS PERMISSIVE FOR SELECT TO authenticated USING ((customer_id IN ( SELECT get_own_customer_ids(auth.uid()) AS get_own_customer_ids)));
CREATE POLICY "Select redemptions (admin)" ON public.redemptions AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'redemptions.read'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Store owner can read own store redemptions" ON public.redemptions AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (offers o
     JOIN stores s ON ((s.id = o.store_id)))
  WHERE ((o.id = redemptions.offer_id) AND (s.owner_user_id = auth.uid())))));
CREATE POLICY "Update redemptions" ON public.redemptions AS PERMISSIVE FOR UPDATE TO public USING ((user_has_permission(auth.uid(), 'redemptions.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Authenticated can read releases" ON public.releases AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Root manages releases" ON public.releases AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone authenticated can read role_permissions" ON public.role_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage role_permissions" ON public.role_permissions AS PERMISSIVE FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'::text));
CREATE POLICY "Anyone authenticated can read roles" ON public.roles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage roles table" ON public.roles AS PERMISSIVE FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'::text));
CREATE POLICY "Anyone can read active templates" ON public.section_templates AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Manage templates" ON public.section_templates AS PERMISSIVE FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'settings.update'::text));
CREATE POLICY "Authenticated can insert synonym logs" ON public.segment_synonym_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Root admins manage synonym logs" ON public.segment_synonym_logs AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Authenticated users can read sponsored placements" ON public.sponsored_placements AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Brand admins manage sponsored placements" ON public.sponsored_placements AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))) WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Anyone can read active catalog categories" ON public.store_catalog_categories AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Brand/branch admins manage catalog categories" ON public.store_catalog_categories AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Store owners manage own catalog categories" ON public.store_catalog_categories AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))) WITH CHECK ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Admin manages catalog" ON public.store_catalog_items AS PERMISSIVE FOR ALL TO public USING (user_has_permission(auth.uid(), 'stores.update'::text));
CREATE POLICY "Owner manages catalog" ON public.store_catalog_items AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Public reads active catalog" ON public.store_catalog_items AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (store_id IN ( SELECT s.id
   FROM stores s
  WHERE ((s.approval_status = 'APPROVED'::store_approval_status) AND (s.is_active = true))))));
CREATE POLICY "Store owners manage own catalog items" ON public.store_catalog_items AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))) WITH CHECK ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Admin reads store documents" ON public.store_documents AS PERMISSIVE FOR SELECT TO public USING (user_has_permission(auth.uid(), 'stores.read'::text));
CREATE POLICY "Owner manages store documents" ON public.store_documents AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Admin read employees" ON public.store_employees AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Store owners manage employees" ON public.store_employees AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))) WITH CHECK ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Insert store_points_rules" ON public.store_points_rules AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() IS NOT NULL) AND (created_by_user_id = auth.uid())));
CREATE POLICY "Root manages store_points_rules" ON public.store_points_rules AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Select own store_points_rules" ON public.store_points_rules AS PERMISSIVE FOR SELECT TO public USING ((created_by_user_id = auth.uid()));
CREATE POLICY "Select store_points_rules (admin)" ON public.store_points_rules AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Update store_points_rules (admin)" ON public.store_points_rules AS PERMISSIVE FOR UPDATE TO public USING ((user_has_permission(auth.uid(), 'earn_points'::text) AND ((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Admin read store products" ON public.store_products AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids))));
CREATE POLICY "Anon read active store products" ON public.store_products AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Delete store products" ON public.store_products AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) OR (store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))));
CREATE POLICY "Insert store products" ON public.store_products AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) OR (store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))));
CREATE POLICY "Update store products" ON public.store_products AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) OR (store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))));
CREATE POLICY "Anyone can read approved reviews" ON public.store_reviews AS PERMISSIVE FOR SELECT TO authenticated USING ((is_approved = true));
CREATE POLICY "Customers can insert own reviews" ON public.store_reviews AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))));
CREATE POLICY "Customers can update own reviews" ON public.store_reviews AS PERMISSIVE FOR UPDATE TO authenticated USING ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.user_id = auth.uid()))));
CREATE POLICY "Brand admins manage brand requests" ON public.store_type_requests AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (brand_id IN ( SELECT b.id
   FROM brands b
  WHERE (b.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))))));
CREATE POLICY "Store owners manage own requests" ON public.store_type_requests AS PERMISSIVE FOR ALL TO public USING ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid())))) WITH CHECK ((store_id IN ( SELECT s.id
   FROM stores s
  WHERE (s.owner_user_id = auth.uid()))));
CREATE POLICY "Delete stores" ON public.stores AS PERMISSIVE FOR DELETE TO public USING ((user_has_permission(auth.uid(), 'stores.delete'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Insert stores" ON public.stores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_has_permission(auth.uid(), 'stores.create'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Owner manages own store" ON public.stores AS PERMISSIVE FOR ALL TO public USING ((owner_user_id = auth.uid()));
CREATE POLICY "Select stores" ON public.stores AS PERMISSIVE FOR SELECT TO public USING ((user_has_permission(auth.uid(), 'stores.read'::text) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids))));
CREATE POLICY "Self-register store" ON public.stores AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() IS NOT NULL) AND (owner_user_id = auth.uid())));
CREATE POLICY "Update stores" ON public.stores AS PERMISSIVE FOR UPDATE TO public USING ((user_has_permission(auth.uid(), 'stores.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Root admin can insert plans" ON public.subscription_plans AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Root admin can update plans" ON public.subscription_plans AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can read active taxonomy_categories" ON public.taxonomy_categories AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Root admins manage taxonomy_categories" ON public.taxonomy_categories AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Anyone can read active taxonomy_segments" ON public.taxonomy_segments AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Root admins manage taxonomy_segments" ON public.taxonomy_segments AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'root_admin'::app_role));
CREATE POLICY "Delete tenants" ON public.tenants AS PERMISSIVE FOR DELETE TO authenticated USING (user_has_permission(auth.uid(), 'tenants.delete'::text));
CREATE POLICY "Insert tenants" ON public.tenants AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_has_permission(auth.uid(), 'tenants.create'::text));
CREATE POLICY "Select tenants" ON public.tenants AS PERMISSIVE FOR SELECT TO authenticated USING ((user_has_permission(auth.uid(), 'tenants.read'::text) OR (id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids))));
CREATE POLICY "Update tenants" ON public.tenants AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_has_permission(auth.uid(), 'tenants.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))));
CREATE POLICY "Brand admins can manage tier_points_rules" ON public.tier_points_rules AS PERMISSIVE FOR ALL TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role))) WITH CHECK (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Users can view tier_points_rules for their brand" ON public.tier_points_rules AS PERMISSIVE FOR SELECT TO authenticated USING (((brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)) OR has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Manage overrides" ON public.user_permission_overrides AS PERMISSIVE FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'::text));
CREATE POLICY "Users can view own overrides" ON public.user_permission_overrides AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY brand_admin_manage_overrides ON public.user_permission_overrides AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles caller
  WHERE ((caller.user_id = auth.uid()) AND (caller.role = 'brand_admin'::app_role) AND (caller.brand_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM user_roles target
          WHERE ((target.user_id = user_permission_overrides.user_id) AND (target.brand_id = caller.brand_id)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles caller
  WHERE ((caller.user_id = auth.uid()) AND (caller.role = 'brand_admin'::app_role) AND (caller.brand_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM user_roles target
          WHERE ((target.user_id = user_permission_overrides.user_id) AND (target.brand_id = caller.brand_id))))))));
CREATE POLICY "Delete roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (user_has_permission(auth.uid(), 'roles.revoke'::text));
CREATE POLICY "Insert roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_has_permission(auth.uid(), 'roles.assign'::text));
CREATE POLICY "Select all roles (admin)" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (user_has_permission(auth.uid(), 'roles.read'::text));
CREATE POLICY "Select own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Update roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'::text));
CREATE POLICY "Delete redemptions" ON public.voucher_redemptions AS PERMISSIVE FOR DELETE TO authenticated USING (user_has_permission(auth.uid(), 'vouchers.update'::text));
CREATE POLICY "Insert redemptions" ON public.voucher_redemptions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_has_permission(auth.uid(), 'vouchers.redeem'::text) AND (voucher_id IN ( SELECT vouchers.id
   FROM vouchers))));
CREATE POLICY "Select redemptions" ON public.voucher_redemptions AS PERMISSIVE FOR SELECT TO authenticated USING ((user_has_permission(auth.uid(), 'vouchers.read'::text) AND (voucher_id IN ( SELECT vouchers.id
   FROM vouchers))));
CREATE POLICY "Anon read active public vouchers" ON public.vouchers AS PERMISSIVE FOR SELECT TO anon USING (((status = 'active'::voucher_status) AND (customer_email IS NULL) AND (customer_phone IS NULL) AND (customer_name IS NULL)));
CREATE POLICY "Delete vouchers" ON public.vouchers AS PERMISSIVE FOR DELETE TO authenticated USING ((user_has_permission(auth.uid(), 'vouchers.delete'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (branch_id IN ( SELECT b.id
   FROM (branches b
     JOIN brands br ON ((b.brand_id = br.id)))
  WHERE (br.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT b.id
   FROM branches b
  WHERE (b.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Insert vouchers" ON public.vouchers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_has_permission(auth.uid(), 'vouchers.create'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (branch_id IN ( SELECT b.id
   FROM (branches b
     JOIN brands br ON ((b.brand_id = br.id)))
  WHERE (br.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT b.id
   FROM branches b
  WHERE (b.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Select vouchers" ON public.vouchers AS PERMISSIVE FOR SELECT TO authenticated USING ((user_has_permission(auth.uid(), 'vouchers.read'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (branch_id IN ( SELECT b.id
   FROM (branches b
     JOIN brands br ON ((b.brand_id = br.id)))
  WHERE (br.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT b.id
   FROM branches b
  WHERE (b.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Update vouchers" ON public.vouchers AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_has_permission(auth.uid(), 'vouchers.update'::text) AND (has_role(auth.uid(), 'root_admin'::app_role) OR (branch_id IN ( SELECT b.id
   FROM (branches b
     JOIN brands br ON ((b.brand_id = br.id)))
  WHERE (br.tenant_id IN ( SELECT get_user_tenant_ids(auth.uid()) AS get_user_tenant_ids)))) OR (branch_id IN ( SELECT b.id
   FROM branches b
  WHERE (b.brand_id IN ( SELECT get_user_brand_ids(auth.uid()) AS get_user_brand_ids)))) OR (branch_id IN ( SELECT get_user_branch_ids(auth.uid()) AS get_user_branch_ids)))));
CREATE POLICY "Anyone can upload brand logos" ON storage.objects AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (((bucket_id = 'brand-assets'::text) AND ((storage.foldername(name))[1] = 'brand-logos'::text)));
CREATE POLICY "Authenticated can delete driver avatars" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING ((bucket_id = 'driver-avatars'::text));
CREATE POLICY "Authenticated can update driver avatars" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING ((bucket_id = 'driver-avatars'::text));
CREATE POLICY "Authenticated can upload driver avatars" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'driver-avatars'::text));
CREATE POLICY "Authenticated users can delete brand assets" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING ((bucket_id = 'brand-assets'::text));
CREATE POLICY "Authenticated users can update brand assets" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING ((bucket_id = 'brand-assets'::text));
CREATE POLICY "Authenticated users can upload brand assets" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'brand-assets'::text));
CREATE POLICY "Authenticated users can upload import files" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'import-files'::text) AND (auth.uid() IS NOT NULL)));
CREATE POLICY "Brand admins can delete brand assets" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY "Brand admins can update brand assets" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY "Brand admins can upload brand assets" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'brand_admin'::app_role)));
CREATE POLICY "Brand assets are publicly accessible" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'brand-assets'::text));
CREATE POLICY "Driver avatars are publicly accessible" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'driver-avatars'::text));
CREATE POLICY "Root admins can delete brand assets" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Root admins can update brand assets" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Root admins can upload brand assets" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'root_admin'::app_role)));
CREATE POLICY "Tenant admins can delete brand assets" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'tenant_admin'::app_role)));
CREATE POLICY "Tenant admins can update brand assets" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'tenant_admin'::app_role)));
CREATE POLICY "Tenant admins can upload brand assets" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'brand-assets'::text) AND has_role(auth.uid(), 'tenant_admin'::app_role)));
CREATE POLICY "Users can read own import files" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (((bucket_id = 'import-files'::text) AND (auth.uid() IS NOT NULL)));
CREATE POLICY "Usuarios autenticados atualizam seus proprios exports motorista" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'exportacoes-motoristas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "Usuarios autenticados deletam seus proprios exports motoristas" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'exportacoes-motoristas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "Usuarios autenticados gravam seus proprios exports motoristas" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'exportacoes-motoristas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "Usuarios autenticados leem seus proprios exports motoristas" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'exportacoes-motoristas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "Usuarios podem deletar suas planilhas de importacao" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'importacoes-motoristas'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuarios podem inserir suas planilhas de importacao" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'importacoes-motoristas'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuarios podem ler suas planilhas de importacao" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'importacoes-motoristas'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY avatars_insert_own ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND (name ~~ (('motoristas/'::text || ( SELECT (customers.id)::text AS id
   FROM customers
  WHERE (customers.user_id = auth.uid())
 LIMIT 1)) || '/%'::text))));
CREATE POLICY avatars_select_public ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'avatars'::text));
CREATE POLICY avatars_update_own ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND (name ~~ (('motoristas/'::text || ( SELECT (customers.id)::text AS id
   FROM customers
  WHERE (customers.user_id = auth.uid())
 LIMIT 1)) || '/%'::text))));


-- =====================================================================
-- FUNCOES DO BANCO (corpo completo)
-- =====================================================================

CREATE OR REPLACE FUNCTION public._campeonato_check_tier_capacity(p_tier_id uuid, p_new_target integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (
    SELECT COUNT(*) FROM public.campeonato_season_enrollments
     WHERE tier_id = p_tier_id AND status = 'approved'
  ) <= p_new_target;
$function$
;

CREATE OR REPLACE FUNCTION public._campeonato_guard_tier_target_size()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.target_size IS DISTINCT FROM OLD.target_size THEN
    IF NOT public._campeonato_check_tier_capacity(NEW.id, NEW.target_size) THEN
      RAISE EXCEPTION 'Não é possível reduzir vagas abaixo do número de motoristas já aprovados.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public._campeonato_log_attempt(p_season_id uuid, p_brand_id uuid, p_branch_id uuid, p_actor uuid, p_outcome text, p_reason text, p_code text, p_eligible_count integer, p_required_count integer, p_divergent_count integer, p_divergent_sample jsonb, p_details jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.campeonato_classificacao_auditoria (
    season_id, brand_id, branch_id, attempted_by,
    outcome, block_reason, block_code,
    eligible_count, required_count, divergent_count, divergent_sample,
    details_json
  ) VALUES (
    p_season_id, p_brand_id, p_branch_id, p_actor,
    p_outcome, p_reason, p_code,
    p_eligible_count, p_required_count, p_divergent_count, p_divergent_sample,
    COALESCE(p_details, '{}'::jsonb)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.accept_side_bet(p_bet_id uuid, p_customer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_balance_b numeric;
  v_balance_a numeric;
  v_opposite_winner uuid;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
BEGIN
  SELECT * INTO v_bet FROM duel_side_bets WHERE id = p_bet_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aposta não encontrada ou não está aberta');
  END IF;

  -- Can't accept own bet
  IF v_bet.bettor_a_customer_id = p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode aceitar sua própria aposta');
  END IF;

  -- Get duel and validate it's still active
  SELECT * INTO v_duel FROM driver_duels WHERE id = v_bet.duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está mais ativo');
  END IF;

  -- Prevent duel participants
  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;
  IF p_customer_id = v_challenger_cid OR p_customer_id = v_challenged_cid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participantes do duelo não podem apostar');
  END IF;

  -- Determine opposite winner
  IF v_bet.bettor_a_predicted_winner = v_duel.challenger_id THEN
    v_opposite_winner := v_duel.challenged_id;
  ELSE
    v_opposite_winner := v_duel.challenger_id;
  END IF;

  -- Validate balances
  SELECT points_balance INTO v_balance_b FROM customers WHERE id = p_customer_id;
  IF v_balance_b IS NULL OR v_balance_b < v_bet.bettor_a_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  SELECT points_balance INTO v_balance_a FROM customers WHERE id = v_bet.bettor_a_customer_id;
  IF v_balance_a IS NULL OR v_balance_a < v_bet.bettor_a_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo do criador da aposta insuficiente');
  END IF;

  -- Escrow: debit both
  UPDATE customers SET points_balance = points_balance - v_bet.bettor_a_points WHERE id = v_bet.bettor_a_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (v_bet.bettor_a_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_bet.bettor_a_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  UPDATE customers SET points_balance = points_balance - v_bet.bettor_a_points WHERE id = p_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (p_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_bet.bettor_a_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  -- Update bet
  UPDATE duel_side_bets SET
    bettor_b_customer_id = p_customer_id,
    bettor_b_predicted_winner = v_opposite_winner,
    bettor_b_points = v_bet.bettor_a_points,
    status = 'matched',
    points_reserved = true
  WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_boost_duel(p_duel_id uuid, p_amount integer, p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor deve ser maior que zero');
  END IF;

  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado');
  END IF;

  IF v_duel.status NOT IN ('live', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está ativo');
  END IF;

  -- Debit wallet
  SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE branch_points_wallet
  SET balance = v_new_balance, total_distributed = total_distributed + p_amount, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
  VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_amount, v_new_balance, 'Impulso de duelo #' || LEFT(p_duel_id::text, 8));

  -- Add to prize_points
  UPDATE driver_duels SET prize_points = COALESCE(prize_points, 0) + p_amount WHERE id = p_duel_id;

  RETURN jsonb_build_object('success', true, 'new_prize', COALESCE(v_duel.prize_points, 0) + p_amount, 'wallet_balance', v_new_balance);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_create_bulk_duels(p_branch_id uuid, p_brand_id uuid, p_pairs jsonb, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_prize_points_per_pair integer DEFAULT 0, p_sponsored boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pair jsonb;
  v_challenger_cust uuid;
  v_challenged_cust uuid;
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_total_pairs int := 0;
  v_total_cost numeric := 0;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_created_ids uuid[] := ARRAY[]::uuid[];
  v_duel_id uuid;
BEGIN
  IF p_pairs IS NULL OR jsonb_typeof(p_pairs) <> 'array' OR jsonb_array_length(p_pairs) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum par informado');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à de fim');
  END IF;

  v_total_pairs := jsonb_array_length(p_pairs);
  v_total_cost := v_total_pairs * GREATEST(p_prize_points_per_pair, 0);

  IF v_total_cost > 0 THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
    END IF;
    IF v_wallet.balance < v_total_cost THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Saldo insuficiente',
        'balance', v_wallet.balance,
        'required', v_total_cost
      );
    END IF;
  END IF;

  FOR v_pair IN SELECT * FROM jsonb_array_elements(p_pairs)
  LOOP
    v_challenger_cust := (v_pair->>'challenger_customer_id')::uuid;
    v_challenged_cust := (v_pair->>'challenged_customer_id')::uuid;

    IF v_challenger_cust IS NULL OR v_challenged_cust IS NULL OR v_challenger_cust = v_challenged_cust THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_challenger FROM driver_duel_participants
    WHERE customer_id = v_challenger_cust AND branch_id = p_branch_id AND duels_enabled = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT * INTO v_challenged FROM driver_duel_participants
    WHERE customer_id = v_challenged_cust AND branch_id = p_branch_id AND duels_enabled = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    INSERT INTO driver_duels (
      branch_id, brand_id, challenger_id, challenged_id,
      start_at, end_at, status, accepted_at,
      prize_points, sponsored_by_brand, duel_origin
    ) VALUES (
      p_branch_id, p_brand_id, v_challenger.id, v_challenged.id,
      p_start_at, p_end_at, 'accepted', NOW(),
      GREATEST(p_prize_points_per_pair, 0), true, 'SPONSORED'
    )
    RETURNING id INTO v_duel_id;

    v_created_ids := array_append(v_created_ids, v_duel_id);
  END LOOP;

  v_total_cost := COALESCE(array_length(v_created_ids, 1), 0) * GREATEST(p_prize_points_per_pair, 0);

  IF v_total_cost > 0 AND v_wallet.id IS NOT NULL THEN
    v_new_balance := v_wallet.balance - v_total_cost;

    UPDATE branch_points_wallet
    SET balance = v_new_balance,
        total_distributed = total_distributed + v_total_cost,
        updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO branch_wallet_transactions (
      branch_id, brand_id, transaction_type, amount, balance_after, description
    ) VALUES (
      p_branch_id, p_brand_id, 'DEBIT', v_total_cost, v_new_balance,
      'Lote de duelos patrocinados — ' || COALESCE(array_length(v_created_ids, 1), 0)::text || ' duelos × ' || p_prize_points_per_pair::text || ' pts'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'created_count', COALESCE(array_length(v_created_ids, 1), 0),
    'requested_count', v_total_pairs,
    'total_cost', v_total_cost,
    'duel_ids', to_jsonb(v_created_ids)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_create_duel(p_challenger_customer_id uuid, p_challenged_customer_id uuid, p_branch_id uuid, p_brand_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_prize_points integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  IF p_challenger_customer_id = p_challenged_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não pode desafiar a si mesmo');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à data de fim');
  END IF;

  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não habilitado para duelos');
  END IF;

  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiado não habilitado para duelos');
  END IF;

  -- Cria duelo já como SPONSORED (admin = empreendedor banca)
  INSERT INTO driver_duels (
    branch_id, brand_id, challenger_id, challenged_id,
    start_at, end_at, status, accepted_at,
    prize_points, sponsored_by_brand, duel_origin
  )
  VALUES (
    p_branch_id, p_brand_id, v_challenger.id, v_challenged.id,
    p_start_at, p_end_at, 'accepted', now(),
    p_prize_points, true, 'SPONSORED'
  )
  RETURNING id INTO v_duel_id;

  IF p_prize_points > 0 THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
    END IF;

    v_new_balance := v_wallet.balance - p_prize_points;

    UPDATE branch_points_wallet
    SET balance = v_new_balance, total_distributed = total_distributed + p_prize_points, updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
    VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_prize_points, v_new_balance,
      'Prêmio de duelo patrocinado #' || LEFT(v_duel_id::text, 8));
  END IF;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.assign_city_belt_manual(p_branch_id uuid, p_brand_id uuid, p_customer_id uuid, p_record_value integer, p_prize_points integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at, belt_prize_points, assigned_manually)
  VALUES (p_branch_id, p_brand_id, p_customer_id, p_record_value, 'monthly', now(), p_prize_points, true)
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at,
    belt_prize_points = EXCLUDED.belt_prize_points,
    assigned_manually = true,
    updated_at = now();

  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at, belt_prize_points, assigned_manually)
  VALUES (p_branch_id, p_brand_id, p_customer_id, p_record_value, 'all_time', now(), 0, true)
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at,
    assigned_manually = true,
    updated_at = now()
  WHERE EXCLUDED.record_value > city_belt_champions.record_value;

  RETURN jsonb_build_object('success', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_assign_customer_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'customer')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_assign_root_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only assign if no root_admin exists yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'root_admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'root_admin');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_assign_store_admin_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when approval_status changes to APPROVED
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS DISTINCT FROM 'APPROVED') AND NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_user_id, 'store_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.branch_has_feature(p_branch_id uuid, p_feature text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id    uuid;
  v_settings    jsonb;
  v_flag_val    jsonb;
  v_flag_val_2  jsonb;
  v_aposta_on   boolean;
BEGIN
  IF p_feature NOT IN ('duelo','cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  SELECT brand_id, COALESCE(branch_settings_json, '{}'::jsonb)
    INTO v_brand_id, v_settings
    FROM branches
   WHERE id = p_branch_id;

  IF v_brand_id IS NULL THEN
    RETURN false;
  END IF;

  -- ----- DUELO: default ON; só desliga se enable_driver_duels = false -----
  IF p_feature = 'duelo' THEN
    v_flag_val := v_settings -> 'enable_driver_duels';
    IF v_flag_val IS NOT NULL
       AND jsonb_typeof(v_flag_val) = 'boolean'
       AND (v_flag_val)::text::boolean = false THEN
      RETURN false;
    END IF;
    -- Sem helper de marca para 'duelo' (não está no whitelist de brand_has_feature);
    -- política: cidade controla via flag. Default ON quando flag ausente.
    RETURN true;
  END IF;

  -- ----- APOSTA: default OFF; OR das duas chaves (dual-write Sprint 4B) -----
  IF p_feature = 'aposta' THEN
    v_flag_val   := v_settings -> 'enable_side_bets';
    v_flag_val_2 := v_settings -> 'enable_duel_side_bets';

    v_aposta_on := false;
    IF v_flag_val IS NOT NULL
       AND jsonb_typeof(v_flag_val) = 'boolean'
       AND (v_flag_val)::text::boolean = true THEN
      v_aposta_on := true;
    END IF;
    IF NOT v_aposta_on
       AND v_flag_val_2 IS NOT NULL
       AND jsonb_typeof(v_flag_val_2) = 'boolean'
       AND (v_flag_val_2)::text::boolean = true THEN
      v_aposta_on := true;
    END IF;

    IF v_aposta_on THEN
      RETURN public.brand_has_feature(v_brand_id, 'aposta');
    END IF;
    RETURN false;
  END IF;

  -- ----- CINTURAO / RANKING: default ON; só desliga se = false -----
  v_flag_val := v_settings -> CASE p_feature
    WHEN 'cinturao' THEN 'enable_city_belt'
    WHEN 'ranking'  THEN 'enable_city_ranking'
  END;

  IF v_flag_val IS NOT NULL
     AND jsonb_typeof(v_flag_val) = 'boolean'
     AND (v_flag_val)::text::boolean = false THEN
    RETURN false;
  END IF;
  RETURN public.brand_has_feature(v_brand_id, p_feature);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.branch_set_feature(p_branch_id uuid, p_feature text, p_enabled boolean, p_cascade_side_bets boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id      uuid;
  v_settings      jsonb;
  v_caller        uuid := auth.uid();
  v_is_root       boolean;
  v_in_brand      boolean := false;
  v_apostas_on    boolean;
  v_applied       jsonb := '[]'::jsonb;
  v_cascaded      jsonb := '[]'::jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_feature NOT IN ('duelo','cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  -- Lock + leitura
  SELECT brand_id, COALESCE(branch_settings_json, '{}'::jsonb)
    INTO v_brand_id, v_settings
    FROM branches
   WHERE id = p_branch_id
   FOR UPDATE;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Cidade nao encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Autorização: root OU admin da marca
  v_is_root := public.has_role(v_caller, 'root_admin'::app_role);
  IF NOT v_is_root THEN
    SELECT v_brand_id = ANY(public.get_user_brand_ids(v_caller)) INTO v_in_brand;
    IF NOT v_in_brand THEN
      RAISE EXCEPTION 'Sem permissao para esta marca' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- D9: ligar aposta exige duelo ligado
  IF p_feature = 'aposta' AND p_enabled = true THEN
    IF public.branch_has_feature(p_branch_id, 'duelo') = false THEN
      RAISE EXCEPTION 'Apostas exigem que Duelo esteja ativo nesta cidade'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Cascata: desligar duelo quando há apostas ativas
  IF p_feature = 'duelo' AND p_enabled = false THEN
    v_apostas_on := public.branch_has_feature(p_branch_id, 'aposta');
    IF v_apostas_on AND p_cascade_side_bets = false THEN
      RAISE EXCEPTION 'Desativar Duelo vai desligar Apostas. Confirme com p_cascade_side_bets=true'
        USING ERRCODE = '23514';
    END IF;

    IF v_apostas_on AND p_cascade_side_bets = true THEN
      -- Desliga apostas em ambas as chaves (dual-write)
      v_settings := jsonb_set(v_settings, '{enable_side_bets}',      to_jsonb(false), true);
      v_settings := jsonb_set(v_settings, '{enable_duel_side_bets}', to_jsonb(false), true);
      v_cascaded := v_cascaded || to_jsonb('aposta'::text);
    END IF;
  END IF;

  -- Aplicação principal
  IF p_feature = 'duelo' THEN
    v_settings := jsonb_set(v_settings, '{enable_driver_duels}', to_jsonb(p_enabled), true);
  ELSIF p_feature = 'cinturao' THEN
    v_settings := jsonb_set(v_settings, '{enable_city_belt}', to_jsonb(p_enabled), true);
  ELSIF p_feature = 'ranking' THEN
    v_settings := jsonb_set(v_settings, '{enable_city_ranking}', to_jsonb(p_enabled), true);
  ELSIF p_feature = 'aposta' THEN
    -- Dual-write: ambas as chaves recebem o mesmo valor (Sprint 4B D1)
    v_settings := jsonb_set(v_settings, '{enable_side_bets}',      to_jsonb(p_enabled), true);
    v_settings := jsonb_set(v_settings, '{enable_duel_side_bets}', to_jsonb(p_enabled), true);
  END IF;

  v_applied := v_applied || to_jsonb(p_feature);

  UPDATE branches
     SET branch_settings_json = v_settings
   WHERE id = p_branch_id;

  RETURN jsonb_build_object(
    'applied',  v_applied,
    'cascaded', v_cascaded
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.brand_get_brackets_full(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'bracket_id', b.id, 'tier_id', b.tier_id, 'tier_name', t.name, 'tier_order', t.tier_order,
    'round', b.round, 'slot', b.slot,
    'starts_at', b.starts_at, 'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id, 'driver_a_name', ca.name, 'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id, 'driver_b_name', cb.name, 'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id
  ) ORDER BY t.tier_order,
    CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END, b.slot
  ) INTO v_result
    FROM public.campeonato_brackets b
    LEFT JOIN public.campeonato_season_tiers t ON t.id = b.tier_id
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_dashboard(p_brand_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_active jsonb; v_tiers jsonb; v_season_id uuid;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT s.id, jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'branch_id', s.branch_id)
  INTO v_season_id, v_active
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season_id IS NULL THEN
    RETURN jsonb_build_object('active_season', NULL, 'tiers', '[]'::jsonb);
  END IF;
  WITH tier_top AS (
    SELECT t.id AS tier_id, t.name AS tier_name, t.tier_order,
           t.target_size, t.promotion_count, t.relegation_count,
      (SELECT COUNT(*)::int FROM public.campeonato_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id) AS total_drivers,
      (SELECT COUNT(*)::int FROM public.campeonato_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id AND st2.qualified = true) AS qualified_count,
      (SELECT jsonb_agg(jsonb_build_object(
          'driver_id', x.driver_id, 'driver_name', x.driver_name,
          'points', x.points, 'weekend_rides_count', x.weekend_rides_count
        ) ORDER BY x.rn)
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                             COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
                 st.driver_id, c.name AS driver_name, st.points, st.weekend_rides_count
            FROM public.campeonato_season_standings st
            JOIN public.customers c ON c.id = st.driver_id
           WHERE st.season_id = v_season_id AND st.tier_id = t.id
        ) x WHERE x.rn <= 3) AS top3
      FROM public.campeonato_season_tiers t WHERE t.season_id = v_season_id
     ORDER BY t.tier_order)
  SELECT jsonb_agg(jsonb_build_object(
    'tier_id', tier_id, 'tier_name', tier_name, 'tier_order', tier_order,
    'target_size', target_size, 'promotion_count', promotion_count,
    'relegation_count', relegation_count, 'total_drivers', total_drivers,
    'qualified_count', qualified_count, 'top3', COALESCE(top3,'[]'::jsonb)
  ) ORDER BY tier_order) INTO v_tiers FROM tier_top;
  RETURN jsonb_build_object('active_season', v_active, 'tiers', COALESCE(v_tiers,'[]'::jsonb));
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_dashboard(p_brand_id uuid, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_active jsonb; v_tiers jsonb; v_season_id uuid;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN
    RAISE EXCEPTION 'Sem autorização';
  END IF;

  SELECT s.id, jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'branch_id', s.branch_id)
  INTO v_season_id, v_active
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
     AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
   ORDER BY s.created_at DESC LIMIT 1;

  IF v_season_id IS NULL THEN
    RETURN jsonb_build_object('active_season', NULL, 'tiers', '[]'::jsonb);
  END IF;

  WITH tier_top AS (
    SELECT t.id AS tier_id, t.name AS tier_name, t.tier_order,
           t.target_size, t.promotion_count, t.relegation_count,
      (SELECT COUNT(*)::int FROM public.campeonato_tier_memberships tm
         WHERE tm.season_id = v_season_id AND tm.tier_id = t.id) AS total_drivers,
      (SELECT COUNT(*)::int FROM public.campeonato_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id AND st2.qualified = true) AS qualified_count,
      (SELECT jsonb_agg(jsonb_build_object(
          'driver_id', x.driver_id, 'driver_name', x.driver_name,
          'points', x.points, 'weekend_rides_count', x.weekend_rides_count
        ) ORDER BY x.rn)
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                             COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
                 st.driver_id, c.name AS driver_name, st.points, st.weekend_rides_count
            FROM public.campeonato_season_standings st
            JOIN public.customers c ON c.id = st.driver_id
           WHERE st.season_id = v_season_id AND st.tier_id = t.id
        ) x WHERE x.rn <= 3) AS top3
      FROM public.campeonato_season_tiers t WHERE t.season_id = v_season_id
     ORDER BY t.tier_order)
  SELECT jsonb_agg(jsonb_build_object(
    'tier_id', tier_id, 'tier_name', tier_name, 'tier_order', tier_order,
    'target_size', target_size, 'promotion_count', promotion_count,
    'relegation_count', relegation_count, 'total_drivers', total_drivers,
    'members_count', total_drivers,
    'qualified_count', qualified_count, 'top3', COALESCE(top3,'[]'::jsonb)
  ) ORDER BY tier_order) INTO v_tiers FROM tier_top;

  RETURN jsonb_build_object('active_season', v_active, 'tiers', COALESCE(v_tiers,'[]'::jsonb));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_kpis(p_brand_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_can_manage boolean; v_season record;
  v_total_drivers integer := 0; v_tier_a integer := 0; v_tier_b integer := 0; v_tier_c integer := 0;
  v_rides_total integer := 0; v_points_total bigint := 0; v_events_24h integer := 0;
  v_now timestamptz := now();
BEGIN
  v_can_manage := public.campeonato_admin_can_manage(p_brand_id);
  IF NOT v_can_manage THEN RAISE EXCEPTION 'Sem permissão para visualizar KPIs do campeonato desta marca'; END IF;
  SELECT s.id, s.name, s.phase, s.classification_starts_at, s.classification_ends_at,
         s.knockout_starts_at, s.knockout_ends_at INTO v_season
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id AND s.phase NOT IN ('finished','cancelled') AND s.cancelled_at IS NULL
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season.id IS NULL THEN
    RETURN jsonb_build_object('has_active_season', false, 'season', NULL,
      'kpis', jsonb_build_object('total_drivers',0,'by_tier',jsonb_build_object('A',0,'B',0,'C',0),
        'rides_in_season',0,'points_distributed',0,'events_last_24h',0));
  END IF;
  SELECT COUNT(*) FILTER (WHERE true), COUNT(*) FILTER (WHERE t.name = 'A'),
    COUNT(*) FILTER (WHERE t.name = 'B'), COUNT(*) FILTER (WHERE t.name = 'C')
  INTO v_total_drivers, v_tier_a, v_tier_b, v_tier_c
  FROM public.campeonato_tier_memberships m
  JOIN public.campeonato_season_tiers t ON t.id = m.tier_id AND t.season_id = m.season_id
  WHERE m.season_id = v_season.id;
  SELECT COUNT(*), COALESCE(SUM(driver_points_credited),0) INTO v_rides_total, v_points_total
    FROM public.machine_rides
   WHERE brand_id = p_brand_id AND finalized_at IS NOT NULL
     AND finalized_at >= v_season.classification_starts_at
     AND finalized_at <= LEAST(v_now, v_season.knockout_ends_at);
  SELECT COUNT(*) INTO v_events_24h FROM public.campeonato_attempts_log
   WHERE brand_id = p_brand_id
     AND created_at >= GREATEST(v_now - interval '24 hours', v_season.classification_starts_at);
  RETURN jsonb_build_object('has_active_season', true,
    'season', jsonb_build_object('id', v_season.id, 'name', v_season.name, 'phase', v_season.phase,
      'classification_starts_at', v_season.classification_starts_at,
      'classification_ends_at', v_season.classification_ends_at,
      'knockout_starts_at', v_season.knockout_starts_at, 'knockout_ends_at', v_season.knockout_ends_at),
    'kpis', jsonb_build_object('total_drivers', v_total_drivers,
      'by_tier', jsonb_build_object('A', v_tier_a, 'B', v_tier_b, 'C', v_tier_c),
      'rides_in_season', v_rides_total, 'points_distributed', v_points_total,
      'events_last_24h', v_events_24h));
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_kpis(p_brand_id uuid, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_can_manage boolean;
  v_season record;
  v_total_drivers integer := 0;
  v_tier_a integer := 0;
  v_tier_b integer := 0;
  v_tier_c integer := 0;
  v_rides_total integer := 0;
  v_points_total bigint := 0;
  v_events_24h integer := 0;
  v_now timestamptz := now();
BEGIN
  v_can_manage := public.campeonato_admin_can_manage(p_brand_id);
  IF NOT v_can_manage THEN
    RAISE EXCEPTION 'Sem permissão para visualizar KPIs do campeonato desta marca';
  END IF;

  SELECT s.id, s.name, s.phase, s.classification_starts_at, s.classification_ends_at,
         s.knockout_starts_at, s.knockout_ends_at
    INTO v_season
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
     AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF v_season.id IS NULL THEN
    RETURN jsonb_build_object(
      'has_active_season', false,
      'season', NULL,
      'kpis', jsonb_build_object(
        'total_drivers', 0,
        'by_tier', jsonb_build_object('A',0,'B',0,'C',0),
        'rides_in_season', 0,
        'points_distributed', 0,
        'events_last_24h', 0
      )
    );
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE true),
    COUNT(*) FILTER (WHERE t.name = 'A'),
    COUNT(*) FILTER (WHERE t.name = 'B'),
    COUNT(*) FILTER (WHERE t.name = 'C')
  INTO v_total_drivers, v_tier_a, v_tier_b, v_tier_c
  FROM public.campeonato_tier_memberships m
  JOIN public.campeonato_season_tiers t
    ON t.id = m.tier_id AND t.season_id = m.season_id
  WHERE m.season_id = v_season.id
    AND (p_branch_id IS NULL OR m.branch_id = p_branch_id);

  SELECT COUNT(*), COALESCE(SUM(driver_points_credited),0)
    INTO v_rides_total, v_points_total
    FROM public.machine_rides
   WHERE brand_id = p_brand_id
     AND finalized_at IS NOT NULL
     AND finalized_at >= v_season.classification_starts_at
     AND finalized_at <= LEAST(v_now, v_season.knockout_ends_at)
     AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  SELECT COUNT(*) INTO v_events_24h
    FROM public.campeonato_attempts_log
   WHERE brand_id = p_brand_id
     AND created_at >= GREATEST(v_now - interval '24 hours', v_season.classification_starts_at)
     AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  RETURN jsonb_build_object(
    'has_active_season', true,
    'season', jsonb_build_object(
      'id', v_season.id,
      'name', v_season.name,
      'phase', v_season.phase,
      'classification_starts_at', v_season.classification_starts_at,
      'classification_ends_at', v_season.classification_ends_at,
      'knockout_starts_at', v_season.knockout_starts_at,
      'knockout_ends_at', v_season.knockout_ends_at
    ),
    'kpis', jsonb_build_object(
      'total_drivers', v_total_drivers,
      'by_tier', jsonb_build_object('A', v_tier_a, 'B', v_tier_b, 'C', v_tier_c),
      'rides_in_season', v_rides_total,
      'points_distributed', v_points_total,
      'events_last_24h', v_events_24h
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.brand_get_drivers_available(p_brand_id uuid, p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object('driver_id', c.id, 'driver_name', c.name, 'cpf', c.cpf
  ) ORDER BY c.name) INTO v_result
    FROM public.customers c
   WHERE c.brand_id = p_brand_id AND '[MOTORISTA]' = ANY(COALESCE(c.tags,'{}'::text[]))
     AND NOT EXISTS (SELECT 1 FROM public.campeonato_tier_memberships tm
        WHERE tm.season_id = p_season_id AND tm.driver_id = c.id);
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_get_season_summary(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tiers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'tier_id', t.id, 'tier_name', t.name, 'tier_order', t.tier_order,
        'target_size', t.target_size, 'promotion_count', t.promotion_count,
        'relegation_count', t.relegation_count, 'aborted_at', t.aborted_at,
        'members_count', (SELECT COUNT(*)::int FROM public.campeonato_tier_memberships
                            WHERE season_id = s.id AND tier_id = t.id),
        'total_drivers', (SELECT COUNT(*)::int FROM public.campeonato_tier_memberships
                            WHERE season_id = s.id AND tier_id = t.id),
        'qualified_count', (SELECT COUNT(*)::int FROM public.campeonato_season_standings
                              WHERE season_id = s.id AND tier_id = t.id AND qualified = true)
      ) ORDER BY t.tier_order)
        FROM public.campeonato_season_tiers t WHERE t.season_id = s.id), '[]'::jsonb)
  ) INTO v_result FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  RETURN v_result;
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_get_seasons_list(p_brand_id uuid, p_status text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_ends_at', s.knockout_ends_at,
    'created_at', s.created_at, 'branch_id', s.branch_id
  ) ORDER BY s.year DESC, s.month DESC) INTO v_result
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND CASE
           WHEN p_status = 'active' THEN s.phase NOT IN ('finished','cancelled')
           WHEN p_status = 'finished' THEN s.phase = 'finished'
           WHEN p_status = 'cancelled' THEN s.phase = 'cancelled'
           ELSE TRUE
         END;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_get_series_detail(p_season_id uuid, p_tier_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  WITH ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                       COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
           st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at,
           st.qualified, c.name AS driver_name
      FROM public.campeonato_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = p_tier_id)
  SELECT jsonb_agg(jsonb_build_object(
    'position', rn, 'driver_id', driver_id, 'driver_name', driver_name,
    'points', points, 'weekend_rides_count', weekend_rides_count,
    'last_ride_at', last_ride_at, 'qualified', qualified
  ) ORDER BY rn) INTO v_result FROM ranked;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.brand_has_feature(p_brand_id uuid, p_feature text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_legacy_key text;
  v_via_config boolean := false;
  v_via_legacy boolean := false;
BEGIN
  IF p_feature NOT IN ('cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  -- Caminho 1: leitura consolidada em duelo_motorista.config_json.features
  SELECT COALESCE(
           (bbm.config_json -> 'features' ->> p_feature)::boolean,
           false
         )
    INTO v_via_config
    FROM brand_business_models bbm
    JOIN business_models bm ON bm.id = bbm.business_model_id
   WHERE bbm.brand_id = p_brand_id
     AND bm.key = 'duelo_motorista'
     AND bbm.is_enabled = true
   LIMIT 1;

  v_via_config := COALESCE(v_via_config, false);

  -- Caminho 2 (rede de segurança DS3-4): BM legado ainda ativo na marca
  v_legacy_key := CASE p_feature
    WHEN 'cinturao' THEN 'cinturao_motorista'
    WHEN 'aposta'   THEN 'aposta_motorista'
    WHEN 'ranking'  THEN 'rank_motorista'
  END;

  SELECT EXISTS (
    SELECT 1
      FROM brand_business_models bbm
      JOIN business_models bm ON bm.id = bbm.business_model_id
     WHERE bbm.brand_id = p_brand_id
       AND bm.key = v_legacy_key
       AND bbm.is_enabled = true
  ) INTO v_via_legacy;

  RETURN v_via_config OR v_via_legacy;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.brand_set_duelo_feature(p_brand_id uuid, p_feature text, p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_root boolean;
  v_is_brand_admin boolean;
  v_duelo_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  IF p_feature NOT IN ('cinturao','aposta','ranking') THEN
    RAISE EXCEPTION 'Feature invalida: %', p_feature USING ERRCODE = '22023';
  END IF;

  v_is_root := public.has_role(v_uid, 'root_admin'::app_role);

  v_is_brand_admin := EXISTS (
    SELECT 1 FROM unnest(public.get_user_brand_ids(v_uid)) AS bid
     WHERE bid = p_brand_id
  );

  IF NOT (v_is_root OR v_is_brand_admin) THEN
    RAISE EXCEPTION 'Sem permissao para alterar features da marca' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_duelo_id FROM business_models WHERE key = 'duelo_motorista' LIMIT 1;
  IF v_duelo_id IS NULL THEN
    RAISE EXCEPTION 'Modelo duelo_motorista nao encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- Garante linha brand_business_models para o duelo (não força is_enabled)
  INSERT INTO brand_business_models (brand_id, business_model_id, is_enabled, config_json)
  VALUES (p_brand_id, v_duelo_id, false,
          jsonb_build_object('features',
            jsonb_build_object('cinturao', false, 'aposta', false, 'ranking', false, 'campeonato', false)))
  ON CONFLICT (brand_id, business_model_id) DO NOTHING;

  -- Atualiza apenas a feature pedida
  UPDATE brand_business_models
     SET config_json = jsonb_set(
                         COALESCE(config_json, '{}'::jsonb),
                         ARRAY['features', p_feature],
                         to_jsonb(p_enabled),
                         true
                       ),
         updated_at = now()
   WHERE brand_id = p_brand_id
     AND business_model_id = v_duelo_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_add_driver_to_season(p_season_id uuid, p_driver_id uuid, p_tier_id uuid, p_initial_points integer DEFAULT 0, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_branch uuid; v_phase text; v_median numeric;
        v_belongs boolean; v_tier_belongs boolean;
BEGIN
  SELECT brand_id, branch_id, phase INTO v_brand, v_branch, v_phase
    FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.campeonato_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN RAISE EXCEPTION 'Temporada não editável (fase: %)', v_phase; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)'; END IF;
  IF p_initial_points < 0 THEN RAISE EXCEPTION 'initial_points não pode ser negativo'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.campeonato_season_tiers WHERE id = p_tier_id AND season_id = p_season_id) INTO v_tier_belongs;
  IF NOT v_tier_belongs THEN RAISE EXCEPTION 'Série não pertence a esta temporada'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.customers WHERE id = p_driver_id AND brand_id = v_brand) INTO v_belongs;
  IF NOT v_belongs THEN RAISE EXCEPTION 'Motorista não pertence à marca'; END IF;
  IF EXISTS(SELECT 1 FROM public.campeonato_tier_memberships WHERE season_id = p_season_id AND driver_id = p_driver_id) THEN
    RAISE EXCEPTION 'Motorista já está nesta temporada'; END IF;
  SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY points), 0) INTO v_median
    FROM public.campeonato_season_standings WHERE season_id = p_season_id AND tier_id = p_tier_id;
  IF p_initial_points::numeric > v_median THEN
    RAISE EXCEPTION 'initial_points (%) excede mediana da série (%) — bloqueado por antifraude', p_initial_points, v_median;
  END IF;
  INSERT INTO public.campeonato_tier_memberships(season_id, driver_id, tier_id, brand_id, branch_id, source)
    VALUES (p_season_id, p_driver_id, p_tier_id, v_brand, v_branch, 'manual_add');
  INSERT INTO public.campeonato_season_standings(season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto)
    VALUES (p_season_id, p_driver_id, p_tier_id, p_initial_points, 0, false, false);
  INSERT INTO public.campeonato_attempts_log(code, season_id, driver_id, brand_id, details_json)
    VALUES ('manual_driver_added', p_season_id, p_driver_id, v_brand,
      jsonb_build_object('tier_id', p_tier_id, 'initial_points', p_initial_points,
        'median', v_median, 'reason', p_reason, 'added_by', auth.uid()));
  RETURN jsonb_build_object('membership_created', true, 'median_at_insert', v_median);
END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_admin_can_manage(p_brand_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    has_role(auth.uid(),'root_admin')
    OR (has_role(auth.uid(),'brand_admin')
        AND p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_advance_phases()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_summary jsonb := '[]'::jsonb;
  v_season record; v_tier record; v_total int; v_top int; v_round text;
  v_next_phase text; v_brackets int; v_phase_starts timestamptz; v_phase_ends timestamptz;
  v_round_total int; v_round_done int; v_b record; v_winner uuid; v_loser uuid; v_next_round text;
  v_pair record; v_slot int; v_champion uuid; v_runner_up uuid;
  v_semis uuid[]; v_qf uuid[]; v_r16 uuid[];
  v_prize_season record;
  v_qualified record;
  v_winner_name text;
  v_loser_name text;
  v_is_draw boolean;
BEGIN
  FOR v_season IN
    SELECT s.*, COALESCE(b.timezone, 'America/Sao_Paulo') AS tz
      FROM public.campeonato_seasons s
      JOIN public.branches b ON b.id = s.branch_id
     WHERE s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
       AND s.paused_at IS NULL
       AND public.campeonato_get_engagement_format(s.brand_id) = 'campeonato'
  LOOP
    BEGIN
      IF v_season.phase = 'classification' AND now() >= v_season.classification_ends_at THEN
        v_phase_starts := GREATEST(now(), v_season.knockout_starts_at);
        v_phase_ends   := v_season.knockout_ends_at;
        v_next_phase   := NULL;
        FOR v_tier IN SELECT t.* FROM public.campeonato_season_tiers t
           WHERE t.season_id = v_season.id AND t.aborted_at IS NULL ORDER BY t.tier_order
        LOOP
          SELECT COUNT(*) INTO v_total FROM public.campeonato_season_standings st
           WHERE st.season_id = v_season.id AND st.tier_id = v_tier.id AND st.points >= 1;
          IF v_total >= 16 THEN v_top := 16; v_round := 'knockout_r16';
          ELSIF v_total >= 8 THEN v_top := 8; v_round := 'knockout_qf';
          ELSIF v_total >= 4 THEN v_top := 4; v_round := 'knockout_sf';
          ELSIF v_total >= 2 THEN v_top := 2; v_round := 'knockout_final';
          ELSE
            UPDATE public.campeonato_season_tiers SET aborted_at = now() WHERE id = v_tier.id;
            INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
            VALUES ('tier_aborted', v_season.id, v_season.brand_id, v_season.branch_id,
                    jsonb_build_object('tier_id', v_tier.id, 'reason', 'less_than_2_qualified'));
            CONTINUE;
          END IF;
          v_brackets := public.campeonato_create_brackets_within_tier(
            v_season.id, v_tier.id,
            CASE v_round WHEN 'knockout_r16' THEN 'r16' WHEN 'knockout_qf' THEN 'qf'
                 WHEN 'knockout_sf' THEN 'sf' ELSE 'final' END,
            v_top, v_phase_starts, v_phase_ends);
          IF v_next_phase IS NULL OR (v_round = 'knockout_r16')
             OR (v_round = 'knockout_qf' AND v_next_phase NOT IN ('knockout_r16'))
             OR (v_round = 'knockout_sf' AND v_next_phase NOT IN ('knockout_r16','knockout_qf'))
             OR (v_round = 'knockout_final' AND v_next_phase = 'knockout_final')
          THEN v_next_phase := v_round; END IF;
        END LOOP;
        IF v_next_phase IS NOT NULL THEN
          UPDATE public.campeonato_seasons SET phase = v_next_phase, updated_at = now() WHERE id = v_season.id;
          INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
          VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                  jsonb_build_object('from','classification','to', v_next_phase));
          v_summary := v_summary || jsonb_build_object('season_id', v_season.id, 'to', v_next_phase);

          BEGIN
            FOR v_qualified IN
              SELECT DISTINCT b2.driver_a_id AS driver_id
                FROM public.campeonato_brackets b2
               WHERE b2.season_id = v_season.id
                 AND b2.driver_a_id IS NOT NULL
              UNION
              SELECT DISTINCT b2.driver_b_id
                FROM public.campeonato_brackets b2
               WHERE b2.season_id = v_season.id
                 AND b2.driver_b_id IS NOT NULL
            LOOP
              INSERT INTO public.campeonato_notifications
                (driver_id, brand_id, season_id, event_type, title, message, action_url)
              VALUES (
                v_qualified.driver_id, v_season.brand_id, v_season.id,
                'knockout_started',
                'Mata-mata começou!',
                'Você se classificou para o mata-mata. Veja seu confronto!',
                '/driver?campeonato=1'
              );
            END LOOP;
          EXCEPTION WHEN OTHERS THEN NULL; END;

        ELSE
          UPDATE public.campeonato_seasons SET phase = 'finished', updated_at = now() WHERE id = v_season.id;
          INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
          VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                  jsonb_build_object('from','classification','to','finished','reason','no_tier_eligible'));
        END IF;
        CONTINUE;
      END IF;
      IF v_season.phase IN ('knockout_r16','knockout_qf','knockout_sf','knockout_final') THEN
        v_round := CASE v_season.phase WHEN 'knockout_r16' THEN 'r16' WHEN 'knockout_qf' THEN 'qf'
          WHEN 'knockout_sf' THEN 'sf' ELSE 'final' END;
        SELECT COUNT(*), COUNT(*) FILTER (WHERE winner_id IS NOT NULL OR ends_at <= now())
          INTO v_round_total, v_round_done
          FROM public.campeonato_brackets WHERE season_id = v_season.id AND round = v_round;
        IF v_round_total = 0 OR v_round_done < v_round_total THEN CONTINUE; END IF;
        FOR v_b IN SELECT * FROM public.campeonato_brackets
           WHERE season_id = v_season.id AND round = v_round AND winner_id IS NULL
        LOOP
          v_is_draw := false;
          IF v_b.driver_a_id IS NULL THEN v_winner := v_b.driver_b_id; v_loser := NULL;
          ELSIF v_b.driver_b_id IS NULL THEN v_winner := v_b.driver_a_id; v_loser := NULL;
          ELSIF v_b.driver_a_rides > v_b.driver_b_rides THEN v_winner := v_b.driver_a_id; v_loser := v_b.driver_b_id;
          ELSIF v_b.driver_b_rides > v_b.driver_a_rides THEN v_winner := v_b.driver_b_id; v_loser := v_b.driver_a_id;
          ELSE
            v_is_draw := true;
            SELECT driver_id INTO v_winner FROM public.campeonato_season_standings
             WHERE season_id = v_season.id AND driver_id IN (v_b.driver_a_id, v_b.driver_b_id)
             ORDER BY position_in_tier ASC NULLS LAST, points DESC, last_ride_at ASC LIMIT 1;
            v_loser := CASE WHEN v_winner = v_b.driver_a_id THEN v_b.driver_b_id ELSE v_b.driver_a_id END;
          END IF;
          UPDATE public.campeonato_brackets SET winner_id = v_winner WHERE id = v_b.id;

          -- HOOK NOTIFICAÇÕES: duelo_win / duelo_loss / duelo_draw com nome do adversário
          BEGIN
            v_winner_name := NULL;
            v_loser_name := NULL;
            IF v_winner IS NOT NULL THEN
              SELECT regexp_replace(COALESCE(name, 'Motorista'), '\[MOTORISTA\]\s*', '', 'gi')
                INTO v_winner_name FROM public.customers WHERE id = v_winner;
            END IF;
            IF v_loser IS NOT NULL THEN
              SELECT regexp_replace(COALESCE(name, 'Motorista'), '\[MOTORISTA\]\s*', '', 'gi')
                INTO v_loser_name FROM public.customers WHERE id = v_loser;
            END IF;

            IF v_is_draw AND v_winner IS NOT NULL AND v_loser IS NOT NULL THEN
              -- Empate (resolvido por critério de desempate, mas notifica como empate)
              INSERT INTO public.campeonato_notifications
                (driver_id, brand_id, season_id, event_type, title, message, action_url)
              VALUES (v_winner, v_season.brand_id, v_season.id, 'duelo_draw',
                      'Empate!',
                      'Duelo empatado com ' || COALESCE(v_loser_name, 'adversário') || '. Você avançou no critério de desempate.',
                      '/driver?campeonato=1');
              INSERT INTO public.campeonato_notifications
                (driver_id, brand_id, season_id, event_type, title, message, action_url)
              VALUES (v_loser, v_season.brand_id, v_season.id, 'duelo_draw',
                      'Empate!',
                      'Duelo empatado com ' || COALESCE(v_winner_name, 'adversário') || '. Critério de desempate definiu o vencedor.',
                      '/driver?campeonato=1');
            ELSE
              IF v_winner IS NOT NULL THEN
                INSERT INTO public.campeonato_notifications
                  (driver_id, brand_id, season_id, event_type, title, message, action_url)
                VALUES (v_winner, v_season.brand_id, v_season.id, 'duelo_win',
                        '🏆 Vitória no duelo!',
                        CASE
                          WHEN v_loser_name IS NOT NULL
                            THEN 'Você venceu o duelo contra ' || v_loser_name || ' e avançou para a próxima fase!'
                          ELSE 'Você avançou para a próxima fase do mata-mata!'
                        END,
                        '/driver?campeonato=1');
              END IF;
              IF v_loser IS NOT NULL THEN
                INSERT INTO public.campeonato_notifications
                  (driver_id, brand_id, season_id, event_type, title, message, action_url)
                VALUES (v_loser, v_season.brand_id, v_season.id, 'duelo_loss',
                        'Resultado do duelo',
                        CASE
                          WHEN v_winner_name IS NOT NULL
                            THEN 'Você perdeu o duelo contra ' || v_winner_name || '. Continue firme no próximo campeonato!'
                          ELSE 'Você foi eliminado nesta fase. Continue firme!'
                        END,
                        '/driver?campeonato=1');
              END IF;
            END IF;
          EXCEPTION WHEN OTHERS THEN NULL; END;
        END LOOP;
        IF v_round = 'final' THEN
          SELECT b.winner_id, CASE WHEN b.driver_a_id = b.winner_id THEN b.driver_b_id ELSE b.driver_a_id END
            INTO v_champion, v_runner_up
            FROM public.campeonato_brackets b
            JOIN public.campeonato_season_tiers t ON t.id = b.tier_id
           WHERE b.season_id = v_season.id AND b.round = 'final'
           ORDER BY t.tier_order ASC LIMIT 1;
          SELECT array_agg(driver_id) INTO v_semis FROM (
            SELECT DISTINCT unnest(ARRAY[b.driver_a_id, b.driver_b_id]) AS driver_id
              FROM public.campeonato_brackets b JOIN public.campeonato_season_tiers t ON t.id = b.tier_id
             WHERE b.season_id = v_season.id AND b.round = 'sf' AND t.tier_order = 1
          ) s WHERE driver_id IS NOT NULL;
          SELECT array_agg(driver_id) INTO v_qf FROM (
            SELECT DISTINCT unnest(ARRAY[b.driver_a_id, b.driver_b_id]) AS driver_id
              FROM public.campeonato_brackets b JOIN public.campeonato_season_tiers t ON t.id = b.tier_id
             WHERE b.season_id = v_season.id AND b.round = 'qf' AND t.tier_order = 1
          ) s WHERE driver_id IS NOT NULL;
          SELECT array_agg(driver_id) INTO v_r16 FROM (
            SELECT DISTINCT unnest(ARRAY[b.driver_a_id, b.driver_b_id]) AS driver_id
              FROM public.campeonato_brackets b JOIN public.campeonato_season_tiers t ON t.id = b.tier_id
             WHERE b.season_id = v_season.id AND b.round = 'r16' AND t.tier_order = 1
          ) s WHERE driver_id IS NOT NULL;
          INSERT INTO public.campeonato_champions (season_id, brand_id, branch_id,
            champion_driver_id, runner_up_driver_id, semifinalist_ids, quarterfinalist_ids, r16_ids,
            prizes_distributed, finalized_at)
          VALUES (v_season.id, v_season.brand_id, v_season.branch_id,
            v_champion, v_runner_up,
            COALESCE(v_semis, ARRAY[]::uuid[]),
            COALESCE(v_qf,    ARRAY[]::uuid[]),
            COALESCE(v_r16,   ARRAY[]::uuid[]),
            false, now())
          ON CONFLICT DO NOTHING;
          UPDATE public.campeonato_seasons SET phase = 'finished', updated_at = now() WHERE id = v_season.id;
          INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
          VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                  jsonb_build_object('from', v_season.phase, 'to', 'finished'));
          PERFORM public.campeonato_apply_promotion_relegation(v_season.id);
          v_summary := v_summary || jsonb_build_object('season_id', v_season.id, 'to', 'finished');
          CONTINUE;
        END IF;
        v_next_round := CASE v_round WHEN 'r16' THEN 'qf' WHEN 'qf' THEN 'sf' ELSE 'final' END;
        v_next_phase := 'knockout_' || v_next_round;
        FOR v_tier IN SELECT DISTINCT tier_id FROM public.campeonato_brackets
           WHERE season_id = v_season.id AND round = v_round AND tier_id IS NOT NULL
        LOOP
          v_slot := 0;
          FOR v_pair IN SELECT winner_id, slot FROM public.campeonato_brackets
             WHERE season_id = v_season.id AND round = v_round AND tier_id = v_tier.tier_id ORDER BY slot
          LOOP
            v_slot := v_slot + 1;
            IF v_slot % 2 = 1 THEN v_winner := v_pair.winner_id;
            ELSE
              INSERT INTO public.campeonato_brackets (season_id, round, slot, driver_a_id, driver_b_id,
                driver_a_rides, driver_b_rides, starts_at, ends_at, tier_id, bracket_scope)
              VALUES (v_season.id, v_next_round, (v_slot/2),
                v_winner, v_pair.winner_id, 0, 0, now(), v_season.knockout_ends_at,
                v_tier.tier_id, 'within_tier');
            END IF;
          END LOOP;
        END LOOP;
        UPDATE public.campeonato_seasons SET phase = v_next_phase, updated_at = now() WHERE id = v_season.id;
        INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
        VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                jsonb_build_object('from', v_season.phase, 'to', v_next_phase));
        v_summary := v_summary || jsonb_build_object('season_id', v_season.id, 'to', v_next_phase);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
      VALUES ('advance_error', v_season.id, v_season.brand_id, v_season.branch_id,
              jsonb_build_object('sqlstate', SQLSTATE, 'message', SQLERRM, 'phase', v_season.phase));
    END;
  END LOOP;

  FOR v_prize_season IN
    SELECT s.* FROM public.campeonato_seasons s
     WHERE s.phase = 'finished'
       AND NOT EXISTS (
         SELECT 1 FROM public.campeonato_prize_distributions d WHERE d.season_id = s.id
       )
  LOOP
    BEGIN
      PERFORM public.duelo_calculate_prizes(v_prize_season.id);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
      VALUES ('prize_calc_error', v_prize_season.id, v_prize_season.brand_id, v_prize_season.branch_id,
              jsonb_build_object('sqlstate', SQLSTATE, 'message', SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object('processed', v_summary);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_apply_promotion_relegation(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season public.campeonato_seasons%ROWTYPE;
  v_tier record;
  v_next_tier_id uuid;
  v_prev_tier_id uuid;
  v_max_order int;
  v_min_order int;
  v_zero_relegated int := 0;
  v_relegated int := 0;
  v_promoted int := 0;
  v_stayed int := 0;
  v_d record;
BEGIN
  SELECT * INTO v_season FROM public.campeonato_seasons WHERE id = p_season_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_season.phase <> 'finished' THEN
    RAISE EXCEPTION 'Promoção/rebaixamento só aplica em fase finished (atual: %)', v_season.phase;
  END IF;

  IF v_season.promotion_applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already_applied', 'at', v_season.promotion_applied_at);
  END IF;

  SELECT MAX(tier_order), MIN(tier_order)
    INTO v_max_order, v_min_order
    FROM public.campeonato_season_tiers
   WHERE season_id = p_season_id;

  -- position_in_tier final com novo desempate
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY tier_id
             ORDER BY points DESC NULLS LAST,
                      weekend_rides_count DESC NULLS LAST,
                      last_ride_at ASC NULLS LAST
           ) AS pos
      FROM public.campeonato_season_standings
     WHERE season_id = p_season_id
  )
  UPDATE public.campeonato_season_standings st
     SET position_in_tier = r.pos
    FROM ranked r
   WHERE st.id = r.id
     AND (st.position_in_tier IS NULL OR st.position_in_tier <> r.pos);

  -- ETAPA 1: rebaixamento por zero pontos
  FOR v_tier IN
    SELECT * FROM public.campeonato_season_tiers
     WHERE season_id = p_season_id
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_next_tier_id
      FROM public.campeonato_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order + 1;

    FOR v_d IN
      SELECT st.driver_id, st.id AS standing_id
        FROM public.campeonato_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.points, 0) = 0
    LOOP
      UPDATE public.campeonato_season_standings
         SET relegated_auto = true
       WHERE id = v_d.standing_id;

      INSERT INTO public.campeonato_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      SELECT p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
             v_tier.id, COALESCE(v_next_tier_id, v_tier.id), st.position_in_tier,
             CASE WHEN v_next_tier_id IS NULL THEN 'stayed' ELSE 'relegated_zero' END
        FROM public.campeonato_season_standings st
       WHERE st.id = v_d.standing_id
      ON CONFLICT DO NOTHING;

      v_zero_relegated := v_zero_relegated + 1;
    END LOOP;
  END LOOP;

  -- ETAPA 2: rebaixamento normal
  FOR v_tier IN
    SELECT * FROM public.campeonato_season_tiers
     WHERE season_id = p_season_id AND tier_order < v_max_order
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_next_tier_id
      FROM public.campeonato_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order + 1;

    FOR v_d IN
      SELECT st.driver_id, st.position_in_tier
        FROM public.campeonato_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.relegated_auto,false) = false
       ORDER BY st.position_in_tier DESC NULLS FIRST
       LIMIT v_tier.relegation_count
    LOOP
      INSERT INTO public.campeonato_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      VALUES (
        p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
        v_tier.id, v_next_tier_id, v_d.position_in_tier, 'relegated'
      )
      ON CONFLICT DO NOTHING;
      v_relegated := v_relegated + 1;
    END LOOP;
  END LOOP;

  -- ETAPA 3: promoção
  FOR v_tier IN
    SELECT * FROM public.campeonato_season_tiers
     WHERE season_id = p_season_id AND tier_order > v_min_order
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_prev_tier_id
      FROM public.campeonato_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order - 1;

    FOR v_d IN
      SELECT st.driver_id, st.position_in_tier, st.tier_id AS source_tier_id
        FROM public.campeonato_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.relegated_auto,false) = false
         AND NOT EXISTS (
           SELECT 1 FROM public.campeonato_driver_tier_history h
            WHERE h.season_id = p_season_id
              AND h.driver_id = st.driver_id
         )
       ORDER BY st.position_in_tier ASC NULLS LAST
       LIMIT (
         SELECT promotion_count FROM public.campeonato_season_tiers WHERE id = v_tier.id
       )
    LOOP
      INSERT INTO public.campeonato_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      VALUES (
        p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
        v_tier.id, v_prev_tier_id, v_d.position_in_tier, 'promoted'
      )
      ON CONFLICT DO NOTHING;
      v_promoted := v_promoted + 1;
    END LOOP;
  END LOOP;

  -- ETAPA 4: stayed + champion do tier 1
  FOR v_d IN
    SELECT st.driver_id, st.tier_id, st.position_in_tier, t.tier_order
      FROM public.campeonato_season_standings st
      JOIN public.campeonato_season_tiers t ON t.id = st.tier_id
     WHERE st.season_id = p_season_id
       AND NOT EXISTS (
         SELECT 1 FROM public.campeonato_driver_tier_history h
          WHERE h.season_id = p_season_id AND h.driver_id = st.driver_id
       )
  LOOP
    INSERT INTO public.campeonato_driver_tier_history (
      season_id, driver_id, brand_id, branch_id,
      starting_tier_id, ending_tier_id, ending_position, outcome
    )
    VALUES (
      p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
      v_d.tier_id, v_d.tier_id, v_d.position_in_tier,
      CASE WHEN v_d.tier_order = v_min_order AND v_d.position_in_tier = 1 THEN 'champion'
           ELSE 'stayed' END
    )
    ON CONFLICT DO NOTHING;
    v_stayed := v_stayed + 1;
  END LOOP;

  UPDATE public.campeonato_seasons
     SET promotion_applied_at = now(),
         updated_at = now()
   WHERE id = p_season_id;

  INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES ('promotion_applied', p_season_id, v_season.brand_id, v_season.branch_id,
          jsonb_build_object(
            'zero_relegated', v_zero_relegated,
            'relegated', v_relegated,
            'promoted', v_promoted,
            'stayed', v_stayed
          ));

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'zero_relegated', v_zero_relegated,
    'relegated', v_relegated,
    'promoted', v_promoted,
    'stayed', v_stayed
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_backfill_standings(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season public.campeonato_seasons%ROWTYPE;
  v_inserted int := 0;
  v_updated int := 0;
  v_skipped_no_membership int := 0;
  v_rec record;
  v_tier_id uuid;
  v_until timestamptz;
BEGIN
  SELECT * INTO v_season FROM public.campeonato_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_season.phase NOT IN ('classification') THEN
    RAISE EXCEPTION 'Backfill só permitido em fase classification (atual: %)', v_season.phase;
  END IF;

  v_until := LEAST(now(), v_season.classification_ends_at);

  FOR v_rec IN
    SELECT mr.driver_customer_id AS driver_id,
           COUNT(*)::int AS pts,
           COUNT(*) FILTER (
             WHERE public.campeonato_is_weekend_at(mr.finalized_at, v_season.branch_id)
           )::int AS weekend_pts,
           MAX(mr.finalized_at) AS last_at
    FROM public.machine_rides mr
    WHERE mr.branch_id = v_season.branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.driver_customer_id IS NOT NULL
      AND mr.finalized_at >= v_season.classification_starts_at
      AND mr.finalized_at <  v_until
    GROUP BY mr.driver_customer_id
  LOOP
    SELECT m.tier_id INTO v_tier_id
    FROM public.campeonato_tier_memberships m
    WHERE m.season_id = p_season_id AND m.driver_id = v_rec.driver_id
    LIMIT 1;

    IF v_tier_id IS NULL THEN
      v_skipped_no_membership := v_skipped_no_membership + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.campeonato_season_standings (
      season_id, driver_id, tier_id, points, weekend_rides_count,
      last_ride_at, qualified, relegated_auto
    )
    VALUES (
      p_season_id, v_rec.driver_id, v_tier_id,
      v_rec.pts, v_rec.weekend_pts,
      v_rec.last_at, false, false
    )
    ON CONFLICT (season_id, driver_id) DO UPDATE
      SET points = EXCLUDED.points,
          weekend_rides_count = EXCLUDED.weekend_rides_count,
          last_ride_at = EXCLUDED.last_ride_at,
          tier_id = COALESCE(public.campeonato_season_standings.tier_id, EXCLUDED.tier_id);

    IF FOUND THEN
      v_updated := v_updated + 1;
    ELSE
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  INSERT INTO public.campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES (
    'backfill_done',
    p_season_id,
    v_season.brand_id,
    v_season.branch_id,
    jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'skipped_no_membership', v_skipped_no_membership, 'until', v_until)
  );

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'inserted', v_inserted,
    'updated', v_updated,
    'skipped_no_membership', v_skipped_no_membership,
    'until', v_until
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_calculate_prizes(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season record;
  v_inserted int := 0;
  v_total_points int := 0;
BEGIN
  SELECT * INTO v_season FROM campeonato_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF v_season.phase <> 'finished' THEN
    RAISE EXCEPTION 'Temporada não está finalizada (phase=%)', v_season.phase;
  END IF;

  -- Para cada tier, calcula posições a partir dos brackets
  WITH tier_brackets AS (
    SELECT
      t.id AS tier_id,
      t.name AS tier_name,
      b.round,
      b.driver_a_id,
      b.driver_b_id,
      b.winner_id,
      CASE
        WHEN b.winner_id = b.driver_a_id THEN b.driver_b_id
        WHEN b.winner_id = b.driver_b_id THEN b.driver_a_id
        ELSE NULL
      END AS loser_id
    FROM campeonato_season_tiers t
    LEFT JOIN campeonato_brackets b ON b.tier_id = t.id
    WHERE t.season_id = p_season_id AND t.aborted_at IS NULL
  ),
  positions AS (
    -- champion: vencedor da final
    SELECT tier_id, tier_name, winner_id AS driver_id, 'champion'::text AS position
      FROM tier_brackets WHERE round = 'final' AND winner_id IS NOT NULL
    UNION ALL
    -- runner_up: perdedor da final
    SELECT tier_id, tier_name, loser_id, 'runner_up'
      FROM tier_brackets WHERE round = 'final' AND loser_id IS NOT NULL
    UNION ALL
    -- semifinalist: perdedores da semi
    SELECT tier_id, tier_name, loser_id, 'semifinalist'
      FROM tier_brackets WHERE round = 'sf' AND loser_id IS NOT NULL
    UNION ALL
    -- quarterfinalist: perdedores das quartas
    SELECT tier_id, tier_name, loser_id, 'quarterfinalist'
      FROM tier_brackets WHERE round = 'qf' AND loser_id IS NOT NULL
    UNION ALL
    -- r16: perdedores das oitavas
    SELECT tier_id, tier_name, loser_id, 'r16'
      FROM tier_brackets WHERE round = 'r16' AND loser_id IS NOT NULL
  ),
  with_prizes AS (
    SELECT
      p.tier_id,
      p.tier_name,
      p.driver_id,
      p.position,
      COALESCE(bp.points_reward, 0) AS points_reward
    FROM positions p
    LEFT JOIN brand_duelo_prizes bp
      ON bp.brand_id = v_season.brand_id
     AND bp.tier_name = p.tier_name
     AND bp.position = p.position
     AND (bp.branch_id IS NULL OR bp.branch_id = v_season.branch_id)
    WHERE p.driver_id IS NOT NULL
  ),
  inserted AS (
    INSERT INTO campeonato_prize_distributions
      (season_id, driver_id, brand_id, branch_id, tier_id, tier_name, position, points_awarded, status)
    SELECT
      v_season.id, wp.driver_id, v_season.brand_id, v_season.branch_id,
      wp.tier_id, wp.tier_name, wp.position, wp.points_reward, 'pending'
    FROM with_prizes wp
    WHERE wp.points_reward > 0
    ON CONFLICT (season_id, driver_id, tier_id, position) DO NOTHING
    RETURNING points_awarded
  )
  SELECT COUNT(*), COALESCE(SUM(points_awarded), 0) INTO v_inserted, v_total_points FROM inserted;

  -- Audit
  INSERT INTO campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES ('prize_calculated', p_season_id, v_season.brand_id, v_season.branch_id,
          jsonb_build_object('inserted', v_inserted, 'total_points', v_total_points));

  RETURN jsonb_build_object('inserted', v_inserted, 'total_points', v_total_points);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_cancel_prize(p_distribution_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dist record;
BEGIN
  SELECT * INTO v_dist FROM campeonato_prize_distributions WHERE id = p_distribution_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Distribuição não encontrada'; END IF;

  IF NOT (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (v_dist.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(), 'brand_admin'::app_role))
    OR (v_dist.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(), 'branch_admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_dist.status <> 'pending' THEN
    RAISE EXCEPTION 'Só é possível cancelar prêmios pendentes (status=%)', v_dist.status;
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Motivo é obrigatório (mínimo 5 caracteres)';
  END IF;

  UPDATE campeonato_prize_distributions
     SET status = 'cancelled', cancelled_reason = p_reason
   WHERE id = p_distribution_id;

  INSERT INTO campeonato_attempts_log (code, season_id, brand_id, branch_id, driver_id, details_json)
  VALUES ('prize_cancelled', v_dist.season_id, v_dist.brand_id, v_dist.branch_id, v_dist.driver_id,
          jsonb_build_object('distribution_id', p_distribution_id, 'reason', p_reason));

  RETURN jsonb_build_object('cancelled', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_cancel_season(p_season_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_phase text;
BEGIN
  SELECT brand_id, phase INTO v_brand, v_phase FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.campeonato_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN
    RAISE EXCEPTION 'Temporada já finalizada ou cancelada';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)';
  END IF;
  UPDATE public.campeonato_seasons
     SET phase = 'cancelled', cancelled_at = now(),
         cancellation_reason = p_reason, updated_at = now()
   WHERE id = p_season_id;
  INSERT INTO public.campeonato_attempts_log(code, season_id, brand_id, details_json)
    VALUES ('season_cancelled', p_season_id, v_brand,
      jsonb_build_object('reason', p_reason, 'cancelled_by', auth.uid()));
  RETURN jsonb_build_object('season_id', p_season_id, 'cancelled_at', now());
END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_change_engagement_format(p_brand_id uuid, p_new_format text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_previous text;
  v_allowed text[];
  v_model_id uuid;
BEGIN
  IF p_new_format NOT IN ('duelo', 'mass_duel', 'campeonato') THEN
    RAISE EXCEPTION 'Formato inválido: %', p_new_format;
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR (
      p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
      AND public.has_role(auth.uid(), 'brand_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Sem autorização para alterar formato';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.campeonato_seasons
    WHERE brand_id = p_brand_id
      AND phase NOT IN ('finished','cancelled')
      AND cancelled_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Não é possível trocar formato com temporada ativa. Aguarde finalização ou cancele a temporada.';
  END IF;

  SELECT id INTO v_model_id
  FROM public.business_models
  WHERE key = 'duelo_motorista'
  LIMIT 1;

  IF v_model_id IS NULL THEN
    RAISE EXCEPTION 'Modelo de negócio duelo_motorista não cadastrado.';
  END IF;

  SELECT bbm.engagement_format, bbm.allowed_engagement_formats
    INTO v_previous, v_allowed
  FROM public.brand_business_models bbm
  WHERE bbm.brand_id = p_brand_id
    AND bbm.business_model_id = v_model_id
  LIMIT 1;

  IF v_allowed IS NOT NULL AND p_new_format <> ALL (v_allowed) THEN
    RAISE EXCEPTION 'Formato % não está liberado para esta marca. Fale com o suporte.', p_new_format;
  END IF;

  INSERT INTO public.brand_business_models (brand_id, business_model_id, is_enabled, engagement_format)
    VALUES (p_brand_id, v_model_id, true, p_new_format)
  ON CONFLICT (brand_id, business_model_id)
    DO UPDATE SET engagement_format = EXCLUDED.engagement_format,
                  is_enabled = true,
                  updated_at = now();

  RETURN jsonb_build_object('previous', v_previous, 'new', p_new_format);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_confirm_prize_distribution(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season record;
  v_dist record;
  v_total_drivers int := 0;
  v_total_points int := 0;
  v_ledger_id uuid;
BEGIN
  SELECT * INTO v_season FROM campeonato_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;

  IF NOT (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (v_season.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(), 'brand_admin'::app_role))
    OR (v_season.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(), 'branch_admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar prêmios desta temporada';
  END IF;

  FOR v_dist IN
    SELECT * FROM campeonato_prize_distributions
    WHERE season_id = p_season_id AND status = 'pending'
    FOR UPDATE
  LOOP
    INSERT INTO points_ledger
      (brand_id, branch_id, customer_id, entry_type, points_amount, money_amount,
       reason, reference_type, reference_id, created_by_user_id)
    VALUES
      (v_dist.brand_id, v_dist.branch_id, v_dist.driver_id, 'CREDIT'::ledger_entry_type,
       v_dist.points_awarded, 0,
       'Prêmio Campeonato — ' || v_dist.tier_name || ' / ' || v_dist.position,
       'CAMPEONATO_PRIZE'::ledger_reference_type, v_dist.id, auth.uid())
    RETURNING id INTO v_ledger_id;

    UPDATE customers
       SET points_balance = points_balance + v_dist.points_awarded
     WHERE id = v_dist.driver_id;

    UPDATE campeonato_prize_distributions
       SET status = 'confirmed',
           confirmed_by = auth.uid(),
           confirmed_at = now(),
           points_ledger_id = v_ledger_id
     WHERE id = v_dist.id;

    -- HOOK C.5: notificação prize_received
    BEGIN
      INSERT INTO public.campeonato_notifications
        (driver_id, brand_id, season_id, event_type, title, message, action_url)
      VALUES (
        v_dist.driver_id, v_dist.brand_id, p_season_id, 'prize_received',
        'Você recebeu um prêmio! 🎁',
        'Recebeu ' || v_dist.points_awarded || ' pontos pelo Campeonato (' ||
          v_dist.tier_name || ' / ' || v_dist.position || ').',
        '/driver?campeonato=1'
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    v_total_drivers := v_total_drivers + 1;
    v_total_points := v_total_points + v_dist.points_awarded;
  END LOOP;

  UPDATE campeonato_champions SET prizes_distributed = true WHERE season_id = p_season_id;

  INSERT INTO campeonato_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES ('prize_distributed', p_season_id, v_season.brand_id, v_season.branch_id,
          jsonb_build_object('total_drivers', v_total_drivers, 'total_points', v_total_points,
                             'confirmed_by', auth.uid()));

  RETURN jsonb_build_object(
    'total_drivers', v_total_drivers,
    'total_points', v_total_points,
    'confirmed_at', now()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_create_brackets_within_tier(p_season_id uuid, p_tier_id uuid, p_round text, p_top_n integer, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seeds uuid[];
  v_count int;
  v_i int;
  v_a uuid;
  v_b uuid;
  v_brackets int := 0;
BEGIN
  WITH ranked AS (
    SELECT st.driver_id,
           ROW_NUMBER() OVER (
             ORDER BY st.points DESC NULLS LAST,
                      st.weekend_rides_count DESC NULLS LAST,
                      st.last_ride_at ASC NULLS LAST
           ) AS pos
    FROM public.campeonato_season_standings st
    WHERE st.season_id = p_season_id
      AND st.tier_id = p_tier_id
  ),
  upd AS (
    UPDATE public.campeonato_season_standings st
       SET position_in_tier = r.pos,
           qualified = (r.pos <= p_top_n)
      FROM ranked r
     WHERE st.season_id = p_season_id
       AND st.tier_id = p_tier_id
       AND st.driver_id = r.driver_id
     RETURNING st.driver_id, r.pos
  )
  SELECT array_agg(driver_id ORDER BY pos) INTO v_seeds
    FROM upd
   WHERE pos <= p_top_n;

  v_count := COALESCE(array_length(v_seeds, 1), 0);
  IF v_count < 2 THEN
    RETURN 0;
  END IF;

  FOR v_i IN 1 .. (v_count / 2) LOOP
    v_a := v_seeds[v_i];
    v_b := v_seeds[v_count - v_i + 1];
    INSERT INTO public.campeonato_brackets (
      season_id, round, slot, driver_a_id, driver_b_id,
      driver_a_rides, driver_b_rides, starts_at, ends_at, tier_id, bracket_scope
    )
    VALUES (
      p_season_id, p_round, v_i, v_a, v_b,
      0, 0, p_starts_at, p_ends_at, p_tier_id, 'within_tier'
    );
    v_brackets := v_brackets + 1;
  END LOOP;

  RETURN v_brackets;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_get_allowed_formats(p_brand_id uuid)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(bbm.allowed_engagement_formats, ARRAY['duelo','mass_duel','campeonato']::text[])
  FROM public.brand_business_models bbm
  JOIN public.business_models bm ON bm.id = bbm.business_model_id
  WHERE bbm.brand_id = p_brand_id
    AND bm.key = 'duelo_motorista'
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_get_engagement_format(p_brand_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT bbm.engagement_format
       FROM public.brand_business_models bbm
       JOIN public.business_models bm ON bm.id = bbm.business_model_id
      WHERE bbm.brand_id = p_brand_id
        AND bm.key = 'duelo_motorista'
        AND bbm.is_enabled = true
      LIMIT 1),
    'duelo'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_guard_tier_membership_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_allow text;
BEGIN
  IF NEW.source = 'seed' THEN
    BEGIN
      v_allow := current_setting('app.allow_tier_seed', true);
    EXCEPTION WHEN OTHERS THEN
      v_allow := NULL;
    END;
    IF v_allow IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Inserção em campeonato_tier_memberships com source=seed só é permitida via RPC campeonato_seed_initial_tier_memberships';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_increment_bracket_rides()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_finalized_at timestamptz;
BEGIN
  IF NEW.ride_status IS DISTINCT FROM 'FINALIZED' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN
    RETURN NEW;
  END IF;
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_finalized_at := COALESCE(NEW.finalized_at, now());

  UPDATE public.campeonato_brackets b
     SET driver_a_rides = b.driver_a_rides + 1
   WHERE b.driver_a_id = NEW.driver_customer_id
     AND b.starts_at <= v_finalized_at
     AND b.ends_at   >  v_finalized_at
     AND b.winner_id IS NULL
     AND EXISTS (
       SELECT 1 FROM public.campeonato_seasons s
       WHERE s.id = b.season_id AND s.branch_id = NEW.branch_id
     );

  UPDATE public.campeonato_brackets b
     SET driver_b_rides = b.driver_b_rides + 1
   WHERE b.driver_b_id = NEW.driver_customer_id
     AND b.starts_at <= v_finalized_at
     AND b.ends_at   >  v_finalized_at
     AND b.winner_id IS NULL
     AND EXISTS (
       SELECT 1 FROM public.campeonato_seasons s
       WHERE s.id = b.season_id AND s.branch_id = NEW.branch_id
     );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_is_weekend_at(p_finalized_at timestamp with time zone, p_branch_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(DOW FROM p_finalized_at AT TIME ZONE
           COALESCE((SELECT timezone FROM public.branches WHERE id = p_branch_id),
                    'America/Sao_Paulo'))::int IN (5, 6, 0);
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_materialize_and_seed_season(p_season_id uuid, p_caller uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_tenant_id uuid;
  v_tiers_config jsonb;
  v_already_seeded timestamptz;
  v_existing_tiers integer;
  v_serie jsonb;
  v_seed_result jsonb;
  v_caller uuid := COALESCE(p_caller, auth.uid());
  v_authorized boolean := false;
  v_members_count integer;
  v_standings_count integer;
  v_backfill integer := 0;
BEGIN
  SELECT ds.brand_id, ds.branch_id, b.tenant_id, ds.tiers_config_json, ds.tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_tenant_id, v_tiers_config, v_already_seeded
  FROM public.campeonato_seasons ds
  LEFT JOIN public.brands b ON b.id = ds.brand_id
  WHERE ds.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_caller IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = v_caller
        AND (
          ur.role = 'root_admin'
          OR (ur.role = 'tenant_admin' AND (ur.tenant_id = v_tenant_id OR ur.brand_id = v_brand_id))
          OR (ur.role = 'brand_admin' AND ur.brand_id = v_brand_id)
          OR (ur.role = 'branch_admin' AND v_branch_id IS NOT NULL AND ur.branch_id = v_branch_id)
        )
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  -- IDEMPOTÊNCIA: já foi semeada → não é erro
  IF v_already_seeded IS NOT NULL THEN
    -- Backfill defensivo de standings caso a corrida anterior tenha falhado entre seed e standings
    PERFORM set_config('app.allow_tier_seed', 'on', true);
    WITH ins AS (
      INSERT INTO public.campeonato_season_standings (
        season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto
      )
      SELECT tm.season_id, tm.driver_id, tm.tier_id, 0, 0, false, false
      FROM public.campeonato_tier_memberships tm
      WHERE tm.season_id = p_season_id
      ON CONFLICT (season_id, driver_id) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_backfill FROM ins;

    SELECT COUNT(*) INTO v_members_count FROM public.campeonato_tier_memberships WHERE season_id = p_season_id;
    SELECT COUNT(*) INTO v_standings_count FROM public.campeonato_season_standings WHERE season_id = p_season_id;

    RETURN jsonb_build_object(
      'ok', true,
      'already_seeded', true,
      'season_id', p_season_id,
      'seeded_at', v_already_seeded,
      'members_count', v_members_count,
      'standings_count', v_standings_count,
      'standings_backfilled', v_backfill
    );
  END IF;

  SELECT COUNT(*) INTO v_existing_tiers
  FROM public.campeonato_season_tiers
  WHERE season_id = p_season_id;

  IF v_existing_tiers = 0 THEN
    IF v_tiers_config IS NULL OR v_tiers_config->'series' IS NULL THEN
      RAISE EXCEPTION 'Temporada % sem tiers_config_json válido', p_season_id;
    END IF;

    FOR v_serie IN SELECT * FROM jsonb_array_elements(v_tiers_config->'series')
    LOOP
      INSERT INTO public.campeonato_season_tiers (
        season_id, brand_id, branch_id, name,
        tier_order, target_size, promotion_count, relegation_count
      ) VALUES (
        p_season_id, v_brand_id, v_branch_id,
        v_serie->>'name',
        COALESCE((v_serie->>'tier_order')::int, 1),
        COALESCE((v_serie->>'target_size')::int, (v_serie->>'size')::int, 16),
        COALESCE((v_serie->>'promotion_count')::int, (v_serie->>'promote_count')::int, 0),
        COALESCE((v_serie->>'relegation_count')::int, (v_serie->>'relegate_count')::int, 0)
      )
      ON CONFLICT (season_id, tier_order) DO NOTHING;
    END LOOP;
  END IF;

  IF v_caller IS NOT NULL THEN
    PERFORM set_config('request.jwt.claim.sub', v_caller::text, true);
  END IF;

  v_seed_result := public.campeonato_seed_initial_tier_memberships(p_season_id);

  RETURN jsonb_build_object(
    'ok', true,
    'season_id', p_season_id,
    'tiers_materialized', v_existing_tiers = 0,
    'seed_result', v_seed_result
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_move_driver_to_tier(p_season_id uuid, p_driver_id uuid, p_target_tier_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_phase text;
  v_current_tier_id uuid;
  v_target_brand_id uuid;
  v_target_season_id uuid;
BEGIN
  -- Carrega temporada
  SELECT s.brand_id, s.branch_id, s.phase
    INTO v_brand_id, v_branch_id, v_phase
  FROM public.campeonato_seasons s
  WHERE s.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Autorização
  IF NOT public.campeonato_admin_can_manage(v_brand_id) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar esta temporada' USING ERRCODE = '42501';
  END IF;

  -- Só durante classificação
  IF v_phase IS DISTINCT FROM 'classification' THEN
    RAISE EXCEPTION 'A distribuição manual só é permitida durante a fase de classificação (fase atual: %)', v_phase
      USING ERRCODE = 'P0001';
  END IF;

  -- Valida tier alvo (mesma temporada e mesma marca)
  SELECT t.brand_id, t.season_id
    INTO v_target_brand_id, v_target_season_id
  FROM public.duelo_tiers t
  WHERE t.id = p_target_tier_id;

  IF v_target_brand_id IS NULL THEN
    RAISE EXCEPTION 'Série de destino não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_target_season_id IS DISTINCT FROM p_season_id OR v_target_brand_id IS DISTINCT FROM v_brand_id THEN
    RAISE EXCEPTION 'Série de destino não pertence à temporada informada' USING ERRCODE = 'P0001';
  END IF;

  -- Tier atual
  SELECT m.tier_id INTO v_current_tier_id
  FROM public.campeonato_tier_memberships m
  WHERE m.season_id = p_season_id AND m.driver_id = p_driver_id;

  IF v_current_tier_id IS NULL THEN
    RAISE EXCEPTION 'Motorista não está nesta temporada' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_tier_id = p_target_tier_id THEN
    RETURN jsonb_build_object('moved', false, 'reason', 'already_in_tier');
  END IF;

  -- Atualiza membership
  UPDATE public.campeonato_tier_memberships
     SET tier_id = p_target_tier_id,
         source = 'manual_move'
   WHERE season_id = p_season_id
     AND driver_id = p_driver_id;

  -- Atualiza standings (se existir registro)
  UPDATE public.campeonato_season_standings
     SET tier_id = p_target_tier_id
   WHERE season_id = p_season_id
     AND driver_id = p_driver_id;

  -- Registra histórico
  INSERT INTO public.campeonato_driver_tier_history (
    brand_id, branch_id, season_id, driver_id,
    from_tier_id, to_tier_id, outcome, reason
  ) VALUES (
    v_brand_id, v_branch_id, p_season_id, p_driver_id,
    v_current_tier_id, p_target_tier_id, 'manual_moved', p_reason
  );

  RETURN jsonb_build_object(
    'moved', true,
    'from_tier_id', v_current_tier_id,
    'to_tier_id', p_target_tier_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_mover_motoristas_em_lote(p_season_id uuid, p_driver_ids uuid[], p_target_tier_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_target_tier RECORD;
  v_user_id uuid := auth.uid();
  v_driver_id uuid;
  v_moved int := 0;
  v_failed jsonb := '[]'::jsonb;
  v_existing_participant RECORD;
BEGIN
  -- Validate season exists and grab scope
  SELECT s.brand_id, s.branch_id INTO v_brand_id, v_branch_id
  FROM campeonato_seasons s
  WHERE s.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Authorization: must be admin of the brand
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = v_user_id
      AND ur.brand_id = v_brand_id
      AND ur.role IN ('BRAND_ADMIN','TENANT_ADMIN','ROOT_ADMIN','BRANCH_ADMIN')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar essa temporada' USING ERRCODE = '42501';
  END IF;

  -- Validate target tier belongs to the season
  SELECT t.id, t.tier_name, t.target_size
  INTO v_target_tier
  FROM duelo_tiers t
  WHERE t.id = p_target_tier_id AND t.season_id = p_season_id;

  IF v_target_tier.id IS NULL THEN
    RAISE EXCEPTION 'Série de destino não pertence à temporada' USING ERRCODE = 'P0002';
  END IF;

  -- Iterate drivers
  FOREACH v_driver_id IN ARRAY p_driver_ids LOOP
    BEGIN
      -- Check if driver already participates in the season (any tier)
      SELECT p.id, p.tier_id
      INTO v_existing_participant
      FROM duelo_participants p
      WHERE p.season_id = p_season_id AND p.customer_id = v_driver_id
      LIMIT 1;

      IF v_existing_participant.id IS NOT NULL THEN
        -- Move: update tier
        UPDATE duelo_participants
        SET tier_id = p_target_tier_id,
            assignment_source = 'manual',
            updated_at = now()
        WHERE id = v_existing_participant.id;
      ELSE
        -- Insert new participant
        INSERT INTO duelo_participants (
          season_id, tier_id, customer_id, brand_id, branch_id,
          assignment_source, joined_at
        ) VALUES (
          p_season_id, p_target_tier_id, v_driver_id, v_brand_id, v_branch_id,
          'manual', now()
        );
      END IF;

      v_moved := v_moved + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed || jsonb_build_object(
        'driver_id', v_driver_id,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'moved', v_moved,
    'failed', v_failed,
    'target_tier_id', p_target_tier_id,
    'target_tier_name', v_target_tier.tier_name
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_notify_season_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season record;
  v_tier_name text;
BEGIN
  IF NEW.source NOT IN ('seed','manual_add') THEN
    RETURN NEW;
  END IF;

  SELECT s.*, t.name AS tier_name
    INTO v_season
    FROM public.campeonato_seasons s
    JOIN public.campeonato_season_tiers t ON t.id = NEW.tier_id
   WHERE s.id = NEW.season_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  INSERT INTO public.campeonato_notifications
    (driver_id, brand_id, season_id, event_type, title, message, action_url)
  VALUES (
    NEW.driver_id,
    v_season.brand_id,
    v_season.id,
    'season_created',
    'Nova temporada do Campeonato',
    'Você foi alocado na ' || COALESCE(v_season.tier_name, 'série') || '. Boa sorte!',
    '/driver?campeonato=1'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_pause_season(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_phase text;
BEGIN
  SELECT brand_id, phase INTO v_brand, v_phase FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.campeonato_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN
    RAISE EXCEPTION 'Temporada não pode ser pausada nesta fase';
  END IF;
  UPDATE public.campeonato_seasons SET paused_at = now(), updated_at = now()
   WHERE id = p_season_id AND paused_at IS NULL;
  INSERT INTO public.campeonato_attempts_log(code, season_id, brand_id, details_json)
    VALUES ('season_paused', p_season_id, v_brand,
      jsonb_build_object('paused_by', auth.uid()));
  RETURN jsonb_build_object('paused_at', now());
END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_prize_dist_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_reconcile_standings(p_hours integer DEFAULT 48)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record; v_expected int; v_expected_last timestamptz; v_expected_weekend int;
  v_checked int := 0; v_fixed int := 0;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT st.season_id, st.driver_id, s.brand_id, s.branch_id,
           s.classification_starts_at, s.classification_ends_at
      FROM public.campeonato_season_standings st
      JOIN public.campeonato_seasons s ON s.id = st.season_id
     WHERE s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
       AND public.campeonato_get_engagement_format(s.brand_id) = 'campeonato'
       AND EXISTS (SELECT 1 FROM public.machine_rides mr
                    WHERE mr.driver_customer_id = st.driver_id
                      AND mr.branch_id = s.branch_id
                      AND mr.ride_status = 'FINALIZED'
                      AND mr.finalized_at >= now() - (p_hours||' hours')::interval)
  LOOP
    v_checked := v_checked + 1;
    SELECT COUNT(*)::int,
           MAX(mr.finalized_at),
           COALESCE(SUM(CASE WHEN public.campeonato_is_weekend_at(mr.finalized_at, mr.branch_id) THEN 1 ELSE 0 END), 0)::int
      INTO v_expected, v_expected_last, v_expected_weekend
      FROM public.machine_rides mr
     WHERE mr.driver_customer_id = v_rec.driver_id
       AND mr.branch_id = v_rec.branch_id
       AND mr.ride_status = 'FINALIZED'
       AND mr.finalized_at >= v_rec.classification_starts_at
       AND mr.finalized_at <  v_rec.classification_ends_at;
    UPDATE public.campeonato_season_standings st
       SET points = v_expected,
           weekend_rides_count = v_expected_weekend,
           last_ride_at = v_expected_last
     WHERE st.season_id = v_rec.season_id AND st.driver_id = v_rec.driver_id
       AND (st.points <> v_expected
         OR st.weekend_rides_count <> v_expected_weekend
         OR st.last_ride_at IS DISTINCT FROM v_expected_last);
    IF FOUND THEN v_fixed := v_fixed + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('checked', v_checked, 'fixed', v_fixed, 'window_hours', p_hours);
END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_remove_driver_from_season(p_season_id uuid, p_driver_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_phase text;
  v_current_tier_id uuid;
  v_has_brackets boolean;
BEGIN
  SELECT s.brand_id, s.branch_id, s.phase
    INTO v_brand_id, v_branch_id, v_phase
  FROM public.campeonato_seasons s
  WHERE s.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.campeonato_admin_can_manage(v_brand_id) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar esta temporada' USING ERRCODE = '42501';
  END IF;

  IF v_phase IS DISTINCT FROM 'classification' THEN
    RAISE EXCEPTION 'A remoção só é permitida durante a fase de classificação (fase atual: %)', v_phase
      USING ERRCODE = 'P0001';
  END IF;

  SELECT m.tier_id INTO v_current_tier_id
  FROM public.campeonato_tier_memberships m
  WHERE m.season_id = p_season_id AND m.driver_id = p_driver_id;

  IF v_current_tier_id IS NULL THEN
    RAISE EXCEPTION 'Motorista não está nesta temporada' USING ERRCODE = 'P0002';
  END IF;

  -- Bloqueia se motorista já tem partida no chaveamento desta temporada
  SELECT EXISTS (
    SELECT 1 FROM public.campeonato_brackets b
    WHERE b.season_id = p_season_id
      AND (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
  ) INTO v_has_brackets;

  IF v_has_brackets THEN
    RAISE EXCEPTION 'Motorista já está em uma chave do mata-mata e não pode ser removido' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.campeonato_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id;

  DELETE FROM public.campeonato_season_standings
   WHERE season_id = p_season_id AND driver_id = p_driver_id;

  INSERT INTO public.campeonato_driver_tier_history (
    brand_id, branch_id, season_id, driver_id,
    from_tier_id, to_tier_id, outcome, reason
  ) VALUES (
    v_brand_id, v_branch_id, p_season_id, p_driver_id,
    v_current_tier_id, NULL, 'manual_removed', p_reason
  );

  RETURN jsonb_build_object('removed', true, 'from_tier_id', v_current_tier_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_resume_season(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.campeonato_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  UPDATE public.campeonato_seasons SET paused_at = NULL, updated_at = now()
   WHERE id = p_season_id;
  INSERT INTO public.campeonato_attempts_log(code, season_id, brand_id, details_json)
    VALUES ('season_resumed', p_season_id, v_brand,
      jsonb_build_object('resumed_by', auth.uid()));
  RETURN jsonb_build_object('resumed_at', now());
END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_seed_initial_tier_memberships(p_season_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_classification_starts_at timestamptz;
  v_already_seeded timestamptz;
  v_prior_season_id uuid;
  v_seeded_count integer := 0;
  v_by_tier jsonb := '{}'::jsonb;
  v_low_tier_id uuid;
  v_standings_inserted integer := 0;
BEGIN
  SELECT brand_id, branch_id, classification_starts_at, tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_classification_starts_at, v_already_seeded
  FROM public.campeonato_seasons
  WHERE id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR v_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR v_branch_id IN (SELECT public.get_user_branch_ids(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  IF v_already_seeded IS NOT NULL THEN
    RAISE EXCEPTION 'Esta temporada já foi semeada em %', v_already_seeded;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campeonato_season_tiers WHERE season_id = p_season_id) THEN
    RAISE EXCEPTION 'Temporada % não tem séries configuradas', p_season_id;
  END IF;

  SELECT id INTO v_low_tier_id
  FROM public.campeonato_season_tiers
  WHERE season_id = p_season_id
  ORDER BY tier_order DESC
  LIMIT 1;

  SELECT ds.id INTO v_prior_season_id
  FROM public.campeonato_seasons ds
  WHERE ds.branch_id = v_branch_id
    AND ds.id <> p_season_id
    AND ds.tier_seeding_completed_at IS NOT NULL
    AND ds.classification_starts_at < v_classification_starts_at
  ORDER BY ds.classification_starts_at DESC
  LIMIT 1;

  PERFORM set_config('app.allow_tier_seed', 'on', true);

  WITH elegiveis AS (
    SELECT id AS driver_id, created_at
    FROM public.customers
    WHERE brand_id  = v_brand_id
      AND branch_id = v_branch_id
      AND is_active = true
      AND name ILIKE '%[MOTORISTA]%'
  ),
  metricas_90d AS (
    SELECT
      e.driver_id,
      e.created_at,
      COUNT(r.id)                       AS rides_90d,
      COALESCE(SUM(r.ride_value), 0)    AS total_value_90d,
      MAX(r.finalized_at)               AS last_finalized_at
    FROM elegiveis e
    LEFT JOIN public.machine_rides r
      ON r.driver_customer_id = e.driver_id
     AND r.branch_id          = v_branch_id
     AND r.ride_status        = 'FINALIZED'
     AND r.finalized_at       >= now() - interval '90 days'
    GROUP BY e.driver_id, e.created_at
  ),
  ranqueados AS (
    SELECT
      m.driver_id,
      m.rides_90d,
      m.total_value_90d,
      m.last_finalized_at,
      m.created_at,
      ROW_NUMBER() OVER (
        ORDER BY
          m.rides_90d         DESC,
          m.total_value_90d   DESC,
          m.last_finalized_at DESC NULLS LAST,
          m.created_at        ASC
      ) AS rn
    FROM metricas_90d m
    WHERE m.rides_90d >= 1
  ),
  tiers_ord AS (
    SELECT
      id AS tier_id,
      name AS tier_name,
      tier_order,
      target_size,
      SUM(target_size) OVER (ORDER BY tier_order) AS cumul_top
    FROM public.campeonato_season_tiers
    WHERE season_id = p_season_id
  ),
  prior_tier_por_driver AS (
    SELECT
      m_prev.driver_id,
      t_new.id AS tier_id
    FROM public.campeonato_tier_memberships m_prev
    JOIN public.campeonato_season_tiers t_prev
      ON t_prev.id = m_prev.tier_id
    JOIN public.campeonato_season_tiers t_new
      ON t_new.season_id = p_season_id
     AND t_new.name      = t_prev.name
    WHERE v_prior_season_id IS NOT NULL
      AND m_prev.season_id = v_prior_season_id
  ),
  alocacao AS (
    SELECT
      r.driver_id,
      COALESCE(
        (SELECT pt.tier_id FROM prior_tier_por_driver pt WHERE pt.driver_id = r.driver_id),
        COALESCE(
          (SELECT t.tier_id FROM tiers_ord t WHERE r.rn <= t.cumul_top ORDER BY t.tier_order LIMIT 1),
          v_low_tier_id
        )
      ) AS tier_id
    FROM ranqueados r
  ),
  inserted AS (
    INSERT INTO public.campeonato_tier_memberships (
      season_id, tier_id, driver_id, brand_id, branch_id, source
    )
    SELECT p_season_id, a.tier_id, a.driver_id, v_brand_id, v_branch_id, 'seed'
    FROM alocacao a
    WHERE a.tier_id IS NOT NULL
    ON CONFLICT (season_id, driver_id) DO NOTHING
    RETURNING tier_id, driver_id
  ),
  agg AS (
    SELECT i.tier_id, t.name AS tier_name, COUNT(*) AS cnt
    FROM inserted i
    JOIN public.campeonato_season_tiers t ON t.id = i.tier_id
    GROUP BY i.tier_id, t.name
  )
  SELECT
    COALESCE(SUM(cnt), 0)::int,
    COALESCE(jsonb_object_agg(tier_name, cnt), '{}'::jsonb)
  INTO v_seeded_count, v_by_tier
  FROM agg;

  -- Cria linhas iniciais de ranking para todos os motoristas alocados (idempotente)
  WITH ins AS (
    INSERT INTO public.campeonato_season_standings (
      season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto
    )
    SELECT tm.season_id, tm.driver_id, tm.tier_id, 0, 0, false, false
    FROM public.campeonato_tier_memberships tm
    WHERE tm.season_id = p_season_id
    ON CONFLICT (season_id, driver_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_standings_inserted FROM ins;

  UPDATE public.campeonato_seasons
     SET tier_seeding_completed_at = now()
   WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'seeded_count', COALESCE(v_seeded_count, 0),
    'standings_seeded', v_standings_inserted,
    'low_tier_overflow_count', 0,
    'by_tier', COALESCE(v_by_tier, '{}'::jsonb),
    'inherited_from_prior_season', v_prior_season_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_set_allowed_formats(p_brand_id uuid, p_formats text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_format text;
  v_fallback text;
BEGIN
  -- Apenas Root pode mudar
  IF NOT public.has_role(auth.uid(), 'root_admin') THEN
    RAISE EXCEPTION 'Apenas administradores root podem alterar formatos liberados.';
  END IF;

  IF p_formats IS NULL OR array_length(p_formats, 1) IS NULL OR array_length(p_formats, 1) < 1 THEN
    RAISE EXCEPTION 'Pelo menos 1 formato deve estar liberado.';
  END IF;

  -- Pega o formato ativo atual da marca
  SELECT bbm.engagement_format
    INTO v_current_format
  FROM public.brand_business_models bbm
  JOIN public.business_models bm ON bm.id = bbm.business_model_id
  WHERE bbm.brand_id = p_brand_id
    AND bm.key = 'duelo_motorista'
  LIMIT 1;

  -- Se o formato ativo não estiver na nova lista, troca para o primeiro disponível
  IF v_current_format IS NOT NULL AND v_current_format <> ALL (p_formats) THEN
    v_fallback := p_formats[1];
    UPDATE public.brand_business_models bbm
       SET engagement_format = v_fallback,
           allowed_engagement_formats = p_formats,
           updated_at = now()
      FROM public.business_models bm
     WHERE bbm.business_model_id = bm.id
       AND bm.key = 'duelo_motorista'
       AND bbm.brand_id = p_brand_id;
  ELSE
    UPDATE public.brand_business_models bbm
       SET allowed_engagement_formats = p_formats,
           updated_at = now()
      FROM public.business_models bm
     WHERE bbm.business_model_id = bm.id
       AND bm.key = 'duelo_motorista'
       AND bbm.brand_id = p_brand_id;
  END IF;

  RETURN jsonb_build_object(
    'brand_id', p_brand_id,
    'allowed_formats', p_formats,
    'previous_active', v_current_format,
    'new_active', COALESCE(v_fallback, v_current_format),
    'fallback_applied', v_fallback IS NOT NULL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_sync_tier_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.campeonato_driver_tier_history (
    season_id, driver_id, brand_id, branch_id,
    starting_tier_id, ending_tier_id, outcome
  )
  VALUES (
    NEW.season_id, NEW.driver_id, NEW.brand_id, NEW.branch_id,
    NEW.tier_id, NEW.tier_id, 'stayed'
  )
  ON CONFLICT (season_id, driver_id) DO UPDATE
    SET ending_tier_id = EXCLUDED.ending_tier_id,
        updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_update_prize(p_brand_id uuid, p_tier_name text, p_position text, p_new_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_old int;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF p_new_points < 0 OR p_new_points > 100000 THEN
    RAISE EXCEPTION 'Pontos fora do intervalo permitido (0 a 100000)';
  END IF;
  SELECT points_reward INTO v_old FROM public.brand_duelo_prizes
    WHERE brand_id = p_brand_id AND tier_name = p_tier_name AND position = p_position;
  IF v_old IS NULL THEN
    INSERT INTO public.brand_duelo_prizes(brand_id, tier_name, position, points_reward, updated_by)
      VALUES (p_brand_id, p_tier_name, p_position, p_new_points, auth.uid());
  ELSE
    UPDATE public.brand_duelo_prizes
       SET points_reward = p_new_points, updated_by = auth.uid(), updated_at = now()
     WHERE brand_id = p_brand_id AND tier_name = p_tier_name AND position = p_position;
  END IF;
  INSERT INTO public.campeonato_attempts_log(code, brand_id, details_json)
    VALUES ('prize_adjusted', p_brand_id,
      jsonb_build_object('tier_name', p_tier_name, 'position', p_position,
        'old_value', v_old, 'new_value', p_new_points, 'changed_by', auth.uid()));
  RETURN jsonb_build_object('previous', v_old, 'new', p_new_points);
END; $function$
;

CREATE OR REPLACE FUNCTION public.campeonato_update_standings_from_ride()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id uuid;
  v_tier_id uuid;
  v_finalized_at timestamptz;
  v_is_weekend boolean;
  v_brand_id uuid;
BEGIN
  IF NEW.ride_status <> 'FINALIZED' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN RETURN NEW; END IF;
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;
  SELECT brand_id INTO v_brand_id FROM public.branches WHERE id = NEW.branch_id;
  IF public.campeonato_get_engagement_format(v_brand_id) <> 'campeonato' THEN
    RETURN NEW;
  END IF;
  v_finalized_at := COALESCE(NEW.finalized_at, now());
  v_is_weekend := public.campeonato_is_weekend_at(v_finalized_at, NEW.branch_id);
  SELECT s.id INTO v_season_id
    FROM public.campeonato_seasons s
   WHERE s.branch_id = NEW.branch_id
     AND s.phase = 'classification'
     AND s.paused_at IS NULL
     AND v_finalized_at >= s.classification_starts_at
     AND v_finalized_at <  s.classification_ends_at
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season_id IS NULL THEN RETURN NEW; END IF;
  SELECT tm.tier_id INTO v_tier_id FROM public.campeonato_tier_memberships tm
   WHERE tm.season_id = v_season_id AND tm.driver_id = NEW.driver_customer_id LIMIT 1;
  IF v_tier_id IS NULL THEN
    INSERT INTO public.campeonato_attempts_log(code, season_id, driver_id, details_json)
      VALUES ('no_membership', v_season_id, NEW.driver_customer_id, jsonb_build_object('ride_id', NEW.id));
    RETURN NEW;
  END IF;
  INSERT INTO public.campeonato_season_standings(
    season_id, driver_id, tier_id, points, weekend_rides_count, last_ride_at, qualified, relegated_auto)
  VALUES (v_season_id, NEW.driver_customer_id, v_tier_id, 1,
    CASE WHEN v_is_weekend THEN 1 ELSE 0 END, v_finalized_at, false, false)
  ON CONFLICT (season_id, driver_id) DO UPDATE
     SET points = public.campeonato_season_standings.points + 1,
         weekend_rides_count = public.campeonato_season_standings.weekend_rides_count
                             + CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
         last_ride_at = GREATEST(
           COALESCE(public.campeonato_season_standings.last_ride_at, EXCLUDED.last_ride_at),
           EXCLUDED.last_ride_at),
         tier_id = COALESCE(public.campeonato_season_standings.tier_id, EXCLUDED.tier_id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.campeonato_validate_tier_config()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.target_size < (NEW.promotion_count + NEW.relegation_count) THEN
    RAISE EXCEPTION 'target_size (%) deve ser >= promotion_count (%) + relegation_count (%)',
      NEW.target_size, NEW.promotion_count, NEW.relegation_count;
  END IF;
  IF NEW.tier_order < 1 THEN
    RAISE EXCEPTION 'tier_order deve ser >= 1';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_stuck_driver_import_jobs(p_max_age_minutes integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_marked integer;
BEGIN
  IF p_max_age_minutes IS NULL OR p_max_age_minutes < 5 THEN
    RAISE EXCEPTION 'p_max_age_minutes must be >= 5';
  END IF;
  UPDATE public.driver_import_jobs SET
    status = 'error',
    finished_at = now(),
    errors_json = errors_json || jsonb_build_array(
      jsonb_build_object('linha', 0, 'motivo',
        format('Job marcado como erro automaticamente: rodando há mais de %s min sem progresso (provável crash do edge function).', p_max_age_minutes))
    )
  WHERE status = 'running' AND started_at < now() - (p_max_age_minutes || ' minutes')::interval;
  GET DIAGNOSTICS v_marked = ROW_COUNT;
  RETURN v_marked;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.collect_duel_ride_ids(p_customer_id uuid, p_branch_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(array_agg(id ORDER BY finalized_at), '{}')
  FROM machine_rides
  WHERE driver_customer_id = p_customer_id
    AND branch_id = p_branch_id
    AND ride_status = 'FINALIZED'
    AND finalized_at >= p_start_at
    AND finalized_at <= p_end_at;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_driver_points_order(p_order_id uuid, p_confirmed_by uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order driver_points_orders%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_caller_id uuid;
BEGIN
  -- Require authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Autenticação obrigatória');
  END IF;

  -- Require admin role for the brand
  SELECT * INTO v_order FROM driver_points_orders WHERE id = p_order_id AND status = 'PENDING' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  -- Verify caller is brand_admin or root_admin for this brand
  IF NOT has_role(v_caller_id, 'root_admin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = v_caller_id
        AND role = 'brand_admin'
        AND brand_id = v_order.brand_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem confirmar pedidos');
    END IF;
  END IF;

  -- Credit customer points
  UPDATE customers SET points_balance = points_balance + v_order.points_amount WHERE id = v_order.customer_id;

  -- Ledger entry
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
  VALUES (v_order.customer_id, v_order.brand_id, v_order.branch_id, 'CREDIT', v_order.points_amount,
          'Compra de pontos: ' || v_order.points_amount || ' pts',
          'MANUAL_ADJUSTMENT', v_order.id, v_caller_id);

  -- Debit branch wallet if exists
  IF v_order.branch_id IS NOT NULL THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_order.branch_id FOR UPDATE;
    IF FOUND THEN
      v_new_balance := v_wallet.balance - v_order.points_amount;
      UPDATE branch_points_wallet SET balance = v_new_balance, total_distributed = total_distributed + v_order.points_amount, updated_at = now() WHERE id = v_wallet.id;
      INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description, created_by)
      VALUES (v_order.branch_id, v_order.brand_id, 'DEBIT', v_order.points_amount, v_new_balance, 'Compra de pontos por motorista', v_caller_id);
    END IF;
  END IF;

  -- Update order
  UPDATE driver_points_orders SET status = 'CONFIRMED', confirmed_at = now(), confirmed_by = v_caller_id WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'points_credited', v_order.points_amount);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_package_order(p_order_id uuid, p_confirmed_by uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order points_package_orders%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_pkg_name text;
BEGIN
  SELECT * INTO v_order FROM points_package_orders WHERE id = p_order_id AND status = 'PENDING' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  SELECT name INTO v_pkg_name FROM points_packages WHERE id = v_order.package_id;

  -- Update order
  UPDATE points_package_orders SET status = 'CONFIRMED', confirmed_by = p_confirmed_by, confirmed_at = now() WHERE id = p_order_id;

  -- Credit wallet
  SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_order.branch_id FOR UPDATE;
  IF FOUND THEN
    v_new_balance := v_wallet.balance + v_order.points_amount;
    UPDATE branch_points_wallet SET balance = v_new_balance, total_loaded = total_loaded + v_order.points_amount, updated_at = now() WHERE id = v_wallet.id;
  ELSE
    v_new_balance := v_order.points_amount;
    INSERT INTO branch_points_wallet (branch_id, brand_id, balance, total_loaded) VALUES (v_order.branch_id, v_order.brand_id, v_new_balance, v_order.points_amount);
  END IF;

  INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description, created_by)
  VALUES (v_order.branch_id, v_order.brand_id, 'LOAD', v_order.points_amount, v_new_balance, 'Pacote: ' || COALESCE(v_pkg_name, 'N/A') || ' (' || v_order.points_amount || ' pts)', p_confirmed_by);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.count_duel_rides(p_customer_id uuid, p_branch_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::bigint
  FROM machine_rides
  WHERE driver_customer_id = p_customer_id
    AND branch_id = p_branch_id
    AND ride_status = 'FINALIZED'
    AND finalized_at >= p_start_at
    AND finalized_at <= p_end_at;
$function$
;

CREATE OR REPLACE FUNCTION public.counter_propose_duel(p_duel_id uuid, p_customer_id uuid, p_counter_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
  v_balance numeric;
  v_role text; -- 'challenger' or 'challenged'
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou já respondido');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante não encontrado');
  END IF;

  -- Determine role
  IF v_participant.id = v_duel.challenged_id THEN
    v_role := 'challenged';
  ELSIF v_participant.id = v_duel.challenger_id THEN
    v_role := 'challenger';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Você não participa deste duelo');
  END IF;

  IF p_counter_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor da contraproposta deve ser maior que zero');
  END IF;

  -- Validate balance
  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id;
  IF v_balance IS NULL OR v_balance < p_counter_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente para a contraproposta', 'balance', COALESCE(v_balance, 0));
  END IF;

  UPDATE driver_duels SET
    counter_proposal_points = p_counter_points,
    counter_proposal_by = v_role,
    negotiation_status = 'counter_proposed'
  WHERE id = p_duel_id;

  RETURN jsonb_build_object('success', true, 'counter_points', p_counter_points, 'proposed_by', v_role);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.counter_propose_side_bet(p_bet_id uuid, p_customer_id uuid, p_counter_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_balance numeric;
  v_opposite_winner uuid;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
BEGIN
  IF p_counter_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor deve ser positivo');
  END IF;

  SELECT * INTO v_bet FROM duel_side_bets WHERE id = p_bet_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aposta não encontrada ou não está aberta');
  END IF;

  IF v_bet.bettor_a_customer_id = p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode contrapropor sua própria aposta');
  END IF;

  SELECT * INTO v_duel FROM driver_duels WHERE id = v_bet.duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está mais ativo');
  END IF;

  -- Prevent duel participants
  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;
  IF p_customer_id = v_challenger_cid OR p_customer_id = v_challenged_cid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participantes do duelo não podem apostar');
  END IF;

  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id;
  IF v_balance IS NULL OR v_balance < p_counter_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  IF v_bet.bettor_a_predicted_winner = v_duel.challenger_id THEN
    v_opposite_winner := v_duel.challenged_id;
  ELSE
    v_opposite_winner := v_duel.challenger_id;
  END IF;

  UPDATE duel_side_bets SET
    bettor_b_customer_id = p_customer_id,
    bettor_b_predicted_winner = v_opposite_winner,
    counter_proposal_points = p_counter_points,
    status = 'counter_proposed'
  WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_duel_challenge(p_challenger_customer_id uuid, p_challenged_customer_id uuid, p_branch_id uuid, p_brand_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_points_bet integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
  v_balance numeric;
BEGIN
  -- Validate challenger
  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não está habilitado para duelos');
  END IF;

  -- Validate challenged
  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Adversário não está habilitado para duelos');
  END IF;

  IF p_challenger_customer_id = p_challenged_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode desafiar a si mesmo');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à data de fim');
  END IF;

  -- Validate balance if betting points
  IF p_points_bet > 0 THEN
    SELECT points_balance INTO v_balance FROM customers WHERE id = p_challenger_customer_id;
    IF v_balance IS NULL OR v_balance < p_points_bet THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente para a aposta', 'balance', COALESCE(v_balance, 0));
    END IF;
  END IF;

  INSERT INTO driver_duels (
    branch_id, brand_id, challenger_id, challenged_id, start_at, end_at, status,
    challenger_points_bet, negotiation_status
  )
  VALUES (
    p_branch_id, p_brand_id, v_challenger.id, v_challenged.id, p_start_at, p_end_at, 'pending',
    p_points_bet, CASE WHEN p_points_bet > 0 THEN 'proposed' ELSE 'none' END
  )
  RETURNING id INTO v_duel_id;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_duel_challenge(p_challenger_customer_id uuid, p_challenged_customer_id uuid, p_branch_id uuid, p_brand_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
  v_display_name text;
BEGIN
  -- Validate challenger
  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não está habilitado para duelos');
  END IF;

  -- Auto-enroll challenged if not exists
  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id;
  
  IF NOT FOUND THEN
    SELECT TRIM(REGEXP_REPLACE(name, '\[MOTORISTA\]\s*', '', 'gi'))
    INTO v_display_name FROM customers WHERE id = p_challenged_customer_id;

    INSERT INTO driver_duel_participants (customer_id, branch_id, brand_id, duels_enabled, display_name)
    VALUES (p_challenged_customer_id, p_branch_id, p_brand_id, true, v_display_name)
    RETURNING * INTO v_challenged;
  ELSIF NOT v_challenged.duels_enabled THEN
    UPDATE driver_duel_participants SET duels_enabled = true WHERE id = v_challenged.id;
    v_challenged.duels_enabled := true;
  END IF;

  -- Same person check
  IF p_challenger_customer_id = p_challenged_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode desafiar a si mesmo');
  END IF;

  -- Date validation
  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à data de fim');
  END IF;

  INSERT INTO driver_duels (branch_id, brand_id, challenger_id, challenged_id, start_at, end_at, status)
  VALUES (p_branch_id, p_brand_id, v_challenger.id, v_challenged.id, p_start_at, p_end_at, 'pending')
  RETURNING id INTO v_duel_id;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_side_bet(p_duel_id uuid, p_customer_id uuid, p_predicted_winner_participant_id uuid, p_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_balance numeric;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
BEGIN
  -- Validate points
  IF p_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor da aposta deve ser positivo');
  END IF;

  -- Get duel
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não está ativo');
  END IF;

  -- Validate predicted winner is a participant of this duel
  IF p_predicted_winner_participant_id != v_duel.challenger_id AND p_predicted_winner_participant_id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante previsto não pertence a este duelo');
  END IF;

  -- Prevent duel participants from betting on own duel
  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  IF p_customer_id = v_challenger_cid OR p_customer_id = v_challenged_cid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participantes do duelo não podem apostar no próprio duelo');
  END IF;

  -- Validate balance
  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id;
  IF v_balance IS NULL OR v_balance < p_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente', 'balance', COALESCE(v_balance, 0));
  END IF;

  -- Create open bet (no escrow yet - only when matched)
  INSERT INTO duel_side_bets (duel_id, branch_id, brand_id, bettor_a_customer_id, bettor_a_predicted_winner, bettor_a_points, status)
  VALUES (p_duel_id, v_duel.branch_id, v_duel.brand_id, p_customer_id, p_predicted_winner_participant_id, p_points, 'open');

  RETURN jsonb_build_object('success', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.credit_customer_points(p_customer_id uuid, p_brand_id uuid, p_branch_id uuid, p_points integer, p_money numeric DEFAULT 0, p_reason text DEFAULT ''::text, p_reference_type text DEFAULT 'MACHINE_RIDE'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_current_balance numeric;
BEGIN
  SELECT points_balance INTO v_current_balance
  FROM customers WHERE id = p_customer_id FOR UPDATE;

  UPDATE customers
  SET points_balance = points_balance + p_points
  WHERE id = p_customer_id;

  INSERT INTO points_ledger (
    customer_id, brand_id, branch_id,
    entry_type, points_amount, reason,
    reference_type, created_by_user_id
  ) VALUES (
    p_customer_id, p_brand_id, p_branch_id,
    'CREDIT', p_points, p_reason,
    p_reference_type::ledger_reference_type, NULL
  );
END; $function$
;

CREATE OR REPLACE FUNCTION public.debit_branch_wallet(p_branch_id uuid, p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_wallet
  FROM branch_points_wallet
  WHERE branch_id = p_branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada para esta cidade');
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE branch_points_wallet
  SET balance = v_new_balance,
      total_distributed = total_distributed + p_amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
  VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_amount, v_new_balance, p_description);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_belongs_to_brand(p_driver_id uuid, p_brand_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.customers
                  WHERE id = p_driver_id AND brand_id = p_brand_id);
$function$
;

CREATE OR REPLACE FUNCTION public.driver_enroll_season(p_season_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_customer       public.customers%ROWTYPE;
  v_season         public.campeonato_seasons%ROWTYPE;
  v_photo          TEXT;
  v_existing       UUID;
  v_tier_id        UUID;
  v_tier_target    INTEGER;
  v_tier_active    INTEGER;
  v_status         TEXT;
  v_enrollment_id  UUID;
BEGIN
  -- 0. Identificar o motorista pelo p_driver_id (sessão impersonada — sem auth.uid())
  SELECT * INTO v_customer
    FROM public.customers
   WHERE id = p_driver_id
   LIMIT 1;
  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Motorista não encontrado.');
  END IF;

  -- 1. Carregar a temporada e validar branch/brand
  SELECT * INTO v_season
    FROM public.campeonato_seasons
   WHERE id = p_season_id
     AND brand_id  = v_customer.brand_id
     AND branch_id = v_customer.branch_id;
  IF v_season.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campeonato não disponível para a sua cidade.');
  END IF;

  -- 1b. Garantir que driver pertence à brand da temporada
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_season.brand_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado.');
  END IF;

  -- 2. Publicada?
  IF v_season.published_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este campeonato ainda não foi publicado.');
  END IF;

  -- 3. Janela de inscrição
  IF v_season.enrollment_opens_at IS NULL OR v_season.enrollment_closes_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Período de inscrição não configurado.');
  END IF;
  IF NOW() < v_season.enrollment_opens_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'As inscrições ainda não foram abertas.');
  END IF;
  IF NOW() > v_season.enrollment_closes_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'O período de inscrição encerrou.');
  END IF;

  -- 4. Taxa: somente grátis nesta etapa
  IF v_season.entry_fee_cents > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inscrições pagas ainda não estão disponíveis.');
  END IF;

  -- 5. Já inscrito?
  SELECT id INTO v_existing
    FROM public.campeonato_season_enrollments
   WHERE season_id = p_season_id
     AND driver_id = v_customer.id
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já está inscrito neste campeonato.');
  END IF;

  -- 6. Foto obrigatória (em customers OU driver_profiles)
  SELECT COALESCE(
           NULLIF(v_customer.photo_url, ''),
           NULLIF((SELECT photo_url FROM public.driver_profiles WHERE customer_id = v_customer.id), '')
         )
    INTO v_photo;
  IF v_photo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Envie sua foto de perfil para participar do campeonato.');
  END IF;

  -- 7. Verificar vagas no menor tier
  SELECT id, target_size INTO v_tier_id, v_tier_target
    FROM public.campeonato_season_tiers
   WHERE season_id = p_season_id
   ORDER BY tier_order DESC
   LIMIT 1;
  IF v_tier_id IS NOT NULL AND v_tier_target IS NOT NULL THEN
    SELECT COUNT(*) INTO v_tier_active
      FROM public.campeonato_season_enrollments
     WHERE season_id = p_season_id
       AND tier_id   = v_tier_id
       AND status   <> 'rejected';
    IF v_tier_active >= v_tier_target THEN
      RETURN jsonb_build_object('success', false, 'error', 'A série de entrada está sem vagas disponíveis.');
    END IF;
  END IF;

  -- 8. Status conforme enrollment_mode
  v_status := CASE WHEN v_season.enrollment_mode = 'auto' THEN 'approved' ELSE 'pending' END;

  INSERT INTO public.campeonato_season_enrollments
    (season_id, driver_id, brand_id, branch_id, status, tier_id)
  VALUES
    (p_season_id, v_customer.id, v_customer.brand_id, v_customer.branch_id, v_status, v_tier_id)
  RETURNING id INTO v_enrollment_id;

  RETURN jsonb_build_object(
    'success',       true,
    'status',        v_status,
    'enrollment_id', v_enrollment_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_get_active_season(p_brand_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.driver_belongs_to_brand(p_driver_id, p_brand_id) THEN
    RETURN NULL;
  END IF;
  SELECT jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'phase', s.phase,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tier_id', tm.tier_id,
    'tier_name', t.name,
    'tier_order', t.tier_order,
    'driver_points', st.points,
    'driver_weekend_rides', st.weekend_rides_count,
    'driver_position', st.position_in_tier,
    'driver_qualified', st.qualified,
    'driver_relegated_auto', st.relegated_auto
  ) INTO v_result
    FROM public.campeonato_seasons s
    JOIN public.campeonato_tier_memberships tm
      ON tm.season_id = s.id AND tm.driver_id = p_driver_id
    JOIN public.campeonato_season_tiers t ON t.id = tm.tier_id
    LEFT JOIN public.campeonato_season_standings st
      ON st.season_id = s.id AND st.driver_id = p_driver_id
   WHERE s.brand_id = p_brand_id
     AND s.phase <> 'finished'
   ORDER BY s.created_at DESC
   LIMIT 1;
  RETURN v_result;
END; $function$
;

CREATE OR REPLACE FUNCTION public.driver_get_bracket_v2(p_season_id uuid, p_tier_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_season_info jsonb;
  v_brackets jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id
    FROM public.campeonato_seasons s
   WHERE s.id = p_season_id;

  IF v_brand_id IS NULL OR NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN jsonb_build_object('season_info', NULL, 'brackets', '[]'::jsonb);
  END IF;

  SELECT jsonb_build_object(
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'phase_config', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('phase', pc.phase, 'duration_hours', pc.duration_hours)
        ORDER BY CASE pc.phase
          WHEN 'R16' THEN 1
          WHEN 'QF' THEN 2
          WHEN 'SF' THEN 3
          WHEN 'Final' THEN 4
          ELSE 5
        END
      )
      FROM public.campeonato_season_phase_config pc
      WHERE pc.season_id = p_season_id
    ), '[]'::jsonb)
  )
  INTO v_season_info
  FROM public.campeonato_seasons s
  WHERE s.id = p_season_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'phase', b.round,
      'bracket_position', b.slot,
      'driver_a_id', b.driver_a_id,
      'driver_a_name', ca.name,
      'driver_a_photo_url', COALESCE(ca.photo_url, dpa.photo_url),
      'driver_b_id', b.driver_b_id,
      'driver_b_name', cb.name,
      'driver_b_photo_url', COALESCE(cb.photo_url, dpb.photo_url),
      'driver_a_rides', b.driver_a_rides,
      'driver_b_rides', b.driver_b_rides,
      'winner_id', b.winner_id,
      'starts_at', b.starts_at,
      'ends_at', b.ends_at,
      'is_my_match', (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
    )
    ORDER BY
      CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END,
      b.slot
  ), '[]'::jsonb)
  INTO v_brackets
  FROM public.campeonato_brackets b
  LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
  LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
  LEFT JOIN public.driver_profiles dpa ON dpa.customer_id = b.driver_a_id
  LEFT JOIN public.driver_profiles dpb ON dpb.customer_id = b.driver_b_id
  WHERE b.season_id = p_season_id
    AND b.tier_id = p_tier_id;

  RETURN jsonb_build_object('season_info', v_season_info, 'brackets', v_brackets);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_get_centered_ranking(p_season_id uuid, p_driver_id uuid, p_range integer DEFAULT 2)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_tier_id uuid;
  v_result jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT tier_id INTO v_tier_id FROM public.campeonato_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id LIMIT 1;
  IF v_tier_id IS NULL THEN RETURN '[]'::jsonb; END IF;

  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                  COALESCE(st.last_ride_at, 'infinity'::timestamptz) ASC) AS rn,
      st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at,
      c.name AS driver_name
      FROM public.campeonato_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = v_tier_id
  ),
  me AS (SELECT rn FROM ranked WHERE driver_id = p_driver_id)
  SELECT jsonb_agg(jsonb_build_object(
    'position', r.rn,
    'driver_id', r.driver_id,
    'driver_name', r.driver_name,
    'points', r.points,
    'weekend_rides_count', r.weekend_rides_count,
    'last_ride_at', r.last_ride_at,
    'is_me', (r.driver_id = p_driver_id)
  ) ORDER BY r.rn) INTO v_result
    FROM ranked r, me
   WHERE r.rn BETWEEN me.rn - p_range AND me.rn + p_range;
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.driver_get_current_match(p_season_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_phase text;
  v_round text;
  v_result jsonb;
BEGIN
  SELECT s.brand_id, s.phase INTO v_brand_id, v_phase
    FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN NULL;
  END IF;
  IF v_phase NOT IN ('knockout_r16','knockout_qf','knockout_sf','knockout_final') THEN
    RETURN NULL;
  END IF;
  v_round := CASE v_phase
    WHEN 'knockout_r16' THEN 'r16'
    WHEN 'knockout_qf' THEN 'qf'
    WHEN 'knockout_sf' THEN 'sf'
    ELSE 'final' END;

  SELECT jsonb_build_object(
    'bracket_id', b.id,
    'round', b.round,
    'slot', b.slot,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id,
    'driver_a_name', ca.name,
    'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id,
    'driver_b_name', cb.name,
    'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id,
    'is_me_a', (b.driver_a_id = p_driver_id),
    'is_me_b', (b.driver_b_id = p_driver_id),
    'eliminated', (b.winner_id IS NOT NULL AND b.winner_id <> p_driver_id)
  ) INTO v_result
    FROM public.campeonato_brackets b
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id
     AND b.round = v_round
     AND (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
   LIMIT 1;
  RETURN v_result;
END; $function$
;

CREATE OR REPLACE FUNCTION public.driver_get_full_bracket(p_season_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_tier_id uuid;
  v_result jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT tier_id INTO v_tier_id FROM public.campeonato_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id LIMIT 1;

  SELECT jsonb_agg(jsonb_build_object(
    'bracket_id', b.id,
    'round', b.round,
    'slot', b.slot,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id,
    'driver_a_name', ca.name,
    'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id,
    'driver_b_name', cb.name,
    'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id,
    'is_me_involved', (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
  ) ORDER BY
    CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END,
    b.slot
  ) INTO v_result
    FROM public.campeonato_brackets b
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id
     AND (v_tier_id IS NULL OR b.tier_id = v_tier_id);
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.driver_get_full_tier_table(p_season_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_tier_id uuid;
  v_result jsonb;
  v_qualified_top int := 16;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT tier_id INTO v_tier_id FROM public.campeonato_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id LIMIT 1;
  IF v_tier_id IS NULL THEN RETURN '[]'::jsonb; END IF;

  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                  COALESCE(st.last_ride_at, 'infinity'::timestamptz) ASC) AS rn,
      st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at, st.qualified,
      c.name AS driver_name
      FROM public.campeonato_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = v_tier_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'position', rn,
    'driver_id', driver_id,
    'driver_name', driver_name,
    'points', points,
    'weekend_rides_count', weekend_rides_count,
    'last_ride_at', last_ride_at,
    'qualified', qualified,
    'is_me', (driver_id = p_driver_id),
    'in_top', (rn <= v_qualified_top)
  ) ORDER BY rn) INTO v_result FROM ranked;
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.driver_get_history(p_brand_id uuid, p_driver_id uuid, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.driver_belongs_to_brand(p_driver_id, p_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'history_id', h.id,
    'season_id', h.season_id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'starting_tier_id', h.starting_tier_id,
    'starting_tier_name', ts.name,
    'starting_tier_order', ts.tier_order,
    'ending_tier_id', h.ending_tier_id,
    'ending_tier_name', te.name,
    'ending_tier_order', te.tier_order,
    'ending_position', h.ending_position,
    'outcome', h.outcome,
    'created_at', h.created_at
  ) ORDER BY s.year DESC, s.month DESC) INTO v_result
    FROM (
      SELECT * FROM public.campeonato_driver_tier_history
       WHERE brand_id = p_brand_id AND driver_id = p_driver_id
       ORDER BY created_at DESC
       LIMIT p_limit
    ) h
    JOIN public.campeonato_seasons s ON s.id = h.season_id
    LEFT JOIN public.campeonato_season_tiers ts ON ts.id = h.starting_tier_id
    LEFT JOIN public.campeonato_season_tiers te ON te.id = h.ending_tier_id;
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $function$
;

CREATE OR REPLACE FUNCTION public.driver_get_my_enrollments(p_driver_id uuid)
 RETURNS TABLE(id uuid, season_id uuid, status text, tier_id uuid, notes text, created_at timestamp with time zone, season_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_driver_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT e.id, e.season_id, e.status, e.tier_id, e.notes, e.created_at, s.name AS season_name
    FROM public.campeonato_season_enrollments e
    JOIN public.campeonato_seasons s ON s.id = e.season_id
   WHERE e.driver_id = p_driver_id
   ORDER BY e.created_at DESC
   LIMIT 10;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_get_notifications(p_brand_id uuid, p_driver_id uuid, p_only_unread boolean DEFAULT false, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Valida pertencimento do motorista à marca
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
     WHERE id = p_driver_id AND brand_id = p_brand_id
  ) THEN
    RAISE EXCEPTION 'Motorista não pertence à marca';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t.created_at) DESC), '[]'::jsonb)
    INTO v_result
  FROM (
    SELECT id, driver_id, brand_id, season_id, event_type,
           title, message, action_url, read_at, created_at
      FROM public.campeonato_notifications
     WHERE driver_id = p_driver_id
       AND brand_id = p_brand_id
       AND (NOT p_only_unread OR read_at IS NULL)
     ORDER BY created_at DESC
     LIMIT p_limit
  ) t;

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_get_pending_or_active_season(p_brand_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_driver_branch_id uuid;
BEGIN
  IF NOT public.driver_belongs_to_brand(p_driver_id, p_brand_id) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'phase', s.phase,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tier_id', tm.tier_id,
    'tier_name', t.name,
    'tier_order', t.tier_order,
    'driver_points', st.points,
    'driver_weekend_rides', st.weekend_rides_count,
    'driver_position', st.position_in_tier,
    'driver_qualified', st.qualified,
    'driver_relegated_auto', st.relegated_auto,
    'is_pending_seeding', false
  ) INTO v_result
    FROM public.campeonato_seasons s
    JOIN public.campeonato_tier_memberships tm
      ON tm.season_id = s.id AND tm.driver_id = p_driver_id
    JOIN public.campeonato_season_tiers t ON t.id = tm.tier_id
    LEFT JOIN public.campeonato_season_standings st
      ON st.season_id = s.id AND st.driver_id = p_driver_id
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  SELECT branch_id INTO v_driver_branch_id
    FROM public.customers
   WHERE id = p_driver_id;

  IF v_driver_branch_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'phase', s.phase,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tier_id', NULL,
    'tier_name', NULL,
    'tier_order', NULL,
    'driver_points', 0,
    'driver_weekend_rides', 0,
    'driver_position', NULL,
    'driver_qualified', false,
    'driver_relegated_auto', false,
    'is_pending_seeding', true
  ) INTO v_result
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.branch_id = v_driver_branch_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
     AND s.tier_seeding_completed_at IS NULL
   ORDER BY s.created_at DESC
   LIMIT 1;

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_get_tier_standings_v2(p_season_id uuid, p_tier_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_promotion_count int;
  v_relegation_count int;
  v_result jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  IF v_brand_id IS NULL THEN RETURN '[]'::jsonb; END IF;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(promotion_count, 0), COALESCE(relegation_count, 0)
    INTO v_promotion_count, v_relegation_count
    FROM public.campeonato_season_tiers
   WHERE id = p_tier_id AND season_id = p_season_id;

  WITH members AS (
    SELECT st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at
      FROM public.campeonato_season_standings st
     WHERE st.season_id = p_season_id AND st.tier_id = p_tier_id
  ),
  match_agg AS (
    SELECT
      d.driver_id,
      COUNT(*) FILTER (WHERE b.driver_a_rides IS NOT NULL AND b.driver_b_rides IS NOT NULL
                         AND (b.winner_id IS NOT NULL OR b.ends_at <= now())) AS matches_played,
      COUNT(*) FILTER (WHERE b.winner_id = d.driver_id) AS wins,
      COUNT(*) FILTER (WHERE b.winner_id IS NULL
                         AND b.driver_a_rides IS NOT NULL AND b.driver_b_rides IS NOT NULL
                         AND b.driver_a_rides = b.driver_b_rides
                         AND b.ends_at <= now()) AS draws,
      COALESCE(SUM(
        CASE
          WHEN b.driver_a_rides IS NULL OR b.driver_b_rides IS NULL THEN 0
          WHEN b.driver_a_id = d.driver_id THEN b.driver_a_rides - b.driver_b_rides
          WHEN b.driver_b_id = d.driver_id THEN b.driver_b_rides - b.driver_a_rides
          ELSE 0
        END
      ) FILTER (WHERE b.winner_id IS NOT NULL OR b.ends_at <= now()), 0) AS goal_diff
    FROM members d
    LEFT JOIN public.campeonato_brackets b
      ON b.season_id = p_season_id
     AND b.tier_id = p_tier_id
     AND (b.driver_a_id = d.driver_id OR b.driver_b_id = d.driver_id)
    GROUP BY d.driver_id
  ),
  joined AS (
    SELECT
      m.driver_id,
      m.points,
      m.weekend_rides_count,
      m.last_ride_at,
      c.name AS driver_name,
      COALESCE(c.photo_url, dp.photo_url) AS photo_url,
      COALESCE(ma.matches_played, 0)::int AS matches_played,
      COALESCE(ma.wins, 0)::int AS wins,
      COALESCE(ma.draws, 0)::int AS draws,
      (COALESCE(ma.matches_played, 0) - COALESCE(ma.wins, 0) - COALESCE(ma.draws, 0))::int AS losses,
      COALESCE(ma.goal_diff, 0)::int AS goal_diff
    FROM members m
    JOIN public.customers c ON c.id = m.driver_id
    LEFT JOIN public.driver_profiles dp ON dp.customer_id = m.driver_id
    LEFT JOIN match_agg ma ON ma.driver_id = m.driver_id
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY points DESC, goal_diff DESC, wins DESC,
                 weekend_rides_count DESC,
                 COALESCE(last_ride_at, 'infinity'::timestamptz) ASC
      )::int AS rank,
      *
    FROM joined
  ),
  totals AS (SELECT COUNT(*)::int AS total FROM ranked)
  SELECT jsonb_agg(jsonb_build_object(
    'rank', r.rank,
    'driver_id', r.driver_id,
    'driver_name', r.driver_name,
    'photo_url', r.photo_url,
    'points', r.points,
    'matches_played', r.matches_played,
    'wins', r.wins,
    'draws', r.draws,
    'losses', r.losses,
    'goal_diff', r.goal_diff,
    'is_me', (r.driver_id = p_driver_id),
    'zone', CASE
      WHEN v_promotion_count > 0 AND r.rank <= v_promotion_count THEN 'promotion'
      WHEN v_relegation_count > 0 AND r.rank > (t.total - v_relegation_count) THEN 'relegation'
      ELSE NULL
    END
  ) ORDER BY r.rank) INTO v_result
  FROM ranked r CROSS JOIN totals t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_get_top_riders(p_season_id uuid, p_window text)
 RETURNS TABLE(rank integer, driver_id uuid, driver_name text, photo_url text, total_rides integer, has_prize boolean, prize_label text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interval INTERVAL;
  v_brand_id UUID;
  v_branch_id UUID;
  v_window_enabled BOOLEAN := false;
  v_window_label TEXT := NULL;
BEGIN
  v_interval := CASE p_window
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d'  THEN INTERVAL '7 days'
    WHEN '15d' THEN INTERVAL '15 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;

  SELECT brand_id, branch_id INTO v_brand_id, v_branch_id
    FROM public.campeonato_seasons
   WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(awp.enabled, false) OR (awp.prize_kind IS NOT NULL OR COALESCE(awp.description,'') <> '' OR COALESCE(awp.prize_value,'') <> ''),
    COALESCE(NULLIF(awp.description, ''), awp.label)
  INTO v_window_enabled, v_window_label
    FROM public.campeonato_artilharia_window_prizes awp
   WHERE awp.season_id = p_season_id
     AND awp.window_key = p_window
     AND awp.position = 1;

  RETURN QUERY
  WITH membros AS (
    SELECT tm.driver_id
      FROM public.campeonato_tier_memberships tm
      JOIN public.campeonato_season_tiers t ON t.id = tm.tier_id
     WHERE t.season_id = p_season_id
  ),
  contagem AS (
    SELECT mr.driver_id, COUNT(*)::INTEGER AS total_rides
      FROM public.machine_rides mr
      JOIN membros m ON m.driver_id = mr.driver_id
     WHERE mr.brand_id  = v_brand_id
       AND mr.branch_id = v_branch_id
       AND mr.created_at >= NOW() - v_interval
     GROUP BY mr.driver_id
  ),
  ranqueado AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY c.total_rides DESC, c.driver_id ASC)::INTEGER AS rank,
      c.driver_id,
      c.total_rides
    FROM contagem c
    ORDER BY c.total_rides DESC
    LIMIT 20
  )
  SELECT
    r.rank,
    r.driver_id,
    cu.name AS driver_name,
    COALESCE(cu.photo_url, dp.photo_url) AS photo_url,
    r.total_rides,
    (COALESCE(v_window_enabled, false) AND r.rank = 1) AS has_prize,
    CASE WHEN r.rank = 1 THEN v_window_label ELSE NULL END AS prize_label
  FROM ranqueado r
  LEFT JOIN public.customers cu ON cu.id = r.driver_id
  LEFT JOIN public.driver_profiles dp ON dp.driver_id = r.driver_id
  ORDER BY r.rank;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_list_tier_round_matches(p_season_id uuid, p_tier_id uuid, p_round text, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand_id FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'season_id', b.season_id,
    'tier_id', b.tier_id,
    'round', b.round,
    'slot', b.slot,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id,
    'driver_a_name', ca.name,
    'driver_a_photo_url', COALESCE(ca.photo_url, dpa.photo_url),
    'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id,
    'driver_b_name', cb.name,
    'driver_b_photo_url', COALESCE(cb.photo_url, dpb.photo_url),
    'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id,
    'is_me', (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
  ) ORDER BY b.slot ASC), '[]'::jsonb)
  INTO v_result
  FROM public.campeonato_brackets b
  LEFT JOIN public.customers ca        ON ca.id = b.driver_a_id
  LEFT JOIN public.customers cb        ON cb.id = b.driver_b_id
  LEFT JOIN public.driver_profiles dpa ON dpa.customer_id = b.driver_a_id
  LEFT JOIN public.driver_profiles dpb ON dpb.customer_id = b.driver_b_id
 WHERE b.season_id = p_season_id
   AND b.round = p_round
   AND (p_tier_id IS NULL OR b.tier_id = p_tier_id);

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_list_tier_rounds(p_season_id uuid, p_tier_id uuid, p_driver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand_id FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'round', r.round,
    'starts_at', r.starts_at,
    'ends_at', r.ends_at,
    'total_matches', r.total_matches,
    'status', CASE
      WHEN NOW() < r.starts_at THEN 'aguardando'
      WHEN NOW() BETWEEN r.starts_at AND r.ends_at THEN 'em_andamento'
      ELSE 'encerrado'
    END
  ) ORDER BY r.starts_at ASC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT b.round,
           MIN(b.starts_at) AS starts_at,
           MAX(b.ends_at)   AS ends_at,
           COUNT(*)         AS total_matches
      FROM public.campeonato_brackets b
     WHERE b.season_id = p_season_id
       AND (p_tier_id IS NULL OR b.tier_id = p_tier_id)
     GROUP BY b.round
  ) r;

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_list_upcoming_seasons(p_branch_id uuid, p_driver_id uuid)
 RETURNS TABLE(season_id uuid, name text, year integer, month integer, enrollment_opens_at timestamp with time zone, enrollment_closes_at timestamp with time zone, entry_fee_cents integer, entry_fee_currency text, tiers_count integer, my_enrollment_status text, prizes_summary jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.year,
    s.month,
    s.enrollment_opens_at,
    s.enrollment_closes_at,
    s.entry_fee_cents,
    s.entry_fee_currency,
    s.tiers_count,
    (SELECT e.status
       FROM public.campeonato_season_enrollments e
      WHERE e.season_id = s.id
        AND e.driver_id = p_driver_id
      LIMIT 1) AS my_enrollment_status,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'position',    p.position,
               'prize_kind',  p.prize_kind,
               'prize_value', p.prize_value,
               'description', p.description
             ) ORDER BY p.position)
        FROM (
          SELECT p2.position, p2.prize_kind, p2.prize_value, p2.description
            FROM public.campeonato_season_prizes p2
            JOIN public.campeonato_season_tiers t ON t.id = p2.tier_id
           WHERE p2.season_id = s.id
             AND t.tier_order = (
                   SELECT MIN(t2.tier_order)
                     FROM public.campeonato_season_tiers t2
                    WHERE t2.season_id = s.id
                 )
           ORDER BY p2.position
           LIMIT 3
        ) p
    ), '[]'::jsonb) AS prizes_summary
  FROM public.campeonato_seasons s
  WHERE s.branch_id = p_branch_id
    AND s.published_at IS NOT NULL
    AND s.classification_starts_at > NOW()
  ORDER BY s.classification_starts_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_mark_all_read(p_brand_id uuid, p_driver_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.campeonato_notifications
     SET read_at = now()
   WHERE driver_id = p_driver_id
     AND brand_id = p_brand_id
     AND read_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.driver_mark_notification_read(p_notification_id uuid, p_driver_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.campeonato_notifications
     SET read_at = now()
   WHERE id = p_notification_id
     AND driver_id = p_driver_id
     AND read_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.finalize_duel(p_duel_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenger_count bigint;
  v_challenged_count bigint;
  v_challenger_rides uuid[];
  v_challenged_rides uuid[];
  v_winner uuid;
  v_winner_customer_id uuid;
  v_total_bet integer;
  v_side_bet_result jsonb;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_settled boolean := false;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não pode ser finalizado');
  END IF;

  SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  v_challenger_count := count_duel_rides(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_count := count_duel_rides(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  v_challenger_rides := collect_duel_ride_ids(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_rides := collect_duel_ride_ids(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  IF v_challenger_count > v_challenged_count THEN
    v_winner := v_duel.challenger_id;
    v_winner_customer_id := v_challenger_customer_id;
  ELSIF v_challenged_count > v_challenger_count THEN
    v_winner := v_duel.challenged_id;
    v_winner_customer_id := v_challenged_customer_id;
  ELSE
    v_winner := NULL;
    v_winner_customer_id := NULL;
  END IF;

  INSERT INTO driver_duel_audit_log (
    duel_id, challenger_customer_id, challenged_customer_id,
    challenger_rides_counted, challenged_rides_counted,
    challenger_ride_ids, challenged_ride_ids,
    winner_participant_id,
    count_window_start, count_window_end,
    points_settled
  ) VALUES (
    p_duel_id, v_challenger_customer_id, v_challenged_customer_id,
    v_challenger_count, v_challenged_count,
    v_challenger_rides, v_challenged_rides,
    v_winner,
    v_duel.start_at, v_duel.end_at,
    v_duel.points_reserved OR v_duel.duel_origin = 'SPONSORED'
  );

  -- =================================================================
  -- BIFURCAÇÃO POR ORIGEM DO PRÊMIO
  -- =================================================================

  IF v_duel.duel_origin = 'SPONSORED' THEN
    -- Duelo patrocinado: prêmio bancado pela carteira da cidade (já debitado na criação)
    -- Ignora challenger_points_bet / challenged_points_bet
    IF COALESCE(v_duel.prize_points, 0) > 0 AND NOT v_duel.points_settled THEN
      IF v_winner_customer_id IS NOT NULL THEN
        -- Vitória: vencedor recebe prize_points integral
        UPDATE customers SET points_balance = points_balance + v_duel.prize_points WHERE id = v_winner_customer_id;
        INSERT INTO points_ledger (
          customer_id, brand_id, branch_id, entry_type, points_amount,
          reason, reference_type, reference_id, created_by_user_id
        ) VALUES (
          v_winner_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_duel.prize_points,
          'Prêmio de Duelo Patrocinado', 'DUEL_PRIZE', v_duel.id, NULL
        );
      ELSE
        -- Empate: estorna prize_points para a carteira da cidade
        SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_duel.branch_id FOR UPDATE;
        IF FOUND THEN
          v_new_balance := v_wallet.balance + v_duel.prize_points;
          UPDATE branch_points_wallet
          SET balance = v_new_balance,
              total_distributed = GREATEST(0, total_distributed - v_duel.prize_points),
              updated_at = now()
          WHERE id = v_wallet.id;

          INSERT INTO branch_wallet_transactions (
            branch_id, brand_id, transaction_type, amount, balance_after, description
          ) VALUES (
            v_duel.branch_id, v_duel.brand_id, 'CREDIT', v_duel.prize_points, v_new_balance,
            'Estorno de duelo patrocinado empatado #' || LEFT(v_duel.id::text, 8)
          );
        END IF;
      END IF;
      v_settled := true;
    END IF;

  ELSE
    -- Duelo entre motoristas: mecânica de escrow (mantida)
    IF v_duel.points_reserved AND NOT v_duel.points_settled THEN
      v_total_bet := COALESCE(v_duel.challenger_points_bet, 0) + COALESCE(v_duel.challenged_points_bet, 0);

      IF v_winner IS NOT NULL THEN
        IF v_winner = v_duel.challenger_id THEN
          UPDATE customers SET points_balance = points_balance + v_total_bet WHERE id = v_challenger_customer_id;
          INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
          VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_total_bet, 'Vitória no Duelo - Prêmio', 'DUEL_SETTLEMENT', v_duel.id, NULL);
        ELSE
          UPDATE customers SET points_balance = points_balance + v_total_bet WHERE id = v_challenged_customer_id;
          INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
          VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_total_bet, 'Vitória no Duelo - Prêmio', 'DUEL_SETTLEMENT', v_duel.id, NULL);
        END IF;
      ELSE
        UPDATE customers SET points_balance = points_balance + v_duel.challenger_points_bet WHERE id = v_challenger_customer_id;
        INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
        VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_duel.challenger_points_bet, 'Empate no Duelo - Devolução', 'DUEL_SETTLEMENT', v_duel.id, NULL);

        UPDATE customers SET points_balance = points_balance + v_duel.challenged_points_bet WHERE id = v_challenged_customer_id;
        INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
        VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_duel.challenged_points_bet, 'Empate no Duelo - Devolução', 'DUEL_SETTLEMENT', v_duel.id, NULL);
      END IF;
      v_settled := true;
    END IF;
  END IF;

  -- Apostas paralelas continuam liquidando independente da modalidade
  v_side_bet_result := settle_side_bets(p_duel_id, v_winner);

  UPDATE driver_duels
  SET status = 'finished',
      challenger_rides_count = v_challenger_count,
      challenged_rides_count = v_challenged_count,
      winner_id = v_winner,
      finished_at = now(),
      points_settled = CASE WHEN v_settled THEN true ELSE points_settled END
  WHERE id = p_duel_id;

  RETURN jsonb_build_object(
    'success', true,
    'challenger_rides', v_challenger_count,
    'challenged_rides', v_challenged_count,
    'winner_id', v_winner,
    'duel_origin', v_duel.duel_origin,
    'points_settled', v_settled,
    'side_bets', v_side_bet_result
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_log_commercial_lead_field_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  changes TEXT[] := ARRAY[]::TEXT[];
  actor_name TEXT;
  actor_id UUID;
BEGIN
  actor_id := auth.uid();
  IF actor_id IS NOT NULL THEN
    SELECT COALESCE(email, 'Usuário')
      INTO actor_name
    FROM auth.users
    WHERE id = actor_id
    LIMIT 1;
  END IF;

  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    changes := array_append(changes, 'Nome: ' || COALESCE(NULLIF(OLD.full_name, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.full_name, ''), '—'));
  END IF;
  IF NEW.work_email IS DISTINCT FROM OLD.work_email THEN
    changes := array_append(changes, 'E-mail: ' || COALESCE(NULLIF(OLD.work_email, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.work_email, ''), '—'));
  END IF;
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    changes := array_append(changes, 'Telefone: ' || COALESCE(NULLIF(OLD.phone, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.phone, ''), '—'));
  END IF;
  IF NEW.company_name IS DISTINCT FROM OLD.company_name THEN
    changes := array_append(changes, 'Empresa: ' || COALESCE(NULLIF(OLD.company_name, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.company_name, ''), '—'));
  END IF;
  IF NEW.company_role IS DISTINCT FROM OLD.company_role THEN
    changes := array_append(changes, 'Cargo: ' || COALESCE(NULLIF(OLD.company_role, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.company_role, ''), '—'));
  END IF;
  IF NEW.company_size IS DISTINCT FROM OLD.company_size THEN
    changes := array_append(changes, 'Faixa de motoristas: ' || COALESCE(NULLIF(OLD.company_size, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.company_size, ''), '—'));
  END IF;
  IF NEW.city IS DISTINCT FROM OLD.city THEN
    changes := array_append(changes, 'Cidade: ' || COALESCE(NULLIF(OLD.city, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.city, ''), '—'));
  END IF;
  IF NEW.current_solution IS DISTINCT FROM OLD.current_solution THEN
    changes := array_append(changes, 'Solução atual: ' || COALESCE(NULLIF(OLD.current_solution, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.current_solution, ''), '—'));
  END IF;
  IF NEW.interest_message IS DISTINCT FROM OLD.interest_message THEN
    changes := array_append(changes, 'Mensagem de interesse atualizada');
  END IF;
  IF NEW.preferred_contact IS DISTINCT FROM OLD.preferred_contact THEN
    changes := array_append(changes, 'Canal preferido: ' || COALESCE(NULLIF(OLD.preferred_contact, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.preferred_contact, ''), '—'));
  END IF;
  IF NEW.preferred_window IS DISTINCT FROM OLD.preferred_window THEN
    changes := array_append(changes, 'Janela preferida: ' || COALESCE(NULLIF(OLD.preferred_window, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.preferred_window, ''), '—'));
  END IF;
  IF NEW.product_name IS DISTINCT FROM OLD.product_name THEN
    changes := array_append(changes, 'Produto: ' || COALESCE(NULLIF(OLD.product_name, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.product_name, ''), '—'));
  END IF;
  IF NEW.product_slug IS DISTINCT FROM OLD.product_slug THEN
    changes := array_append(changes, 'Slug do produto: ' || COALESCE(NULLIF(OLD.product_slug, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.product_slug, ''), '—'));
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    changes := array_append(changes, 'Origem: ' || COALESCE(NULLIF(OLD.source, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.source, ''), '—'));
  END IF;
  IF NEW.utm_source IS DISTINCT FROM OLD.utm_source THEN
    changes := array_append(changes, 'UTM source: ' || COALESCE(NULLIF(OLD.utm_source, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.utm_source, ''), '—'));
  END IF;
  IF NEW.utm_medium IS DISTINCT FROM OLD.utm_medium THEN
    changes := array_append(changes, 'UTM medium: ' || COALESCE(NULLIF(OLD.utm_medium, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.utm_medium, ''), '—'));
  END IF;
  IF NEW.utm_campaign IS DISTINCT FROM OLD.utm_campaign THEN
    changes := array_append(changes, 'UTM campaign: ' || COALESCE(NULLIF(OLD.utm_campaign, ''), '—') || ' → ' || COALESCE(NULLIF(NEW.utm_campaign, ''), '—'));
  END IF;

  IF array_length(changes, 1) > 0 THEN
    INSERT INTO public.commercial_lead_notes (lead_id, content, note_type, author_user_id, author_name)
    VALUES (
      NEW.id,
      'Campos atualizados:' || E'\n• ' || array_to_string(changes, E'\n• '),
      'field_change',
      actor_id,
      COALESCE(actor_name, 'Sistema')
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_log_commercial_lead_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.commercial_lead_notes (lead_id, author_user_id, content, note_type)
    VALUES (
      NEW.id,
      auth.uid(),
      'Status alterado de "' || OLD.status || '" para "' || NEW.status || '"',
      'status_change'
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_redemption_pin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_pin text;
  attempts int := 0;
BEGIN
  LOOP
    new_pin := lpad(floor(random() * 1000000)::text, 6, '0');
    -- Check uniqueness among PENDING redemptions only
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.redemptions
      WHERE token = new_pin AND status = 'PENDING'
    );
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique PIN after 100 attempts';
    END IF;
  END LOOP;
  NEW.token := new_pin;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_branch_dashboard_stats(p_branch_id uuid)
 RETURNS TABLE(total_rides bigint, total_drivers bigint, total_points_distributed numeric, total_redemptions bigint, wallet_balance numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') AS total_rides,
    (SELECT COUNT(*)::bigint FROM customers WHERE branch_id = p_branch_id AND name ILIKE '%[MOTORISTA]%' AND is_active = true) AS total_drivers,
    (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') AS total_points_distributed,
    (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id) AS total_redemptions,
    (SELECT COALESCE(balance, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id) AS wallet_balance;
$function$
;

CREATE OR REPLACE FUNCTION public.get_branch_dashboard_stats_v2(p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_total_drivers bigint;
  v_today_start timestamptz;
  v_month_start timestamptz;
  v_prev_month_start timestamptz;
  v_reset_at timestamptz;
BEGIN
  v_today_start := date_trunc('day', now());
  v_month_start := date_trunc('month', now());
  v_prev_month_start := date_trunc('month', now() - interval '1 month');

  SELECT last_points_reset_at INTO v_reset_at FROM branches WHERE id = p_branch_id;

  SELECT COUNT(*)::bigint INTO v_total_drivers
  FROM customers
  WHERE branch_id = p_branch_id AND name ILIKE '%[MOTORISTA]%' AND is_active = true;

  result := jsonb_build_object(
    'redemptions_total', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id),
    'redemptions_pending', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'PENDING'),
    'redemptions_approved', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'APPROVED'),
    'redemptions_shipped', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'SHIPPED'),
    'redemptions_delivered', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'DELIVERED'),
    'redemptions_rejected', (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id AND status = 'REJECTED'),

    'points_total', (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND (v_reset_at IS NULL OR finalized_at >= v_reset_at)),
    'points_today', (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_today_start AND (v_reset_at IS NULL OR finalized_at >= v_reset_at)),
    'points_month', (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_month_start AND (v_reset_at IS NULL OR finalized_at >= v_reset_at)),
    'points_avg_per_driver', (CASE WHEN v_total_drivers > 0 THEN (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND (v_reset_at IS NULL OR finalized_at >= v_reset_at)) / v_total_drivers ELSE 0 END),

    'drivers_total', v_total_drivers,
    'drivers_scored', (SELECT COUNT(DISTINCT driver_customer_id)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND driver_points_credited > 0),
    'drivers_redeemed', (SELECT COUNT(DISTINCT customer_id)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id),

    'rides_total', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED'),
    'rides_today', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_today_start),
    'rides_month', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_month_start),
    'rides_prev_month', (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED' AND finalized_at >= v_prev_month_start AND finalized_at < v_month_start),
    'rides_avg_per_driver', (CASE WHEN v_total_drivers > 0 THEN (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') / v_total_drivers ELSE 0 END),

    'wallet_balance', (SELECT COALESCE(balance, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'wallet_total_loaded', (SELECT COALESCE(total_loaded, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'wallet_total_distributed', (SELECT COALESCE(total_distributed, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'wallet_low_threshold', (SELECT COALESCE(low_balance_threshold, 1000) FROM branch_points_wallet WHERE branch_id = p_branch_id),
    'active_rules', (SELECT COUNT(*)::bigint FROM driver_points_rules WHERE branch_id = p_branch_id AND is_active = true)
  );

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_branch_passenger_stats(p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_brand_id uuid;
  v_month_start timestamptz;
BEGIN
  v_month_start := date_trunc('month', now());

  SELECT brand_id INTO v_brand_id FROM branches WHERE id = p_branch_id;

  result := jsonb_build_object(
    'customers_total', (SELECT COUNT(*)::bigint FROM customers WHERE branch_id = p_branch_id AND is_active = true AND name NOT ILIKE '%[MOTORISTA]%'),
    'customers_active_30d', (
      SELECT COUNT(DISTINCT r.customer_id)::bigint
      FROM redemptions r
      WHERE r.branch_id = p_branch_id
        AND r.created_at > now() - interval '30 days'
    ),
    'redemptions_month', (
      SELECT COUNT(*)::bigint FROM redemptions
      WHERE branch_id = p_branch_id AND created_at >= v_month_start
    ),
    'offers_active', (
      SELECT COUNT(*)::bigint FROM offers
      WHERE branch_id = p_branch_id AND is_active = true AND status = 'ACTIVE'
    ),
    'stores_active', (
      SELECT COUNT(*)::bigint FROM stores
      WHERE branch_id = p_branch_id AND is_active = true AND approval_status = 'APPROVED'
    )
  );

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_branch_points_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(c.name, 'Motorista') AS participant_name,
    'driver'::text AS participant_type,
    c.points_balance::bigint AS total_points
  FROM customers c
  WHERE c.branch_id = p_branch_id
    AND c.name ILIKE '%[MOTORISTA]%'
    AND c.points_balance > 0
  ORDER BY c.points_balance DESC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_city_belt_champion(p_branch_id uuid)
 RETURNS TABLE(id uuid, branch_id uuid, champion_customer_id uuid, champion_name text, champion_nickname text, champion_avatar_url text, record_value bigint, record_type text, achieved_at timestamp with time zone, belt_prize_points integer, assigned_manually boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    cbc.id,
    cbc.branch_id,
    cbc.champion_customer_id,
    c.name AS champion_name,
    ddp.public_nickname AS champion_nickname,
    ddp.avatar_url AS champion_avatar_url,
    cbc.record_value,
    cbc.record_type,
    cbc.achieved_at,
    cbc.belt_prize_points,
    cbc.assigned_manually
  FROM city_belt_champions cbc
  JOIN customers c ON c.id = cbc.champion_customer_id
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = cbc.champion_customer_id
  WHERE cbc.branch_id = p_branch_id
  ORDER BY cbc.record_type
  LIMIT 2;
$function$
;

CREATE OR REPLACE FUNCTION public.get_city_driver_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(rank_position bigint, customer_id uuid, driver_name text, total_rides bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::bigint AS rank_position,
    mr.driver_customer_id AS customer_id,
    MAX(mr.driver_name)::text AS driver_name,
    COUNT(*)::bigint AS total_rides
  FROM machine_rides mr
  WHERE mr.branch_id = p_branch_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.finalized_at >= date_trunc('month', now())
    AND mr.driver_customer_id IS NOT NULL
  GROUP BY mr.driver_customer_id
  ORDER BY total_rides DESC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_customer_ids_for_store_owner(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT r.customer_id
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  JOIN stores s ON s.id = o.store_id
  WHERE s.owner_user_id = _user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_daily_counts(p_brand_id uuid, p_period_days integer)
 RETURNS TABLE(day date, redemptions_count bigint, rides_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start TIMESTAMPTZ := (now() - make_interval(days => p_period_days));
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT (current_date - i)::date AS day
    FROM generate_series(0, GREATEST(p_period_days - 1, 0)) AS i
  ),
  red AS (
    SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::bigint AS c
    FROM public.redemptions
    WHERE created_at >= v_start
      AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    GROUP BY 1
  ),
  rides AS (
    SELECT date_trunc('day', finalized_at)::date AS day, COUNT(*)::bigint AS c
    FROM public.machine_rides
    WHERE finalized_at >= v_start
      AND ride_status = 'FINALIZED'
      AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    GROUP BY 1
  )
  SELECT
    d.day,
    COALESCE(red.c, 0) AS redemptions_count,
    COALESCE(rides.c, 0) AS rides_count
  FROM days d
  LEFT JOIN red ON red.day = d.day
  LEFT JOIN rides ON rides.day = d.day
  ORDER BY d.day ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_brand_id uuid DEFAULT NULL::uuid, p_period_start timestamp with time zone DEFAULT (now() - '7 days'::interval), p_month_start timestamp with time zone DEFAULT date_trunc('month'::text, now()))
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'stores_active', (
      SELECT count(*) FROM stores
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'offers_total', (
      SELECT count(*) FROM offers
      WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'offers_active', (
      SELECT count(*) FROM offers
      WHERE status = 'ACTIVE' AND is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'customers_total', (
      SELECT count(*) FROM customers
      WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'customers_active', (
      SELECT count(*) FROM customers
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'redemptions_total', (
      SELECT count(*) FROM redemptions
      WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'redemptions_period', (
      SELECT count(*) FROM redemptions
      WHERE created_at >= p_period_start
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'redemptions_pending', (
      SELECT count(*) FROM redemptions
      WHERE status = 'PENDING'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'store_rules_pending', (
      SELECT count(*) FROM store_points_rules
      WHERE status = 'PENDING_APPROVAL'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'earning_events_total', (
      SELECT count(*) FROM machine_rides
      WHERE ride_status = 'FINALIZED'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'earning_events_period', (
      SELECT count(*) FROM machine_rides
      WHERE ride_status = 'FINALIZED'
        AND finalized_at >= p_period_start
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'motoristas_total', (
      SELECT count(*) FROM customers
      WHERE name ILIKE '%[MOTORISTA]%'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'achadinhos_active', (
      SELECT count(*) FROM affiliate_deals
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'achadinhos_stores', (
      SELECT count(DISTINCT store_name) FROM affiliate_deals
      WHERE is_active = true AND store_name IS NOT NULL
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'achadinhos_cities', (
      SELECT count(*) FROM branches
      WHERE is_active = true
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'product_redemptions_pending', (
      SELECT count(*) FROM product_redemption_orders
      WHERE status = 'PENDING'
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'product_redemptions_month', (
      SELECT count(*) FROM product_redemption_orders
      WHERE created_at >= p_month_start
        AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    ),
    'driver_points_total', (
      SELECT COALESCE(SUM(
        CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
             THEN mr.driver_points_credited ELSE 0 END
      ), 0)::bigint
      FROM machine_rides mr
      JOIN branches b ON b.id = mr.branch_id
      WHERE mr.ride_status = 'FINALIZED'
        AND mr.brand_id = p_brand_id
    ),
    'client_points_total', (
      SELECT COALESCE(SUM(
        CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
             THEN mr.points_credited ELSE 0 END
      ), 0)::bigint
      FROM machine_rides mr
      JOIN branches b ON b.id = mr.branch_id
      WHERE mr.ride_status = 'FINALIZED'
        AND mr.brand_id = p_brand_id
    )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_city_position(p_branch_id uuid, p_customer_id uuid)
 RETURNS TABLE(rank_position bigint, total_rides bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::bigint AS rank_position,
      mr.driver_customer_id AS customer_id,
      COUNT(*)::bigint AS total_rides
    FROM machine_rides mr
    WHERE mr.branch_id = p_branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= date_trunc('month', now())
      AND mr.driver_customer_id IS NOT NULL
    GROUP BY mr.driver_customer_id
  )
  SELECT r.rank_position, r.total_rides
  FROM ranked r
  WHERE r.customer_id = p_customer_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_competitive_profile(p_customer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant_id uuid;
  v_total_duels bigint := 0;
  v_wins bigint := 0;
  v_losses bigint := 0;
  v_draws bigint := 0;
  v_win_rate numeric := 0;
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_points_won numeric := 0;
  v_points_lost numeric := 0;
  v_recent jsonb := '[]'::jsonb;
  v_rec RECORD;
  v_streak integer := 0;
  v_last_result text := '';
BEGIN
  -- Get participant id
  SELECT id INTO v_participant_id
  FROM driver_duel_participants
  WHERE customer_id = p_customer_id;

  IF v_participant_id IS NULL THEN
    RETURN jsonb_build_object(
      'total_duels', 0, 'wins', 0, 'losses', 0, 'draws', 0,
      'win_rate', 0, 'current_streak', 0, 'best_streak', 0,
      'points_won', 0, 'points_lost', 0, 'recent', '[]'::jsonb
    );
  END IF;

  -- Count stats
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE winner_id = v_participant_id),
    COUNT(*) FILTER (WHERE winner_id IS NOT NULL AND winner_id != v_participant_id),
    COUNT(*) FILTER (WHERE winner_id IS NULL)
  INTO v_total_duels, v_wins, v_losses, v_draws
  FROM driver_duels
  WHERE status = 'finished'
    AND (challenger_id = v_participant_id OR challenged_id = v_participant_id);

  IF v_total_duels > 0 THEN
    v_win_rate := ROUND((v_wins::numeric / v_total_duels) * 100, 1);
  END IF;

  -- Points won/lost from ledger
  SELECT COALESCE(SUM(points_amount), 0) INTO v_points_won
  FROM points_ledger
  WHERE customer_id = p_customer_id
    AND reference_type = 'DUEL_SETTLEMENT'
    AND entry_type = 'CREDIT';

  SELECT COALESCE(SUM(points_amount), 0) INTO v_points_lost
  FROM points_ledger
  WHERE customer_id = p_customer_id
    AND reference_type = 'DUEL_RESERVE'
    AND entry_type = 'DEBIT';

  -- Subtract refunds from points_lost (draws get refunded)
  v_points_lost := v_points_lost - LEAST(v_points_lost, v_points_won);
  -- Net points won is credits minus debits
  -- Actually let's keep it simpler: points_won = CREDIT from DUEL_SETTLEMENT, points_lost = DEBIT from DUEL_RESERVE minus CREDIT refunds
  -- Recalculate properly
  v_points_lost := (
    SELECT COALESCE(SUM(points_amount), 0)
    FROM points_ledger
    WHERE customer_id = p_customer_id
      AND reference_type = 'DUEL_RESERVE'
      AND entry_type = 'DEBIT'
  ) - v_points_won;
  IF v_points_lost < 0 THEN v_points_lost := 0; END IF;

  -- Streaks (ordered by finished_at)
  v_streak := 0;
  v_best_streak := 0;
  v_current_streak := 0;
  FOR v_rec IN
    SELECT
      CASE
        WHEN winner_id = v_participant_id THEN 'W'
        WHEN winner_id IS NULL THEN 'D'
        ELSE 'L'
      END AS result
    FROM driver_duels
    WHERE status = 'finished'
      AND (challenger_id = v_participant_id OR challenged_id = v_participant_id)
    ORDER BY finished_at ASC
  LOOP
    IF v_rec.result = 'W' THEN
      IF v_last_result = 'W' THEN
        v_streak := v_streak + 1;
      ELSE
        v_streak := 1;
      END IF;
      IF v_streak > v_best_streak THEN v_best_streak := v_streak; END IF;
    ELSE
      v_streak := 0;
    END IF;
    v_last_result := v_rec.result;
  END LOOP;

  -- Current streak (from most recent backwards)
  v_current_streak := 0;
  FOR v_rec IN
    SELECT
      CASE
        WHEN winner_id = v_participant_id THEN 'W'
        WHEN winner_id IS NULL THEN 'D'
        ELSE 'L'
      END AS result
    FROM driver_duels
    WHERE status = 'finished'
      AND (challenger_id = v_participant_id OR challenged_id = v_participant_id)
    ORDER BY finished_at DESC
  LOOP
    IF v_rec.result = 'W' AND (v_current_streak >= 0) THEN
      IF v_current_streak <= 0 AND v_current_streak != 0 THEN EXIT; END IF;
      v_current_streak := v_current_streak + 1;
    ELSIF v_rec.result = 'L' AND (v_current_streak <= 0) THEN
      IF v_current_streak > 0 THEN EXIT; END IF;
      v_current_streak := v_current_streak - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Recent 5 duels
  SELECT jsonb_agg(row_to_json(sub)) INTO v_recent
  FROM (
    SELECT
      d.id,
      d.finished_at,
      d.challenger_rides_count,
      d.challenged_rides_count,
      d.challenger_points_bet,
      d.challenged_points_bet,
      CASE
        WHEN d.winner_id = v_participant_id THEN 'win'
        WHEN d.winner_id IS NULL THEN 'draw'
        ELSE 'loss'
      END AS result,
      CASE
        WHEN d.challenger_id = v_participant_id THEN (SELECT c.name FROM driver_duel_participants p JOIN customers c ON c.id = p.customer_id WHERE p.id = d.challenged_id)
        ELSE (SELECT c.name FROM driver_duel_participants p JOIN customers c ON c.id = p.customer_id WHERE p.id = d.challenger_id)
      END AS opponent_name
    FROM driver_duels d
    WHERE d.status = 'finished'
      AND (d.challenger_id = v_participant_id OR d.challenged_id = v_participant_id)
    ORDER BY d.finished_at DESC
    LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'total_duels', v_total_duels,
    'wins', v_wins,
    'losses', v_losses,
    'draws', v_draws,
    'win_rate', v_win_rate,
    'current_streak', v_current_streak,
    'best_streak', v_best_streak,
    'points_won', v_points_won,
    'points_lost', v_points_lost,
    'recent', COALESCE(v_recent, '[]'::jsonb)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_ledger(p_customer_id uuid)
 RETURNS TABLE(id uuid, entry_type text, points_amount numeric, money_amount numeric, reason text, reference_type text, created_at timestamp with time zone, branch_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Corridas finalizadas (machine_rides)
  SELECT
    mr.id,
    'CREDIT'::text AS entry_type,
    mr.driver_points_credited AS points_amount,
    mr.ride_value AS money_amount,
    ('Corrida - ' || COALESCE(mr.passenger_name, 'Passageiro'))::text AS reason,
    'MACHINE_RIDE'::text AS reference_type,
    mr.finalized_at AS created_at,
    b.name AS branch_name
  FROM machine_rides mr
  LEFT JOIN branches b ON b.id = mr.branch_id
  WHERE mr.driver_customer_id = p_customer_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.driver_points_credited > 0

  UNION ALL

  -- Ajustes manuais, resgates e outros lançamentos (points_ledger)
  SELECT
    l.id,
    l.entry_type::text,
    l.points_amount,
    l.money_amount,
    l.reason,
    l.reference_type::text,
    l.created_at,
    br.name AS branch_name
  FROM points_ledger l
  LEFT JOIN branches br ON br.id = l.branch_id
  WHERE l.customer_id = p_customer_id

  ORDER BY created_at DESC
  LIMIT 200;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_reputation(p_customer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_avg numeric;
  v_total bigint;
  v_tags jsonb;
BEGIN
  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)::bigint
  INTO v_avg, v_total
  FROM driver_duel_ratings
  WHERE rated_customer_id = p_customer_id;

  -- Top 5 tags
  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
  INTO v_tags
  FROM (
    SELECT jsonb_build_object('tag', tag, 'count', cnt) AS t
    FROM (
      SELECT unnest(tags) AS tag, COUNT(*) AS cnt
      FROM driver_duel_ratings
      WHERE rated_customer_id = p_customer_id
      GROUP BY tag
      ORDER BY cnt DESC
      LIMIT 5
    ) sub
  ) sub2;

  RETURN jsonb_build_object(
    'avg_rating', COALESCE(v_avg, 0),
    'total_ratings', COALESCE(v_total, 0),
    'top_tags', v_tags
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_ride_stats(p_brand_id uuid, p_customer_ids uuid[])
 RETURNS TABLE(customer_id uuid, total_rides bigint, total_ride_points numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    mr.driver_customer_id AS customer_id,
    COUNT(*)::bigint AS total_rides,
    COALESCE(SUM(mr.driver_points_credited), 0) AS total_ride_points
  FROM machine_rides mr
  WHERE mr.brand_id = p_brand_id
    AND mr.driver_customer_id = ANY(p_customer_ids)
    AND mr.ride_status = 'FINALIZED'
  GROUP BY mr.driver_customer_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_drivers_ranking_for_season(p_branch_id uuid, p_since_days integer DEFAULT 30)
 RETURNS TABLE(rank_position bigint, customer_id uuid, driver_name text, phone text, rides_count bigint, points_balance numeric, is_active boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH rides AS (
    SELECT
      mr.driver_customer_id,
      COUNT(*)::bigint AS total
    FROM public.machine_rides mr
    WHERE mr.branch_id = p_branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.driver_customer_id IS NOT NULL
      AND mr.finalized_at >= (now() - make_interval(days => GREATEST(p_since_days, 1)))
    GROUP BY mr.driver_customer_id
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(r.total, 0) DESC, c.points_balance DESC, c.name ASC
    )::bigint AS rank_position,
    c.id AS customer_id,
    c.name AS driver_name,
    c.phone,
    COALESCE(r.total, 0)::bigint AS rides_count,
    c.points_balance,
    c.is_active
  FROM public.customers c
  LEFT JOIN rides r ON r.driver_customer_id = c.id
  WHERE c.branch_id = p_branch_id
    AND c.is_driver = true
    AND c.is_active = true
  ORDER BY rank_position ASC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_duel_guesses_summary(p_duel_id uuid)
 RETURNS TABLE(participant_id uuid, guess_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT predicted_winner_participant_id AS participant_id, COUNT(*)::bigint AS guess_count
  FROM driver_duel_guesses
  WHERE duel_id = p_duel_id
  GROUP BY predicted_winner_participant_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_duel_match_suggestions(p_branch_id uuid, p_volume_tolerance numeric DEFAULT 0.25, p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pairs jsonb := '[]'::jsonb;
  v_no_data jsonb := '[]'::jsonb;
BEGIN
  -- Calcula perfil de cada participante elegível dos últimos 30 dias
  WITH eligible AS (
    SELECT
      ddp.id            AS participant_id,
      ddp.customer_id,
      COALESCE(ddp.public_nickname, ddp.display_name, c.name, 'Motorista') AS nome,
      c.customer_tier   AS tier
    FROM driver_duel_participants ddp
    JOIN customers c ON c.id = ddp.customer_id
    WHERE ddp.branch_id = p_branch_id
      AND ddp.duels_enabled = true
      -- exclui quem está em duelo aberto (live ou accepted)
      AND NOT EXISTS (
        SELECT 1 FROM driver_duels d
        WHERE d.status IN ('live', 'accepted', 'pending')
          AND (d.challenger_id = ddp.id OR d.challenged_id = ddp.id)
      )
  ),
  rides AS (
    SELECT
      mr.driver_customer_id AS customer_id,
      COUNT(*)::int AS rides_30d,
      -- bucket dominante por contagem
      (
        SELECT bucket FROM (
          SELECT
            CASE
              WHEN EXTRACT(HOUR FROM mr2.finalized_at) BETWEEN 5 AND 11 THEN 'manha'
              WHEN EXTRACT(HOUR FROM mr2.finalized_at) BETWEEN 12 AND 17 THEN 'tarde'
              WHEN EXTRACT(HOUR FROM mr2.finalized_at) BETWEEN 18 AND 23 THEN 'noite'
              ELSE 'madrugada'
            END AS bucket,
            COUNT(*) AS qt
          FROM machine_rides mr2
          WHERE mr2.driver_customer_id = mr.driver_customer_id
            AND mr2.branch_id = p_branch_id
            AND mr2.ride_status = 'FINALIZED'
            AND mr2.finalized_at >= NOW() - INTERVAL '30 days'
          GROUP BY 1
          ORDER BY qt DESC
          LIMIT 1
        ) t
      ) AS hour_bucket
    FROM machine_rides mr
    WHERE mr.branch_id = p_branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= NOW() - INTERVAL '30 days'
    GROUP BY mr.driver_customer_id
  ),
  profile AS (
    SELECT
      e.participant_id,
      e.customer_id,
      e.nome,
      e.tier,
      COALESCE(r.rides_30d, 0) AS rides_30d,
      COALESCE(r.hour_bucket, 'sem_dados') AS hour_bucket
    FROM eligible e
    LEFT JOIN rides r ON r.customer_id = e.customer_id
  ),
  with_data AS (
    SELECT * FROM profile WHERE rides_30d > 0
  ),
  pairs AS (
    SELECT
      a.participant_id   AS a_participant_id,
      a.customer_id      AS a_customer_id,
      a.nome             AS a_nome,
      a.tier             AS a_tier,
      a.rides_30d        AS a_rides,
      a.hour_bucket      AS a_bucket,
      b.participant_id   AS b_participant_id,
      b.customer_id      AS b_customer_id,
      b.nome             AS b_nome,
      b.tier             AS b_tier,
      b.rides_30d        AS b_rides,
      b.hour_bucket      AS b_bucket,
      -- score 0..100
      (
        -- volume: 60 pts se diferença <= tolerância, decai linear até 0
        GREATEST(0, 60 * (1 - (ABS(a.rides_30d - b.rides_30d)::numeric / GREATEST(a.rides_30d, b.rides_30d, 1)) / GREATEST(p_volume_tolerance, 0.01)))
        -- horário: 30 se mesmo bucket
        + CASE WHEN a.hour_bucket = b.hour_bucket THEN 30 ELSE 0 END
        -- tier: 10 se mesmo tier
        + CASE WHEN COALESCE(a.tier,'') = COALESCE(b.tier,'') AND a.tier IS NOT NULL THEN 10 ELSE 0 END
      )::numeric AS score
    FROM with_data a
    JOIN with_data b
      ON a.customer_id < b.customer_id
     AND a.hour_bucket = b.hour_bucket
     AND ABS(a.rides_30d - b.rides_30d)::numeric <= (GREATEST(a.rides_30d, b.rides_30d) * p_volume_tolerance)
  ),
  ranked AS (
    SELECT * FROM pairs WHERE score > 0 ORDER BY score DESC
  ),
  -- Algoritmo guloso: cada motorista entra em no máximo 1 par
  greedy AS (
    SELECT *
    FROM ranked r
    WHERE NOT EXISTS (
      SELECT 1 FROM ranked r2
      WHERE r2.score > r.score
        AND (r2.a_customer_id IN (r.a_customer_id, r.b_customer_id)
          OR r2.b_customer_id IN (r.a_customer_id, r.b_customer_id))
    )
    LIMIT p_limit
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'a_participant_id', a_participant_id,
    'a_customer_id', a_customer_id,
    'a_nome', a_nome,
    'a_tier', a_tier,
    'a_rides_30d', a_rides,
    'a_hour_bucket', a_bucket,
    'b_participant_id', b_participant_id,
    'b_customer_id', b_customer_id,
    'b_nome', b_nome,
    'b_tier', b_tier,
    'b_rides_30d', b_rides,
    'b_hour_bucket', b_bucket,
    'score', ROUND(score, 1)
  ) ORDER BY score DESC), '[]'::jsonb)
  INTO v_pairs
  FROM greedy;

  -- Lista paralela: motoristas elegíveis sem corridas no período
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'participant_id', participant_id,
    'customer_id', customer_id,
    'nome', nome,
    'tier', tier
  )), '[]'::jsonb)
  INTO v_no_data
  FROM (
    SELECT p.participant_id, p.customer_id, p.nome, p.tier
    FROM (
      SELECT
        e.participant_id, e.customer_id, e.nome, e.tier,
        COALESCE(r.rides_30d, 0) AS rides_30d
      FROM (
        SELECT
          ddp.id AS participant_id,
          ddp.customer_id,
          COALESCE(ddp.public_nickname, ddp.display_name, c.name, 'Motorista') AS nome,
          c.customer_tier AS tier
        FROM driver_duel_participants ddp
        JOIN customers c ON c.id = ddp.customer_id
        WHERE ddp.branch_id = p_branch_id AND ddp.duels_enabled = true
      ) e
      LEFT JOIN (
        SELECT mr.driver_customer_id AS customer_id, COUNT(*)::int AS rides_30d
        FROM machine_rides mr
        WHERE mr.branch_id = p_branch_id
          AND mr.ride_status = 'FINALIZED'
          AND mr.finalized_at >= NOW() - INTERVAL '30 days'
        GROUP BY 1
      ) r ON r.customer_id = e.customer_id
    ) p
    WHERE p.rides_30d = 0
  ) q;

  RETURN jsonb_build_object(
    'success', true,
    'pairs', v_pairs,
    'pairs_count', jsonb_array_length(v_pairs),
    'no_data_drivers', v_no_data
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_own_customer_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM customers WHERE user_id = _user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_points_ranking(p_brand_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  (SELECT
    COALESCE(c.name, 'Passageiro') AS participant_name,
    'passenger'::text AS participant_type,
    c.points_balance::bigint AS total_points
  FROM customers c
  JOIN branches b ON b.id = c.branch_id
  WHERE b.brand_id = p_brand_id
    AND c.name NOT ILIKE '%[MOTORISTA]%'
    AND c.points_balance > 0
    AND LOWER(c.name) != 'maçaneta'
  ORDER BY c.points_balance DESC
  LIMIT p_limit)
  UNION ALL
  (SELECT
    COALESCE(c.name, 'Motorista') AS participant_name,
    'driver'::text AS participant_type,
    c.points_balance::bigint AS total_points
  FROM customers c
  JOIN branches b ON b.id = c.branch_id
  WHERE b.brand_id = p_brand_id
    AND c.name ILIKE '%[MOTORISTA]%'
    AND c.points_balance > 0
  ORDER BY c.points_balance DESC
  LIMIT p_limit);
$function$
;

CREATE OR REPLACE FUNCTION public.get_points_summary(p_brand_id uuid)
 RETURNS TABLE(driver_points_total bigint, client_points_total bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(
      CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
           THEN mr.driver_points_credited ELSE 0 END
    ), 0)::bigint AS driver_points_total,
    COALESCE(SUM(
      CASE WHEN b.last_points_reset_at IS NULL OR mr.finalized_at >= b.last_points_reset_at
           THEN mr.points_credited ELSE 0 END
    ), 0)::bigint AS client_points_total
  FROM machine_rides mr
  JOIN branches b ON b.id = mr.branch_id
  WHERE mr.ride_status = 'FINALIZED'
    AND mr.brand_id = p_brand_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recommended_offers(p_brand_id uuid, p_branch_id uuid, p_customer_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 12)
 RETURNS TABLE(offer_id uuid, score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH offer_base AS (
    SELECT o.id, o.store_id, o.created_at, o.likes_count, o.discount_percent
    FROM offers o
    WHERE o.brand_id = p_brand_id
      AND o.branch_id = p_branch_id
      AND o.is_active = true
      AND o.status = 'ACTIVE'
  ),
  -- Redemption popularity in this branch (last 30 days)
  redemption_counts AS (
    SELECT r.offer_id, COUNT(*) AS cnt
    FROM redemptions r
    WHERE r.branch_id = p_branch_id
      AND r.created_at > now() - interval '30 days'
    GROUP BY r.offer_id
  ),
  -- Favorites count in this branch
  fav_counts AS (
    SELECT cf.offer_id, COUNT(*) AS cnt
    FROM customer_favorites cf
    JOIN offers o ON o.id = cf.offer_id
    WHERE o.branch_id = p_branch_id
    GROUP BY cf.offer_id
  ),
  -- Customer's recent clicks (last 14 days) — get store_ids they clicked
  customer_clicked_stores AS (
    SELECT DISTINCT ce.store_id
    FROM customer_click_events ce
    WHERE ce.customer_id = p_customer_id
      AND ce.created_at > now() - interval '14 days'
      AND ce.store_id IS NOT NULL
  ),
  scored AS (
    SELECT
      ob.id AS offer_id,
      (
        -- Recency: up to 30 points for offers created in last 7 days
        LEAST(30, GREATEST(0, 30 - EXTRACT(EPOCH FROM (now() - ob.created_at)) / 86400 * (30.0/7)))
        -- Redemption popularity: up to 25 points
        + LEAST(25, COALESCE(rc.cnt, 0) * 2.5)
        -- Favorites: up to 20 points
        + LEAST(20, COALESCE(fc.cnt, 0) * 4)
        -- Personal click affinity: 15 bonus points if customer clicked this store before
        + CASE WHEN ccs.store_id IS NOT NULL THEN 15 ELSE 0 END
        -- Discount boost: up to 10 points
        + LEAST(10, COALESCE(ob.discount_percent, 0) * 0.2)
      )::numeric AS score
    FROM offer_base ob
    LEFT JOIN redemption_counts rc ON rc.offer_id = ob.id
    LEFT JOIN fav_counts fc ON fc.offer_id = ob.id
    LEFT JOIN customer_clicked_stores ccs ON ccs.store_id = ob.store_id
  )
  SELECT s.offer_id, s.score
  FROM scored s
  ORDER BY s.score DESC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_rides_report_by_branch(p_brand_id uuid)
 RETURNS TABLE(branch_id uuid, branch_name text, branch_city text, branch_state text, total_rides bigint, total_ride_value numeric, total_driver_points bigint, total_client_points bigint, total_drivers bigint, rides_current_month bigint, rides_prev_month bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    b.id AS branch_id,
    b.name AS branch_name,
    COALESCE(b.city, b.name) AS branch_city,
    COALESCE(b.state, '') AS branch_state,
    COUNT(mr.id)::bigint AS total_rides,
    COALESCE(SUM(mr.ride_value), 0)::numeric AS total_ride_value,
    COALESCE(SUM(mr.driver_points_credited), 0)::bigint AS total_driver_points,
    COALESCE(SUM(mr.points_credited), 0)::bigint AS total_client_points,
    COUNT(DISTINCT mr.driver_customer_id)::bigint AS total_drivers,
    COUNT(CASE WHEN mr.finalized_at >= date_trunc('month', now()) THEN 1 END)::bigint AS rides_current_month,
    COUNT(CASE WHEN mr.finalized_at >= date_trunc('month', now()) - interval '1 month'
                 AND mr.finalized_at < date_trunc('month', now()) THEN 1 END)::bigint AS rides_prev_month
  FROM branches b
  LEFT JOIN machine_rides mr ON mr.branch_id = b.id AND mr.ride_status = 'FINALIZED'
  WHERE b.brand_id = p_brand_id
  GROUP BY b.id, b.name, b.city, b.state
  ORDER BY total_rides DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_side_bet_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(rank_position bigint, customer_id uuid, bettor_name text, total_bets bigint, bets_won bigint, bets_lost bigint, win_rate numeric, points_won bigint, points_lost bigint, net_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH all_bettors AS (
    -- Bettor A side
    SELECT
      sb.bettor_a_customer_id AS cid,
      1 AS bet_count,
      CASE WHEN sb.winner_customer_id = sb.bettor_a_customer_id THEN 1 ELSE 0 END AS won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_a_customer_id THEN 1 ELSE 0 END AS lost,
      CASE WHEN sb.winner_customer_id = sb.bettor_a_customer_id
        THEN COALESCE(sb.bettor_b_points, 0)
        ELSE 0
      END AS pts_won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_a_customer_id
        THEN sb.bettor_a_points
        ELSE 0
      END AS pts_lost
    FROM duel_side_bets sb
    WHERE sb.branch_id = p_branch_id
      AND sb.status = 'settled'
      AND sb.bettor_a_customer_id IS NOT NULL

    UNION ALL

    -- Bettor B side
    SELECT
      sb.bettor_b_customer_id AS cid,
      1 AS bet_count,
      CASE WHEN sb.winner_customer_id = sb.bettor_b_customer_id THEN 1 ELSE 0 END AS won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_b_customer_id THEN 1 ELSE 0 END AS lost,
      CASE WHEN sb.winner_customer_id = sb.bettor_b_customer_id
        THEN sb.bettor_a_points
        ELSE 0
      END AS pts_won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_b_customer_id
        THEN COALESCE(sb.bettor_b_points, 0)
        ELSE 0
      END AS pts_lost
    FROM duel_side_bets sb
    WHERE sb.branch_id = p_branch_id
      AND sb.status = 'settled'
      AND sb.bettor_b_customer_id IS NOT NULL
  ),
  aggregated AS (
    SELECT
      ab.cid,
      SUM(ab.bet_count)::bigint AS total_bets,
      SUM(ab.won)::bigint AS bets_won,
      SUM(ab.lost)::bigint AS bets_lost,
      CASE WHEN SUM(ab.bet_count) > 0
        THEN ROUND(SUM(ab.won)::numeric / SUM(ab.bet_count) * 100, 1)
        ELSE 0
      END AS win_rate,
      SUM(ab.pts_won)::bigint AS points_won,
      SUM(ab.pts_lost)::bigint AS points_lost,
      (SUM(ab.pts_won) - SUM(ab.pts_lost))::bigint AS net_points
    FROM all_bettors ab
    GROUP BY ab.cid
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.net_points DESC, a.win_rate DESC)::bigint AS rank_position,
    a.cid AS customer_id,
    COALESCE(ddp.public_nickname, TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi')), 'Apostador')::text AS bettor_name,
    a.total_bets,
    a.bets_won,
    a.bets_lost,
    a.win_rate,
    a.points_won,
    a.points_lost,
    a.net_points
  FROM aggregated a
  JOIN customers c ON c.id = a.cid
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = a.cid
  ORDER BY a.net_points DESC, a.win_rate DESC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_branch_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT branch_id FROM public.user_roles
  WHERE user_id = _user_id AND branch_id IS NOT NULL
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_brand_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT brand_id FROM public.user_roles
  WHERE user_id = _user_id AND brand_id IS NOT NULL
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT tenant_id FROM public.user_roles
  WHERE user_id = _user_id AND tenant_id IS NOT NULL
$function$
;

CREATE OR REPLACE FUNCTION public.grant_achievement(p_customer_id uuid, p_branch_id uuid, p_brand_id uuid, p_key text, p_label text, p_icon text DEFAULT 'Trophy'::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO driver_achievements (customer_id, branch_id, brand_id, achievement_key, achievement_label, icon_name, metadata_json)
  VALUES (p_customer_id, p_branch_id, p_brand_id, p_key, p_label, p_icon, p_metadata)
  ON CONFLICT (customer_id, achievement_key) DO NOTHING;
  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_duel_achievements(p_duel_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_winner_customer_id uuid;
  v_loser_customer_id uuid;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
  v_total_duels bigint;
  v_streak bigint;
  v_is_belt_holder boolean;
  v_check_cid uuid;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'finished';
  IF NOT FOUND THEN RETURN; END IF;

  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  -- Estreia no Ringue
  PERFORM grant_achievement(v_challenger_cid, v_duel.branch_id, v_duel.brand_id, 'first_duel_participated', 'Estreia no Ringue', 'Zap');
  PERFORM grant_achievement(v_challenged_cid, v_duel.branch_id, v_duel.brand_id, 'first_duel_participated', 'Estreia no Ringue', 'Zap');

  IF v_duel.winner_id IS NOT NULL THEN
    SELECT customer_id INTO v_winner_customer_id FROM driver_duel_participants WHERE id = v_duel.winner_id;
    IF v_duel.winner_id = v_duel.challenger_id THEN
      v_loser_customer_id := v_challenged_cid;
    ELSE
      v_loser_customer_id := v_challenger_cid;
    END IF;

    -- Primeira Vitória
    PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'first_duel_win', 'Primeira Vitória', 'Swords');

    -- Vingança Completa
    IF EXISTS (
      SELECT 1 FROM driver_duels d2
      JOIN driver_duel_participants p1 ON p1.id = d2.winner_id
      WHERE d2.status = 'finished' AND d2.id != p_duel_id
        AND p1.customer_id = v_loser_customer_id
        AND (
          (d2.challenger_id = v_duel.challenger_id AND d2.challenged_id = v_duel.challenged_id) OR
          (d2.challenger_id = v_duel.challenged_id AND d2.challenged_id = v_duel.challenger_id)
        )
    ) THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'rematch_winner', 'Vingança Completa', 'RotateCcw');
    END IF;

    -- Sequência de 5 vitórias
    WITH recent AS (
      SELECT d.id, pw.customer_id AS winner_cid, d.end_at
      FROM driver_duels d
      LEFT JOIN driver_duel_participants pw ON pw.id = d.winner_id
      WHERE d.status = 'finished' AND d.branch_id = v_duel.branch_id
        AND (
          EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenger_id AND dp.customer_id = v_winner_customer_id) OR
          EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenged_id AND dp.customer_id = v_winner_customer_id)
        )
      ORDER BY d.end_at DESC
    )
    SELECT COUNT(*) INTO v_streak FROM (
      SELECT * FROM recent WHERE winner_cid = v_winner_customer_id
      AND end_at >= COALESCE(
        (SELECT end_at FROM recent WHERE winner_cid IS DISTINCT FROM v_winner_customer_id ORDER BY end_at DESC LIMIT 1),
        '1970-01-01'::timestamptz
      )
    ) s;

    IF v_streak >= 5 THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'five_wins_streak', '5 Vitórias Seguidas', 'Flame');
    END IF;

    -- Dono do Cinturão
    IF EXISTS (SELECT 1 FROM city_belt_champions WHERE champion_customer_id = v_winner_customer_id AND branch_id = v_duel.branch_id) THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'belt_holder', 'Dono do Cinturão', 'Crown');
    END IF;

    -- Número 1 no ranking
    IF EXISTS (SELECT 1 FROM get_city_driver_ranking(v_duel.branch_id, 1) r WHERE r.customer_id = v_winner_customer_id) THEN
      PERFORM grant_achievement(v_winner_customer_id, v_duel.branch_id, v_duel.brand_id, 'top1_ranking', 'Número 1', 'Medal');
    END IF;
  END IF;

  -- Veterano (10 duelos) - ambos participantes
  FOR v_check_cid IN VALUES (v_challenger_cid), (v_challenged_cid) LOOP
    SELECT COUNT(*) INTO v_total_duels
    FROM driver_duels d
    WHERE d.status = 'finished'
      AND (
        EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenger_id AND dp.customer_id = v_check_cid) OR
        EXISTS (SELECT 1 FROM driver_duel_participants dp WHERE dp.id = d.challenged_id AND dp.customer_id = v_check_cid)
      );

    IF v_total_duels >= 10 THEN
      PERFORM grant_achievement(v_check_cid, v_duel.branch_id, v_duel.brand_id, 'ten_duels_completed', 'Veterano de Duelos', 'Target');
    END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.import_drivers_update_batch(p_updates jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_updated_count integer;
BEGIN
  IF p_updates IS NULL OR jsonb_array_length(p_updates) = 0 THEN RETURN 0; END IF;
  WITH src AS (
    SELECT * FROM jsonb_to_recordset(p_updates) AS u(
      id uuid, cpf text, phone text, email text, name text, external_driver_id text
    )
  )
  UPDATE public.customers c SET
    cpf = COALESCE(src.cpf, c.cpf),
    phone = COALESCE(src.phone, c.phone),
    email = COALESCE(src.email, c.email),
    name = COALESCE(src.name, c.name),
    external_driver_id = COALESCE(src.external_driver_id, c.external_driver_id),
    updated_at = now()
  FROM src WHERE c.id = src.id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_affiliate_click_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE affiliate_deals SET click_count = click_count + 1 WHERE id = NEW.deal_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_customer_balance(p_customer_id uuid, p_points integer DEFAULT 0, p_money numeric DEFAULT 0)
 RETURNS TABLE(new_points_balance numeric, new_money_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  UPDATE customers SET
    points_balance = COALESCE(points_balance, 0) + COALESCE(p_points, 0),
    money_balance = COALESCE(money_balance, 0) + COALESCE(p_money, 0),
    updated_at = now()
  WHERE id = p_customer_id
  RETURNING points_balance, money_balance;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.list_branch_drivers_for_duels(p_branch_id uuid, p_exclude_customer_id uuid)
 RETURNS TABLE(customer_id uuid, display_name text, public_nickname text, avatar_url text, is_enrolled boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id AS customer_id,
    TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi')) AS display_name,
    ddp.public_nickname,
    ddp.avatar_url,
    (ddp.id IS NOT NULL AND ddp.duels_enabled = true) AS is_enrolled
  FROM customers c
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = c.id
  WHERE c.branch_id = p_branch_id
    AND c.is_active = true
    AND c.name ILIKE '%[MOTORISTA]%'
    AND c.id != p_exclude_customer_id
  ORDER BY ddp.duels_enabled DESC NULLS LAST, TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi'))
$function$
;

CREATE OR REPLACE FUNCTION public.list_business_model_addons()
 RETURNS TABLE(id uuid, brand_id uuid, brand_name text, brand_slug text, subscription_plan text, branch_id uuid, branch_name text, business_model_id uuid, model_key text, model_name text, model_audience text, status text, billing_cycle text, price_cents integer, activated_at timestamp with time zone, expires_at timestamp with time zone, notes text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    a.id,
    a.brand_id,
    b.name::text AS brand_name,
    b.slug::text AS brand_slug,
    b.subscription_plan::text,
    a.branch_id,
    br.name::text AS branch_name,
    a.business_model_id,
    m.key::text AS model_key,
    m.name::text AS model_name,
    m.audience::text AS model_audience,
    a.status,
    a.billing_cycle,
    a.price_cents,
    a.activated_at,
    a.expires_at,
    a.notes,
    a.created_at
  FROM brand_business_model_addons a
  JOIN brands b ON b.id = a.brand_id
  JOIN business_models m ON m.id = a.business_model_id
  LEFT JOIN branches br ON br.id = a.branch_id
  WHERE public.has_role(auth.uid(), 'root_admin'::app_role)
  ORDER BY a.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.log_brand_module_toggle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_action text;
  v_old_enabled boolean;
  v_new_enabled boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := CASE WHEN NEW.is_enabled THEN 'MODULE_ENABLED' ELSE 'MODULE_DISABLED' END;
    v_old_enabled := NULL;
    v_new_enabled := NEW.is_enabled;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_enabled IS NOT DISTINCT FROM NEW.is_enabled THEN
      RETURN NEW;
    END IF;
    v_action := CASE WHEN NEW.is_enabled THEN 'MODULE_ENABLED' ELSE 'MODULE_DISABLED' END;
    v_old_enabled := OLD.is_enabled;
    v_new_enabled := NEW.is_enabled;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'MODULE_REMOVED';
    v_old_enabled := OLD.is_enabled;
    v_new_enabled := NULL;
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id, action, entity_type, entity_id,
    scope_type, scope_id, changes_json, details_json
  ) VALUES (
    auth.uid(),
    v_action,
    'brand_module',
    COALESCE(NEW.id, OLD.id),
    'brand',
    COALESCE(NEW.brand_id, OLD.brand_id),
    jsonb_build_object('is_enabled', jsonb_build_object('old', v_old_enabled, 'new', v_new_enabled)),
    jsonb_build_object(
      'module_definition_id', COALESCE(NEW.module_definition_id, OLD.module_definition_id),
      'brand_id', COALESCE(NEW.brand_id, OLD.brand_id)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.lookup_driver_by_cpf(p_brand_id uuid, p_cpf text)
 RETURNS TABLE(id uuid, name text, cpf text, email text, phone text, points_balance numeric, money_balance numeric, brand_id uuid, branch_id uuid, branch_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.cpf, c.email, c.phone,
         c.points_balance, c.money_balance,
         c.brand_id, c.branch_id,
         b.name AS branch_name
  FROM customers c
  LEFT JOIN branches b ON b.id = c.branch_id
  WHERE c.brand_id = p_brand_id
    AND c.cpf = p_cpf
    AND c.name ILIKE '%[MOTORISTA]%'
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.lookup_driver_by_id(p_brand_id uuid, p_customer_id uuid)
 RETURNS TABLE(id uuid, name text, cpf text, email text, phone text, points_balance numeric, money_balance numeric, brand_id uuid, branch_id uuid, branch_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.cpf, c.email, c.phone,
         c.points_balance, c.money_balance,
         c.brand_id, c.branch_id,
         b.name AS branch_name
  FROM customers c
  LEFT JOIN branches b ON b.id = c.branch_id
  WHERE c.brand_id = p_brand_id
    AND c.id = p_customer_id
    AND c.name ILIKE '%[MOTORISTA]%'
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_admin_city_redemption()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_name text;
  v_offer_title text;
BEGIN
  SELECT name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
  SELECT title INTO v_offer_title FROM offers WHERE id = NEW.offer_id;

  v_customer_name := COALESCE(v_customer_name, 'Cliente');
  v_offer_title := COALESCE(v_offer_title, 'Oferta');

  INSERT INTO public.admin_notifications (brand_id, title, body, type, reference_id)
  VALUES (
    NEW.brand_id,
    'Novo resgate de oferta',
    v_customer_name || ' resgatou "' || v_offer_title || '"',
    'redemption_city',
    NEW.id
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_admin_product_redemption()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_name text;
  v_product_title text;
  v_points integer;
BEGIN
  v_customer_name := COALESCE(NEW.customer_name, 'Cliente');
  v_product_title := COALESCE(NEW.deal_snapshot_json->>'title', 'Produto');
  v_points := COALESCE(NEW.points_spent, 0);

  INSERT INTO public.admin_notifications (brand_id, title, body, type, reference_id)
  VALUES (
    NEW.brand_id,
    'Novo resgate de produto',
    v_customer_name || ' resgatou "' || v_product_title || '" por ' || v_points || ' pts',
    'redemption_product',
    NEW.id
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_product_redemption(p_customer_id uuid, p_brand_id uuid, p_branch_id uuid, p_deal_id uuid, p_deal_snapshot jsonb, p_affiliate_url text, p_points_cost integer, p_name text, p_phone text, p_cpf text, p_cep text, p_address text, p_number text, p_complement text, p_neighborhood text, p_city text, p_state text, p_order_source text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_order_id uuid;
BEGIN
  -- Lock customer row and check balance
  SELECT points_balance INTO v_balance
  FROM customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  IF v_balance < p_points_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente: % pts disponíveis, % pts necessários', v_balance, p_points_cost;
  END IF;

  -- 1. Insert debit into points_ledger
  INSERT INTO points_ledger (
    customer_id, brand_id, branch_id,
    entry_type, points_amount, reason,
    reference_type, created_by_user_id
  ) VALUES (
    p_customer_id, p_brand_id, p_branch_id,
    'DEBIT', p_points_cost, 'Resgate: ' || (p_deal_snapshot->>'title'),
    'REDEMPTION', NULL
  );

  -- 2. Decrement customer balance
  UPDATE customers
  SET points_balance = v_balance - p_points_cost
  WHERE id = p_customer_id;

  -- 3. Create redemption order
  INSERT INTO product_redemption_orders (
    brand_id, branch_id, customer_id, deal_id,
    deal_snapshot_json, affiliate_url, points_spent,
    customer_name, customer_phone, customer_cpf,
    delivery_cep, delivery_address, delivery_number,
    delivery_complement, delivery_neighborhood,
    delivery_city, delivery_state, order_source
  ) VALUES (
    p_brand_id, p_branch_id, p_customer_id, p_deal_id,
    p_deal_snapshot, p_affiliate_url, p_points_cost,
    p_name, p_phone, NULLIF(p_cpf, ''),
    p_cep, p_address, p_number,
    NULLIF(p_complement, ''), p_neighborhood,
    p_city, p_state, p_order_source
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.public_get_hall_fama(p_brand_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_brand_name text;
  v_seasons jsonb;
  v_ranking jsonb;
BEGIN
  SELECT id, name INTO v_brand_id, v_brand_name
    FROM brands WHERE slug = p_brand_slug AND is_active = true;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Marca não encontrada';
  END IF;

  -- Helper inline: anonimização "João da Silva" -> "João S."
  -- Implementada via SUBSTRING / SPLIT_PART
  WITH champ_data AS (
    SELECT
      ds.id AS season_id,
      ds.name AS season_name,
      ds.year,
      ds.month,
      ds.knockout_ends_at,
      dc.champion_driver_id,
      dc.runner_up_driver_id,
      dc.semifinalist_ids
    FROM campeonato_champions dc
    JOIN campeonato_seasons ds ON ds.id = dc.season_id
    WHERE ds.brand_id = v_brand_id
      AND ds.phase = 'finished'
      AND ds.cancelled_at IS NULL
    ORDER BY ds.year DESC, ds.month DESC
    LIMIT 24
  ),
  anonymized AS (
    SELECT
      cd.*,
      (SELECT split_part(c.name, ' ', 1) || ' ' ||
              upper(substr(split_part(c.name, ' ', array_length(string_to_array(c.name, ' '), 1)), 1, 1)) || '.'
       FROM customers c WHERE c.id = cd.champion_driver_id) AS champion_name,
      (SELECT split_part(c.name, ' ', 1) || ' ' ||
              upper(substr(split_part(c.name, ' ', array_length(string_to_array(c.name, ' '), 1)), 1, 1)) || '.'
       FROM customers c WHERE c.id = cd.runner_up_driver_id) AS runner_up_name,
      (SELECT array_agg(
              split_part(c.name, ' ', 1) || ' ' ||
              upper(substr(split_part(c.name, ' ', array_length(string_to_array(c.name, ' '), 1)), 1, 1)) || '.')
       FROM customers c WHERE c.id = ANY(cd.semifinalist_ids)) AS semifinalist_names
    FROM champ_data cd
  )
  SELECT jsonb_agg(jsonb_build_object(
    'season_id', season_id,
    'season_name', season_name,
    'year', year,
    'month', month,
    'finished_at', knockout_ends_at,
    'champion', champion_name,
    'runner_up', runner_up_name,
    'semifinalists', COALESCE(semifinalist_names, ARRAY[]::text[])
  )) INTO v_seasons FROM anonymized;

  -- Top 10 de títulos acumulados
  WITH titles AS (
    SELECT dc.champion_driver_id AS driver_id, COUNT(*) AS title_count, MAX(ds.knockout_ends_at) AS last_win
    FROM campeonato_champions dc
    JOIN campeonato_seasons ds ON ds.id = dc.season_id
    WHERE ds.brand_id = v_brand_id AND ds.phase = 'finished' AND ds.cancelled_at IS NULL
      AND dc.champion_driver_id IS NOT NULL
    GROUP BY dc.champion_driver_id
    ORDER BY title_count DESC, last_win DESC
    LIMIT 10
  )
  SELECT jsonb_agg(jsonb_build_object(
    'driver_name', split_part(c.name, ' ', 1) || ' ' ||
                   upper(substr(split_part(c.name, ' ', array_length(string_to_array(c.name, ' '), 1)), 1, 1)) || '.',
    'title_count', t.title_count,
    'last_win', t.last_win
  ) ORDER BY t.title_count DESC, t.last_win DESC)
  INTO v_ranking
  FROM titles t JOIN customers c ON c.id = t.driver_id;

  RETURN jsonb_build_object(
    'brand_name', v_brand_name,
    'brand_slug', p_brand_slug,
    'seasons', COALESCE(v_seasons, '[]'::jsonb),
    'ranking_titles', COALESCE(v_ranking, '[]'::jsonb)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rate_limit_cleanup()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DELETE FROM public.rate_limit_entries
  WHERE window_start < now() - interval '1 hour';
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_city_offer_driver(p_customer_id uuid, p_offer_id uuid, p_brand_id uuid, p_branch_id uuid, p_customer_cpf text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offer RECORD;
  v_customer RECORD;
  v_points_cost numeric;
  v_redemption_id uuid;
  v_token text;
BEGIN
  SELECT id, title, value_rescue, min_purchase, offer_purpose, is_active, status
  INTO v_offer
  FROM offers
  WHERE id = p_offer_id
    AND brand_id = p_brand_id
    AND is_active = true
    AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta não encontrada ou inativa');
  END IF;

  SELECT id, points_balance
  INTO v_customer
  FROM customers
  WHERE id = p_customer_id
    AND brand_id = p_brand_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado');
  END IF;

  v_points_cost := CEIL(COALESCE(v_offer.value_rescue, 0));

  IF v_points_cost <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta sem valor de crédito definido');
  END IF;

  IF v_customer.points_balance < v_points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo de pontos insuficiente', 'balance', v_customer.points_balance, 'cost', v_points_cost);
  END IF;

  INSERT INTO redemptions (brand_id, branch_id, customer_id, offer_id, customer_cpf, offer_snapshot_json)
  VALUES (
    p_brand_id, p_branch_id, p_customer_id, p_offer_id, p_customer_cpf,
    jsonb_build_object('title', v_offer.title, 'value_rescue', v_offer.value_rescue, 'min_purchase', v_offer.min_purchase)
  )
  RETURNING id, token INTO v_redemption_id, v_token;

  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
  VALUES (
    p_customer_id, p_brand_id, p_branch_id, 'DEBIT', v_points_cost,
    'Resgate na cidade: ' || v_offer.title, 'REDEMPTION', v_redemption_id, NULL
  );

  UPDATE customers
  SET points_balance = points_balance - v_points_cost
  WHERE id = p_customer_id;

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'token', v_token,
    'points_debited', v_points_cost
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_prize_campaign(p_campaign_id uuid, p_customer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign public.duel_prize_campaigns%ROWTYPE;
  v_balance bigint;
  v_remaining bigint;
  v_customer record;
BEGIN
  SELECT * INTO v_campaign
  FROM public.duel_prize_campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campanha não encontrada' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_campaign.status <> 'active' THEN
    RAISE EXCEPTION 'Campanha não está ativa' USING ERRCODE = 'check_violation';
  END IF;

  IF now() < v_campaign.starts_at OR now() > v_campaign.ends_at THEN
    RAISE EXCEPTION 'Campanha fora da janela de validade' USING ERRCODE = 'check_violation';
  END IF;

  IF v_campaign.quantity_redeemed >= v_campaign.quantity_total THEN
    RAISE EXCEPTION 'Prêmio esgotado' USING ERRCODE = 'check_violation';
  END IF;

  SELECT id, brand_id, branch_id, name, phone, cpf
    INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Motorista não encontrado' USING ERRCODE = 'no_data_found';
  END IF;

  -- Calcula saldo atual via ledger
  SELECT COALESCE(SUM(
    CASE WHEN reference_type = 'DEBIT'::ledger_reference_type THEN -points_amount
         WHEN entry_type = 'DEBIT'::ledger_entry_type THEN -points_amount
         ELSE points_amount END
  ),0) INTO v_balance
  FROM public.points_ledger
  WHERE customer_id = p_customer_id;

  IF v_balance < v_campaign.points_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente (saldo: %, custo: %)', v_balance, v_campaign.points_cost
      USING ERRCODE = 'check_violation';
  END IF;

  -- Débito no ledger
  INSERT INTO public.points_ledger(
    brand_id, branch_id, customer_id,
    entry_type, points_amount, reason,
    reference_type, reference_id, created_by_user_id
  ) VALUES (
    v_campaign.brand_id, v_campaign.branch_id, p_customer_id,
    'PRIZE_REDEEM'::ledger_entry_type, v_campaign.points_cost,
    'Resgate de prêmio: ' || v_campaign.name,
    'PRIZE_CAMPAIGN'::ledger_reference_type, p_campaign_id, auth.uid()
  );

  -- Decrementa quantidade
  UPDATE public.duel_prize_campaigns
  SET quantity_redeemed = quantity_redeemed + 1,
      status = CASE WHEN quantity_redeemed + 1 >= quantity_total THEN 'ended' ELSE status END,
      updated_at = now()
  WHERE id = p_campaign_id;

  v_remaining := v_balance - v_campaign.points_cost;

  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', p_campaign_id,
    'campaign_name', v_campaign.name,
    'points_spent', v_campaign.points_cost,
    'remaining_balance', v_remaining,
    'redeemed_at', now()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reprocess_missing_driver_points(p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule RECORD;
  v_ride RECORD;
  v_points integer;
  v_processed integer := 0;
  v_skipped integer := 0;
  v_brand_id uuid;
BEGIN
  -- Get brand_id from branch
  SELECT brand_id INTO v_brand_id FROM branches WHERE id = p_branch_id;
  IF v_brand_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cidade não encontrada');
  END IF;

  -- Get active driver rule for this branch
  SELECT * INTO v_rule
  FROM driver_points_rules
  WHERE branch_id = p_branch_id AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma regra de pontuação ativa para esta cidade');
  END IF;

  -- Process rides with 0 driver points but valid driver
  FOR v_ride IN
    SELECT id, driver_customer_id, points_credited
    FROM machine_rides
    WHERE branch_id = p_branch_id
      AND ride_status = 'FINALIZED'
      AND driver_customer_id IS NOT NULL
      AND COALESCE(driver_points_credited, 0) = 0
    ORDER BY finalized_at ASC
    LIMIT 5000
  LOOP
    -- Calculate points based on rule mode
    IF v_rule.mode = 'FIXED' THEN
      v_points := v_rule.fixed_points;
    ELSIF v_rule.mode = 'PERCENT' THEN
      v_points := CEIL(COALESCE(v_ride.points_credited, 0) * v_rule.percent_value / 100.0);
    ELSIF v_rule.mode = 'POINTS_PER_REAL' THEN
      -- Cannot calculate without ride value, use fixed fallback
      v_points := COALESCE(v_rule.fixed_points, 1);
    ELSE
      v_points := COALESCE(v_rule.fixed_points, 1);
    END IF;

    IF v_points <= 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Update the ride record
    UPDATE machine_rides
    SET driver_points_credited = v_points
    WHERE id = v_ride.id;

    -- Credit the driver
    UPDATE customers
    SET points_balance = points_balance + v_points
    WHERE id = v_ride.driver_customer_id;

    -- Record in ledger
    INSERT INTO points_ledger (
      customer_id, brand_id, branch_id,
      entry_type, points_amount, reason,
      reference_type, reference_id, created_by_user_id
    ) VALUES (
      v_ride.driver_customer_id, v_brand_id, p_branch_id,
      'CREDIT', v_points,
      'Reprocessamento: pontos de corrida não creditados anteriormente',
      'MANUAL_ADJUSTMENT'::ledger_reference_type, v_ride.id, NULL
    );

    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'skipped', v_skipped
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_active_business_models(p_brand_id uuid, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(model_key text, is_enabled boolean, source text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH all_models AS (
    SELECT id, key FROM business_models WHERE is_active = true
  ),
  brand_state AS (
    SELECT business_model_id, is_enabled
    FROM brand_business_models
    WHERE brand_id = p_brand_id
  ),
  branch_state AS (
    SELECT business_model_id, is_enabled
    FROM city_business_model_overrides
    WHERE brand_id = p_brand_id
      AND p_branch_id IS NOT NULL
      AND branch_id = p_branch_id
  ),
  addon_brand AS (
    SELECT business_model_id
    FROM brand_business_model_addons
    WHERE brand_id = p_brand_id
      AND branch_id IS NULL
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  ),
  addon_branch AS (
    SELECT business_model_id
    FROM brand_business_model_addons
    WHERE brand_id = p_brand_id
      AND p_branch_id IS NOT NULL
      AND branch_id = p_branch_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
  SELECT
    m.key::text AS model_key,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN br.is_enabled
      WHEN bs.business_model_id IS NOT NULL THEN bs.is_enabled
      WHEN abr.business_model_id IS NOT NULL OR ab.business_model_id IS NOT NULL THEN true
      ELSE false
    END AS is_enabled,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN 'branch'
      WHEN abr.business_model_id IS NOT NULL THEN 'addon_branch'
      WHEN ab.business_model_id IS NOT NULL THEN 'addon'
      WHEN bs.business_model_id IS NOT NULL THEN 'brand'
      ELSE 'inactive'
    END::text AS source
  FROM all_models m
  LEFT JOIN brand_state bs ON bs.business_model_id = m.id
  LEFT JOIN branch_state br ON br.business_model_id = m.id
  LEFT JOIN addon_brand ab ON ab.business_model_id = m.id
  LEFT JOIN addon_branch abr ON abr.business_model_id = m.id
  ORDER BY m.key;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_active_modules(p_brand_id uuid, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(module_key text, is_enabled boolean, source text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    md.key AS module_key,
    COALESCE(cmo.is_enabled, bm.is_enabled, md.is_core) AS is_enabled,
    CASE
      WHEN cmo.id IS NOT NULL THEN 'branch'
      WHEN bm.id IS NOT NULL THEN 'brand'
      WHEN md.is_core THEN 'core'
      ELSE 'inactive'
    END AS source
  FROM public.module_definitions md
  LEFT JOIN public.brand_modules bm
    ON bm.module_definition_id = md.id AND bm.brand_id = p_brand_id
  LEFT JOIN public.city_module_overrides cmo
    ON cmo.module_definition_id = md.id
   AND cmo.branch_id = p_branch_id
   AND p_branch_id IS NOT NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.respond_counter_proposal(p_duel_id uuid, p_customer_id uuid, p_accept boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenger_balance numeric;
  v_challenged_balance numeric;
  v_bet integer;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending' AND negotiation_status = 'counter_proposed';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou sem contraproposta pendente');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante não encontrado');
  END IF;

  -- The responder must be the OTHER person (not the one who proposed)
  IF v_duel.counter_proposal_by = 'challenged' AND v_participant.id != v_duel.challenger_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiante pode responder à contraproposta');
  END IF;
  IF v_duel.counter_proposal_by = 'challenger' AND v_participant.id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiado pode responder à contraproposta');
  END IF;

  IF p_accept THEN
    v_bet := v_duel.counter_proposal_points;

    -- Get customer IDs
    SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
    SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

    -- Validate both balances
    SELECT points_balance INTO v_challenger_balance FROM customers WHERE id = v_challenger_customer_id;
    IF v_challenger_balance IS NULL OR v_challenger_balance < v_bet THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo do desafiante insuficiente para o valor acordado');
    END IF;

    SELECT points_balance INTO v_challenged_balance FROM customers WHERE id = v_challenged_customer_id;
    IF v_challenged_balance IS NULL OR v_challenged_balance < v_bet THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo do desafiado insuficiente para o valor acordado');
    END IF;

    -- Debit challenger
    UPDATE customers SET points_balance = points_balance - v_bet WHERE id = v_challenger_customer_id;
    INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
    VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

    -- Debit challenged
    UPDATE customers SET points_balance = points_balance - v_bet WHERE id = v_challenged_customer_id;
    INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
    VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

    -- Update duel
    UPDATE driver_duels SET
      status = 'accepted', accepted_at = now(),
      challenger_points_bet = v_bet,
      challenged_points_bet = v_bet,
      negotiation_status = 'agreed',
      points_reserved = true
    WHERE id = p_duel_id;

    RETURN jsonb_build_object('success', true, 'new_status', 'accepted', 'agreed_bet', v_bet);
  ELSE
    UPDATE driver_duels SET
      status = 'canceled',
      negotiation_status = 'rejected'
    WHERE id = p_duel_id;

    RETURN jsonb_build_object('success', true, 'new_status', 'canceled');
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.respond_side_bet_counter(p_bet_id uuid, p_customer_id uuid, p_accept boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_agreed_points integer;
  v_balance_a numeric;
  v_balance_b numeric;
BEGIN
  SELECT * INTO v_bet FROM duel_side_bets WHERE id = p_bet_id AND status = 'counter_proposed' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aposta não encontrada ou sem contraproposta');
  END IF;

  -- Only bettor A (creator) can respond to counter
  IF v_bet.bettor_a_customer_id != p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o criador da aposta pode responder');
  END IF;

  IF NOT p_accept THEN
    -- Reject: reopen bet
    UPDATE duel_side_bets SET
      bettor_b_customer_id = NULL,
      bettor_b_predicted_winner = NULL,
      counter_proposal_points = NULL,
      status = 'open'
    WHERE id = p_bet_id;
    RETURN jsonb_build_object('success', true, 'action', 'rejected');
  END IF;

  -- Accept counter: use counter_proposal_points as agreed value
  v_agreed_points := v_bet.counter_proposal_points;

  SELECT * INTO v_duel FROM driver_duels WHERE id = v_bet.duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está mais ativo');
  END IF;

  -- Validate balances
  SELECT points_balance INTO v_balance_a FROM customers WHERE id = v_bet.bettor_a_customer_id;
  IF v_balance_a IS NULL OR v_balance_a < v_agreed_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo do criador insuficiente');
  END IF;

  SELECT points_balance INTO v_balance_b FROM customers WHERE id = v_bet.bettor_b_customer_id;
  IF v_balance_b IS NULL OR v_balance_b < v_agreed_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo do aceitante insuficiente');
  END IF;

  -- Escrow both
  UPDATE customers SET points_balance = points_balance - v_agreed_points WHERE id = v_bet.bettor_a_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (v_bet.bettor_a_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_agreed_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  UPDATE customers SET points_balance = points_balance - v_agreed_points WHERE id = v_bet.bettor_b_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (v_bet.bettor_b_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_agreed_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  UPDATE duel_side_bets SET
    bettor_a_points = v_agreed_points,
    bettor_b_points = v_agreed_points,
    status = 'matched',
    points_reserved = true
  WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true, 'action', 'accepted', 'agreed_points', v_agreed_points);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.respond_to_duel(p_duel_id uuid, p_customer_id uuid, p_accept boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenged_balance numeric;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou já respondido');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND OR v_participant.id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiado pode responder');
  END IF;

  IF p_accept THEN
    -- If there are points involved, reserve them
    IF v_duel.challenger_points_bet > 0 AND v_duel.negotiation_status = 'proposed' THEN
      -- Validate challenged balance
      SELECT points_balance INTO v_challenged_balance FROM customers WHERE id = p_customer_id;
      IF v_challenged_balance IS NULL OR v_challenged_balance < v_duel.challenger_points_bet THEN
        RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente para aceitar a aposta', 'balance', COALESCE(v_challenged_balance, 0));
      END IF;

      -- Get customer IDs
      SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
      v_challenged_customer_id := p_customer_id;

      -- Debit challenger
      UPDATE customers SET points_balance = points_balance - v_duel.challenger_points_bet WHERE id = v_challenger_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
      VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_duel.challenger_points_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

      -- Debit challenged
      UPDATE customers SET points_balance = points_balance - v_duel.challenger_points_bet WHERE id = v_challenged_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
      VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_duel.challenger_points_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

      -- Update duel
      UPDATE driver_duels SET
        status = 'accepted', accepted_at = now(),
        challenged_points_bet = challenger_points_bet,
        negotiation_status = 'agreed',
        points_reserved = true
      WHERE id = p_duel_id;
    ELSE
      UPDATE driver_duels SET status = 'accepted', accepted_at = now() WHERE id = p_duel_id;
    END IF;
  ELSE
    UPDATE driver_duels SET status = 'declined', declined_at = now() WHERE id = p_duel_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_status', CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_get_driver_city_redemptions(p_customer_id uuid)
 RETURNS TABLE(id uuid, token text, status text, created_at timestamp with time zone, expires_at timestamp with time zone, used_at timestamp with time zone, offer_title text, store_name text, store_logo_url text, value_rescue numeric, min_purchase numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.id,
    r.token,
    r.status::text,
    r.created_at,
    r.expires_at,
    r.used_at,
    COALESCE(o.title, '')::text AS offer_title,
    COALESCE(s.name, '')::text AS store_name,
    COALESCE(s.logo_url, '')::text AS store_logo_url,
    COALESCE(o.value_rescue, 0)::numeric AS value_rescue,
    COALESCE(o.min_purchase, 0)::numeric AS min_purchase
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  LEFT JOIN stores s ON s.id = o.store_id
  WHERE r.customer_id = p_customer_id
  ORDER BY r.created_at DESC
  LIMIT 50;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_get_store_owner_redemptions(p_store_id uuid, p_page integer DEFAULT 0, p_page_size integer DEFAULT 30)
 RETURNS TABLE(id uuid, token text, status text, created_at timestamp with time zone, used_at timestamp with time zone, expires_at timestamp with time zone, customer_cpf text, offer_title text, customer_name text, customer_phone text, branch_name text, value_rescue numeric, min_purchase numeric, coupon_type text, offer_end_at timestamp with time zone, purchase_value numeric, credit_value_applied numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = p_store_id
      AND (
        s.owner_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'root_admin')
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role = 'brand_admin'
            AND ur.brand_id = s.brand_id
        )
      )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.token,
    r.status::text,
    r.created_at,
    r.used_at,
    r.expires_at,
    r.customer_cpf,
    COALESCE(o.title, '')::text AS offer_title,
    COALESCE(c.name, '—')::text AS customer_name,
    COALESCE(c.phone, '')::text AS customer_phone,
    COALESCE(b.name, '')::text AS branch_name,
    COALESCE(o.value_rescue, 0)::numeric AS value_rescue,
    COALESCE(o.min_purchase, 0)::numeric AS min_purchase,
    COALESCE(o.coupon_type, 'STORE')::text AS coupon_type,
    o.end_at AS offer_end_at,
    r.purchase_value,
    r.credit_value_applied
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN branches b ON b.id = r.branch_id
  WHERE o.store_id = p_store_id
    AND r.status IN ('PENDING', 'USED', 'EXPIRED')
  ORDER BY
    CASE r.status
      WHEN 'PENDING' THEN 0
      WHEN 'EXPIRED' THEN 1
      WHEN 'USED' THEN 2
    END,
    r.created_at DESC
  OFFSET p_page * p_page_size
  LIMIT p_page_size;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_gg_report_by_branch(p_brand_id uuid, p_period_start date, p_period_end date)
 RETURNS TABLE(branch_id uuid, branch_name text, branch_city text, branch_state text, total_pts bigint, total_fee numeric, n_stores bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    COALESCE(b.name,'(sem cidade)')::text,
    COALESCE(b.city,'')::text,
    COALESCE(b.state,'')::text,
    COALESCE(SUM(bge.points_amount),0)::bigint,
    COALESCE(SUM(bge.fee_total),0)::numeric,
    COUNT(DISTINCT bge.store_id)::bigint
  FROM ganha_ganha_billing_events bge
  LEFT JOIN stores s ON s.id = bge.store_id
  LEFT JOIN branches b ON b.id = s.branch_id
  WHERE (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
    AND bge.created_at::date >= p_period_start
    AND bge.created_at::date <= p_period_end
  GROUP BY b.id, b.name, b.city, b.state
  ORDER BY 6 DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_gg_report_by_month(p_brand_id uuid, p_year integer)
 RETURNS TABLE(month text, earn_pts bigint, redeem_pts bigint, earn_fee numeric, redeem_fee numeric, total_fee numeric, n_events bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT to_char(make_date(p_year, m, 1),'YYYY-MM') AS month
    FROM generate_series(1,12) AS m
  )
  SELECT
    m.month,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(bge.fee_total),0)::numeric,
    COUNT(bge.id)::bigint
  FROM months m
  LEFT JOIN ganha_ganha_billing_events bge
    ON bge.period_month = m.month
   AND (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
  GROUP BY m.month
  ORDER BY m.month;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_gg_report_by_store(p_brand_id uuid, p_period_start date, p_period_end date, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(store_id uuid, store_name text, branch_id uuid, earn_pts bigint, redeem_pts bigint, earn_fee numeric, redeem_fee numeric, total_fee numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    bge.store_id,
    COALESCE(s.name, 'Loja desconhecida')::text,
    s.branch_id,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(bge.fee_total),0)::numeric
  FROM ganha_ganha_billing_events bge
  LEFT JOIN stores s ON s.id = bge.store_id
  WHERE (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
    AND bge.created_at::date >= p_period_start
    AND bge.created_at::date <= p_period_end
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
  GROUP BY bge.store_id, s.name, s.branch_id
  ORDER BY 8 DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_gg_report_summary(p_brand_id uuid, p_period_start date, p_period_end date, p_store_id uuid DEFAULT NULL::uuid, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_earn_pts bigint, total_redeem_pts bigint, total_earn_fee numeric, total_redeem_fee numeric, total_fee numeric, n_events bigint, n_stores bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    has_role(auth.uid(),'root_admin'::app_role)
    OR (p_brand_id IS NOT NULL AND p_brand_id IN (SELECT get_user_brand_ids(auth.uid())))
    OR (p_store_id IS NOT NULL AND p_store_id IN (SELECT id FROM stores WHERE owner_user_id = auth.uid()))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.points_amount END),0)::bigint,
    COALESCE(SUM(CASE WHEN bge.event_type='EARN' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(CASE WHEN bge.event_type='REDEEM' THEN bge.fee_total END),0)::numeric,
    COALESCE(SUM(bge.fee_total),0)::numeric,
    COUNT(*)::bigint,
    COUNT(DISTINCT bge.store_id)::bigint
  FROM ganha_ganha_billing_events bge
  LEFT JOIN stores s ON s.id = bge.store_id
  WHERE (p_brand_id IS NULL OR bge.brand_id = p_brand_id)
    AND bge.created_at::date >= p_period_start
    AND bge.created_at::date <= p_period_end
    AND (p_store_id IS NULL OR bge.store_id = p_store_id)
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id);
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.set_redemption_expires_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Default 24 hours expiration if not set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '24 hours';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at_campeonato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.settle_side_bets(p_duel_id uuid, p_winner_participant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_total_pot integer;
  v_winner_prize integer;
  v_duel_bonus integer;
  v_bet_winner_cid uuid;
  v_duel_winner_cid uuid;
  v_settled_count integer := 0;
  v_total_duel_bonus integer := 0;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado');
  END IF;

  -- Get duel winner customer_id (for bonus)
  IF p_winner_participant_id IS NOT NULL THEN
    SELECT customer_id INTO v_duel_winner_cid FROM driver_duel_participants WHERE id = p_winner_participant_id;
  END IF;

  FOR v_bet IN SELECT * FROM duel_side_bets WHERE duel_id = p_duel_id AND status = 'matched' AND points_reserved = true FOR UPDATE
  LOOP
    v_total_pot := v_bet.bettor_a_points + v_bet.bettor_b_points;

    IF p_winner_participant_id IS NULL THEN
      -- Draw: refund both
      UPDATE customers SET points_balance = points_balance + v_bet.bettor_a_points WHERE id = v_bet.bettor_a_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
      VALUES (v_bet.bettor_a_customer_id, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_bet.bettor_a_points, 'Empate no Duelo - Devolução da Aposta', 'SIDE_BET_REFUND', v_bet.id);

      UPDATE customers SET points_balance = points_balance + v_bet.bettor_b_points WHERE id = v_bet.bettor_b_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
      VALUES (v_bet.bettor_b_customer_id, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_bet.bettor_b_points, 'Empate no Duelo - Devolução da Aposta', 'SIDE_BET_REFUND', v_bet.id);

      UPDATE duel_side_bets SET status = 'settled', settled_at = now(), duel_winner_bonus = 0 WHERE id = v_bet.id;
    ELSE
      -- Determine bet winner
      IF v_bet.bettor_a_predicted_winner = p_winner_participant_id THEN
        v_bet_winner_cid := v_bet.bettor_a_customer_id;
      ELSE
        v_bet_winner_cid := v_bet.bettor_b_customer_id;
      END IF;

      -- Calculate 90/10 split
      v_duel_bonus := FLOOR(v_total_pot * 0.10);
      v_winner_prize := v_total_pot - v_duel_bonus;

      -- Credit bet winner (90%)
      UPDATE customers SET points_balance = points_balance + v_winner_prize WHERE id = v_bet_winner_cid;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
      VALUES (v_bet_winner_cid, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_winner_prize, 'Aposta no Duelo - Vitória', 'SIDE_BET_WIN', v_bet.id);

      -- Credit duel winner (10% bonus)
      IF v_duel_winner_cid IS NOT NULL AND v_duel_bonus > 0 THEN
        UPDATE customers SET points_balance = points_balance + v_duel_bonus WHERE id = v_duel_winner_cid;
        INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
        VALUES (v_duel_winner_cid, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_duel_bonus, 'Bônus 10% - Apostas no seu duelo', 'SIDE_BET_DUEL_BONUS', v_bet.id);
        v_total_duel_bonus := v_total_duel_bonus + v_duel_bonus;
      END IF;

      UPDATE duel_side_bets SET
        status = 'settled',
        winner_customer_id = v_bet_winner_cid,
        duel_winner_bonus = v_duel_bonus,
        settled_at = now()
      WHERE id = v_bet.id;
    END IF;

    v_settled_count := v_settled_count + 1;
  END LOOP;

  -- Cancel any open/counter_proposed bets
  UPDATE duel_side_bets SET status = 'canceled' WHERE duel_id = p_duel_id AND status IN ('open','counter_proposed');

  RETURN jsonb_build_object('success', true, 'settled', v_settled_count, 'duel_winner_bonus_total', v_total_duel_bonus);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_brand_modules_from_business_models()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id           uuid;
  v_business_model_id  uuid;
  v_model_key          text;
  v_op                 text;
  v_old_enabled        boolean;
  v_new_enabled        boolean;
  v_should_enable      boolean := false;
  v_should_disable     boolean := false;

  v_required_modules   uuid[];
  v_required_keys      text[] := ARRAY[]::text[];
  v_enabled_keys       text[] := ARRAY[]::text[];
  v_disabled_keys      text[] := ARRAY[]::text[];
  v_skipped_shared     text[] := ARRAY[]::text[];
  v_skipped_core       text[] := ARRAY[]::text[];

  r record;
  v_other_uses_it      boolean;
BEGIN
  -- 1. Resolver contexto e operação
  IF TG_OP = 'DELETE' THEN
    v_brand_id          := OLD.brand_id;
    v_business_model_id := OLD.business_model_id;
    v_old_enabled       := OLD.is_enabled;
    v_new_enabled       := false;
    v_op                := 'DELETE';
  ELSE
    v_brand_id          := NEW.brand_id;
    v_business_model_id := NEW.business_model_id;
    v_new_enabled       := NEW.is_enabled;
    v_old_enabled       := COALESCE(OLD.is_enabled, false);
    v_op                := TG_OP;
  END IF;

  -- 2. Decidir se há trabalho a fazer
  IF v_old_enabled = false AND v_new_enabled = true THEN
    v_should_enable := true;
  ELSIF v_old_enabled = true AND v_new_enabled = false THEN
    v_should_disable := true;
  ELSE
    -- INSERT com is_enabled=false ou UPDATE sem mudar is_enabled
    -- (ex: ajuste de margem GG). Nada a sincronizar.
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 3. Buscar key do modelo (para audit)
  SELECT bm.key INTO v_model_key
  FROM public.business_models bm
  WHERE bm.id = v_business_model_id;

  -- 4. Buscar IDs e KEYs dos módulos REQUIRED do modelo
  SELECT array_agg(bmm.module_definition_id),
         array_agg(md.key)
    INTO v_required_modules, v_required_keys
  FROM public.business_model_modules bmm
  JOIN public.module_definitions md ON md.id = bmm.module_definition_id
  WHERE bmm.business_model_id = v_business_model_id
    AND bmm.is_required = true;

  IF v_required_modules IS NULL OR array_length(v_required_modules, 1) IS NULL THEN
    -- Modelo sem módulos REQUIRED — registra audit "noop"
    INSERT INTO public.audit_logs (
      actor_user_id, entity_type, entity_id, action, scope_type, scope_id, details_json
    ) VALUES (
      NULL, 'sync_trigger', v_brand_id, 'brand_modules_synced', 'BRAND', v_brand_id,
      jsonb_build_object(
        'trigger_op', v_op,
        'business_model_id', v_business_model_id,
        'business_model_key', v_model_key,
        'is_enabled_old', v_old_enabled,
        'is_enabled_new', v_new_enabled,
        'modules_required', '[]'::jsonb,
        'noop_reason', 'no_required_modules'
      )
    );
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 5. CASE ENABLE: UPSERT cada módulo REQUIRED como is_enabled=true
  IF v_should_enable THEN
    FOR r IN
      SELECT md.id, md.key, md.is_core
      FROM public.module_definitions md
      WHERE md.id = ANY(v_required_modules)
    LOOP
      IF r.is_core THEN
        v_skipped_core := array_append(v_skipped_core, r.key);
        CONTINUE;
      END IF;

      INSERT INTO public.brand_modules (brand_id, module_definition_id, is_enabled)
      VALUES (v_brand_id, r.id, true)
      ON CONFLICT (brand_id, module_definition_id)
      DO UPDATE SET is_enabled = true, updated_at = now();

      v_enabled_keys := array_append(v_enabled_keys, r.key);
    END LOOP;

  -- 6. CASE DISABLE: só desliga módulos não compartilhados com
  --    outro modelo ativo da mesma brand.
  ELSIF v_should_disable THEN
    FOR r IN
      SELECT md.id, md.key, md.is_core
      FROM public.module_definitions md
      WHERE md.id = ANY(v_required_modules)
    LOOP
      IF r.is_core THEN
        v_skipped_core := array_append(v_skipped_core, r.key);
        CONTINUE;
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM public.brand_business_models bbm
        JOIN public.business_model_modules bmm
          ON bmm.business_model_id = bbm.business_model_id
        WHERE bbm.brand_id = v_brand_id
          AND bbm.is_enabled = true
          AND bbm.business_model_id <> v_business_model_id
          AND bmm.module_definition_id = r.id
          AND bmm.is_required = true
      ) INTO v_other_uses_it;

      IF v_other_uses_it THEN
        v_skipped_shared := array_append(v_skipped_shared, r.key);
        CONTINUE;
      END IF;

      UPDATE public.brand_modules
         SET is_enabled = false, updated_at = now()
       WHERE brand_id = v_brand_id
         AND module_definition_id = r.id;

      v_disabled_keys := array_append(v_disabled_keys, r.key);
    END LOOP;
  END IF;

  -- 7. Audit log consolidado (1 linha por evento)
  INSERT INTO public.audit_logs (
    actor_user_id, entity_type, entity_id, action, scope_type, scope_id, details_json
  ) VALUES (
    NULL, 'sync_trigger', v_brand_id, 'brand_modules_synced', 'BRAND', v_brand_id,
    jsonb_build_object(
      'trigger_op', v_op,
      'business_model_id', v_business_model_id,
      'business_model_key', v_model_key,
      'is_enabled_old', v_old_enabled,
      'is_enabled_new', v_new_enabled,
      'modules_required',       to_jsonb(v_required_keys),
      'modules_enabled',        to_jsonb(v_enabled_keys),
      'modules_disabled',       to_jsonb(v_disabled_keys),
      'modules_skipped_shared', to_jsonb(v_skipped_shared),
      'modules_skipped_core',   to_jsonb(v_skipped_core)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_campeonato_motorista_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_module_key text;
BEGIN
  SELECT key INTO v_module_key
  FROM public.module_definitions
  WHERE id = NEW.module_definition_id;

  IF v_module_key = 'campeonato_motorista' THEN
    UPDATE public.brands
    SET brand_settings_json =
      COALESCE(brand_settings_json, '{}'::jsonb)
      || jsonb_build_object('duelo_campeonato_enabled', NEW.is_enabled)
    WHERE id = NEW.brand_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tg_campeonato_artilharia_window_prizes_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tg_driver_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tg_module_templates_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tg_sync_driver_profile_branch()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN
    UPDATE public.driver_profiles
       SET branch_id = NEW.branch_id
     WHERE customer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_duel_participation(p_customer_id uuid, p_branch_id uuid, p_brand_id uuid, p_enabled boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant_id uuid;
  v_display_name text;
BEGIN
  -- Get clean name from customers
  SELECT TRIM(REGEXP_REPLACE(name, '\[MOTORISTA\]\s*', '', 'gi'))
  INTO v_display_name
  FROM customers
  WHERE id = p_customer_id;

  INSERT INTO driver_duel_participants (customer_id, branch_id, brand_id, duels_enabled, display_name)
  VALUES (p_customer_id, p_branch_id, p_brand_id, p_enabled, v_display_name)
  ON CONFLICT (customer_id) DO UPDATE SET
    duels_enabled = p_enabled,
    display_name = COALESCE(driver_duel_participants.display_name, EXCLUDED.display_name)
  RETURNING id INTO v_participant_id;

  RETURN jsonb_build_object('success', true, 'participant_id', v_participant_id, 'duels_enabled', p_enabled);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_city_belt(p_branch_id uuid, p_brand_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_top_customer_id uuid;
  v_top_rides bigint;
  v_current_champion uuid;
  v_current_record bigint;
  v_prize integer;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  SELECT mr.driver_customer_id, COUNT(*)::bigint
  INTO v_top_customer_id, v_top_rides
  FROM machine_rides mr
  WHERE mr.branch_id = p_branch_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.finalized_at >= date_trunc('month', now())
    AND mr.driver_customer_id IS NOT NULL
  GROUP BY mr.driver_customer_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_top_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma corrida encontrada no período');
  END IF;

  SELECT champion_customer_id, record_value, belt_prize_points
  INTO v_current_champion, v_current_record, v_prize
  FROM city_belt_champions
  WHERE branch_id = p_branch_id AND record_type = 'monthly';

  IF v_current_champion = v_top_customer_id AND v_current_record = v_top_rides THEN
    RETURN jsonb_build_object('success', true, 'changed', false);
  END IF;

  -- Prize distribution when belt changes hands
  IF v_current_champion IS NOT NULL
     AND v_current_champion IS DISTINCT FROM v_top_customer_id
     AND v_top_rides > v_current_record
     AND COALESCE(v_prize, 0) > 0 THEN

    UPDATE customers SET points_balance = points_balance + v_prize WHERE id = v_top_customer_id;

    INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
    VALUES (v_top_customer_id, p_brand_id, p_branch_id, 'CREDIT', v_prize,
            'Tomou o Cinturão da Cidade! Prêmio de ' || v_prize || ' pts', 'BELT_PRIZE', NULL, NULL);

    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF FOUND THEN
      v_new_balance := v_wallet.balance - v_prize;
      UPDATE branch_points_wallet SET balance = v_new_balance, total_distributed = total_distributed + v_prize, updated_at = now() WHERE id = v_wallet.id;
      INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
      VALUES (p_branch_id, p_brand_id, 'DEBIT', v_prize, v_new_balance, 'Prêmio Cinturão da Cidade');
    END IF;
  END IF;

  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at, belt_prize_points, assigned_manually)
  VALUES (p_branch_id, p_brand_id, v_top_customer_id, v_top_rides, 'monthly', now(), 0, false)
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at,
    belt_prize_points = 0,
    assigned_manually = false;

  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at)
  VALUES (p_branch_id, p_brand_id, v_top_customer_id, v_top_rides, 'all_time', now())
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at
  WHERE EXCLUDED.record_value > city_belt_champions.record_value;

  RETURN jsonb_build_object('success', true, 'changed', true, 'champion_customer_id', v_top_customer_id, 'record_value', v_top_rides, 'prize_awarded', COALESCE(v_prize, 0));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ganha_ganha_pricing(p_plan_key text, p_price_cents integer, p_min_margin_pct numeric DEFAULT NULL::numeric, p_max_margin_pct numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Apenas root_admin pode atualizar pricing
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND role = 'root_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores root podem atualizar pricing do Ganha-Ganha';
  END IF;

  -- Validações
  IF p_price_cents IS NULL OR p_price_cents < 1 OR p_price_cents > 1000 THEN
    RAISE EXCEPTION 'price_cents deve estar entre 1 e 1000 (R$ 0,01 a R$ 10,00)';
  END IF;

  IF p_min_margin_pct IS NOT NULL AND (p_min_margin_pct < 0 OR p_min_margin_pct > 500) THEN
    RAISE EXCEPTION 'min_margin_pct deve estar entre 0 e 500';
  END IF;

  IF p_max_margin_pct IS NOT NULL AND (p_max_margin_pct < 0 OR p_max_margin_pct > 500) THEN
    RAISE EXCEPTION 'max_margin_pct deve estar entre 0 e 500';
  END IF;

  IF p_min_margin_pct IS NOT NULL AND p_max_margin_pct IS NOT NULL
     AND p_max_margin_pct <= p_min_margin_pct THEN
    RAISE EXCEPTION 'max_margin_pct deve ser maior que min_margin_pct';
  END IF;

  -- 1) Fecha a versão atual
  UPDATE public.plan_ganha_ganha_pricing
     SET valid_to = now()
   WHERE plan_key = p_plan_key
     AND valid_to IS NULL;

  -- 2) Insere nova versão ativa
  INSERT INTO public.plan_ganha_ganha_pricing (
    plan_key, price_per_point_cents, min_margin_pct, max_margin_pct, valid_from, valid_to
  ) VALUES (
    p_plan_key, p_price_cents, p_min_margin_pct, p_max_margin_pct, now(), NULL
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission_key text, _scope_type text DEFAULT 'PLATFORM'::text, _scope_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_denied boolean;
  _is_allowed boolean;
BEGIN
  IF has_role(_user_id, 'root_admin'::app_role) THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_permission_overrides
    WHERE user_id = _user_id AND permission_key = _permission_key
      AND scope_type = _scope_type AND (scope_id = _scope_id OR scope_id IS NULL)
      AND is_allowed = false
  ) INTO _is_denied;
  IF _is_denied THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_permission_overrides
    WHERE user_id = _user_id AND permission_key = _permission_key
      AND scope_type = _scope_type AND (scope_id = _scope_id OR scope_id IS NULL)
      AND is_allowed = true
  ) INTO _is_allowed;
  IF _is_allowed THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.name = ur.role::text
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.key = _permission_key
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_belt_record_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.record_type NOT IN ('monthly', 'all_time') THEN
    RAISE EXCEPTION 'record_type must be monthly or all_time';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_brand_business_model_formats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invalid text;
BEGIN
  -- Deve ter pelo menos 1 formato liberado
  IF NEW.allowed_engagement_formats IS NULL
     OR array_length(NEW.allowed_engagement_formats, 1) IS NULL
     OR array_length(NEW.allowed_engagement_formats, 1) < 1 THEN
    RAISE EXCEPTION 'Pelo menos 1 formato de engajamento deve estar liberado.';
  END IF;

  -- Só aceita os 3 formatos conhecidos
  SELECT f INTO v_invalid
    FROM unnest(NEW.allowed_engagement_formats) AS f
   WHERE f NOT IN ('duelo','mass_duel','campeonato')
   LIMIT 1;

  IF v_invalid IS NOT NULL THEN
    RAISE EXCEPTION 'Formato inválido na lista de liberados: %', v_invalid;
  END IF;

  -- O formato ativo deve estar entre os liberados
  IF NEW.engagement_format IS NOT NULL
     AND NEW.engagement_format <> ALL (NEW.allowed_engagement_formats) THEN
    RAISE EXCEPTION 'Formato ativo (%) não está na lista de formatos liberados desta marca.',
      NEW.engagement_format;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_commercial_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.work_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', NEW.work_email;
  END IF;

  IF length(regexp_replace(NEW.phone, '\D', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
  END IF;

  IF length(trim(NEW.full_name)) < 3 THEN
    RAISE EXCEPTION 'Nome muito curto';
  END IF;

  IF length(trim(NEW.company_name)) < 2 THEN
    RAISE EXCEPTION 'Nome da empresa muito curto';
  END IF;

  NEW.work_email := lower(trim(NEW.work_email));
  NEW.full_name := trim(NEW.full_name);
  NEW.company_name := trim(NEW.company_name);

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_coupon_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type NOT IN ('PERCENT', 'FIXED') THEN
    RAISE EXCEPTION 'coupon type must be PERCENT or FIXED';
  END IF;
  IF NEW.status NOT IN ('ACTIVE', 'INACTIVE', 'EXPIRED') THEN
    RAISE EXCEPTION 'coupon status must be ACTIVE, INACTIVE, or EXPIRED';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_customer_crm_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.crm_sync_status NOT IN ('SYNCED','PENDING','NONE') THEN
    RAISE EXCEPTION 'crm_sync_status must be SYNCED, PENDING, or NONE';
  END IF;
  IF NEW.customer_tier NOT IN ('INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','LENDARIO','GALATICO') THEN
    RAISE EXCEPTION 'customer_tier must be a valid tier';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_driver_points_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'CONFIRMED', 'CANCELLED') THEN
    RAISE EXCEPTION 'status must be PENDING, CONFIRMED, or CANCELLED';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_duel_bet_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings jsonb;
  v_max_individual integer;
  v_max_total integer;
  v_min_individual integer;
  v_total integer;
BEGIN
  SELECT branch_settings_json INTO v_settings
  FROM public.branches WHERE id = NEW.branch_id;

  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;

  v_max_individual := NULLIF(v_settings->>'duel_bet_max_individual','')::integer;
  v_max_total := NULLIF(v_settings->>'duel_bet_max_total','')::integer;
  v_min_individual := NULLIF(v_settings->>'duel_bet_min_individual','')::integer;

  IF v_max_individual IS NOT NULL THEN
    IF NEW.challenger_points_bet > v_max_individual THEN
      RAISE EXCEPTION 'Aposta individual do desafiante excede o limite (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.challenged_points_bet > v_max_individual THEN
      RAISE EXCEPTION 'Aposta individual do desafiado excede o limite (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_min_individual IS NOT NULL THEN
    IF NEW.challenger_points_bet > 0 AND NEW.challenger_points_bet < v_min_individual THEN
      RAISE EXCEPTION 'Aposta do desafiante abaixo do mínimo (%).', v_min_individual
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.challenged_points_bet > 0 AND NEW.challenged_points_bet < v_min_individual THEN
      RAISE EXCEPTION 'Aposta do desafiado abaixo do mínimo (%).', v_min_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  v_total := COALESCE(NEW.challenger_points_bet,0) + COALESCE(NEW.challenged_points_bet,0);
  IF v_max_total IS NOT NULL AND v_total > v_max_total THEN
    RAISE EXCEPTION 'Total apostado no duelo (%) excede o limite (%).', v_total, v_max_total
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_duel_negotiation_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.negotiation_status NOT IN ('none','proposed','counter_proposed','agreed','rejected') THEN
    RAISE EXCEPTION 'negotiation_status must be none, proposed, counter_proposed, agreed, or rejected';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_duel_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pending','accepted','declined','live','finished','canceled') THEN
    RAISE EXCEPTION 'status must be pending, accepted, declined, live, finished, or canceled';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_offer_branch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND branch_id = NEW.branch_id AND brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'Offer brand_id/branch_id must match the store';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_order_source()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_source NOT IN ('driver', 'customer') THEN
    RAISE EXCEPTION 'order_source must be driver or customer';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_package_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'CONFIRMED', 'CANCELLED') THEN
    RAISE EXCEPTION 'status must be PENDING, CONFIRMED, or CANCELLED';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_redeemable_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.redeemable_by NOT IN ('driver', 'customer', 'both') THEN
    RAISE EXCEPTION 'redeemable_by must be driver, customer, or both';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_redemption_branch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM offers WHERE id = NEW.offer_id AND branch_id = NEW.branch_id AND brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'Redemption branch/brand must match the offer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = NEW.customer_id AND branch_id = NEW.branch_id AND brand_id = NEW.brand_id) THEN
    RAISE EXCEPTION 'Redemption branch/brand must match the customer';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_redemption_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'REJECTED') THEN
    RAISE EXCEPTION 'status must be PENDING, APPROVED, SHIPPED, DELIVERED, or REJECTED';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_season_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('upcoming', 'active', 'finished') THEN
    RAISE EXCEPTION 'status must be upcoming, active, or finished';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_side_bet_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings jsonb;
  v_max_individual integer;
  v_min_individual integer;
BEGIN
  SELECT branch_settings_json INTO v_settings
  FROM public.branches WHERE id = NEW.branch_id;

  IF v_settings IS NULL THEN
    RETURN NEW;
  END IF;

  v_max_individual := NULLIF(v_settings->>'duel_bet_max_individual','')::integer;
  v_min_individual := NULLIF(v_settings->>'duel_bet_min_individual','')::integer;

  IF v_max_individual IS NOT NULL THEN
    IF NEW.bettor_a_points > v_max_individual THEN
      RAISE EXCEPTION 'Aposta paralela A excede o limite individual (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.bettor_b_points IS NOT NULL AND NEW.bettor_b_points > v_max_individual THEN
      RAISE EXCEPTION 'Aposta paralela B excede o limite individual (%).', v_max_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_min_individual IS NOT NULL THEN
    IF NEW.bettor_a_points > 0 AND NEW.bettor_a_points < v_min_individual THEN
      RAISE EXCEPTION 'Aposta paralela A abaixo do mínimo (%).', v_min_individual
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_side_bet_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('open','counter_proposed','matched','settled','canceled') THEN
    RAISE EXCEPTION 'status must be open, counter_proposed, matched, settled, or canceled';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_tier_points_rules_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tier NOT IN ('INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','LENDARIO','GALATICO') THEN
    RAISE EXCEPTION 'tier must be a valid tier value';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;


-- =====================================================================
-- TRIGGERS
-- =====================================================================

CREATE TRIGGER trg_increment_affiliate_clicks AFTER INSERT ON public.affiliate_clicks FOR EACH ROW EXECUTE FUNCTION increment_affiliate_click_count();
CREATE TRIGGER trg_validate_redeemable_by BEFORE INSERT OR UPDATE ON public.affiliate_deals FOR EACH ROW EXECUTE FUNCTION validate_redeemable_by();
CREATE TRIGGER update_affiliate_deals_updated_at BEFORE UPDATE ON public.affiliate_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banner_schedules_updated_at BEFORE UPDATE ON public.banner_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branch_points_wallet_updated_at BEFORE UPDATE ON public.branch_points_wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bbma_updated_at BEFORE UPDATE ON public.brand_business_model_addons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bbm_updated_at BEFORE UPDATE ON public.brand_business_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sync_brand_modules_from_bbm AFTER INSERT OR DELETE OR UPDATE ON public.brand_business_models FOR EACH ROW EXECUTE FUNCTION sync_brand_modules_from_business_models();
CREATE TRIGGER trg_validate_brand_business_model_formats BEFORE INSERT OR UPDATE OF allowed_engagement_formats, engagement_format ON public.brand_business_models FOR EACH ROW EXECUTE FUNCTION validate_brand_business_model_formats();
CREATE TRIGGER trg_brand_duelo_prizes_updated_at BEFORE UPDATE ON public.brand_duelo_prizes FOR EACH ROW EXECUTE FUNCTION set_updated_at_campeonato();
CREATE TRIGGER trg_log_brand_module_toggle AFTER INSERT OR DELETE OR UPDATE ON public.brand_modules FOR EACH ROW EXECUTE FUNCTION log_brand_module_toggle();
CREATE TRIGGER trg_sync_campeonato_motorista_flag AFTER INSERT OR UPDATE OF is_enabled ON public.brand_modules FOR EACH ROW EXECUTE FUNCTION sync_campeonato_motorista_flag();
CREATE TRIGGER update_brand_modules_updated_at BEFORE UPDATE ON public.brand_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_permission_config_updated_at BEFORE UPDATE ON public.brand_permission_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_sections_updated_at BEFORE UPDATE ON public.brand_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_business_models_updated_at BEFORE UPDATE ON public.business_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_campeonato_artilharia_window_prizes_updated_at BEFORE UPDATE ON public.campeonato_artilharia_window_prizes FOR EACH ROW EXECUTE FUNCTION tg_campeonato_artilharia_window_prizes_updated_at();
CREATE TRIGGER trg_campeonato_driver_tier_history_updated_at BEFORE UPDATE ON public.campeonato_driver_tier_history FOR EACH ROW EXECUTE FUNCTION set_updated_at_campeonato();
CREATE TRIGGER trg_campeonato_prize_dist_updated_at BEFORE UPDATE ON public.campeonato_prize_distributions FOR EACH ROW EXECUTE FUNCTION campeonato_prize_dist_set_updated_at();
CREATE TRIGGER trg_dse_updated_at BEFORE UPDATE ON public.campeonato_season_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_campeonato_guard_tier_target_size BEFORE UPDATE ON public.campeonato_season_tiers FOR EACH ROW EXECUTE FUNCTION _campeonato_guard_tier_target_size();
CREATE TRIGGER trg_campeonato_validate_tier_config BEFORE INSERT OR UPDATE ON public.campeonato_season_tiers FOR EACH ROW EXECUTE FUNCTION campeonato_validate_tier_config();
CREATE TRIGGER trg_campeonato_seasons_updated_at BEFORE UPDATE ON public.campeonato_seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_campeonato_guard_tier_membership_insert BEFORE INSERT ON public.campeonato_tier_memberships FOR EACH ROW EXECUTE FUNCTION campeonato_guard_tier_membership_insert();
CREATE TRIGGER trg_campeonato_notif_season_created AFTER INSERT ON public.campeonato_tier_memberships FOR EACH ROW EXECUTE FUNCTION campeonato_notify_season_created();
CREATE TRIGGER trg_campeonato_sync_tier_history AFTER INSERT OR UPDATE OF tier_id ON public.campeonato_tier_memberships FOR EACH ROW EXECUTE FUNCTION campeonato_sync_tier_history();
CREATE TRIGGER trg_validate_belt_record_type BEFORE INSERT OR UPDATE ON public.city_belt_champions FOR EACH ROW EXECUTE FUNCTION validate_belt_record_type();
CREATE TRIGGER trg_cbmo_updated_at BEFORE UPDATE ON public.city_business_model_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cmo_updated_at BEFORE UPDATE ON public.city_module_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_commercial_lead_field_changes AFTER UPDATE ON public.commercial_leads FOR EACH ROW EXECUTE FUNCTION fn_log_commercial_lead_field_changes();
CREATE TRIGGER trg_commercial_leads_updated_at BEFORE UPDATE ON public.commercial_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_log_commercial_lead_status_change AFTER UPDATE ON public.commercial_leads FOR EACH ROW EXECUTE FUNCTION fn_log_commercial_lead_status_change();
CREATE TRIGGER trg_validate_commercial_lead BEFORE INSERT OR UPDATE OF work_email, phone, full_name, company_name ON public.commercial_leads FOR EACH ROW EXECUTE FUNCTION validate_commercial_lead();
CREATE TRIGGER trg_validate_coupon BEFORE INSERT OR UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION validate_coupon_fields();
CREATE TRIGGER set_crm_audiences_updated_at BEFORE UPDATE ON public.crm_audiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_crm_campaigns_updated_at BEFORE UPDATE ON public.crm_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_pages_updated_at BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_auto_assign_customer_role AFTER INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION auto_assign_customer_role();
CREATE TRIGGER trg_sync_driver_profile_branch AFTER UPDATE OF branch_id ON public.customers FOR EACH ROW EXECUTE FUNCTION tg_sync_driver_profile_branch();
CREATE TRIGGER trg_validate_customer_crm BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION validate_customer_crm_fields();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_duel_participants_updated_at BEFORE UPDATE ON public.driver_duel_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validate_duel_bet_limits BEFORE INSERT OR UPDATE OF challenger_points_bet, challenged_points_bet ON public.driver_duels FOR EACH ROW EXECUTE FUNCTION validate_duel_bet_limits();
CREATE TRIGGER trg_validate_duel_status BEFORE INSERT OR UPDATE ON public.driver_duels FOR EACH ROW EXECUTE FUNCTION validate_duel_status();
CREATE TRIGGER update_duels_updated_at BEFORE UPDATE ON public.driver_duels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER validate_duel_negotiation BEFORE INSERT OR UPDATE ON public.driver_duels FOR EACH ROW EXECUTE FUNCTION validate_duel_negotiation_status();
CREATE TRIGGER update_driver_message_flows_updated_at BEFORE UPDATE ON public.driver_message_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_message_templates_updated_at BEFORE UPDATE ON public.driver_message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_points_orders_updated_at BEFORE UPDATE ON public.driver_points_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER validate_driver_points_order_status_trigger BEFORE INSERT OR UPDATE ON public.driver_points_orders FOR EACH ROW EXECUTE FUNCTION validate_driver_points_order_status();
CREATE TRIGGER update_driver_points_purchase_config_updated_at BEFORE UPDATE ON public.driver_points_purchase_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_driver_profiles_updated_at BEFORE UPDATE ON public.driver_profiles FOR EACH ROW EXECUTE FUNCTION tg_driver_profiles_updated_at();
CREATE TRIGGER update_dpc_updated_at BEFORE UPDATE ON public.duel_prize_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validate_side_bet_limits BEFORE INSERT OR UPDATE OF bettor_a_points, bettor_b_points ON public.duel_side_bets FOR EACH ROW EXECUTE FUNCTION validate_side_bet_limits();
CREATE TRIGGER trg_validate_side_bet_status BEFORE INSERT OR UPDATE ON public.duel_side_bets FOR EACH ROW EXECUTE FUNCTION validate_side_bet_status();
CREATE TRIGGER update_duel_side_bets_updated_at BEFORE UPDATE ON public.duel_side_bets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validate_season_status BEFORE INSERT OR UPDATE ON public.gamification_seasons FOR EACH ROW EXECUTE FUNCTION validate_season_status();
CREATE TRIGGER update_ganha_ganha_config_updated_at BEFORE UPDATE ON public.ganha_ganha_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ganha_ganha_store_fees_updated_at BEFORE UPDATE ON public.ganha_ganha_store_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_home_template_library_updated_at BEFORE UPDATE ON public.home_template_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_duelo_bracket_rides AFTER INSERT OR UPDATE OF ride_status, finalized_at ON public.machine_rides FOR EACH ROW EXECUTE FUNCTION campeonato_increment_bracket_rides();
CREATE TRIGGER trg_duelo_standings_from_ride AFTER INSERT OR UPDATE OF ride_status, finalized_at ON public.machine_rides FOR EACH ROW EXECUTE FUNCTION campeonato_update_standings_from_ride();
CREATE TRIGGER update_menu_labels_updated_at BEFORE UPDATE ON public.menu_labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_source_catalog_updated_at BEFORE UPDATE ON public.mirror_source_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_definitions_updated_at BEFORE UPDATE ON public.module_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_module_templates_touch BEFORE UPDATE ON public.module_templates FOR EACH ROW EXECUTE FUNCTION tg_module_templates_touch_updated_at();
CREATE TRIGGER trg_validate_offer_branch BEFORE INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION validate_offer_branch();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pggp_updated_at BEFORE UPDATE ON public.plan_ganha_ganha_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_plan_module_templates BEFORE UPDATE ON public.plan_module_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER validate_package_order_status_trigger BEFORE INSERT OR UPDATE ON public.points_package_orders FOR EACH ROW EXECUTE FUNCTION validate_package_order_status();
CREATE TRIGGER update_points_packages_updated_at BEFORE UPDATE ON public.points_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_points_rules_updated_at BEFORE UPDATE ON public.points_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_product_redemption_admin_notif AFTER INSERT ON public.product_redemption_orders FOR EACH ROW EXECUTE FUNCTION notify_admin_product_redemption();
CREATE TRIGGER trg_validate_order_source BEFORE INSERT OR UPDATE ON public.product_redemption_orders FOR EACH ROW EXECUTE FUNCTION validate_order_source();
CREATE TRIGGER trg_validate_redemption_order_status BEFORE INSERT OR UPDATE ON public.product_redemption_orders FOR EACH ROW EXECUTE FUNCTION validate_redemption_order_status();
CREATE TRIGGER on_first_user_assign_root_admin AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION auto_assign_root_admin();
CREATE TRIGGER on_city_redemption_admin_notif AFTER INSERT ON public.redemptions FOR EACH ROW EXECUTE FUNCTION notify_admin_city_redemption();
CREATE TRIGGER trg_generate_redemption_pin BEFORE INSERT ON public.redemptions FOR EACH ROW EXECUTE FUNCTION generate_redemption_pin();
CREATE TRIGGER trg_set_redemption_expires_at BEFORE INSERT ON public.redemptions FOR EACH ROW EXECUTE FUNCTION set_redemption_expires_at();
CREATE TRIGGER trg_validate_redemption_branch BEFORE INSERT OR UPDATE ON public.redemptions FOR EACH ROW EXECUTE FUNCTION validate_redemption_branch();
CREATE TRIGGER update_store_employees_updated_at BEFORE UPDATE ON public.store_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_auto_assign_store_admin AFTER UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION auto_assign_store_admin_on_approval();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taxonomy_categories_updated_at BEFORE UPDATE ON public.taxonomy_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taxonomy_segments_updated_at BEFORE UPDATE ON public.taxonomy_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validate_tier_points_rules BEFORE INSERT OR UPDATE ON public.tier_points_rules FOR EACH ROW EXECUTE FUNCTION validate_tier_points_rules_tier();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- JOBS pg_cron
-- =====================================================================

-- jobid 1 (check-expiring-favorites-hourly, active=t)
SELECT cron.schedule('check-expiring-favorites-hourly', '0 * * * *', '
  SELECT net.http_post(
    url:=''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/check-expiring-favorites'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body:=''{}''::jsonb
  ) AS request_id;
  ');

-- jobid 2 (expire-pending-pins-cron, active=t)
SELECT cron.schedule('expire-pending-pins-cron', '*/15 * * * *', '
  SELECT net.http_post(
    url:=''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/expire-pending-pins'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body:=''{}''::jsonb
  ) AS request_id;
  ');

-- jobid 3 (mirror-sync-auto, active=t)
SELECT cron.schedule('mirror-sync-auto', '*/10 * * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/mirror-sync'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := ''{"brand_id": "auto"}''::jsonb
  ) AS request_id;
  ');

-- jobid 6 (check-onboarding-alerts-6h, active=t)
SELECT cron.schedule('check-onboarding-alerts-6h', '0 */6 * * *', '
  SELECT net.http_post(
    url:=''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/check-onboarding-alerts'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body:=''{}''::jsonb
  ) AS request_id;
  ');

-- jobid 7 (check-onboarding-alerts, active=t)
SELECT cron.schedule('check-onboarding-alerts', '0 */6 * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/check-onboarding-alerts'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := ''{}''::jsonb
  ) AS request_id;
  ');

-- jobid 9 (driver-notifications-cron, active=t)
SELECT cron.schedule('driver-notifications-cron', '*/5 * * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/driver-notifications-cron'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := ''{}''::jsonb
  );
  ');

-- jobid 10 (finalize-duels-every-5-min, active=t)
SELECT cron.schedule('finalize-duels-every-5-min', '*/5 * * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/finalize-duels-cron'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := concat(''{"time": "'', now(), ''"}'')::jsonb
  ) AS request_id;
  ');

-- jobid 11 (mirror-sync-00h, active=t)
SELECT cron.schedule('mirror-sync-00h', '0 0 * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/mirror-sync'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := ''{"brand_id":"auto"}''::jsonb
  ) AS request_id;
  ');

-- jobid 12 (mirror-sync-12h, active=t)
SELECT cron.schedule('mirror-sync-12h', '0 12 * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/mirror-sync'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := ''{"brand_id":"auto"}''::jsonb
  ) AS request_id;
  ');

-- jobid 13 (mirror-sync-18h, active=t)
SELECT cron.schedule('mirror-sync-18h', '0 18 * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/mirror-sync'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := ''{"brand_id":"auto"}''::jsonb
  ) AS request_id;
  ');

-- jobid 14 (reset-duelo-ciclo-daily, active=t)
SELECT cron.schedule('reset-duelo-ciclo-daily', '5 0 * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/reset-duelo-ciclo'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := jsonb_build_object(''triggered_at'', now())
  ) AS request_id;
  ');

-- jobid 15 (duelo-cron-reconcile-daily, active=t)
SELECT cron.schedule('duelo-cron-reconcile-daily', '0 4 * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/duelo-cron-reconcile'',
    headers := ''{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := jsonb_build_object(''source'',''pg_cron'',''at'', now())
  );
  ');

-- jobid 16 (duelo-cron-advance-hourly, active=t)
SELECT cron.schedule('duelo-cron-advance-hourly', '0 * * * *', '
  SELECT net.http_post(
    url := ''https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/duelo-cron-advance'',
    headers := ''{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGhhYndnbmtxanhjcXdwY2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDQ0MzcsImV4cCI6MjA4NzgyMDQzN30.ZirJ3cZXvJx_3EJIMDy0K8qpzfwwBWQpwB_nVjElwUw"}''::jsonb,
    body := jsonb_build_object(''source'',''pg_cron'',''at'', now())
  );
  ');

-- jobid 17 (cleanup-stuck-driver-jobs, active=t)
SELECT cron.schedule('cleanup-stuck-driver-jobs', '*/5 * * * *', 'SELECT public.cleanup_stuck_driver_import_jobs(30)');


-- =====================================================================
-- BUCKETS DE STORAGE
-- =====================================================================

-- bucket avatars | public=t | file_size_limit=5242880 | allowed_mime_types={image/jpeg,image/jpg,image/png,image/webp}
-- bucket brand-assets | public=t | file_size_limit=null | allowed_mime_types=null
-- bucket driver-avatars | public=t | file_size_limit=null | allowed_mime_types=null
-- bucket exportacoes-motoristas | public=f | file_size_limit=null | allowed_mime_types=null
-- bucket import-files | public=f | file_size_limit=null | allowed_mime_types=null
-- bucket importacoes-motoristas | public=f | file_size_limit=null | allowed_mime_types=null
