import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRICES: Record<string, number> = {
  starter: 9700, // R$97 in centavos
  profissional: 19700, // R$197 in centavos
};

const PRICE_NAMES: Record<string, string> = {
  starter: "Starter — R$97/mês",
  profissional: "Profissional — R$197/mês",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { plan, brand_id } = await req.json();
    if (!plan || !brand_id) throw new Error("Missing plan or brand_id");
    if (!PRICES[plan]) throw new Error("Invalid plan");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: brand } = await adminClient
      .from("brands")
      .select("stripe_customer_id, name")
      .eq("id", brand_id)
      .single();

    let customerId = brand?.stripe_customer_id;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { brand_id, brand_name: brand?.name || "" },
        });
        customerId = customer.id;
      }
      // Save stripe_customer_id
      await adminClient
        .from("brands")
        .update({ stripe_customer_id: customerId })
        .eq("id", brand_id);
    }

    // Create Checkout Session with inline price
    const origin = req.headers.get("origin") || "https://fidelidadevaleresgate.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: PRICE_NAMES[plan] },
            unit_amount: PRICES[plan],
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { brand_id, plan },
      subscription_data: { metadata: { brand_id, plan } },
      success_url: `${origin}/subscription?success=true`,
      cancel_url: `${origin}/subscription?canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    createEdgeLogger("create-checkout").error("create-checkout error", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
