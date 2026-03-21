import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIMENSION_MAP: Record<string, { w: number; h: number }> = {
  banner: { w: 1200, h: 514 },
  logo: { w: 512, h: 512 },
  favicon: { w: 256, h: 256 },
  product: { w: 800, h: 800 },
  offer: { w: 800, h: 800 },
  background: { w: 1920, h: 1080 },
  gallery: { w: 1080, h: 1080 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "LOVABLE_API_KEY not configured", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { image_url, mode, context } = await req.json();

    if (!image_url || !mode) {
      return new Response(
        JSON.stringify({ ok: false, error: "image_url and mode are required", code: "VALIDATION" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dims = DIMENSION_MAP[context || "product"] || DIMENSION_MAP.product;

    let prompt: string;
    if (mode === "redesign") {
      prompt = `Use this image as a reference. Create a completely new, professional, high-quality version of this concept. The result should be visually stunning, modern, and suitable for commercial use. Output dimensions should be approximately ${dims.w}x${dims.h} pixels. Keep the same subject/theme but make it look premium and polished.`;
    } else if (mode === "enhance") {
      prompt = `Enhance this image: improve sharpness, color balance, lighting, and overall visual quality. Make it look more professional and vibrant while keeping the same content. Fix any artifacts or low-quality areas. Output should be approximately ${dims.w}x${dims.h} pixels.`;
    } else if (mode === "resize") {
      prompt = `Resize and adapt this image to fit ${dims.w}x${dims.h} pixels perfectly. If the aspect ratio doesn't match, intelligently extend or crop the composition to fill the space naturally. Maintain the quality and visual coherence.`;
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "mode must be redesign, resize, or enhance", code: "VALIDATION" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${mode} for context=${context}, dims=${dims.w}x${dims.h}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const statusCode = aiResponse.status;
      const body = await aiResponse.text();
      console.error(`AI gateway error: ${statusCode} ${body}`);

      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ ok: false, error: "Limite de requisições atingido. Tente novamente em alguns segundos.", code: "RATE_LIMIT" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ ok: false, error: "Créditos de IA esgotados. Adicione créditos na sua conta.", code: "PAYMENT_REQUIRED" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: "Erro ao processar imagem com IA", code: "AI_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ ok: false, error: "IA não retornou imagem. Tente novamente.", code: "NO_IMAGE" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const filePath = `ai-enhanced/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ ok: false, error: "Erro ao salvar imagem gerada", code: "UPLOAD_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicData } = supabase.storage.from("brand-assets").getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ ok: true, data: { url: publicData.publicUrl } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enhance-image error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Erro interno", code: "INTERNAL" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
