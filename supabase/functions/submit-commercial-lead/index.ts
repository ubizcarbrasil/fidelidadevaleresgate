import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LeadSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  product_slug: z.string().max(120).nullable().optional(),
  product_name: z.string().max(200).nullable().optional(),
  full_name: z.string().trim().min(3).max(120),
  work_email: z.string().trim().toLowerCase().email().max(180),
  phone: z.string().trim().min(10).max(20),
  company_name: z.string().trim().min(2).max(120),
  company_role: z.string().trim().max(80).nullable().optional(),
  company_size: z.string().max(20).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  current_solution: z.string().max(40).nullable().optional(),
  interest_message: z.string().trim().max(800).nullable().optional(),
  preferred_contact: z.enum(["whatsapp", "email", "ligacao"]).default("whatsapp"),
  preferred_window: z.enum(["manha", "tarde", "noite"]).nullable().optional(),
  source: z.string().max(60).nullable().optional(),
  utm_source: z.string().max(120).nullable().optional(),
  utm_medium: z.string().max(120).nullable().optional(),
  utm_campaign: z.string().max(120).nullable().optional(),
  utm_term: z.string().max(120).nullable().optional(),
  utm_content: z.string().max(120).nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.flatten());
      return new Response(
        JSON.stringify({
          success: false,
          error: "Dados inválidos. Confira os campos e tente novamente.",
          details: parsed.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 400) || null;

    const { data: lead, error: insertError } = await supabase
      .from("commercial_leads")
      .insert({
        ...parsed.data,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Notificar admins root via admin_notifications (best-effort)
    try {
      const { data: brands } = await supabase
        .from("brands")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      const brandId = brands?.[0]?.id;
      if (brandId) {
        await supabase.from("admin_notifications").insert({
          brand_id: brandId,
          type: "commercial_lead",
          title: `Novo lead comercial: ${parsed.data.company_name}`,
          body: `${parsed.data.full_name} (${parsed.data.work_email}) — interesse em ${parsed.data.product_name || "produto"}.`,
          reference_id: lead.id,
        });
      }
    } catch (notifyErr) {
      console.warn("Notification failed (non-fatal):", notifyErr);
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro inesperado no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});