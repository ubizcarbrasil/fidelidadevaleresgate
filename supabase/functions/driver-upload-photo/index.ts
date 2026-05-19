import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const form = await req.formData();
    const driverId = String(form.get("driver_id") ?? "");
    const brandId = String(form.get("brand_id") ?? ""); // OBRIGATÓRIO: vincula upload à brand
    const file = form.get("file");

    if (!driverId || !brandId || !(file instanceof File)) {
      return json(400, { error: "invalid_payload", message: "driver_id, brand_id e file são obrigatórios" });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return json(400, { error: "invalid_file", message: "Formato inválido. Use JPG, PNG ou WEBP." });
    }
    if (file.size > MAX_BYTES) {
      return json(400, { error: "invalid_file", message: "Arquivo muito grande (máx 5MB)." });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validar motorista E que pertence à brand_id passada (defense in depth
    // pra impedir cross-tenant upload — atacante de Brand A não consegue
    // fazer upload pra motorista de Brand B passando só o driver_id).
    const { data: customer, error: cErr } = await supabase
      .from("customers")
      .select("id, name, brand_id")
      .eq("id", driverId)
      .eq("brand_id", brandId)
      .maybeSingle();

    if (cErr) return json(500, { error: "lookup_failed", message: cErr.message });
    if (!customer) return json(404, { error: "driver_not_found", message: "Motorista não encontrado nesta marca." });
    if (!String(customer.name ?? "").includes("[MOTORISTA]")) {
      return json(403, { error: "not_a_driver" });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `motoristas/${customer.id}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, new Uint8Array(arrayBuffer), {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (upErr) {
      const msg = upErr.message || "";
      if (/bucket.*not.*found/i.test(msg)) {
        return json(500, { error: "bucket_missing", message: msg });
      }
      return json(500, { error: "upload_failed", message: msg });
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const photoUrl = pub.publicUrl;

    const { data: updated, error: updErr } = await supabase
      .from("customers")
      .update({ photo_url: photoUrl })
      .eq("id", customer.id)
      .select("id");

    if (updErr || !updated || updated.length === 0) {
      return json(500, {
        error: "update_failed",
        message: updErr?.message ?? "no rows updated",
      });
    }

    return json(200, { photo_url: photoUrl });
  } catch (err) {
    return json(500, {
      error: "unexpected",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});