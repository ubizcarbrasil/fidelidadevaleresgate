import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) throw new Error("Missing stripe-signature header");

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const log = createEdgeLogger("stripe-webhook");
    log.info("Stripe event received", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const brandId = session.metadata?.brand_id;
      const planKey = session.metadata?.plan_key || "starter";
      const customerId = session.customer as string;

      if (brandId) {
        // VALIDAÇÃO DE SEGURANÇA: garante que o brand_id da metadata
        // corresponde ao stripe_customer_id da session. Sem isso, atacante
        // que cria uma session de checkout via Stripe API (com sua conta
        // própria) e passa metadata.brand_id = competitor_brand consegue
        // ativar a assinatura de OUTRO brand. Como o customer_id do Stripe
        // foi atrelado ao brand_id no create-checkout (gravado em
        // brands.stripe_customer_id), basta verificar essa correspondência.
        const { data: brandRow } = await adminClient
          .from("brands")
          .select("id, stripe_customer_id")
          .eq("id", brandId)
          .maybeSingle();

        if (!brandRow) {
          log.error("checkout.session.completed: brand_id da metadata não existe", { brandId });
          return new Response(JSON.stringify({ received: true, ignored: "brand_not_found" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Se brand já tem stripe_customer_id, valida match. Se não tem
        // (primeira assinatura), aceita E grava o customer_id (caminho
        // legítimo: create-checkout cria customer mas em race condition
        // pode ter falhado o UPDATE).
        if (brandRow.stripe_customer_id && brandRow.stripe_customer_id !== customerId) {
          log.error("checkout.session.completed: stripe_customer_id mismatch", {
            brandId,
            expected: brandRow.stripe_customer_id,
            received: customerId,
          });
          return new Response(JSON.stringify({ received: true, ignored: "customer_mismatch" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await adminClient
          .from("brands")
          .update({
            subscription_status: "ACTIVE",
            stripe_customer_id: customerId,
            subscription_plan: planKey,
          })
          .eq("id", brandId);

        if (error) {
          log.error("Error updating brand", { brandId, error });
        } else {
          log.info("Brand activated via Stripe checkout", { brandId, planKey });

          // Re-apply modules from the plan template
          const { data: planTemplates } = await adminClient
            .from("plan_module_templates")
            .select("module_definition_id, is_enabled")
            .eq("plan_key", planKey);

          if (planTemplates && planTemplates.length > 0) {
            const { data: coreMods } = await adminClient
              .from("module_definitions").select("id").eq("is_active", true).eq("is_core", true);
            const coreIds = new Set((coreMods || []).map((m: any) => m.id));

            // Delete existing brand_modules and re-insert from template
            await adminClient.from("brand_modules").delete().eq("brand_id", brandId);
            await adminClient.from("brand_modules").insert(
              planTemplates.map((t: any, i: number) => ({
                brand_id: brandId,
                module_definition_id: t.module_definition_id,
                is_enabled: coreIds.has(t.module_definition_id) ? true : t.is_enabled,
                order_index: i,
              })),
            );
            log.info("Brand modules re-applied from plan template", { brandId, planKey, count: planTemplates.length });
          }
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const brandId = subscription.metadata?.brand_id;
      const stripeCustomer = subscription.customer as string;

      if (brandId) {
        // Mesma validação do checkout: brand_id da metadata precisa
        // corresponder ao stripe_customer_id armazenado no brand.
        // Sem isso, atacante poderia cancelar assinatura alheia
        // disparando webhook com metadata falsa.
        const { data: brandRow } = await adminClient
          .from("brands")
          .select("id, stripe_customer_id")
          .eq("id", brandId)
          .maybeSingle();

        if (!brandRow) {
          log.error("subscription.deleted: brand não existe", { brandId });
        } else if (brandRow.stripe_customer_id && brandRow.stripe_customer_id !== stripeCustomer) {
          log.error("subscription.deleted: stripe_customer_id mismatch — ignorando", {
            brandId,
            expected: brandRow.stripe_customer_id,
            received: stripeCustomer,
          });
        } else {
          const { error } = await adminClient
            .from("brands")
            .update({ subscription_status: "EXPIRED" })
            .eq("id", brandId);
          if (error) log.error("Error expiring brand", { brandId, error });
          else log.info("Brand subscription expired", { brandId });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errLog = createEdgeLogger("stripe-webhook");
    const message = error instanceof Error ? error.message : String(error);
    errLog.error("stripe-webhook error", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
