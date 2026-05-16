
-- =====================================================
-- ÍNDICES DE PERFORMANCE — TABELAS PRINCIPAIS
-- =====================================================

-- REDEMPTIONS
CREATE INDEX IF NOT EXISTS idx_redemptions_customer_id ON public.redemptions (customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_offer_id ON public.redemptions (offer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_branch_id ON public.redemptions (branch_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redemptions (status);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON public.redemptions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_customer_status ON public.redemptions (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_branch_status ON public.redemptions (branch_id, status);

-- OFFERS
CREATE INDEX IF NOT EXISTS idx_offers_store_id ON public.offers (store_id);
CREATE INDEX IF NOT EXISTS idx_offers_branch_id ON public.offers (branch_id);
CREATE INDEX IF NOT EXISTS idx_offers_brand_id ON public.offers (brand_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers (status);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers (is_active);
CREATE INDEX IF NOT EXISTS idx_offers_branch_active_status ON public.offers (branch_id, is_active, status);

-- STORES
CREATE INDEX IF NOT EXISTS idx_stores_branch_id ON public.stores (branch_id);
CREATE INDEX IF NOT EXISTS idx_stores_brand_id ON public.stores (brand_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON public.stores (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON public.stores (approval_status);
CREATE INDEX IF NOT EXISTS idx_stores_branch_active_approval ON public.stores (branch_id, is_active, approval_status);

-- CUSTOMERS
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON public.customers (branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_brand_id ON public.customers (brand_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON public.customers (cpf);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_brand_branch_active ON public.customers (brand_id, branch_id, is_active);

-- POINTS_LEDGER
CREATE INDEX IF NOT EXISTS idx_points_ledger_customer_id ON public.points_ledger (customer_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_branch_id ON public.points_ledger (branch_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_brand_id ON public.points_ledger (brand_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_entry_type ON public.points_ledger (entry_type);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON public.points_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_ledger_customer_created ON public.points_ledger (customer_id, created_at DESC);

-- MACHINE_RIDES
CREATE INDEX IF NOT EXISTS idx_machine_rides_branch_id ON public.machine_rides (branch_id);
CREATE INDEX IF NOT EXISTS idx_machine_rides_brand_id ON public.machine_rides (brand_id);
CREATE INDEX IF NOT EXISTS idx_machine_rides_driver_customer_id ON public.machine_rides (driver_customer_id);
CREATE INDEX IF NOT EXISTS idx_machine_rides_ride_status ON public.machine_rides (ride_status);
CREATE INDEX IF NOT EXISTS idx_machine_rides_finalized_at ON public.machine_rides (finalized_at DESC);
CREATE INDEX IF NOT EXISTS idx_machine_rides_branch_status ON public.machine_rides (branch_id, ride_status);

-- AUDIT_LOGS
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON public.audit_logs (entity_type, entity_id);

-- EARNING_EVENTS
CREATE INDEX IF NOT EXISTS idx_earning_events_customer_id ON public.earning_events (customer_id);
CREATE INDEX IF NOT EXISTS idx_earning_events_branch_id ON public.earning_events (branch_id);
CREATE INDEX IF NOT EXISTS idx_earning_events_brand_id ON public.earning_events (brand_id);
CREATE INDEX IF NOT EXISTS idx_earning_events_created_at ON public.earning_events (created_at DESC);

-- PRODUCT_REDEMPTION_ORDERS
CREATE INDEX IF NOT EXISTS idx_product_redemption_orders_customer_id ON public.product_redemption_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_product_redemption_orders_branch_id ON public.product_redemption_orders (branch_id);
CREATE INDEX IF NOT EXISTS idx_product_redemption_orders_status ON public.product_redemption_orders (status);
CREATE INDEX IF NOT EXISTS idx_product_redemption_orders_branch_status ON public.product_redemption_orders (branch_id, status);

-- =====================================================
-- ANALYZE — Atualiza estatísticas do Postgres
-- =====================================================
ANALYZE public.redemptions;
ANALYZE public.offers;
ANALYZE public.stores;
ANALYZE public.customers;
ANALYZE public.points_ledger;
ANALYZE public.machine_rides;
ANALYZE public.audit_logs;
ANALYZE public.earning_events;
ANALYZE public.product_redemption_orders;
